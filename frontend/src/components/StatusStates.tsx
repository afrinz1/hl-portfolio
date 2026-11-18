import React from 'react';
import { RefreshCw } from 'lucide-react';

export function SkeletonBlock({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-current/10 ${className}`}
      aria-hidden="true"
    />
  );
}

export function SkeletonCardGrid({
  count = 6,
  columnsClass = 'grid-cols-2 lg:grid-cols-4',
}: {
  count?: number;
  columnsClass?: string;
}) {
  return (
    <div className={`grid ${columnsClass} gap-x-3.5 gap-y-8 sm:gap-x-6 sm:gap-y-10`} aria-label="Loading content">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="aspect-[4/5] w-full animate-pulse bg-[#e8e7e1]" />
          <div className="h-4 w-2/3 animate-pulse bg-[#e8e7e1]" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  dark = false,
  action,
}: {
  title: string;
  description: string;
  dark?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <div
      className={`border-y py-14 px-4 text-center ${
        dark
          ? 'border-[#f3f2ee]/15 text-[#f3f2ee]'
          : 'border-[#0a0a0b]/15 text-[#0a0a0b]'
      }`}
    >
      <p className="font-display text-xl font-normal tracking-tight">{title}</p>
      <p
        className={`mt-2 max-w-md mx-auto text-sm ${
          dark ? 'text-[#f3f2ee]/65' : 'text-[#0a0a0b]/60'
        }`}
      >
        {description}
      </p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
  dark = false,
}: {
  message: string;
  onRetry?: () => void;
  dark?: boolean;
}) {
  return (
    <div
      role="alert"
      className={`border-y py-10 px-2 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center ${
        dark
          ? 'border-[#f3f2ee]/20 text-[#f3f2ee]'
          : 'border-[#0a0a0b]/20 text-[#0a0a0b]'
      }`}
    >
      <div>
        <p className="font-mono-hl text-xs uppercase tracking-wider text-[#14bfb9]">
          Unable to load data
        </p>
        <p className="mt-1.5 text-sm leading-relaxed max-w-xl opacity-80">{message}</p>
      </div>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-xs font-normal tracking-wide transition-colors shrink-0 cursor-pointer ${
            dark
              ? 'border-[#f3f2ee]/40 text-[#f3f2ee] hover:bg-[#f3f2ee] hover:text-[#060607]'
              : 'border-[#0a0a0b]/40 text-[#0a0a0b] hover:bg-[#0a0a0b] hover:text-[#f3f2ee]'
          }`}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </button>
      ) : null}
    </div>
  );
}

export function PaginationBar({
  count,
  currentPage,
  hasPrevious,
  hasNext,
  onPageChange,
  itemCountOnPage,
}: {
  count: number;
  currentPage: number;
  hasPrevious: boolean;
  hasNext: boolean;
  onPageChange: (nextPage: number) => void;
  itemCountOnPage: number;
}) {
  if (!hasPrevious && !hasNext && count <= itemCountOnPage) {
    return null;
  }

  return (
    <nav
      aria-label="Pagination"
      className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-[#111110]/15 pt-6"
    >
      <p className="font-mono-hl text-xs text-[#111110]/65">
        Page {currentPage} · {count} total {count === 1 ? 'item' : 'items'}
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={!hasPrevious}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          className="rounded-full border border-[#111110]/35 px-5 py-2 text-xs font-normal tracking-wide text-[#111110] transition-colors hover:bg-[#111110] hover:text-[#F3F0E9] disabled:cursor-not-allowed disabled:opacity-30 cursor-pointer"
        >
          ← Previous
        </button>
        <button
          type="button"
          disabled={!hasNext}
          onClick={() => onPageChange(currentPage + 1)}
          className="rounded-full border border-[#111110]/35 px-5 py-2 text-xs font-normal tracking-wide text-[#111110] transition-colors hover:bg-[#111110] hover:text-[#F3F0E9] disabled:cursor-not-allowed disabled:opacity-30 cursor-pointer"
        >
          Next →
        </button>
      </div>
    </nav>
  );
}
