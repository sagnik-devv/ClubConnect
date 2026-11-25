import React from 'react';
import { Link } from 'react-router-dom';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface BaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
}

type ButtonProps = BaseProps &
  (
    | ({ to: string } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>)
    | ({ to?: undefined } & React.ButtonHTMLAttributes<HTMLButtonElement>)
  );

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[#0075de] text-white hover:bg-[#0063bd] active:translate-y-px border border-transparent',
  secondary:
    'bg-[#e6f3fe] text-[#0075de] hover:bg-[#d6ebfd] active:translate-y-px border border-transparent',
  ghost:
    'bg-transparent text-black/95 hover:bg-black/5 border border-transparent',
  outline:
    'bg-transparent text-black/90 hover:bg-black/5 border border-black/20 rounded-[4px]',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-[13px]',
  md: 'px-[15px] py-[7px] text-[14px]',
  lg: 'px-5 py-2.5 text-[15px]',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}) => {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded-[8px] transition-all duration-200 ease-out cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0075de] disabled:opacity-50 disabled:pointer-events-none select-none';

  const classes = `${base} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  if ('to' in rest && typeof rest.to === 'string') {
    const { to, ...linkProps } = rest;
    return (
      <Link to={to} className={classes} {...linkProps}>
        {children}
      </Link>
    );
  }

  const buttonProps = rest as React.ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button type={buttonProps.type ?? 'button'} className={classes} {...buttonProps}>
      {children}
    </button>
  );
};

