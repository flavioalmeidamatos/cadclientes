import React, { useEffect, useState } from 'react';
import { LOGO_URL } from '../constants';

interface PreloaderProps {
  onComplete: () => void;
}

export const Preloader: React.FC<PreloaderProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Simulate loading progress
    const interval: ReturnType<typeof setInterval> = setInterval(() => {
      setProgress((prev: number) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        // Random increment to simulate real loading
        return prev + Math.random() * 10;
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      const timeout: ReturnType<typeof setTimeout> = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onComplete, 500);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [progress, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[60] flex flex-col items-center justify-center bg-background-light dark:bg-background-dark transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
    >
      <div className="w-full max-w-xs flex flex-col items-center gap-8 p-6">
        {/* Logo Container */}
        <div className="relative animate-fade-in-up">
          <img
            src={LOGO_URL}
            alt="CKDEV Soluções"
            className="h-24 md:h-32 object-contain drop-shadow-sm dark:invert dark:hue-rotate-180"
            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
              // Fallback if image fails to load
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement?.classList.add('fallback-text');
            }}
          />
          {/* Fallback Text in case image breaks */}
          <div className="hidden fallback-text flex items-center gap-1 justify-center">
            <span className="text-slate-900 dark:text-white text-5xl font-bold tracking-tighter">CK</span>
            <span className="text-primary text-5xl font-bold tracking-tighter">DEV</span>
          </div>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-r from-primary to-orange-400 shadow-[0_0_10px_rgba(242,113,28,0.5)] transition-all duration-300 ease-out"
            ref={(el: HTMLDivElement | null) => { if (el) el.style.width = `${Math.min(progress, 100)}%`; }}
          />
        </div>

        {/* Percentage Text */}
        <span className="text-xs font-medium text-slate-400 dark:text-slate-500 font-mono">
          {Math.min(Math.round(progress), 100)}%
        </span>
      </div>
    </div>
  );
};