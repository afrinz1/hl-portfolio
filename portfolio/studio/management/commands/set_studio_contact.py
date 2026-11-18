from django.core.management.base import BaseCommand, CommandError

from studio.models import StudioSettings

DEFAULT_EMAIL = "hecticlabs1@gmail.com"


class Command(BaseCommand):
    help = "Sets the studio contact email that is shown on the public site."

    def add_arguments(self, parser):
        parser.add_argument(
            "email",
            nargs="?",
            default=DEFAULT_EMAIL,
            help=(
                "Address to publish as the studio contact "
                f"(default: {DEFAULT_EMAIL})"
            ),
        )

    def handle(self, *args, **options):
        email = options["email"]

        # StudioSettings is effectively a singleton: the studio app's seed
        # migration creates the row, and the read-only API serialises it.
        studio = StudioSettings.objects.first()

        if studio is None:
            raise CommandError(
                "No StudioSettings row exists, so there is nothing to update."
            )

        previous = studio.email
        studio.email = email
        studio.save()

        self.stdout.write(
            self.style.SUCCESS(
                f"Studio contact email changed from {previous or '(empty)'} to {email}."
            )
        )
