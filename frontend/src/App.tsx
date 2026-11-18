import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AIChatbot } from './components/AIChatbot';
import { LoadingScreen } from './components/LoadingScreen';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  usePageMeta,
} from './hooks/usePageMeta';
import type { PageMeta } from './hooks/usePageMeta';

const HomePage = lazy(() =>
  import('./pages/HomePage').then((m) => ({ default: m.HomePage })),
);
const WorkPage = lazy(() =>
  import('./pages/WorkPage').then((m) => ({ default: m.WorkPage })),
);
const CategoriesPage = lazy(() =>
  import('./pages/CategoriesPage').then((m) => ({ default: m.CategoriesPage })),
);
const CategoryProjectsPage = lazy(() =>
  import('./pages/CategoryProjectsPage').then((m) => ({
    default: m.CategoryProjectsPage,
  })),
);
const ProjectDetailPage = lazy(() =>
  import('./pages/ProjectDetailPage').then((m) => ({
    default: m.ProjectDetailPage,
  })),
);
const StudioPage = lazy(() =>
  import('./pages/StudioPage').then((m) => ({ default: m.StudioPage })),
);
const InquiryPage = lazy(() =>
  import('./pages/InquiryPage').then((m) => ({ default: m.InquiryPage })),
);
const PrivacyPage = lazy(() =>
  import('./pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage })),
);
const TrustPage = lazy(() =>
  import('./pages/TrustPage').then((m) => ({ default: m.TrustPage })),
);
const LoginPage = lazy(() =>
  import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const EditorDashboardPage = lazy(() =>
  import('./pages/EditorDashboardPage').then((m) => ({
    default: m.EditorDashboardPage,
  })),
);
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);

const FALLBACK_META: PageMeta = {
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
};

const ROUTE_META: Record<string, PageMeta> = {
  '/': FALLBACK_META,
  '/work': {
    title: 'Work — Hectic Lab',
    description:
      'Selected films and visual studies from the Hectic Lab archive.',
  },
  '/categories': {
    title: 'Categories — Hectic Lab',
    description:
      'Browse the Hectic Lab archive by category — automobile, documentary, fashion, restaurant, retail and experimental.',
  },
  '/studio': {
    title: 'Studio + Services — Hectic Lab',
    description: 'How Hectic Lab works and the production services it offers.',
  },
  '/inquiries': {
    title: 'Inquiries — Hectic Lab',
    description: 'Start a project with Hectic Lab.',
  },
  '/privacy': {
    title: 'Privacy Policy — Hectic Lab',
    description: 'How Hectic Lab handles the information you submit.',
  },
  '/trust': {
    title: 'Studio Analytics — Hectic Lab',
    description:
      'A transparent report on the Hectic Lab archive, audience and reach.',
  },
  '/login': {
    title: 'Editor Sign In — Hectic Lab',
    description: 'Sign in to the Hectic Lab editor studio.',
  },
};

function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const target = hash ? document.getElementById(hash.slice(1)) : null;

      if (target) {
        target.scrollIntoView();
      } else {
        window.scrollTo(0, 0);
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pathname, hash]);

  return null;
}

function RouteMeta() {
  const { pathname } = useLocation();

  usePageMeta(ROUTE_META[pathname] ?? FALLBACK_META);

  return null;
}

function RouteFallback() {
  return (
    <div
      role="status"
      aria-label="Loading page"
      className="flex min-h-[60vh] items-center justify-center bg-[#F3F0E9]"
    >
      <span className="font-mono-hl text-[11px] uppercase tracking-wider text-[#111110]/65">
        Loading
      </span>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LoadingScreen />

      <BrowserRouter>
        <ScrollToTop />
        <RouteMeta />

        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/work" element={<WorkPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/categories/:slug" element={<CategoryProjectsPage />} />
            <Route path="/projects/:slug" element={<ProjectDetailPage />} />
            <Route path="/studio" element={<StudioPage />} />
            <Route path="/services" element={<Navigate to="/studio#services" replace />} />
            <Route path="/inquiries" element={<InquiryPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/trust" element={<TrustPage />} />

            {/* Authentication & Editor Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/editor/login" element={<Navigate to="/login" replace />} />
            <Route
              path="/editor"
              element={
                <ProtectedRoute>
                  <EditorDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/editor/*"
              element={
                <ProtectedRoute>
                  <EditorDashboardPage />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>

        <AIChatbot />
      </BrowserRouter>
    </AuthProvider>
  );
}
