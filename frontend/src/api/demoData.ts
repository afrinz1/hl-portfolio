import imgLoom from '../assets/images/demo_artisan_loom_1794583103828.webp';
import imgAuto from '../assets/images/demo_automobile_1794583103025.webp';
import imgCulinary from '../assets/images/demo_culinary_dish_1794583105120.webp';
import imgFashion from '../assets/images/demo_fashion_editorial_1794583105280.webp';
import imgKayak from '../assets/images/demo_kayak_documentary_1794583104756.webp';
import imgBike from '../assets/images/demo_monochrome_bike_1794583103814.webp';
import imgMusician from '../assets/images/demo_musician_bw_1794583105138.webp';
import type {
  Category,
  Insight,
  PaginatedResponse,
  Project,
  ProjectMedia,
  Service,
  StudioInfo,
} from './types';

export const DEMO_CATEGORIES: Category[] = [
  {
    id: 1,
    name: 'Automobile',
    slug: 'automobile',
    description:
      'High-speed tracking, sculpted bodywork studies, and kinetic automotive films.',
    image: imgAuto,
    projects_count: 3,
  },
  {
    id: 2,
    name: 'Documentary',
    slug: 'documentary',
    description:
      'Human-led visual essays capturing craft, endurance, and quiet everyday rituals.',
    image: imgKayak,
    projects_count: 3,
  },
  {
    id: 3,
    name: 'Fashion',
    slug: 'fashion',
    description:
      'Sun-drenched movement studies, textile close-ups, and editorial campaign reels.',
    image: imgFashion,
    projects_count: 2,
  },
  {
    id: 4,
    name: 'Restaurant',
    slug: 'restaurant',
    description:
      'Tactile kitchen stories, steam, spice, and atmospheric hospitality films.',
    image: imgCulinary,
    projects_count: 2,
  },
  {
    id: 5,
    name: 'Shops',
    slug: 'shops',
    description:
      'Independent makers, heritage workshops, and neighborhood retail portraits.',
    image: imgLoom,
    projects_count: 2,
  },
  {
    id: 6,
    name: 'Fun Projects',
    slug: 'fun-projects',
    description:
      'Late-night experiments, rooftop live sessions, and unscripted visual tests.',
    image: imgBike,
    projects_count: 2,
  },
];

