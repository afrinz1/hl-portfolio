from django.db import migrations


def add_demo_content(apps, schema_editor):
    StudioSettings = apps.get_model("studio", "StudioSettings")
    Service = apps.get_model("studio", "Service")

    if not StudioSettings.objects.exists():
        StudioSettings.objects.create(
            name="Hectic Lab",
            tagline="Ideas into digital experiences.",
            description=(
                "Hectic Lab is an independent creative studio building thoughtful "
                "brands and digital products."
            ),
            about=(
                "We bring strategy, design, and technology together to help ambitious "
                "ideas make an impact."
            ),
            email="hello@hecticlab.studio",
            location="Working worldwide",
            vision=(
                "To make the digital world more useful, expressive, and human."
            ),
        )

    services = [
        {
            "title": "Brand Identity",
            "slug": "brand-identity",
            "description": (
                "Build a distinctive brand with a clear strategy, visual identity, "
                "and the tools to show up consistently."
            ),
            "display_order": 1,
        },
        {
            "title": "Web Design",
            "slug": "web-design",
            "description": (
                "Create accessible, responsive websites that make your story easy "
                "to explore and your business easy to understand."
            ),
            "display_order": 2,
        },
        {
            "title": "Digital Strategy",
            "slug": "digital-strategy",
            "description": (
                "Turn your goals into a practical digital roadmap, from audience "
                "research and experience planning to launch."
            ),
            "display_order": 3,
        },
    ]

    for service in services:
        Service.objects.get_or_create(slug=service["slug"], defaults=service)


class Migration(migrations.Migration):

    dependencies = [
        ("studio", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(add_demo_content, migrations.RunPython.noop),
    ]
