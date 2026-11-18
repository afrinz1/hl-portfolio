import { Link } from 'react-router-dom';
import { CyanFooter } from '../components/CyanFooter';
import { Navbar } from '../components/Navbar';
import { PageShell } from '../components/PageShell';
import { usePageMeta } from '../hooks/usePageMeta';

const LINKS = [
  { label: 'home', to: '/' },
  { label: 'work', to: '/work' },
  { label: 'studio + services', to: '/studio' },
  { label: 'studio analytics', to: '/trust' },
];

export function NotFoundPage() {
  usePageMeta({
    title: 'Page not found — Hectic Lab',
    description: 'The page you were looking for could not be found.',
  });

  return (
    <div className="min-h-screen bg-[#F3F0E9] text-[#111110]">
      <Navbar />

      <PageShell>
        <div className="max-w-3xl">
          <p className="font-mono-hl text-[11px] uppercase tracking-wider text-[#14bfb9]">
            Error 404
          </p>
          <h1 className="mt-4 font-display text-[clamp(44px,6vw,88px)] font-light uppercase leading-[0.94] tracking-[-0.05em]">
            Not found
          </h1>
          <p className="mt-6 text-[15px] leading-[1.7] text-[#111110]/80">
            That page has moved, been renamed, or never existed. Here is where you
            can pick the trail back up.
          </p>

          <nav aria-label="Recovery links" className="mt-10">
            <ul className="divide-y divide-[#111110]/10 border-y border-[#111110]/10">
              {LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="group flex items-baseline justify-between gap-6 py-4 transition-opacity hover:opacity-65"
                  >
                    <span className="font-display text-lg tracking-tight">
                      {link.label}
                    </span>
                    <span className="font-mono-hl text-[11px] text-[#111110]/65">
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </PageShell>

      <CyanFooter />
    </div>
  );
}
