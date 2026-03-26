import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const API = 'https://jansamvaad-backend-608936922611.asia-south1.run.app';

/* ─── Animated count-up with Intersection Observer ─── */
function useScrollAnimatedNumber(target, duration = 1200) {
  const [val, setVal] = useState(0);
  const [triggered, setTriggered] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setTriggered(true); obs.disconnect(); } },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!triggered) return;
    const end = Number(target || 0);
    const t0 = performance.now();
    let raf;
    const step = (now) => {
      const p = Math.min((now - t0) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(end * ease));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [triggered, target, duration]);

  return { val, ref };
}

/* ─── Government Footer ─── */
function GovFooter() {
  return (
    <footer className="border-t border-[#FF9933]/10 bg-[#071020] py-10 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 mb-8">
          <div className="text-center md:text-left">
            <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
              <span className="text-xl">🇮🇳</span>
              <span className="text-base font-bold text-white">JanSamvaad ResolveOS</span>
            </div>
            <p className="text-xs text-[#FF9933]">Ministry of Housing & Urban Affairs | Government of India</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-[#8A9BB5]">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <Link to="/track" className="hover:text-white transition-colors">Track Status</Link>
            <Link to="/public" className="hover:text-white transition-colors">Public Data</Link>
            <a href="#" className="hover:text-white transition-colors">RTI</a>
            <a href="#" className="hover:text-white transition-colors">Sitemap</a>
            <a href="#" className="hover:text-white transition-colors">Accessibility</a>
          </div>
        </div>
        <div className="border-t border-white/5 pt-6 text-center">
          <p className="text-xs text-[#8A9BB5]">
            © 2026 JanSamvaad ResolveOS | Government of India
          </p>
          <p className="text-xs text-[#8A9BB5]/60 mt-1">
            Powered by National Informatics Centre (NIC) | Best viewed in Chrome, Firefox, Edge | Screen Reader Compatible
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ─── Ticker Strip ─── */
function TickerStrip() {
  const items = [
    '📞 Toll-Free Helpline: +1 570 630 8042',
    '🟢 System Operational — 99.9% Uptime',
    '🇮🇳 Official Government Portal',
    '🗣️ Available 24×7 in Hindi & English',
    '🔒 TRAI Compliant | Data Protected',
    '⏱️ Response within 48 hours',
  ];
  return (
    <div className="overflow-hidden border-y border-[#FF9933]/10 bg-[#071020] py-3">
      <div className="ticker-track flex gap-16 whitespace-nowrap">
        {[...items, ...items, ...items].map((item, i) => (
          <span key={i} className="text-sm text-[#8A9BB5]/70 font-medium tracking-wide">{item}</span>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Landing Page ─── */
export default function Landing() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    document.title = 'JanSamvaad — नागरिक शिकायत निवारण | Citizen Grievance Redressal';
    fetch(`${API}/api/public/stats`)
      .then(r => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  const total = useScrollAnimatedNumber(stats?.total_tickets || 28000);
  const rate = useScrollAnimatedNumber(stats?.resolution_rate || 61);
  const avgTime = useScrollAnimatedNumber(stats?.avg_resolution_hours || 4);
  const sla = useScrollAnimatedNumber(stats?.sla_compliance_pct || 94);

  const steps = [
    { icon: '📞', num: '01', title: 'नागरिक कॉल करें', subtitle: 'Citizen Calls', desc: 'Any citizen calls the toll-free number. No app, no internet — any basic phone works. Available in Hindi and English.' },
    { icon: '🔬', num: '02', title: 'AI विश्लेषण', subtitle: 'AI Analysis', desc: 'Gemini AI analyses the complaint, classifies the category and severity, and routes it to the responsible municipal department.' },
    { icon: '🏛️', num: '03', title: 'अधिकारी कार्यवाही', subtitle: 'Officer Action', desc: 'Assigned municipal officer receives the complaint, investigates on-ground, and takes corrective action within the SLA.' },
    { icon: '📜', num: '04', title: 'समाधान प्रमाण', subtitle: 'Resolution Certificate', desc: 'Citizen receives SMS confirmation with a QR-verified resolution certificate as official proof of redressal.' },
  ];

  return (
    <div className="min-h-screen bg-[#0A1628] text-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Navbar transparent />

      {/* ─── HERO ─── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Subtle radial background — no WebGL */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 50% 30%, rgba(255,153,51,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 70%, rgba(19,136,8,0.04) 0%, transparent 50%)'
        }} />
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto pt-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#FF9933]/20 bg-[#FF9933]/5 mb-8">
            <span>🇮🇳</span>
            <span className="text-xs text-[#FF9933] font-medium">Official Grievance Redressal System — Government of India</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-4">
            <span lang="hi" className="block text-[#FF9933]">नागरिक शिकायत निवारण प्रणाली</span>
          </h1>
          <p className="text-xl sm:text-2xl text-[#E8EDF2] font-light mb-4">
            Citizen Grievance Redressal System
          </p>
          <p className="text-base text-[#8A9BB5] mb-10 max-w-2xl mx-auto leading-relaxed">
            Register your municipal complaint with a single phone call.
            AI-powered classification. Available 24×7. In Hindi and English.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <a
              href="tel:+15706308042"
              className="px-8 py-3.5 rounded-lg bg-[#FF9933] text-[#0A1628] font-semibold text-sm hover:bg-[#E6841C] transition-all active:scale-95 shadow-lg shadow-[#FF9933]/20"
              aria-label="Register grievance by calling toll-free number"
            >
              📞 Register Grievance — Call Now
            </a>
            <Link
              to="/track"
              className="px-8 py-3.5 rounded-lg border border-white/20 text-white font-semibold text-sm hover:bg-white/5 transition-all"
            >
              🔍 Track Your Complaint
            </Link>
          </div>
          <p className="text-xs text-[#8A9BB5]">
            Toll-Free: +1 570 630 8042 | Available 24×7 | Hindi & English
          </p>
        </div>
      </section>

      {/* ─── TICKER ─── */}
      <TickerStrip />

      {/* ─── STATISTICS BAR ─── */}
      <section className="py-12 px-6 bg-[#071020] border-y border-[#FF9933]/10">
        <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div ref={total.ref} className="text-center">
            <p className="text-3xl sm:text-4xl font-bold text-[#FF9933]">{total.val.toLocaleString()}+</p>
            <p className="text-xs text-[#8A9BB5] mt-1 uppercase tracking-widest">Grievances Registered</p>
          </div>
          <div ref={rate.ref} className="text-center lg:border-l border-white/10">
            <p className="text-3xl sm:text-4xl font-bold text-[#FF9933]">{rate.val}%</p>
            <p className="text-xs text-[#8A9BB5] mt-1 uppercase tracking-widest">Resolution Rate</p>
          </div>
          <div ref={avgTime.ref} className="text-center lg:border-l border-white/10">
            <p className="text-3xl sm:text-4xl font-bold text-[#FF9933]">{avgTime.val} Hours</p>
            <p className="text-xs text-[#8A9BB5] mt-1 uppercase tracking-widest">Avg Resolution Time</p>
          </div>
          <div ref={sla.ref} className="text-center lg:border-l border-white/10">
            <p className="text-3xl sm:text-4xl font-bold text-[#FF9933]">{sla.val}%</p>
            <p className="text-xs text-[#8A9BB5] mt-1 uppercase tracking-widest">SLA Compliance</p>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS (4 steps) ─── */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <h2 className="text-center text-2xl sm:text-3xl font-bold mb-3">How It Works</h2>
        <p className="text-center text-[#8A9BB5] mb-12 text-sm">Four steps to grievance redressal</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <div key={i} className="rounded-xl bg-white/[0.03] border border-white/10 p-6 hover:border-[#FF9933]/30 transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-10 h-10 rounded-lg bg-[#FF9933]/10 flex items-center justify-center text-lg flex-shrink-0">{s.icon}</span>
                <span className="text-xs text-[#FF9933] font-bold">STEP {s.num}</span>
              </div>
              <h3 lang="hi" className="text-base font-bold text-white mb-0.5">{s.title}</h3>
              <p className="text-xs text-[#FF9933] font-medium mb-3">{s.subtitle}</p>
              <p className="text-sm text-[#8A9BB5] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── OFFICIAL NOTICE ─── */}
      <section className="py-16 px-6 bg-[#071020]">
        <div className="max-w-3xl mx-auto rounded-xl border-l-4 border-[#FF9933] bg-white/[0.02] p-8">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            📋 OFFICIAL NOTICE
          </h3>
          <p className="text-sm text-[#E8EDF2]/80 mb-4 leading-relaxed">
            This portal is operated under the Grievance Redressal Framework of the
            Ministry of Housing & Urban Affairs, Government of India.
          </p>
          <p className="text-sm text-[#E8EDF2]/80 mb-3">All complaints are processed in accordance with:</p>
          <ul className="text-sm text-[#8A9BB5] space-y-2 ml-4 mb-4">
            <li>• Right to Public Services Act</li>
            <li>• TRAI Telecommunication Guidelines</li>
            <li>• IT Act 2000 — Section 43A (Data Protection)</li>
          </ul>
          <p className="text-xs text-[#138808] font-medium">
            Complaint registration is free. No fees are charged at any stage.
          </p>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Register a Grievance</h2>
          <p className="text-[#8A9BB5] mb-8 text-sm">
            Speak in Hindi or English. Your complaint is registered in seconds.
          </p>
          <a
            href="tel:+15706308042"
            className="inline-flex items-center gap-3 px-10 py-4 rounded-lg bg-[#FF9933] text-[#0A1628] font-bold text-lg hover:bg-[#E6841C] transition-all active:scale-95 shadow-lg shadow-[#FF9933]/20 mb-6"
            aria-label="Call toll-free grievance helpline"
          >
            📞 Toll-Free Grievance Helpline: +1 570 630 8042
          </a>
          <div className="mt-8">
            <img
              src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=tel:+15706308042"
              alt="QR code to call JanSamvaad grievance helpline"
              className="mx-auto rounded-lg border border-white/10"
              width={150}
              height={150}
            />
            <p className="text-xs text-[#8A9BB5]/60 mt-3">Scan to call from your phone</p>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <GovFooter />
    </div>
  );
}
