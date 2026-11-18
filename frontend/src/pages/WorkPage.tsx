import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import {
  getProjectCategoryName,
  getProjectThumbnail,
  getProjectVideo,
  hecticApi,
} from '../api/hecticApi';
import type { Category, Project, StudioInfo } from '../api/types';
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
import { WorkCylinderCarousel } from '../components/WorkCylinderCarousel';

const PREFERRED_CATEGORY_ORDER = [
  'automotive',
  'automobile',
  'commercial',
  'fashion',
  'events',
  'product',
  'creative-films',
  'creative films',
];

function sortCategoriesOrder(categories: Category[]): Category[] {
  return [...categories].sort((a, b) => {
    const keyA = a.slug.toLowerCase();
    const keyB = b.slug.toLowerCase();
    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();

    const idxA = PREFERRED_CATEGORY_ORDER.findIndex(
      (k) => keyA.includes(k) || nameA.includes(k)
    );
    const idxB = PREFERRED_CATEGORY_ORDER.findIndex(
      (k) => keyB.includes(k) || nameB.includes(k)
    );

    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return (a.order ?? 999) - (b.order ?? 999);
  });
}

async function fetchCategoriesForWork(): Promise<Category[]> {
  const first = await hecticApi.getCategories({ page: 1 });
  let combined = [...first.results];
  if (first.next && combined.length < 6) {
    try {
      const second = await hecticApi.getCategories({ page: 2 });
      combined = [...combined, ...second.results];
    } catch {
      // Keep first page if secondary page fails
    }
  }
  return sortCategoriesOrder(combined);
}

async function fetchRepresentativeProjects(): Promise<Project[]> {
  const first = await hecticApi.getProjects({ page: 1 });
  let combined = [...first.results];
  if (first.next && combined.length < first.count) {
    try {
      const second = await hecticApi.getProjects({ page: 2 });
      combined = [...combined, ...second.results];
    } catch {
      // Non-fatal; first page already loaded
    }
  }
  return combined;
}

