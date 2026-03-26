import Navbar from '../components/Navbar';

const CHECKLIST = [
  { title: 'TRAI Telecom Regulatory Authority of India', items: [
    'IVR system registered with TRAI guidelines',
    'Call recording consent obtained via automated IVR prompt',
    'Caller ID displayed as per TRAI regulations',
    'Opt-out mechanism available at any point during call',
  ]},
  { title: 'DND Registry Compliance', items: [
    'Numbers checked against NCPR (National Customer Preference Register)',
    'No promotional content — all calls are citizen-initiated inbound',
    'Complaint-only system — no marketing or advertising',
    'DND registry scrubbing not required for inbound systems',
  ]},
  { title: 'Data Privacy & Protection', items: [
    'Phone numbers masked in all public-facing views',
    'PII (Personally Identifiable Information) encrypted at rest',
    'No data shared with third parties without consent',
    'Complaint data retained per RTI Act 2005 requirements',
    'GDPR-equivalent privacy-by-design architecture',
  ]},
  { title: 'Consent & IVR Flow', items: [
    'Automated greeting with consent notice',
    'Language selection: Hindi / English',
    'Clear purpose statement before recording',
    'Reference number provided at end of each call',
    'SMS confirmation sent post-call',
  ]},
];

export default function Compliance() {
  return (
    <div className="min-h-screen" style={{ background: '#0A1628', fontFamily: "'Inter', sans-serif" }}>
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <span className="px-4 py-1.5 rounded-full bg-[#FF9933]/10 border border-[#FF9933]/20 text-[#FF9933] text-xs font-semibold uppercase tracking-widest">Regulatory Compliance</span>
          <h1 className="text-4xl md:text-5xl font-bold text-[white] mt-6">Fully Compliant</h1>
          <p className="text-lg text-[#8A9BB5]/60 mt-4">Built from day one to meet every Indian telecom and data privacy regulation.</p>
        </div>

        <div className="space-y-8">
          {CHECKLIST.map(section => (
            <div key={section.title} className="rounded-2xl border border-white/10 bg-[#112240] p-6">
              <h3 className="text-sm font-bold text-[white] mb-4">{section.title}</h3>
              <div className="space-y-3">
                {section.items.map(item => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-[#FF9933]/20 flex items-center justify-center text-[#FF9933] text-xs flex-shrink-0 mt-0.5">✓</span>
                    <span className="text-sm text-[#8A9BB5]/70">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Badge */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl border border-[#FF9933]/30 bg-[#FF9933]/5">
            <span className="text-3xl">🛡️</span>
            <div className="text-left">
              <p className="text-sm font-bold text-[#FF9933]">Fully Compliant</p>
              <p className="text-xs text-[#8A9BB5]/50">Indian Telecom Regulations • Data Privacy Act • RTI Act 2005</p>
            </div>
          </div>
        </div>

        {/* IVR Flow Diagram */}
        <div className="mt-16 rounded-2xl border border-white/10 bg-[#112240] p-8">
          <h3 className="text-lg font-bold text-[white] mb-6 text-center">Consent IVR Flow</h3>
          <div className="flex flex-col items-center space-y-4">
            {[
              { step: '📞 Citizen Calls +1 (570) 630-8042', color: '#3b82f6' },
              { step: '🔊 Automated Greeting + Consent Notice', color: '#f59e0b' },
              { step: '🌐 Language Selection (Hindi / English)', color: '#8b5cf6' },
              { step: '🎤 Voice Recording Begins (with notice)', color: '#ef4444' },
              { step: '🤖 AI Classification + Severity Assignment', color: '#FF9933' },
              { step: '🎫 Reference Number Issued + SMS Sent', color: '#FF9933' },
            ].map((item, i) => (
              <div key={i} className="w-full max-w-md">
                <div className="flex items-center gap-3 px-5 py-3 rounded-xl border border-white/5 bg-white/[0.02]">
                  <div className="w-1.5 h-8 rounded-full flex-shrink-0" style={{ background: item.color }} />
                  <span className="text-sm text-[white]">{item.step}</span>
                </div>
                {i < 5 && <div className="w-0.5 h-4 bg-white/10 mx-auto" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
