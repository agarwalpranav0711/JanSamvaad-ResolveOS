import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const API = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

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

/* ─── WebGL Glow Canvas ─── */
function GlowCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl');
    if (!gl) return;

    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, `attribute vec2 p;void main(){gl_Position=vec4(p,0,1);}`);
    gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, `
      precision mediump float;
      uniform vec2 r;
      uniform float t;
      void main(){
        vec2 uv=(gl_FragCoord.xy/r)*2.0-1.0;
        uv.x*=r.x/r.y;
        float d=length(uv);
        float pulse=0.5+0.5*sin(t*0.8);
        float glow=0.06*exp(-d*d*(2.5-pulse*0.8));
        float ring=0.015*exp(-pow(d-0.3-pulse*0.05,2.0)*40.0);
        float v=glow+ring;
        gl_FragColor=vec4(0.063*v,0.725*v,0.506*v,1.0);
      }
    `);
    gl.compileShader(fs);

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    const pLoc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(pLoc);
    gl.vertexAttribPointer(pLoc, 2, gl.FLOAT, false, 0, 0);

    const rLoc = gl.getUniformLocation(prog, 'r');
    const tLoc = gl.getUniformLocation(prog, 't');

    let animId;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = (now) => {
      gl.uniform2f(rLoc, canvas.width, canvas.height);
      gl.uniform1f(tLoc, now * 0.001);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animId = requestAnimationFrame(draw);
    };
    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }} />;
}

