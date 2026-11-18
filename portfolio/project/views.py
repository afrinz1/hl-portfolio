from rest_framework import generics
from .models import Category, Project, ProjectMedia
from .serializer import (
    CategorySerializer,
    ProjectSerializer,
    ProjectMediaSerializer
)


# List all active categories
class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer


# List all published and active projects
class ProjectListView(generics.ListAPIView):
    queryset = (
        Project.objects
        .filter(
            status=True,
            active_status=True,
            category__is_active=True
        )
        .select_related("category")
        .prefetch_related("media")
    )

    serializer_class = ProjectSerializer


# Retrieve a single project using its slug
class ProjectDetailView(generics.RetrieveAPIView):
    queryset = (
        Project.objects
        .filter(
            status=True,
            active_status=True,
            category__is_active=True
        )
        .select_related("category")
        .prefetch_related("media")
    )

    serializer_class = ProjectSerializer
    lookup_field = "slug"


# Retrieve media belonging to a project
class ProjectMediaListView(generics.ListAPIView):
    serializer_class = ProjectMediaSerializer

    def get_queryset(self):
        return ProjectMedia.objects.filter(
            project__slug=self.kwargs["slug"],
            project__status=True,
            project__active_status=True,
            project__category__is_active=True
        ).select_related("project")