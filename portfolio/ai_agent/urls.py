from django.urls import path

from .views import PortfolioChatView, ProjectSearchView

urlpatterns = [
    path(
        "chat/",
        PortfolioChatView.as_view(),
        name="portfolio-chat",
    ),
    path(
        "search/",
        ProjectSearchView.as_view(),
        name="portfolio-search",
    ),
]
