import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Shuffle } from 'lucide-react';

export interface CharacterSpec {
  id: string;
  label: string;
  borderColor: string;
  accentColor: string;
  hairStyle: 'bob' | 'curly' | 'parted' | 'spiky' | 'bun' | 'cap' | 'wave';
  accessory?: 'glasses' | 'headphones' | 'beret' | 'none';
  skinTone: string;
}

export const HERO_CHARACTERS: CharacterSpec[] = [
  { id: 'c1', label: 'Scholar', borderColor: '#097fe8', accentColor: '#e6f3fe', hairStyle: 'bob', accessory: 'glasses', skinTone: '#f7d6bf' },
  { id: 'c2', label: 'Sunny', borderColor: '#f64932', accentColor: '#ffb110', hairStyle: 'curly', accessory: 'none', skinTone: '#c6865c' },
  { id: 'c3', label: 'Beats', borderColor: '#ffb110', accentColor: '#62aef0', hairStyle: 'parted', accessory: 'headphones', skinTone: '#f1c29b' },
  { id: 'c4', label: 'Studio', borderColor: '#62aef0', accentColor: '#f64932', hairStyle: 'bun', accessory: 'none', skinTone: '#8d5524' },
  { id: 'c5', label: 'Spark', borderColor: '#0075de', accentColor: '#ffb110', hairStyle: 'spiky', accessory: 'glasses', skinTone: '#eac096' },
  { id: 'c6', label: 'Atelier', borderColor: '#f64932', accentColor: '#e6f3fe', hairStyle: 'wave', accessory: 'beret', skinTone: '#f7d6bf' },
  { id: 'c7', label: 'Cap Crew', borderColor: '#ffb110', accentColor: '#02093a', hairStyle: 'cap', accessory: 'none', skinTone: '#d49a6a' },
];

export const AVATAR_PREFIX = 'avatar:';

export function getCharacterByAvatarValue(
  value?: string | null,
  fallbackSeed?: string
): CharacterSpec | null {
  if (value && value.startsWith(AVATAR_PREFIX)) {
    const id = value.slice(AVATAR_PREFIX.length);
    return HERO_CHARACTERS.find((c) => c.id === id) ?? HERO_CHARACTERS[0];
  }
  if (fallbackSeed !== undefined) {
    let hash = 0;
    for (let i = 0; i < fallbackSeed.length; i += 1) {
      hash = (hash * 31 + fallbackSeed.charCodeAt(i)) >>> 0;
    }
    return HERO_CHARACTERS[hash % HERO_CHARACTERS.length];
  }
  return null;
}

export const AvatarCharacterMark: React.FC<{
  spec: CharacterSpec;
  size?: number;
  delay?: number;
  animated?: boolean;
  className?: string;
}> = ({ spec, size = 44, delay = 0, animated = true, className = '' }) => {
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = animated && !prefersReducedMotion;

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, scale: 0.8, y: 6 } : false}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      whileHover={shouldAnimate ? { y: -4, scale: 1.06 } : undefined}
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

