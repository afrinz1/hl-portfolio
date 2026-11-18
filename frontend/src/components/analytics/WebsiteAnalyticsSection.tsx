import { Link } from 'react-router-dom';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { WebsiteAnalytics } from '../../api/demoAnalytics';
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
  durationLabel,
  fullNumber,
} from './ChartKit';

export function WebsiteAnalyticsSection({
  website,
}: {
  website: WebsiteAnalytics;
}) {
  const { totals, monthly, popularProjects } = website;
  const maxViews = Math.max(1, ...popularProjects.map((item) => item.views));

  return (
    <section id="website" className="scroll-mt-28" aria-label="Website analytics">
      <SectionHeading
        index="04"
        title="Website"
        caption="How people find and read the work."
        source="demo"
      />

      <Reveal>
        <StatGrid columnsClass="grid-cols-1 sm:grid-cols-3">
          <StatCell>
            <CountStat
              label="Total visits"
              value={totals.visits}
              format={compactNumber}
              source="demo"
              emphasis
            />
          </StatCell>
          <StatCell>
            <CountStat
              label="Unique visitors"
              value={totals.uniqueVisitors}
              format={compactNumber}
              source="demo"
              emphasis
            />
          </StatCell>
          <StatCell>
            <CountStat
              label="Avg. session duration"
              value={totals.avgSessionSeconds}
              format={durationLabel}
              source="demo"
              emphasis
            />
          </StatCell>
        </StatGrid>
      </Reveal>

      <div className="mt-14 grid grid-cols-1 gap-x-16 gap-y-14 lg:grid-cols-12">
        <Reveal className="lg:col-span-5">
          <Panel
            title="Session duration"
            meta="Avg. seconds per session"
            source="demo"
          >
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={monthly}
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
                    width={38}
                    tickFormatter={(value: number) => `${value}s`}
                  />
                  <Tooltip
                    cursor={{ stroke: HL.line }}
                    content={
                      <ChartTooltip
                        formatValue={(value) => durationLabel(value)}
                      />
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="avgSessionSeconds"
                    name="Avg. session"
                    stroke={HL.cyanDeep}
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ r: 3, fill: HL.cyanDeep, stroke: 'none' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </Reveal>

        <Reveal delay={0.08} className="lg:col-span-7">
          <Panel
            title="Popular projects"
            meta="By page views"
            source="demo"
          >
            <ol className="divide-y divide-[#111110]/10 border-y border-[#111110]/10">
              {popularProjects.map((project, index) => (
                <li key={project.slug} className="py-4">
                  <div className="flex items-baseline justify-between gap-5">
                    <div className="flex min-w-0 items-baseline gap-4">
                      <span className="font-mono-hl text-[11px] text-[#14bfb9]">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <Link
                        to={`/projects/${project.slug}`}
                        className="truncate text-[14px] tracking-tight text-[#111110] hover:underline hover:underline-offset-4"
                      >
                        {project.title}
                      </Link>
                    </div>
                    <span className="font-mono-hl shrink-0 text-[12px] tabular-nums text-[#111110]/70">
                      {fullNumber(project.views)} views
                    </span>
                  </div>
                  <div className="mt-2.5 flex items-center gap-4">
                    <MeterBar
                      ratio={project.views / maxViews}
                      color={index === 0 ? HL.ink : HL.cyan}
                      className="flex-1"
                    />
                    <span className="font-mono-hl shrink-0 text-[11px] text-[#111110]/65">
                      {durationLabel(project.avgTimeOnPageSeconds)} on page
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>
        </Reveal>
      </div>
    </section>
  );
}
