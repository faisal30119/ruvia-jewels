import React from 'react';

export const metadata = {
  title: 'Terms & Conditions | Almas Jewels',
  description: 'Read the terms and conditions governing the use of Almas Jewels website and purchase services.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37] font-semibold mb-2">
            Legal & Governance
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Terms & Conditions
          </h1>
          <div className="w-16 h-0.5 bg-[#D4AF37] mx-auto mt-4" />
        </div>

        <div className="bg-white border border-gray-200/80 p-6 sm:p-8 space-y-6 text-sm text-gray-600 leading-relaxed shadow-sm">
          <section>
            <h2 className="font-serif text-lg font-bold text-[#022c22] mb-2">1. Overview & Agreement</h2>
            <p>
              This website is operated by <strong>Almas Jewels</strong>. Throughout the site, the terms &quot;we&quot;, &quot;us&quot;, and &quot;our&quot; refer to Almas Jewels. By visiting our site or purchasing products from us, you engage in our service and agree to be bound by the following terms and conditions.
            </p>
          </section>

          <section className="pt-4 border-t border-gray-100">
            <h2 className="font-serif text-lg font-bold text-[#022c22] mb-2">2. Product Descriptions & Artisanal Variation</h2>
            <p>
              We strive to display the colors, designs, and dimensions of our products as accurately as possible. However, because our jewelry features handcrafted Kundan setting, hand-cut glass stones, and hand-applied Meenakari enamel, slight handmade variations in shade or finish are intrinsic characteristics of authentic artisanal jewelry.
            </p>
          </section>

          <section className="pt-4 border-t border-gray-100">
            <h2 className="font-serif text-lg font-bold text-[#022c22] mb-2">3. Pricing & Payment Security</h2>
            <p>
              All prices listed on Almas Jewels are in Indian Rupees (INR) inclusive of applicable taxes. Prices are subject to change without notice. All online transactions are processed through encrypted 256-bit SSL Razorpay payment gateways ensuring absolute card and banking data security.
            </p>
          </section>

          <section className="pt-4 border-t border-gray-100">
            <h2 className="font-serif text-lg font-bold text-[#022c22] mb-2">4. Intellectual Property</h2>
            <p>
              All content, images, graphics, logos, and product designs featured on this website belong exclusively to Almas Jewels. Reproduction, distribution, or unauthorized commercial use of any asset without prior written consent is strictly prohibited.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
