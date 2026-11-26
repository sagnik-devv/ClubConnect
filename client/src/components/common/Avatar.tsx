import React, { useState } from 'react';
import {
  AVATAR_PREFIX,
  AvatarCharacterMark,
  getCharacterByAvatarValue,
} from './CharacterMarks';

const SIZE_PX: Record<'sm' | 'md' | 'lg' | 'xl', number> = {
  sm: 28,
  md: 36,
  lg: 44,
  xl: 64,
};

export const Avatar: React.FC<{
  initials: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  profileImage?: string | null;
  seed?: string;
  useCharacterFallback?: boolean;
  className?: string;
}> = ({
  initials,
  color = '#0075de',
  size = 'md',
  profileImage,
  seed,
  useCharacterFallback = true,
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeClass =
    size === 'sm'
      ? 'w-7 h-7 text-[11px]'
      : size === 'lg'
      ? 'w-11 h-11 text-[14px]'
      : size === 'xl'
      ? 'w-16 h-16 text-[18px]'
      : 'w-9 h-9 text-[12px]';

  if (profileImage && profileImage.startsWith(AVATAR_PREFIX)) {
    const spec = getCharacterByAvatarValue(profileImage, seed || initials);
    if (spec) {
      return (
        <AvatarCharacterMark
          spec={spec}
          size={SIZE_PX[size]}
          animated={false}
          className={className}
        />
      );
    }
  }

  if (profileImage && !imgError) {
    return (
      <img
        src={profileImage}
        alt={initials}
        onError={() => setImgError(true)}
        className={`rounded-full object-cover border border-black/10 shrink-0 ${sizeClass} ${className}`}
      />
    );
  }

  if (useCharacterFallback) {
    const spec = getCharacterByAvatarValue(null, seed || initials);
    if (spec) {
      return (
        <AvatarCharacterMark
          spec={spec}
          size={SIZE_PX[size]}
          animated={false}
          className={className}
        />
      );
    }
  }

  const isLightBg = ['#e6f3fe', '#f6d5b8', '#ffb110', '#62aef0'].includes(color.toLowerCase());

  return (
    <span
      style={{ backgroundColor: color }}
      className={`inline-flex items-center justify-center rounded-full font-semibold border border-black/10 shrink-0 ${sizeClass} ${
        isLightBg ? 'text-black' : 'text-white'
      } ${className}`}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
};
