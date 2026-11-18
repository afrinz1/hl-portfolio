"""Live analytics providers for the /trust dashboard.

Each provider reads its credentials from the environment and returns a payload
that already matches the interface the dashboard renders. When a provider is
not configured, or the upstream service cannot be reached, it raises
``AnalyticsUnavailable`` so the API answers with ``source="demo"`` rather than
inventing figures or breaking the page.
"""

from __future__ import annotations

import calendar
import json
from datetime import date

import requests
from django.conf import settings

from project.models import Project

from .views import MONTHLY_WINDOW, trailing_months

# Read-only scope for the Google Analytics Data API.
GA4_SCOPE = "https://www.googleapis.com/auth/analytics.readonly"
GA4_RUN_REPORT = (
    "https://analyticsdata.googleapis.com/v1beta/properties/{property}:runReport"
)

# How many project pages to surface in the "popular projects" list.
POPULAR_PROJECT_LIMIT = 5

REQUEST_TIMEOUT = 10


class AnalyticsUnavailable(Exception):
    """A live analytics source is not configured or could not be reached."""


def _end_of_month(day: date) -> date:
    return date(day.year, day.month, calendar.monthrange(day.year, day.month)[1])


def _as_number(value) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


# --------------------------------------------------------------------------- #
# Google Analytics 4
# --------------------------------------------------------------------------- #


def _ga4_credentials():
    """Short-lived OAuth credentials for the GA4 Data API."""
    try:
        from google.auth.transport.requests import Request
        from google.oauth2 import service_account
    except ImportError as exc:  # pragma: no cover - optional dependency
        raise AnalyticsUnavailable(
            "google-auth is required to read GA4 analytics."
        ) from exc

    inline = getattr(settings, "GA4_SERVICE_ACCOUNT_JSON", "").strip()
    path = (
        getattr(settings, "GA4_SERVICE_ACCOUNT_FILE", "").strip()
        or getattr(settings, "GOOGLE_APPLICATION_CREDENTIALS", "").strip()
    )

    try:
        if inline:
            credentials = service_account.Credentials.from_service_account_info(
                json.loads(inline), scopes=[GA4_SCOPE]
            )
        elif path:
            credentials = service_account.Credentials.from_service_account_file(
                path, scopes=[GA4_SCOPE]
            )
        else:
            raise AnalyticsUnavailable(
                "Set GA4_SERVICE_ACCOUNT_FILE or GA4_SERVICE_ACCOUNT_JSON."
            )

        credentials.refresh(Request())
    except AnalyticsUnavailable:
        raise
    except Exception as exc:
        raise AnalyticsUnavailable(f"Could not authenticate with GA4: {exc}") from exc

    return credentials


def _ga4_run_report(property_id: str, credentials, body: dict) -> dict:
    try:
        response = requests.post(
            GA4_RUN_REPORT.format(property=property_id),
            headers={"Authorization": f"Bearer {credentials.token}"},
            json=body,
            timeout=REQUEST_TIMEOUT,
        )
    except requests.RequestException as exc:
        raise AnalyticsUnavailable(f"GA4 request failed: {exc}") from exc

    if response.status_code != 200:
        raise AnalyticsUnavailable(f"GA4 request failed ({response.status_code}).")

    return response.json()


def _ga4_metric_triplet(row: dict) -> tuple[int, int, int]:
    """``(sessions, totalUsers, averageSessionDuration)`` from one report row."""
    metrics = row.get("metricValues", [])
    values = [_as_number(item.get("value")) for item in metrics] + [0, 0, 0]
    return (
        int(values[0]),
        int(values[1]),
        round(values[2]),
    )


