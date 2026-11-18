import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

/**
 * The archive thumbnail used on Work, Category and Category-projects pages.
 * All three pages had a near-identical copy of this markup, so hover behaviour
 * and fallbacks had already started to drift between them.
 */
export function ProjectCard({
  to,
  title,
  index,
  meta,
  image,
  video,
  onImageError,
}: {
  to: string;
  title: string;
  index: number;
  meta?: string | number | null;
  image?: string | null;
  video?: string | null;
  onImageError?: () => void;
}) {
  return (
    <Link to={to} className="group block min-w-0">
      <div className="aspect-[4/5] w-full overflow-hidden bg-[#e8e7e1]">
        {image ? (
          <img
            src={image}
            alt={title}
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={onImageError}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        ) : video ? (
          <video
            src={video}
            muted
            loop
            playsInline
            preload="metadata"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-end bg-[#e8e7e1] p-4 sm:p-5">
            <span className="font-display text-xs sm:text-sm uppercase tracking-tight text-[#111110]/60">
              {title}
            </span>
          </div>
        )}
      </div>

      <div className="mt-2.5 sm:mt-3 flex items-baseline justify-between gap-2">
        <p className="font-display text-[13px] sm:text-[15px] font-normal uppercase tracking-tight truncate text-[#111110]">
          <span className="font-mono-hl text-[#14bfb9]">( {index} )</span> {title}
        </p>
        {meta ? (
          <span className="font-mono-hl text-[10px] sm:text-[11px] text-[#111110]/65 shrink-0">
            {meta}
          </span>
        ) : null}
      </div>
    </Link>
  );
}

export function ProjectGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-x-3.5 gap-y-8 sm:gap-x-6 sm:gap-y-12 lg:grid-cols-4">
      {children}
    </div>
  );
}
