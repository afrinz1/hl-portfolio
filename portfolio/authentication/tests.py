from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from rest_framework.test import APITestCase

from project.models import Category, Project, ProjectMedia


class EditorMediaApiTests(APITestCase):
    def setUp(self):
        self.editor_group = Group.objects.get(name="Editors")
        self.editor = get_user_model().objects.create_user(
            username="editor",
            password="test-password",
        )
        self.editor.groups.add(self.editor_group)
        self.category = Category.objects.create(name="Design", slug="design")
        self.project = Project.objects.create(
            title="Portfolio project",
            slug="portfolio-project",
            category=self.category,
            description="Project description",
            year=2025,
            status=True,
        )

    def test_editor_group_is_seeded_with_media_permissions(self):
        permissions = set(
            self.editor_group.permissions.values_list("codename", flat=True)
        )

        self.assertTrue(
            {
                "view_category",
                "view_project",
                "add_project",
                "change_project",
                "delete_project",
                "view_projectmedia",
                "add_projectmedia",
                "change_projectmedia",
                "delete_projectmedia",
            }.issubset(permissions)
        )

    def test_visitor_can_read_media_but_cannot_create_it(self):
        read_response = self.client.get("/api/v1/media/")
        write_response = self.client.post(
            "/api/v1/media/",
            {
                "project": self.project.pk,
                "media_type": "video",
                "media_url": "https://example.com/video.mp4",
            },
            format="json",
        )

        self.assertEqual(read_response.status_code, 200)
        self.assertEqual(write_response.status_code, 401)
        self.assertFalse(ProjectMedia.objects.exists())

    def test_editor_can_create_update_and_delete_video_media(self):
        self.client.force_authenticate(user=self.editor)
        create_response = self.client.post(
            "/api/v1/media/",
            {
                "project": self.project.pk,
                "media_type": "video",
                "media_url": "https://example.com/video.mp4",
            },
            format="json",
        )

        self.assertEqual(create_response.status_code, 201)
        media_id = create_response.data["id"]

        update_response = self.client.patch(
            f"/api/v1/media/{media_id}/",
            {"caption": "Updated video"},
            format="json",
        )
        self.assertEqual(update_response.status_code, 200)
        self.assertEqual(update_response.data["caption"], "Updated video")

        delete_response = self.client.delete(f"/api/v1/media/{media_id}/")
        self.assertEqual(delete_response.status_code, 204)
        self.assertFalse(ProjectMedia.objects.filter(pk=media_id).exists())

    def test_editor_can_create_and_edit_image_media(self):
        image = ProjectMedia.objects.create(
            project=self.project,
            media_type="image",
            media_url="https://example.com/image.jpg",
        )
        self.client.force_authenticate(user=self.editor)

        create_response = self.client.post(
            "/api/v1/media/",
            {
                "project": self.project.pk,
                "media_type": "image",
                "media_url": "https://example.com/another-image.jpg",
            },
            format="json",
        )
        update_response = self.client.patch(
            f"/api/v1/media/{image.pk}/",
            {"caption": "Updated still"},
            format="json",
        )

        self.assertEqual(create_response.status_code, 201)
        self.assertEqual(update_response.status_code, 200)
        self.assertEqual(update_response.data["caption"], "Updated still")

    def test_editor_admin_form_offers_image_and_video(self):
        self.editor.is_staff = True
        self.editor.save(update_fields=["is_staff"])
        self.client.force_login(self.editor)

        response = self.client.get("/admin/project/projectmedia/add/")

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'value="video"')
        self.assertContains(response, 'value="image"')

    def test_editor_can_open_an_image_in_admin(self):
        image = ProjectMedia.objects.create(
            project=self.project,
            media_type="image",
            media_url="https://example.com/image.jpg",
        )
        self.editor.is_staff = True
        self.editor.save(update_fields=["is_staff"])
        self.client.force_login(self.editor)

        response = self.client.get(
            f"/admin/project/projectmedia/{image.pk}/change/"
        )

        self.assertEqual(response.status_code, 200)

    def test_superuser_can_create_image_media(self):
        admin = get_user_model().objects.create_superuser(
            username="site-admin",
            email="admin@example.com",
            password="test-password",
        )
        self.client.force_authenticate(user=admin)

        response = self.client.post(
            "/api/v1/media/",
            {
                "project": self.project.pk,
                "media_type": "image",
                "media_url": "https://example.com/image.jpg",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["media_type"], "image")


class EditorJwtAuthTests(APITestCase):
    def setUp(self):
        self.editor_group = Group.objects.get(name="Editors")
        self.editor = get_user_model().objects.create_user(
            username="editor-user",
            password="correct-password",
            email="editor@example.com",
            is_staff=True,
        )
        self.editor.groups.add(self.editor_group)

        self.regular_user = get_user_model().objects.create_user(
            username="regular-user",
            password="user-password",
        )

        self.superuser = get_user_model().objects.create_superuser(
            username="super-user",
            password="admin-password",
            email="admin@example.com",
        )

    def test_csrf_cookie_view_returns_csrf_token(self):
        response = self.client.get("/api/v1/auth/csrf/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("csrfToken", response.data)
        self.assertTrue(len(response.data["csrfToken"]) > 10)

    def test_editor_login_success(self):
        response = self.client.post(
            "/api/v1/auth/login/",
            {"username": "editor-user", "password": "correct-password"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["username"], "editor-user")
        self.assertTrue(response.data["is_editor"])
        self.assertIn("csrfToken", response.data)

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {response.data['access']}"
        )
        me_response = self.client.get("/api/v1/auth/me/")
        self.assertEqual(me_response.status_code, 200)
        self.assertEqual(me_response.data["username"], "editor-user")

    def test_superuser_can_login(self):
        response = self.client.post(
            "/api/v1/auth/login/",
            {"username": "super-user", "password": "admin-password"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["username"], "super-user")
        self.assertTrue(response.data["is_superuser"])
        self.assertTrue(response.data["is_editor"])

    def test_regular_user_cannot_login_as_editor(self):
        response = self.client.post(
            "/api/v1/auth/login/",
            {"username": "regular-user", "password": "user-password"},
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_invalid_credentials_returns_401(self):
        response = self.client.post(
            "/api/v1/auth/login/",
            {"username": "editor-user", "password": "wrong-password"},
            format="json",
        )
        self.assertEqual(response.status_code, 401)

    def test_logout_clears_refresh_cookie_and_access_remains_short_lived(self):
        login_response = self.client.post(
            "/api/v1/auth/login/",
            {"username": "editor-user", "password": "correct-password"},
            format="json",
        )
        logout_response = self.client.post("/api/v1/auth/logout/")
        self.assertEqual(logout_response.status_code, 200)
        self.assertEqual(
            logout_response.cookies["hectic_refresh_token"].value,
            "",
        )

        # Logout revokes refresh capability; the short-lived access token
        # remains valid until expiry and is cleared by the browser client.
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {login_response.data['access']}"
        )
        me_response = self.client.get("/api/v1/auth/me/")
        self.assertEqual(me_response.status_code, 200)

        self.client.credentials()
        refresh_response = self.client.post("/api/v1/auth/token/refresh/")
        self.assertEqual(refresh_response.status_code, 401)


class EditorProjectManagementTests(APITestCase):
    def setUp(self):
        self.editor_group = Group.objects.get(name="Editors")
        self.editor = get_user_model().objects.create_user(
            username="editor-proj",
            password="test-password",
            is_staff=True,
        )
        self.editor.groups.add(self.editor_group)
        self.category = Category.objects.create(name="Films", slug="films")
        self.client.force_authenticate(user=self.editor)

    def test_editor_can_create_update_delete_project(self):
        # Create
        create_res = self.client.post(
            "/api/v1/editor/projects/",
            {
                "title": "New Film Project",
                "category": self.category.id,
                "description": "Cinematic visual campaign.",
                "year": 2026,
                "client": "Acme Brand",
                "status": True,
            },
            format="json",
        )
        self.assertEqual(create_res.status_code, 201)
        slug = create_res.data["slug"]
        self.assertEqual(slug, "new-film-project")

        # Update
        update_res = self.client.patch(
            f"/api/v1/editor/projects/{slug}/",
            {"description": "Updated campaign description."},
            format="json",
        )
        self.assertEqual(update_res.status_code, 200)
        self.assertEqual(update_res.data["description"], "Updated campaign description.")

        # Delete
        delete_res = self.client.delete(f"/api/v1/editor/projects/{slug}/")
        self.assertEqual(delete_res.status_code, 204)
        self.assertFalse(Project.objects.filter(slug=slug).exists())

