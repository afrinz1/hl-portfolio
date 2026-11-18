import { Link } from 'react-router-dom';

export function InquiryCta({ variant = 'dark' }: { variant?: 'light' | 'dark' }) {
  return (
    <section
      aria-label="Got something in mind"
      className="bg-[#F3F0E9] text-[#111110] pt-10 pb-24 md:pt-14 md:pb-32"
    >
      <div className="mx-auto max-w-[1440px] px-6 md:px-12">
        {/* Subtle Horizontal Cyan Line at the top */}
        <div className="h-[1.5px] w-full bg-[#14bfb9]" />

        {/* Top Header Row: Brand and Tagline */}
        <div className="mt-8 flex items-baseline justify-between gap-4">
          <span className="font-display text-2xl font-normal tracking-[-0.03em] text-[#111110] sm:text-[26px] md:text-[28px]">
            HECTIC LAB
          </span>
          <span className="font-sans text-xs tracking-tight text-[#111110]/70 sm:text-[13px]">
            independent video production
          </span>
        </div>

        {/* Main Inquiry Statement */}
        <div className="mt-16 sm:mt-20 md:mt-24 max-w-4xl">
          <h2 className="font-display text-[clamp(36px,5.8vw,80px)] font-light leading-[1.04] tracking-[-0.04em] text-[#111110]">
            Got something <span className="font-semibold">in mind?</span>
          </h2>
          <p className="mt-3 text-[13.5px] leading-relaxed text-[#111110]/65 sm:text-[15px]">
            We&apos;d love to hear about the idea, the story, and the kind of work you want to make.
          </p>

          <div className="mt-9 sm:mt-11">
            <Link
              to="/inquiries"
              className="inline-flex items-center justify-center rounded-full border border-[#111110]/35 px-8 py-3 text-[13px] sm:text-sm font-normal tracking-tight text-[#14bfb9] transition-all duration-200 hover:border-[#14bfb9] hover:bg-[#14bfb9]/10 whitespace-nowrap cursor-pointer"
            >
              Got a project?
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
