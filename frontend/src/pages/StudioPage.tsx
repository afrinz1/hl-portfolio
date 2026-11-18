import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { resolveMediaUrl } from '../api/client';
import { hecticApi } from '../api/hecticApi';
import type { Insight, Service, StudioInfo } from '../api/types';
import { CyanFooter } from '../components/CyanFooter';
import { InquiryCta } from '../components/InquiryCta';
import { Navbar } from '../components/Navbar';
import { PageShell } from '../components/PageShell';
import {
  EmptyState,
  ErrorState,
  PaginationBar,
  SkeletonBlock,
} from '../components/StatusStates';

/** Pull the short string lines out of an analysis_data field, ignoring anything else. */
function asLines(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function StudioPage() {
  const [studio, setStudio] = useState<StudioInfo | null>(null);
  const [studioLoading, setStudioLoading] = useState(true);
  const [studioError, setStudioError] = useState<string | null>(null);

  const [services, setServices] = useState<Service[]>([]);
  const [servicesCount, setServicesCount] = useState(0);
  const [servicesNext, setServicesNext] = useState(false);
  const [servicesPrev, setServicesPrev] = useState(false);
  const [servicesPage, setServicesPage] = useState(1);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState<string | null>(null);

  const [insights, setInsights] = useState<Insight[]>([]);
  const [insightsCount, setInsightsCount] = useState(0);
  const [insightsNext, setInsightsNext] = useState(false);
  const [insightsPrev, setInsightsPrev] = useState(false);
  const [insightsPage, setInsightsPage] = useState(1);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  const loadStudio = useCallback(async () => {
    setStudioLoading(true);
    setStudioError(null);
    try {
      const res = await hecticApi.getStudioInfo({ page: 1 });
      setStudio(res.results[0] ?? null);
    } catch (err) {
      setStudioError(
        err instanceof Error ? err.message : 'Failed to load studio information.'
      );
    } finally {
      setStudioLoading(false);
    }
  }, []);

  const loadServices = useCallback(async (targetPage: number) => {
    setServicesLoading(true);
    setServicesError(null);
    try {
      const res = await hecticApi.getServices({ page: targetPage });
      setServices(res.results);
      setServicesCount(res.count);
      setServicesNext(Boolean(res.next));
      setServicesPrev(Boolean(res.previous));
    } catch (err) {
      setServicesError(
        err instanceof Error ? err.message : 'Failed to load studio services.'
      );
    } finally {
      setServicesLoading(false);
    }
  }, []);

  const loadInsights = useCallback(async (targetPage: number) => {
    setInsightsLoading(true);
    setInsightsError(null);
    try {
      const res = await hecticApi.getInsights({ page: targetPage });
      setInsights(res.results);
      setInsightsCount(res.count);
      setInsightsNext(Boolean(res.next));
      setInsightsPrev(Boolean(res.previous));
    } catch (err) {
      setInsightsError(
        err instanceof Error ? err.message : 'Failed to load studio insights.'
      );
    } finally {
      setInsightsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudio();
  }, [loadStudio]);

  useEffect(() => {
    loadServices(servicesPage);
  }, [servicesPage, loadServices]);

  useEffect(() => {
    loadInsights(insightsPage);
  }, [insightsPage, loadInsights]);

  const studioImg = resolveMediaUrl(studio?.image || studio?.cover_image || null);
  const studioLogo = resolveMediaUrl(studio?.logo_url || null);
  const description = studio?.description || studio?.bio;
  const about =
    studio?.about && studio.about !== description ? studio.about : null;
  const approach = studio?.approach || studio?.creative_approach;
  const location = studio?.location || studio?.address;
  const orderedServices = services
    .filter((service) => service.is_active !== false)
    .slice()
    .sort(
      (a, b) =>
        (a.display_order ?? a.order ?? 0) - (b.display_order ?? b.order ?? 0)
    );
  const activeInsights = insights.filter((item) => item.is_active !== false);
  const studioSections = [
    { label: 'ABOUT THE STUDIO', body: about },
    { label: 'OUR VISION', body: studio?.vision ?? null },
    { label: 'CREATIVE APPROACH', body: approach },
  ].filter(
    (section): section is { label: string; body: string } => Boolean(section.body)
  );

  return (
    <div className="min-h-screen bg-[#F3F0E9] text-[#111110]">
      <Navbar />

      <PageShell>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between mb-14">
          <div className="flex items-center gap-5">
            {studioLogo ? (
              <img
                src={studioLogo}
                alt=""
                className="h-14 w-14 shrink-0 object-contain"
              />
            ) : null}
            <div>
              <h1 className="font-display text-[clamp(44px,6vw,88px)] font-light uppercase leading-[0.94] tracking-[-0.05em]">
                {studio?.name || 'HECTIC LAB'}
              </h1>
              <p className="mt-2 font-mono-hl text-[11px] font-medium uppercase tracking-[-0.02em] text-[#111110]/70">
                {studio?.tagline || 'INDEPENDENT VIDEO PRODUCTION.'}
              </p>
            </div>
          </div>

          <Link
            to="/studio#services"
            className="inline-flex items-center justify-center self-start rounded-full border border-[#111110]/35 px-7 py-3 text-[13px] font-normal tracking-tight text-[#111110] transition-colors hover:bg-[#111110] hover:text-[#F3F0E9] whitespace-nowrap"
          >
            explore services
          </Link>
        </div>

        {/* Studio Details Section */}
        {studioLoading ? (
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start" aria-label="Loading studio">
            <SkeletonBlock className="lg:col-span-6 aspect-[4/3]" />
            <div className="lg:col-span-6 space-y-4">
              <SkeletonBlock className="h-8 w-2/3" />
              <SkeletonBlock className="h-24 w-full" />
              <SkeletonBlock className="h-20 w-5/6" />
            </div>
          </div>
        ) : studioError ? (
          <ErrorState message={studioError} onRetry={loadStudio} />
        ) : !studio ? (
          <EmptyState
            title="Studio profile unavailable"
            description="Studio details have not been published yet."
          />
        ) : (
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start">
            {studioImg ? (
              <div className="lg:sticky lg:top-24 lg:col-span-6 lg:self-start">
                <div className="aspect-[4/3] overflow-hidden bg-[#e8e7e1]">
                  <img
                    src={studioImg}
                    alt={studio.name || 'Hectic Lab Studio'}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            ) : null}

            <div className={studioImg ? 'lg:col-span-6' : 'lg:col-span-9'}>
              {description ? (
                <p className="max-w-2xl text-lg leading-[1.5] text-[#111110]/85">
                  {description}
                </p>
              ) : null}

              {studioSections.length > 0 ? (
                <dl className="mt-8 divide-y divide-[#111110]/15 border-t border-[#111110]/15">
                  {studioSections.map((section) => (
                    <div
                      key={section.label}
                      className="grid gap-2 py-6 md:grid-cols-[170px_1fr] md:gap-8"
                    >
                      <dt className="font-mono-hl text-[11px] uppercase tracking-wider text-[#14bfb9]">
                        {section.label}
                      </dt>
                      <dd className="text-[15px] leading-[1.65] text-[#111110]/80">
                        {section.body}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : null}

              {(studio.email || studio.phone || location || studio.founded_year) ? (
                <div className="grid grid-cols-1 gap-6 border-t border-[#111110]/15 pt-6 sm:grid-cols-2">
                  {studio.email ? (
                    <div>
                      <p className="font-mono-hl text-[11px] uppercase text-[#111110]/65">
                        EMAIL
                      </p>
                      <a
                        href={`mailto:${studio.email}`}
                        className="mt-1 inline-block text-sm hover:underline underline-offset-4"
                      >
                        {studio.email}
                      </a>
                    </div>
                  ) : null}
                  {studio.phone ? (
                    <div>
                      <p className="font-mono-hl text-[11px] uppercase text-[#111110]/65">
                        PHONE
                      </p>
                      <p className="mt-1 font-mono-hl text-sm">{studio.phone}</p>
                    </div>
                  ) : null}
                  {location ? (
                    <div>
                      <p className="font-mono-hl text-[11px] uppercase text-[#111110]/65">
                        BASED IN
                      </p>
                      <p className="mt-1 text-sm">{location}</p>
                    </div>
                  ) : null}
                  {studio.founded_year ? (
                    <div>
                      <p className="font-mono-hl text-[11px] uppercase text-[#111110]/65">
                        ESTABLISHED
                      </p>
                      <p className="mt-1 font-mono-hl text-sm">{studio.founded_year}</p>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        )}

        <section
          id="services"
          aria-labelledby="services-heading"
          className="mt-24 scroll-mt-28 border-t border-[#111110]/15 pt-14 md:scroll-mt-32"
        >
          <div className="mb-10">
            <h2
              id="services-heading"
              className="font-display text-3xl font-normal uppercase tracking-tight md:text-4xl"
            >
              SERVICES
            </h2>
            <p className="mt-2 font-mono-hl text-[11px] uppercase tracking-wider text-[#111110]/65">
              GOOD FOOTAGE. BETTER EDITS. GOOD WORK.
            </p>
          </div>

          {servicesLoading ? (
            <div className="divide-y divide-[#111110]/15" aria-label="Loading services">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="grid grid-cols-1 gap-6 py-10 md:grid-cols-12">
                  <SkeletonBlock className="h-8 w-64 md:col-span-5" />
                  <div className="space-y-3 md:col-span-7">
                    <SkeletonBlock className="h-4 w-full" />
                    <SkeletonBlock className="h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : servicesError ? (
            <ErrorState
              message={servicesError}
              onRetry={() => loadServices(servicesPage)}
            />
          ) : orderedServices.length === 0 ? (
            <EmptyState
              title="No services listed yet"
              description="Available production and creative services will appear here."
            />
          ) : (
            <>
              <div className="border-t border-[#111110]/15 divide-y divide-[#111110]/15">
                {orderedServices.map((service, idx) => {
                  const title = service.title || service.name || 'Service';
                  const image = resolveMediaUrl(service.image_url || null);
                  const number = String(idx + 1).padStart(2, '0');
                  const deliverables = Array.isArray(service.deliverables)
                    ? service.deliverables
                    : typeof service.deliverables === 'string'
                      ? service.deliverables
                          .split(/[,\n]/)
                          .map((item) => item.trim())
                          .filter(Boolean)
                      : [];

                  return (
                    <article
                      key={service.uuid || service.id}
                      id={`service-${service.slug || service.id}`}
                      className="grid grid-cols-1 gap-6 py-10 md:grid-cols-12 md:items-start"
                    >
                      <div className="md:col-span-5">
                        <span className="font-mono-hl text-sm text-[#14bfb9]">
                          ({number})
                        </span>
                        <h3 className="mt-2 font-display text-2xl font-normal tracking-tight text-[#111110] md:text-3xl">
                          {title}
                        </h3>
                        {image ? (
                          <div className="mt-5 h-56 w-full overflow-hidden bg-[#e8e7e1] md:h-64">
                            <img
                              src={image}
                              alt={title}
                              referrerPolicy="no-referrer"
                              loading="lazy"
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : null}
                      </div>

                      <div className="space-y-4 md:col-span-7">
                        {service.description ? (
                          <p className="text-[15px] leading-[1.65] text-[#111110]/80">
                            {service.description}
                          </p>
                        ) : null}
                        {deliverables.length > 0 ? (
                          <p className="font-mono-hl text-xs text-[#111110]/60">
                            {deliverables.join(' · ')}
                          </p>
                        ) : null}
                        <Link
                          to={`/inquiries?service=${encodeURIComponent(String(service.id))}`}
                          className="font-mono-hl inline-block pt-2 text-xs tracking-wide text-[#14bfb9] underline underline-offset-4 hover:text-[#111110]"
                        >
                          Let&apos;s talk about {title.toLowerCase()} →
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>

              <PaginationBar
                count={servicesCount}
                currentPage={servicesPage}
                hasNext={servicesNext}
                hasPrevious={servicesPrev}
                onPageChange={setServicesPage}
                itemCountOnPage={services.length}
              />
            </>
          )}
        </section>

        {/* Insights Section */}
        <section className="mt-24 border-t border-[#111110]/15 pt-14">
          <div className="mb-10">
            <h2 className="font-display text-3xl font-normal uppercase tracking-tight md:text-4xl">
              OFF THE TIMELINE
            </h2>
            <p className="mt-2 font-mono-hl text-[11px] uppercase tracking-wider text-[#111110]/65">
              A FEW THINGS WE&apos;VE BEEN WORKING ON.
            </p>
          </div>

          {insightsLoading ? (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="space-y-3">
                  <SkeletonBlock className="aspect-[16/10]" />
                  <SkeletonBlock className="h-5 w-3/4" />
                  <SkeletonBlock className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : insightsError ? (
            <ErrorState
              message={insightsError}
              onRetry={() => loadInsights(insightsPage)}
            />
          ) : activeInsights.length === 0 ? (
            <EmptyState
              title="No studio insights yet"
              description="Journal notes and production dispatches will appear here once published."
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-3">
                {activeInsights.map((item, idx) => {
                  const img = resolveMediaUrl(item.image || item.cover_image || null);
                  const body = item.summary || item.excerpt || item.content;
                  const dateRaw =
                    item.generated_at || item.published_at || item.created_at;
                  const dateLabel = dateRaw
                    ? new Date(dateRaw).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : null;
                  const analysis =
                    item.analysis_data && typeof item.analysis_data === 'object'
                      ? (item.analysis_data as Record<string, unknown>)
                      : null;
                  const analysisGroups = [
                    { label: 'What stands out', items: asLines(analysis?.highlights) },
                    { label: 'Observations', items: asLines(analysis?.observations) },
                    { label: 'Suggested next steps', items: asLines(analysis?.suggestions) },
                  ].filter((group) => group.items.length > 0);

                  return (
                    <article
                      key={item.uuid || item.id}
                      id={item.slug ? `insight-${item.slug}` : undefined}
                      className="flex flex-col"
                    >
                      {img ? (
                        <div className="mb-4 aspect-[16/10] w-full overflow-hidden bg-[#18181b]">
                          <img
                            src={img}
                            alt={item.title}
                            referrerPolicy="no-referrer"
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : null}

                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-mono-hl text-xs text-[#14bfb9]">
                          ( {idx + 1} )
                        </span>
                        {dateLabel ? (
                          <span className="font-mono-hl text-[11px] text-[#111110]/65">
                            {dateLabel}
                          </span>
                        ) : null}
                      </div>

                      <h3 className="mt-2 font-display text-xl font-medium tracking-tight">
                        {item.title}
                      </h3>

                      {body ? (
                        <p className="mt-2 text-sm leading-relaxed text-[#111110]/75">
                          {body}
                        </p>
                      ) : null}
                      {analysisGroups.length > 0 ? (
                        <dl className="mt-4 space-y-4 border-t border-[#111110]/15 pt-4">
                          {analysisGroups.map((group) => (
                            <div key={group.label}>
                              <dt className="font-mono-hl text-[11px] uppercase tracking-wider text-[#14bfb9]">
                                {group.label}
                              </dt>
                              <dd className="mt-1.5">
                                <ul className="space-y-1 text-sm leading-relaxed text-[#111110]/75">
                                  {group.items.map((line, lineIdx) => (
                                    <li key={lineIdx} className="flex gap-2">
                                      <span aria-hidden="true" className="text-[#14bfb9]">
                                        —
                                      </span>
                                      <span>{line}</span>
                                    </li>
                                  ))}
                                </ul>
                              </dd>
                            </div>
                          ))}
                        </dl>
                      ) : null}
                    </article>
                  );
                })}
              </div>

              <PaginationBar
                count={insightsCount}
                currentPage={insightsPage}
                hasNext={insightsNext}
                hasPrevious={insightsPrev}
                onPageChange={setInsightsPage}
                itemCountOnPage={activeInsights.length}
              />
            </>
          )}
        </section>
      </PageShell>

      <InquiryCta variant="dark" />
      <CyanFooter studio={studio} />
    </div>
  );
}
