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
    <div className={cn('flex items-center gap-3 select-none', heights[size], className)}>
      {variant === 'image' ? (
        <img
          src="/images/ruvia-logo-circle.png"
          alt="Ruvia Jewels"
          className={cn('object-contain rounded-full shadow-md border border-[#D4AF37]/50', heights[size])}
        />
      ) : (
        <div className="relative flex items-center gap-3">
          <img
            src="/images/ruvia-logo-circle.png"
            alt="Ruvia Jewels"
            className={cn(
              'object-cover rounded-full border border-[#D4AF37]/60 shadow-md shrink-0 transition-transform hover:scale-105',
              size === 'sm' && 'w-8 h-8',
              size === 'md' && 'w-9 h-9 sm:w-10 sm:h-10',
              size === 'lg' && 'w-11 h-11 sm:w-13 sm:h-13',
              size === 'xl' && 'w-14 h-14 sm:w-16 sm:h-16'
            )}
          />
          <div className="flex flex-col leading-none">
            {/* Main brand name - Clean, aesthetic serif typography */}
            <span
              className={cn(
                'font-serif font-bold tracking-wider',
                isLightText ? 'text-white' : 'text-[#022c22]',
                size === 'sm' && 'text-base sm:text-lg',
                size === 'md' && 'text-xl sm:text-2xl',
                size === 'lg' && 'text-2xl sm:text-3xl lg:text-4xl',
                size === 'xl' && 'text-3xl sm:text-4xl lg:text-5xl'
              )}
              style={{ fontFamily: "'Playfair Display', 'Cinzel', Georgia, serif" }}
            >
              Ruvia
            </span>

            {/* Subtitle - JEWELS with gold tracking lines */}
            <div className="flex items-center gap-1.5 mt-1">
              <span className="h-[1px] w-2 sm:w-3 bg-[#D4AF37]/70" />
              <span
                className={cn(
                  'text-[#D4AF37] font-sans font-bold uppercase tracking-[0.35em]',
                  size === 'sm' && 'text-[9px]',
                  size === 'md' && 'text-[10px] sm:text-[11px]',
                  size === 'lg' && 'text-[11px] sm:text-[12px] lg:text-[13px]',
                  size === 'xl' && 'text-[13px] sm:text-[15px]'
                )}
              >
                JEWELS
              </span>
              <span className="h-[1px] w-2 sm:w-3 bg-[#D4AF37]/70" />
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
