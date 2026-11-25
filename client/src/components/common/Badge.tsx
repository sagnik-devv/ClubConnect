import React from 'react';

type BadgeVariant = 'neutral' | 'blue' | 'marigold' | 'coral' | 'peach' | 'midnight' | 'green';

const variantMap: Record<BadgeVariant, string> = {
  neutral: 'bg-[#f6f5f4] text-[#615d59] border border-black/10',
  blue: 'bg-[#e6f3fe] text-[#0075de] border border-[#0075de]/15',
  marigold: 'bg-[#ffb110]/25 text-black border border-[#ffb110]/40',
  coral: 'bg-[#f64932]/15 text-[#c72914] border border-[#f64932]/25',
  peach: 'bg-[#f6d5b8] text-black border border-black/10',
  midnight: 'bg-[#02093a] text-white border border-transparent',
  green: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
};

export const Badge: React.FC<{
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}> = ({ children, variant = 'neutral', className = '' }) => {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-medium leading-[1.33] whitespace-nowrap ${variantMap[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