export const DEMO_PROJECTS: Project[] = [
  {
    id: 101,
    title: 'Aurum GT — Golden Hour',
    slug: 'aurum-gt-golden-hour',
    description:
      'A cinematic automotive film capturing the machine in motion. Through dynamic camera movements, detailed close-ups and carefully crafted cuts, we bring out the design, character and performance of every ride.',
    year: 2026,
    client: '@aurummotors',
    category: { id: 1, name: 'Automobile', slug: 'automobile' },
    thumbnail: imgAuto,
    video_url:
      'https://ik.imagekit.io/h5ebrukka/reel1.mp4?updatedAt=1792903691386',
    is_featured: true,
  },
  {
    id: 102,
    title: 'Nighthawk — Alley Study',
    slug: 'nighthawk-alley-study',
    description:
      'Shot after midnight on high-contrast monochrome stock, following a custom café racer through rain-slicked cobblestone streets.',
    year: 2026,
    client: 'Nighthawk Garage',
    category: { id: 6, name: 'Fun Projects', slug: 'fun-projects' },
    thumbnail: imgBike,
    video_url:
      'https://ik.imagekit.io/h5ebrukka/final%20ren.mp4?updatedAt=1792686752399',
    is_featured: true,
  },
  {
    id: 103,
    title: 'Threads of Loom',
    slug: 'threads-of-loom',
    description:
      'An intimate short documentary observing master handloom weavers preserving emerald silk traditions in quiet morning light.',
    year: 2025,
    client: 'Kora Collective',
    category: { id: 5, name: 'Shops', slug: 'shops' },
    thumbnail: imgLoom,
    video_url:
      'https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/designs/ink-reveal-hover.mp4',
    is_featured: true,
  },
  {
    id: 104,
    title: 'Terrace Sessions — Live',
    slug: 'terrace-sessions-live',
    description:
      'Single-take rooftop performance capturing raw percussion, city twilight, and unfiltered acoustic resonance.',
    year: 2025,
    client: 'Terrace Records',
    category: { id: 6, name: 'Fun Projects', slug: 'fun-projects' },
    thumbnail: imgMusician,
    video_url:
      'https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/aaaf/oraciteslArea.mp4',
    is_featured: true,
  },
  {
    id: 105,
    title: 'River Crossing — Malabar',
    slug: 'river-crossing-malabar',
    description:
      'Following endurance paddleboarders across tranquil tropical backwaters at first light, blending aerial pacing with water-level intimacy.',
    year: 2026,
    client: 'Jellyfish Expeditions',
    category: { id: 2, name: 'Documentary', slug: 'documentary' },
    thumbnail: imgKayak,
    video_url:
      'https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/aaaf/medusa-jellyfish-hero.mp4',
    is_featured: true,
  },
  {
    id: 106,
    title: 'Solstice Silhouettes',
    slug: 'solstice-silhouettes',
    description:
      'Warm golden-hour fashion film exploring sculptural jewelry, carved stone textures, and unhurried movement.',
    year: 2026,
    client: 'Atelier Veda',
    category: { id: 3, name: 'Fashion', slug: 'fashion' },
    thumbnail: imgFashion,
    video_url:
      'https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/aaaf/living-portrait-hero.mp4',
    is_featured: false,
  },
  {
    id: 107,
    title: 'Saffron & Slate',
    slug: 'saffron-and-slate',
    description:
      'Macro culinary study highlighting slow-simmered coastal curries, roasted spices, and open-fire plating.',
    year: 2025,
    client: 'Kadal Kitchen',
    category: { id: 4, name: 'Restaurant', slug: 'restaurant' },
    thumbnail: imgCulinary,
    video_url:
      'https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/designs/honey-bee-melli-landing.mp4',
    is_featured: false,
  },
  {
    id: 108,
    title: 'Midnight Roadster',
    slug: 'midnight-roadster',
    description:
      'Low-slung rolling shots and sound-designed exhaust study for an independent coachbuilder.',
    year: 2026,
    client: '@roadsterworks',
    category: { id: 1, name: 'Automobile', slug: 'automobile' },
    thumbnail: imgAuto,
    video_url:
      'https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/designs/roadster-3d-car-landing.mp4',
    is_featured: false,
  },
  {
    id: 109,
    title: 'Apex Drift Study',
    slug: 'apex-drift-study',
    description:
      'Trackside telemetry meets tactile 35mm-inspired framing across dawn mountain hairpins.',
    year: 2025,
    client: 'Apex Atelier',
    category: { id: 1, name: 'Automobile', slug: 'automobile' },
    thumbnail: imgBike,
    video_url:
      'https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/designs/space-voyage-video.mp4',
    is_featured: false,
  },
];

export const DEMO_STUDIO: StudioInfo = {
  id: 1,
  name: 'HECTIC LAB',
  tagline: 'INDEPENDENT VIDEO PRODUCTION.',
  description:
    "We're a small creative studio working with video, visuals, and everything that happens between the first shot and the final export. A lot of our work happens in the edit. Cutting things down, moving things around, fixing that one frame, and occasionally spending 40 minutes choosing between two shots that look exactly the same. We work on projects across different styles and industries, from automotive and fashion to commercial and creative films. No two projects are quite the same, and that's the fun part.",
  approach:
    "The camera captures the footage. The edit gives it a direction. We care about the little things: the timing of a cut, the right music, a colour that feels just right, and knowing when a shot has done its job. Sometimes the best edit is knowing what to leave out.",
  email: 'hello@hecticlab.studio',
  location: 'Kochi, India',
  founded_year: 2022,
  image: imgKayak,
};

export const DEMO_SERVICES: Service[] = [
  {
    id: 1,
    title: 'Commercial & Brand Films',
    slug: 'commercial-brand-films',
    description:
      'End-to-end creative direction, cinematography, and edit finishing for automotive launches, fashion lookbooks, and independent retail.',
    deliverables: ['Creative Direction', 'Principal Cinematography', 'Color Grading', 'Master Delivery'],
  },
  {
    id: 2,
    title: 'Short Documentaries',
    slug: 'short-documentaries',
    description:
      'Observational, character-driven stories spotlighting artisans, musicians, outdoor expeditions, and founder journeys.',
    deliverables: ['Story Research', 'Location Sound', 'Documentary Edit', 'Festival & Digital Cuts'],
  },
  {
    id: 3,
    title: 'Culinary & Hospitality Visuals',
    slug: 'culinary-hospitality',
    description:
      'Atmospheric food films and restaurant vignettes designed to evoke texture, aroma, and kitchen cadence.',
    deliverables: ['Macro Motion', 'Kitchen Coverage', 'Social Cutdowns', 'Menu Stills'],
  },
  {
    id: 4,
    title: 'Post-Production & Sound',
    slug: 'post-production-sound',
    description:
      'Rhythmic offline editing, custom soundscapes, and filmic color pipelines for directors and creative agencies.',
    deliverables: ['Editorial Assembly', 'Sound Design', 'DaVinci Color', 'Aspect Adaptations'],
  },
];