export const CharacterAvatarPicker: React.FC<{
  selectedValue: string | null;
  onSelect: (avatarValue: string | null) => void;
  allowDeselect?: boolean;
  size?: number;
  className?: string;
}> = ({ selectedValue, onSelect, allowDeselect = false, size = 44, className = '' }) => {
  return (
    <div className={`flex flex-wrap items-center justify-center gap-2.5 ${className}`} role="radiogroup" aria-label="Choose a character avatar">
      {HERO_CHARACTERS.map((spec, idx) => {
        const value = `${AVATAR_PREFIX}${spec.id}`;
        const isSelected = selectedValue === value;
        return (
          <button
            key={spec.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={`${spec.label} avatar`}
            title={spec.label}
            onClick={() => onSelect(allowDeselect && isSelected ? null : value)}
            className={`relative rounded-full p-0.5 transition-transform cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0075de] ${
              isSelected
                ? 'ring-2 ring-black ring-offset-2 scale-110'
                : 'opacity-85 hover:opacity-100 hover:scale-105'
            }`}
          >
            <AvatarCharacterMark spec={spec} size={size} delay={idx * 0.04} />
            {isSelected && (
              <span
                className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-black text-white text-[9px] font-bold flex items-center justify-center border border-white"
                aria-hidden="true"
              >
                ✓
              </span>
            )}
          </button>
        );
      })}
    </div>
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

export interface ClubAvatarSpec {
  id: 'code' | 'robo' | 'lens' | 'music' | 'rocket' | 'palette' | 'bolt' | 'trophy';
  label: string;
  defaultTint: string;
}

export const CLUB_AVATAR_PREFIX = 'club-avatar:';

export const CLUB_AVATARS: ClubAvatarSpec[] = [
  { id: 'code', label: 'Code Bot', defaultTint: '#e6f3fe' },
  { id: 'robo', label: 'Mecha Bot', defaultTint: '#fff4d6' },
  { id: 'lens', label: 'Shutter Bug', defaultTint: '#ffe8e4' },
  { id: 'music', label: 'Beat Vibe', defaultTint: '#e6f3fe' },
  { id: 'rocket', label: 'Launchpad', defaultTint: '#f3efff' },
  { id: 'palette', label: 'Art Studio', defaultTint: '#f6d5b8' },
  { id: 'bolt', label: 'Spark Lab', defaultTint: '#fff4d6' },
  { id: 'trophy', label: 'Campus Crew', defaultTint: '#e9f7ef' },
];

export const CLUB_ACCENT_SWATCHES: Array<{ color: string; label: string }> = [
  { color: '#e6f3fe', label: 'Sky Tint' },
  { color: '#fff4d6', label: 'Sunbeam' },
  { color: '#ffe8e4', label: 'Coral Mist' },
  { color: '#e9f7ef', label: 'Mint Leaf' },
  { color: '#f3efff', label: 'Lavender' },
  { color: '#f6d5b8', label: 'Warm Peach' },
  { color: '#02093a', label: 'Midnight' },
  { color: '#ffffff', label: 'Crisp White' },
];

const SLUG_TO_CLUB_AVATAR: Record<string, ClubAvatarSpec['id']> = {
  'coding-club': 'code',
  'robotics-society': 'robo',
  'photography-club': 'lens',
  'entrepreneurship-cell': 'rocket',
  'cultural-society': 'music',
  'music-society': 'music',
  'design-club': 'palette',
  'innovation-club': 'bolt',
  'ai-ml-club': 'bolt',
  'sports-club': 'trophy',
  'debate-society': 'trophy',
  'literary-society': 'palette',
};

export function getClubAvatarByValue(
  logo?: string | null,
  slugFallback = 'club'
): ClubAvatarSpec {
  if (logo && logo.startsWith(CLUB_AVATAR_PREFIX)) {
    const id = logo.slice(CLUB_AVATAR_PREFIX.length);
    const matched = CLUB_AVATARS.find((a) => a.id === id);
    if (matched) return matched;
  }
  const slugMatch = SLUG_TO_CLUB_AVATAR[slugFallback];
  if (slugMatch) {
    return CLUB_AVATARS.find((a) => a.id === slugMatch) ?? CLUB_AVATARS[0];
  }
  let hash = 0;
  for (let i = 0; i < slugFallback.length; i += 1) {
    hash = (hash * 31 + slugFallback.charCodeAt(i)) >>> 0;
  }
  return CLUB_AVATARS[hash % CLUB_AVATARS.length];
}

const ClubMascotSvg: React.FC<{ id: ClubAvatarSpec['id']; onDark?: boolean }> = ({
  id,
  onDark = false,
}) => {
  const stroke = onDark ? '#ffffff' : '#111111';
  switch (id) {
    case 'code':
      return (
        <svg viewBox="0 0 40 40" className="w-[74%] h-[74%]" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <line x1="20" y1="4.5" x2="20" y2="8.5" stroke={stroke} strokeWidth="2" />
          <circle cx="20" cy="4" r="2.2" fill="#ffb110" stroke={stroke} strokeWidth="1.5" />
          <rect x="7" y="9" width="26" height="21" rx="6" fill="#ffffff" stroke={stroke} strokeWidth="2" />
          <rect x="10.5" y="12.5" width="19" height="14" rx="3.5" fill="#0075de" />
          <path d="M16 17 L13.5 19.5 L16 22" stroke="#ffffff" strokeWidth="2" />
          <path d="M24 17 L26.5 19.5 L24 22" stroke="#ffffff" strokeWidth="2" />
          <path d="M18.2 22.8 C19.5 24, 20.5 24, 21.8 22.8" stroke="#ffb110" strokeWidth="1.8" />
          <path d="M15 33.5 H25" stroke={stroke} strokeWidth="2.2" />
        </svg>
      );
    case 'robo':
      return (
        <svg viewBox="0 0 40 40" className="w-[74%] h-[74%]" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <line x1="20" y1="4" x2="20" y2="9" stroke={stroke} strokeWidth="2" />
          <circle cx="20" cy="4" r="2.2" fill="#f64932" stroke={stroke} strokeWidth="1.5" />
          <rect x="5" y="16" width="3.5" height="8" rx="1.5" fill="#62aef0" stroke={stroke} strokeWidth="1.5" />
          <rect x="31.5" y="16" width="3.5" height="8" rx="1.5" fill="#62aef0" stroke={stroke} strokeWidth="1.5" />
          <rect x="8.5" y="9.5" width="23" height="22" rx="6.5" fill="#ffb110" stroke={stroke} strokeWidth="2" />
          <circle cx="15.5" cy="18.5" r="2.5" fill="#ffffff" stroke={stroke} strokeWidth="1.6" />
          <circle cx="24.5" cy="18.5" r="2.5" fill="#ffffff" stroke={stroke} strokeWidth="1.6" />
          <circle cx="15.5" cy="18.5" r="1" fill="#111111" />
          <circle cx="24.5" cy="18.5" r="1" fill="#111111" />
          <path d="M15 25 C17.5 27.5, 22.5 27.5, 25 25" stroke="#111111" strokeWidth="2" />
        </svg>
      );
    case 'lens':
      return (
        <svg viewBox="0 0 40 40" className="w-[74%] h-[74%]" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 9 L16 6 H24 L26 9" fill="#ffb110" stroke={stroke} strokeWidth="1.8" />
          <rect x="6" y="9.5" width="28" height="22" rx="6" fill="#f64932" stroke={stroke} strokeWidth="2" />
          <circle cx="29.5" cy="14" r="1.8" fill="#ffb110" />
          <circle cx="20" cy="21" r="8" fill="#ffffff" stroke={stroke} strokeWidth="2" />
          <circle cx="17.6" cy="19.8" r="1.3" fill="#111111" />
          <circle cx="22.4" cy="19.8" r="1.3" fill="#111111" />
          <path d="M17.5 23 C19 24.7, 21 24.7, 22.5 23" stroke="#111111" strokeWidth="1.7" />
        </svg>
      );
    case 'music':
      return (
        <svg viewBox="0 0 40 40" className="w-[74%] h-[74%]" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8.5 22 C8.5 11, 31.5 11, 31.5 22" stroke={stroke} strokeWidth="2.4" />
          <rect x="6" y="19.5" width="5" height="9.5" rx="2.5" fill="#ffb110" stroke={stroke} strokeWidth="1.8" />
          <rect x="29" y="19.5" width="5" height="9.5" rx="2.5" fill="#ffb110" stroke={stroke} strokeWidth="1.8" />
          <circle cx="20" cy="23.5" r="9.5" fill="#62aef0" stroke={stroke} strokeWidth="2" />
          <circle cx="17" cy="22.5" r="1.3" fill="#111111" />
          <circle cx="23" cy="22.5" r="1.3" fill="#111111" />
          <path d="M17 26.2 C18.8 28, 21.2 28, 23 26.2" stroke="#111111" strokeWidth="1.8" />
        </svg>
      );
    case 'rocket':
      return (
        <svg viewBox="0 0 40 40" className="w-[74%] h-[74%]" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 29 L14 35 L20 32 L26 35 L24 29" fill="#ffb110" stroke={stroke} strokeWidth="1.6" />
          <path d="M12 24 L7 27 L11 19" fill="#f64932" stroke={stroke} strokeWidth="1.8" />
          <path d="M28 24 L33 27 L29 19" fill="#f64932" stroke={stroke} strokeWidth="1.8" />
          <path d="M20 5 C26.5 10.5, 27.5 20.5, 25 28 H15 C12.5 20.5, 13.5 10.5, 20 5 Z" fill="#ffffff" stroke={stroke} strokeWidth="2" />
          <circle cx="20" cy="16.5" r="4.5" fill="#0075de" stroke={stroke} strokeWidth="1.6" />
          <circle cx="18.6" cy="15.8" r="0.9" fill="#ffffff" />
          <circle cx="21.4" cy="15.8" r="0.9" fill="#ffffff" />
          <path d="M18.5 18 C19.5 19, 20.5 19, 21.5 18" stroke="#ffffff" strokeWidth="1.3" />
        </svg>
      );
    case 'palette':
      return (
        <svg viewBox="0 0 40 40" className="w-[74%] h-[74%]" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M20 7 C11.5 7, 6 12.5, 6 20 C6 27.5, 11.5 33, 19.5 33 C22.5 33, 24 31, 24 29 C24 27.2, 22.8 26.2, 24.5 25 C26.5 23.6, 34 25.2, 34 19 C34 12, 27.8 7, 20 7 Z"
            fill="#ffffff"
            stroke={stroke}
            strokeWidth="2"
          />
          <circle cx="13" cy="15" r="2.2" fill="#f64932" />
          <circle cx="20" cy="12" r="2.2" fill="#ffb110" />
          <circle cx="27" cy="15" r="2.2" fill="#0075de" />
          <circle cx="14.5" cy="22.5" r="1.2" fill="#111111" />
          <circle cx="20.5" cy="22.5" r="1.2" fill="#111111" />
          <path d="M15.5 25.8 C17 27.2, 18.5 27.2, 19.8 25.8" stroke="#111111" strokeWidth="1.6" />
        </svg>
      );
    case 'bolt':
      return (
        <svg viewBox="0 0 40 40" className="w-[74%] h-[74%]" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 4 L10 21 H19 L17 36 L30 18 H21 L22 4 Z" fill="#ffb110" stroke={stroke} strokeWidth="2" />
          <circle cx="17.8" cy="16.5" r="1.1" fill="#111111" />
          <circle cx="22" cy="16.5" r="1.1" fill="#111111" />
          <path d="M18.2 19.2 C19.4 20.3, 20.6 20.3, 21.8 19.2" stroke="#111111" strokeWidth="1.4" />
        </svg>
      );
    case 'trophy':
    default:
      return (
        <svg viewBox="0 0 40 40" className="w-[74%] h-[74%]" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 11 H7 C6.5 17, 9 20, 12 20" stroke={stroke} strokeWidth="2" />
          <path d="M29 11 H33 C33.5 17, 31 20, 28 20" stroke={stroke} strokeWidth="2" />
          <path d="M11 8 H29 V17 C29 22.5, 25 26, 20 26 C15 26, 11 22.5, 11 17 Z" fill="#ffb110" stroke={stroke} strokeWidth="2" />
          <line x1="20" y1="26" x2="20" y2="31" stroke={stroke} strokeWidth="2.2" />
          <rect x="14" y="31" width="12" height="4" rx="1.5" fill="#0075de" stroke={stroke} strokeWidth="1.6" />
          <circle cx="17.2" cy="15.5" r="1.2" fill="#111111" />
          <circle cx="22.8" cy="15.5" r="1.2" fill="#111111" />
          <path d="M17.5 19 C19 20.5, 21 20.5, 22.5 19" stroke="#111111" strokeWidth="1.6" />
        </svg>
      );
  }
};

export const ClubLogoMark: React.FC<{
  clubId: string;
  logo?: string | null;
  accentColor?: string;
  size?: number;
  className?: string;
}> = ({ clubId, logo, accentColor = '#e6f3fe', size = 44, className = '' }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const spec = getClubAvatarByValue(logo, clubId);
  const isCustomImageUrl =
    Boolean(logo) && !logo!.startsWith(CLUB_AVATAR_PREFIX) && !imgFailed;
  const isDarkBg = accentColor.toLowerCase() === '#02093a';

  if (isCustomImageUrl) {
    return (
      <img
        src={logo!}
        alt={`${clubId} logo`}
        style={{ width: size, height: size, backgroundColor: accentColor }}
        onError={() => setImgFailed(true)}
        className={`rounded-[10px] border border-black/10 object-cover shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size, backgroundColor: accentColor }}
      className={`rounded-[10px] border border-black/10 flex items-center justify-center shrink-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <ClubMascotSvg id={spec.id} onDark={isDarkBg} />
    </div>
  );
};

export const ClubAvatarPicker: React.FC<{
  selectedLogo: string | null | undefined;
  selectedTint: string;
  onSelectLogo: (logo: string) => void;
  onSelectTint?: (color: string) => void;
  clubSlug?: string;
}> = ({ selectedLogo, selectedTint, onSelectLogo, onSelectTint, clubSlug = 'club' }) => {
  const activeSpec = getClubAvatarByValue(selectedLogo, clubSlug);
  const currentValue = `${CLUB_AVATAR_PREFIX}${activeSpec.id}`;

  const handleShuffle = () => {
    const others = CLUB_AVATARS.filter((c) => `${CLUB_AVATAR_PREFIX}${c.id}` !== currentValue);
    const pick = others[Math.floor(Math.random() * others.length)] ?? CLUB_AVATARS[0];
    onSelectLogo(`${CLUB_AVATAR_PREFIX}${pick.id}`);
    if (onSelectTint) {
      onSelectTint(pick.defaultTint);
    }
  };

  return (
    <div className="p-3.5 rounded-[10px] bg-[#faf9f8] border border-black/[0.08] space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ClubLogoMark
            clubId={clubSlug}
            logo={selectedLogo || currentValue}
            accentColor={selectedTint || activeSpec.defaultTint}
            size={48}
          />
          <div>
            <div className="text-[13px] font-semibold text-black">
              Club Avatar · {activeSpec.label}
            </div>
            <div className="text-[11px] text-[#615d59]">
              Pick a funky mascot badge for cards & headers.
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleShuffle}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-black/10 text-[12px] font-medium text-black hover:bg-[#f6f5f4] transition-colors cursor-pointer shrink-0"
        >
          <Shuffle className="w-3 h-3" />
          Shuffle
        </button>
      </div>

      <div
        className="flex flex-wrap items-center gap-2"
        role="radiogroup"
        aria-label="Choose a club avatar"
      >
        {CLUB_AVATARS.map((spec) => {
          const value = `${CLUB_AVATAR_PREFIX}${spec.id}`;
          const isSelected = activeSpec.id === spec.id;
          return (
            <button
              key={spec.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={spec.label}
              title={spec.label}
              onClick={() => onSelectLogo(value)}
              className={`relative rounded-[11px] p-0.5 transition-transform cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0075de] ${
                isSelected
                  ? 'ring-2 ring-black ring-offset-1 scale-105'
                  : 'opacity-85 hover:opacity-100 hover:scale-105'
              }`}
            >
              <ClubLogoMark
                clubId={clubSlug}
                logo={value}
                accentColor={selectedTint || spec.defaultTint}
                size={40}
              />
              {isSelected && (
                <span
                  className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-black text-white text-[9px] font-bold flex items-center justify-center border border-white"
                  aria-hidden="true"
                >
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>

      {onSelectTint && (
        <div className="pt-2 border-t border-black/[0.06] flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#757575]">
            Badge Tint
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {CLUB_ACCENT_SWATCHES.map((sw) => {
              const active = (selectedTint || '').toLowerCase() === sw.color.toLowerCase();
              return (
                <button
                  key={sw.color}
                  type="button"
                  title={sw.label}
                  aria-label={`Select ${sw.label} background`}
                  onClick={() => onSelectTint(sw.color)}
                  style={{ backgroundColor: sw.color }}
                  className={`w-6 h-6 rounded-full border border-black/15 cursor-pointer transition-transform ${
                    active ? 'ring-2 ring-black ring-offset-1 scale-110' : 'hover:scale-105'
                  }`}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
