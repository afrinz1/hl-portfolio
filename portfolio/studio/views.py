from rest_framework.generics import ListAPIView
from .models import StudioSettings, Service, StudioInsight

from .serializer import (
    StudioSettingsSerializer,
    ServiceSerializer,
    StudioInsightSerializer
)


# Retrieve studio information
class StudioSettingsView(ListAPIView):
    queryset = StudioSettings.objects.all()
    serializer_class = StudioSettingsSerializer


# List all active services
class ServiceListView(ListAPIView):
    queryset = Service.objects.filter(is_active=True)
    serializer_class = ServiceSerializer


# List all active AI-generated insights
class StudioInsightListView(ListAPIView):
    queryset = StudioInsight.objects.filter(is_active=True)
    serializer_class = StudioInsightSerializer