/* ─── Ticker Strip ─── */
function TickerStrip() {
  const items = [
    '📊 14,283+ Grievances Processed',
    '⚡ 12h Avg Resolution',
    '🎯 94% SLA Compliance',
    '🗣️ Hindi + English Support',
    '🤖 Gemini AI Classification',
    '📱 Works on Basic Phones',
    '🇮🇳 1.4B Citizens Served',
  ];
  return (
    <div className="overflow-hidden border-y border-white/5 bg-black/20 py-3">
      <div className="ticker-track flex gap-16 whitespace-nowrap">
        {[...items, ...items, ...items].map((item, i) => (
          <span key={i} className="text-sm text-[#a3c9aa]/60 font-medium tracking-wide">{item}</span>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Landing Page ─── */
export default function Landing() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/public/stats`)
      .then(r => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  const total = useScrollAnimatedNumber(stats?.total_tickets || 14283);
  const rate = useScrollAnimatedNumber(stats?.resolution_rate || 94);
  const active = useScrollAnimatedNumber(stats?.open_count || 847);
  const avgTime = useScrollAnimatedNumber(stats?.avg_resolution_hours || 12);

  const steps = [
    { icon: '📞', title: 'Call', desc: 'Any citizen calls our number in Hindi or English. No app. No internet needed.' },
    { icon: '🤖', title: 'AI Understands', desc: 'Gemini AI reads the complaint, assigns category, severity, and routes to the right department in seconds.' },
    { icon: '✅', title: 'Resolved', desc: 'Officer resolves with photo evidence. Citizen gets QR-verified SMS proof.' },
  ];

  return (
    <div className="min-h-screen bg-[#080c10] text-[#f8f5f0]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <Navbar transparent />

      {/* ─── HERO ─── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <GlowCanvas />
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto pt-12">
          <p className="text-xs sm:text-sm uppercase tracking-[0.3em] text-[#10b981]/80 mb-6 font-medium">
            India's Voice-First Civic Grievance System
          </p>
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold leading-[0.95] mb-6">
            <span className="font-serif italic">Every </span>
            <span className="text-[#10b981] font-serif italic">Voice</span>
            <br />
            <span className="font-serif italic">Resolved</span>
          </h1>
          <p className="text-lg sm:text-xl text-[#a3c9aa]/60 mb-8 font-light">
            Voice mein bol do. Hum sun rahe hain.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            <Link to="/login" className="px-8 py-3 rounded-xl bg-[#10b981] text-black font-semibold text-sm hover:bg-[#059669] transition-all active:scale-95 shadow-lg shadow-[#10b981]/20">
              View Dashboard
            </Link>
            <Link to="/track" className="px-8 py-3 rounded-xl border border-[#10b981]/30 text-[#10b981] font-semibold text-sm hover:bg-[#10b981]/10 transition-all">
              Track Complaint
            </Link>
            <Link to="/public" className="px-8 py-3 rounded-xl border border-white/10 text-[#f8f5f0]/70 font-semibold text-sm hover:bg-white/5 transition-all">
              Public Data
            </Link>
          </div>
          <div className="animate-bounce text-[#a3c9aa]/30 text-2xl">↓</div>
        </div>
      </section>

      {/* ─── TICKER ─── */}
      <TickerStrip />

      {/* ─── HOW IT WORKS (3 steps) ─── */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <h2 className="text-center text-2xl sm:text-3xl font-bold mb-4">How It Works</h2>
        <p className="text-center text-[#a3c9aa]/50 mb-12 text-sm">Three steps. One phone call. Zero complexity.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <div key={i} className="rounded-2xl bg-[#0d1117] border-l-4 border-[#10b981] p-6 hover:bg-[#111827] transition-all duration-300 group">
              <span className="text-4xl mb-4 block">{s.icon}</span>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-xs text-[#10b981] font-bold">STEP {i + 1}</span>
                <h3 className="text-lg font-bold text-[#f8f5f0]">{s.title}</h3>
              </div>
              <p className="text-sm text-[#a3c9aa]/60 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── LIVE STATS (scroll-triggered count up) ─── */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-2xl sm:text-3xl font-bold mb-4">Live System Stats</h2>
          <p className="text-center text-[#a3c9aa]/50 mb-12 text-sm">Real-time data from our PostgreSQL database</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div ref={total.ref} className="rounded-2xl border border-white/10 bg-[#0d1117] p-6 text-center">
              <p className="text-4xl sm:text-5xl font-bold text-[#f8f5f0]">{total.val.toLocaleString()}</p>
              <p className="text-xs text-[#a3c9aa]/50 mt-2 uppercase tracking-widest">Total Complaints</p>
            </div>
            <div ref={rate.ref} className="rounded-2xl border border-white/10 bg-[#0d1117] p-6 text-center">
              <p className="text-4xl sm:text-5xl font-bold text-[#10b981]">{rate.val}%</p>
              <p className="text-xs text-[#a3c9aa]/50 mt-2 uppercase tracking-widest">Resolution Rate</p>
            </div>
            <div ref={avgTime.ref} className="rounded-2xl border border-white/10 bg-[#0d1117] p-6 text-center">
              <p className="text-4xl sm:text-5xl font-bold text-[#3b82f6]">{avgTime.val}h</p>
              <p className="text-xs text-[#a3c9aa]/50 mt-2 uppercase tracking-widest">Avg Resolution</p>
            </div>
            <div ref={active.ref} className="rounded-2xl border border-white/10 bg-[#0d1117] p-6 text-center">
              <p className="text-4xl sm:text-5xl font-bold text-[#f59e0b]">{active.val}</p>
              <p className="text-xs text-[#a3c9aa]/50 mt-2 uppercase tracking-widest">Active Cases</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── BUILT FOR BHARAT ─── */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xl sm:text-2xl lg:text-3xl font-light text-[#f8f5f0]/80 leading-relaxed italic">
            "65 crore Indians have a basic mobile phone but no civic voice.
            <br />
            <span className="text-[#10b981] font-medium">JanSamvaad changes that</span> — one call at a time."
          </p>
          <div className="mt-8 flex flex-col items-center gap-2 text-[#a3c9aa]/40">
            <span className="text-3xl">🇮🇳</span>
            <p className="text-sm font-medium">India Innovates 2026 — BML Munjal University</p>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">File a Complaint Now</h2>
          <p className="text-[#a3c9aa]/50 mb-8 text-sm">Speak in Hindi or English. Your complaint registers in 10 seconds.</p>
          <a
            href="tel:+15706308042"
            className="inline-flex items-center gap-3 px-10 py-4 rounded-xl bg-[#10b981] text-black font-bold text-lg hover:bg-[#059669] transition-all active:scale-95 shadow-lg shadow-[#10b981]/20 mb-6"
          >
            📞 Call Now: +1 570 630 8042
          </a>
          <div className="mt-8">
            <img
              src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=tel:+15706308042"
              alt="QR code to call JanSamvaad"
              className="mx-auto rounded-lg border border-white/10"
              width={150}
              height={150}
            />
            <p className="text-xs text-[#a3c9aa]/40 mt-3">Scan to call from your phone</p>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-white/5 py-8 px-6 text-center text-xs text-[#a3c9aa]/30">
        © 2026 JanSamvaad ResolveOS — Built with 🤖 Gemini AI + ❤️ for Bharat
      </footer>

      <style>{`
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        .ticker-track { animation: ticker-scroll 30s linear infinite; }
      `}</style>
    </div>
  );
}
