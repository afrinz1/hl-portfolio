export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Category {
  id: number | string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  thumbnail?: string | null;
  cover_image?: string | null;
  cover?: string | null;
  project_count?: number;
  projects_count?: number;
  order?: number;
}

export interface ProjectCategoryRef {
  id?: number | string;
  name?: string;
  slug?: string;
}

export interface Project {
  id: number | string;
  title: string;
  slug: string;
  description?: string | null;
  summary?: string | null;
  year?: number | string | null;
  release_year?: number | string | null;
  client?: string | null;
  client_name?: string | null;
  category?: ProjectCategoryRef | string | number | null;
  category_name?: string | null;
  category_slug?: string | null;
  thumbnail?: string | null;
  cover_image?: string | null;
  image?: string | null;
  video?: string | null;
  video_url?: string | null;
  primary_video?: string | null;
  is_featured?: boolean;
  featured?: boolean;
  status?: boolean;
  active_status?: boolean;
  display_order?: number;
  order?: number;
  created_at?: string | null;
  previous_project?: { slug: string; title: string } | null;
  next_project?: { slug: string; title: string } | null;
  related_projects?: Project[] | null;
}

export interface ProjectMedia {
  id: number | string;
  title?: string | null;
  caption?: string | null;
  media_type?: 'image' | 'video' | string;
  type?: 'image' | 'video' | string;
  file?: string | null;
  url?: string | null;
  media_url?: string | null;
  poster_url?: string | null;
  image?: string | null;
  video?: string | null;
  video_url?: string | null;
  thumbnail?: string | null;
  alt_text?: string | null;
  display_order?: number;
  order?: number;
}

export interface StudioInfo {
  id?: number | string;
  uuid?: string;
  created_at?: string | null;
  updated_at?: string | null;
  name?: string | null;
  tagline?: string | null;
  description?: string | null;
  about?: string | null;
  logo_url?: string | null;
  vision?: string | null;
  bio?: string | null;
  approach?: string | null;
  creative_approach?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  address?: string | null;
  instagram?: string | null;
  twitter?: string | null;
  youtube?: string | null;
  vimeo?: string | null;
  image?: string | null;
  cover_image?: string | null;
  founded_year?: number | string | null;
}

export interface Service {
  id: number | string;
  uuid?: string;
  created_at?: string | null;
  updated_at?: string | null;
  title?: string;
  name?: string;
  slug?: string;
  description?: string | null;
  image_url?: string | null;
  display_order?: number;
  is_active?: boolean;
  deliverables?: string[] | string | null;
  order?: number;
}

export interface Insight {
  id: number | string;
  uuid?: string;
  created_at?: string | null;
  updated_at?: string | null;
  title: string;
  slug?: string;
  summary?: string | null;
  excerpt?: string | null;
  content?: string | null;
  analysis_data?: unknown;
  generated_at?: string | null;
  is_active?: boolean;
  published_at?: string | null;
  image?: string | null;
  cover_image?: string | null;
}

export interface InquiryPayload {
  name: string;
  email: string;
  service?: number | string;
  company?: string;
  phone?: string;
  budget_range?: string;
  message: string;
}

export interface InquiryResponse {
  id?: number | string;
  name?: string;
  email?: string;
  service?: number | string;
  message?: string;
  created_at?: string;
}

export interface AuthUser {
  id: number;
  username: string;
  email?: string;
  is_staff: boolean;
  is_superuser: boolean;
  is_editor: boolean;
  csrfToken?: string;
  /** Short-lived JWT access token returned by the login endpoint. */
  access?: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface EditorProjectPayload {
  title: string;
  slug?: string;
  category: number | string;
  client?: string;
  description: string;
  cover_image?: string;
  year: number;
  status: boolean;
  active_status?: boolean;
  display_order?: number;
}

export interface EditorMediaPayload {
  project: number | string;
  media_type: 'image' | 'video';
  media_url: string;
  poster_url?: string;
  caption?: string;
  alt_text?: string;
  display_order?: number;
}

export interface EditorInquiry {
  id: number;
  uuid: string;
  name: string;
  email: string;
  company?: string;
  service?: number | null;
  service_title?: string | null;
  budget_range?: string;
  message: string;
  status: 'new' | 'contacted' | 'in_progress' | 'completed' | string;
  created_at: string;
  updated_at: string;
}

export type FieldErrors = Record<string, string[]>;

/* ------------------------------------------------------------------ *
 * Portfolio analytics (served from the live Django database)
 * ------------------------------------------------------------------ */

export interface AnalyticsTotals {
  projects: number;
  categories: number;
  media_assets: number;
  years_covered: number;
  year_span: { from: number; to: number } | null;
  average_media_per_project: number;
}

export interface CategoryDistributionPoint {
  name: string;
  slug: string;
  projects: number;
}

export interface ProjectsByMonthPoint {
  month: string;
  label: string;
  projects: number;
}

export interface ProjectsByYearPoint {
  year: number;
  label: string;
  projects: number;
}

export interface MediaBreakdownPoint {
  type: 'image' | 'video' | string;
  label: string;
  count: number;
}

export interface SelectedWorkItem {
  title: string;
  slug: string;
  year: number | null;
  client: string | null;
  cover_image: string | null;
  category: string | null;
  media_count: number;
}

/** Response shape of `GET /api/v1/analytics/overview/`. */
export interface PortfolioOverview {
  generated_at: string;
  source: 'database' | string;
  totals: AnalyticsTotals;
  category_distribution: CategoryDistributionPoint[];
  projects_by_year: ProjectsByYearPoint[];
  projects_by_month: ProjectsByMonthPoint[];
  media_breakdown: MediaBreakdownPoint[];
  selected_work: SelectedWorkItem[];
}
