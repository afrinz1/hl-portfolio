import { useCallback, useEffect, useState } from 'react';
import { getCategoryImage, hecticApi } from '../api/hecticApi';
import type { Category, StudioInfo } from '../api/types';
import { CyanFooter } from '../components/CyanFooter';
import { InquiryCta } from '../components/InquiryCta';
import { Navbar } from '../components/Navbar';
import { PageShell } from '../components/PageShell';
import { ProjectCard, ProjectGrid } from '../components/ProjectCard';
import {
  EmptyState,
  ErrorState,
  PaginationBar,
  SkeletonCardGrid,
} from '../components/StatusStates';

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [count, setCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [studio, setStudio] = useState<StudioInfo | null>(null);

  const loadCategories = useCallback(async (targetPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await hecticApi.getCategories({ page: targetPage });
      setCategories(res.results);
      setCount(res.count);
      setHasNext(Boolean(res.next));
      setHasPrevious(Boolean(res.previous));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories(page);
  }, [page, loadCategories]);

  useEffect(() => {
    hecticApi
      .getStudioInfo({ page: 1 })
      .then((res) => setStudio(res.results[0] ?? null))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#F3F0E9] text-[#111110]">
      <Navbar />

      <PageShell>
        <div className="mb-12 md:mb-14">
          <h1 className="font-display text-[clamp(44px,6vw,88px)] font-light uppercase leading-[0.94] tracking-[-0.05em]">
            CATEGORY
          </h1>
          <p className="mt-2 font-mono-hl text-[11px] font-medium uppercase tracking-[-0.02em] text-[#111110]/70">
            WHAT WE CREATE.
          </p>
        </div>

        {loading ? (
          <SkeletonCardGrid count={6} />
        ) : error ? (
          <ErrorState message={error} onRetry={() => loadCategories(page)} />
        ) : categories.length === 0 ? (
          <EmptyState
            title="No categories found"
            description="Portfolio categories will appear once published in the backend."
          />
        ) : (
          <>
            <ProjectGrid>
              {categories.map((cat, idx) => {
                const isBroken = failedImages[String(cat.id)];
                const itemNumber = (page - 1) * 12 + idx + 1;
                const projectCount = cat.projects_count ?? cat.project_count;

                return (
                  <ProjectCard
                    key={cat.id}
                    to={`/categories/${cat.slug}`}
                    title={cat.name}
                    index={itemNumber}
                    meta={typeof projectCount === 'number' ? projectCount : null}
                    image={isBroken ? null : getCategoryImage(cat)}
                    onImageError={() =>
                      setFailedImages((prev) => ({
                        ...prev,
                        [String(cat.id)]: true,
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
              itemCountOnPage={categories.length}
            />
          </>
        )}
      </PageShell>

      <InquiryCta variant="dark" />
      <CyanFooter studio={studio} />
    </div>
  );
}
