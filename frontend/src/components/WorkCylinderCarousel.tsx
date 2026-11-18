import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  getCategoryImage,
  getProjectCategoryName,
  getProjectCategorySlug,
  getProjectThumbnail,
} from '../api/hecticApi';
import type { Category, Project } from '../api/types';
import { EmptyState, ErrorState } from './StatusStates';

interface WorkCylinderCarouselProps {
  categories: Category[];
  projects: Project[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onSelectCategory: (category: Category) => void;
  onExploreAll: () => void;
  isExiting?: boolean;
}

const PERSPECTIVE_PX = 1350;
// Keep all visible 3D cards at positive Z (> 0) in front of the container plane
// so browser 3D hit-testing always lands cleanly on the clicked panel button.
const Z_BASE_PX = 320;
const PERSP_COMP = (PERSPECTIVE_PX - Z_BASE_PX) / PERSPECTIVE_PX;

const clamp = (val: number, min: number, max: number) =>
  Math.min(max, Math.max(min, val));

function wrapOffset(index: number, current: number, total: number): number {
  if (total === 0) return 0;
  let diff = (index - current) % total;
  if (diff > total / 2) diff -= total;
  if (diff < -total / 2) diff += total;
  return diff;
}

function findRepresentativeProject(
  category: Category,
  projects: Project[]
): Project | null {
  const catSlug = category.slug.toLowerCase();
  const catName = category.name.toLowerCase();
  const catId = String(category.id);

  const matching = projects.filter((proj) => {
    const pSlug = getProjectCategorySlug(proj)?.toLowerCase();
    if (pSlug && pSlug === catSlug) return true;
    if (
      proj.category &&
      typeof proj.category === 'object' &&
      proj.category.id !== undefined &&
      String(proj.category.id) === catId
    ) {
      return true;
    }
    if (
      typeof proj.category === 'string' ||
      typeof proj.category === 'number'
    ) {
      if (String(proj.category) === catId) return true;
    }
    const pName = getProjectCategoryName(proj).toLowerCase();
    return pName === catName;
  });

  if (matching.length === 0) return null;

  return (
    matching.find((p) => (p.is_featured || p.featured) && getProjectThumbnail(p)) ??
    matching.find((p) => Boolean(getProjectThumbnail(p))) ??
    matching[0]
  );
}

export function WorkCylinderCarousel({
  categories,
  projects,
  loading,
  error,
  onRetry,
  onSelectCategory,
  onExploreAll,
  isExiting = false,
}: WorkCylinderCarouselProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  // Single continuous physics engine state (positions in category-index units)
  const posRef = useRef(0);
  const velRef = useRef(0);
  const snapTargetRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const isCardHoveredRef = useRef(false);
  const dragLastYRef = useRef(0);
  const dragLastTimeRef = useRef(0);
  const dragDistanceRef = useRef(0);
  const dragStartXRef = useRef(0);
  const dragStartYRef = useRef(0);
  const lastManualTimeRef = useRef(0);
  const activeIndexRef = useRef(0);

  // Smooth mouse parallax tilt for the center panel
  const pointerNormRef = useRef({ x: 0, y: 0 });
  const tiltRef = useRef({ x: 0, y: 0 });

  const items = useMemo(() => {
    return categories.map((cat) => {
      const repProject = findRepresentativeProject(cat, projects);
      const imageUrl =
        (repProject ? getProjectThumbnail(repProject) : null) ||
        getCategoryImage(cat);

      return {
        category: cat,
        project: repProject,
        imageUrl,
      };
    });
  }, [categories, projects]);

  const total = items.length;

  useEffect(() => {
    if (total === 0) return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let prefersReduced = mediaQuery.matches;
    const onMotionPrefChange = (e: MediaQueryListEvent) => {
      prefersReduced = e.matches;
    };
    mediaQuery.addEventListener('change', onMotionPrefChange);

    let rafId = 0;
    let lastTime = performance.now();

    const animate = (now: number) => {
      const dt = Math.min(0.033, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      const viewportW = viewportRef.current?.clientWidth || window.innerWidth;
      const isMobile = viewportW < 640;
      const isTablet = viewportW >= 640 && viewportW < 1024;

      const radius = isMobile ? 470 : isTablet ? 600 : 680;
      const angleStepDeg = isMobile ? 28 : 27;
      const depthSeparation = isMobile ? 50 : isTablet ? 65 : 75;

      if (!isDraggingRef.current) {
        if (snapTargetRef.current !== null) {
          const diff = snapTargetRef.current - posRef.current;
          const step = diff * (1 - Math.exp(-8.5 * dt));
          posRef.current += step;
          velRef.current = 0;
          if (Math.abs(diff) < 0.0008) {
            posRef.current = snapTargetRef.current;
            snapTargetRef.current = null;
          }
        } else {
          posRef.current += velRef.current * dt;
          velRef.current *= Math.exp(-4.2 * dt);

          const speedAbs = Math.abs(velRef.current);
          const timeSinceManual = now - lastManualTimeRef.current;

          if (speedAbs < 0.16) {
            if (isCardHoveredRef.current) {
              const nearest = Math.round(posRef.current);
              posRef.current +=
                (nearest - posRef.current) * (1 - Math.exp(-4.5 * dt));
            } else if (!prefersReduced && timeSinceManual > 1100) {
              const resumeRamp = clamp((timeSinceManual - 1100) / 900, 0, 1);
              const frac = posRef.current - Math.floor(posRef.current);
              const sinWave = Math.sin(Math.PI * frac);
              const autoSpeed = (0.11 + 0.17 * sinWave * sinWave) * resumeRamp;
              posRef.current += autoSpeed * dt;
            } else if (timeSinceManual <= 1100 && speedAbs < 0.05) {
              const nearest = Math.round(posRef.current);
              posRef.current +=
                (nearest - posRef.current) * (1 - Math.exp(-5.0 * dt));
            }
          }
        }
      }

      const tiltAlpha = prefersReduced ? 0 : 1 - Math.exp(-7.5 * dt);
      tiltRef.current.x +=
        (pointerNormRef.current.x - tiltRef.current.x) * tiltAlpha;
      tiltRef.current.y +=
        (pointerNormRef.current.y - tiltRef.current.y) * tiltAlpha;

      const cur = posRef.current;
      const roundedIdx = ((Math.round(cur) % total) + total) % total;
      if (roundedIdx !== activeIndexRef.current) {
        activeIndexRef.current = roundedIdx;
        setActiveIndex(roundedIdx);
      }

      for (let i = 0; i < total; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;

        const rel = wrapOffset(i, cur, total);
        const absRel = Math.abs(rel);

        if (absRel > 2.25) {
          el.style.opacity = '0';
          el.style.pointerEvents = 'none';
          el.style.visibility = 'hidden';
          continue;
        }

        el.style.visibility = 'visible';

        const angleDeg = rel * angleStepDeg;
        const rad = (angleDeg * Math.PI) / 180;

        // Cylindrical arc vertical travel + strict positive-Z depth for clean 3D hit-testing
        const ty = Math.sin(rad) * radius * PERSP_COMP;
        const rawTz =
          (Math.cos(rad) - 1) * radius -
          Math.pow(Math.min(absRel, 2), 1.1) * depthSeparation;
        const tz = Math.max(10, Z_BASE_PX + rawTz * 0.72);
        const baseRx = -angleDeg;

        const centerFocus = Math.max(0, 1 - absRel * 1.45);
        const parallaxRy = prefersReduced
          ? 0
          : tiltRef.current.x * 4.5 * centerFocus;
        const parallaxRx = prefersReduced
          ? 0
          : -tiltRef.current.y * 3.2 * centerFocus;

        const scale = (0.72 + 0.28 * Math.exp(-absRel * absRel * 0.85)) * PERSP_COMP;
        const edgeFade = clamp(1 - Math.pow(absRel / 2.15, 2.2), 0, 1);
        const opacity = edgeFade * (0.28 + 0.72 * Math.exp(-absRel * absRel * 0.72));

        el.style.transform = `translate3d(-50%, calc(-50% + ${ty.toFixed(2)}px), ${tz.toFixed(2)}px) rotateX(${(baseRx + parallaxRx).toFixed(2)}deg) rotateY(${parallaxRy.toFixed(2)}deg) scale(${scale.toFixed(4)})`;
        el.style.opacity = opacity.toFixed(3);
        el.style.zIndex = String(Math.round(100 - absRel * 25));
        el.style.pointerEvents = opacity > 0.2 ? 'auto' : 'none';
      }

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(rafId);
      mediaQuery.removeEventListener('change', onMotionPrefChange);
    };
  }, [total]);

  // Smooth non-passive wheel scrolling
  useEffect(() => {
    const el = viewportRef.current;
    if (!el || total === 0) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      snapTargetRef.current = null;
      lastManualTimeRef.current = performance.now();

      let dy = e.deltaY;
      if (e.deltaMode === 1) dy *= 32;
      else if (e.deltaMode === 2) dy *= 320;

      velRef.current = clamp(velRef.current + dy * 0.014, -5.5, 5.5);
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [total]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (total === 0) return;
    snapTargetRef.current = null;
    isDraggingRef.current = true;
    if (viewportRef.current) {
      viewportRef.current.style.cursor = 'grabbing';
    }
    dragStartXRef.current = e.clientX;
    dragStartYRef.current = e.clientY;
    dragLastYRef.current = e.clientY;
    dragLastTimeRef.current = performance.now();
    dragDistanceRef.current = 0;
    velRef.current = 0;
    lastManualTimeRef.current = dragLastTimeRef.current;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (rect && rect.width > 0 && rect.height > 0) {
      pointerNormRef.current = {
        x: clamp(((e.clientX - rect.left) / rect.width - 0.5) * 2, -1, 1),
        y: clamp(((e.clientY - rect.top) / rect.height - 0.5) * 2, -1, 1),
      };
    }

    if (!isDraggingRef.current) return;
    const now = performance.now();
    const dt = Math.max(0.004, (now - dragLastTimeRef.current) / 1000);
    const dy = e.clientY - dragLastYRef.current;
    dragLastYRef.current = e.clientY;
    dragLastTimeRef.current = now;
    dragDistanceRef.current = Math.hypot(
      e.clientX - dragStartXRef.current,
      e.clientY - dragStartYRef.current
    );

    const sensitivity = (rect?.height || 620) < 520 ? 0.0052 : 0.0038;
    const deltaItems = -dy * sensitivity;
    posRef.current += deltaItems;

    const instantVel = clamp(deltaItems / dt, -7, 7);
    velRef.current = velRef.current * 0.45 + instantVel * 0.55;
    lastManualTimeRef.current = now;
  };

  const endDrag = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    if (viewportRef.current) {
      viewportRef.current.style.cursor = 'grab';
    }
    lastManualTimeRef.current = performance.now();
  };

  const focusIndex = (targetIdx: number) => {
    if (total === 0) return;
    const diff = wrapOffset(targetIdx, posRef.current, total);
    snapTargetRef.current = posRef.current + diff;
    velRef.current = 0;
    lastManualTimeRef.current = performance.now();
  };

  const stepCarousel = (dir: number) => {
    if (total === 0) return;
    const base = snapTargetRef.current ?? Math.round(posRef.current);
    snapTargetRef.current = base + dir;
    velRef.current = 0;
    lastManualTimeRef.current = performance.now();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      stepCarousel(1);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      stepCarousel(-1);
    }
  };

  const formatIndex = (idx: number) => String(idx + 1).padStart(2, '0');

  return (
    <section
      aria-label="Interactive Work Category Cylinder"
      className={`bg-[#F3F0E9] text-[#111110] transition-all duration-500 ease-out ${
        isExiting
          ? 'opacity-0 -translate-y-6 scale-[0.985] pointer-events-none'
          : 'opacity-100 translate-y-0 scale-100'
      }`}
    >
      <div className="mx-auto max-w-[1440px] px-6 pt-6 pb-14 md:px-12 md:pt-8 md:pb-20">
        {/* Minimal Editorial Top Header */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-[clamp(44px,5.6vw,84px)] font-light uppercase leading-[0.92] tracking-[-0.05em]">
              WORK
            </h1>
            <p className="mt-2 font-mono-hl text-[11px] font-medium uppercase tracking-[-0.02em] text-[#111110]/65">
              SELECT A DISCIPLINE — DRAG OR SCROLL VERTICALLY.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => stepCarousel(-1)}
              aria-label="Previous category"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#111110]/25 text-sm text-[#111110] transition-colors hover:border-[#111110] hover:bg-[#111110] hover:text-[#F3F0E9] cursor-pointer"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => stepCarousel(1)}
              aria-label="Next category"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#111110]/25 text-sm text-[#111110] transition-colors hover:border-[#111110] hover:bg-[#111110] hover:text-[#F3F0E9] cursor-pointer"
            >
              ↓
            </button>
            <button
              type="button"
              onClick={onExploreAll}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#111110]/50 px-6 py-2.5 text-[13px] font-normal tracking-tight text-[#111110] transition-colors hover:bg-[#111110] hover:text-[#F3F0E9] whitespace-nowrap shrink-0 cursor-pointer"
            >
              Explore All Work <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>

        {/* Loading / Error / Empty / 3D Cylinder Stage */}
        {loading ? (
          <div className="mt-10 flex h-[540px] md:h-[640px] flex-col items-center justify-center gap-5 overflow-hidden">
            <div className="h-24 w-[min(74vw,460px)] animate-pulse rounded-[4px] bg-[#e8e7e1] opacity-45" />
            <div className="h-[250px] md:h-[340px] w-[min(86vw,560px)] animate-pulse rounded-[4px] bg-[#e8e7e1]" />
            <div className="h-24 w-[min(74vw,460px)] animate-pulse rounded-[4px] bg-[#e8e7e1] opacity-45" />
          </div>
        ) : error ? (
          <div className="mt-12">
            <ErrorState message={error} onRetry={onRetry} />
          </div>
        ) : items.length === 0 ? (
          <div className="mt-12">
            <EmptyState
              title="No portfolio categories available"
              description="Published work categories from the Hectic Lab API will appear here."
              action={
                <button
                  type="button"
                  onClick={onExploreAll}
                  className="rounded-full border border-[#111110]/40 px-6 py-2.5 text-xs font-normal hover:bg-[#111110] hover:text-[#F3F0E9] transition-colors cursor-pointer"
                >
                  View all projects
                </button>
              }
            />
          </div>
        ) : (
          <div className="relative mt-6 md:mt-8 grid grid-cols-1 lg:grid-cols-[1fr_auto] items-center gap-6">
            {/* 3D Perspective Viewport */}
            <div
              ref={viewportRef}
              tabIndex={0}
              role="region"
              aria-roledescription="3D vertical category carousel"
              aria-label="Hectic Lab six-category vertical cylinder"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onPointerLeave={() => {
                endDrag();
                isCardHoveredRef.current = false;
                pointerNormRef.current = { x: 0, y: 0 };
              }}
              onMouseLeave={() => {
                isCardHoveredRef.current = false;
                pointerNormRef.current = { x: 0, y: 0 };
              }}
              onKeyDown={handleKeyDown}
              style={{
                perspective: `${PERSPECTIVE_PX}px`,
                touchAction: 'none',
                cursor: 'grab',
              }}
              className="relative h-[520px] sm:h-[640px] md:h-[740px] w-full overflow-hidden select-none focus:outline-none"
            >
              {/* Soft Top/Bottom Edge Dissolve Overlays (pointer-events-none) */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 z-[150] h-16 sm:h-20 bg-gradient-to-b from-[#F3F0E9] to-transparent"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 z-[150] h-16 sm:h-20 bg-gradient-to-t from-[#F3F0E9] to-transparent"
              />

              {/* 3D Stage */}
              <div
                style={{ transformStyle: 'preserve-3d' }}
                className="relative h-full w-full"
              >
                {items.map((item, idx) => {
                  const isCenter = idx === activeIndex;
                  const isBroken = failedImages[String(item.category.id)];
                  const totalStr = String(items.length).padStart(2, '0');

                  return (
                    <button
                      key={item.category.id}
                      type="button"
                      ref={(el) => {
                        cardRefs.current[idx] = el;
                      }}
                      onMouseEnter={() => {
                        isCardHoveredRef.current = true;
                      }}
                      onMouseLeave={() => {
                        isCardHoveredRef.current = false;
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (dragDistanceRef.current > 18) return;
                        onSelectCategory(item.category);
                      }}
                      style={{
                        transformStyle: 'preserve-3d',
                        backfaceVisibility: 'hidden',
                        left: '50%',
                        top: '50%',
                      }}
                      className="group absolute w-[min(84vw,310px)] sm:w-[min(68vw,420px)] md:w-[min(54vw,460px)] rounded-[4px] border border-[#f3f2ee]/15 bg-[#121214] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.55)] text-left will-change-transform focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#14bfb9] cursor-pointer overflow-hidden pointer-events-auto"
                    >
                      {/* Landscape Visual Frame */}
                      <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#18181b]">
                        {item.imageUrl && !isBroken ? (
                          <img
                            src={item.imageUrl}
                            alt={`${item.category.name} — ${item.project?.title || 'Hectic Lab'}`}
                            draggable={false}
                            referrerPolicy="no-referrer"
                            loading={idx < 4 ? 'eager' : 'lazy'}
                            onError={() =>
                              setFailedImages((prev) => ({
                                ...prev,
                                [String(item.category.id)]: true,
                              }))
                            }
                            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-[#18181b] px-6">
                            <span className="font-display text-2xl font-medium uppercase tracking-tight text-[#f3f2ee]/45">
                              {item.category.name}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Clean Editorial Caption Bar */}
                      <div className="flex items-center justify-between gap-4 border-t border-[#f3f2ee]/15 bg-[#121214] px-4 py-3 sm:px-5 sm:py-3.5">
                        <div className="min-w-0 flex items-baseline gap-3 sm:gap-3.5">
                          <span className="font-mono-hl shrink-0 text-[11px] font-medium text-[#14bfb9] tabular-nums">
                            {formatIndex(idx)} / {totalStr}
                          </span>
                          <h2 className="font-display truncate text-base sm:text-lg md:text-xl font-semibold uppercase tracking-[-0.04em] text-[#f3f2ee]">
                            {item.category.name}
                          </h2>
                        </div>

                        <div className="flex items-center gap-3.5 shrink-0">
                          {item.project?.title ? (
                            <span className="hidden md:inline-block max-w-[180px] truncate text-xs text-[#f3f2ee]/55">
                              {item.project.title}
                            </span>
                          ) : null}
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-medium tracking-tight transition-colors duration-300 ${
                              isCenter
                                ? 'text-[#14bfb9]'
                                : 'text-[#f3f2ee]/50 group-hover:text-[#f3f2ee]'
                            }`}
                          >
                            Explore
                            <span
                              aria-hidden="true"
                              className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                            >
                              ↗
                            </span>
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Minimal Right-Side Vertical Index Selector (Desktop) */}
            <nav
              aria-label="Category quick index"
              className="hidden lg:flex flex-col items-end gap-2.5 pr-1"
            >
              {items.map((item, idx) => {
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={item.category.id}
                    type="button"
                    onClick={() => {
                      if (isActive) {
                        onSelectCategory(item.category);
                      } else {
                        focusIndex(idx);
                      }
                    }}
                    className={`group flex items-center gap-3 py-1 text-right transition-colors duration-200 cursor-pointer ${
                      isActive
                        ? 'text-[#111110]'
                        : 'text-[#111110]/65 hover:text-[#111110]'
                    }`}
                  >
                    <span className="text-xs font-medium tracking-tight whitespace-nowrap">
                      {item.category.name}
                    </span>
                    <span
                      className={`font-mono-hl text-[11px] tabular-nums transition-colors duration-200 ${
                        isActive ? 'text-[#14bfb9]' : 'text-[#111110]/35'
                      }`}
                    >
                      {formatIndex(idx)}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        {/* Quiet Bottom Helper Strip */}
        {!loading && !error && items.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-[#111110]/15 pt-4 text-xs text-[#111110]/60">
            <span>
              Click any panel to browse{' '}
              <strong className="font-medium text-[#111110]">
                {items[activeIndex]?.category.name}
              </strong>{' '}
              or another discipline
            </span>
            <button
              type="button"
              onClick={onExploreAll}
              className="font-medium text-[#14bfb9] hover:text-[#111110] transition-colors underline underline-offset-4 cursor-pointer"
            >
              Skip to full archive →
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
