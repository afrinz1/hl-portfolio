
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Lock, Menu, ShieldCheck, X } from 'lucide-react';
import logoUrl from '../assets/hectic lab logo.png';
import { useAuth } from '../context/AuthContext';

export function HecticLogoMark({
  className = 'h-7 w-7',
  invert = false,
}: {
  className?: string;
  invert?: boolean;
}) {
  return (
    <img
      src={logoUrl}
      alt=""
      aria-hidden="true"
      className={`${className} object-contain ${invert ? 'brightness-0 invert' : ''}`}
    />
  );
}

const NAV_ITEMS = [
  { label: 'home', to: '/' },
  { label: 'work', to: '/work' },
  { label: 'trust', to: '/trust' },
  { label: 'studio + services', to: '/studio' },
];

export function Navbar({
  overlay = false,
  tone = 'light',
  ctaLabel = 'Got a project?',
  fixed = false,
  className = '',
}: {
  overlay?: boolean;
  tone?: 'dark' | 'light';
  ctaLabel?: string;
  fixed?: boolean;
  className?: string;
}) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isLight = tone === 'light';

  const isActive = (to: string) => {
    if (to === '/') return pathname === '/';

    if (to === '/work') {
      return (
        pathname.startsWith('/work') ||
        pathname.startsWith('/categories') ||
        pathname.startsWith('/projects')
      );
    }

    return pathname.startsWith(to);
  };

  const headerPosition = overlay
    ? 'absolute'
    : fixed
      ? 'fixed'
      : 'sticky';

  // Apple-style "liquid glass" surface: a frosted, translucent fill with a
  // soft diffuse shadow and generously rounded corners so all four edges stay
  // soft. No border — the edge is defined purely by the tint and shadow.
  // The fill is dense enough that the black nav text stays readable even when
  // a dark hero (e.g. a project video) slides underneath the bar.
  const glassTint = overlay
    ? isLight
      ? 'bg-white/22'
      : 'bg-[#060607]/30'
    : isLight
      ? 'bg-[#FBF9F4]/50'
      : 'bg-[#0a0a0b]/45';

  const glassShadow = isLight
    ? 'shadow-[0_10px_34px_-12px_rgba(17,17,16,0.18)]'
    : 'shadow-[0_10px_34px_-12px_rgba(0,0,0,0.6)]';

  const glassSurface = `backdrop-blur-2xl backdrop-saturate-[1.8] ${glassTint} ${glassShadow}`;

  // Chromium-only backdrop refraction: it bends whatever is behind the bar.
  // Safari/Firefox reject an SVG `url()` inside backdrop-filter and fall back
  // to the plain frost from the classes above.
  const refractionStyle = {
    backdropFilter: 'blur(32px) saturate(1.8) url(#navbar-liquid-glass)',
  };

  const displacementRef = useRef<SVGFEDisplacementMapElement | null>(null);

  // Deepen the bend as the page scrolls down, so the glass visibly warps the
  // content sliding underneath it.
  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const node = displacementRef.current;

      if (!node) return;

      const depth = Math.min(window.scrollY / 240, 1);
      node.setAttribute('scale', (8 + depth * 22).toFixed(1));
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <header
      className={`${headerPosition} left-0 top-0 z-40 w-full px-3 py-2.5 transition-all duration-300 md:px-6 md:py-3 ${className}`}
    >
      {/* Backdrop lens definition — a noise field drives the displacement so the
          bar bends the page behind it. Never painted itself. */}
      <svg
        aria-hidden="true"
        focusable="false"
        className="pointer-events-none absolute h-0 w-0 overflow-hidden"
      >
        <defs>
          <filter
            id="navbar-liquid-glass"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.009 0.016"
              numOctaves="2"
              seed="9"
              result="noise"
            />
            <feGaussianBlur in="noise" stdDeviation="1.6" result="smooth" />
            <feDisplacementMap
              ref={displacementRef}
              in="SourceGraphic"
              in2="smooth"
              scale="8"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      <div
        className={`mx-auto flex max-w-[1440px] items-center justify-between gap-6 rounded-[24px] px-4 py-2 md:px-7 md:py-2.5 ${glassSurface}`}
        style={refractionStyle}
      >

        {/* Zone 1: Brand mark */}
        <Link
          to="/"
          aria-label="Hectic Lab home"
          onClick={() => setMobileOpen(false)}
          className="inline-flex shrink-0 items-center whitespace-nowrap text-[#111110] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#14bfb9]"
        >
          <HecticLogoMark className="h-7 w-8" />
        </Link>

        {/* Zone 2: Navigation links */}
        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-8 text-[13px] font-normal tracking-tight text-[#111110] md:flex"
        >
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.to);

            return (
              <Link
                key={item.to}
                to={item.to}
                className={`shrink-0 whitespace-nowrap transition-opacity hover:opacity-65 ${
                  active
                    ? 'underline decoration-[1.25px] underline-offset-[5px]'
                    : ''
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Zone 3: Primary CTA & Editor status */}
        <div className="flex shrink-0 items-center gap-4">
          {user?.is_editor ? (
            <Link
              to="/editor"
              className={`hidden shrink-0 whitespace-nowrap items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-mono-hl transition-all md:inline-flex ${
                isLight
                  ? 'bg-[#14bfb9]/15 border border-[#14bfb9]/40 text-[#0c7c76] hover:bg-[#111110] hover:text-[#2cf5ef]'
                  : 'bg-[#14bfb9]/20 border border-[#14bfb9]/40 text-[#2cf5ef] hover:bg-white hover:text-[#060607]'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Editor Studio</span>
            </Link>
          ) : (
            <Link
              to="/login"
              title="Editor Sign In"
              className="hidden shrink-0 whitespace-nowrap items-center gap-1 text-[12px] font-mono-hl text-[#111110] opacity-60 hover:opacity-100 transition-opacity md:inline-flex"
            >
              <Lock className="h-3 w-3" />
              <span>editor</span>
            </Link>
          )}

          <Link
            to="/inquiries"
            className={`hidden shrink-0 whitespace-nowrap text-[13px] font-normal tracking-tight text-[#111110] transition-opacity hover:opacity-75 md:inline-block ${
              pathname.startsWith('/inquiries')
                ? 'underline decoration-[1.25px] underline-offset-[5px]'
                : ''
            }`}
          >
            {ctaLabel}
          </Link>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label={
              mobileOpen ? 'Close navigation menu' : 'Open navigation menu'
            }
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center text-[#111110] md:hidden"
          >
            {mobileOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div
          className={`mx-auto mt-2 max-w-[1440px] rounded-[24px] px-6 py-6 text-[#111110] backdrop-blur-2xl backdrop-saturate-[1.7] md:hidden ${glassTint}`}
          style={refractionStyle}
        >
          <nav
            aria-label="Mobile navigation"
            className="flex flex-col gap-4"
          >
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.to);

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={`py-1.5 text-lg ${
                    active ? 'underline underline-offset-4' : ''
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            {user?.is_editor ? (
              <Link
                to="/editor"
                onClick={() => setMobileOpen(false)}
                className="py-1.5 text-lg font-medium"
              >
                Editor Studio ({user.username})
              </Link>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="py-1.5 text-sm font-mono-hl opacity-70"
              >
                Editor Sign In
              </Link>
            )}

            <Link
              to="/inquiries"
              onClick={() => setMobileOpen(false)}
              className="py-1.5 text-lg font-normal"
            >
              {ctaLabel}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