export const DEMO_INSIGHTS: Insight[] = [
  {
    id: 1,
    title: 'The footage was good. The edit was better.',
    summary:
      'A little about finding the right sequence, cutting out what doesn\'t work, and making a collection of clips feel like one film.',
    published_at: '2026-10-12',
    image: imgAuto,
  },
  {
    id: 2,
    title: 'Finding the right song is half the battle.',
    summary:
      'On music choices, timing, sound, and why the wrong track can make even a good edit feel completely off.',
    published_at: '2026-09-24',
    image: imgKayak,
  },
  {
    id: 3,
    title: 'One more export. Just to be sure.',
    summary:
      'A familiar story about last-minute adjustments, colour tweaks, tiny details, and the mysterious appearance of version_final_final_03.',
    published_at: '2026-08-30',
    image: imgMusician,
  },
];

export function paginateDemo<T>(
  items: T[],
  page = 1,
  pageSize = 12
): PaginatedResponse<T> {
  const safePage = Math.max(1, page);
  const start = (safePage - 1) * pageSize;
  const results = items.slice(start, start + pageSize);
  const hasNext = start + pageSize < items.length;
  const hasPrev = safePage > 1;
  return {
    count: items.length,
    next: hasNext ? `?page=${safePage + 1}` : null,
    previous: hasPrev ? `?page=${safePage - 1}` : null,
    results,
  };
}

export const DEMO_WORK_CATEGORIES: Category[] = [
  {
    id: 201,
    name: 'Automotive',
    slug: 'automotive',
    description: 'Dynamic tracking, rolling bodywork studies, and kinetic automotive films.',
    image: imgAuto,
    projects_count: 4,
  },
  {
    id: 202,
    name: 'Commercial',
    slug: 'commercial',
    description: 'Brand launch films, hospitality narratives, and visual campaigns.',
    image: imgCulinary,
    projects_count: 3,
  },
  {
    id: 203,
    name: 'Fashion',
    slug: 'fashion',
    description: 'Editorial movement studies, lookbooks, and textile portraiture.',
    image: imgFashion,
    projects_count: 2,
  },
  {
    id: 204,
    name: 'Events',
    slug: 'events',
    description: 'Live sessions, endurance expeditions, and atmospheric event films.',
    image: imgMusician,
    projects_count: 2,
  },
  {
    id: 205,
    name: 'Product',
    slug: 'product',
    description: 'Tactile object studies, craft detail, and macro studio films.',
    image: imgLoom,
    projects_count: 3,
  },
  {
    id: 206,
    name: 'Creative Films',
    slug: 'creative-films',
    description: 'Independent visual essays, monochrome studies, and experimental cuts.',
    image: imgKayak,
    projects_count: 3,
  },
];

const DEMO_WORK_SLUG_MAP: Record<string, number[]> = {
  automotive: [101, 108, 109, 102],
  commercial: [101, 107, 103],
  fashion: [106, 103],
  events: [104, 105],
  product: [107, 103, 106],
  'creative-films': [102, 104, 105],
};

export function filterDemoWorkProjects(categorySlug?: string | null): Project[] {
  if (!categorySlug || categorySlug === 'all') {
    return DEMO_PROJECTS;
  }
  const ids = DEMO_WORK_SLUG_MAP[categorySlug];
  if (ids) {
    return DEMO_PROJECTS.filter((p) => ids.includes(Number(p.id)));
  }
  return DEMO_PROJECTS.filter((p) => {
    const slug =
      p.category_slug ||
      (p.category && typeof p.category === 'object' ? p.category.slug : null);
    return slug === categorySlug;
  });
}
