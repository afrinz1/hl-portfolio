
from rest_framework import serializers

from .models import ChatMessage


class ChatRequestSerializer(serializers.Serializer):

    message = serializers.CharField(
        max_length=2000,
        trim_whitespace=True
    )

    session_id = serializers.UUIDField(
        required=False,
        allow_null=True
    )

    visitor_token = serializers.UUIDField(
        required=False,
        allow_null=True
    )

    def validate(self, attrs):

        session_id = attrs.get("session_id")
        visitor_token = attrs.get("visitor_token")

        if bool(session_id) != bool(visitor_token):
            raise serializers.ValidationError(
                "Both session_id and visitor_token must be provided together."
            )

        return attrs


class ChatMessageSerializer(serializers.ModelSerializer):

    class Meta:
        model = ChatMessage
        fields = [
            "id",
            "role",
            "content",
            "sources",
            "created_at",
        ]
        read_only_fields = fields


class ProjectSearchRequestSerializer(serializers.Serializer):
    """Validates the free-text query for natural-language project search."""

    query = serializers.CharField(
        max_length=300,
        trim_whitespace=True
    )
