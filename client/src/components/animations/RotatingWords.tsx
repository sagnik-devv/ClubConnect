import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

export interface RotatingWordItem {
  word: string;
  bg: string;
}

const DEFAULT_WORDS: RotatingWordItem[] = [
  { word: 'Meaningful', bg: '#f6d5b8' },
  { word: 'Creative', bg: '#ffb110' },
  { word: 'Productive', bg: '#e6f3fe' },
  { word: 'Collaborative', bg: '#62aef0' },
  { word: 'Rewarding', bg: '#f64932' },
  { word: 'Memorable', bg: '#f6d5b8' },
  { word: 'Impactful', bg: '#ffb110' },
];

interface RotatingWordsProps {
  words?: RotatingWordItem[];
  intervalMs?: number;
  className?: string;
}

export const RotatingWords: React.FC<RotatingWordsProps> = ({
  words = DEFAULT_WORDS,
  intervalMs = 2500,
  className = '',
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);
  const measureRef = useRef<HTMLSpanElement | null>(null);

  const current = words[index % words.length];

  useEffect(() => {
    if (words.length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [words.length, intervalMs]);

  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const updateWidth = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0) {
        setMeasuredWidth(Math.ceil(rect.width));
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [current.word]);

  return (
    <span className={`relative inline-flex items-baseline align-baseline ${className}`}>
      <span
        ref={measureRef}
        aria-hidden="true"
        className="pointer-events-none invisible absolute left-0 top-0 whitespace-nowrap px-4 py-1 sm:px-6 sm:py-1.5 font-semibold"
      >
        {current.word}
      </span>

      <motion.span
        animate={{
          width: measuredWidth ?? 'auto',
          backgroundColor: current.bg,
        }}
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : {
                width: { type: 'spring', stiffness: 320, damping: 28, mass: 0.8 },
                backgroundColor: { duration: 0.25, ease: 'easeOut' },
              }
        }
        style={{ backgroundColor: current.bg }}
        className="relative inline-flex items-center justify-center overflow-hidden rounded-full px-4 py-1 sm:px-6 sm:py-1.5 text-black font-semibold align-baseline whitespace-nowrap select-none"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={current.word}
            initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: '105%' }}
            animate={{ opacity: 1, y: '0%' }}
            exit={prefersReducedMotion ? { opacity: 0, y: 0 } : { opacity: 0, y: '-105%' }}
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : {
                    y: { type: 'spring', stiffness: 380, damping: 30, mass: 0.8 },
                    opacity: { duration: 0.2, ease: 'easeOut' },
                  }
            }
            className="inline-block whitespace-nowrap"
          >
            {current.word}
          </motion.span>
        </AnimatePresence>
      </motion.span>
    </span>
  );
};
