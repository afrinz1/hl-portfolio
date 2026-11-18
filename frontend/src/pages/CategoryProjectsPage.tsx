import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getProjectThumbnail, getProjectVideo, hecticApi } from '../api/hecticApi';
import type { Category, Project, StudioInfo } from '../api/types';
import { CyanFooter } from '../components/CyanFooter';
import { InquiryCta } from '../components/InquiryCta';
import { Navbar } from '../components/Navbar';
import { PageShell } from '../components/PageShell';
import { ProjectCard, ProjectGrid } from '../components/ProjectCard';
import { usePageMeta } from '../hooks/usePageMeta';
import {
  EmptyState,
  ErrorState,
  PaginationBar,
  SkeletonCardGrid,
} from '../components/StatusStates';

export function CategoryProjectsPage() {
  const { slug = '' } = useParams<{ slug: string }>();

  const [category, setCategory] = useState<Category | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [count, setCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [studio, setStudio] = useState<StudioInfo | null>(null);

  useEffect(() => {
    setPage(1);
  }, [slug]);

  const loadData = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const [catRes, projRes] = await Promise.all([
        hecticApi.getCategories({ page: 1 }).catch(() => null),
        hecticApi.getProjects({ category: slug, page }),
      ]);

      if (catRes) {
        const matched = catRes.results.find((c) => c.slug === slug) ?? null;
        setCategory(matched);
      }

      setProjects(projRes.results);
      setCount(projRes.count);
      setHasNext(Boolean(projRes.next));
      setHasPrevious(Boolean(projRes.previous));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load category projects.'
      );
    } finally {
      setLoading(false);
    }
  }, [slug, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    hecticApi
      .getStudioInfo({ page: 1 })
      .then((res) => setStudio(res.results[0] ?? null))
      .catch(() => {});
  }, []);

  const displayTitle = category?.name || slug.replace(/-/g, ' ');

  usePageMeta({
    title: `${displayTitle} — Hectic Lab`,
    description:
      category?.description ||
      `Selected ${displayTitle} work from the Hectic Lab archive.`,
  });

  return (
    <div className="min-h-screen bg-[#F3F0E9] text-[#111110]">
      <Navbar />

      <PageShell>
        <div className="mb-12 md:mb-14">
          <Link
            to="/work"
            className="font-mono-hl mb-4 inline-block text-xs text-[#111110]/60 hover:text-[#111110] underline underline-offset-4"
          >
            ← all categories
          </Link>
          <h1 className="font-display text-[clamp(44px,6vw,88px)] font-light uppercase leading-[0.94] tracking-[-0.05em]">
            {displayTitle}
          </h1>
          <p className="mt-2 text-xs text-[#111110]/75 md:text-[13px]">
            {category?.description || 'see through our collection.'}
          </p>
        </div>

        {loading ? (
          <SkeletonCardGrid count={8} />
        ) : error ? (
          <ErrorState message={error} onRetry={loadData} />
        ) : projects.length === 0 ? (
          <EmptyState
            title={`No projects in ${displayTitle} yet`}
            description="Check back soon or browse another category in our collection."
            action={
              <Link
                to="/work"
                className="rounded-full border border-[#111110]/50 px-6 py-2.5 text-xs font-normal hover:bg-[#111110] hover:text-[#F3F0E9] transition-colors"
              >
                Explore all categories
              </Link>
            }
          />
        ) : (
          <>
            <ProjectGrid>
              {projects.map((proj, idx) => {
                const isBroken = failedImages[String(proj.id)];
                const itemNumber = (page - 1) * 12 + idx + 1;

                return (
                  <ProjectCard
                    key={proj.id}
                    to={`/projects/${proj.slug}`}
                    title={proj.title}
                    index={itemNumber}
                    meta={proj.year || proj.release_year || null}
                    image={isBroken ? null : getProjectThumbnail(proj)}
                    video={getProjectVideo(proj)}
                    onImageError={() =>
                      setFailedImages((prev) => ({
                        ...prev,
                        [String(proj.id)]: true,
                      }))
                    }
                  />
                );
              })}
            </ProjectGrid>

            <PaginationBar
              count={count}
              currentPage={page}
              hasNext={hasNext}
              hasPrevious={hasPrevious}
              onPageChange={(nextPage) => {
                setPage(nextPage);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              itemCountOnPage={projects.length}
            />
          </>
        )}
      </PageShell>

      <InquiryCta variant="dark" />
      <CyanFooter studio={studio} />
    </div>
  );
}
