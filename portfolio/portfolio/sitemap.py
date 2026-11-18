"""Data-driven sitemap for the public portfolio site.

Served at ``/sitemap.xml`` so crawlers get the complete public URL set —
the static routes plus every published project and active category — without
a build step. Set ``SITE_URL`` to the public site origin in production; it
falls back to the origin the request came in on.
"""

from xml.sax.saxutils import escape

from django.conf import settings
from django.http import HttpRequest, HttpResponse

from project.models import Category, Project

# Static (non-data) frontend routes worth indexing.
STATIC_PATHS = [
    "/",
    "/work",
    "/categories",
    "/studio",
    "/inquiries",
    "/privacy",
    "/trust",
]


def _site_base(request: HttpRequest) -> str:
    configured = getattr(settings, "SITE_URL", "") or ""
    configured = configured.strip()

    if configured:
        return configured.rstrip("/")

    return request.build_absolute_uri("/").rstrip("/")


def sitemap_xml(request: HttpRequest) -> HttpResponse:
    base = _site_base(request)

    entries: list[tuple[str, str | None]] = [
        (f"{base}{path}", None) for path in STATIC_PATHS
    ]

    projects = Project.objects.filter(
        status=True,
        active_status=True,
        category__is_active=True,
    )
    for slug, updated_at in projects.values_list("slug", "updated_at"):
        entries.append((f"{base}/projects/{slug}", updated_at.date().isoformat()))

    for slug, updated_at in Category.objects.filter(is_active=True).values_list(
        "slug", "updated_at"
    ):
        entries.append((f"{base}/categories/{slug}", updated_at.date().isoformat()))

    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]

    for loc, lastmod in entries:
        lines.append("  <url>")
        lines.append(f"    <loc>{escape(loc)}</loc>")
        if lastmod:
            lines.append(f"    <lastmod>{lastmod}</lastmod>")
        lines.append("  </url>")

    lines.append("</urlset>")

    return HttpResponse("\n".join(lines), content_type="application/xml")
