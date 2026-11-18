import { useCallback, useEffect, useState } from 'react';
import { resolveMediaUrl } from '../api/client';
import { hecticApi } from '../api/hecticApi';
import type { Insight } from '../api/types';
import { EmptyState, ErrorState } from './StatusStates';

export function OffTheTimelineSection() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInsights = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await hecticApi.getInsights({ page: 1 });
      setInsights(
        response.results
          .filter((item) => item.is_active !== false)
          .slice(0, 3)
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load studio insights.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  return (
    <section
      aria-labelledby="off-the-timeline-heading"
      className="border-t border-[#111110]/15 bg-[#F3F0E9] py-16 text-[#111110] md:py-24"
    >
      <div className="mx-auto max-w-[1440px] px-6 md:px-12">
        <div className="mb-10">
          <h2
            id="off-the-timeline-heading"
            className="font-display text-3xl font-normal uppercase tracking-tight md:text-4xl"
          >
            OFF THE TIMELINE
          </h2>
          <p className="mt-2 font-mono-hl text-[11px] uppercase tracking-wider text-[#111110]/65">
            A FEW INTERESTING PROJECTS, NOTES OR OBSERVATIONS.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3" aria-label="Loading insights">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="space-y-3">
                <div className="aspect-[16/10] animate-pulse bg-[#e8e7e1]" />
                <div className="h-5 w-3/4 animate-pulse bg-[#e8e7e1]" />
                <div className="h-12 w-full animate-pulse bg-[#e8e7e1]" />
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={loadInsights} />
        ) : insights.length === 0 ? (
          <EmptyState
            title="No studio insights yet"
            description="Journal notes and production dispatches will appear here once published."
          />
        ) : (
          <div className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-3">
            {insights.map((item, idx) => {
              const image = resolveMediaUrl(item.image || item.cover_image || null);
              const body = item.summary || item.excerpt || item.content;
              const dateRaw =
                item.generated_at || item.published_at || item.created_at;
              const parsedDate = dateRaw ? new Date(dateRaw) : null;
              const dateLabel =
                parsedDate && !Number.isNaN(parsedDate.getTime())
                  ? parsedDate.toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : null;

              return (
                <article key={item.uuid || item.id} className="flex flex-col">
                  {image ? (
                    <div className="mb-4 aspect-[16/10] w-full overflow-hidden bg-[#e8e7e1]">
                      <img
                        src={image}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : null}
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-mono-hl text-xs text-[#14bfb9]">
                      ({String(idx + 1).padStart(2, '0')})
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
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
