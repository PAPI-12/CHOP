import React from 'react';
import { Link } from 'react-router-dom';

type IconSpec = React.ReactNode | false;

type CTAButtonProps = {
  children: React.ReactNode;
  to?: string;
  href?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
  icon?: IconSpec;
  className?: string;
  ariaLabel?: string;
};

/**
 * Canonical call-to-action. One size, one motion language, used everywhere
 * so every CTA on the site reads as the same object.
 *   - rounded lime-outline pill
 *   - lime panel slides in from the left on hover
 *   - trailing circular glyph rotates 45° and resolves into a "+" on hover
 */
const CTAButton: React.FC<CTAButtonProps> = ({
  children,
  to,
  href,
  onClick,
  type = 'button',
  icon,
  className = '',
  ariaLabel,
}) => {
  const showIcon = icon !== false;
  const hasCustomIcon = icon !== false && icon !== undefined && icon !== null;
  const glyph = hasCustomIcon ? (
    icon
  ) : (
      <>
        <span className="block h-[1.5px] w-3.5 bg-current" />
        <span className="absolute block h-3.5 w-[1.5px] scale-y-0 bg-current transition-transform duration-300 group-hover:scale-y-100" />
      </>
    );

  const classes = [
    'group relative inline-flex max-w-full items-center justify-center gap-3 overflow-hidden rounded-full',
    'border border-[#d7ff4f] px-5 py-3.5 sm:px-8 sm:py-4 font-display text-[10px] sm:text-xs md:text-sm uppercase tracking-[0.12em] sm:tracking-[0.2em] text-center',
    'text-[#d7ff4f] transition-colors duration-300 hover:text-[#171715] focus-visible:outline-none',
    'focus-visible:ring-2 focus-visible:ring-[#d7ff4f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#171715] min-h-[44px]',
    className,
  ].join(' ');

  const inner = (
    <>
      <span className="pointer-events-none absolute inset-0 -translate-x-[101%] bg-[#d7ff4f] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0" />
      <span className="relative z-10 whitespace-normal leading-tight break-words">{children}</span>
      {showIcon && (
        <span className="relative z-10 hidden h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#d7ff4f] transition-all duration-300 group-hover:rotate-45 group-hover:border-[#171715] sm:flex">
          {glyph}
        </span>
      )}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} aria-label={ariaLabel}>
        {inner}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={classes} aria-label={ariaLabel}>
        {inner}
      </a>
    );
  }
  return (
    <button type={type} onClick={onClick} className={classes} aria-label={ariaLabel}>
      {inner}
    </button>
  );
};

export default CTAButton;
