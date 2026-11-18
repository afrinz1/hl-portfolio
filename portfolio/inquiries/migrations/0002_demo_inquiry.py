from django.db import migrations


def add_demo_inquiry(apps, schema_editor):
    Inquiry = apps.get_model("inquiries", "Inquiry")
    Service = apps.get_model("studio", "Service")

    service = Service.objects.filter(slug="web-design").first()
    Inquiry.objects.create(
        name="Alex Morgan",
        email="alex.morgan@example.com",
        company="Northstar Coffee",
        service=service,
        budget_range="$5,000-$10,000",
        message=(
            "We are looking for a refreshed website for our neighborhood coffee "
            "brand, including an online menu and a simple way to share our story. "
            "Could you tell us about your process and timeline?"
        ),
        status="new",
    )


class Migration(migrations.Migration):

    dependencies = [
        ("inquiries", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(add_demo_inquiry, migrations.RunPython.noop),
    ]
