from django.db import migrations


def create_projectmedia_if_missing(apps, schema_editor):
    """
    Back-fill the ``project_projectmedia`` table on databases that were migrated
    before the ``ProjectMedia`` model was folded into ``0001_initial``.

    Commit "migration crash problem fix" rewrote ``0001_initial`` so it now
    creates ``Category``, ``Project`` *and* ``ProjectMedia``. Any database that
    had already recorded ``0001_initial`` as applied therefore never received the
    ``project_projectmedia`` table, which makes the public project list/detail
    endpoints fail with a 500 (``prefetch_related("media")``) as soon as one
    project exists.

    Creating the table only when it is absent keeps every database consistent:
    fresh databases already get it from ``0001_initial`` (so this is a no-op),
    while databases that were migrated earlier get the missing table added.
    """
    ProjectMedia = apps.get_model("project", "ProjectMedia")
    existing_tables = schema_editor.connection.introspection.table_names()
    if ProjectMedia._meta.db_table not in existing_tables:
        schema_editor.create_model(ProjectMedia)


class Migration(migrations.Migration):

    dependencies = [
        ("project", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(
            create_projectmedia_if_missing,
            migrations.RunPython.noop,
        ),
    ]
