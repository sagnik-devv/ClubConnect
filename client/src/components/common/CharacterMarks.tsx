import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export interface CharacterSpec {
  id: string;
  borderColor: string;
  accentColor: string;
  hairStyle: 'bob' | 'curly' | 'parted' | 'spiky' | 'bun' | 'cap' | 'wave';
  accessory?: 'glasses' | 'headphones' | 'beret' | 'none';
  skinTone: string;
}

export const HERO_CHARACTERS: CharacterSpec[] = [
  { id: 'c1', borderColor: '#097fe8', accentColor: '#e6f3fe', hairStyle: 'bob', accessory: 'glasses', skinTone: '#f7d6bf' },
  { id: 'c2', borderColor: '#f64932', accentColor: '#ffb110', hairStyle: 'curly', accessory: 'none', skinTone: '#c6865c' },
  { id: 'c3', borderColor: '#ffb110', accentColor: '#62aef0', hairStyle: 'parted', accessory: 'headphones', skinTone: '#f1c29b' },
  { id: 'c4', borderColor: '#62aef0', accentColor: '#f64932', hairStyle: 'bun', accessory: 'none', skinTone: '#8d5524' },
  { id: 'c5', borderColor: '#0075de', accentColor: '#ffb110', hairStyle: 'spiky', accessory: 'glasses', skinTone: '#eac096' },
  { id: 'c6', borderColor: '#f64932', accentColor: '#e6f3fe', hairStyle: 'wave', accessory: 'beret', skinTone: '#f7d6bf' },
  { id: 'c7', borderColor: '#ffb110', accentColor: '#02093a', hairStyle: 'cap', accessory: 'none', skinTone: '#d49a6a' },
];

