from django.urls import path
from .views import (
    StudioSettingsView,
    ServiceListView,
    StudioInsightListView
)

urlpatterns = [
    path("studio/", StudioSettingsView.as_view(), name="studio-settings"),
    path("services/", ServiceListView.as_view(), name="service-list"),
    path("insights/", StudioInsightListView.as_view(), name="studio-insights"),
]