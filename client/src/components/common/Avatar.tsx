import React from 'react';

export const Avatar: React.FC<{
  initials: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ initials, color = '#0075de', size = 'md', className = '' }) => {
  const sizeClass =
    size === 'sm'
      ? 'w-7 h-7 text-[11px]'
      : size === 'lg'
      ? 'w-11 h-11 text-[14px]'
      : 'w-9 h-9 text-[12px]';

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
