/**
 * "Insights" panel for the /trust dashboard.
 *
 * Renders the most recent active StudioInsight. When the row was produced by
 * the generate_insight management command it also carries a structured
 * analysis_data payload, which is shown as the three supporting lists.
 */

import { useEffect, useState } from 'react';
import { hecticApi } from '../../api/hecticApi';
import type { Insight } from '../../api/types';
import { Panel, Reveal, SectionHeading } from './ChartKit';

/** Shape written into ``StudioInsight.analysis_data`` by the generator. */
interface InsightAnalysis {
  highlights?: unknown;
  observations?: unknown;
  suggestions?: unknown;
}

function asLines(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function InsightsSection() {
  const [insight, setInsight] = useState<Insight | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    hecticApi
      .getInsights({ page: 1 })
      .then((res) => {
        if (!cancelled) setInsight(res.results[0] ?? null);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const summary = insight?.summary?.trim();
  if (!loaded || !insight || !summary) return null;

  const analysis =
    insight.analysis_data && typeof insight.analysis_data === 'object'
      ? (insight.analysis_data as InsightAnalysis)
      : null;
  // The insight always originates from the database; a missing generated
  // analysis_data payload does not make it demo data.
  const source = 'database';

  const groups = [
    { label: 'What stands out', items: asLines(analysis?.highlights) },
    { label: 'Observations', items: asLines(analysis?.observations) },
    { label: 'Suggested next steps', items: asLines(analysis?.suggestions) },
  ].filter((group) => group.items.length > 0);

  return (
    <section id="insights" className="scroll-mt-28" aria-label="Studio insights">
      <SectionHeading
        index="04"
        title="Insights"
        caption="A plain-language read of the numbers on this page."
        source={source}
      />

      <Reveal>
        <Panel title={insight.title} source={source}>
          <p className="max-w-3xl text-[15px] leading-[1.7] text-[#111110]/80">
            {summary}
          </p>

          {groups.length > 0 ? (
            <div className="mt-10 grid grid-cols-1 gap-x-16 gap-y-10 sm:grid-cols-3">
              {groups.map((group) => (
                <div key={group.label}>
                  <h4 className="font-mono-hl text-[11px] uppercase tracking-wider text-[#111110]/70">
                    {group.label}
                  </h4>
                  <ul className="mt-4 space-y-3">
                    {group.items.map((item) => (
                      <li
                        key={item}
                        className="flex gap-3 text-[13px] leading-relaxed text-[#111110]/75"
                      >
                        <span
                          aria-hidden="true"
                          className="mt-2 h-1 w-1 shrink-0 bg-[#14bfb9]"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : null}
        </Panel>
      </Reveal>
    </section>
  );
}
