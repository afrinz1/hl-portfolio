import type { ReactNode } from 'react';

/**
 * The page-level container. Every page used to repeat
 * `mx-auto max-w-[1440px] px-6 … md:px-12 …` by hand, with the vertical
 * padding drifting between pt-10 / pt-12 and pb-20 / pb-28.
 */
export function PageShell({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main
      className={`mx-auto max-w-[1440px] px-6 pt-12 pb-20 md:px-12 md:pt-16 ${className}`}
    >
      {children}
    </main>
  );
}
