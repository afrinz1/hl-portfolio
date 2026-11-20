import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { hecticApi } from '../api/hecticApi';
import type { PortfolioOverview, StudioInfo } from '../api/types';
import { InsightsSection } from '../components/analytics/InsightsSection';
import { OverviewSection } from '../components/analytics/OverviewSection';
import { PortfolioAnalyticsSection } from '../components/analytics/PortfolioAnalyticsSection';
import { ReleasesSection } from '../components/analytics/ReleasesSection';
import { CyanFooter } from '../components/CyanFooter';
import { Navbar } from '../components/Navbar';
import { PageShell } from '../components/PageShell';
import { ErrorState } from '../components/StatusStates';

const SECTION_LINKS = [
  { label: 'overview', href: '#overview' },
  { label: 'portfolio', href: '#portfolio' },
  { label: 'releases', href: '#releases' },
  { label: 'insights', href: '#insights' },
];

function formatGeneratedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function LoadingDashboard() {
  return (
    <div aria-label="Loading analytics" role="status" className="space-y-16">
      <div className="grid grid-cols-2 gap-px bg-[#111110]/10 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-4 bg-[#F3F0E9] px-5 py-6">
            <div className="h-3 w-24 animate-pulse bg-[#e8e7e1]" />
            <div className="h-12 w-32 animate-pulse bg-[#e8e7e1]" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-x-16 gap-y-14 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="h-3 w-40 animate-pulse bg-[#e8e7e1]" />
          <div className="mt-6 space-y-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-3 w-1/2 animate-pulse bg-[#e8e7e1]" />
                <div className="h-[3px] w-full animate-pulse bg-[#e8e7e1]" />
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-5">
          <div className="h-3 w-28 animate-pulse bg-[#e8e7e1]" />
          <div className="mt-6 h-44 w-full animate-pulse bg-[#e8e7e1]" />
        </div>
      </div>

      <div className="h-[260px] w-full animate-pulse bg-[#e8e7e1]" />
    </div>
  );
}

export function TrustPage() {
  const [overview, setOverview] = useState<PortfolioOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studio, setStudio] = useState<StudioInfo | null>(null);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await hecticApi.getAnalyticsOverview();
      setOverview(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load portfolio analytics.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  // Studio details only feed the shared footer, so a failure is harmless.
  useEffect(() => {
    let cancelled = false;

    hecticApi
      .getStudioInfo({ page: 1 })
      .then((res) => {
        if (!cancelled) setStudio(res.results[0] ?? null);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F3F0E9] text-[#111110]">
      <Navbar />

      <PageShell>
        {/* Masthead */}
        <header className="border-b border-[#111110]/14 pb-10">
          <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-8">
            <div>
              <p className="font-mono-hl text-[11px] uppercase tracking-wider text-[#14bfb9]">
                Trust & transparency report
              </p>
              <h1 className="mt-4 font-display text-[clamp(44px,6vw,88px)] font-light uppercase leading-[0.94] tracking-[-0.05em]">
                Studio
                <br />
                Analytics
              </h1>
            </div>

            <div className="max-w-sm">
              <p className="text-[15px] leading-[1.6] text-[#111110]/70">
                Every figure the studio can stand behind — the archive, its
                shape, and when the work was made.
              </p>
              <Link
                to="/work"
                className="mt-6 inline-flex items-center justify-center rounded-full border border-[#111110]/35 px-7 py-3 text-[13px] tracking-tight transition-colors hover:bg-[#111110] hover:text-[#F3F0E9]"
              >
                see the work
              </Link>
            </div>
          </div>

          {/* Provenance strip */}
          <dl className="mt-12 grid grid-cols-1 gap-px bg-[#111110]/14">
            <div className="bg-[#F3F0E9] px-4 py-5 sm:px-5">
              <dt className="font-mono-hl text-[10px] uppercase tracking-wider text-[#14bfb9]">
                ● Live database
              </dt>
              <dd className="mt-2 text-[13px] leading-relaxed text-[#111110]/70">
                Projects, categories, media and release years — every figure on
                this page is counted from the portfolio records.
              </dd>
            </div>
          </dl>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-x-8 gap-y-2">
            <nav aria-label="Dashboard sections" className="flex flex-wrap gap-x-6 gap-y-2">
              {SECTION_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="font-mono-hl text-[11px] uppercase tracking-wider text-[#111110]/65 transition-colors hover:text-[#14bfb9]"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <p className="font-mono-hl text-[11px] text-[#111110]/65">
              {overview
                ? `Generated ${formatGeneratedAt(overview.generated_at)}`
                : 'Loading report…'}
            </p>
          </div>
        </header>

        {/* Body */}
        <div className="pt-16">
          {loading ? (
            <LoadingDashboard />
          ) : error ? (
            <ErrorState message={error} onRetry={loadOverview} />
          ) : !overview ? (
            <ErrorState
              message="No analytics payload was returned by the API."
              onRetry={loadOverview}
            />
          ) : (
            <div className="space-y-24 md:space-y-32">
              <OverviewSection overview={overview} />
              <PortfolioAnalyticsSection overview={overview} />
              <ReleasesSection overview={overview} />
              <InsightsSection />
            </div>
          )}
        </div>
      </PageShell>

      <CyanFooter studio={studio} />
    </div>
  );
}
