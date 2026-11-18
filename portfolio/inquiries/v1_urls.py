from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import EditorInquiryViewSet, InquiryCreateView

router = DefaultRouter()
router.register("editor/inquiries", EditorInquiryViewSet, basename="v1-editor-inquiry")

urlpatterns = [
    path("inquiries/", InquiryCreateView.as_view(), name="v1-inquiry-create"),
] + router.urls

