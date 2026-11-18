from rest_framework.permissions import (
    SAFE_METHODS,
    BasePermission,
    DjangoModelPermissionsOrAnonReadOnly,
)


EDITOR_GROUP_NAME = "Editors"


def user_is_editor(user) -> bool:
    return bool(
        user
        and user.is_authenticated
        and (user.is_superuser or user.groups.filter(name=EDITOR_GROUP_NAME).exists())
    )


class IsEditor(BasePermission):
    def has_permission(self, request, view):
        return user_is_editor(request.user)


class EditorMediaPermissions(DjangoModelPermissionsOrAnonReadOnly):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True

        user = request.user
        if not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        if not user_is_editor(user):
            return False

        return super().has_permission(request, view)

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True

        return request.user.is_superuser or user_is_editor(request.user)
