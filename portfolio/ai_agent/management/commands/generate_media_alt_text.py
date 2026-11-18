"""Fill alt text and captions for ProjectMedia items using Gemini.

For images the media itself is sent to the model; for videos the poster frame
is used when one exists. Items that already have both ``alt_text`` and
``caption`` are skipped unless ``--force`` is set.

Usage:
    python manage.py generate_media_alt_text
    python manage.py generate_media_alt_text --force --limit 20
"""

from __future__ import annotations

import time

from django.core.management.base import BaseCommand

from ai_agent.utils import fetch_media_image, generate_media_accessibility_text
from project.models import ProjectMedia


class Command(BaseCommand):
    help = (
        "Generate alt_text and caption for ProjectMedia rows using Gemini."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Regenerate even for items that already have alt text and a caption.",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=None,
            help="Only process the first N matching items.",
        )
        parser.add_argument(
            "--sleep",
            type=float,
            default=0.0,
            help="Seconds to wait between Gemini calls (default: 0).",
        )

    def handle(self, *args, **options):
        queryset = (
            ProjectMedia.objects.select_related("project", "project__category")
            .order_by("project_id", "display_order", "id")
        )
        if options["limit"]:
            queryset = queryset[: options["limit"]]

        force = options["force"]
        sleep_seconds = options["sleep"] or 0.0

        processed = skipped = failed = 0

        for media in queryset:
            if not force and media.alt_text and media.caption:
                skipped += 1
                continue

            project = media.project
            frame_url = (
                media.poster_url
                if media.media_type == "video"
                else media.media_url
            )
            image = fetch_media_image(frame_url)

            try:
                result = generate_media_accessibility_text(
                    project_title=project.title,
                    category=project.category.name if project.category else "",
                    client=project.client,
                    media_type=media.media_type,
                    image=image,
                )
            except Exception as exc:  # noqa: BLE001 - report and continue
                failed += 1
                self.stderr.write(f"Media #{media.pk} failed: {exc}")
                continue

            alt_text = (result.get("alt_text") or "").strip()
            caption = (result.get("caption") or "").strip()
            if not alt_text and not caption:
                failed += 1
                self.stderr.write(f"Media #{media.pk}: nothing returned.")
                continue

            media.alt_text = alt_text[:255]
            media.caption = caption[:255]
            media.save(update_fields=["alt_text", "caption"])
            processed += 1

            if sleep_seconds:
                time.sleep(sleep_seconds)

        self.stdout.write(
            self.style.SUCCESS(
                f"Done. Updated {processed}, skipped {skipped}, failed {failed}."
            )
        )
