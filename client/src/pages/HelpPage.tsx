import React, { useState } from 'react';
import { HelpCircle, MessageSquare, ChevronDown, ChevronUp, Send, CheckCircle2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const HelpPage: React.FC = () => {
  const { showToast } = useToast();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const faqs = [
    {
      q: 'How does real-time seat locking work?',
      a: 'When you click to select seats, CINEMATIC immediately locks those seats for your session for 10 minutes. This prevents any other user across India from double-booking your seats while you review pricing, apply promo coupons, and complete payment.'
    },
    {
      q: 'What is the ticket cancellation and refund policy?',
      a: 'Bookings are eligible for a 75% refund if cancelled at least 2 hours before the scheduled showtime. Refunds are processed idempotently and credited directly back to your original payment method via Razorpay within 2-4 business days.'
    },
    {
      q: 'How do I use my digital ticket at the cinema?',
      a: 'Your confirmed booking generates an official encrypted QR Code. You can view it under "My Bookings" or print/download it. Simply present this QR code to the usher at the cinema turnstile for rapid, contactless entry.'
    },
    {
      q: 'How do I apply promotional coupons?',
      a: 'You can explore all available vouchers on the Offers page. At checkout, simply enter or click "Apply" on any voucher code (like CINEMA50 or BLOCKBUSTER100) to receive an instant discount before completing payment.'
    }
  ];

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    showToast('Support ticket dispatched! Our staff will get back to you shortly.', 'success');
  };

  return (
    <div className="min-h-screen bg-[#08090C] text-[#F1F5F9] py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-xl mx-auto">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#E50914]/20 border border-[#E50914]/40 text-[#E50914] mb-3 shadow-glow">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">Help Centre & FAQs</h1>
          <p className="text-xs text-gray-400 mt-2">
            Everything you need to know about bookings, cancellations, seat holds, and refunds.
          </p>
        </div>

        {/* FAQs Accordion */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white mb-4">Frequently Asked Questions</h2>
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-[#12151B] border border-white/5 overflow-hidden transition-all"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-5 text-left flex items-center justify-between font-bold text-sm text-white hover:text-[#E50914] transition-colors"
              >
                <span>{faq.q}</span>
                {openFaq === idx ? <ChevronUp className="w-4 h-4 text-[#E50914]" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-5 text-xs text-gray-300 leading-relaxed border-t border-white/5 pt-3 animate-fade-in">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact Support Form */}
        <div className="p-8 rounded-3xl bg-[#12151B] border border-white/5 shadow-xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Need Assistance? Contact Cinema Support</h3>
              <p className="text-xs text-gray-400 mt-0.5">Submit an inquiry regarding a booking or venue experience</p>
            </div>
          </div>

          {submitted ? (
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto" />
              <div className="font-bold text-sm">Ticket Received! Reference #TKT-{Math.floor(100000 + Math.random() * 900000)}</div>
              <p className="text-xs text-emerald-300">Our customer care representative will email you within 15 minutes.</p>
            </div>
          ) : (
            <form onSubmit={handleSupportSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 font-semibold mb-1">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Query regarding booking CNM-849201"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0D0F14] border border-white/10 text-white focus:outline-none focus:border-[#E50914]"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-semibold mb-1">Message Description</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe your query or issue in detail..."
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0D0F14] border border-white/10 text-white focus:outline-none focus:border-[#E50914]"
                />
              </div>

              <button
                type="submit"
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#E50914] hover:bg-[#FF2E4D] text-white font-bold tracking-wide shadow-glow transition-all"
              >
                <Send className="w-4 h-4" />
                <span>Submit Support Inquiry</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
