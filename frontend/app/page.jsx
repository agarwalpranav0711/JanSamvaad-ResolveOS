'use client';

import { useState } from 'react';
import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const processSteps = [
    { number: '01', icon: '📞', title: 'Call', description: 'Dial our toll-free number. Available 24×7 in Hindi & English.' },
    { number: '02', icon: '🤖', title: 'AI Classifies', description: 'Gemini AI understands your complaint, extracts location and urgency instantly.' },
    { number: '03', icon: '✅', title: 'Tracked', description: 'Get your ticket ID via SMS callback. Track resolution in real time.' }
  ];
  const features = [
    { icon: '🎙️', title: 'Voice-First', description: 'No app, no internet needed. Just call.' },
    { icon: '🧠', title: 'Gemini AI', description: 'Automatic category, ward, and urgency detection.' },
    { icon: '📍', title: 'Ward Routing', description: 'Complaints routed to the right municipal team instantly.' },
    { icon: '📊', title: 'Live Dashboard', description: 'Operators track, prioritize, and resolve in real time.' },
    { icon: '🔔', title: 'SMS Callback', description: 'Citizens receive ticket ID and updates via SMS.' },
    { icon: '🌐', title: 'Bilingual', description: 'Full support for Hindi and English, with more coming.' }
  ];
  const liveTickerItems = [
    '🟢 LIVE SYSTEM',
    '156 Active Tickets',
    '87.3% Resolution Rate',
    'Ward 12 — 3 Open Issues',
    'Last ticket: 4 min ago',
    'Powered by Gemini AI'
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A1628] px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <BrandLogo size="md" showText={true} textColor="text-white" />
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="sm:hidden h-10 w-10 rounded-lg border border-white/20 text-white"
            aria-label="Toggle navigation menu"
          >
            ☰
          </button>
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/track"
              className="px-4 py-2 h-10 rounded-lg border border-white/20 text-white font-semibold text-xs hover:bg-white/5 transition-all"
            >
              🔍 Track Your Complaint
            </Link>
            <Link
              href="/public"
              className="px-4 py-2 h-10 rounded-lg border border-white/20 text-white font-semibold text-xs hover:bg-white/5 transition-all"
            >
              📊 Public Data
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 h-10 rounded-lg border border-white/20 text-white font-semibold text-xs hover:bg-white/5 transition-all"
            >
              👤 Operator Login
            </Link>
          </div>
        </div>
        {menuOpen && (
          <div className="sm:hidden mt-3 space-y-2">
            <Link href="/track" onClick={() => setMenuOpen(false)} className="block w-full px-4 py-3 rounded-lg border border-white/20 text-white text-sm">
              🔍 Track Your Complaint
            </Link>
            <Link href="/public" onClick={() => setMenuOpen(false)} className="block w-full px-4 py-3 rounded-lg border border-white/20 text-white text-sm">
              📊 Public Data
            </Link>
            <Link href="/login" onClick={() => setMenuOpen(false)} className="block w-full px-4 py-3 rounded-lg border border-white/20 text-white text-sm">
              👤 Operator Login
            </Link>
          </div>
        )}
      </nav>
      <main className="pt-24">
        <section className="relative min-h-[100svh] overflow-hidden px-6 py-16">
          <div className="hero-glow hero-glow-orange" />
          <div className="hero-glow hero-glow-blue" />
          <div className="relative z-10 mx-auto flex min-h-[calc(100svh-6rem)] w-full max-w-6xl flex-col items-center justify-center text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-[#94A3B8] backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-[#F97316]" />
              LIVE — Serving 20 Wards · New Delhi
            </div>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
              <span lang="hi" className="block text-[#F97316]">नागरिक शिकायत निवारण प्रणाली</span>
            </h1>
            <p className="mt-3 text-xl font-light text-white sm:text-2xl">
              Citizen Grievance Redressal System
            </p>
            <p className="mt-6 max-w-xl text-sm leading-relaxed text-[#94A3B8] sm:text-base">
              Register your municipal complaint with a single phone call. AI-powered classification. Available 24×7 in Hindi and English.
            </p>
            <a
              href="tel:+15706308042"
              className="mt-10 inline-flex items-center gap-3 rounded-full bg-[#F97316] px-8 py-4 text-base font-semibold text-white shadow-lg shadow-[#F97316]/25 transition hover:bg-[#ea6b12]"
              aria-label="Register grievance by calling toll-free number"
            >
              <span className="phone-pulse">📞</span>
              Register Grievance — Call Now
            </a>
            <p className="mt-4 text-xs text-[#94A3B8]">Toll-free: +1 570 630 8042</p>
            <div className="mt-14 w-full rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-xl border border-white/10 bg-[#0f162d]/80 p-3 text-left">
                  <p className="text-lg">✅</p>
                  <p className="mt-2 text-2xl font-bold text-[#F97316]">2,400+</p>
                  <p className="text-xs text-[#94A3B8]">Complaints Resolved</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#0f162d]/80 p-3 text-left">
                  <p className="text-lg">🧠</p>
                  <p className="mt-2 text-2xl font-bold text-[#F97316]">98%</p>
                  <p className="text-xs text-[#94A3B8]">AI Accuracy</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#0f162d]/80 p-3 text-left">
                  <p className="text-lg">⚡</p>
                  <p className="mt-2 text-2xl font-bold text-[#F97316]">&lt; 2 min</p>
                  <p className="text-xs text-[#94A3B8]">Registration</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#0f162d]/80 p-3 text-left">
                  <p className="text-lg">📍</p>
                  <p className="mt-2 text-2xl font-bold text-[#F97316]">20</p>
                  <p className="text-xs text-[#94A3B8]">Wards Covered</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="px-6 py-20">
          <div className="mx-auto w-full max-w-6xl">
            <p className="text-xs uppercase tracking-[0.25em] text-[#F97316]">The Process</p>
            <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">File a complaint in under 2 minutes</h2>
            <div className="relative mt-10">
              <div className="process-line hidden md:block" />
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                {processSteps.map((step) => (
                  <div key={step.number} className="relative rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
                    <span className="absolute left-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#F97316] text-xs font-bold text-white">
                      {step.number}
                    </span>
                    <p className="mt-8 text-3xl">{step.icon}</p>
                    <h3 className="mt-4 text-xl font-semibold text-white">{step.title}</h3>
                    <p className="mt-2 text-sm text-[#94A3B8]">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section className="px-6 pb-20">
          <div className="mx-auto w-full max-w-6xl">
            <p className="text-xs uppercase tracking-[0.25em] text-[#F97316]">Capabilities</p>
            <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Built for scale. Designed for citizens.</h2>
            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition duration-200 hover:-translate-y-1 hover:border-[#F97316]"
                >
                  <p className="text-3xl text-[#F97316]">{feature.icon}</p>
                  <h3 className="mt-4 text-xl font-semibold text-white">{feature.title}</h3>
                  <p className="mt-2 text-sm text-[#94A3B8]">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="overflow-hidden border-y border-white/10 bg-[#090d18] py-4">
          <div className="live-track flex items-center gap-4 whitespace-nowrap">
            {[...liveTickerItems, ...liveTickerItems, ...liveTickerItems].map((item, index) => (
              <div key={`${item}-${index}`} className="inline-flex items-center gap-4">
                <span className="text-sm text-[#e2e8f0]">{item}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-[#F97316]" />
              </div>
            ))}
          </div>
        </section>
        <section className="px-6 py-20">
          <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-[#F97316]/60 bg-[#0f162d] p-8">
              <p className="text-sm font-semibold text-[#F97316]">For citizens</p>
              <h3 className="mt-2 text-2xl font-bold text-white">Register a Complaint</h3>
              <p className="mt-3 text-sm text-[#94A3B8]">
                Call toll-free, describe your issue in Hindi or English.
              </p>
              <a
                href="tel:+15706308042"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#F97316] px-6 py-3 text-sm font-semibold text-white hover:bg-[#ea6b12]"
              >
                📞 Call Now — +1 570 630 8042
              </a>
            </div>
            <div className="rounded-2xl border border-[#3B82F6]/60 bg-[#0f162d] p-8">
              <p className="text-sm font-semibold text-[#3B82F6]">For municipal staff</p>
              <h3 className="mt-2 text-2xl font-bold text-white">Operator Portal</h3>
              <p className="mt-3 text-sm text-[#94A3B8]">
                Login to manage tickets, view analytics, and resolve issues.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#3B82F6] px-6 py-3 text-sm font-semibold text-white hover:bg-[#2f74e3]"
              >
                → Operator Login
              </Link>
            </div>
          </div>
        </section>
        <footer className="border-t border-white/10 px-6 py-8">
          <div className="mx-auto w-full max-w-6xl">
            <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
              <BrandLogo size="md" showText={true} textColor="text-white" />
              <p className="text-center text-sm text-[#94A3B8]">
                Built for India Innovates 2026 · FiSTA · Bharat Mandapam
              </p>
              <div className="flex items-center gap-4 text-sm text-[#94A3B8]">
                <Link href="/track" className="hover:text-white">Track Complaint</Link>
                <Link href="/public" className="hover:text-white">Public Data</Link>
              </div>
            </div>
            <p className="mt-6 text-center text-xs text-[#94A3B8]/80">
              Powered by Gemini AI · Twilio · Google Cloud
            </p>
          </div>
        </footer>
      </main>
      <style jsx global>{`
        .hero-glow {
          position: absolute;
          border-radius: 9999px;
          filter: blur(60px);
          animation: heroPulse 8s ease-in-out infinite;
        }
        .hero-glow-orange {
          width: 30rem;
          height: 30rem;
          left: 10%;
          top: 20%;
          background: radial-gradient(circle, rgba(249, 115, 22, 0.4) 0%, rgba(249, 115, 22, 0) 70%);
        }
        .hero-glow-blue {
          width: 26rem;
          height: 26rem;
          right: 10%;
          bottom: 15%;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.45) 0%, rgba(59, 130, 246, 0) 72%);
          animation-delay: 1.2s;
        }
        .phone-pulse {
          animation: phonePulse 1.8s ease-in-out infinite;
        }
        .process-line {
          position: absolute;
          top: 50%;
          left: 18%;
          right: 18%;
          transform: translateY(-50%);
          border-top: 2px dashed rgba(249, 115, 22, 0.5);
          animation: dashSlide 12s linear infinite;
          background-size: 28px 2px;
          background-image: repeating-linear-gradient(
            90deg,
            rgba(249, 115, 22, 0.9) 0,
            rgba(249, 115, 22, 0.9) 10px,
            rgba(249, 115, 22, 0.2) 10px,
            rgba(249, 115, 22, 0.2) 20px
          );
        }
        .live-track {
          animation: liveTicker 42s linear infinite;
        }
        @keyframes heroPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        @keyframes phonePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.12); }
        }
        @keyframes dashSlide {
          0% { background-position-x: 0; }
          100% { background-position-x: -400px; }
        }
        @keyframes liveTicker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
      `}</style>
    </div>
  );
}
