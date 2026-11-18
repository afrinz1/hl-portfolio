from django.contrib import admin

from authentication.permissions import EDITOR_GROUP_NAME
from . import models

admin.site.register(models.Category)
admin.site.register(models.Project)


@admin.register(models.ProjectMedia)
class ProjectMediaAdmin(admin.ModelAdmin):
    list_display = ("project", "media_type", "display_order")
    list_filter = ("media_type",)

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        if request.user.is_superuser or request.user.groups.filter(
            name=EDITOR_GROUP_NAME
        ).exists():
            return queryset
        return queryset.none()


