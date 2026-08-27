import React from 'react';
import { Truck, ShieldCheck, Clock, MapPin } from 'lucide-react';

export const metadata = {
  title: 'Shipping & Delivery Details | Ruvia Jewels',
  description: 'Learn about Ruvia Jewels shipping policies, dispatch timelines, insured courier delivery across India.',
};

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37] font-semibold mb-2">
            Pan-India & Global Express
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Shipping & Delivery Details
          </h1>
          <div className="w-16 h-0.5 bg-[#D4AF37] mx-auto mt-4" />
        </div>

        {/* Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="bg-white border border-gray-200/80 p-5 text-center">
            <Truck size={24} className="text-[#022c22] mx-auto mb-2" />
            <h3 className="font-serif font-bold text-gray-900 text-sm mb-1">Free Pan-India Delivery</h3>
            <p className="text-xs text-gray-500">On all orders above ₹1,999</p>
          </div>
          <div className="bg-white border border-gray-200/80 p-5 text-center">
            <Clock size={24} className="text-[#022c22] mx-auto mb-2" />
            <h3 className="font-serif font-bold text-gray-900 text-sm mb-1">3–7 Business Days</h3>
            <p className="text-xs text-gray-500">Standard insured transit time</p>
          </div>
          <div className="bg-white border border-gray-200/80 p-5 text-center">
            <ShieldCheck size={24} className="text-[#022c22] mx-auto mb-2" />
            <h3 className="font-serif font-bold text-gray-900 text-sm mb-1">100% Insured Shipment</h3>
            <p className="text-xs text-gray-500">Full coverage during transit</p>
          </div>
        </div>

        {/* Details Content */}
        <div className="bg-white border border-gray-200/80 p-6 sm:p-8 space-y-6 text-sm text-gray-600 leading-relaxed shadow-sm">
          <section>
            <h2 className="font-serif text-xl font-bold text-[#022c22] mb-2 flex items-center gap-2">
              <MapPin size={18} className="text-[#D4AF37]" /> Order Processing & Dispatch
            </h2>
            <p>
              Each order placed with Ruvia Jewels undergoes a meticulous 12-point quality check and tamper-proof luxury packaging. Orders for ready-to-ship pieces are processed and dispatched within <strong>24 to 48 hours</strong>.
            </p>
            <p className="mt-2 text-xs text-gray-500">
              * Custom bridal sets or pre-order handcrafted pieces may require 7–14 business days for artisanal crafting before dispatch.
            </p>
          </section>

          <section className="pt-4 border-t border-gray-100">
            <h2 className="font-serif text-xl font-bold text-[#022c22] mb-2">
              Courier Partners & Real-time Tracking
            </h2>
            <p>
              We partner with India&apos;s leading logistics networks including Bluedart, Delhivery, and DTDC. Once dispatched, you will receive an SMS and email notification with your live tracking AWB link.
            </p>
          </section>

          <section className="pt-4 border-t border-gray-100">
            <h2 className="font-serif text-xl font-bold text-[#022c22] mb-2">
              Shipping Charges
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Orders above ₹1,999:</strong> FREE Shipping across India.</li>
              <li><strong>Orders below ₹1,999:</strong> Standard flat rate of ₹49.</li>
              <li><strong>Cash on Delivery (COD):</strong> Nominal ₹100 COD fee applies.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
