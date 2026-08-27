'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface RuviaLogoProps {
  className?: string;
  variant?: 'light' | 'dark' | 'image';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLink?: boolean;
}

export default function RuviaLogo({
  className,
  variant = 'light',
  size = 'md',
  showLink = true,
}: RuviaLogoProps) {
  const heights = {
    sm: 'h-8 sm:h-9',
    md: 'h-10 sm:h-12',
    lg: 'h-12 sm:h-14 lg:h-16',
    xl: 'h-16 sm:h-20',
  };

  const isLightText = variant === 'light';

  const logoContent = (
    <div className={cn('flex items-center gap-2.5 sm:gap-3 select-none', heights[size], className)}>
      {variant === 'image' ? (
        <img
          src="/images/ruvia-logo.jpg"
          alt="Ruvia Jewels"
          className={cn('object-contain rounded-md shadow-sm border border-gold-500/20', heights[size])}
        />
      ) : (
        <div className="relative flex items-center gap-2.5 sm:gap-3">
          <img
            src="/images/ruvia-logo.jpg"
            alt="Ruvia Jewels"
            className={cn(
              'object-cover rounded-full border border-[#D4AF37]/60 shadow-md shrink-0 transition-transform hover:scale-105',
              size === 'sm' && 'w-8 h-8',
              size === 'md' && 'w-9 h-9 sm:w-11 sm:h-11',
              size === 'lg' && 'w-11 h-11 sm:w-13 sm:h-13 lg:w-14 lg:h-14',
              size === 'xl' && 'w-14 h-14 sm:w-16 sm:h-16'
            )}
          />
          <div className="flex flex-col leading-none">
            <div className="flex items-baseline gap-1 relative">
              <span
                className={cn(
                  'font-serif font-bold tracking-tight drop-shadow-sm',
                  isLightText ? 'text-white' : 'text-gray-900',
                  size === 'sm' && 'text-base',
                  size === 'md' && 'text-xl sm:text-2xl',
                  size === 'lg' && 'text-2xl sm:text-3xl lg:text-4xl',
                  size === 'xl' && 'text-3xl sm:text-4xl lg:text-5xl'
                )}
                style={{ fontFamily: "'Playfair Display', 'Cinzel', Georgia, serif" }}
              >
                Ruvia
              </span>

              {/* Gold Sparkle over 'i' */}
              <svg
                viewBox="0 0 24 24"
                className={cn(
                  'fill-[#D4AF37] absolute -top-1 animate-pulse',
                  size === 'sm' && 'w-2.5 h-2.5 right-5',
                  size === 'md' && 'w-3 h-3 right-6 sm:right-7',
                  size === 'lg' && 'w-3.5 h-3.5 right-7 sm:right-8 lg:right-9',
                  size === 'xl' && 'w-4 h-4 right-9 sm:right-10'
                )}
              >
                <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
              </svg>

              {/* Diamond icon */}
              <svg
                viewBox="0 0 24 24"
                className={cn(
                  'fill-none stroke-[#D4AF37] stroke-[1.8] ml-0.5 shrink-0',
                  size === 'sm' && 'w-3 h-3',
                  size === 'md' && 'w-3.5 h-3.5 sm:w-4 sm:h-4',
                  size === 'lg' && 'w-4 h-4 sm:w-5 sm:h-5',
                  size === 'xl' && 'w-5 h-5 sm:w-6 sm:h-6'
                )}
              >
                <polygon points="6,3 18,3 22,9 12,21 2,9" />
                <line x1="2" y1="9" x2="22" y2="9" />
                <line x1="9" y1="3" x2="6" y2="9" />
                <line x1="15" y1="3" x2="18" y2="9" />
                <line x1="12" y1="21" x2="6" y2="9" />
                <line x1="12" y1="21" x2="18" y2="9" />
              </svg>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="h-[1px] w-2.5 sm:w-3 bg-[#D4AF37]/70" />
              <span
                className={cn(
                  'text-[#D4AF37] font-sans font-semibold uppercase tracking-[0.35em]',
                  size === 'sm' && 'text-[9px]',
                  size === 'md' && 'text-[10px] sm:text-[11px]',
                  size === 'lg' && 'text-[11px] sm:text-[12px] lg:text-[13px]',
                  size === 'xl' && 'text-[13px] sm:text-[15px]'
                )}
              >
                Jewels
              </span>
              <span className="h-[1px] w-2.5 sm:w-3 bg-[#D4AF37]/70" />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (showLink) {
    return (
      <Link href="/" className="inline-flex focus:outline-none focus:ring-1 focus:ring-[#D4AF37] rounded">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}
