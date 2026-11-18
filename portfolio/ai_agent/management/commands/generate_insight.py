"""Generate a StudioInsight row from the live portfolio analytics.

The prose is written by Gemini; every number stored alongside it comes from the
portfolio database, so the model can never invent a figure.

Usage:
    python manage.py generate_insight
    python manage.py generate_insight --no-traffic
    python manage.py generate_insight --keep-active
"""

from __future__ import annotations

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from ai_agent.utils import generate_studio_insight
from analytics.providers import AnalyticsUnavailable, website_analytics
from analytics.views import build_overview
from studio.models import StudioInsight


class Command(BaseCommand):
    help = (
        "Generate a StudioInsight from the portfolio analytics aggregates and "
        "activate it (deactivating any previously active row)."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--no-traffic",
            action="store_true",
            help="Skip the GA4 traffic lookup even if it is configured.",
        )
        parser.add_argument(
            "--keep-active",
            action="store_true",
            help="Leave existing active insights active instead of replacing them.",
        )

    def handle(self, *args, **options):
        overview = build_overview()

        traffic = None
        traffic_source = "skipped"
        if not options["no_traffic"]:
            try:
                traffic = website_analytics()
                traffic_source = "connected"
            except AnalyticsUnavailable:
                traffic_source = "unavailable"

        generated = generate_studio_insight(overview=overview, traffic=traffic)

        summary = (generated.get("summary") or "").strip()
        if not summary:
            raise CommandError("Gemini returned no summary; nothing was saved.")

        title = (generated.get("title") or "Portfolio insight").strip()[:200]

        analysis_data = {
            "totals": overview.get("totals"),
            "category_distribution": overview.get("category_distribution"),
            "projects_by_month": overview.get("projects_by_month"),
            "media_breakdown": overview.get("media_breakdown"),
            "highlights": generated.get("highlights") or [],
            "observations": generated.get("observations") or [],
            "suggestions": generated.get("suggestions") or [],
            "traffic": traffic,
            "traffic_source": traffic_source,
        }

        with transaction.atomic():
            if not options["keep_active"]:
                StudioInsight.objects.filter(is_active=True).update(is_active=False)
            insight = StudioInsight.objects.create(
                title=title,
                summary=summary,
                analysis_data=analysis_data,
                is_active=True,
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Saved insight #{insight.pk} '{insight.title}' (traffic: {traffic_source})."
            )
        )
