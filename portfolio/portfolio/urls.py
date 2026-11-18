"""
URL configuration for portfolio project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path,include

from .sitemap import sitemap_xml


urlpatterns = [
    path('admin/', admin.site.urls),
    path("sitemap.xml", sitemap_xml, name="sitemap"),
    path("api/v1/", include("project.v1_urls")),
    path("api/v1/", include("studio.v1_urls")),
    path("api/v1/", include("inquiries.v1_urls")),
    path("api/", include("project.urls")),
    path("api/", include("studio.urls")),
    path("api/", include("inquiries.urls")),
    path("api/v1/assistant/",include("ai_agent.urls")),
    path("api/v1/auth/", include("authentication.urls")),
    path("api/v1/analytics/", include("analytics.urls")),
]
