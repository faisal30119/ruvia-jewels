import Link from 'next/link';
import { Home, Phone, Mail, Instagram } from 'lucide-react';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#022c22] text-white/80 pb-20 lg:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-8">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <div className="mb-4">
              <p className="font-serif text-[#D4AF37] text-2xl font-bold tracking-wider leading-none">
                ALMAS
              </p>
              <p className="text-white/40 text-[10px] tracking-[0.4em] uppercase mt-0.5">
                Jewels
              </p>
            </div>
            <p className="text-sm text-white/60 leading-relaxed max-w-xs">
              Handcrafted luxury bridal jewelry — where tradition meets elegance. Every piece tells a story of heritage and craftsmanship.
            </p>
            <Link
              href="/"
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#D4AF37] hover:underline font-medium"
            >
              <Home size={14} className="text-white shrink-0" /> Back to Home
            </Link>
          </div>

          {/* Quick Links */}
          <div className="col-span-1">
            <h4 className="text-[10px] tracking-widest uppercase text-[#D4AF37] mb-4 font-semibold">
              Quick Links
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Home', href: '/' },
                { label: 'About Us', href: '/about' },
                { label: "FAQ's", href: '/faq' },
                { label: 'Blog', href: '/blog' },
                { label: 'Shipping & Delivery', href: '/shipping' },
                { label: 'Return & Exchange', href: '/returns' },
                { label: 'Terms & Conditions', href: '/terms' },
                { label: 'Privacy Policy', href: '/privacy' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs sm:text-sm text-white/60 hover:text-[#D4AF37] transition-colors leading-tight block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Collections */}
          <div className="col-span-1">
            <h4 className="text-[10px] tracking-widest uppercase text-[#D4AF37] mb-4 font-semibold">
              Collections
            </h4>
            <ul className="space-y-2.5">
              {[
                'Bridal Sets',
                'Necklaces',
                'Earrings',
                'Pendants',
                'Kundan Jewelry',
                'Polki Jewelry',
              ].map((cat) => (
                <li key={cat}>
                  <Link
                    href={`/shop?category=${encodeURIComponent(cat)}`}
                    className="text-xs sm:text-sm text-white/60 hover:text-[#D4AF37] transition-colors leading-tight block"
                  >
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-2 lg:col-span-1">
            <h4 className="text-[10px] tracking-widest uppercase text-[#D4AF37] mb-4 font-semibold">
              Contact Us
            </h4>

            <ul className="space-y-3 text-sm text-white/60">
              <li>
                <a
                  href="https://wa.me/919608921088"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#D4AF37] transition-colors flex items-center gap-2"
                >
                  <Phone size={15} className="text-white shrink-0" />
                  <span>WhatsApp: +91 9608921088</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:almasladiescornersakchi@gmail.com"
                  className="hover:text-[#D4AF37] transition-colors flex items-center gap-2 break-all"
                >
                  <Mail size={15} className="text-white shrink-0" />
                  <span>almasladiescornersakchi@gmail.com</span>
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/almasjewels"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#D4AF37] transition-colors flex items-center gap-2"
                >
                  <Instagram size={15} className="text-white shrink-0" />
                  <span>@almasjewels on Instagram</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
          <p>© {year} Almas Jewels. All rights reserved.</p>
          <p className="tracking-widest uppercase text-[10px]">
            Crafted with care in India
          </p>
        </div>
      </div>
    </footer>
  );
}
