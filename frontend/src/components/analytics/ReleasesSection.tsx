/**
 * "Releases" panel for the /trust dashboard.
 *
 * Replaces the former Instagram section: there is no audience collection
 * source, so every figure here is counted from the live portfolio records
 * (release years) rather than an invented Instagram feed.
 */

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { PortfolioOverview } from '../../api/types';
import {
  AXIS_TICK,
  ChartTooltip,
  CountStat,
  GRID_STROKE,
  HL,
  Panel,
  Reveal,
  SectionHeading,
  StatCell,
  StatGrid,
  fullNumber,
} from './ChartKit';

export function ReleasesSection({ overview }: { overview: PortfolioOverview }) {
  const { totals } = overview;
  const byYear = overview.projects_by_year ?? [];
  const peak = byYear.reduce(
    (best, row) => (row.projects > best.projects ? row : best),
    { year: 0, label: '', projects: 0 }
  );

  const spanHint = totals.year_span
    ? `${totals.year_span.from} — ${totals.year_span.to}`
    : 'No years recorded';

  return (
    <section id="releases" className="scroll-mt-28" aria-label="Release timeline">
      <SectionHeading
        index="03"
        title="Releases"
        caption="When the work was made."
        source="database"
      />

      <Reveal>
        <StatGrid>
          <StatCell>
            <CountStat
              label="Years covered"
              value={totals.years_covered}
              source="database"
              hint={spanHint}
              emphasis
            />
          </StatCell>
          <StatCell>
            <CountStat
              label="First release"
              value={totals.year_span?.from ?? 0}
              format={(value) => (totals.year_span ? String(Math.round(value)) : '—')}
              source="database"
              emphasis
            />
          </StatCell>
          <StatCell>
            <CountStat
              label="Latest release"
              value={totals.year_span?.to ?? 0}
              format={(value) => (totals.year_span ? String(Math.round(value)) : '—')}
              source="database"
              emphasis
            />
          </StatCell>
          <StatCell>
            <CountStat
              label="Peak year"
              value={peak.projects > 0 ? peak.year : 0}
              format={(value) => (peak.projects > 0 ? String(Math.round(value)) : '—')}
              source="database"
              hint={peak.projects > 0 ? `${fullNumber(peak.projects)} projects` : undefined}
              emphasis
            />
          </StatCell>
        </StatGrid>
      </Reveal>

      <Reveal className="mt-14">
        <Panel
          title="Releases by year"
          meta={
            byYear.length > 0
              ? `${totals.projects} projects across ${byYear.length} ${
                  byYear.length === 1 ? 'year' : 'years'
                }`
              : 'No release years recorded'
          }
          source="database"
        >
          {byYear.length === 0 ? (
            <p className="py-10 text-sm text-[#111110]/65">
              No projects with a release year yet.
            </p>
          ) : (
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={byYear}
                  margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
                >
                  <CartesianGrid vertical={false} stroke={GRID_STROKE} />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={AXIS_TICK}
                    tickMargin={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={AXIS_TICK}
                    width={30}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(17,17,16,0.04)' }}
                    content={
                      <ChartTooltip
                        formatValue={(value) =>
                          `${fullNumber(value)} ${value === 1 ? 'project' : 'projects'}`
                        }
                      />
                    }
                  />
                  <Bar dataKey="projects" name="Projects" maxBarSize={44}>
                    {byYear.map((entry) => (
                      <Cell
                        key={entry.year}
                        fill={entry.year === peak.year ? HL.ink : HL.cyan}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>
      </Reveal>

      <Reveal delay={0.08}>
        <p className="mt-8 max-w-3xl text-[13px] leading-relaxed text-[#111110]/65">
          Release years are read straight from the project records. Audience
          figures are not shown: the studio has no Instagram or website
          collection source, so nothing here is estimated.
        </p>
      </Reveal>
    </section>
  );
}
