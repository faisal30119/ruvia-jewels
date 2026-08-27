import React from 'react';
import Link from 'next/link';
import { ArrowRight, Award, Gem, ShieldCheck, Sparkles } from 'lucide-react';

export const metadata = {
  title: 'About Us | Ruvia Jewels',
  description: 'Learn about Ruvia Jewels — our heritage, handcrafted bridal couture, and commitment to luxury jewelry craftsmanship.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37] font-semibold mb-2">
            Royal Heritage & Craftsmanship
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight">
            About Ruvia Jewels
          </h1>
          <div className="w-16 h-0.5 bg-[#D4AF37] mx-auto mt-4" />
        </div>

        {/* Hero Story */}
        <div className="bg-white border border-gray-200/80 p-6 sm:p-10 shadow-sm mb-10">
          <h2 className="font-serif text-2xl font-bold text-[#022c22] mb-4">
            Where Tradition Meets Regal Elegance
          </h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Founded with a passion for preserving Indian royal heritage, <strong>Ruvia Jewels</strong> creates timeless bridal couture and fine jewelry designed to celebrate life&apos;s most memorable moments. Every piece in our collection is handcrafted by master artisans using centuries-old techniques of Kundan setting, traditional Polki glasswork, and intricate Meenakari enameling.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Our atelier in Sakchi, Jamshedpur combines royal aesthetics with modern precision, ensuring each necklace, earring, bridal set, and ring embodies grace, grandeur, and uncompromised luxury.
          </p>
        </div>

        {/* Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            {
              icon: Gem,
              title: 'Master Craftsmanship',
              desc: 'Intricately handcrafted by master karigars with decades of traditional expertise.',
            },
            {
              icon: Sparkles,
              title: 'Royal Designs',
              desc: 'Inspired by Mughal and Rajasthani royal court jewelry traditions.',
            },
            {
              icon: ShieldCheck,
              title: 'Quality Assured',
              desc: 'Premium gold-plating, hand-cut stones, and rigorous quality inspection.',
            },
            {
              icon: Award,
              title: 'Bespoke Atelier',
              desc: 'Personalized bridal consultations and custom design modifications.',
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white border border-gray-200/70 p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-[#022c22]/5 flex items-center justify-center mx-auto mb-4 text-[#022c22]">
                <Icon size={24} />
              </div>
              <h3 className="font-serif font-bold text-gray-900 mb-2 text-base">{title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-[#022c22] text-white p-8 sm:p-12 text-center rounded-none shadow-md">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold mb-3 text-[#D4AF37]">
            Explore Our Regal Collections
          </h2>
          <p className="text-sm text-white/80 max-w-xl mx-auto mb-6">
            Find the perfect bridal set or statement jewelry for your special occasion.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 bg-[#D4AF37] text-[#022c22] px-6 py-3 text-xs uppercase tracking-widest font-bold hover:bg-[#b5952f] transition-colors"
          >
            Shop Collections <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
