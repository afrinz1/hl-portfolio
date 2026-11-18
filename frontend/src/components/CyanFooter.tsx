import { Link } from 'react-router-dom';
import type { StudioInfo } from '../api/types';

export function CyanFooter({ studio }: { studio?: StudioInfo | null }) {
  const instagramUrl = studio?.instagram || null;
  const twitterUrl = studio?.twitter || null;

  return (
    <footer className="bg-[#2cf5ef] text-[#111110] pt-14 md:pt-16 overflow-hidden">
      <div className="mx-auto max-w-[1440px] px-6 md:px-12">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 md:grid-cols-[200px_1fr_auto]">
          {/* Column 1: Explore */}
          <div>
            <h3 className="font-display text-lg font-medium uppercase tracking-tight">
              EXPLORE
            </h3>
            <ul className="mt-3 space-y-1 text-[14px] leading-snug">
              <li>
                <Link to="/" className="hover:underline underline-offset-4">
                  home
                </Link>
              </li>
              <li>
                <Link to="/work" className="hover:underline underline-offset-4">
                  work
                </Link>
              </li>
              <li>
                <Link to="/studio" className="hover:underline underline-offset-4">
                  studio + services
                </Link>
              </li>
              <li>
                <Link to="/inquiries" className="hover:underline underline-offset-4">
                  inquiries
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Connect */}
          <div>
            <h3 className="font-display text-lg font-medium uppercase tracking-tight">
              CONNECT
            </h3>
            <ul className="mt-3 space-y-1 text-[14px] leading-snug">
              <li>
                {instagramUrl ? (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline underline-offset-4"
                  >
                    instagram
                  </a>
                ) : (
                  <Link to="/inquiries" className="hover:underline underline-offset-4">
                    instagram
                  </Link>
                )}
              </li>
              <li>
                {twitterUrl ? (
                  <a
                    href={twitterUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline underline-offset-4"
                  >
                    twitter
                  </a>
                ) : (
                  <Link to="/inquiries" className="hover:underline underline-offset-4">
                    twitter
                  </Link>
                )}
              </li>
            </ul>
          </div>

          {/* Column 3: Studio & Privacy */}
          <div className="col-span-2 sm:col-span-1 md:text-right">
            <h3 className="font-display text-lg font-medium uppercase tracking-tight">
              STUDIO
            </h3>
            <ul className="mt-3 space-y-1 text-[14px] leading-snug">
              <li>
                <Link to="/trust" className="hover:underline underline-offset-4">
                  studio analytics
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:underline underline-offset-4">
                  policy
                </Link>
              </li>
              <li>
                <Link to="/editor" className="hover:underline underline-offset-4">
                  editor access
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 md:mt-16 flex justify-end">
          <p className="text-[11px] tracking-tight">2026 all rights reserved</p>
        </div>

        <div className="mt-2 h-px w-full bg-[#111110]/25" />
      </div>

      {/* Oversized HECTIC wordmark cropped cleanly along the bottom edge */}
      <div className="mt-4 w-full select-none overflow-hidden px-2 md:px-4">
        <div
          aria-hidden="true"
          className="font-display font-medium uppercase text-[#111110] leading-[0.74] tracking-[-0.05em] text-[25.5vw] -mb-[0.06em] whitespace-nowrap text-center"
        >
          HECTIC
        </div>
      </div>
    </footer>
  );
}
