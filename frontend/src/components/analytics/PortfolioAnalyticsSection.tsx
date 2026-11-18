import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { resolveMediaUrl } from '../../api/client';
import type { PortfolioOverview } from '../../api/types';
import {
  AXIS_TICK,
  ChartTooltip,
  CountStat,
  GRID_STROKE,
  HL,
  MeterBar,
  Panel,
  Reveal,
  SectionHeading,
  StatCell,
  StatGrid,
  compactNumber,
  fullNumber,
  rampColor,
} from './ChartKit';

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function monthLabel(month: string): string {
  const [year, rawMonth] = month.split('-');
  const name = MONTH_NAMES[Number(rawMonth) - 1];

  return name && year ? `${name} ${year}` : month;
}

export function PortfolioAnalyticsSection({
  overview,
}: {
  overview: PortfolioOverview;
}) {
  const {
    totals,
    category_distribution,
    projects_by_month,
    media_breakdown,
    selected_work,
  } = overview;

  const mediaTotal = media_breakdown.reduce((sum, item) => sum + item.count, 0);
  const maxCategory = Math.max(1, ...category_distribution.map((row) => row.projects));
  const latestActive = projects_by_month.filter((row) => row.projects > 0).at(-1) ?? null;

  return (
    <section id="portfolio" className="scroll-mt-28" aria-label="Portfolio analytics">
      <SectionHeading
        index="02"
        title="Portfolio"
        caption="What the archive actually contains."
        source="database"
      />

      <Reveal>
        <StatGrid>
          <StatCell>
            <CountStat label="Projects" value={totals.projects} source="database" />
          </StatCell>
          <StatCell>
            <CountStat label="Categories" value={totals.categories} source="database" />
          </StatCell>
          <StatCell>
            <CountStat
              label="Media assets"
              value={totals.media_assets}
              source="database"
            />
          </StatCell>
          <StatCell>
            <CountStat
              label="Assets per project"
              value={totals.average_media_per_project}
              format={(value) => value.toFixed(2)}
              source="database"
            />
          </StatCell>
        </StatGrid>
      </Reveal>

      {/* Distribution + media mix */}
      <div className="mt-14 grid grid-cols-1 gap-x-16 gap-y-14 lg:grid-cols-12">
        <Reveal className="lg:col-span-7">
          <Panel
            title="Category distribution"
            meta={`${category_distribution.length} categories`}
            source="database"
          >
            {category_distribution.length === 0 ? (
              <p className="py-10 text-sm text-[#111110]/65">
                No categories published yet.
              </p>
            ) : (
              <div
                className="space-y-5"
                role="img"
                aria-label={`Category distribution across ${category_distribution.length} categories`}
              >
                {category_distribution.map((row, index) => (
                  <div key={row.slug || row.name}>
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-[13px] tracking-tight text-[#111110]/85">
                        {row.name}
                      </span>
                      <span className="font-mono-hl text-[12px] tabular-nums text-[#111110]/60">
                        {row.projects}
                      </span>
                    </div>
                    <MeterBar
                      ratio={row.projects / maxCategory}
                      color={rampColor(index)}
                      className="mt-2"
                    />
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </Reveal>

        <Reveal delay={0.08} className="lg:col-span-5">
          <Panel
            title="Media mix"
            meta={`${fullNumber(mediaTotal)} assets`}
            source="database"
          >
            {mediaTotal === 0 ? (
              <p className="py-10 text-sm text-[#111110]/65">
                No media uploaded yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 items-center gap-8 sm:grid-cols-2">
                <div className="relative h-[176px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={media_breakdown}
                        dataKey="count"
                        nameKey="label"
                        innerRadius="70%"
                        outerRadius="100%"
                        startAngle={90}
                        endAngle={-270}
                        stroke="none"
                      >
                        {media_breakdown.map((entry, index) => (
                          <Cell
                            key={entry.type}
                            fill={index === 0 ? HL.ink : HL.cyan}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-display text-3xl font-light tracking-[-0.05em] tabular-nums">
                      {compactNumber(mediaTotal)}
                    </span>
                    <span className="font-mono-hl text-[10px] uppercase tracking-wider text-[#111110]/65">
                      total
                    </span>
                  </div>
                </div>

                <ul className="space-y-4">
                  {media_breakdown.map((entry, index) => {
                    const share = mediaTotal ? entry.count / mediaTotal : 0;

                    return (
                      <li key={entry.type}>
                        <div className="flex items-center gap-2.5">
                          <span
                            aria-hidden="true"
                            className="h-2 w-2 shrink-0"
                            style={{
                              backgroundColor: index === 0 ? HL.ink : HL.cyan,
                            }}
                          />
                          <span className="text-[13px] text-[#111110]/85">
                            {entry.label}
                          </span>
                        </div>
                        <p className="mt-1.5 font-mono-hl text-[12px] tabular-nums text-[#111110]/60">
                          {fullNumber(entry.count)} · {(share * 100).toFixed(0)}%
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </Panel>
        </Reveal>
      </div>

      {/* Projects by month */}
      <Reveal className="mt-14">
        <Panel
          title="Projects by month"
          meta={
            latestActive
              ? `Latest ${monthLabel(latestActive.month)}`
              : 'No activity in the last 12 months'
          }
          source="database"
        >
          {projects_by_month.length === 0 ? (
            <p className="py-10 text-sm text-[#111110]/65">
              No projects to chart yet.
            </p>
          ) : (
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={projects_by_month}
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
                    {projects_by_month.map((entry) => (
                      <Cell
                        key={entry.month}
                        fill={
                          entry.month === latestActive?.month ? HL.ink : HL.cyan
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>
      </Reveal>

      {/* Selected work */}
      <Reveal className="mt-14">
        <Panel
          title="Selected work"
          meta={`${selected_work.length} of ${totals.projects} projects`}
          source="database"
        >
          {selected_work.length === 0 ? (
            <p className="py-10 text-sm text-[#111110]/65">
              Nothing published yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {selected_work.map((item) => {
                const cover = resolveMediaUrl(item.cover_image);

                return (
                  <Link
                    key={item.slug}
                    to={`/projects/${item.slug}`}
                    className="group block"
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden bg-[#e8e7e1]">
                      {cover ? (
                        <img
                          src={cover}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <span className="font-display text-2xl font-light uppercase tracking-tight text-[#111110]/25">
                            {item.title.slice(0, 2)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex items-start justify-between gap-4">
                      <h4 className="font-display text-base font-normal tracking-tight text-[#111110] group-hover:underline group-hover:underline-offset-4">
                        {item.title}
                      </h4>
                      <span className="font-mono-hl shrink-0 text-[11px] tabular-nums text-[#111110]/65">
                        {item.year ?? '—'}
                      </span>
                    </div>

                    <p className="mt-1 font-mono-hl text-[11px] uppercase tracking-wider text-[#111110]/65">
                      {[item.category, item.client].filter(Boolean).join(' · ') ||
                        'Unassigned'}
                      {` · ${item.media_count} ${
                        item.media_count === 1 ? 'asset' : 'assets'
                      }`}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </Panel>
      </Reveal>
    </section>
  );
}
