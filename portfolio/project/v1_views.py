from rest_framework import viewsets

from authentication.permissions import (
    EditorMediaPermissions,
    IsEditor,
    user_is_editor,
)
from portfolio.pagination import PortfolioPagination
from .models import Category, Project, ProjectMedia
from .serializer import CategorySerializer, ProjectMediaWriteSerializer, ProjectWriteSerializer
from .views import (
    CategoryListView,
    ProjectListView,
    ProjectMediaListView,
)


class V1CategoryListView(CategoryListView):
    pagination_class = PortfolioPagination


class EditorCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [IsEditor]
    pagination_class = PortfolioPagination
    queryset = Category.objects.all().order_by("display_order", "name")


class V1ProjectListView(ProjectListView):
    pagination_class = PortfolioPagination


class V1ProjectMediaListView(ProjectMediaListView):
    pagination_class = PortfolioPagination


class V1ProjectMediaViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectMediaWriteSerializer
    permission_classes = [EditorMediaPermissions]
    pagination_class = PortfolioPagination

    def get_queryset(self):
        queryset = ProjectMedia.objects.select_related("project")
        user = self.request.user

        if not user.is_superuser and not user_is_editor(user):
            queryset = queryset.filter(
                project__status=True,
                project__active_status=True,
                project__category__is_active=True,
            )

        project = self.request.query_params.get("project")
        if project:
            queryset = queryset.filter(project_id=project)
        return queryset


class EditorProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectWriteSerializer
    permission_classes = [IsEditor]
    pagination_class = PortfolioPagination
    lookup_field = "slug"
    queryset = (
        Project.objects.select_related("category").order_by(
            "display_order",
            "-created_at",
        )
    )

    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        lookup_value = self.kwargs.get(lookup_url_kwarg, "")
        if lookup_value.isdigit():
            obj = queryset.filter(id=lookup_value).first()
            if obj:
                self.check_object_permissions(self.request, obj)
                return obj
        return super().get_object()
