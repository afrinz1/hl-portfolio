from portfolio.pagination import PortfolioPagination
from .views import StudioSettingsView, ServiceListView, StudioInsightListView


class V1StudioSettingsView(StudioSettingsView):
    pagination_class = PortfolioPagination


class V1ServiceListView(ServiceListView):
    pagination_class = PortfolioPagination


class V1StudioInsightListView(StudioInsightListView):
    pagination_class = PortfolioPagination
