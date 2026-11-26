"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Truck,
  BookOpen,
  Package,
  Users,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles,
  ChevronDown,
  Download,
  Share2,
  TrendingUp,
  Layers,
  Smartphone,
  Laptop,
  Check,
  Building2,
  Factory,
  ShoppingBag,
  HelpCircle,
  Phone,
  Mail,
  MapPin,
  Clock,
  ChevronRight,
  BarChart3,
  Search,
} from "lucide-react";

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-['Plus_Jakarta_Sans'] selection:bg-blue-600 selection:text-white">
      {/* 1. TOP ANNOUNCEMENT BAR */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-blue-950 text-white text-xs font-medium py-2.5 px-4 text-center border-b border-indigo-900/50">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 flex-wrap">
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
            Live
          </span>
          <span className="text-slate-200">Automated Challan-to-Bill Conversion & Instant WhatsApp Statements are ready!</span>
          <Link href="/how-it-works" className="text-amber-400 hover:text-amber-300 font-bold inline-flex items-center gap-0.5 ml-1">
            See how it works <ChevronRight size={12} />
          </Link>
        </div>
      </div>

      {/* 2. HEADER & NAVIGATION */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <span className="font-black text-white text-xl tracking-tight">T</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-slate-900 flex items-center gap-1.5">
                Texa <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 text-indigo-700 border border-indigo-200/80">ERP</span>
              </span>
              <span className="text-[11px] text-slate-500 font-medium tracking-wide">Textile Operating System</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
            <Link href="/how-it-works" className="hover:text-indigo-600 transition-colors">How It Works</Link>
            <a href="#solutions" className="hover:text-indigo-600 transition-colors">Solutions</a>
            <a href="#comparison" className="hover:text-indigo-600 transition-colors">Why Texa</a>
            <a href="#faq" className="hover:text-indigo-600 transition-colors">FAQ</a>
            <Link href="/contact" className="hover:text-indigo-600 transition-colors">Contact</Link>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/auth/login"
              className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-md shadow-indigo-500/25 transition-all hover:shadow-indigo-500/35 flex items-center gap-1.5 cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </header>

      {/* 3. HERO SECTION */}
      <section className="relative pt-16 pb-20 lg:pt-24 lg:pb-32 overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/50 via-slate-50/60 to-[#f8fafc]">
        {/* Colorful Ambient Blurs */}
        <div className="absolute top-12 left-1/4 w-80 h-80 bg-violet-200/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-16 right-1/4 w-96 h-96 bg-cyan-200/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-48 left-1/2 -translate-x-1/2 w-[600px] h-64 bg-amber-100/30 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-indigo-200 text-indigo-900 text-xs font-bold mb-6 shadow-xs">
            <Sparkles size={14} className="text-indigo-600" />
            <span>Built Specifically for Indian Textile Manufacturers, Weavers & Traders</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15] max-w-4xl mx-auto">
            The Complete Software for <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600">
              Textile Billing, Challans & Ledgers
            </span>
          </h1>

          {/* Subheading */}
          <p className="mt-6 text-base sm:text-lg lg:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Eliminate messy paper records and rigid legacy software. Generate GST Tax Invoices, dispatch with Delivery Challans, track Party Outstanding balances, and manage Karigar payroll in one unified platform.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-base bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Explore Live Dashboard</span>
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/how-it-works"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-semibold text-base border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <span>Read Step-by-Step Guide</span>
            </Link>
          </div>

          {/* Distinct Colored Trust Highlights */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm font-semibold">
            <div className="px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 flex items-center gap-2 shadow-2xs">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span>Full GST (CGST/SGST/IGST) Compliant</span>
            </div>
            <div className="px-3.5 py-1.5 rounded-full bg-green-50 text-green-800 border border-green-200/80 flex items-center gap-2 shadow-2xs">
              <Share2 size={16} className="text-green-600" />
              <span>Direct WhatsApp PDF Delivery</span>
            </div>
            <div className="px-3.5 py-1.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200/80 flex items-center gap-2 shadow-2xs">
              <ShieldCheck size={16} className="text-purple-600" />
              <span>100% Secure Cloud Storage</span>
            </div>
            <div className="px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200/80 flex items-center gap-2 shadow-2xs">
              <BookOpen size={16} className="text-amber-600" />
              <span>Export to Excel & Tally</span>
            </div>
          </div>

          {/* 4. REALISTIC LIVE SOFTWARE SCREENSHOT MOCKUP */}
          <div className="mt-14 relative max-w-6xl mx-auto">
            <div className="rounded-2xl border border-slate-300/80 bg-white shadow-2xl p-2 sm:p-3 overflow-hidden text-left ring-1 ring-slate-900/5">
              {/* Browser Header Bar */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100 rounded-t-xl border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="text-xs text-slate-500 font-mono ml-3 font-medium">https://texa-erp.in/dashboard</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Live Demo
                  </span>
                </div>
              </div>

              {/* Inside Dashboard Application Screen Mockup */}
              <div className="p-4 sm:p-6 bg-slate-50 rounded-b-xl space-y-6">
                {/* Metric Summary Cards with Distinct Contrasting Accents */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 border-t-4 border-t-blue-500 shadow-xs hover:shadow-md transition-shadow">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Sales (Nov)</div>
                    <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 mt-1">₹24,80,450</div>
                    <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      ↑ 14.2% from last month
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 border-t-4 border-t-amber-500 shadow-xs hover:shadow-md transition-shadow">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Outstanding</div>
                    <div className="text-xl sm:text-2xl font-bold font-mono text-amber-600 mt-1">₹7,42,120</div>
                    <div className="text-[11px] text-amber-700 font-medium mt-1">18 Parties Pending</div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 border-t-4 border-t-teal-500 shadow-xs hover:shadow-md transition-shadow">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Challans</div>
                    <div className="text-xl sm:text-2xl font-bold font-mono text-teal-600 mt-1">48 Dispatches</div>
                    <div className="text-[11px] text-teal-700 font-medium mt-1">Ready for Billing</div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 border-t-4 border-t-purple-500 shadow-xs hover:shadow-md transition-shadow">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Karigar Upad Advance</div>
                    <div className="text-xl sm:text-2xl font-bold font-mono text-purple-600 mt-1">₹38,500</div>
                    <div className="text-[11px] text-purple-700 font-medium mt-1">Auto-sync with payroll</div>
                  </div>
                </div>

                {/* Recent Invoices & Challans Table Preview */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Recent Tax Invoices & Dispatches</h4>
                      <p className="text-xs text-slate-500">Live operational ledger in Surat Textile Market</p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Live Synced
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/70 text-slate-600 uppercase font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-4">Invoice No</th>
                          <th className="py-2.5 px-4">Customer / Party Name</th>
                          <th className="py-2.5 px-4">Date</th>
                          <th className="py-2.5 px-4 text-right">Meters / Qty</th>
                          <th className="py-2.5 px-4 text-right">Amount (₹)</th>
                          <th className="py-2.5 px-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                        <tr className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-bold text-blue-600">INV-0001</td>
                          <td className="py-3 px-4 font-sans font-medium text-slate-900">Meet (Shiv Creation), Surat</td>
                          <td className="py-3 px-4">25/11/2026</td>
                          <td className="py-3 px-4 text-right">1,087.10 Mtr</td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900">₹1,08,710.00</td>
                          <td className="py-3 px-4 text-center font-sans">
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              Unpaid
                            </span>
                          </td>
                        </tr>
                        <tr className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-bold text-blue-600">INV-0002</td>
                          <td className="py-3 px-4 font-sans font-medium text-slate-900">Om Sai Enterprise, Ring Road</td>
                          <td className="py-3 px-4">24/11/2026</td>
                          <td className="py-3 px-4 text-right">240.00 Mtr</td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900">₹21,018.75</td>
                          <td className="py-3 px-4 text-center font-sans">
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Paid
                            </span>
                          </td>
                        </tr>
                        <tr className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-bold text-indigo-600">CH-0003</td>
                          <td className="py-3 px-4 font-sans font-medium text-slate-900">Radhe Krishna Fabrics, Ahmedabad</td>
                          <td className="py-3 px-4">25/11/2026</td>
                          <td className="py-3 px-4 text-right">560.00 Mtr</td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900">₹64,400.00</td>
                          <td className="py-3 px-4 text-center font-sans">
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              Challan Dispatched
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4.5 INTEGRATIONS RIBBON - WORKS WITH THE REPORTS YOU ALREADY DOWNLOAD */}
        <div className="mt-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <p className="text-xs sm:text-sm font-semibold text-slate-500 tracking-wide uppercase mb-6">
            Works with the reports you already download
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {/* Amazon */}
            <div className="w-24 sm:w-28 h-24 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-slate-300 flex flex-col items-center justify-center gap-2 transition-all group">
              <div className="w-8 h-8 flex items-center justify-center">
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
                  <path d="M12.8 14.8c-1.8 1.4-4.4 2.1-6.7 2.1-3.2 0-6.1-1.2-8.3-3.2-.2-.2-.2-.5 0-.7.3-.2.6-.2.8 0 2 1.8 4.6 2.9 7.5 2.9 2 0 4.4-.7 6-1.9.3-.2.7 0 .8.3.1.2 0 .4-.1.5z" fill="#FF9900"/>
                  <path d="M13.4 14c-.2-.3-.8-.1-1.2 0-.2.1-.2.2-.1.3.4.6 1.4.9 1.6.7.2-.2.1-.8-.3-1z" fill="#FF9900"/>
                  <path d="M13.2 6.5c-1.2 0-2.3.5-3 1.4V4.5H8.4v9.6h1.8v-1.1c.7.9 1.8 1.4 3 1.4 2.4 0 4.3-1.9 4.3-4s-1.9-3.9-4.3-3.9zm-.4 6.3c-1.4 0-2.4-1.1-2.4-2.4s1-2.4 2.4-2.4 2.4 1.1 2.4 2.4-1.1 2.4-2.4 2.4z" fill="#111827"/>
                </svg>
              </div>
              <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900">Amazon</span>
            </div>

            {/* Flipkart */}
            <div className="w-24 sm:w-28 h-24 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-slate-300 flex flex-col items-center justify-center gap-2 transition-all group">
              <div className="w-8 h-8 flex items-center justify-center">
                <div className="w-7 h-7 rounded-lg bg-[#2874F0] flex items-center justify-center text-white font-extrabold text-sm shadow-xs relative overflow-hidden">
                  <span className="italic text-[#FFE500] font-black text-base">f</span>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900">Flipkart</span>
            </div>

            {/* Meesho */}
            <div className="w-24 sm:w-28 h-24 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-slate-300 flex flex-col items-center justify-center gap-2 transition-all group">
              <div className="w-8 h-8 flex items-center justify-center">
                <div className="w-7 h-7 rounded-full bg-[#570054] flex items-center justify-center text-white font-black text-xs shadow-xs">
                  <span className="text-white font-bold text-sm tracking-tight">m</span>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900">Meesho</span>
            </div>

            {/* Myntra */}
            <div className="w-24 sm:w-28 h-24 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-slate-300 flex flex-col items-center justify-center gap-2 transition-all group">
              <div className="w-8 h-8 flex items-center justify-center">
                <div className="w-7 h-7 flex items-center justify-center">
                  <span className="text-base font-black bg-gradient-to-tr from-[#FF3F6C] via-[#F16521] to-[#FF905A] text-transparent bg-clip-text">M</span>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900">Myntra</span>
            </div>

            {/* JioMart */}
            <div className="w-24 sm:w-28 h-24 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-slate-300 flex flex-col items-center justify-center gap-2 transition-all group">
              <div className="w-8 h-8 flex items-center justify-center">
                <div className="w-7 h-7 rounded-full bg-[#E21A22] flex items-center justify-center text-white shadow-xs">
                  <ShoppingBag size={14} className="text-white" />
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900">JioMart</span>
            </div>

            {/* Nykaa */}
            <div className="w-24 sm:w-28 h-24 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-slate-300 flex flex-col items-center justify-center gap-2 transition-all group">
              <div className="w-8 h-8 flex items-center justify-center">
                <div className="w-7 h-7 rounded-full bg-[#FC2779] flex items-center justify-center text-white font-black text-xs shadow-xs">
                  <span>N</span>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900">Nykaa</span>
            </div>

            {/* Snapdeal */}
            <div className="w-24 sm:w-28 h-24 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-slate-300 flex flex-col items-center justify-center gap-2 transition-all group">
              <div className="w-8 h-8 flex items-center justify-center">
                <div className="w-7 h-7 rounded-lg bg-[#E40046] flex items-center justify-center text-white shadow-xs">
                  <Package size={14} className="text-white" />
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900">Snapdeal</span>
            </div>

            {/* GlowRoad */}
            <div className="w-24 sm:w-28 h-24 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-slate-300 flex flex-col items-center justify-center gap-2 transition-all group">
              <div className="w-8 h-8 flex items-center justify-center">
                <div className="w-7 h-7 rounded-full bg-[#005B60] flex items-center justify-center text-white font-bold text-xs shadow-xs">
                  <span>g</span>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900">GlowRoad</span>
            </div>

            {/* Any Excel */}
            <div className="w-24 sm:w-28 h-24 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-slate-300 flex flex-col items-center justify-center gap-2 transition-all group">
              <div className="w-8 h-8 flex items-center justify-center">
                <div className="w-7 h-7 rounded-lg bg-[#107C41] flex items-center justify-center text-white shadow-xs font-mono font-bold text-xs">
                  <span>X</span>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900">Any Excel</span>
            </div>

            {/* TallyPrime */}
            <div className="w-24 sm:w-28 h-24 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-slate-300 flex flex-col items-center justify-center gap-2 transition-all group">
              <div className="w-8 h-8 flex items-center justify-center">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#002D62] to-[#FFC72C] flex items-center justify-center text-white font-black text-[11px] shadow-xs">
                  <span>T</span>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900">TallyPrime</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. 6 CORE MODULES (FEATURES) */}
      <section id="features" className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">Platform Capabilities</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Engineered for Fast Textile Daily Work</h3>
            <p className="text-slate-600 mt-3 text-base">
              Every feature has been meticulously crafted to save hours of manual clerical work.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 - GST Invoicing (Emerald Theme) */}
            <div className="p-7 rounded-2xl bg-gradient-to-b from-white to-emerald-50/30 border border-slate-200/90 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/10 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-5 font-bold border border-emerald-200 group-hover:scale-105 transition-transform">
                <FileText size={24} />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Smart GST Tax Invoicing</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Generate clean, professional A4 tax bills with sequential numbering (INV-0001), automatic CGST, SGST, IGST tax breakdown, HSN coding, round-offs, and printable UPI QR codes.
              </p>
            </div>

            {/* Feature 2 - Delivery Challans (Blue Theme) */}
            <div className="p-7 rounded-2xl bg-gradient-to-b from-white to-blue-50/30 border border-slate-200/90 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/10 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-5 font-bold border border-blue-200 group-hover:scale-105 transition-transform">
                <Truck size={24} />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Delivery Challans & Transport</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Issue dispatches with sequence numbers (CH-0001). Record transport name, vehicle number, weight in KG, and cartons. Convert any challan into a final GST Invoice in 1-click.
              </p>
            </div>

            {/* Feature 3 - Party Ledgers (Amber Theme) */}
            <div className="p-7 rounded-2xl bg-gradient-to-b from-white to-amber-50/30 border border-slate-200/90 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/10 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-5 font-bold border border-amber-200 group-hover:scale-105 transition-transform">
                <BookOpen size={24} />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Automated Party Ledgers</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Live running Debit (Dr) and Credit (Cr) statement for every customer and supplier. Export ledger statements to professional PDF or Excel, and share on WhatsApp in seconds.
              </p>
            </div>

            {/* Feature 4 - Karigar Upad (Purple Theme) */}
            <div className="p-7 rounded-2xl bg-gradient-to-b from-white to-purple-50/30 border border-slate-200/90 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/10 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-5 font-bold border border-purple-200 group-hover:scale-105 transition-transform">
                <Users size={24} />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Karigar Upad & Salary Payroll</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Track daily and weekly worker advances (Upad). When generating monthly wages, Texa automatically deducts the active Upad balance to eliminate wage disputes.
              </p>
            </div>

            {/* Feature 5 - Stock Inventory (Rose Theme) */}
            <div className="p-7 rounded-2xl bg-gradient-to-b from-white to-rose-50/30 border border-slate-200/90 hover:border-rose-400 hover:shadow-lg hover:shadow-rose-500/10 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mb-5 font-bold border border-rose-200 group-hover:scale-105 transition-transform">
                <Package size={24} />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Yarn & Fabric Stock Inventory</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Track meters, yarn cones, and finished sarees. Easily browse and auto-fill stock items directly into your sales invoices or delivery challans without typing.
              </p>
            </div>

            {/* Feature 6 - WhatsApp (Green Theme) */}
            <div className="p-7 rounded-2xl bg-gradient-to-b from-white to-green-50/30 border border-slate-200/90 hover:border-green-400 hover:shadow-lg hover:shadow-green-500/10 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-green-100 text-green-700 flex items-center justify-center mb-5 font-bold border border-green-200 group-hover:scale-105 transition-transform">
                <Share2 size={24} />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Instant WhatsApp Integration</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Click WhatsApp on any invoice, delivery challan, or ledger statement to launch a pre-composed direct chat with your customer along with bill amount and reference.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. WHO IS TEXA FOR? (SOLUTIONS) */}
      <section id="solutions" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">Industry Solutions</h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Tailored For Textile Businesses</h3>
          <p className="text-slate-600 mt-3 text-base">
            Whether you operate 5 looms or supply 500 shops across India, Texa scales with your business.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-gradient-to-b from-white to-indigo-50/30 border border-slate-200 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4 border border-indigo-200">
              <Factory size={24} />
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-2">Weavers & Grey Units</h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Track folding, Taka meterage, dispatch weight in KG, and karigar jobwork advances with full accountability.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-b from-white to-teal-50/30 border border-slate-200 shadow-xs hover:border-teal-400 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-4 border border-teal-200">
              <Building2 size={24} />
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-2">Wholesale Cloth Traders</h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Create GST invoices in under 30 seconds, monitor 30/60/90-day party outstanding dues, and export to Tally for your CA.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-b from-white to-rose-50/30 border border-slate-200 shadow-xs hover:border-rose-400 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mb-4 border border-rose-200">
              <ShoppingBag size={24} />
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-2">Saree & Garment Makers</h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Manage raw materials, packaging materials, jobwork processing stages, and finished garments stock.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-b from-white to-amber-50/30 border border-slate-200 shadow-xs hover:border-amber-400 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4 border border-amber-200">
              <BookOpen size={24} />
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-2">Brokers & Mill Agents</h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Maintain transparent party ledgers, dispatch records, commission tracking, and send WhatsApp reminders with zero hassle.
            </p>
          </div>
        </div>
      </section>

      {/* 7. COMPARISON TABLE - EXACTLY MATCHING USER'S IMAGE 2 */}
      <section id="comparison" className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">Direct Comparison</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Why Switch to Texa ERP?</h3>
            <p className="text-slate-600 mt-3 text-base">
              Comparing traditional pen-paper khata books and old desktop software against modern cloud ERP.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200/90 shadow-sm bg-white">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="py-4 px-6 font-bold whitespace-nowrap text-slate-800">Feature</th>
                  <th className="py-4 px-6 font-bold text-rose-600 whitespace-nowrap">Old Desktop / Paper Khata</th>
                  <th className="py-4 px-6 font-bold text-blue-600 bg-blue-50/50 whitespace-nowrap">Texa Cloud ERP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
                {/* Row 1 */}
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-slate-900 whitespace-nowrap">Challan to Invoice Conversion</td>
                  <td className="py-4 px-6 text-slate-500 whitespace-nowrap">Requires re-typing all items & meters</td>
                  <td className="py-4 px-6 font-semibold text-emerald-700 bg-blue-50/30 whitespace-nowrap flex items-center gap-2">
                    <Check size={16} className="text-emerald-600 shrink-0" />
                    <span>1-Click Instant Conversion</span>
                  </td>
                </tr>

                {/* Row 2 */}
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-slate-900 whitespace-nowrap">Party Ledger Reconciliation</td>
                  <td className="py-4 px-6 text-slate-500 whitespace-nowrap">Manual calculation, takes hours</td>
                  <td className="py-4 px-6 font-semibold text-emerald-700 bg-blue-50/30 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-emerald-600 shrink-0" />
                      <span>Live Running Balance (Dr/Cr)</span>
                    </div>
                  </td>
                </tr>

                {/* Row 3 */}
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-slate-900 whitespace-nowrap">WhatsApp Invoicing</td>
                  <td className="py-4 px-6 text-slate-500 whitespace-nowrap">Must print, scan or photocopy</td>
                  <td className="py-4 px-6 font-semibold text-emerald-700 bg-blue-50/30 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-emerald-600 shrink-0" />
                      <span>1-Click WhatsApp PDF Delivery</span>
                    </div>
                  </td>
                </tr>

                {/* Row 4 */}
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-slate-900 whitespace-nowrap">Worker Upad & Salary Sync</td>
                  <td className="py-4 px-6 text-slate-500 whitespace-nowrap">Tracked in small paper diaries with errors</td>
                  <td className="py-4 px-6 font-semibold text-emerald-700 bg-blue-50/30 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-emerald-600 shrink-0" />
                      <span>Automatic Monthly Payroll Deduction</span>
                    </div>
                  </td>
                </tr>

                {/* Row 5 */}
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-slate-900 whitespace-nowrap">Data Accessibility</td>
                  <td className="py-4 px-6 text-slate-500 whitespace-nowrap">Locked to single office PC, risk of loss</td>
                  <td className="py-4 px-6 font-semibold text-emerald-700 bg-blue-50/30 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-emerald-600 shrink-0" />
                      <span>Cloud Encrypted, Accessible Anywhere</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Migration Guarantee Callout */}
          <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/30">
                <Sparkles size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Switching from Tally, Busy, Marg, or Pen-Paper?</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Our onboarding team will help migrate your customer accounts, opening balances, and fabric catalog to Texa within 24 hours.
                </p>
              </div>
            </div>
            <Link
              href="/contact"
              className="px-5 py-2.5 rounded-lg text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm transition-all whitespace-nowrap cursor-pointer shrink-0"
            >
              Request Free Migration
            </Link>
          </div>
        </div>
      </section>

      {/* 8. FAQ SECTION */}
      <section id="faq" className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">Common Questions</h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Frequently Asked Questions</h3>
          <p className="text-slate-600 mt-2 text-sm sm:text-base">Everything you need to know about getting started with Texa.</p>
        </div>

        <div className="space-y-4">
          {[
            {
              q: "Can I use Texa for both GST and Non-GST textile transactions?",
              a: "Yes. You can generate official GST Invoices with accurate CGST/SGST/IGST tax splits, as well as regular delivery slips and non-GST delivery challans.",
            },
            {
              q: "Does Texa support textile metrics like Meters, Weight in KG, and Cartons?",
              a: "Absolutely. Texa is built for textiles. Every item row supports HSN Code, Quantity/Meters, Weight in KG, Carton counts, Unit Rate, and automatic total amount calculation.",
            },
            {
              q: "How does the Delivery Challan to Invoice conversion work?",
              a: "Whenever you dispatch goods via a Delivery Challan, you can simply click 'Convert to Bill'. Texa copies all items, weights, and customer details directly into a fresh Tax Invoice without typing a single character.",
            },
            {
              q: "Can I download and share Party Ledgers on WhatsApp?",
              a: "Yes, you can download party account statements in professional PDF or Excel format, or click the WhatsApp button to immediately send a formatted reminder with balance details.",
            },
            {
              q: "Is my business data safe?",
              a: "100%. All your customer records, bills, challans, and ledgers are securely stored on cloud databases with enterprise-grade encryption and automated backups.",
            },
          ].map((item, index) => (
            <div
              key={index}
              className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden"
            >
              <button
                type="button"
                onClick={() => toggleFaq(index)}
                className="w-full p-5 text-left font-semibold text-slate-900 flex justify-between items-center hover:bg-slate-50 transition-colors"
              >
                <span>{item.q}</span>
                <ChevronDown
                  size={18}
                  className={`text-slate-500 transition-transform duration-200 ${
                    openFaq === index ? "rotate-180 text-blue-600" : ""
                  }`}
                />
              </button>
              {openFaq === index && (
                <div className="px-5 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 9. BOTTOM CALL TO ACTION WITH MODERN HIGH CONTRAST */}
      <section className="py-20 lg:py-24 bg-gradient-to-br from-slate-950 via-indigo-950 to-blue-950 text-white text-center relative overflow-hidden border-t border-indigo-900/50">
        {/* Ambient Glows */}
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-violet-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-900/60 border border-indigo-700/60 text-indigo-300 text-xs font-semibold mb-6">
            <Sparkles size={13} className="text-amber-400" />
            <span>Fast Setup • Zero Hardware Required</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Ready to Digitise Your Textile Business?
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-xl mx-auto leading-relaxed">
            Join hundreds of textile traders, weavers, and garment manufacturers in Surat and across India using Texa ERP today.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/login"
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-extrabold text-base bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-200 text-slate-950 shadow-xl shadow-amber-500/20 hover:shadow-amber-500/30 hover:-translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Launch Live Dashboard</span>
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/contact"
              className="w-full sm:w-auto px-7 py-4 rounded-xl font-semibold text-base border border-slate-700/80 bg-white/10 hover:bg-white/15 text-white backdrop-blur-sm transition-colors flex items-center justify-center gap-2"
            >
              <span>Contact Our Team</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 10. LARGE MULTI-COLUMN FOOTER */}
      <footer className="bg-slate-900 text-slate-400 text-sm border-t border-slate-800 pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12 pb-12 border-b border-slate-800">
            {/* Col 1: Brand & Details */}
            <div className="col-span-2">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-lg">
                  T
                </div>
                <span className="text-xl font-extrabold text-white tracking-tight">Texa ERP</span>
              </Link>
              <p className="mt-4 text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
                The premier cloud-based billing, delivery challan, and party accounting software custom-designed for the Indian textile and fabric industry.
              </p>

              <div className="mt-6 space-y-2 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-blue-400 shrink-0" />
                  <span>Ring Road Textile Market, Surat, Gujarat 395002</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-blue-400 shrink-0" />
                  <span>+91 98765 43210 / Support Desk</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-blue-400 shrink-0" />
                  <span>support@texa.in</span>
                </div>
              </div>
            </div>

            {/* Col 2: Product */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Product</h5>
              <ul className="space-y-2.5 text-xs">
                <li><Link href="/auth/login" className="hover:text-white transition-colors">GST Invoicing</Link></li>
                <li><Link href="/auth/login" className="hover:text-white transition-colors">Delivery Challans</Link></li>
                <li><Link href="/auth/login" className="hover:text-white transition-colors">Party Ledger & Accounts</Link></li>
                <li><Link href="/auth/login" className="hover:text-white transition-colors">Karigar Upad Payroll</Link></li>
                <li><Link href="/auth/login" className="hover:text-white transition-colors">Yarn & Fabric Stock</Link></li>
                <li><Link href="/auth/login" className="hover:text-white transition-colors">Expense Management</Link></li>
              </ul>
            </div>

            {/* Col 3: Textile Solutions */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Solutions</h5>
              <ul className="space-y-2.5 text-xs">
                <li><a href="#solutions" className="hover:text-white transition-colors">Weaving & Grey Mills</a></li>
                <li><a href="#solutions" className="hover:text-white transition-colors">Wholesale Cloth Merchants</a></li>
                <li><a href="#solutions" className="hover:text-white transition-colors">Saree & Garment Makers</a></li>
                <li><a href="#solutions" className="hover:text-white transition-colors">Commission Brokers</a></li>
                <li><Link href="/how-it-works" className="hover:text-white transition-colors">Step-by-Step Guide</Link></li>
                <li><a href="#comparison" className="hover:text-white transition-colors">Why Switch to Texa</a></li>
              </ul>
            </div>

            {/* Col 4: Company & Support */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Company & Support</h5>
              <ul className="space-y-2.5 text-xs">
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link href="/how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
                <li><a href="#faq" className="hover:text-white transition-colors">FAQs</a></li>
                <li><Link href="/auth/login" className="hover:text-white transition-colors">Admin Login</Link></li>
                <li><span className="text-slate-500">Mon-Sat: 9 AM - 8 PM IST</span></li>
              </ul>
            </div>
          </div>

          {/* Footer Bottom Row */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div>
              © {new Date().getFullYear()} Texa ERP. All rights reserved. Built with pride for Indian Textile Businesses.
            </div>
            <div className="flex items-center gap-6">
              <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
              <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
              <span className="hover:text-slate-400 cursor-pointer">GST Compliance</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
