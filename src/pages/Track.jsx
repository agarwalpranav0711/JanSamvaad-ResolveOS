import { useState, useCallback } from 'react';
import Navbar from '../components/Navbar';

const API = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

/* ─── Severity colors ─── */
const SEV = {
  CRITICAL: { bg: 'bg-red-500/15', text: 'text-red-300', label: 'CRITICAL' },
  HIGH:     { bg: 'bg-orange-500/15', text: 'text-orange-300', label: 'HIGH' },
  MEDIUM:   { bg: 'bg-yellow-500/15', text: 'text-yellow-300', label: 'MEDIUM' },
  LOW:      { bg: 'bg-green-500/15', text: 'text-green-300', label: 'LOW' },
};

/* ─── Status step index ─── */
function statusStep(status) {
  const s = (status || '').toLowerCase();
  if (s === 'closed' || s === 'resolved') return 4;
  if (s === 'in_progress' || s === 'in progress') return 3;
  if (s === 'assigned') return 2;
  return 1; // open / registered
}

/* ─── Format date ─── */
function fmt(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/* ─── SLA countdown ─── */
function slaCountdown(deadline) {
  if (!deadline) return null;
  const ms = new Date(deadline) - Date.now();
  if (ms <= 0) return { text: 'BREACHED', color: 'text-red-400' };
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h < 6) return { text: `${h}h ${m}m remaining`, color: 'text-orange-400' };
  return { text: `${h}h ${m}m remaining`, color: 'text-[#10b981]' };
}

/* ─── Star Rating ─── */
function StarRating({ rating, onRate, disabled }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => onRate(star)}
          className={`text-2xl transition-all duration-200 ${
            star <= rating ? 'text-yellow-400 scale-110' : 'text-white/20 hover:text-yellow-400/50'
          } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer active:scale-125'}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

/* ─── Timeline Step ─── */
function TimelineStep({ step, current, label, detail, time, isLast }) {
  const done = current >= step;
  const active = current === step;
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
          done
            ? 'border-[#10b981] bg-[#10b981]'
            : active
              ? 'border-[#10b981] bg-transparent animate-pulse'
              : 'border-white/20 bg-transparent'
        }`}>
          {done && <span className="text-[8px] text-black font-bold">✓</span>}
        </div>
        {!isLast && (
          <div className={`w-0.5 flex-1 min-h-[40px] transition-all duration-500 ${
            done ? 'bg-[#10b981]/40' : 'bg-white/10'
          }`} />
        )}
      </div>
      <div className="pb-6">
        <p className={`text-sm font-semibold ${done ? 'text-[#f8f5f0]' : 'text-white/30'}`}>{label}</p>
        {detail && <p className="text-xs text-[#a3c9aa]/60 mt-0.5">{detail}</p>}
        {time && <p className="text-xs text-[#a3c9aa]/40 mt-0.5">{time}</p>}
      </div>
    </div>
  );
}

