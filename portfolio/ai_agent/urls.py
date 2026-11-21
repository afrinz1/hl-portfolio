from django.urls import path

from .views import PortfolioChatStreamView, PortfolioChatView, ProjectSearchView

urlpatterns = [
    path(
        "chat/",
        PortfolioChatView.as_view(),
        name="portfolio-chat",
    ),
    path(
        "chat/stream/",
        PortfolioChatStreamView.as_view(),
        name="portfolio-chat-stream",
    ),
    path(
        "search/",
        ProjectSearchView.as_view(),
        name="portfolio-search",
    ),
]
