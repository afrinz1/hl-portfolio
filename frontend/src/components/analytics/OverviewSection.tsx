import type { InstagramAnalytics, WebsiteAnalytics } from '../../api/demoAnalytics';
import { DEMO_ANALYTICS_SOURCE } from '../../api/demoAnalytics';
import type { PortfolioOverview } from '../../api/types';
import {
  CountStat,
  Reveal,
  SectionHeading,
  StatCell,
  StatGrid,
  compactNumber,
} from './ChartKit';

function GroupLabel({
  title,
  meta,
  source,
}: {
  title: string;
  meta: string;
  source: 'database' | 'demo';
}) {
  return (
    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
      <h3 className="font-mono-hl text-[11px] uppercase tracking-wider text-[#111110]/70">
        {title}
      </h3>
      <span className="font-mono-hl text-[11px] text-[#111110]/65">
        {meta}
        {source === 'demo' ? ' · demo' : ''}
      </span>
    </div>
  );
}

export function OverviewSection({
  overview,
  website,
  instagram,
}: {
  overview: PortfolioOverview;
  website: WebsiteAnalytics;
  instagram: InstagramAnalytics;
}) {
  const { totals } = overview;
  const spanHint = totals.year_span
    ? `${totals.year_span.from} — ${totals.year_span.to}`
    : 'No years recorded';

  return (
    <section id="overview" className="scroll-mt-28" aria-label="Overview">
      <SectionHeading
        index="01"
        title="Overview"
        caption="The studio, by the numbers."
      />

      <Reveal>
        <GroupLabel
          title="Portfolio"
          meta="Aggregated from the live database"
          source="database"
        />
        <StatGrid>
          <StatCell>
            <CountStat
              label="Total projects"
              value={totals.projects}
              source="database"
              emphasis
            />
          </StatCell>
          <StatCell>
            <CountStat
              label="Categories"
              value={totals.categories}
              source="database"
              emphasis
            />
          </StatCell>
          <StatCell>
            <CountStat
              label="Media assets"
              value={totals.media_assets}
              source="database"
              emphasis
            />
          </StatCell>
          <StatCell>
            <CountStat
              label="Years covered"
              value={totals.years_covered}
              source="database"
              hint={spanHint}
              emphasis
            />
          </StatCell>
        </StatGrid>
      </Reveal>

      <Reveal delay={0.08} className="mt-10">
        <GroupLabel
          title="Website & social"
          meta={DEMO_ANALYTICS_SOURCE.window}
          source="demo"
        />
        <StatGrid>
          <StatCell>
            <CountStat
              label="Website visits"
              value={website.totals.visits}
              format={compactNumber}
              source="demo"
            />
          </StatCell>
          <StatCell>
            <CountStat
              label="Unique visitors"
              value={website.totals.uniqueVisitors}
              format={compactNumber}
              source="demo"
            />
          </StatCell>
          <StatCell>
            <CountStat
              label="Instagram views"
              value={instagram.totals.views}
              format={compactNumber}
              source="demo"
            />
          </StatCell>
          <StatCell>
            <CountStat
              label="Instagram followers"
              value={instagram.totals.followers}
              format={compactNumber}
              source="demo"
              hint={`+${instagram.followerGrowth.changePercent}% over the window`}
            />
          </StatCell>
        </StatGrid>
      </Reveal>

      <Reveal delay={0.12}>
        <p className="mt-6 max-w-3xl text-[13px] leading-relaxed text-[#111110]/65">
          Portfolio figures are counted directly from the projects, categories and
          media records. Website and Instagram figures are{' '}
          <span className="text-[#111110]/80">demo placeholders</span> until those
          collectors are connected — {DEMO_ANALYTICS_SOURCE.note}
        </p>
      </Reveal>
    </section>
  );
}
