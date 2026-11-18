import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { resolveMediaUrl } from '../api/client';
import { getProjectThumbnail } from '../api/hecticApi';
import type { Project, StudioInfo } from '../api/types';

export function StudioTrustSection({
  studio,
  projects,
  totalProjects,
  loading,
}: {
  studio?: StudioInfo | null;
  projects: Project[];
  totalProjects: number | null;
  loading: boolean;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);
  const [displayCount, setDisplayCount] = useState<number>(0);

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.18 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || totalProjects === null) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced || totalProjects <= 0) {
      setDisplayCount(totalProjects);
      return;
    }

    let rafId = 0;
    const duration = 1100;
    const start = performance.now();

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayCount(Math.round(eased * totalProjects));
      if (t < 1) {
        rafId = requestAnimationFrame(step);
      }
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [inView, totalProjects]);

  const portraitSources = projects
    .map((p) => ({ id: p.id, title: p.title, src: getProjectThumbnail(p) }))
    .filter((item): item is { id: string | number; title: string; src: string } =>
      Boolean(item.src)
    )
    .slice(0, 6);

  const studioCover =
    resolveMediaUrl(studio?.image || studio?.cover_image || null) ||
    portraitSources[0]?.src ||
    null;

  return (
    <section
      aria-label="What We Do — Production & Post-Production"
      className="relative bg-[#060607] text-[#f3f2ee] pb-20 md:pb-28"
    >
      <div className="mx-auto max-w-[1440px] px-6 md:px-12">
        <div
          ref={panelRef}
          className="rounded-2xl border border-[#f3f2ee]/10 bg-[#f3f2ee]/[0.025] p-5 sm:p-8 md:p-14"
        >
          {/* Header Row */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <h2 className="font-display text-[clamp(36px,5.5vw,72px)] font-light uppercase leading-[0.92] tracking-[-0.05em] text-balance text-[#f3f2ee]">
                WHAT <span className="font-semibold">WE DO</span>
              </h2>
              <p className="mt-3 font-mono-hl text-[11px] sm:text-[12px] font-medium uppercase tracking-wider text-[#2cf5ef]">
                FROM RAW FOOTAGE TO THE FINAL FRAME.
              </p>
            </div>

            <div className="lg:col-span-5">
              <p className="text-[13.5px] leading-[1.65] text-[#f3f2ee]/70 sm:text-[14.5px] md:text-[15px]">
                We&apos;re a small creative studio working with video, visuals, and everything that happens between the first shot and the final export.
              </p>
            </div>
          </div>

          {/* Three Editorial Cards */}
          <div className="mt-8 sm:mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
            {/* Card 1: Editing & Post-production */}
            <article className="group min-w-0 flex flex-col justify-between rounded-xl border border-[#f3f2ee]/12 bg-[#121214] p-5 sm:p-6 md:p-7 transition-colors duration-300 hover:border-[#f3f2ee]/25">
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="font-mono-hl text-[11px] uppercase tracking-wider text-[#2cf5ef]">
                    (01)
                  </span>
                  <span className="font-mono-hl text-[11px] uppercase tracking-wider text-[#f3f2ee]/45">
                    Post-Production
                  </span>
                </div>
                <h3 className="mt-3 sm:mt-4 font-display text-lg sm:text-xl font-normal leading-tight tracking-tight text-[#f3f2ee]">
                  Editing &amp; Post-production
                </h3>
                <p className="mt-2.5 text-[13px] sm:text-[13.5px] leading-relaxed text-[#f3f2ee]/65">
                  The edit is where everything comes together. We work on pacing, transitions, colour, sound, and the smaller details that make a film feel complete.
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-[#f3f2ee]/10">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2 overflow-hidden">
                    {portraitSources.slice(0, 4).map((item) => (
                      <div
                        key={item.id}
                        className="inline-block h-8 w-8 rounded-full ring-2 ring-[#121214] overflow-hidden bg-[#18181b]"
                      >
                        <img
                          src={item.src}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          className="h-full w-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
                        />
                      </div>
                    ))}
                  </div>
                  <span className="font-mono-hl text-[10px] uppercase text-[#f3f2ee]/50 tracking-wider">
                    Pacing · Colour · Sound
                  </span>
                </div>
              </div>
            </article>

            {/* Card 2: Video Production */}
            <article className="group min-w-0 flex flex-col justify-between rounded-xl border border-[#f3f2ee]/12 bg-[#121214] p-5 sm:p-6 md:p-7 transition-colors duration-300 hover:border-[#f3f2ee]/25">
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="font-mono-hl text-[11px] uppercase tracking-wider text-[#2cf5ef]">
                    (02)
                  </span>
                  <span className="font-mono-hl text-[11px] uppercase tracking-wider text-[#f3f2ee]/45">
                    Cinematography
                  </span>
                </div>
                <h3 className="mt-3 sm:mt-4 font-display text-lg sm:text-xl font-normal leading-tight tracking-tight text-[#f3f2ee]">
                  Video Production
                </h3>
                <p className="mt-2.5 text-[13px] sm:text-[13.5px] leading-relaxed text-[#f3f2ee]/65">
                  From planning a shoot to capturing the footage, we work on bringing visual ideas to life through camera work and production.
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-[#f3f2ee]/10 flex items-center justify-between">
                <div>
                  <div className="font-display text-2xl font-light text-[#f3f2ee] tabular-nums">
                    {totalProjects !== null ? String(displayCount).padStart(2, '0') : '—'}
                  </div>
                  <span className="font-mono-hl text-[10px] uppercase text-[#f3f2ee]/50 tracking-wider">
                    Indexed Productions
                  </span>
                </div>
                <Link
                  to="/studio#services"
                  className="font-mono-hl text-[11px] uppercase tracking-wider text-[#2cf5ef] hover:underline underline-offset-4"
                >
                  services →
                </Link>
              </div>
            </article>

            {/* Card 3: Creative Projects */}
            <article className="group min-w-0 flex flex-col justify-between rounded-xl border border-[#f3f2ee]/12 bg-[#121214] p-5 sm:p-6 md:p-7 transition-colors duration-300 hover:border-[#f3f2ee]/25">
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="font-mono-hl text-[11px] uppercase tracking-wider text-[#2cf5ef]">
                    (03)
                  </span>
                  <span className="font-mono-hl text-[11px] uppercase tracking-wider text-[#f3f2ee]/45">
                    Collaboration
                  </span>
                </div>
                <h3 className="mt-3 sm:mt-4 font-display text-lg sm:text-xl font-normal leading-tight tracking-tight text-[#f3f2ee]">
                  Creative Projects
                </h3>
                <p className="mt-2.5 text-[13px] sm:text-[13.5px] leading-relaxed text-[#f3f2ee]/65">
                  We collaborate on projects across automotive, commercial, fashion, events, product, and creative films. Different subjects, different approaches, always focused on the final result.
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-[#f3f2ee]/10 flex items-center justify-between">
                <span className="font-mono-hl text-[10px] uppercase text-[#f3f2ee]/50 tracking-wider">
                  Automotive · Fashion · Film
                </span>
                <Link
                  to="/work"
                  className="font-mono-hl text-[11px] uppercase tracking-wider text-[#2cf5ef] hover:underline underline-offset-4"
                >
                  explore all →
                </Link>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
