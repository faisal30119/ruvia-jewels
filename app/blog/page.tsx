import React from 'react';
import Link from 'next/link';
import { Calendar, User, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Jewelry Blog & Bridal Guide | Ruvia Jewels',
  description: 'Explore the latest bridal jewelry trends, Kundan vs Polki guides, and jewelry care tips from Ruvia Jewels.',
};

const POSTS = [
  {
    id: 1,
    title: 'Kundan vs. Polki: Understanding Royal Heritage Jewelry',
    excerpt: 'Discover the distinct differences between Kundan and Polki jewelry, their historical origins in Rajasthan, and how to pick the right set for your wedding.',
    date: 'August 14, 2026',
    author: 'Almas Editorial',
    category: 'Bridal Guide',
  },
  {
    id: 2,
    title: 'How to Match Bridal Jewelry with Lehenga Necklines',
    excerpt: 'A complete bridal styling guide to pairing choker sets, raani haars, and collar neckpieces with sweetheart, deep V, and boat neck bridal lehengas.',
    date: 'July 28, 2026',
    author: 'Bridal Stylist',
    category: 'Styling Tips',
  },
  {
    id: 3,
    title: 'Essential Care Guide: Preserving Gold-Plated & Meenakari Jewelry',
    excerpt: 'Learn expert tips to keep your handcrafted jewelry shining for generations, from proper storage to avoiding perfume oxidation.',
    date: 'July 10, 2026',
    author: 'Master Craftsman',
    category: 'Jewelry Care',
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37] font-semibold mb-2">
            The Journal
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Bridal & Jewelry Blog
          </h1>
          <div className="w-16 h-0.5 bg-[#D4AF37] mx-auto mt-4" />
        </div>

        {/* Posts List */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {POSTS.map((post) => (
            <article key={post.id} className="bg-white border border-gray-200/80 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37] bg-[#022c22]/5 px-2.5 py-1 inline-block mb-3">
                  {post.category}
                </span>
                <h2 className="font-serif font-bold text-gray-900 text-lg mb-3 leading-snug hover:text-[#022c22]">
                  {post.title}
                </h2>
                <p className="text-xs text-gray-600 leading-relaxed mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100 mt-auto">
                <div className="flex items-center justify-between text-[11px] text-gray-400 mb-3">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} /> {post.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <User size={12} /> {post.author}
                  </span>
                </div>
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-1 text-xs text-[#022c22] font-semibold hover:text-[#D4AF37] transition-colors"
                >
                  Read Article <ArrowRight size={12} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
