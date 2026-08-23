'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

const FAQS = [
  {
    category: 'Orders & Payments',
    items: [
      {
        q: 'What payment methods do you accept?',
        a: 'We accept Razorpay payments including Credit/Debit Cards, Net Banking, UPI (Google Pay, PhonePe, Paytm), and Cash on Delivery (COD) for eligible pincodes across India.',
      },
      {
        q: 'Can I cancel or modify my order after placing it?',
        a: 'Orders can be modified or cancelled within 12 hours of placement before dispatch. Please contact our support team immediately at +91 9608921088 or WhatsApp us.',
      },
      {
        q: 'Do you offer bridal consultations or custom jewelry design?',
        a: 'Yes! We offer bespoke bridal consultations. You can reach out to us on WhatsApp with your outfit colors and preferences, and our stylists will assist you.',
      },
    ],
  },
  {
    category: 'Shipping & Delivery',
    items: [
      {
        q: 'How long does delivery take?',
        a: 'Domestic orders across India usually deliver within 3 to 7 business days. Express shipping options are available upon request.',
      },
      {
        q: 'Are packages insured during transit?',
        a: 'Yes, all shipments from Khadie Jewels are 100% insured against loss or damage during transit.',
      },
      {
        q: 'How can I track my order?',
        a: 'You can track your live shipment anytime using our Track Order page with your Order ID or tracking number.',
      },
    ],
  },
  {
    category: 'Jewelry Care & Returns',
    items: [
      {
        q: 'What is your return and exchange policy?',
        a: 'We accept returns and exchanges for damaged or incorrect items reported within 48 hours of delivery with unboxing video proof.',
      },
      {
        q: 'How should I care for my Kundan & Polki jewelry?',
        a: 'Keep jewelry dry and away from direct perfume, hairspray, or chemicals. Store each piece in a zip lock bag or soft velvet pouch provided.',
      },
    ],
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<string | null>('0-0');

  const toggle = (idx: string) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37] font-semibold mb-2 flex items-center justify-center gap-1.5">
            <HelpCircle size={14} /> Help Center
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Frequently Asked Questions
          </h1>
          <div className="w-16 h-0.5 bg-[#D4AF37] mx-auto mt-4" />
        </div>

        {/* FAQ Groups */}
        <div className="space-y-8">
          {FAQS.map((group, gIdx) => (
            <div key={group.category} className="bg-white border border-gray-200/80 p-6 shadow-sm">
              <h2 className="font-serif text-xl font-bold text-[#022c22] mb-4 pb-2 border-b border-gray-100">
                {group.category}
              </h2>
              <div className="divide-y divide-gray-100">
                {group.items.map((item, iIdx) => {
                  const key = `${gIdx}-${iIdx}`;
                  const isOpen = openIndex === key;
                  return (
                    <div key={item.q} className="py-4 first:pt-0 last:pb-0">
                      <button
                        onClick={() => toggle(key)}
                        className="w-full flex items-center justify-between text-left gap-4 group focus:outline-none"
                      >
                        <span className="font-medium text-gray-900 group-hover:text-[#022c22] text-base">
                          {item.q}
                        </span>
                        <ChevronDown
                          size={18}
                          className={`text-gray-400 shrink-0 transition-transform duration-200 ${
                            isOpen ? 'rotate-180 text-[#D4AF37]' : ''
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <p className="mt-3 text-sm text-gray-600 leading-relaxed pr-6">
                          {item.a}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Help Banner */}
        <div className="mt-10 bg-emerald-950 text-white p-6 text-center border border-[#D4AF37]/30">
          <h3 className="font-serif font-bold text-lg text-[#D4AF37] mb-1">Still have questions?</h3>
          <p className="text-xs text-white/70 mb-4">Our customer care team is available to assist you with styling and orders.</p>
          <a
            href="https://wa.me/919608921088"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-[#D4AF37] text-[#022c22] px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-[#b5952f] transition-colors"
          >
            Chat with Us on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
