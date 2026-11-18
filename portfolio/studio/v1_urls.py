from django.urls import path
from .v1_views import (
    V1StudioSettingsView,
    V1ServiceListView,
    V1StudioInsightListView,
)

urlpatterns = [
    path("studio/", V1StudioSettingsView.as_view(), name="v1-studio-settings"),
    path("services/", V1ServiceListView.as_view(), name="v1-service-list"),
    path("insights/", V1StudioInsightListView.as_view(), name="v1-studio-insights"),
]