export const AvatarCharacterMark: React.FC<{
  spec: CharacterSpec;
  size?: number;
  delay?: number;
  className?: string;
}> = ({ spec, size = 44, delay = 0, className = '' }) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.8, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      whileHover={prefersReducedMotion ? undefined : { y: -4, scale: 1.06 }}
      transition={{
        type: 'spring',
        stiffness: 360,
        damping: 22,
        delay,
      }}
      style={{
        width: size,
        height: size,
        borderColor: spec.borderColor,
      }}
      className={`rounded-full border-2 bg-white flex items-center justify-center overflow-hidden shrink-0 ${className}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 48 48" className="w-full h-full">
        <circle cx="24" cy="24" r="22" fill="#ffffff" />
        <path
          d="M11 45 C12 36, 36 36, 37 45 Z"
          fill={spec.accentColor}
          stroke="#000000"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <circle cx="24" cy="23" r="10.5" fill={spec.skinTone} stroke="#000000" strokeWidth="1.6" />
        {spec.hairStyle === 'bob' && (
          <path
            d="M13 24 C13 13, 35 13, 35 24 C35 28, 33 30, 32 28 C31 20, 29 17, 24 17 C19 17, 17 20, 16 28 C15 30, 13 28, 13 24 Z"
            fill="#111111"
          />
        )}
        {spec.hairStyle === 'curly' && (
          <g fill="#111111">
            <circle cx="16" cy="17" r="4.2" />
            <circle cx="21" cy="13.5" r="4.5" />
            <circle cx="27" cy="13.5" r="4.5" />
            <circle cx="32" cy="17" r="4.2" />
          </g>
        )}
        {spec.hairStyle === 'parted' && (
          <path
            d="M13.5 22 C13.5 13, 34.5 13, 34.5 22 C31 18, 25 18, 20 19 C17 19.8, 15 21, 13.5 22 Z"
            fill="#111111"
          />
        )}
        {spec.hairStyle === 'bun' && (
          <g fill="#111111">
            <circle cx="24" cy="10" r="4.5" />
            <path d="M13.5 22 C14 13, 34 13, 34.5 22 C31 17.5, 17 17.5, 13.5 22 Z" />
          </g>
        )}
        {spec.hairStyle === 'spiky' && (
          <path
            d="M13 21 L16 12 L21 15 L24 9 L28 15 L33 12 L35 21 C31 17, 17 17, 13 21 Z"
            fill="#111111"
          />
        )}
        {spec.hairStyle === 'wave' && (
          <path
            d="M13 23 C13 13, 35 13, 35 23 C33 18, 27 17, 23 18 C18 19, 15 21, 13 23 Z"
            fill="#3b281e"
          />
        )}
        {spec.hairStyle === 'cap' && (
          <g>
            <path d="M13.5 19 C14 12, 34 12, 34.5 19 Z" fill="#0075de" stroke="#000000" strokeWidth="1.4" />
            <path d="M13 19 L37 19" stroke="#000000" strokeWidth="2" strokeLinecap="round" />
          </g>
        )}
        <circle cx="20.5" cy="23.5" r="1.3" fill="#000000" />
        <circle cx="27.5" cy="23.5" r="1.3" fill="#000000" />
        <path
          d="M21 27.5 C22.5 29.2, 25.5 29.2, 27 27.5"
          fill="none"
          stroke="#000000"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {spec.accessory === 'glasses' && (
          <g fill="none" stroke="#000000" strokeWidth="1.3">
            <rect x="17" y="21" width="6.2" height="5" rx="1.5" />
            <rect x="24.8" y="21" width="6.2" height="5" rx="1.5" />
            <line x1="23.2" y1="23.2" x2="24.8" y2="23.2" />
          </g>
        )}
        {spec.accessory === 'headphones' && (
          <g fill="none" stroke="#000000" strokeWidth="1.6">
            <path d="M12.5 24 C12.5 12, 35.5 12, 35.5 24" />
            <rect x="10.5" y="21" width="3.5" height="6.5" rx="1.5" fill="#ffb110" />
            <rect x="34" y="21" width="3.5" height="6.5" rx="1.5" fill="#ffb110" />
          </g>
        )}
        {spec.accessory === 'beret' && (
          <path
            d="M14 16 C16 10, 31 10, 34 15 Z"
            fill="#f64932"
            stroke="#000000"
            strokeWidth="1.4"
          />
        )}
      </svg>
    </motion.div>
  );
};

export const SparkleDoodle: React.FC<{ color?: string; className?: string }> = ({
  color = '#ffb110',
  className = '',
}) => {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.svg
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
      animate={prefersReducedMotion ? undefined : { rotate: [0, 8, -6, 0], scale: [1, 1.08, 1] }}
      transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <path
        d="M16 2 L18.8 13.2 L30 16 L18.8 18.8 L16 30 L13.2 18.8 L2 16 L13.2 13.2 Z"
        fill={color}
        stroke="#000000"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </motion.svg>
  );
};

export const SquiggleDoodle: React.FC<{ color?: string; className?: string }> = ({
  color = '#097fe8',
  className = '',
}) => {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.svg
      viewBox="0 0 64 24"
      className={className}
      aria-hidden="true"
      animate={prefersReducedMotion ? undefined : { y: [0, -3, 0] }}
      transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
    >
      <path
        d="M3 14 C10 4, 18 22, 26 12 C34 2, 42 20, 50 10 C55 4, 59 12, 61 10"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </motion.svg>
  );
};

export const HandArrowDoodle: React.FC<{ color?: string; className?: string }> = ({
  color = '#000000',
  className = '',
}) => (
  <svg viewBox="0 0 48 36" className={className} aria-hidden="true" fill="none">
    <path
      d="M4 28 C12 10, 26 8, 40 16"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    <path
      d="M34 9 L42 16.5 L32 20"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const FlowerDoodle: React.FC<{ color?: string; className?: string }> = ({
  color = '#f64932',
  className = '',
}) => {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.svg
      viewBox="0 0 36 36"
      className={className}
      aria-hidden="true"
      animate={prefersReducedMotion ? undefined : { rotate: [0, 360] }}
      transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
    >
      <g stroke="#000000" strokeWidth="1.4" fill={color}>
        <circle cx="18" cy="8" r="5" />
        <circle cx="27" cy="14" r="5" />
        <circle cx="24" cy="25" r="5" />
        <circle cx="12" cy="25" r="5" />
        <circle cx="9" cy="14" r="5" />
      </g>
      <circle cx="18" cy="18" r="5.5" fill="#ffb110" stroke="#000000" strokeWidth="1.4" />
    </motion.svg>
  );
};

export const ClubLogoMark: React.FC<{
  clubId: string;
  accentColor: string;
  size?: number;
}> = ({ clubId, accentColor, size = 44 }) => {
  const strokeColor = accentColor === '#02093a' ? '#ffffff' : '#000000';
  return (
    <div
      style={{ width: size, height: size, backgroundColor: accentColor }}
      className="rounded-[10px] border border-black/10 flex items-center justify-center shrink-0"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        className="w-5 h-5"
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {clubId === 'coding-club' && (
          <>
            <polyline points="8 7 3 12 8 17" />
            <polyline points="16 7 21 12 16 17" />
            <line x1="14" y1="5" x2="10" y2="19" />
          </>
        )}
        {clubId === 'robotics-society' && (
          <>
            <rect x="5" y="8" width="14" height="10" rx="2" />
            <line x1="12" y1="4" x2="12" y2="8" />
            <circle cx="9.5" cy="13" r="1" fill="currentColor" />
            <circle cx="14.5" cy="13" r="1" fill="currentColor" />
          </>
        )}
        {clubId === 'photography-club' && (
          <>
            <path d="M4 8h3l2-2h6l2 2h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z" />
            <circle cx="12" cy="14" r="3.5" />
          </>
        )}
        {clubId === 'entrepreneurship-cell' && (
          <path d="M12 3l3 6 6 1-4.5 4.2 1.2 6.3L12 17.5 6.3 20.5l1.2-6.3L3 10l6-1z" />
        )}
        {(clubId === 'cultural-society' || clubId === 'music-society') && (
          <>
            <circle cx="9" cy="17" r="3" />
            <path d="M12 17V5l8-2v12" />
            <circle cx="17" cy="15" r="3" />
          </>
        )}
        {clubId === 'debate-society' && (
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        )}
        {clubId === 'ai-ml-club' && (
          <>
            <circle cx="12" cy="12" r="3" />
            <circle cx="5" cy="6" r="2" />
            <circle cx="19" cy="6" r="2" />
            <circle cx="5" cy="18" r="2" />
            <circle cx="19" cy="18" r="2" />
            <line x1="6.7" y1="7.5" x2="9.8" y2="10" />
            <line x1="17.3" y1="7.5" x2="14.2" y2="10" />
            <line x1="6.7" y1="16.5" x2="9.8" y2="14" />
            <line x1="17.3" y1="16.5" x2="14.2" y2="14" />
          </>
        )}
        {clubId === 'design-club' && (
          <>
            <path d="M12 3l7 11-7 7-7-7 7-11z" />
            <circle cx="12" cy="13" r="2" />
          </>
        )}
        {clubId === 'sports-club' && (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 3a14 14 0 0 0 0 18M3 12h18" />
          </>
        )}
        {clubId === 'literary-society' && (
          <>
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </>
        )}
        {clubId === 'innovation-club' && (
          <>
            <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.7.6 1 1.3 1 2.3h6c0-1 .3-1.7 1-2.3A7 7 0 0 0 12 2z" />
          </>
        )}
        {![
          'coding-club',
          'robotics-society',
          'photography-club',
          'entrepreneurship-cell',
          'cultural-society',
          'music-society',
          'debate-society',
          'ai-ml-club',
          'design-club',
          'sports-club',
          'literary-society',
          'innovation-club',
        ].includes(clubId) && (
          <>
            <circle cx="12" cy="12" r="8" />
            <path d="M8 12h8M12 8v8" />
          </>
        )}
      </svg>
    </div>
  );
};
