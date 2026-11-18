from django.contrib.auth.models import Group, Permission
from django.db.models.signals import post_migrate
from django.dispatch import receiver

from .permissions import EDITOR_GROUP_NAME


@receiver(post_migrate, dispatch_uid="authentication.create_editor_group")
def create_editor_group(sender, **kwargs):
    if sender.label != "authentication":
        return

    group, _ = Group.objects.get_or_create(name=EDITOR_GROUP_NAME)
    permissions = Permission.objects.filter(
        content_type__app_label="project",
        codename__in=[
            "view_category",
            "view_project",
            "add_project",
            "change_project",
            "delete_project",
            "view_projectmedia",
            "add_projectmedia",
            "change_projectmedia",
            "delete_projectmedia",
        ],
    )
    group.permissions.add(*permissions)