export function WorkPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlCategory = searchParams.get('category') || '';
  const urlView = searchParams.get('view') || '';

  const [viewMode, setViewMode] = useState<'carousel' | 'browse'>(
    urlCategory || urlView === 'grid' ? 'browse' : 'carousel'
  );
  const [isTransitioning, setIsTransitioning] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [introProjects, setIntroProjects] = useState<Project[]>([]);
  const [introLoading, setIntroLoading] = useState(true);
  const [introError, setIntroError] = useState<string | null>(null);

  const [selectedSlug, setSelectedSlug] = useState<string>(urlCategory);
  const [projects, setProjects] = useState<Project[]>([]);
  const [count, setCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [page, setPage] = useState(1);
  const [gridLoading, setGridLoading] = useState(true);
  const [gridError, setGridError] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const [studio, setStudio] = useState<StudioInfo | null>(null);

  const [searchDraft, setSearchDraft] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Project[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchAttempt, setSearchAttempt] = useState(0);
  const isSearchActive = searchQuery.trim().length > 0;

  const loadIntroData = useCallback(async () => {
    setIntroLoading(true);
    setIntroError(null);
    try {
      const [cats, projs] = await Promise.all([
        fetchCategoriesForWork(),
        fetchRepresentativeProjects(),
      ]);
      setCategories(cats);
      setIntroProjects(projs);
    } catch (err) {
      setIntroError(
        err instanceof Error ? err.message : 'Failed to load work categories.'
      );
    } finally {
      setIntroLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIntroData();
  }, [loadIntroData]);

  useEffect(() => {
    hecticApi
      .getStudioInfo({ page: 1 })
      .then((res) => setStudio(res.results[0] ?? null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setSelectedSlug(urlCategory);
    setPage(1);
    if (urlCategory || urlView === 'grid') {
      setViewMode('browse');
    } else {
      setViewMode('carousel');
    }
  }, [urlCategory, urlView]);

  const loadGridProjects = useCallback(
    async (categorySlug: string, targetPage: number) => {
      setGridLoading(true);
      setGridError(null);
      try {
        const res = await hecticApi.getProjects({
          page: targetPage,
          ...(categorySlug ? { category: categorySlug } : {}),
        });
        setProjects(res.results);
        setCount(res.count);
        setHasNext(Boolean(res.next));
        setHasPrevious(Boolean(res.previous));
      } catch (err) {
        setGridError(
          err instanceof Error ? err.message : 'Failed to load projects.'
        );
      } finally {
        setGridLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    // While a natural-language search is showing, the category grid stays put.
    if (viewMode === 'browse' && !isSearchActive) {
      loadGridProjects(selectedSlug, page);
    }
  }, [viewMode, selectedSlug, page, isSearchActive, loadGridProjects]);

  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults(null);
      setSearchError(null);
      setSearchLoading(false);
      return;
    }

    let active = true;
    setSearchLoading(true);
    setSearchError(null);

    hecticApi
      .searchProjects(query)
      .then((results) => {
        if (active) setSearchResults(results);
      })
      .catch((err) => {
        if (active) {
          setSearchError(
            err instanceof Error ? err.message : 'Search is unavailable right now.'
          );
        }
      })
      .finally(() => {
        if (active) setSearchLoading(false);
      });

    return () => {
      active = false;
    };
  }, [searchQuery, searchAttempt]);

  const clearSearch = () => {
    setSearchDraft('');
    setSearchQuery('');
  };

  const carouselCategories = useMemo(
    () => categories.slice(0, 6),
    [categories]
  );

  const activeCategoryObj = useMemo(
    () => categories.find((c) => c.slug === selectedSlug) ?? null,
    [categories, selectedSlug]
  );

  const transitionToBrowse = (nextCategorySlug: string) => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const commitBrowse = () => {
      setSelectedSlug(nextCategorySlug);
      setPage(1);
      setSearchDraft('');
      setSearchQuery('');
      if (nextCategorySlug) {
        setSearchParams({ category: nextCategorySlug });
      } else {
        setSearchParams({ view: 'grid' });
      }
      setViewMode('browse');
      setIsTransitioning(false);
      window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
    };

    if (prefersReduced || viewMode === 'browse') {
      commitBrowse();
      return;
    }

    setIsTransitioning(true);
    window.setTimeout(commitBrowse, 360);
  };

  const handleFilterClick = (slug: string) => {
    setSelectedSlug(slug);
    setPage(1);
    setSearchDraft('');
    setSearchQuery('');
    if (slug) {
      setSearchParams({ category: slug });
    } else {
      setSearchParams({ view: 'grid' });
    }
  };

  const handleReturnToCarousel = () => {
    setSearchParams({});
    setViewMode('carousel');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Search results take over the grid area; the category grid is left intact.
  const listLoading = isSearchActive ? searchLoading : gridLoading;
  const listError = isSearchActive ? searchError : gridError;
  const displayedProjects = isSearchActive ? searchResults ?? [] : projects;

  return (
    <div className="min-h-screen bg-[#F3F0E9] text-[#111110]">
      <Navbar />

      {viewMode === 'carousel' ? (
        <WorkCylinderCarousel
          categories={carouselCategories}
          projects={introProjects}
          loading={introLoading}
          error={introError}
          onRetry={loadIntroData}
          onSelectCategory={(cat) => transitionToBrowse(cat.slug)}
          onExploreAll={() => transitionToBrowse('')}
          isExiting={isTransitioning}
        />
      ) : (
        <PageShell>
          {/* Standard Work Header */}
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between mb-10 md:mb-12">
            <div>
              <h1 className="font-display text-[clamp(44px,6vw,88px)] font-light uppercase leading-[0.94] tracking-[-0.05em]">
                {isSearchActive
                  ? 'SEARCH'
                  : activeCategoryObj
                    ? activeCategoryObj.name
                    : 'WORK'}
              </h1>
              <p className="mt-2 font-mono-hl text-[11px] font-medium uppercase tracking-[-0.02em] text-[#111110]/70">
                {isSearchActive
                  ? `RESULTS FOR “${searchQuery}”.`
                  : activeCategoryObj?.description || 'SELECTED PRODUCTIONS & FILMS.'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleReturnToCarousel}
              className="inline-flex items-center justify-center self-start sm:self-auto rounded-full border border-[#111110]/35 px-5 py-2 text-[12px] font-normal tracking-tight text-[#111110]/80 transition-colors hover:border-[#111110] hover:bg-[#111110] hover:text-[#F3F0E9] whitespace-nowrap cursor-pointer"
            >
              3D Category Intro ↑
            </button>
          </div>

          {/* Natural-language search */}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setSearchQuery(searchDraft.trim());
            }}
            className="mb-8 flex w-full items-center gap-2.5 rounded-full border border-[#111110]/15 bg-white/70 px-4 py-2.5 transition-colors focus-within:border-[#14bfb9] sm:max-w-xl"
          >
            <Search
              className="h-4 w-4 shrink-0 text-[#111110]/65"
              aria-hidden="true"
            />
            <input
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              maxLength={300}
              placeholder="Describe what you're looking for…"
              aria-label="Describe the work you are looking for"
              className="min-w-0 flex-1 bg-transparent text-[13px] text-[#111110] outline-none placeholder:text-[#111110]/65"
            />
            {isSearchActive && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#111110]/65 transition-colors hover:bg-[#111110]/5 hover:text-[#111110]"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
            <button
              type="submit"
              disabled={searchLoading || !searchDraft.trim()}
              className="shrink-0 rounded-full bg-[#111110] px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.04em] text-[#F3F0E9] transition-colors hover:bg-[#14bfb9] hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
            >
              Search
            </button>
          </form>

          {/* Horizontal Editorial Category Navigation */}
          <nav
            aria-label="Filter projects by category"
            className="mb-12 border-y border-[#111110]/15 py-3.5 overflow-x-auto"
          >
            <div className="flex items-center gap-6 md:gap-9 min-w-max">
              <button
                type="button"
                onClick={() => handleFilterClick('')}
                className={`text-[13px] tracking-tight whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  selectedSlug === ''
                    ? 'font-medium text-[#111110] underline decoration-[#14bfb9] decoration-[1.5px] underline-offset-[6px]'
                    : 'font-normal text-[#111110]/65 hover:text-[#111110]'
                }`}
              >
                All Work
              </button>

              {carouselCategories.map((cat, idx) => {
                const isActive = selectedSlug === cat.slug;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleFilterClick(cat.slug)}
                    className={`inline-flex items-baseline gap-1.5 text-[13px] tracking-tight whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                      isActive
                        ? 'font-medium text-[#111110] underline decoration-[#14bfb9] decoration-[1.5px] underline-offset-[6px]'
                        : 'font-normal text-[#111110]/65 hover:text-[#111110]'
                    }`}
                  >
                    <span className="font-mono-hl text-[10px] text-[#14bfb9] tabular-nums">
                      0{idx + 1}
                    </span>
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Search results, or the standard portfolio project grid */}
          {listLoading ? (
            <SkeletonCardGrid count={8} />
          ) : listError ? (
            <ErrorState
              message={listError}
              onRetry={() =>
                isSearchActive
                  ? setSearchAttempt((attempt) => attempt + 1)
                  : loadGridProjects(selectedSlug, page)
              }
            />
          ) : displayedProjects.length === 0 ? (
            <EmptyState
              title={
                isSearchActive
                  ? `No work matches “${searchQuery}”`
                  : activeCategoryObj
                    ? `No projects in ${activeCategoryObj.name} yet`
                    : 'No published projects yet'
              }
              description={
                isSearchActive
                  ? 'Try different words — a mood, a format, a client or a category.'
                  : 'Projects published under this category will appear here.'
              }
              action={
                isSearchActive ? (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="rounded-full border border-[#111110]/40 px-6 py-2.5 text-xs font-normal hover:bg-[#111110] hover:text-[#F3F0E9] transition-colors cursor-pointer"
                  >
                    Clear Search
                  </button>
                ) : selectedSlug ? (
                  <button
                    type="button"
                    onClick={() => handleFilterClick('')}
                    className="rounded-full border border-[#111110]/40 px-6 py-2.5 text-xs font-normal hover:bg-[#111110] hover:text-[#F3F0E9] transition-colors cursor-pointer"
                  >
                    Show All Work
                  </button>
                ) : undefined
              }
            />
          ) : (
            <>
              <ProjectGrid>
                {displayedProjects.map((proj, idx) => {
                  const catName = getProjectCategoryName(proj);
                  const isBroken = failedImages[String(proj.id)];
                  const itemNumber = isSearchActive
                    ? idx + 1
                    : (page - 1) * 12 + idx + 1;

                  return (
                    <ProjectCard
                      key={proj.id}
                      to={`/projects/${proj.slug}`}
                      title={proj.title}
                      index={itemNumber}
                      meta={proj.year || proj.release_year || catName}
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

              {!isSearchActive && (
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
              )}
            </>
          )}
        </PageShell>
      )}

      <InquiryCta variant="dark" />
      <CyanFooter studio={studio} />
    </div>
  );
}
