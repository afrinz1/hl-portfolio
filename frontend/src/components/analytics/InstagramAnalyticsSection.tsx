import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { InstagramAnalytics } from '../../api/demoAnalytics';
import { DEMO_ANALYTICS_SOURCE } from '../../api/demoAnalytics';
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
  percentLabel,
} from './ChartKit';

const POST_TYPE_LABEL: Record<string, string> = {
  reel: 'Reel',
  post: 'Post',
};

export function InstagramAnalyticsSection({
  instagram,
}: {
  instagram: InstagramAnalytics;
}) {
  const { totals, followerGrowth, monthly, topPosts } = instagram;

  const engagementParts = [
    { key: 'likes', label: 'Likes', value: totals.likes, color: HL.ink },
    { key: 'comments', label: 'Comments', value: totals.comments, color: '#6b6b66' },
    { key: 'shares', label: 'Shares', value: totals.shares, color: HL.cyanDeep },
    { key: 'saves', label: 'Saves', value: totals.saves, color: HL.cyan },
  ];

  const engagementSum = Math.max(
    1,
    engagementParts.reduce((sum, part) => sum + part.value, 0)
  );

  return (
    <section id="instagram" className="scroll-mt-28" aria-label="Instagram analytics">
      <SectionHeading
        index="03"
        title="Instagram"
        caption="Reach, engagement and follower momentum."
        source="demo"
      />

      <Reveal>
        <StatGrid>
          <StatCell>
            <CountStat
              label="Views"
              value={totals.views}
              format={compactNumber}
              source="demo"
              emphasis
            />
          </StatCell>
          <StatCell>
            <CountStat
              label="Reach"
              value={totals.reach}
              format={compactNumber}
              source="demo"
              emphasis
            />
          </StatCell>
          <StatCell>
            <CountStat
              label="Interactions"
              value={totals.interactions}
              format={compactNumber}
              source="demo"
              emphasis
            />
          </StatCell>
          <StatCell>
            <CountStat
              label="Followers"
              value={totals.followers}
              format={compactNumber}
              source="demo"
              hint={`+${followerGrowth.changePercent}% over the window`}
              emphasis
            />
          </StatCell>
        </StatGrid>
      </Reveal>

      {/* Follower growth + engagement mix */}
      <div className="mt-14 grid grid-cols-1 gap-x-16 gap-y-14 lg:grid-cols-12">
        <Reveal className="lg:col-span-8">
          <Panel
            title="Follower growth"
            meta={DEMO_ANALYTICS_SOURCE.window}
            source="demo"
          >
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
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
                    width={46}
                    tickFormatter={(value: number) => compactNumber(value)}
                  />
                  <Tooltip
                    cursor={{ stroke: HL.line }}
                    content={<ChartTooltip formatValue={(value) => fullNumber(value)} />}
                  />
                  <Area
                    type="monotone"
                    dataKey="followersTotal"
                    name="Followers"
                    stroke={HL.ink}
                    strokeWidth={1.5}
                    fill={HL.cyan}
                    fillOpacity={0.35}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </Reveal>

        <Reveal delay={0.08} className="lg:col-span-4">
          <Panel title="Growth" meta="Net change" source="demo">
            <div className="space-y-6">
              <div>
                <span className="font-mono-hl text-[10px] uppercase tracking-wider text-[#111110]/65">
                  Net new followers
                </span>
                <p className="mt-2 font-display text-[clamp(34px,3.4vw,52px)] font-light leading-[0.9] tracking-[-0.05em] tabular-nums">
                  +{compactNumber(followerGrowth.net)}
                </p>
              </div>
              <dl className="space-y-3 border-t border-[#111110]/12 pt-5 text-[13px]">
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-[#111110]/65">Start of window</dt>
                  <dd className="font-mono-hl tabular-nums">
                    {fullNumber(followerGrowth.start)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-[#111110]/65">End of window</dt>
                  <dd className="font-mono-hl tabular-nums">
                    {fullNumber(followerGrowth.end)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-[#111110]/65">Change</dt>
                  <dd className="font-mono-hl tabular-nums text-[#14bfb9]">
                    {percentLabel(followerGrowth.changePercent)}
                  </dd>
                </div>
              </dl>
            </div>
          </Panel>
        </Reveal>
      </div>

      {/* Monthly trends */}
      <Reveal className="mt-14">
        <Panel
          title="Monthly reach & views"
          meta={DEMO_ANALYTICS_SOURCE.window}
          source="demo"
        >
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
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
                  width={46}
                  tickFormatter={(value: number) => compactNumber(value)}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(17,17,16,0.04)' }}
                  content={<ChartTooltip formatValue={(value) => fullNumber(value)} />}
                />
                <Bar dataKey="views" name="Views" fill={HL.cyan} maxBarSize={30} />
                <Line
                  type="monotone"
                  dataKey="reach"
                  name="Reach"
                  stroke={HL.ink}
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{ r: 3, fill: HL.ink, stroke: 'none' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </Reveal>

      {/* Engagement */}
      <div className="mt-14 grid grid-cols-1 gap-x-16 gap-y-14 lg:grid-cols-12">
        <Reveal className="lg:col-span-5">
          <Panel title="Engagement rate" meta="Interactions ÷ reach" source="demo">
            <div className="h-[240px] w-full">
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
                    tickFormatter={(value: number) => `${value}%`}
                  />
                  <Tooltip
                    cursor={{ stroke: HL.line }}
                    content={
                      <ChartTooltip formatValue={(value) => percentLabel(value)} />
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="engagementRate"
                    name="Engagement rate"
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
            title="Engagement breakdown"
            meta={`${fullNumber(totals.interactions)} interactions`}
            source="demo"
          >
            {/* Part-to-whole bar */}
            <div
              className="flex h-[6px] w-full overflow-hidden bg-[#111110]/10"
              role="img"
              aria-label="Share of likes, comments, shares and saves"
            >
              {engagementParts.map((part) => (
                <span
                  key={part.key}
                  className="h-full"
                  style={{
                    width: `${(part.value / engagementSum) * 100}%`,
                    backgroundColor: part.color,
                  }}
                />
              ))}
            </div>

            <ul className="mt-6 divide-y divide-[#111110]/10">
              {engagementParts.map((part) => (
                <li
                  key={part.key}
                  className="flex items-center justify-between gap-5 py-3.5"
                >
                  <span className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="h-2 w-2 shrink-0"
                      style={{ backgroundColor: part.color }}
                    />
                    <span className="text-[13px] text-[#111110]/85">
                      {part.label}
                    </span>
                  </span>
                  <span className="flex items-baseline gap-4">
                    <span className="font-mono-hl text-[12px] tabular-nums text-[#111110]">
                      {fullNumber(part.value)}
                    </span>
                    <span className="font-mono-hl w-10 text-right text-[11px] tabular-nums text-[#111110]/65">
                      {((part.value / engagementSum) * 100).toFixed(0)}%
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </Reveal>
      </div>

      {/* Top posts & reels */}
      <Reveal className="mt-14">
        <Panel
          title="Top posts & reels"
          meta={`${topPosts.length} best performing`}
          source="demo"
        >
          {topPosts.length === 0 ? (
            <p className="py-10 text-sm text-[#111110]/65">
              No posts tracked yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {topPosts.map((post, index) => {
                const maxPostViews = Math.max(1, ...topPosts.map((item) => item.views));

                return (
                  <article key={post.id} className="flex flex-col">
                    <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#e8e7e1]">
                      {post.thumbnail ? (
                        <img
                          src={post.thumbnail}
                          alt={post.caption}
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <span className="font-mono-hl text-[11px] uppercase tracking-wider text-[#111110]/35">
                            No preview
                          </span>
                        </div>
                      )}
                      <span className="absolute left-3 top-3 bg-[#111110] px-2 py-1 font-mono-hl text-[9px] uppercase tracking-wider text-[#F3F0E9]">
                        {POST_TYPE_LABEL[post.type] ?? 'Post'}
                      </span>
                    </div>

                    <div className="mt-3 flex items-baseline justify-between gap-4">
                      <span className="font-mono-hl text-[11px] text-[#14bfb9]">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="font-mono-hl text-[11px] tabular-nums text-[#111110]/65">
                        {post.postedAt}
                      </span>
                    </div>

                    <p className="mt-2 text-[13.5px] leading-[1.55] text-[#111110]/85">
                      {post.caption}
                    </p>

                    <div className="mt-3">
                      <MeterBar
                        ratio={post.views / maxPostViews}
                        color={index === 0 ? HL.ink : HL.cyan}
                      />
                    </div>

                    <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 font-mono-hl text-[11px] tabular-nums text-[#111110]/60">
                      <div className="flex justify-between gap-2">
                        <dt>views</dt>
                        <dd className="text-[#111110]/85">
                          {compactNumber(post.views)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt>reach</dt>
                        <dd className="text-[#111110]/85">
                          {compactNumber(post.reach)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt>likes</dt>
                        <dd className="text-[#111110]/85">
                          {compactNumber(post.likes)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt>saves</dt>
                        <dd className="text-[#111110]/85">
                          {compactNumber(post.saves)}
                        </dd>
                      </div>
                    </dl>
                  </article>
                );
              })}
            </div>
          )}
        </Panel>
      </Reveal>

      <Reveal delay={0.08}>
        <p className="mt-8 max-w-3xl text-[13px] leading-relaxed text-[#111110]/65">
          Instagram figures are demo placeholders ({DEMO_ANALYTICS_SOURCE.provider}).
          They live in <span className="text-[#111110]/80">demoAnalytics.ts</span> behind
          the same interfaces Instagram Insights returns, so connecting the live
          integration will not require rebuilding this view.
        </p>
      </Reveal>
    </section>
  );
}
