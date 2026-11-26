"use client";

import React from "react";
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
  Download,
  Share2,
  Check,
  Building2,
  Factory,
  ShoppingBag,
  Phone,
  Mail,
  MapPin,
  Clock,
  ChevronRight,
  ArrowDown,
  Layers,
  ArrowLeft,
} from "lucide-react";

export default function HowItWorksPage() {
  const steps = [
    {
      number: "01",
      badge: "Step 1: Setup & Onboarding",
      title: "Add Your Parties, Mills & Fabric Catalog",
      description:
        "Begin by entering your customer, supplier, or mill profiles. Include essential textile specifics such as GSTIN numbers, state codes, default payment terms (e.g., 30 or 60 days credit), and transport preferences.",
      details: [
        "Store customer GSTIN, address, and mobile number for instant WhatsApp billing.",
        "Add fabric qualities into inventory: Cotton Silk, Jacquard, Rayon, Grey with HSN codes.",
        "Set opening balances (Dr/Cr) for seamless accounting continuity without data loss.",
      ],
      mockup: {
        title: "Customer Directory & Profile View",
        subtitle: "Managing Party Master in Texa",
        content: (
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 font-sans">
              <div>
                <div className="font-bold text-slate-900 text-sm">Meet (Shiv Creation)</div>
                <div className="text-slate-500 text-[11px]">Ring Road Market, Surat, Gujarat</div>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold text-[11px]">
                Active Party
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-slate-600">
              <div>GSTIN: <span className="font-bold text-slate-900">24KKUPD1972G1ZS</span></div>
              <div>State Code: <span className="font-bold text-slate-900">24 (Gujarat)</span></div>
              <div>Payment Terms: <span className="font-bold text-slate-900">30 Days Credit</span></div>
              <div>Mobile: <span className="font-bold text-slate-900">+91 99789 87181</span></div>
            </div>
          </div>
        ),
      },
    },
    {
      number: "02",
      badge: "Step 2: Dispatch Recording",
      title: "Create Delivery Challans as Goods Leave Your Mill",
      description:
        "Whenever grey fabric, yarn, or finished goods leave your factory or shop, create a numbered Delivery Challan (CH-0001 series). Record Taka rolls, meterage, weight in KG, and vehicle specs in seconds.",
      details: [
        "Sequential auto-numbering (CH-0001, CH-0002) for structured dispatch records.",
        "Track dispatch specifics: Transport Name (e.g., Surat Roadways) & Vehicle Registration.",
        "Print a clean, clear A4 or slip Delivery Challan with terms and receiver signature box.",
      ],
      mockup: {
        title: "Delivery Challan Generator (CH-0001)",
        subtitle: "Dispatch Breakdown & Vehicle Specs",
        content: (
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center text-slate-700 pb-2 border-b border-slate-100">
              <span>Challan No: <strong className="text-blue-600">CH-0001</strong></span>
              <span>Vehicle: <strong className="text-slate-900">GJ-05-BX-1234</strong></span>
              <span>Transport: <strong className="text-slate-900 font-sans">Surat Roadways</strong></span>
            </div>
            <div className="space-y-1.5 text-slate-600">
              <div className="flex justify-between bg-slate-50 p-2 rounded">
                <span className="font-sans font-medium text-slate-800">14 Taka • Cotton Silk Fabric 60x60</span>
                <span className="font-bold text-slate-900">1,087.10 Mtrs • 142.50 KG</span>
              </div>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-slate-800 font-bold">
              <span>Gross Dispatch Value:</span>
              <span className="text-sm text-blue-600">₹1,08,710.00</span>
            </div>
          </div>
        ),
      },
    },
    {
      number: "03",
      badge: "Step 3: 1-Click Conversion",
      title: "Convert Any Challan Directly into a GST Tax Invoice",
      description:
        "No need to re-type line items, meters, rates, or transport details. With a single click, convert your Delivery Challan into a fully calculated GST Tax Invoice with automated CGST, SGST, or IGST tax logic.",
      details: [
        "1-Click Conversion pulls in all taka, meterage, weight, and party details instantly.",
        "Automatic intra-state (CGST + SGST) vs inter-state (IGST) tax calculation based on GSTIN.",
        "Generates clean PDF invoice names (e.g. Invoice-INV-0001.pdf) and dynamic UPI QR code.",
      ],
      mockup: {
        title: "GST Tax Invoice (INV-0001)",
        subtitle: "One-Click Conversion from CH-0001",
        content: (
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 font-sans">
              <span className="font-bold text-slate-900">Tax Invoice #INV-0001</span>
              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-[11px] font-semibold border border-blue-200">
                Ref Challan: CH-0001
              </span>
            </div>
            <div className="space-y-1 text-slate-600">
              <div className="flex justify-between">
                <span>Taxable Value:</span>
                <span className="font-bold text-slate-900">₹1,03,533.33</span>
              </div>
              <div className="flex justify-between">
                <span>CGST (2.5%) + SGST (2.5%):</span>
                <span className="text-slate-800">₹2,588.33 + ₹2,588.34</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-100 font-bold text-slate-900 text-sm">
                <span>Total Invoice Amount:</span>
                <span className="text-emerald-600">₹1,08,710.00</span>
              </div>
            </div>
          </div>
        ),
      },
    },
    {
      number: "04",
      badge: "Step 4: Party Ledger & Reconciliation",
      title: "Automated Running Debit / Credit Balances & WhatsApp Sharing",
      description:
        "Every invoice and payment is immediately updated in the Party Ledger. Track whether you are Dr (Receivable) or Cr (Payable), download clean statement PDFs or Excel files, and send 1-click WhatsApp reminders.",
      details: [
        "Real-time running balance ensures you always know what each client owes at any second.",
        "Click WhatsApp to launch an instant message with the exact outstanding balance and bill copy.",
        "Export professional Excel sheets (Expenses.xlsx, Ledger.xlsx) formatted for easy viewing.",
      ],
      mockup: {
        title: "Party Ledger Account Statement",
        subtitle: "Meet (Shiv Creation) • Live Running Balance",
        content: (
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-2.5 font-mono text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 font-sans">
              <span className="font-bold text-slate-900">Statement Period: All Time</span>
              <span className="text-amber-600 font-bold font-mono">Net Closing: ₹1,37,210.00 Dr</span>
            </div>
            <div className="divide-y divide-slate-100 text-[11px]">
              <div className="py-1.5 flex justify-between">
                <span>INV-0001 (Sales Invoice)</span>
                <span className="font-bold text-amber-600">₹7,481.25 (Dr)</span>
              </div>
              <div className="py-1.5 flex justify-between">
                <span>CH-0001 (Delivery Challan)</span>
                <span className="font-bold text-amber-600">₹1,08,710.00 (Dr)</span>
              </div>
              <div className="py-1.5 flex justify-between">
                <span>INV-0002 (Sales Invoice)</span>
                <span className="font-bold text-amber-600">₹21,018.75 (Dr)</span>
              </div>
            </div>
          </div>
        ),
      },
    },
    {
      number: "05",
      badge: "Step 5: Worker Upad & Payroll",
      title: "Record Worker Advances (Upad) & Auto-Deduct on Payday",
      description:
        "Textile workers and weaving karigars frequently request weekly cash advances (Upad). Texa logs every advance payment and automatically adjusts it against the worker's monthly wages to eliminate errors and arguments.",
      details: [
        "Log Upad vouchers tagged directly to employee profiles and weaving machine numbers.",
        "Automatic salary calculator deducts all monthly Upad from base salary with 100% accuracy.",
        "Generates worker salary slips for transparent factory administration.",
      ],
      mockup: {
        title: "Karigar Upad & Monthly Salary Calculation",
        subtitle: "Automated Wage Synchronization",
        content: (
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-2.5 font-mono text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 font-sans">
              <div>
                <span className="font-bold text-slate-900">Ramesh Bhai (Weaver)</span>
                <span className="text-slate-500 text-[11px] block">Loom Section #04</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold text-[11px]">
                Payroll Synchronized
              </span>
            </div>
            <div className="space-y-1 text-slate-600">
              <div className="flex justify-between">
                <span>Monthly Base Salary:</span>
                <span className="font-bold text-slate-900">₹18,000.00</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>Active Upad Deduction:</span>
                <span className="font-bold">-₹4,500.00</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-100 font-bold text-slate-900 text-sm">
                <span>Net Salary Payable:</span>
                <span className="text-emerald-600">₹13,500.00</span>
              </div>
            </div>
          </div>
        ),
      },
    },
  ];

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
            <Link href="/how-it-works" className="text-blue-600 font-bold transition-colors">How It Works</Link>
            <Link href="/contact" className="hover:text-blue-600 transition-colors">Contact</Link>
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

      {/* HERO BANNER */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-white via-slate-50 to-[#f8fafc] border-b border-slate-200 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-6">
            <Sparkles size={14} className="text-blue-600" />
            <span>Complete Textile Workflow Guide</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            How Texa ERP Works
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            A comprehensive, step-by-step walkthrough of how fabric goods are dispatched, billed, and reconciled in Texa from factory floor to bank settlement.
          </p>

          <div className="mt-8 flex items-center justify-center gap-4 text-xs font-semibold text-slate-500">
            <span>5 Intuitive Steps</span>
            <span>•</span>
            <span>Zero Complex Setup</span>
            <span>•</span>
            <span>Designed for Textile Traders</span>
          </div>
        </div>
      </section>

      {/* DETAILED STEPS WALKTHROUGH */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center ${
              index % 2 === 1 ? "lg:flex-row-reverse" : ""
            }`}
          >
            {/* Step Explanation Text */}
            <div className={`lg:col-span-6 space-y-4 ${index % 2 === 1 ? "lg:order-2" : "lg:order-1"}`}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-100/70 text-blue-700 text-xs font-bold uppercase tracking-wider">
                {step.badge}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-3xl sm:text-4xl font-black font-mono text-blue-600/30">
                  {step.number}
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                  {step.title}
                </h2>
              </div>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                {step.description}
              </p>

              <div className="space-y-2.5 pt-2">
                {step.details.map((detail, dIdx) => (
                  <div key={dIdx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-700 font-medium">
                    <div className="mt-0.5 p-1 rounded-full bg-emerald-100 text-emerald-700 shrink-0">
                      <Check size={12} />
                    </div>
                    <span>{detail}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Step Realistic Mockup Display */}
            <div className={`lg:col-span-6 ${index % 2 === 1 ? "lg:order-1" : "lg:order-2"}`}>
              <div className="rounded-2xl border border-slate-300 bg-slate-50 p-4 sm:p-6 shadow-xl space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      {step.mockup.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {step.mockup.subtitle}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 uppercase">
                    Screen Preview
                  </span>
                </div>

                {step.mockup.content}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* CTA SECTION */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Experience This Seamless Workflow?
          </h2>
          <p className="mt-4 text-base text-blue-100 max-w-xl mx-auto">
            Sign in to start creating your first delivery challans, bills, and party ledgers right now.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/auth/login"
              className="px-8 py-3.5 rounded-xl font-bold text-base bg-white text-blue-700 hover:bg-blue-50 shadow-lg transition-all"
            >
              Launch Live Dashboard
            </Link>
            <Link
              href="/contact"
              className="px-7 py-3.5 rounded-xl font-semibold text-base border border-blue-300 bg-blue-700/50 hover:bg-blue-700 text-white transition-colors"
            >
              Contact Team
            </Link>
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
                Built specifically for Indian textile manufacturers, cloth traders, and weavers to modernize daily billing and party reconciliation.
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
