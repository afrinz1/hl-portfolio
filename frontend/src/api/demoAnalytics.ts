/**
 * DEMO analytics — website traffic and Instagram Insights.
 *
 * Nothing in this file comes from the database. The portfolio dashboard reads
 * live figures from `GET /api/v1/analytics/overview/`; this module is the
 * placeholder for the two sources that have no collector yet.
 *
 * The interfaces below intentionally mirror what the real integrations return
 * (Google Analytics Data API for the website, the Instagram Graph API
 * `/{ig-user-id}/insights` and `/{ig-user-id}/media` edges for Instagram).
 * Swapping demo values for live ones therefore means replacing the
 * `DEMO_*` constants with fetched payloads — no UI changes required.
 */

import imgAuto from '../assets/images/demo_automobile_1794583103025.webp';
import imgCulinary from '../assets/images/demo_culinary_dish_1794583105120.webp';
import imgKayak from '../assets/images/demo_kayak_documentary_1794583104756.webp';
import imgBike from '../assets/images/demo_monochrome_bike_1794583103814.webp';
import imgMusician from '../assets/images/demo_musician_bw_1794583105138.webp';
import imgLoom from '../assets/images/demo_artisan_loom_1794583103828.webp';

/* ------------------------------------------------------------------ *
 * Shared
 * ------------------------------------------------------------------ */

export interface DemoSourceDescriptor {
  isDemo: true;
  label: string;
  provider: string;
  window: string;
  note: string;
}

/**
 * Describes where the non-database figures come from. Render this next to the
 * demo sections so the distinction is never ambiguous.
 */
export const DEMO_ANALYTICS_SOURCE: DemoSourceDescriptor = {
  isDemo: true,
  label: 'Demo data',
  provider: 'Simulated · Instagram Graph API + GA4 ready',
  window: 'Last 12 months',
  note: 'Placeholder figures. Replace with Instagram Insights and website analytics collection — the interfaces mirror those payloads.',
};

/* ------------------------------------------------------------------ *
 * Website analytics (GA4 Data API shape)
 * ------------------------------------------------------------------ */

export interface WebsiteMonthlyTraffic {
  /** Period key, e.g. `2026-03`. */
  month: string;
  /** Short axis label, e.g. `Mar`. */
  label: string;
  visits: number;
  uniqueVisitors: number;
  avgSessionSeconds: number;
}

export interface WebsitePopularProject {
  title: string;
  slug: string;
  views: number;
  avgTimeOnPageSeconds: number;
}

export interface WebsiteAnalytics {
  /** Period totals. `uniqueVisitors` is de-duplicated across the whole window. */
  totals: {
    visits: number;
    uniqueVisitors: number;
    avgSessionSeconds: number;
  };
  /** Trailing 12 months, oldest first. */
  monthly: WebsiteMonthlyTraffic[];
  popularProjects: WebsitePopularProject[];
}

/* ------------------------------------------------------------------ *
 * Instagram analytics (Instagram Graph API insights shape, demo values)
 * ------------------------------------------------------------------ */

export interface InstagramMonthlyPoint {
  month: string;
  label: string;
  views: number;
  reach: number;
  interactions: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  followersTotal: number;
  /** Interactions as a percentage of reach. */
  engagementRate: number;
}

export interface InstagramTopPost {
  id: string;
  type: 'reel' | 'post';
  caption: string;
  /** Thumbnail URL, or `null` when the post has no media preview. */
  thumbnail: string | null;
  postedAt: string;
  views: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
}

export interface InstagramAnalytics {
  totals: {
    views: number;
    /** De-duplicated reach across the window. */
    reach: number;
    interactions: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    followers: number;
  };
  followerGrowth: {
    start: number;
    end: number;
    net: number;
    changePercent: number;
  };
  /** Trailing 12 months, oldest first. */
  monthly: InstagramMonthlyPoint[];
  topPosts: InstagramTopPost[];
}

/* ------------------------------------------------------------------ *
 * The bundle handed to the dashboard
 * ------------------------------------------------------------------ */

export interface DemoAnalytics {
  website: WebsiteAnalytics;
  instagram: InstagramAnalytics;
}

