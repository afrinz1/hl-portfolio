
import { useEffect, useState } from 'react';
import { ArrowDownRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import birdOne from '../assets/bird1.png';
import birdTwo from '../assets/bird2.png';
import heroSky from '../assets/sky.webp';
import { Navbar } from './Navbar';

export function HomeHero() {
  const [playIntro, setPlayIntro] = useState(false);

  useEffect(() => {
    const checkIntro = () => {
      if (document.documentElement.classList.contains('hero-start')) {
        setPlayIntro(true);
      }
    };

    // Check in case the loader has already triggered.
    checkIntro();

    // Listen for the loader trigger if it hasn't happened yet.
    const observer = new MutationObserver(checkIntro);

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* Rendered outside the hero <section>: the section carries a transform
          for the intro reveal, which would turn the fixed navbar into an
          absolutely-positioned bar and stop it sticking to the top. */}
      <Navbar
        className={`hero-navbar ${playIntro ? 'hero-intro' : ''}`}
        tone="light"
        ctaLabel="lets build"
        fixed
      />

      <section
        aria-labelledby="home-hero-title"
        style={{
          backgroundImage: `linear-gradient(rgba(247, 246, 242, 0.12), rgba(247, 246, 242, 0.12)), url(${heroSky})`,
        }}
        className={`hero-background relative flex min-h-[100svh] w-full flex-col overflow-hidden bg-[#F3F0E9] bg-cover bg-center text-[#111110] ${
          playIntro ? 'hero-intro' : ''
        }`}
      >
        <div aria-hidden="true" className="h-[93px] shrink-0 md:h-[85px]" />

        <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
          <div className="flex items-center justify-center gap-[clamp(0.5rem,4vw,3rem)]">
            <img
              src={birdOne}
              alt=""
              aria-hidden="true"
              className="hero-bird-left w-[clamp(3.5rem,9vw,6.5rem)] shrink-0 -translate-y-5 object-contain mix-blend-multiply sm:-translate-y-7"
            />

            <h1
              id="home-hero-title"
              className="hero-title whitespace-nowrap text-center font-balfontheim text-[clamp(2rem,5.5vw,4rem)] leading-none"
            >
              hectic labs
            </h1>

            <img
              src={birdTwo}
              alt=""
              aria-hidden="true"
              className="hero-bird-right w-[clamp(3.5rem,10vw,7rem)] shrink-0 translate-y-5 object-contain mix-blend-multiply sm:translate-y-7"
            />
          </div>
        </div>

        <div className="hero-footer mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-6 pb-8 sm:flex-row sm:items-end sm:justify-between md:px-12 md:pb-10">
          <div className="flex items-center gap-4">
            <p className="text-[11px] font-medium uppercase leading-[1.3] tracking-[-0.02em]">
              Build your next
              <br />
              <span className="text-[#14bfb9]">
                creative visual with us.
              </span>
            </p>

            <Link
              to="/inquiries"
              aria-label="Start a project inquiry"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#111110] text-[#111110] transition-colors hover:bg-[#111110] hover:text-[#F3F0E9]"
            >
              <ArrowDownRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="flex max-w-[330px] flex-col gap-2 sm:items-end sm:text-right">
            <span
              aria-hidden="true"
              className="text-sm font-semibold tracking-[0.3em]"
            >
              ***
            </span>

            <p className="text-[11px] leading-[1.4] text-[#111110]/60">
              We make sure your ideas never go to waste. Let&apos;s turn them into
              something meaningful through clean visuals, thoughtful storytelling
              and well-crafted edits.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
