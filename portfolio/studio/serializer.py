from rest_framework import serializers
from .models import StudioSettings, Service, StudioInsight


class StudioSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudioSettings
        fields = "__all__"


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = "__all__"


class StudioInsightSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudioInsight
        fields = "__all__"