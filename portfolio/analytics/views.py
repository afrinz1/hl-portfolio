"""Read-only portfolio analytics.

Every figure served by this module is aggregated from the live database
(``project`` and ``studio`` tables). Website traffic and Instagram Insights are
deliberately NOT served here: neither has a collection source yet, so neither is
shown on the dashboard.
"""

from datetime import date

from django.db.models import Count, Q
from django.db.models.functions import TruncMonth
from django.utils import timezone
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from project.models import Category, Project, ProjectMedia

# How many projects to surface in the "selected work" strip.
SELECTED_WORK_LIMIT = 6

# Width of the monthly activity window (matches the demo analytics window).
MONTHLY_WINDOW = 12


def trailing_months(count=MONTHLY_WINDOW):
    """First day of each of the last ``count`` months, oldest first."""
    today = timezone.localdate()
    year, month = today.year, today.month

    months = []
    for _ in range(count):
        months.append(date(year, month, 1))
        month -= 1
        if month == 0:
            month = 12
            year -= 1

    return list(reversed(months))


def public_projects():
    """Projects visible to the public, matching the rules used by the public
    project list/detail endpoints."""
    return Project.objects.filter(
        status=True,
        active_status=True,
        category__is_active=True,
    )


class PortfolioOverviewView(APIView):
    """Aggregate portfolio statistics for the /trust dashboard."""

    permission_classes = [AllowAny]

    def get(self, request):
        return Response(build_overview())


def build_overview() -> dict:
    """Build the portfolio overview payload.

    Kept as a plain function so non-HTTP callers (the studio insight
    generator) can reuse the exact same aggregation the API serves.
    """
    projects = public_projects()

    total_projects = projects.count()
    media = ProjectMedia.objects.filter(project__in=projects)
    total_media = media.count()

    media_counts = {
        row["media_type"]: row["count"]
        for row in media.values("media_type").annotate(count=Count("id"))
    }

    category_distribution = [
        {
            "name": row["name"],
            "slug": row["slug"],
            "projects": row["project_count"],
        }
        for row in Category.objects.filter(is_active=True)
        .annotate(
            project_count=Count(
                "projects",
                filter=Q(
                    projects__status=True,
                    projects__active_status=True,
                ),
            )
        )
        .values("name", "slug", "project_count")
        .order_by("-project_count", "name")
    ]

    year_rows = (
        projects.values("year").annotate(count=Count("id")).order_by("year")
    )
    years = [row["year"] for row in year_rows if row["year"]]

    projects_by_year = [
        {"year": row["year"], "label": str(row["year"]), "projects": row["count"]}
        for row in year_rows
        if row["year"]
    ]

    # Projects have no release month, so the monthly view counts when each
    # project entered the archive (``created_at``), bucketed by month.
    month_counts = {
        row["month"].strftime("%Y-%m"): row["count"]
        for row in projects.annotate(month=TruncMonth("created_at"))
        .values("month")
        .annotate(count=Count("id"))
        if row["month"]
    }

    projects_by_month = [
        {
            "month": month.strftime("%Y-%m"),
            "label": month.strftime("%b"),
            "projects": month_counts.get(month.strftime("%Y-%m"), 0),
        }
        for month in trailing_months()
    ]

    selected_work = [
        {
            "title": row["title"],
            "slug": row["slug"],
            "year": row["year"],
            "client": row["client"],
            "cover_image": row["cover_image"],
            "category": row["category__name"],
            "media_count": row["media_count"],
        }
        for row in projects.select_related("category")
        .annotate(media_count=Count("media"))
        .order_by("display_order", "-created_at")
        .values(
            "title",
            "slug",
            "year",
            "client",
            "cover_image",
            "category__name",
            "media_count",
        )[:SELECTED_WORK_LIMIT]
    ]

    return {
        "generated_at": timezone.now().isoformat(),
        "source": "database",
        "totals": {
            "projects": total_projects,
            "categories": Category.objects.filter(is_active=True).count(),
            "media_assets": total_media,
            "years_covered": len(years),
            "year_span": (
                {"from": min(years), "to": max(years)} if years else None
            ),
            "average_media_per_project": (
                round(total_media / total_projects, 2)
                if total_projects
                else 0
            ),
        },
        "category_distribution": category_distribution,
        "projects_by_year": projects_by_year,
        "projects_by_month": projects_by_month,
        "media_breakdown": [
            {
                "type": "image",
                "label": "Images",
                "count": media_counts.get("image", 0),
            },
            {
                "type": "video",
                "label": "Videos",
                "count": media_counts.get("video", 0),
            },
        ],
        "selected_work": selected_work,
    }
