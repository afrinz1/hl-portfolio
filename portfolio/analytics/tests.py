from django.test import TestCase
from rest_framework.test import APITestCase

from project.models import Category, Project, ProjectMedia

OVERVIEW_URL = "/api/v1/analytics/overview/"


class PortfolioOverviewTests(APITestCase):
    def setUp(self):
        self.design = Category.objects.create(name="Design", slug="design")
        self.film = Category.objects.create(name="Film", slug="film")
        self.hidden = Category.objects.create(
            name="Hidden", slug="hidden", is_active=False
        )

        self.published = Project.objects.create(
            title="Published project",
            slug="published-project",
            category=self.design,
            client="Acme",
            description="A published project",
            cover_image="https://example.com/cover.jpg",
            year=2024,
            status=True,
        )
        self.archived = Project.objects.create(
            title="Unpublished project",
            slug="unpublished-project",
            category=self.design,
            description="Not public",
            year=2025,
        )
        self.hidden_category_project = Project.objects.create(
            title="Hidden category project",
            slug="hidden-category-project",
            category=self.hidden,
            description="Category is inactive",
            year=2023,
            status=True,
        )

        ProjectMedia.objects.create(
            project=self.published,
            media_type="image",
            media_url="https://example.com/still.jpg",
        )
        ProjectMedia.objects.create(
            project=self.published,
            media_type="video",
            media_url="https://example.com/reel.mp4",
        )
        # Media on non-public projects must not be counted.
        ProjectMedia.objects.create(
            project=self.archived,
            media_type="image",
            media_url="https://example.com/private.jpg",
        )

    def test_overview_counts_only_public_portfolio_data(self):
        response = self.client.get(OVERVIEW_URL)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["source"], "database")
        self.assertEqual(response.data["totals"]["projects"], 1)
        self.assertEqual(response.data["totals"]["categories"], 2)
        self.assertEqual(response.data["totals"]["media_assets"], 2)
        self.assertEqual(response.data["totals"]["years_covered"], 1)
        self.assertEqual(
            response.data["totals"]["year_span"],
            {"from": 2024, "to": 2024},
        )

    def test_overview_returns_chartable_shapes(self):
        response = self.client.get(OVERVIEW_URL)
        data = response.data

        self.assertEqual(
            data["media_breakdown"],
            [
                {"type": "image", "label": "Images", "count": 1},
                {"type": "video", "label": "Videos", "count": 1},
            ],
        )
        months = data["projects_by_month"]
        self.assertEqual(len(months), 12)
        self.assertEqual(sum(month["projects"] for month in months), 1)
        self.assertEqual(months[-1]["projects"], 1)
        self.assertTrue(all({"month", "label", "projects"} <= set(m) for m in months))

        distribution = {row["slug"]: row["projects"] for row in data["category_distribution"]}
        self.assertEqual(distribution, {"design": 1, "film": 0})

        self.assertEqual(len(data["selected_work"]), 1)
        selected = data["selected_work"][0]
        self.assertEqual(selected["slug"], "published-project")
        self.assertEqual(selected["category"], "Design")
        self.assertEqual(selected["media_count"], 2)

    def test_overview_is_publicly_readable(self):
        self.assertEqual(self.client.get(OVERVIEW_URL).status_code, 200)

    def test_overview_handles_an_empty_portfolio(self):
        Project.objects.all().delete()

        response = self.client.get(OVERVIEW_URL)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["totals"]["projects"], 0)
        self.assertEqual(response.data["totals"]["media_assets"], 0)
        self.assertEqual(response.data["totals"]["years_covered"], 0)
        self.assertIsNone(response.data["totals"]["year_span"])
        self.assertEqual(response.data["totals"]["average_media_per_project"], 0)
        self.assertEqual(response.data["selected_work"], [])

        months = response.data["projects_by_month"]
        self.assertEqual(len(months), 12)
        self.assertEqual(sum(month["projects"] for month in months), 0)


class OverviewContractTests(TestCase):
    """Guards the response keys the frontend dashboard renders."""

    def test_overview_payload_has_expected_top_level_keys(self):
        response = self.client.get(OVERVIEW_URL)

        self.assertEqual(
            set(response.json().keys()),
            {
                "generated_at",
                "source",
                "totals",
                "category_distribution",
                "projects_by_month",
                "media_breakdown",
                "selected_work",
            },
        )