def website_analytics():
    """Website traffic from the GA4 Data API.

    Mirrors the dashboard's ``WebsiteAnalytics`` interface: period totals, a
    zero-filled trailing 12-month series, and the most viewed project pages.
    """
    property_id = getattr(settings, "GA4_PROPERTY_ID", "").strip()
    if not property_id:
        raise AnalyticsUnavailable("GA4_PROPERTY_ID is not configured.")

    credentials = _ga4_credentials()

    months = trailing_months()
    date_range = [
        {
            "startDate": months[0].isoformat(),
            "endDate": _end_of_month(months[-1]).isoformat(),
        }
    ]

    monthly_report = _ga4_run_report(
        property_id,
        credentials,
        {
            "dateRanges": date_range,
            "dimensions": [{"name": "yearMonth"}],
            "metrics": [
                {"name": "sessions"},
                {"name": "totalUsers"},
                {"name": "averageSessionDuration"},
            ],
            "orderBys": [{"dimension": {"dimensionName": "yearMonth"}}],
            "limit": MONTHLY_WINDOW * 2,
        },
    )

    by_month = {}
    for row in monthly_report.get("rows", []):
        dimension_values = row.get("dimensionValues", [])
        if not dimension_values:
            continue
        # GA4 returns ``yearMonth`` as ``YYYYMM``.
        raw = dimension_values[0].get("value", "")
        if len(raw) != 6 or not raw.isdigit():
            continue
        sessions, users, duration = _ga4_metric_triplet(row)
        by_month[f"{raw[:4]}-{raw[4:]}"] = {
            "visits": sessions,
            "uniqueVisitors": users,
            "avgSessionSeconds": duration,
        }

    monthly = []
    for month in months:
        key = month.strftime("%Y-%m")
        values = by_month.get(key, {})
        monthly.append(
            {
                "month": key,
                "label": month.strftime("%b"),
                "visits": values.get("visits", 0),
                "uniqueVisitors": values.get("uniqueVisitors", 0),
                "avgSessionSeconds": values.get("avgSessionSeconds", 0),
            }
        )

    totals_report = _ga4_run_report(
        property_id,
        credentials,
        {
            "dateRanges": date_range,
            "metrics": [
                {"name": "sessions"},
                {"name": "totalUsers"},
                {"name": "averageSessionDuration"},
            ],
        },
    )
    totals_rows = totals_report.get("rows") or []
    if totals_rows:
        sessions, users, duration = _ga4_metric_triplet(totals_rows[0])
        totals = {
            "visits": sessions,
            "uniqueVisitors": users,
            "avgSessionSeconds": duration,
        }
    else:
        totals = {"visits": 0, "uniqueVisitors": 0, "avgSessionSeconds": 0}

    return {
        "totals": totals,
        "monthly": monthly,
        "popularProjects": _ga4_popular_projects(property_id, credentials, date_range),
    }


def _ga4_popular_projects(property_id, credentials, date_range):
    pages_report = _ga4_run_report(
        property_id,
        credentials,
        {
            "dateRanges": date_range,
            "dimensions": [{"name": "pagePath"}],
            "metrics": [
                {"name": "screenPageViews"},
                {"name": "averageSessionDuration"},
            ],
            "dimensionFilter": {
                "filter": {
                    "fieldName": "pagePath",
                    "stringFilter": {
                        "matchType": "BEGINS_WITH",
                        "value": "/projects/",
                    },
                }
            },
            "orderBys": [{"metric": {"metricName": "screenPageViews"}, "desc": True}],
            "limit": POPULAR_PROJECT_LIMIT * 4,
        },
    )

    views: dict[str, int] = {}
    durations: dict[str, int] = {}
    for row in pages_report.get("rows", []):
        dimension_values = row.get("dimensionValues", [])
        if not dimension_values:
            continue
        path = dimension_values[0].get("value", "")
        slug = path.removeprefix("/projects/").split("/")[0].split("?")[0].strip()
        if not slug:
            continue
        metrics = row.get("metricValues", [])
        page_views = int(_as_number(metrics[0].get("value")) if metrics else 0)
        page_duration = round(
            _as_number(metrics[1].get("value")) if len(metrics) > 1 else 0
        )
        views[slug] = views.get(slug, 0) + page_views
        durations.setdefault(slug, page_duration)

    titles = dict(
        Project.objects.filter(slug__in=list(views)).values_list("slug", "title")
    )

    ranked = sorted(views.items(), key=lambda item: item[1], reverse=True)
    return [
        {
            "title": titles[slug],
            "slug": slug,
            "views": total_views,
            "avgTimeOnPageSeconds": durations.get(slug, 0),
        }
        for slug, total_views in ranked
        if slug in titles
    ][:POPULAR_PROJECT_LIMIT]


# --------------------------------------------------------------------------- #
# Instagram
# --------------------------------------------------------------------------- #


def instagram_analytics():
    """Live Instagram Insights.

    The Graph API only exposes roughly 30 days of daily reach and follower
    history and no month-over-month follower totals, so it cannot fill this
    dashboard's 12-month window on its own. A live payload therefore needs
    metrics snapshotted over time; until that collector exists the endpoint
    reports the demo figures instead.
    """
    if not getattr(settings, "INSTAGRAM_ACCESS_TOKEN", "").strip():
        raise AnalyticsUnavailable("INSTAGRAM_ACCESS_TOKEN is not configured.")

    raise AnalyticsUnavailable(
        "Instagram Insights exposes at most ~30 days of daily history, which is "
        "shorter than the dashboard's 12-month window. Snapshot the metrics to "
        "serve live Instagram figures."
    )
