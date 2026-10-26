import React from 'react';

export const CancellationPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#08090C] text-[#F1F5F9] py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <h1 className="text-3xl font-black text-white">Cancellation & Refund Policy</h1>
        <div className="p-8 rounded-2xl bg-[#12151B] border border-white/5 space-y-4 text-xs text-gray-300 leading-relaxed">
          <p>
            At <strong>CINEMATIC</strong>, we strive to provide transparent, fair, and frictionless ticketing services across all affiliated cinema theatres.
          </p>

          <h3 className="font-bold text-sm text-white pt-2">1. Cancellation Window</h3>
          <p>
            Customers may cancel confirmed tickets at least <strong>2 hours prior</strong> to the scheduled showtime. Cancellations requested less than 2 hours before showtime are strictly non-refundable due to cinema inventory scheduling constraints.
          </p>

          <h3 className="font-bold text-sm text-white pt-2">2. Refund Amount</h3>
          <p>
            Upon successful cancellation, you are eligible for a <strong>75% refund</strong> of the total ticket amount. The remaining 25% represents cinema holding reservation costs and gateway handling fees.
          </p>

          <h3 className="font-bold text-sm text-white pt-2">3. Method of Refund</h3>
          <p>
            Refunds are credited back directly to the source payment method used during Razorpay checkout (UPI, Debit/Credit Card, or NetBanking). The funds typically reflect in your bank account within 2 to 4 business days.
          </p>

          <h3 className="font-bold text-sm text-white pt-2">4. Show Cancellations by Cinema</h3>
          <p>
            If a show is cancelled or terminated prematurely by the cinema theatre due to technical failure, force majeure, or operational issues, a <strong>100% full refund</strong> including all convenience fees and taxes will be automatically initiated to the customer.
          </p>
        </div>
      </div>
    </div>
  );
};

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#08090C] text-[#F1F5F9] py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <h1 className="text-3xl font-black text-white">Terms of Service</h1>
        <div className="p-8 rounded-2xl bg-[#12151B] border border-white/5 space-y-4 text-xs text-gray-300 leading-relaxed">
          <p>
            Welcome to CINEMATIC. By accessing or using our platform, you agree to be bound by these Terms of Service.
          </p>
          <h3 className="font-bold text-sm text-white pt-2">1. User Accounts & Authenticity</h3>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials. You agree that all registration information provided is accurate and true.
          </p>
          <h3 className="font-bold text-sm text-white pt-2">2. Real-Time Seat Holding</h3>
          <p>
            Seats selected are held temporarily for a maximum period of 10 minutes. If the booking is not completed within this hold window, the lock will automatically expire and release the seats back to public availability.
          </p>
          <h3 className="font-bold text-sm text-white pt-2">3. Payment & Ticket Generation</h3>
          <p>
            Tickets are confirmed only upon verified server-side cryptographic approval from our payment provider (Razorpay). Do not attempt to alter transaction payloads or supply client-manipulated prices.
          </p>
        </div>
      </div>
    </div>
  );
};

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#08090C] text-[#F1F5F9] py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <h1 className="text-3xl font-black text-white">Privacy Policy</h1>
        <div className="p-8 rounded-2xl bg-[#12151B] border border-white/5 space-y-4 text-xs text-gray-300 leading-relaxed">
          <p>
            CINEMATIC respects your privacy. We collect minimal personal information (such as your name, email, and phone number) strictly to deliver your digital tickets and provide customer support.
          </p>
          <h3 className="font-bold text-sm text-white pt-2">1. Payment Information</h3>
          <p>
            CINEMATIC never stores your credit card numbers, CVVs, or UPI PINs. All payment transactions are handled through PCI-DSS compliant payment gateways (Razorpay).
          </p>
          <h3 className="font-bold text-sm text-white pt-2">2. Data Retention & Security</h3>
          <p>
            We implement industry-standard 256-bit encryption and strict access controls to safeguard your transaction and booking records.
          </p>
        </div>
      </div>
    </div>
  );
};
