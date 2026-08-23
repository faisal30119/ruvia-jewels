import React from 'react';

export const metadata = {
  title: 'Privacy Policy | Almas Jewels',
  description: 'Learn about how Almas Jewels collects, protects, and uses customer personal information.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37] font-semibold mb-2">
            Data Protection & Security
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Privacy Policy
          </h1>
          <div className="w-16 h-0.5 bg-[#D4AF37] mx-auto mt-4" />
        </div>

        <div className="bg-white border border-gray-200/80 p-6 sm:p-8 space-y-6 text-sm text-gray-600 leading-relaxed shadow-sm">
          <section>
            <h2 className="font-serif text-lg font-bold text-[#022c22] mb-2">1. Information Collection</h2>
            <p>
              At <strong>Almas Jewels</strong>, we respect your privacy. When you visit our website or place an order, we collect personal information necessary to fulfill your purchases, including your name, email address, phone number, delivery address, and payment preferences.
            </p>
          </section>

          <section className="pt-4 border-t border-gray-100">
            <h2 className="font-serif text-lg font-bold text-[#022c22] mb-2">2. How We Use Your Data</h2>
            <p>
              Your personal data is strictly used for processing orders, managing shipments, sending order status updates via SMS/Email, providing customer support, and improving your browsing experience. We never sell, rent, or trade customer information to third-party marketing companies.
            </p>
          </section>

          <section className="pt-4 border-t border-gray-100">
            <h2 className="font-serif text-lg font-bold text-[#022c22] mb-2">3. Payment & Data Security</h2>
            <p>
              Online payments are processed securely via PCI-DSS compliant payment gateways (Razorpay). Your credit card, debit card, or UPI credentials are encrypted directly through the payment processor and are never stored on our web servers.
            </p>
          </section>

          <section className="pt-4 border-t border-gray-100">
            <h2 className="font-serif text-lg font-bold text-[#022c22] mb-2">4. Contacting Us Regarding Your Privacy</h2>
            <p>
              If you have any questions or wish to request data correction or account deletion, please contact our Data Protection representative at <strong>almasladiescornersakchi@gmail.com</strong> or WhatsApp us at <strong>+91 9608921088</strong>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
