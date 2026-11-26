"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  ArrowRight,
  CheckCircle2,
  Building2,
  Send,
  MessageSquare,
  Sparkles,
} from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    businessName: "",
    phone: "",
    city: "",
    segment: "Wholesale Cloth Trader",
    message: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-['Plus_Jakarta_Sans'] selection:bg-blue-600 selection:text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:bg-blue-700 transition-colors">
              <span className="font-extrabold text-white text-xl tracking-tight">T</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-slate-900 flex items-center gap-1.5">
                Texa <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">ERP</span>
              </span>
              <span className="text-[11px] text-slate-500 font-medium tracking-wide">Textile Operating System</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
            <Link href="/how-it-works" className="hover:text-blue-600 transition-colors">How It Works</Link>
            <Link href="/contact" className="text-blue-600 font-bold transition-colors">Contact</Link>
            <Link href="/auth/login" className="hover:text-blue-600 transition-colors">Sign In</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="py-16 bg-gradient-to-b from-white via-slate-50 to-[#f8fafc] border-b border-slate-200 text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-4">
            <Sparkles size={14} className="text-blue-600" />
            <span>Dedicated Support for Indian Textile Businesses</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Contact the Texa Team
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Have questions about GST Invoicing, Delivery Challans, or setting up Texa for your mill or shop? We are here to help.
          </p>
        </div>
      </section>

      {/* MAIN CONTENT: FORM + INFO */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Contact Cards */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
                Direct Contact Information
              </h3>

              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Headquarters</h4>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                      Ring Road Textile Market Complex, Near Sahara Darwaja, Surat, Gujarat 395002, India
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Phone size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Phone & WhatsApp Support</h4>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 font-mono">
                      +91 98765 43210 (Toll-Free Helpline)
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">Quick WhatsApp responses within 15 minutes</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Mail size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Email Inquiries</h4>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1">support@texa.in</p>
                    <p className="text-xs sm:text-sm text-slate-600">sales@texa.in</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Business Operating Hours</h4>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1">
                      Monday to Saturday: 9:00 AM – 8:00 PM IST
                    </p>
                    <p className="text-xs text-slate-500">Closed on Sundays & National Holidays</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Trust Callout */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md space-y-2">
              <h4 className="text-base font-bold">Fast Onboarding for Your Business</h4>
              <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
                Our team can assist with importing your existing party ledger sheets and inventory balances into Texa within 24 hours.
              </p>
            </div>
          </div>

          {/* Right Column: Inquiry Form */}
          <div className="lg:col-span-7">
            <div className="bg-white p-8 sm:p-10 rounded-2xl border border-slate-200 shadow-md">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Send Us an Inquiry</h3>
              <p className="text-sm text-slate-600 mb-8">
                Fill out the form below and our textile technical representative will get in touch with you shortly.
              </p>

              {isSubmitted ? (
                <div className="p-8 text-center bg-emerald-50 rounded-xl border border-emerald-200 space-y-3">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={24} />
                  </div>
                  <h4 className="text-lg font-bold text-emerald-900">Inquiry Received Successfully!</h4>
                  <p className="text-xs sm:text-sm text-emerald-700">
                    Thank you for reaching out. One of our support executives will connect with you on WhatsApp / Phone shortly.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsSubmitted(false)}
                    className="mt-4 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ramesh Patel"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full h-11 px-4 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Business / Firm Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Shiv Creation"
                        value={formData.businessName}
                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                        className="w-full h-11 px-4 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Phone / WhatsApp Number *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 98765 43210"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full h-11 px-4 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        City / Textile Center *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Surat, Ahmedabad, Bhiwandi"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full h-11 px-4 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Your Textile Business Type
                    </label>
                    <select
                      value={formData.segment}
                      onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
                      className="w-full h-11 px-4 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    >
                      <option value="Wholesale Cloth Trader">Wholesale Cloth Trader</option>
                      <option value="Weaving / Grey Mill">Weaving / Grey Mill</option>
                      <option value="Saree & Garment Manufacturer">Saree & Garment Manufacturer</option>
                      <option value="Yarn Spinner / Supplier">Yarn Spinner / Supplier</option>
                      <option value="Broker / Commission Agent">Broker / Commission Agent</option>
                      <option value="Jobwork / Dyeing & Printing">Jobwork / Dyeing & Printing</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      How Can We Help You? (Message)
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Tell us about your requirements or questions..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full p-4 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send size={16} />
                    <span>Submit Inquiry</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* LARGE FOOTER */}
      <footer className="bg-slate-900 text-slate-400 text-sm border-t border-slate-800 pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12 pb-12 border-b border-slate-800">
            <div className="col-span-2">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-lg">
                  T
                </div>
                <span className="text-xl font-extrabold text-white tracking-tight">Texa ERP</span>
              </Link>
              <p className="mt-4 text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
                The leading cloud-based billing, delivery challan, and party accounting software custom-designed for the Indian textile and fabric industry.
              </p>
              <div className="mt-6 space-y-2 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-blue-400 shrink-0" />
                  <span>Ring Road Textile Market, Surat, Gujarat 395002</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-blue-400 shrink-0" />
                  <span>+91 98765 43210</span>
                </div>
              </div>
            </div>

            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Product</h5>
              <ul className="space-y-2.5 text-xs">
                <li><Link href="/auth/login" className="hover:text-white transition-colors">GST Invoicing</Link></li>
                <li><Link href="/auth/login" className="hover:text-white transition-colors">Delivery Challans</Link></li>
                <li><Link href="/auth/login" className="hover:text-white transition-colors">Party Ledger</Link></li>
                <li><Link href="/auth/login" className="hover:text-white transition-colors">Karigar Upad</Link></li>
                <li><Link href="/auth/login" className="hover:text-white transition-colors">Yarn & Fabric Stock</Link></li>
              </ul>
            </div>

            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Navigation</h5>
              <ul className="space-y-2.5 text-xs">
                <li><Link href="/" className="hover:text-white transition-colors">Home Page</Link></li>
                <li><Link href="/how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link href="/auth/login" className="hover:text-white transition-colors">Admin Login</Link></li>
              </ul>
            </div>

            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Support</h5>
              <ul className="space-y-2.5 text-xs">
                <li><span className="text-slate-300">support@texa.in</span></li>
                <li><span className="text-slate-500">Mon - Sat: 9 AM - 8 PM IST</span></li>
                <li><span className="text-emerald-400">100% Cloud Uptime</span></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div>
              © {new Date().getFullYear()} Texa ERP. All rights reserved.
            </div>
            <div className="flex items-center gap-6">
              <Link href="/" className="hover:text-slate-400">Privacy Policy</Link>
              <Link href="/" className="hover:text-slate-400">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
