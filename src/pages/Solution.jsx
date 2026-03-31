import Navbar from '../components/Navbar';

export default function Solution() {
  return (
    <div className="min-h-screen" style={{ background: '#0A1628', fontFamily: "'Inter', sans-serif" }}>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
        <div className="text-center mb-16">
          <span className="px-4 py-1.5 rounded-full bg-[#FF9933]/10 border border-[#FF9933]/20 text-[#FF9933] text-xs font-semibold uppercase tracking-widest">The Solution</span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[white] mt-6">JanSamvaad</h1>
          <p className="text-lg text-[#8A9BB5]/60 mt-4 max-w-2xl mx-auto">India's first voice-first AI civic grievance platform. One phone call. Every language. Full transparency.</p>
        </div>

        {/* Architecture Flow */}
        <div className="rounded-3xl border border-white/10 bg-[#112240] p-4 sm:p-8 mb-12">
          <h3 className="text-lg font-bold text-[white] mb-8 text-center">System Architecture</h3>
          <div className="flex flex-col items-center">
            {[
              { label: 'Citizen Voice Call', sub: 'Any phone, any language', color: '#3b82f6', icon: '📞' },
              { label: 'Twilio IVR Gateway', sub: 'Call handling + recording', color: '#8b5cf6', icon: '🔊' },
              { label: 'Gemini AI Engine', sub: 'STT + Classification + Severity', color: '#f59e0b', icon: '🤖' },
              { label: 'PostgreSQL Database', sub: 'Ticket storage + audit trail', color: '#FF9933', icon: '🗄️' },
              { label: 'Real-time Dashboard', sub: 'Socket.IO + operator UI', color: '#ef4444', icon: '📊' },
              { label: 'Resolution & Proof', sub: 'QR code + SMS notification', color: '#FF9933', icon: '✅' },
            ].map((step, i) => (
              <div key={step.label} className="w-full max-w-md">
                <div className="flex items-center gap-4 px-4 sm:px-6 py-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: `${step.color}15`, border: `1px solid ${step.color}30` }}>
                    {step.icon}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[white]">{step.label}</p>
                    <p className="text-xs text-[#8A9BB5]/50">{step.sub}</p>
                  </div>
                </div>
                {i < 5 && (
                  <div className="flex flex-col items-center py-1">
                    <div className="w-0.5 h-6" style={{ background: `${step.color}30` }} />
                    <div className="text-[#8A9BB5]/20 text-xs">▼</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {[
            { icon: '🗣️', title: 'Voice First', desc: 'No app, no internet, no literacy required. Just call and speak.' },
            { icon: '🤖', title: 'AI Classification', desc: 'Gemini AI understands complaints in Hindi, English, and more.' },
            { icon: '⚡', title: 'Real-time Tracking', desc: 'Socket.IO pushes updates to the dashboard instantly.' },
            { icon: '🔒', title: 'Blockchain Proof', desc: 'Every complaint gets a tamper-proof hash for accountability.' },
            { icon: '📊', title: 'GIS Analytics', desc: 'Map view of complaints by ward, severity, and department.' },
            { icon: '🏆', title: 'Officer Leaderboard', desc: 'Gamified performance tracking drives faster resolution.' },
          ].map(f => (
            <div key={f.title} className="rounded-2xl border border-white/10 bg-[#112240] p-6 hover:border-[#FF9933]/20 transition-all group">
              <span className="text-3xl">{f.icon}</span>
              <h4 className="text-sm font-bold text-[white] mt-4">{f.title}</h4>
              <p className="text-xs text-[#8A9BB5]/50 mt-2">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Tech Stack */}
        <div className="rounded-3xl border border-white/10 bg-[#112240] p-8 mb-12">
          <h3 className="text-lg font-bold text-[white] mb-6 text-center">Technology Stack</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { layer: 'Frontend', tech: 'React 18 + Vite', color: '#3b82f6' },
              { layer: 'Styling', tech: 'Tailwind CSS', color: '#06b6d4' },
              { layer: 'Backend', tech: 'Node.js + Express', color: '#FF9933' },
              { layer: 'Database', tech: 'PostgreSQL', color: '#3b82f6' },
              { layer: 'AI Engine', tech: 'Google Gemini', color: '#f59e0b' },
              { layer: 'Voice IVR', tech: 'Twilio', color: '#ef4444' },
              { layer: 'Real-time', tech: 'Socket.IO', color: '#8b5cf6' },
              { layer: 'Infrastructure', tech: 'Docker + Nginx', color: '#FF9933' },
            ].map(t => (
              <div key={t.layer} className="text-center p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                <div className="w-2 h-2 rounded-full mx-auto mb-2" style={{ background: t.color }} />
                <p className="text-xs text-[#8A9BB5]/40">{t.layer}</p>
                <p className="text-sm font-bold text-[white] mt-1">{t.tech}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ROI */}
        <div className="rounded-3xl border border-[#FF9933]/20 bg-[#FF9933]/5 p-4 sm:p-8">
          <h3 className="text-lg font-bold text-[white] mb-6 text-center">Return on Investment</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { metric: 'Cost per Complaint', before: '₹500+', after: '₹2', savings: '99.6% reduction' },
              { metric: 'Resolution Time', before: '45 days', after: '< 24 hours', savings: '98% faster' },
              { metric: 'Citizen Satisfaction', before: '23%', after: '91%', savings: '3.9x improvement' },
            ].map(r => (
              <div key={r.metric} className="text-center p-5 rounded-2xl border border-white/5 bg-[#112240]">
                <p className="text-xs text-[#8A9BB5]/50 mb-2">{r.metric}</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-sm text-red-400 line-through">{r.before}</span>
                  <span className="text-[#8A9BB5]/30">→</span>
                  <span className="text-lg font-bold text-[#FF9933]">{r.after}</span>
                </div>
                <p className="text-xs text-[#FF9933]/60 mt-2">{r.savings}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
