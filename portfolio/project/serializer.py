from django.utils.text import slugify
from rest_framework import serializers
from .models import Category, Project, ProjectMedia


class CategorySerializer(serializers.ModelSerializer):

    class Meta:
        model = Category
        fields = "__all__"


class ProjectMediaSerializer(serializers.ModelSerializer):

    class Meta:
        model = ProjectMedia
        exclude = ["project"]


class ProjectMediaWriteSerializer(serializers.ModelSerializer):

    class Meta:
        model = ProjectMedia
        fields = "__all__"
        read_only_fields = ["id", "uuid", "created_at", "updated_at"]


class ProjectWriteSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = Project
        fields = [
            "id",
            "title",
            "slug",
            "category",
            "category_name",
            "client",
            "description",
            "cover_image",
            "year",
            "status",
            "active_status",
            "display_order",
        ]
        extra_kwargs = {
            "slug": {"required": False, "allow_blank": True},
            "client": {"required": False, "allow_blank": True},
            "cover_image": {"required": False, "allow_blank": True},
        }

    def validate_slug(self, value):
        if not value:
            return value
        queryset = Project.objects.filter(slug=value)
        if self.instance is not None:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError(
                "A project with this slug already exists."
            )
        return value

    def validate(self, attrs):
        if "slug" not in attrs and self.instance is not None:
            return attrs
        slug = attrs.get("slug") or ""
        if slug:
            return attrs

        title = attrs.get("title") or getattr(self.instance, "title", "")
        base = slugify(title) or "project"
        candidate = base
        number = 2
        queryset = Project.objects.all()
        if self.instance is not None:
            queryset = queryset.exclude(pk=self.instance.pk)
        while queryset.filter(slug=candidate).exists():
            candidate = f"{base}-{number}"
            number += 1
        attrs["slug"] = candidate
        return attrs


class ProjectSerializer(serializers.ModelSerializer):
    
    category = CategorySerializer(read_only=True)
    media = ProjectMediaSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = "__all__"