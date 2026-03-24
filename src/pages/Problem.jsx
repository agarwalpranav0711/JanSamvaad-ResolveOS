import Navbar from '../components/Navbar';

export default function Problem() {
  return (
    <div className="min-h-screen" style={{ background: '#0A1628', fontFamily: "'Inter', sans-serif" }}>
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold uppercase tracking-widest">The Problem</span>
          <h1 className="text-4xl md:text-5xl font-bold text-[white] mt-6">A System That Fails Its People</h1>
          <p className="text-lg text-[#8A9BB5]/60 mt-4 max-w-2xl mx-auto">Every year, millions of civic complaints go unresolved in India. The system is broken — and the people who suffer most are the ones with the least power to fix it.</p>
        </div>

        {/* Farmer Story */}
        <div className="rounded-3xl border border-white/10 bg-[#112240] p-8 mb-12">
          <h3 className="text-xl font-bold text-[white] mb-6">🌾 Ram Prasad's Story</h3>
          <div className="space-y-6">
            {[
              { time: 'Day 1', text: 'Ram Prasad, a farmer in rural Delhi, notices a broken water pipe flooding his field. He walks 5 km to the municipal office.', icon: '🚶' },
              { time: 'Day 3', text: 'After waiting 2 hours, a clerk writes his complaint in a register. No reference number. No timeline.', icon: '📝' },
              { time: 'Week 2', text: 'Ram walks back to check status. The clerk says "it\'s being processed." No one has visited the site.', icon: '😔' },
              { time: 'Month 1', text: 'His crop is damaged. He files again. This time the register is "lost." He starts over.', icon: '💔' },
              { time: 'Month 3', text: 'Ram gives up. His family loses ₹40,000 in crop damage. The pipe is still broken.', icon: '😢' },
            ].map(s => (
              <div key={s.time} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-lg">{s.icon}</div>
                  <div className="w-0.5 flex-1 bg-red-500/10 mt-2" />
                </div>
                <div className="pb-6">
                  <p className="text-xs font-bold text-red-400 mb-1">{s.time}</p>
                  <p className="text-sm text-[#8A9BB5]/70">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { num: '30M+', label: 'Annual Civic Complaints', color: 'text-red-400' },
            { num: '68%', label: 'Go Unresolved', color: 'text-orange-400' },
            { num: '45 days', label: 'Average Resolution Time', color: 'text-yellow-400' },
            { num: '0%', label: 'Digital Tracking', color: 'text-red-400' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl border border-white/10 bg-[#112240] p-5 text-center">
              <p className={`text-2xl md:text-3xl font-bold ${s.color}`}>{s.num}</p>
              <p className="text-xs text-[#8A9BB5]/50 mt-2">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Pain Points */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { title: 'Manual Process', desc: 'Paper registers, lost files, no tracking. Complaints disappear into bureaucratic black holes.', icon: '📋' },
            { title: 'No Accountability', desc: 'No SLA tracking, no officer assignment, no resolution proof. Zero transparency.', icon: '🔒' },
            { title: 'Language Barrier', desc: 'Forms only in English. 60% of citizens can\'t file complaints because of language barriers.', icon: '🌐' },
          ].map(p => (
            <div key={p.title} className="rounded-2xl border border-red-500/10 bg-red-500/[0.02] p-6">
              <span className="text-2xl">{p.icon}</span>
              <h4 className="text-sm font-bold text-[white] mt-3">{p.title}</h4>
              <p className="text-xs text-[#8A9BB5]/50 mt-2">{p.desc}</p>
            </div>
          ))}
        </div>

        {/* Before/After */}
        <div className="rounded-3xl border border-white/10 bg-[#112240] p-8">
          <h3 className="text-lg font-bold text-[white] mb-6 text-center">Before vs After</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-3 px-4 text-left text-xs uppercase text-[#8A9BB5]/50">Aspect</th>
                  <th className="py-3 px-4 text-left text-xs uppercase text-red-400">Before</th>
                  <th className="py-3 px-4 text-left text-xs uppercase text-[#FF9933]">After (JanSamvaad)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Filing', 'Walk to office, wait 2 hours', 'One phone call in any language'],
                  ['Language', 'English forms only', 'Hindi, English, any language via AI'],
                  ['Tracking', 'No reference number', 'Instant ref + SMS + QR code'],
                  ['Resolution', '45+ days average', '< 24 hours average'],
                  ['Accountability', 'Zero', 'Full SLA tracking + officer assignment'],
                  ['Cost', '₹500+ (travel + time)', '₹0 — voice call is free'],
                ].map(([aspect, before, after]) => (
                  <tr key={aspect} className="border-b border-white/5">
                    <td className="py-3 px-4 text-[white] font-medium">{aspect}</td>
                    <td className="py-3 px-4 text-red-400/70">{before}</td>
                    <td className="py-3 px-4 text-[#FF9933]">{after}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
