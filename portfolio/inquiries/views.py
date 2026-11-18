from rest_framework import generics, viewsets
from rest_framework.permissions import AllowAny
from authentication.permissions import IsEditor
from portfolio.pagination import PortfolioPagination
from .models import Inquiry
from .serializer import EditorInquirySerializer, InquirySerializer

from .utils import send_admin_notification, send_client_acknowledgement


# Public API - Submit a new inquiry
class InquiryCreateView(generics.CreateAPIView):

    queryset = Inquiry.objects.all()
    serializer_class = InquirySerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        inquiry = serializer.save()

        send_client_acknowledgement(inquiry)
        send_admin_notification(inquiry)


# Editor API - View and manage inquiries
class EditorInquiryViewSet(viewsets.ModelViewSet):
    queryset = Inquiry.objects.select_related("service").order_by("-created_at")
    serializer_class = EditorInquirySerializer
    permission_classes = [IsEditor]
    pagination_class = PortfolioPagination
