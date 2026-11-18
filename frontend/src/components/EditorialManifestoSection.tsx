import { useEffect, useMemo, useRef } from 'react';
import type { StudioInfo } from '../api/types';

const MANIFESTO_TEXT =
  "The camera captures the footage. The edit gives it a direction.";

const SUPPORTING_TEXT =
  "We care about the little things: the timing of a cut, the right music, a colour that feels just right, and knowing when a shot has done its job. Sometimes the best edit is knowing what to leave out.";

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

export function EditorialManifestoSection({
  studio,
}: {
  studio?: StudioInfo | null;
}) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const textRef = useRef<HTMLParagraphElement | null>(null);
  const wordRefs = useRef<Array<HTMLSpanElement | null>>([]);

  const words = useMemo(() => MANIFESTO_TEXT.split(/\s+/), []);
  const supportingWords = useMemo(() => SUPPORTING_TEXT.split(/\s+/), []);
  const supportingWordRefs = useRef<Array<HTMLSpanElement | null>>([]);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const applyProgress = (progress: number) => {
      const edge = 3;

      const applyToWords = (
        tokens: string[],
        refs: Array<HTMLSpanElement | null>
      ) => {
        const spanLength = tokens.length + edge;
        tokens.forEach((_, i) => {
          const el = refs[i];
          if (!el) return;
          const wordT = prefersReduced
            ? 1
            : clamp((progress * spanLength - i) / edge, 0, 1);
          const channel = Math.round(77 + (244 - 77) * wordT);
          el.style.color = `rgb(${channel}, ${channel}, ${channel})`;
        });
      };

      applyToWords(words, wordRefs.current);
      applyToWords(supportingWords, supportingWordRefs.current);
    };

    if (prefersReduced) {
      applyProgress(1);
      return;
    }

    let rafId = 0;

    const update = () => {
      rafId = 0;
      const el = textRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 800;

      const startY = vh * 0.86;
      const endY = vh * 0.28 - rect.height * 0.15;
      const raw = (startY - rect.top) / Math.max(1, startY - endY);
      applyProgress(clamp(raw, 0, 1));
    };

    const schedule = () => {
      if (!rafId) {
        rafId = requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [words, supportingWords]);

  return (
    <section
      ref={sectionRef}
      aria-label="Hectic Lab Editorial Manifesto"
      className="bg-[#060607] text-[#f3f2ee] py-28 sm:py-36 md:py-48"
    >
      <div className="mx-auto max-w-[1440px] px-6 md:px-12">
        <div className="mx-auto max-w-[980px] text-center">
          <p className="font-mono-hl mb-8 text-[11px] font-medium uppercase tracking-[-0.01em] text-[#2cf5ef]">
            MANIFESTO
          </p>

          <p
            ref={textRef}
            className="font-display text-[clamp(26px,3.35vw,52px)] font-light leading-[1.16] tracking-[-0.045em] text-balance"
          >
            {words.map((word, idx) => (
              <span key={`${word}-${idx}`}>
                <span
                  ref={(el) => {
                    wordRefs.current[idx] = el;
                  }}
                  style={{ color: '#4d4d4d' }}
                  className="transition-colors duration-75"
                >
                  {word}
                </span>
                {idx < words.length - 1 ? ' ' : ''}
              </span>
            ))}
          </p>

          <p className="mx-auto mt-12 max-w-[540px] text-[14px] leading-[1.7] text-[#f3f2ee]/60 md:text-[15px]">
            {supportingWords.map((word, idx) => (
              <span key={`${word}-${idx}`}>
                <span
                  ref={(el) => {
                    supportingWordRefs.current[idx] = el;
                  }}
                  style={{ color: '#4d4d4d' }}
                  className="transition-colors duration-75"
                >
                  {word}
                </span>
                {idx < supportingWords.length - 1 ? ' ' : ''}
              </span>
            ))}
          </p>
        </div>
      </div>
    </section>
  );
}
