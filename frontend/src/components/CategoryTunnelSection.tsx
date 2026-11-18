import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getProjectCategoryName,
  getProjectCategorySlug,
  getProjectThumbnail,
  getProjectVideo,
  hecticApi,
} from '../api/hecticApi';
import type { Project } from '../api/types';
import { EmptyState, ErrorState } from './StatusStates';

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

function wrapOffset(index: number, current: number, total: number): number {
  if (total === 0) return 0;
  let diff = (index - current) % total;
  if (diff > total / 2) diff -= total;
  if (diff < -total / 2) diff += total;
  return diff;
}

export function CategoryTunnelSection() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [hoveredId, setHoveredId] = useState<string | number | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [isDraggingUI, setIsDraggingUI] = useState(false);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const cardElsRef = useRef<Array<HTMLDivElement | null>>([]);
  const videoElsRef = useRef<Array<HTMLVideoElement | null>>([]);

  // Continuous physics state stored in refs for 60fps compositor updates without React re-renders
  const targetRef = useRef(0);
  const currentRef = useRef(0);
  const velocityRef = useRef(0);
  const isDraggingRef = useRef(false);
  const isHoveringRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragLastXRef = useRef(0);
  const dragDistanceRef = useRef(0);
  const activeIdxRef = useRef(0);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await hecticApi.getProjects({ page: 1 });
      setProjects(res.results);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load portfolio projects.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (projects.length === 0) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let rafId = 0;
    let lastTime = performance.now();

    const animate = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const total = projects.length;
      const width = viewportRef.current?.clientWidth || window.innerWidth;
      const isCompact = width < 768;
      const stepX = isCompact ? Math.min(220, width * 0.56) : Math.min(340, width * 0.25);

      if (!isDraggingRef.current) {
        // Apply release momentum
        if (Math.abs(velocityRef.current) > 0.0002) {
          targetRef.current += velocityRef.current;
          velocityRef.current *= Math.pow(0.08, dt);
        } else {
          velocityRef.current = 0;
          // Gentle continuous forward tunnel drift when idle
          if (!prefersReducedMotion && !isHoveringRef.current) {
            targetRef.current += dt * 0.22;
          }
        }
      }

      // Smooth exponential damping
      const lerpAlpha = prefersReducedMotion ? 1 : 1 - Math.exp(-8.5 * dt);
      currentRef.current += (targetRef.current - currentRef.current) * lerpAlpha;

      const cur = currentRef.current;
      const normalizedCur = ((Math.round(cur) % total) + total) % total;
      if (normalizedCur !== activeIdxRef.current) {
        activeIdxRef.current = normalizedCur;
        setActiveIdx(normalizedCur);
      }

      for (let i = 0; i < total; i++) {
        const el = cardElsRef.current[i];
        if (!el) continue;

        const rel = wrapOffset(i, cur, total);
        const absRel = Math.abs(rel);

        // Hide cards far outside tunnel view for clean performance
        if (absRel > 3.6) {
          el.style.opacity = '0';
          el.style.pointerEvents = 'none';
          const vid = videoElsRef.current[i];
          if (vid && !vid.paused) vid.pause();
          continue;
        }

        // 3D Tunnel perspective geometry:
        // Side cards angle inward forming tunnel walls and recede smoothly into Z depth
        const tx = rel * stepX;
        const tz = -Math.pow(absRel, 1.28) * (isCompact ? 150 : 210);
        const ry = clamp(rel * -21, -52, 52);
        const scale = Math.max(0.56, 1 - absRel * 0.11);
        const opacity = clamp(1 - Math.max(0, absRel - 1.8) * 0.58, 0, 1);

        el.style.transform = `translate3d(${tx}px, 0px, ${tz}px) rotateY(${ry}deg) scale(${scale})`;
        el.style.opacity = String(opacity);
        el.style.zIndex = String(Math.round(100 - absRel * 15));
        el.style.pointerEvents = opacity > 0.15 ? 'auto' : 'none';

        const vid = videoElsRef.current[i];
        if (vid) {
          if (absRel < 1.85 && vid.paused) {
            vid.play().catch(() => {});
          } else if (absRel >= 1.85 && !vid.paused) {
            vid.pause();
          }
        }
      }

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [projects]);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (projects.length === 0) return;
    const absX = Math.abs(e.deltaX);
    const absY = Math.abs(e.deltaY);

    // Horizontal trackpad swipe or Shift+Wheel captures cleanly
    if (absX > absY || e.shiftKey) {
      e.preventDefault();
      const delta = absX > absY ? e.deltaX : e.deltaY;
      targetRef.current += delta * 0.0032;
    } else {
      // Subtle non-blocking kinetic response to vertical scroll passing through
      targetRef.current += e.deltaY * 0.0011;
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (projects.length === 0) return;
    isDraggingRef.current = true;
    setIsDraggingUI(true);
    dragStartXRef.current = e.clientX;
    dragLastXRef.current = e.clientX;
    dragDistanceRef.current = 0;
    velocityRef.current = 0;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragLastXRef.current;
    dragLastXRef.current = e.clientX;
    dragDistanceRef.current += Math.abs(dx);
    const sensitivity = (viewportRef.current?.clientWidth || 1000) < 768 ? 0.0065 : 0.0038;
    const step = -dx * sensitivity;
    targetRef.current += step;
    velocityRef.current = step * 0.7;
  };

  const endDrag = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDraggingUI(false);
  };

  const stepTunnel = (dir: number) => {
    targetRef.current = Math.round(targetRef.current) + dir;
    velocityRef.current = 0;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      stepTunnel(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      stepTunnel(-1);
    }
  };

  const activeProject = projects[activeIdx] ?? null;

  return (
    <section
      aria-label="Explore the Work"
      className="bg-[#F3F0E9] text-[#111110] pt-20 pb-16 md:pt-28 md:pb-24 overflow-hidden select-none"
    >
      {/* Editorial Section Header */}
      <div className="mx-auto max-w-[1440px] px-6 md:px-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-display text-[clamp(44px,6.2vw,96px)] font-light uppercase leading-[0.9] tracking-[-0.055em]">
              EXPLORE THE WORK
            </h2>
            <p className="mt-2 font-mono-hl text-[11px] font-medium uppercase tracking-[-0.02em] text-[#0a0a0b]/75">
              WHAT WE CREATE — SLIDE THROUGH THE ARCHIVE.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => stepTunnel(-1)}
              aria-label="Previous project in tunnel"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#0a0a0b]/35 text-sm text-[#0a0a0b] transition-colors hover:bg-[#0a0a0b] hover:text-[#f3f2ee] cursor-pointer"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => stepTunnel(1)}
              aria-label="Next project in tunnel"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#0a0a0b]/35 text-sm text-[#0a0a0b] transition-colors hover:bg-[#0a0a0b] hover:text-[#f3f2ee] cursor-pointer"
            >
              →
            </button>
            <Link
              to="/work"
              className="inline-flex items-center justify-center rounded-full border border-[#0a0a0b]/70 px-7 py-2.5 text-[13px] font-normal tracking-tight text-[#0a0a0b] transition-colors hover:bg-[#0a0a0b] hover:text-[#f3f2ee] whitespace-nowrap"
            >
              all categories
            </Link>
          </div>
        </div>
      </div>

      {/* Loading / Error / Empty / 3D Tunnel Viewport */}
      {loading ? (
        <div className="mx-auto max-w-[1440px] px-6 md:px-12 mt-14">
          <div className="relative flex h-[430px] md:h-[520px] items-center justify-center gap-6 overflow-hidden">
            <div className="hidden md:block w-[220px] aspect-[4/5] animate-pulse bg-[#dfdeda] opacity-60 scale-90" />
            <div className="w-[260px] md:w-[320px] aspect-[4/5] animate-pulse bg-[#d5d4cf]" />
            <div className="hidden md:block w-[220px] aspect-[4/5] animate-pulse bg-[#dfdeda] opacity-60 scale-90" />
          </div>
        </div>
      ) : error ? (
        <div className="mx-auto max-w-[1440px] px-6 md:px-12 mt-12">
          <ErrorState message={error} onRetry={loadProjects} />
        </div>
      ) : projects.length === 0 ? (
        <div className="mx-auto max-w-[1440px] px-6 md:px-12 mt-12">
          <EmptyState
            title="No projects in tunnel yet"
            description="Published projects from the Django API will populate the 3D gallery."
          />
        </div>
      ) : (
        <>
          {/* 3D Perspective Sliding Tunnel Stage */}
          <div
            ref={viewportRef}
            tabIndex={0}
            role="region"
            aria-roledescription="3D sliding project tunnel"
            aria-label="Interactive 3D project gallery"
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onPointerLeave={() => {
              endDrag();
              isHoveringRef.current = false;
            }}
            onMouseEnter={() => {
              isHoveringRef.current = true;
            }}
            onMouseLeave={() => {
              isHoveringRef.current = false;
            }}
            onKeyDown={handleKeyDown}
            style={{ perspective: '1200px', touchAction: 'pan-y' }}
            className={`relative mt-10 md:mt-14 flex h-[440px] sm:h-[500px] md:h-[560px] w-full items-center justify-center overflow-hidden focus:outline-none ${
              isDraggingUI ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          >
            {/* Subtle Architectural Tunnel Guide Lines */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-8 h-px bg-[#0a0a0b]/10"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-8 h-px bg-[#0a0a0b]/10"
            />

            {/* 3D Stage Container */}
            <div
              style={{ transformStyle: 'preserve-3d' }}
              className="relative flex h-full w-full items-center justify-center"
            >
              {projects.map((proj, i) => {
                const thumb = getProjectThumbnail(proj);
                const video = getProjectVideo(proj);
                const categoryName = getProjectCategoryName(proj);
                const isBroken = failedImages[String(proj.id)];
                const isHovered = hoveredId === proj.id;
                const isFocusedCenter = i === activeIdx;

                return (
                  <div
                    key={proj.id}
                    ref={(el) => {
                      cardElsRef.current[i] = el;
                    }}
                    onMouseEnter={() => setHoveredId(proj.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => {
                      if (dragDistanceRef.current > 12) return;
                      const catSlug = getProjectCategorySlug(proj);
                      if (catSlug) {
                        navigate(`/categories/${catSlug}`);
                      } else {
                        navigate('/work');
                      }
                    }}
                    style={{
                      transformStyle: 'preserve-3d',
                      backfaceVisibility: 'hidden',
                    }}
                    className="group absolute w-[225px] sm:w-[270px] md:w-[320px] lg:w-[350px] will-change-transform cursor-pointer"
                  >
                    {/* Media Frame */}
                    <div
                      className={`relative aspect-[4/5] w-full overflow-hidden bg-[#0a0a0b] transition-shadow duration-500 ${
                        isFocusedCenter || isHovered
                          ? 'shadow-[0_28px_70px_-20px_rgba(10,10,11,0.42)]'
                          : 'shadow-[0_18px_45px_-22px_rgba(10,10,11,0.28)]'
                      }`}
                    >
                      {video ? (
                        <video
                          ref={(el) => {
                            videoElsRef.current[i] = el;
                          }}
                          src={video}
                          poster={thumb ?? undefined}
                          muted
                          loop
                          playsInline
                          preload="metadata"
                          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                        />
                      ) : thumb && !isBroken ? (
                        <img
                          src={thumb}
                          alt={proj.title}
                          draggable={false}
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          onError={() =>
                            setFailedImages((prev) => ({
                              ...prev,
                              [String(proj.id)]: true,
                            }))
                          }
                          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col justify-between bg-[#141416] p-6 text-[#f3f2ee]">
                          <span className="font-mono-hl text-[11px] uppercase text-[#2cf5ef]">
                            {categoryName}
                          </span>
                          <span className="font-display text-lg uppercase tracking-tight">
                            {proj.title}
                          </span>
                        </div>
                      )}

                      {/* Subtle Cyan Frame Border on Hover */}
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 border border-[#2cf5ef]/0 transition-colors duration-300 group-hover:border-[#2cf5ef]/75"
                      />

                      {/* Hover Overlay Metadata */}
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="font-mono-hl text-[10px] uppercase tracking-wider text-[#2cf5ef]">
                            {categoryName}
                          </span>
                          {proj.year || proj.release_year ? (
                            <span className="font-mono-hl text-[10px] text-[#f3f2ee]/75">
                              {proj.year || proj.release_year}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 font-display text-sm font-normal uppercase tracking-tight text-[#f3f2ee]">
                          {proj.title}
                        </p>
                      </div>
                    </div>

                    {/* Clean Index & Title Underneath */}
                    <div className="mt-3 flex items-baseline justify-between gap-3 px-0.5">
                      <p className="font-display text-[13.5px] font-normal uppercase tracking-tight text-[#0a0a0b] truncate">
                        <span className="font-mono-hl text-[#14bfb9]">
                          ( {i + 1} )
                        </span>{' '}
                        {proj.title}
                      </p>
                      <span className="font-mono-hl text-[10px] uppercase text-[#0a0a0b]/55 shrink-0">
                        {categoryName}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Focal Project Strip & Drag Hint */}
          <div className="mx-auto max-w-[1440px] px-6 md:px-12 mt-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-baseline gap-3">
              <span className="font-mono-hl text-xs text-[#14bfb9]">
                ( {activeIdx + 1} / {projects.length} )
              </span>
              {activeProject ? (
                <Link
                  to={`/categories/${getProjectCategorySlug(activeProject) || 'all'}`}
                  className="font-display text-base uppercase tracking-tight text-[#111110] hover:underline underline-offset-4"
                >
                  {getProjectCategoryName(activeProject)} Category
                </Link>
              ) : null}
            </div>

            <p className="font-mono-hl text-[11px] uppercase tracking-wider text-[#0a0a0b]/55">
              drag · scroll horizontally · click frame to open
            </p>
          </div>
        </>
      )}
    </section>
  );
}
