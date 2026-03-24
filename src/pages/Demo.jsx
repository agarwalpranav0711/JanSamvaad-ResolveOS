import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';

const API = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export default function Demo() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetch(`${API}/api/public/stats`).then(r => r.json()).then(d => setCount(d.total || 0)).catch(() => {});
    const t = setInterval(() => setCount(c => c + Math.floor(Math.random() * 2)), 30000);
    return () => clearInterval(t);
  }, []);

  const steps = [
    { num: '01', title: 'Open Phone Dialer', desc: 'Use any phone — smartphone, feature phone, or landline. No app needed.', icon: '📱' },
    { num: '02', title: 'Call the Number', desc: 'Dial +1 (570) 630-8042. You\'ll hear a greeting in Hindi & English.', icon: '📞' },
    { num: '03', title: 'Speak Your Complaint', desc: 'Describe your civic issue in your own words — any Indian language.', icon: '🗣️' },
    { num: '04', title: 'AI Processes It', desc: 'Gemini AI classifies, assigns severity, routes to the correct department.', icon: '🤖' },
    { num: '05', title: 'Track Resolution', desc: 'Get a reference number. Track status on /track or call back anytime.', icon: '✅' },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#0A1628', fontFamily: "'Inter', sans-serif" }}>
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <span className="px-4 py-1.5 rounded-full bg-[#FF9933]/10 border border-[#FF9933]/20 text-[#FF9933] text-xs font-semibold uppercase tracking-widest">Live Demo</span>
          <h1 className="text-4xl md:text-5xl font-bold text-[white] mt-6">Try It Right Now</h1>
          <p className="text-lg text-[#8A9BB5]/60 mt-4 max-w-2xl mx-auto">Experience JanSamvaad ResolveOS live. Call the number, speak your complaint, and watch it appear on the dashboard in real time.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left: Instructions */}
          <div className="space-y-6">
            {steps.map(s => (
              <div key={s.num} className="flex gap-4 group">
                <div className="w-12 h-12 rounded-2xl bg-[#FF9933]/10 border border-[#FF9933]/20 flex items-center justify-center text-xl flex-shrink-0 group-hover:bg-[#FF9933]/20 transition-all">
                  {s.icon}
                </div>
                <div>
                  <p className="text-xs text-[#FF9933] font-bold mb-1">STEP {s.num}</p>
                  <h3 className="text-lg font-bold text-[white]">{s.title}</h3>
                  <p className="text-sm text-[#8A9BB5]/50 mt-1">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Call CTA */}
          <div className="rounded-3xl border border-[#FF9933]/20 bg-[#112240] p-8 text-center">
            <p className="text-xs uppercase tracking-widest text-[#FF9933] mb-4">Call This Number</p>
            <p className="text-4xl font-bold text-[white] font-mono">+1 (570) 630-8042</p>
            <div className="mt-6">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=tel:+15706308042" alt="Call QR" className="mx-auto rounded-xl border border-white/10" width={180} height={180} />
              <p className="text-xs text-[#8A9BB5]/40 mt-3">Scan to call</p>
            </div>
            <div className="mt-8 p-4 rounded-2xl bg-[#FF9933]/5 border border-[#FF9933]/10">
              <p className="text-xs text-[#8A9BB5]/50">Complaints processed</p>
              <p className="text-3xl font-bold text-[#FF9933]">{count.toLocaleString()}</p>
            </div>
            <a href="/dashboard" className="mt-6 inline-block px-8 py-3 rounded-xl bg-[#FF9933] text-black font-bold text-sm hover:bg-[#E6841C] transition-all">
              Open Live Dashboard →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
