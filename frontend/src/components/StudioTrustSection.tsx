import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { resolveMediaUrl } from '../api/client';
import { getProjectThumbnail } from '../api/hecticApi';
import type { Project, Service, StudioInfo } from '../api/types';

export function StudioTrustSection({
  studio,
  projects,
  services,
  totalProjects,
  loading,
}: {
  studio?: StudioInfo | null;
  projects: Project[];
  services: Service[];
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

  // Live services from the API. Only the first three fill the editorial cards;
  // if fewer are published, the unused cards are dropped.
  const cards = services
    .filter((service) => service.is_active !== false)
    .slice(0, 3);

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
            {/* Card 1 */}
            {cards[0] ? (
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
                  {cards[0].title || cards[0].name || 'Service'}
                </h3>
                {cards[0].description ? (
                  <p className="mt-2.5 text-[13px] sm:text-[13.5px] leading-relaxed text-[#f3f2ee]/65">
                    {cards[0].description}
                  </p>
                ) : null}
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
            ) : null}

            {/* Card 2 */}
            {cards[1] ? (
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
                  {cards[1].title || cards[1].name || 'Service'}
                </h3>
                {cards[1].description ? (
                  <p className="mt-2.5 text-[13px] sm:text-[13.5px] leading-relaxed text-[#f3f2ee]/65">
                    {cards[1].description}
                  </p>
                ) : null}
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
            ) : null}

            {/* Card 3 */}
            {cards[2] ? (
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
                  {cards[2].title || cards[2].name || 'Service'}
                </h3>
                {cards[2].description ? (
                  <p className="mt-2.5 text-[13px] sm:text-[13.5px] leading-relaxed text-[#f3f2ee]/65">
                    {cards[2].description}
                  </p>
                ) : null}
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
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
