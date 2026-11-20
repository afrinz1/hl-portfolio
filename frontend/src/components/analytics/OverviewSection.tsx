import type { PortfolioOverview } from '../../api/types';
import {
  CountStat,
  Reveal,
  SectionHeading,
  StatCell,
  StatGrid,
} from './ChartKit';

export function OverviewSection({ overview }: { overview: PortfolioOverview }) {
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

      <Reveal delay={0.08}>
        <p className="mt-6 max-w-3xl text-[13px] leading-relaxed text-[#111110]/65">
          Every figure on this page is counted directly from the projects,
          categories and media records in the live database.
        </p>
      </Reveal>
    </section>
  );
}
