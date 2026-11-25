import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface AnimatedHeadlineProps {
  text: string;
  as?: 'h1' | 'h2' | 'h3';
  className?: string;
  delay?: number;
}

export const AnimatedHeadline: React.FC<AnimatedHeadlineProps> = ({
  text,
  as = 'h2',
  className = '',
  delay = 0,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const words = text.split(' ');
  const Component = motion[as];

  if (prefersReducedMotion) {
    const StaticTag = as;
    return <StaticTag className={className}>{text}</StaticTag>;
  }

  return (
    <Component
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.35 }}
      className={className}
    >
      {words.map((word, idx) => (
        <span
          key={`${word}-${idx}`}
          className="inline-block overflow-hidden align-bottom mr-[0.26em] last:mr-0"
        >
          <motion.span
            variants={{
              hidden: { y: '100%', opacity: 0 },
              visible: {
                y: '0%',
                opacity: 1,
                transition: {
                  type: 'spring',
                  stiffness: 300,
                  damping: 26,
                  delay: delay + idx * 0.045,
                },
              },
            }}
            className="inline-block"
          >
            {word}
          </motion.span>
        </span>
      ))}
    </Component>
  );
};
