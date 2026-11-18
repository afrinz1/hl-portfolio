from django.conf import settings
from django.contrib.auth import authenticate
from django.middleware.csrf import get_token, rotate_token
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .permissions import IsEditor, user_is_editor
from .serializer import LoginSerializer


def _editor_payload(user):
    return {
        "id": user.pk,
        "username": user.get_username(),
        "email": getattr(user, "email", ""),
        "is_staff": user.is_staff,
        "is_superuser": user.is_superuser,
        "is_editor": user_is_editor(user),
    }


def _cookie_name():
    return getattr(settings, "JWT_AUTH_COOKIE", "hectic_refresh_token")


def _set_refresh_cookie(response, refresh_token_str):
    response.set_cookie(
        key=_cookie_name(),
        value=refresh_token_str,
        httponly=True,
        secure=getattr(settings, "JWT_AUTH_COOKIE_SECURE", not settings.DEBUG),
        samesite=getattr(settings, "JWT_AUTH_COOKIE_SAMESITE", "Lax"),
        path=getattr(settings, "JWT_AUTH_COOKIE_PATH", "/"),
        max_age=int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()),
    )


def _clear_refresh_cookie(response):
    response.delete_cookie(
        key=_cookie_name(),
        path=getattr(settings, "JWT_AUTH_COOKIE_PATH", "/"),
    )


class CsrfTokenView(APIView):
    """
    Issue (or renew) the CSRF cookie for browser clients.

    The cookie is readable by JavaScript (``CSRF_COOKIE_HTTPONLY = False``) so
    the SPA can echo it back in the ``X-CSRFToken`` header. The token is also
    returned in the body as a fallback for clients that cannot read cookies.
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    @method_decorator(ensure_csrf_cookie)
    def get(self, request):
        return Response(
            {
                "detail": "CSRF cookie set.",
                "csrfToken": get_token(request),
            }
        )


class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    @method_decorator(ensure_csrf_cookie)
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            request,
            username=serializer.validated_data["username"],
            password=serializer.validated_data["password"],
        )
        if user is None or not user.is_active:
            return Response(
                {"detail": "Invalid username or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        if not user_is_editor(user):
            return Response(
                {"detail": "Only editors or administrators can sign in."},
                status=status.HTTP_403_FORBIDDEN,
            )

        refresh = RefreshToken.for_user(user)

        # Rotate the CSRF token after a privilege change so a token minted for
        # an anonymous visitor cannot be replayed against the editor session.
        rotate_token(request)

        response = Response({
            **_editor_payload(user),
            "access": str(refresh.access_token),
            "csrfToken": get_token(request),
        })
        _set_refresh_cookie(response, str(refresh))
        return response


class TokenRefreshView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        refresh_token = request.COOKIES.get(_cookie_name())
        if not refresh_token:
            return Response(
                {"detail": "Refresh token not provided."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        try:
            refresh = RefreshToken(refresh_token)
            access_token = str(refresh.access_token)
            response = Response({"access": access_token})
            # ROTATE_REFRESH_TOKENS=True → new refresh token issued; update the cookie
            if settings.SIMPLE_JWT.get("ROTATE_REFRESH_TOKENS", False):
                _set_refresh_cookie(response, str(refresh))
            return response
        except TokenError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_401_UNAUTHORIZED)


class LogoutView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        refresh_token = request.COOKIES.get(_cookie_name())
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except TokenError:
                pass  # Already expired / invalid — still clear the cookie
        response = Response(
            {"detail": "Successfully logged out."},
            status=status.HTTP_200_OK,
        )
        _clear_refresh_cookie(response)
        return response


class MeView(APIView):
    permission_classes = [IsEditor]

    def get(self, request):
        return Response({
            **_editor_payload(request.user),
            "csrfToken": get_token(request),
        })