/* ─── Main Track Page ─── */
export default function Track() {
  const [ref, setRef] = useState('');
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rating, setRating] = useState(0);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const handleSearch = useCallback(async (e) => {
    e?.preventDefault();
    const q = ref.trim().toUpperCase();
    if (!q) return;
    setLoading(true);
    setError('');
    setTicket(null);
    setRating(0);
    setFeedbackSent(false);

    try {
      const res = await fetch(`${API}/api/public/tickets?ref=${encodeURIComponent(q)}`);
      if (res.status === 404) {
        setError('not_found');
        return;
      }
      if (!res.ok) throw new Error('Server error');
      const data = await res.json();
      setTicket(data);
    } catch (err) {
      setError('server');
    } finally {
      setLoading(false);
    }
  }, [ref]);

  const handleFeedback = useCallback(async (stars) => {
    setRating(stars);
    if (!ticket?.id) return;
    setFeedbackLoading(true);
    try {
      await fetch(`${API}/api/tickets/${ticket.id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: stars })
      });
      setFeedbackSent(true);
    } catch (_) {
      // Silently fail
    } finally {
      setFeedbackLoading(false);
    }
  }, [ticket]);

  const isResolved = ticket && (ticket.status === 'closed' || ticket.status === 'resolved');
  const sev = ticket ? (SEV[ticket.severity?.toUpperCase()] || SEV.MEDIUM) : null;
  const step = ticket ? statusStep(ticket.status) : 0;
  const sla = ticket ? slaCountdown(ticket.sla_deadline) : null;

  return (
    <div className="min-h-screen bg-[#080c10] text-[#f8f5f0]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <Navbar />

      <div className="pt-24 pb-16 px-4 max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            Track Your <span className="text-[#10b981]">Complaint</span>
          </h1>
          <p className="text-[#a3c9aa]/60 text-sm">Enter your ticket reference number to check real-time status</p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-3 max-w-xl mx-auto mb-12">
          <input
            type="text"
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            placeholder="Enter your Ticket Reference (e.g. GRV-XXXXXX)"
            className="flex-1 px-4 py-3 rounded-xl bg-[#0d1117] border border-white/10 text-sm text-[#f8f5f0] placeholder:text-[#a3c9aa]/30 outline-none focus:border-[#10b981]/40 transition-all"
          />
          <button
            type="submit"
            disabled={loading || !ref.trim()}
            className="px-6 py-3 rounded-xl bg-[#10b981] text-black font-semibold text-sm hover:bg-[#059669] disabled:opacity-40 transition-all active:scale-95"
          >
            {loading ? '...' : 'Search'}
          </button>
        </form>

        {/* Loading */}
        {loading && (
          <div className="text-center py-16">
            <svg className="animate-spin h-8 w-8 text-[#10b981] mx-auto mb-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <p className="text-sm text-[#a3c9aa]/50">Looking up your complaint...</p>
          </div>
        )}

        {/* Error: Not Found */}
        {error === 'not_found' && (
          <div className="text-center py-12 px-6 rounded-2xl border border-white/5 bg-[#0d1117]">
            <p className="text-4xl mb-4">🔍</p>
            <h3 className="text-xl font-bold text-[#f8f5f0] mb-2">Ticket not found / टिकट नहीं मिला</h3>
            <p className="text-sm text-[#a3c9aa]/50 mb-1">Check your reference number and try again</p>
            <p className="text-sm text-[#a3c9aa]/50 mb-4">अपना संदर्भ नंबर जांचें और पुनः प्रयास करें</p>
            <p className="text-xs text-[#a3c9aa]/30">For help, call: <a href="tel:+15706308042" className="text-[#10b981] hover:underline">+1 570 630 8042</a></p>
          </div>
        )}

        {/* Error: Server */}
        {error === 'server' && (
          <div className="text-center py-12 px-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/5">
            <p className="text-4xl mb-4">⚠️</p>
            <h3 className="text-lg font-bold text-yellow-300 mb-2">Server error / सर्वर त्रुटि</h3>
            <p className="text-sm text-[#a3c9aa]/50">Please try again in a moment</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && !ticket && (
          <div className="text-center py-16 text-slate-400">
            <p className="text-5xl mb-4 opacity-50">🧭</p>
            <p className="text-sm text-[#a3c9aa]/60 font-medium">Enter your ticket reference above to begin tracking</p>
            <p className="text-xs text-[#a3c9aa]/40 mt-2">अपना टिकट ट्रैक करने के लिए ऊपर संदर्भ नंबर दर्ज करें</p>
          </div>
        )}

        {/* ─── TICKET DETAILS ─── */}
        {ticket && !loading && (
          <div className="space-y-6 animate-fadeIn">

            {/* Summary Card */}
            <div className="rounded-2xl border border-white/10 bg-[#0d1117] p-6">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-[#10b981] font-mono">{ticket.ref}</p>
                  <p className="text-xs text-[#a3c9aa]/40 mt-1">Filed {fmt(ticket.created_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${sev.bg} ${sev.text}`}>
                    {sev.label}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    isResolved ? 'bg-emerald-500/15 text-emerald-300' : 'bg-blue-500/15 text-blue-300'
                  }`}>
                    {isResolved ? '✅ RESOLVED' : '🔄 ' + (ticket.status || 'OPEN').toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-sm">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-xs text-[#a3c9aa]/40 block mb-1">Category / Department</span>
                  <span className="text-[#f8f5f0] font-medium capitalize">{ticket.category || '—'}</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-xs text-[#a3c9aa]/40 block mb-1">Ward</span>
                  <span className="text-[#f8f5f0] font-medium">{ticket.ward_name || '—'}</span>
                </div>
                {!isResolved && sla && (
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 sm:col-span-2">
                    <span className="text-xs text-[#a3c9aa]/40 block mb-1">SLA Deadline</span>
                    <span className={`font-bold ${sla.color}`}>{sla.text}</span>
                    <span className="text-xs text-[#a3c9aa]/30 ml-2">({fmt(ticket.sla_deadline)})</span>
                  </div>
                )}
              </div>
            </div>

            {/* ─── Resolution Timeline ─── */}
            <div className="rounded-2xl border border-white/10 bg-[#0d1117] p-6">
              <h3 className="text-sm font-semibold text-[#f8f5f0] mb-6">Resolution Timeline</h3>
              <TimelineStep step={1} current={step} label="Registered" detail="Complaint received via voice call" time={fmt(ticket.created_at)} />
              <TimelineStep step={2} current={step} label="AI Classified" detail={ticket.category ? `Category: ${ticket.category} • Severity: ${(ticket.severity || '').toUpperCase()}` : null} time={step >= 2 ? fmt(ticket.created_at) : null} />
              <TimelineStep step={3} current={step} label="Assigned to Ward" detail={ticket.ward_name ? `${ticket.ward_name} — ${ticket.category || 'General'} Department` : null} />
              <TimelineStep step={3} current={step >= 3 ? 3 : 0} label="In Progress" detail={step >= 3 ? 'Officer investigating' : null} />
              <TimelineStep step={4} current={step} label="Resolved ✓" detail={isResolved ? 'Complaint resolved' : null} time={isResolved ? fmt(ticket.closed_at) : null} isLast />
            </div>

            {/* ─── RESOLVED: Proof + Rating ─── */}
            {isResolved && (
              <div className="relative overflow-hidden rounded-2xl border border-[#10b981]/20 bg-[#10b981]/5 p-6 text-center animate-success-flash shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-400 via-transparent to-transparent" />
                <div className="text-5xl mb-4 animate-bounce-slow">✅</div>
                <h3 className="text-xl font-bold text-[#10b981] mb-2">Your complaint has been resolved</h3>
                <p className="text-sm text-[#a3c9aa]/50 mb-6">शिकायत का समाधान हो गया है</p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-6">
                  <div>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(ticket.ref)}`}
                      alt="Resolution QR Code"
                      className="rounded-lg border border-white/10 mx-auto"
                      width={160}
                      height={160}
                    />
                    <p className="text-xs text-[#a3c9aa]/40 mt-2">Resolution Verification QR</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#f8f5f0] mb-3 font-medium">Rate your experience</p>
                    <StarRating rating={rating} onRate={handleFeedback} disabled={feedbackSent || feedbackLoading} />
                    {feedbackSent && (
                      <p className="text-xs text-[#10b981] mt-2 animate-fadeIn">Thank you for your feedback! 🙏</p>
                    )}
                    <a
                      href={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(ticket.ref)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-4 px-4 py-2 rounded-lg border border-white/10 text-xs text-[#a3c9aa]/60 hover:bg-white/5 transition-all"
                    >
                      📥 Download Resolution Certificate
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
        @keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }
        @keyframes successFlash { 0% { background-color: rgba(16, 185, 129, 0.4); box-shadow: 0 0 60px rgba(16, 185, 129, 0.4); } 100% { background-color: rgba(16, 185, 129, 0.05); box-shadow: 0 0 30px rgba(16, 185, 129, 0.1); } }
        .animate-success-flash { animation: successFlash 1.5s ease-out forwards; }
      `}</style>
    </div>
  );
}
