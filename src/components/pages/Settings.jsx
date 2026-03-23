import { useState } from 'react';

function StatusDot({ active }) {
  return (
    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${active ? 'bg-green-400' : 'bg-red-400'}`} />
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5">
      <span className="text-sm text-[#f8f5f0]">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${value ? 'bg-[#10b981]' : 'bg-white/10'}`}
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
  const geminiConfigured = !!import.meta.env.VITE_GEMINI_KEY || true; // default true for demo

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-bold text-[#f8f5f0]">Settings</h2>
        <p className="text-xs text-[#a3c9aa]/50">System configuration and preferences</p>
      </div>

      {/* Operator Profile */}
      <div className="rounded-2xl border border-white/10 bg-[#0d1117]/80 p-6">
        <h3 className="text-sm font-bold text-[#f8f5f0] mb-4">Operator Profile</h3>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-[#10b981]/15 flex items-center justify-center text-lg font-bold text-[#10b981]">AD</div>
          <div>
            <p className="text-[#f8f5f0] font-semibold">admin</p>
            <p className="text-xs text-[#a3c9aa]/40">Municipal Officer • Delhi</p>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          {[['Username', 'admin'], ['Role', 'Municipal Officer'], ['Region', 'Delhi']].map(([k, v]) => (
            <div key={k} className="flex justify-between py-2 border-b border-white/5">
              <span className="text-[#a3c9aa]/50">{k}</span>
              <span className="text-[#f8f5f0]">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* System Settings */}
      <div className="rounded-2xl border border-white/10 bg-[#0d1117]/80 p-6">
        <h3 className="text-sm font-bold text-[#f8f5f0] mb-4">System Settings</h3>
        <Toggle label="SLA Notifications" value={slaNotif} onChange={setSlaNotif} />
        <Toggle label="Sound Alerts" value={soundAlerts} onChange={setSoundAlerts} />
        <Toggle label="Demo Mode" value={demoMode} onChange={setDemoMode} />
      </div>

      {/* Service Status */}
      <div className="rounded-2xl border border-white/10 bg-[#0d1117]/80 p-6">
        <h3 className="text-sm font-bold text-[#f8f5f0] mb-4">Service Status</h3>
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
                <span className="text-sm text-[#f8f5f0]">{s.label}</span>
              </div>
              <span className="text-xs text-[#a3c9aa]/40">{s.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* System Info */}
      <div className="rounded-2xl border border-white/10 bg-[#0d1117]/80 p-6">
        <h3 className="text-sm font-bold text-[#f8f5f0] mb-4">System Info</h3>
        <div className="space-y-2 text-sm">
          {[
            ['Version', 'v2.0.0 — India Innovates 2026'],
            ['Uptime', '99.9%'],
            ['Last Sync', new Date().toLocaleString('en-IN')],
            ['Stack', 'React 18 + Vite + Express + PostgreSQL'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between py-2 border-b border-white/5">
              <span className="text-[#a3c9aa]/50">{k}</span>
              <span className="text-[#f8f5f0] text-right">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
