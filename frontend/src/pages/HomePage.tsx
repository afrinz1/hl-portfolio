import { useCallback, useEffect, useState } from 'react';
import { hecticApi } from '../api/hecticApi';
import type { Project, Service, StudioInfo } from '../api/types';
import { CategoryTunnelSection } from '../components/CategoryTunnelSection';
import { InquiryCta } from '../components/InquiryCta';
import { CyanFooter } from '../components/CyanFooter';
import { EditorialManifestoSection } from '../components/EditorialManifestoSection';
import { HomeHero } from '../components/HomeHero';
import { OffTheTimelineSection } from '../components/OffTheTimelineSection';
import { StudioTrustSection } from '../components/StudioTrustSection';

export function HomePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [totalProjects, setTotalProjects] = useState<number | null>(null);
  const [studio, setStudio] = useState<StudioInfo | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStudioContext = useCallback(async () => {
    setLoading(true);
    try {
      const [studioRes, projectsRes, servicesRes] = await Promise.all([
        hecticApi.getStudioInfo({ page: 1 }).catch(() => null),
        hecticApi.getProjects({ page: 1 }).catch(() => null),
        hecticApi.getServices({ page: 1 }).catch(() => null),
      ]);
      setStudio(studioRes?.results[0] ?? null);
      setProjects(projectsRes?.results ?? []);
      setServices(servicesRes?.results ?? []);
      setTotalProjects(
        typeof projectsRes?.count === 'number' ? projectsRes.count : null
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudioContext();
  }, [loadStudioContext]);

  return (
    <div className="min-h-screen bg-[#F3F0E9] text-[#111110]">
      <HomeHero />

      <main>
        <CategoryTunnelSection />

        <EditorialManifestoSection studio={studio} />

        <StudioTrustSection
          studio={studio}
          projects={projects}
          services={services}
          totalProjects={totalProjects}
          loading={loading}
        />

        <OffTheTimelineSection />

        <InquiryCta />
      </main>

      <CyanFooter studio={studio} />
    </div>
  );
}