export const DEMO_WEBSITE_ANALYTICS: WebsiteAnalytics = {
  totals: {
    visits: 196_710,
    uniqueVisitors: 98_400,
    avgSessionSeconds: 152,
  },
  monthly: [
    { month: '2025-12', label: 'Dec', visits: 11_240, uniqueVisitors: 8_910, avgSessionSeconds: 128 },
    { month: '2026-01', label: 'Jan', visits: 13_860, uniqueVisitors: 10_420, avgSessionSeconds: 134 },
    { month: '2026-02', label: 'Feb', visits: 12_470, uniqueVisitors: 9_380, avgSessionSeconds: 131 },
    { month: '2026-03', label: 'Mar', visits: 15_120, uniqueVisitors: 11_260, avgSessionSeconds: 142 },
    { month: '2026-04', label: 'Apr', visits: 14_380, uniqueVisitors: 10_740, avgSessionSeconds: 138 },
    { month: '2026-05', label: 'May', visits: 16_940, uniqueVisitors: 12_510, avgSessionSeconds: 151 },
    { month: '2026-06', label: 'Jun', visits: 15_610, uniqueVisitors: 11_680, avgSessionSeconds: 146 },
    { month: '2026-07', label: 'Jul', visits: 13_270, uniqueVisitors: 10_040, avgSessionSeconds: 139 },
    { month: '2026-08', label: 'Aug', visits: 17_430, uniqueVisitors: 12_890, avgSessionSeconds: 158 },
    { month: '2026-09', label: 'Sep', visits: 19_860, uniqueVisitors: 14_520, avgSessionSeconds: 166 },
    { month: '2026-10', label: 'Oct', visits: 22_140, uniqueVisitors: 16_180, avgSessionSeconds: 174 },
    { month: '2026-11', label: 'Nov', visits: 24_390, uniqueVisitors: 17_660, avgSessionSeconds: 181 },
  ],
  popularProjects: [
    { title: 'Aurum GT — Golden Hour', slug: 'aurum-gt-golden-hour', views: 8_420, avgTimeOnPageSeconds: 246 },
    { title: 'Threads of Loom', slug: 'threads-of-loom', views: 6_910, avgTimeOnPageSeconds: 312 },
    { title: 'Nighthawk — Alley Study', slug: 'nighthawk-alley-study', views: 5_780, avgTimeOnPageSeconds: 198 },
    { title: 'Salt & Ember', slug: 'salt-and-ember', views: 4_360, avgTimeOnPageSeconds: 271 },
    { title: 'Kayak at Dawn', slug: 'kayak-at-dawn', views: 3_120, avgTimeOnPageSeconds: 235 },
  ],
};

