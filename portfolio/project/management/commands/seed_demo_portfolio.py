from django.core.management.base import BaseCommand

from project.models import Category, Project, ProjectMedia


YOUTUBE_EMBED_URL = "https://www.youtube.com/embed/M7lc1UVf-VE"
YOUTUBE_POSTER_URL = "https://img.youtube.com/vi/M7lc1UVf-VE/hqdefault.jpg"

DEMO_CATEGORIES = [
    {
        "name": "Demo - Branding",
        "slug": "demo-branding",
        "display_order": 1,
        "is_active": True,
    },
    {
        "name": "Demo - Digital",
        "slug": "demo-digital",
        "display_order": 2,
        "is_active": True,
    },
    {
        "name": "Demo - Motion",
        "slug": "demo-motion",
        "display_order": 3,
        "is_active": True,
    },
    {
        "name": "Demo - Hidden Category",
        "slug": "demo-hidden",
        "display_order": 4,
        "is_active": False,
    },
]

DEMO_PROJECTS = [
    ("Brand Refresh", "demo-branding", 2026, True, True),
    ("Studio Identity", "demo-branding", 2025, True, True),
    ("Product Launch", "demo-digital", 2025, True, True),
    ("Commerce Experience", "demo-digital", 2024, True, True),
    ("Creative Campaign", "demo-motion", 2024, True, True),
    ("Portfolio Concept", "demo-branding", 2023, True, True),
    ("Digital Storytelling", "demo-motion", 2023, True, True),
    ("Unpublished Concept", "demo-digital", 2022, False, True),
    ("Archived Campaign", "demo-motion", 2021, True, False),
    ("Hidden Category Project", "demo-hidden", 2022, True, True),
]


class Command(BaseCommand):
    help = "Create or update ten demo projects with YouTube video media."

    def handle(self, *args, **options):
        categories = {}
        for values in DEMO_CATEGORIES:
            category, _ = Category.objects.update_or_create(
                slug=values["slug"],
                defaults=values,
            )
            categories[category.slug] = category

        for index, (title, category_slug, year, is_published, is_active) in enumerate(
            DEMO_PROJECTS,
            start=1,
        ):
            slug = f"demo-portfolio-{index:02d}"
            project, _ = Project.objects.update_or_create(
                slug=slug,
                defaults={
                    "title": f"Demo {index:02d} - {title}",
                    "category": categories[category_slug],
                    "client": f"Demo Client {index:02d}",
                    "description": (
                        f"Placeholder portfolio content for testing project "
                        f"layouts, categories, and visibility. Demo item {index:02d}."
                    ),
                    "cover_image": YOUTUBE_POSTER_URL,
                    "year": year,
                    "status": is_published,
                    "active_status": is_active,
                    "display_order": index,
                },
            )
            ProjectMedia.objects.update_or_create(
                project=project,
                caption="Demo YouTube video",
                defaults={
                    "media_type": "video",
                    "media_url": YOUTUBE_EMBED_URL,
                    "poster_url": YOUTUBE_POSTER_URL,
                    "alt_text": f"Demo video for project {index:02d}",
                    "display_order": 1,
                },
            )

        self.stdout.write(
            self.style.SUCCESS(
                "Seeded 10 demo projects and 10 YouTube video records. "
                "The command is safe to run again."
            )
        )
