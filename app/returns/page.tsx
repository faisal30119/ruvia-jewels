import React from 'react';
import { RotateCcw, AlertTriangle, CheckCircle, Package } from 'lucide-react';

export const metadata = {
  title: 'Return & Exchange Policy | Ruvia Jewels',
  description: 'Understand Ruvia Jewels return policy, replacement terms for damaged items, and exchange procedures.',
};

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37] font-semibold mb-2">
            Hassle-Free Assistance
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Return & Exchange Policy
          </h1>
          <div className="w-16 h-0.5 bg-[#D4AF37] mx-auto mt-4" />
        </div>

        <div className="bg-white border border-gray-200/80 p-6 sm:p-8 space-y-6 text-sm text-gray-600 leading-relaxed shadow-sm">
          <section>
            <h2 className="font-serif text-xl font-bold text-[#022c22] mb-3 flex items-center gap-2">
              <RotateCcw size={18} className="text-[#D4AF37]" /> Replacement & Exchange Terms
            </h2>
            <p>
              At <strong>Ruvia Jewels</strong>, every piece undergoes rigorous quality control before dispatch. Due to the handcrafted nature and hygiene standards of fine bridal jewelry, we accept returns and exchanges exclusively under the following conditions:
            </p>
            <ul className="mt-3 space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="text-emerald-700 mt-0.5 shrink-0" />
                <span>The item received is damaged or defective upon arrival.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="text-emerald-700 mt-0.5 shrink-0" />
                <span>An incorrect design or color variant was delivered.</span>
              </li>
            </ul>
          </section>

          <section className="pt-4 border-t border-gray-100">
            <h2 className="font-serif text-xl font-bold text-[#022c22] mb-3 flex items-center gap-2">
              <AlertTriangle size={18} className="text-[#D4AF37]" /> 48-Hour Reporting & Unboxing Video Requirement
            </h2>
            <div className="bg-[#022c22]/5 border-l-4 border-[#D4AF37] p-4 text-xs text-gray-700 space-y-1">
              <p className="font-bold text-[#022c22]">Mandatory Unboxing Video Requirement:</p>
              <p>
                To be eligible for a replacement or refund for damaged in-transit products, customers must record a <strong>continuous 360° unboxing video</strong> from the initial opening of the sealed outer parcel box. Issues must be reported to our WhatsApp support within <strong>48 hours</strong> of delivery.
              </p>
            </div>
          </section>

          <section className="pt-4 border-t border-gray-100">
            <h2 className="font-serif text-xl font-bold text-[#022c22] mb-3 flex items-center gap-2">
              <Package size={18} className="text-[#D4AF37]" /> How to Initiate a Return or Exchange
            </h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Contact our support team on WhatsApp at <strong>+91 9608921088</strong> or email <strong>almasladiescornersakchi@gmail.com</strong> within 48 hours.</li>
              <li>Provide your Order ID, clear photos of the product, and the unboxing video.</li>
              <li>Once verified, our team will arrange a reverse pickup or guide you on return shipment.</li>
              <li>Upon receiving and inspecting the returned item, a free replacement or store credit coupon will be issued.</li>
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
