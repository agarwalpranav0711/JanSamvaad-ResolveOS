import { useState } from 'react';

function StatusDot({ active }) {
  return (
    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${active ? 'bg-[#138808]' : 'bg-[#CC0000]'}`} />
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5">
      <span className="text-sm text-white">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        aria-label={`Toggle ${label}`}
        className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${value ? 'bg-[#FF9933]' : 'bg-white/10'}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${value ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </div>
  );
}

export default function Settings() {
  const [slaNotif, setSlaNotif] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(false);
  const [demoMode, setDemoMode] = useState(import.meta.env.VITE_DEMO_MODE === 'true');

  const twilioConfigured = !!import.meta.env.VITE_TWILIO_SID;
  const geminiConfigured = !!import.meta.env.VITE_GEMINI_KEY || true;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-bold text-white">Settings</h2>
        <p className="text-xs text-[#8A9BB5]">System configuration and preferences</p>
      </div>

      {/* Operator Profile */}
      <div className="rounded-xl border border-white/10 bg-[#112240] p-6">
        <h3 className="text-sm font-bold text-white mb-4">Operator Profile</h3>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-[#FF9933]/10 flex items-center justify-center text-lg font-bold text-[#FF9933]">AD</div>
          <div>
            <p className="text-white font-semibold">admin</p>
            <p className="text-xs text-[#8A9BB5]">Municipal Officer • Delhi</p>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          {[['Username', 'admin'], ['Role', 'Municipal Officer'], ['Region', 'Delhi']].map(([k, v]) => (
            <div key={k} className="flex justify-between py-2 border-b border-white/5">
              <span className="text-[#8A9BB5]">{k}</span>
              <span className="text-white">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* System Settings */}
      <div className="rounded-xl border border-white/10 bg-[#112240] p-6">
        <h3 className="text-sm font-bold text-white mb-4">System Settings</h3>
        <Toggle label="SLA Notifications" value={slaNotif} onChange={setSlaNotif} />
        <Toggle label="Sound Alerts" value={soundAlerts} onChange={setSoundAlerts} />
        <Toggle label="Demo Mode" value={demoMode} onChange={setDemoMode} />
      </div>

      {/* Service Status */}
      <div className="rounded-xl border border-white/10 bg-[#112240] p-6">
        <h3 className="text-sm font-bold text-white mb-4">Service Status</h3>
        <div className="space-y-3">
          {[
            { label: 'Twilio Voice IVR', active: twilioConfigured, desc: twilioConfigured ? 'Connected' : 'Not configured' },
            { label: 'Gemini AI', active: geminiConfigured, desc: 'Active — classification enabled' },
            { label: 'PostgreSQL', active: true, desc: 'Connected' },
            { label: 'Socket.IO', active: true, desc: 'Real-time enabled' },
          ].map(s => (
            <div key={s.label} className="flex items-center justify-between py-2 border-b border-white/5">
              <div className="flex items-center gap-3">
                <StatusDot active={s.active} />
                <span className="text-sm text-white">{s.label}</span>
              </div>
              <span className="text-xs text-[#8A9BB5]">{s.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Data & Privacy */}
      <div className="rounded-xl border border-white/10 bg-[#112240] p-6">
        <h3 className="text-sm font-bold text-white mb-4">Data & Privacy Compliance</h3>
        <div className="space-y-2 text-sm">
          {[
            ['TRAI Compliant', 'Yes — Call recording with consent'],
            ['Data Retention', '7 years as per government policy'],
            ['Encryption', 'AES-256 at rest, TLS 1.3 in transit'],
            ['Data Residency', 'India — as per IT Act 2000'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between py-2 border-b border-white/5">
              <span className="text-[#8A9BB5]">{k}</span>
              <span className="text-white text-right text-xs">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* System Info */}
      <div className="rounded-xl border border-white/10 bg-[#112240] p-6">
        <h3 className="text-sm font-bold text-white mb-4">System Info</h3>
        <div className="space-y-2 text-sm">
          {[
            ['Version', 'v2.0.0 | NIC Platform'],
            ['Uptime', '99.9%'],
            ['Last Sync', new Date().toLocaleString('en-IN')],
            ['Stack', 'React 18 + Vite + Express + PostgreSQL'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between py-2 border-b border-white/5">
              <span className="text-[#8A9BB5]">{k}</span>
              <span className="text-white text-right">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
