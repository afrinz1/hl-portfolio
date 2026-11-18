from django.urls import path

from .views import PortfolioOverviewView

urlpatterns = [
    path(
        "overview/",
        PortfolioOverviewView.as_view(),
        name="analytics-overview",
    ),
]
