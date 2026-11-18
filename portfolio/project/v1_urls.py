from django.urls import path
from rest_framework.routers import DefaultRouter
from .v1_views import (
    EditorCategoryViewSet,
    EditorProjectViewSet,
    V1CategoryListView,
    V1ProjectListView,
    V1ProjectMediaListView,
    V1ProjectMediaViewSet,
)
from .views import ProjectDetailView

router = DefaultRouter()
router.register("media", V1ProjectMediaViewSet, basename="v1-media")
router.register(
    "editor/projects",
    EditorProjectViewSet,
    basename="v1-editor-project",
)
router.register(
    "editor/categories",
    EditorCategoryViewSet,
    basename="v1-editor-category",
)

urlpatterns = [
    path("categories/", V1CategoryListView.as_view(), name="v1-category-list"),
    path("projects/", V1ProjectListView.as_view(), name="v1-project-list"),
    path(
        "projects/<slug:slug>/media/",
        V1ProjectMediaListView.as_view(),
        name="v1-project-media-list",
    ),
    path(
        "projects/<slug:slug>/",
        ProjectDetailView.as_view(),
        name="v1-project-detail",
    ),
] + router.urls
