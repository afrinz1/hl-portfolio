import getpass

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.management.base import BaseCommand, CommandError

from authentication.permissions import EDITOR_GROUP_NAME


class Command(BaseCommand):
    help = "Creates or updates an editor user in the Editors group."

    def add_arguments(self, parser):
        parser.add_argument(
            "--username",
            default="editor",
            help="Username for the editor (default: editor)",
        )
        parser.add_argument(
            "--password",
            default=None,
            help="Password for the editor. If omitted, you will be prompted interactively.",
        )
        parser.add_argument(
            "--email",
            default="editor@hecticlab.com",
            help="Email for the editor (default: editor@hecticlab.com)",
        )

    def handle(self, *args, **options):
        username = options["username"]
        password = options["password"]
        email = options["email"]

        if not password:
            try:
                password = getpass.getpass(f"Password for '{username}': ")
                confirm = getpass.getpass("Confirm password: ")
                if password != confirm:
                    raise CommandError("Passwords do not match.")
                if not password:
                    raise CommandError("Password must not be empty.")
            except (EOFError, KeyboardInterrupt):
                raise CommandError("Password entry cancelled.")

        group, _ = Group.objects.get_or_create(name=EDITOR_GROUP_NAME)
        user_model = get_user_model()

        user, created = user_model.objects.get_or_create(
            username=username,
            defaults={"email": email, "is_staff": True},
        )
        user.set_password(password)
        user.is_staff = True
        user.email = email
        user.save()
        user.groups.add(group)

        action = "Created" if created else "Updated"
        self.stdout.write(
            self.style.SUCCESS(
                f"{action} editor '{username}' successfully."
            )
        )
