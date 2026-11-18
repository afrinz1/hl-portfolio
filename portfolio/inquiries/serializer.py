from rest_framework import serializers
from .models import Inquiry
from studio.models import Service


class InquirySerializer(serializers.ModelSerializer):

    service = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.filter(is_active=True),
        required=False,
        allow_null=True
    )

    class Meta:
        model = Inquiry
        fields = [
            "name",
            "email",
            "company",
            "service",
            "budget_range",
            "message"
        ]


class EditorInquirySerializer(serializers.ModelSerializer):
    service_title = serializers.CharField(source="service.title", read_only=True)

    class Meta:
        model = Inquiry
        fields = [
            "id",
            "uuid",
            "name",
            "email",
            "company",
            "service",
            "service_title",
            "budget_range",
            "message",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "uuid", "created_at", "updated_at"]
