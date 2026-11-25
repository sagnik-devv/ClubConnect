import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface RevealTextProps {
  text: string;
  className?: string;
  mode?: 'word' | 'char';
  delay?: number;
}

export const RevealText: React.FC<RevealTextProps> = ({
  text,
  className = '',
  mode = 'word',
  delay = 0,
}) => {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <span className={className}>{text}</span>;
  }

  if (mode === 'char') {
    const chars = Array.from(text);
    return (
      <motion.span
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.5 }}
        className={`inline-block ${className}`}
        aria-label={text}
      >
        {chars.map((char, idx) => (
          <motion.span
            key={idx}
            aria-hidden="true"
            variants={{
              hidden: { opacity: 0, y: 8 },
              visible: {
                opacity: 1,
                y: 0,
                transition: {
                  duration: 0.25,
                  ease: 'easeOut',
                  delay: delay + idx * 0.02,
                },
              },
            }}
            className="inline-block"
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        ))}
      </motion.span>
    );
  }

  const words = text.split(' ');
  return (
    <motion.span
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.4 }}
      className={className}
    >
      {words.map((word, idx) => (
        <motion.span
          key={`${word}-${idx}`}
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: {
              opacity: 1,
              y: 0,
              transition: {
                duration: 0.35,
                ease: [0.22, 1, 0.36, 1],
                delay: delay + idx * 0.03,
              },
            },
          }}
          className="inline-block mr-[0.25em] last:mr-0"
        >
          {word}
        </motion.span>
      ))}
    </motion.span>
  );
};
