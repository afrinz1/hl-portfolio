import { useEffect, useState } from 'react';
import landingImage from '../assets/loading.png';

export function LoadingScreen() {
  const [progress, setProgress] = useState(1);
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }

        return prev + 1;
      });
    }, 25);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress === 100) {
      const exitTimer = setTimeout(() => {
        // Trigger the hero intro when the loader starts exiting.
        document.documentElement.classList.add('hero-start');
        setExiting(true);
      }, 300);

      const removeTimer = setTimeout(() => {
        setVisible(false);
      }, 1200);

      return () => {
        clearTimeout(exitTimer);
        clearTimeout(removeTimer);
      };
    }
  }, [progress]);

  if (!visible) return null;

  const fill = Math.max(progress, 2);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-[#F3F0E9]
        transition-[opacity,transform] duration-[900ms]
        ease-[cubic-bezier(0.76,0,0.24,1)]
        ${
          exiting
            ? '-translate-y-3 opacity-0 pointer-events-none'
            : 'translate-y-0 opacity-100'
        }`}
    >
      <div
        className={`loader-rise flex w-[min(52vw,180px)] flex-col items-center transition-all duration-700 ease-out ${
          exiting ? '-translate-y-5 opacity-0' : 'translate-y-0 opacity-100'
        }`}
      >
        <img
          src={landingImage}
          alt="Hectic Lab"
          className="h-auto w-full object-contain brightness-0"
        />
        <div className="mt-9 w-[72%] max-w-[320px]">
          <div className="h-px overflow-hidden bg-[#111110]/10">
          <div
              className="h-full bg-[#14bfb9] transition-[width] duration-150 ease-out"
              style={{ width: `${fill}%` }}
          />
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.2em] text-[#73726d]">
            <span>Loading</span>
            <span className="font-mono-hl tabular-nums">
              {String(progress).padStart(3, '0')}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
