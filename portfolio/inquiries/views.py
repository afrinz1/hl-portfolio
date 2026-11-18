import logging

from rest_framework import generics, viewsets
from rest_framework.permissions import AllowAny
from authentication.permissions import IsEditor
from portfolio.pagination import PortfolioPagination
from .models import Inquiry
from .serializer import EditorInquirySerializer, InquirySerializer

from .utils import send_admin_notification, send_client_acknowledgement

logger = logging.getLogger(__name__)


# Public API - Submit a new inquiry
class InquiryCreateView(generics.CreateAPIView):

    queryset = Inquiry.objects.all()
    serializer_class = InquirySerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        inquiry = serializer.save()

        # Email is best-effort. The inquiry is already persisted, so a mail
        # failure (SMTP unconfigured/unreachable on the host) must not turn a
        # successful submission into a 500. Each send is isolated so one failing
        # recipient cannot block the other.
        for notify in (send_client_acknowledgement, send_admin_notification):
            try:
                notify(inquiry)
            except Exception:
                logger.exception(
                    "Inquiry notification failed: %s (inquiry=%s)",
                    notify.__name__,
                    inquiry.pk,
                )


# Editor API - View and manage inquiries
class EditorInquiryViewSet(viewsets.ModelViewSet):
    queryset = Inquiry.objects.select_related("service").order_by("-created_at")
    serializer_class = EditorInquirySerializer
    permission_classes = [IsEditor]
    pagination_class = PortfolioPagination