export const DEMO_INSTAGRAM_ANALYTICS: InstagramAnalytics = {
  totals: {
    views: 1_161_340,
    reach: 512_400,
    interactions: 102_930,
    likes: 81_400,
    comments: 5_512,
    shares: 9_892,
    saves: 6_126,
    followers: 27_218,
  },
  followerGrowth: {
    start: 18_528,
    end: 27_218,
    net: 8_690,
    changePercent: 46.9,
  },
  monthly: [
    { month: '2025-12', label: 'Dec', views: 62_400, reach: 41_200, interactions: 5_180, likes: 4_120, comments: 260, shares: 480, saves: 320, followersTotal: 18_940, engagementRate: 4.2 },
    { month: '2026-01', label: 'Jan', views: 71_860, reach: 46_900, interactions: 6_040, likes: 4_780, comments: 305, shares: 585, saves: 370, followersTotal: 19_426, engagementRate: 4.5 },
    { month: '2026-02', label: 'Feb', views: 58_320, reach: 38_640, interactions: 4_720, likes: 3_690, comments: 232, shares: 452, saves: 346, followersTotal: 19_784, engagementRate: 3.9 },
    { month: '2026-03', label: 'Mar', views: 84_510, reach: 55_180, interactions: 7_420, likes: 5_860, comments: 398, shares: 704, saves: 458, followersTotal: 20_396, engagementRate: 5.1 },
    { month: '2026-04', label: 'Apr', views: 76_240, reach: 49_760, interactions: 6_510, likes: 5_120, comments: 341, shares: 612, saves: 437, followersTotal: 20_924, engagementRate: 4.7 },
    { month: '2026-05', label: 'May', views: 98_730, reach: 64_310, interactions: 8_940, likes: 7_080, comments: 486, shares: 862, saves: 512, followersTotal: 21_688, engagementRate: 5.6 },
    { month: '2026-06', label: 'Jun', views: 88_460, reach: 57_820, interactions: 7_680, likes: 6_040, comments: 412, shares: 748, saves: 480, followersTotal: 22_329, engagementRate: 5.2 },
    { month: '2026-07', label: 'Jul', views: 69_180, reach: 45_290, interactions: 5_640, likes: 4_420, comments: 298, shares: 542, saves: 380, followersTotal: 22_754, engagementRate: 4.1 },
    { month: '2026-08', label: 'Aug', views: 112_540, reach: 73_460, interactions: 10_320, likes: 8_180, comments: 562, shares: 985, saves: 593, followersTotal: 23_662, engagementRate: 6.0 },
    { month: '2026-09', label: 'Sep', views: 128_910, reach: 83_770, interactions: 11_860, likes: 9_410, comments: 648, shares: 1_142, saves: 660, followersTotal: 24_708, engagementRate: 6.3 },
    { month: '2026-10', label: 'Oct', views: 146_320, reach: 95_140, interactions: 13_480, likes: 10_690, comments: 742, shares: 1_308, saves: 740, followersTotal: 25_892, engagementRate: 6.6 },
    { month: '2026-11', label: 'Nov', views: 163_870, reach: 106_520, interactions: 15_140, likes: 12_010, comments: 828, shares: 1_472, saves: 830, followersTotal: 27_218, engagementRate: 6.9 },
  ],
  topPosts: [
    {
      id: 'ig-101',
      type: 'reel',
      caption: 'Golden hour on the Aurum GT shoot. 3am call time, worth it.',
      thumbnail: imgAuto,
      postedAt: '2026-10-18',
      views: 284_600,
      reach: 196_400,
      likes: 21_480,
      comments: 612,
      shares: 3_240,
      saves: 1_892,
    },
    {
      id: 'ig-102',
      type: 'reel',
      caption: 'Loom work. Forty years of the same pair of hands.',
      thumbnail: imgLoom,
      postedAt: '2026-09-24',
      views: 198_240,
      reach: 141_780,
      likes: 16_320,
      comments: 486,
      shares: 2_140,
      saves: 1_565,
    },
    {
      id: 'ig-103',
      type: 'reel',
      caption: 'Alley study — one light, no budget, 11pm.',
      thumbnail: imgBike,
      postedAt: '2026-11-02',
      views: 156_910,
      reach: 112_360,
      likes: 12_740,
      comments: 358,
      shares: 1_682,
      saves: 1_204,
    },
    {
      id: 'ig-104',
      type: 'post',
      caption: 'Salt & Ember — first frames from the kitchen series.',
      thumbnail: imgCulinary,
      postedAt: '2026-08-11',
      views: 94_380,
      reach: 71_240,
      likes: 8_910,
      comments: 262,
      shares: 842,
      saves: 918,
    },
    {
      id: 'ig-105',
      type: 'reel',
      caption: 'Kayak at dawn. Cold hands, clean lines.',
      thumbnail: imgKayak,
      postedAt: '2026-07-29',
      views: 88_470,
      reach: 64_180,
      likes: 7_260,
      comments: 194,
      shares: 706,
      saves: 634,
    },
    {
      id: 'ig-106',
      type: 'post',
      caption: 'Rack focus test on the new macro rig.',
      thumbnail: imgMusician,
      postedAt: '2026-06-15',
      views: 52_190,
      reach: 39_720,
      likes: 4_380,
      comments: 128,
      shares: 372,
      saves: 486,
    },
  ],
};

export const DEMO_ANALYTICS: DemoAnalytics = {
  website: DEMO_WEBSITE_ANALYTICS,
  instagram: DEMO_INSTAGRAM_ANALYTICS,
};
