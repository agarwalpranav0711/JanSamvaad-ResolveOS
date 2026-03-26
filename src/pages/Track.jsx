import { useState, useCallback } from 'react';
import Navbar from '../components/Navbar';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');

/* ─── Severity colors ─── */
const SEV = {
  CRITICAL: { bg: 'bg-[#CC0000]/15', text: 'text-[#FF4444]', label: 'CRITICAL' },
  HIGH:     { bg: 'bg-[#FF9933]/15', text: 'text-[#FF9933]', label: 'HIGH' },
  MEDIUM:   { bg: 'bg-[#C8A951]/15', text: 'text-[#C8A951]', label: 'MEDIUM' },
  LOW:      { bg: 'bg-[#138808]/15', text: 'text-[#22AA22]', label: 'LOW' },
};

/* ─── Status step index ─── */
function statusStep(status) {
  const s = (status || '').toLowerCase();
  if (s === 'closed' || s === 'resolved') return 4;
  if (s === 'in_progress' || s === 'in progress') return 3;
  if (s === 'assigned') return 2;
  return 1;
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
  if (ms <= 0) return { text: 'BREACHED', color: 'text-[#CC0000]' };
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h < 6) return { text: `${h}h ${m}m remaining`, color: 'text-[#FF9933]' };
  return { text: `${h}h ${m}m remaining`, color: 'text-[#138808]' };
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
          aria-label={`Rate ${star} stars`}
          className={`text-2xl transition-all duration-200 ${
            star <= rating ? 'text-[#FF9933] scale-110' : 'text-white/20 hover:text-[#FF9933]/50'
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
            ? 'border-[#138808] bg-[#138808]'
            : active
              ? 'border-[#FF9933] bg-transparent animate-pulse'
              : 'border-white/20 bg-transparent'
        }`}>
          {done && <span className="text-[8px] text-white font-bold">✓</span>}
        </div>
        {!isLast && (
          <div className={`w-0.5 flex-1 min-h-[40px] transition-all duration-500 ${
            done ? 'bg-[#138808]/40' : 'bg-white/10'
          }`} />
        )}
      </div>
      <div className="pb-6">
        <p className={`text-sm font-semibold ${done ? 'text-white' : 'text-white/30'}`}>{label}</p>
        {detail && <p className="text-xs text-[#8A9BB5] mt-0.5">{detail}</p>}
        {time && <p className="text-xs text-[#8A9BB5]/60 mt-0.5">{time}</p>}
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
    <div className="min-h-screen bg-[#0A1628] text-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Navbar />

      <div className="pt-24 pb-16 px-4 max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            <span lang="hi" className="text-[#FF9933]">शिकायत की स्थिति जांचें</span>
            <span className="block text-lg sm:text-xl font-normal text-[#E8EDF2] mt-1">Track Grievance Status</span>
          </h1>
          <p className="text-[#8A9BB5] text-sm">Enter your unique Grievance Reference Number to view real-time status</p>
        </div>

        {/* Search */}
        <div className="rounded-xl bg-white/[0.03] border border-white/10 p-6 mb-6">
          <label className="block text-xs text-[#8A9BB5] mb-2 font-medium">
            Grievance Reference Number / शिकायत संदर्भ संख्या
          </label>
          <form onSubmit={handleSearch} className="flex gap-3">
            <input
              type="text"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="e.g. JS-G7H8I9"
              className="flex-1 px-4 py-3 rounded-lg bg-[#112240] border border-white/10 text-sm text-white placeholder:text-[#8A9BB5]/50 outline-none focus:border-[#FF9933]/50 transition-all"
              aria-label="Grievance reference number"
            />
            <button
              type="submit"
              disabled={loading || !ref.trim()}
              className="px-6 py-3 rounded-lg bg-[#FF9933] text-[#0A1628] font-semibold text-sm hover:bg-[#E6841C] disabled:opacity-40 transition-all active:scale-95"
              aria-label="Search for grievance"
            >
              {loading ? '...' : 'Search / खोजें'}
            </button>
          </form>
          <p className="text-xs text-[#8A9BB5]/50 mt-3">
            Your reference number was provided via SMS when you registered your complaint.
            Try sample references: <span className="text-[#4A90D9]">JS-A1B2C3 | JS-D4E5F6 | JS-E4F5G6</span>
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-16">
            <svg className="animate-spin h-8 w-8 text-[#FF9933] mx-auto mb-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <p className="text-sm text-[#8A9BB5]">Looking up your grievance...</p>
          </div>
        )}

        {/* Error: Not Found */}
        {error === 'not_found' && (
          <div className="text-center py-12 px-6 rounded-xl border border-white/10 bg-[#112240]">
            <p className="text-4xl mb-4">🔍</p>
            <h3 lang="hi" className="text-xl font-bold text-white mb-1">शिकायत नहीं मिली</h3>
            <h3 className="text-lg font-semibold text-[#E8EDF2] mb-3">Grievance Not Found</h3>
            <p className="text-sm text-[#8A9BB5] mb-1">Please verify your reference number and try again</p>
            <p lang="hi" className="text-sm text-[#8A9BB5] mb-4">कृपया अपना संदर्भ नंबर जांचें और पुनः प्रयास करें</p>
            <p className="text-xs text-[#8A9BB5]/60">For assistance, call: <a href="tel:+15706308042" className="text-[#4A90D9] hover:underline">+1 570 630 8042</a></p>
          </div>
        )}

        {/* Error: Server */}
        {error === 'server' && (
          <div className="text-center py-12 px-6 rounded-xl border border-[#CC0000]/20 bg-[#CC0000]/5">
            <p className="text-4xl mb-4">⚠️</p>
            <h3 lang="hi" className="text-lg font-bold text-[#FF4444] mb-1">सर्वर त्रुटि</h3>
            <h3 className="text-base font-semibold text-[#E8EDF2] mb-2">Server Error</h3>
            <p className="text-sm text-[#8A9BB5]">Please try again. If the problem persists, call: <a href="tel:+15706308042" className="text-[#4A90D9] hover:underline">+1 570 630 8042</a></p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && !ticket && (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">🔎</p>
            <p className="text-sm text-[#8A9BB5]">Enter your grievance reference number above to begin tracking</p>
            <p lang="hi" className="text-xs text-[#8A9BB5]/60 mt-1">अपनी शिकायत ट्रैक करने के लिए ऊपर संदर्भ नंबर दर्ज करें</p>
          </div>
        )}

        {/* ─── TICKET DETAILS ─── */}
        {ticket && !loading && (
          <div className="space-y-6 animate-fadeIn">

            {/* Summary Card */}
            <div className="rounded-xl border border-white/10 bg-[#112240] p-6">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-xs text-[#8A9BB5] uppercase tracking-widest">Grievance Reference</p>
                <p className="text-xs text-[#8A9BB5] uppercase tracking-widest">Status</p>
              </div>
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <p className="text-2xl sm:text-3xl font-bold text-[#FF9933] font-mono">{ticket.ref}</p>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  isResolved ? 'bg-[#138808]/15 text-[#22AA22]' : 'bg-[#4A90D9]/15 text-[#4A90D9]'
                }`}>
                  {isResolved ? '✅ RESOLVED' : '🔄 ' + (ticket.status || 'OPEN').toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-sm">
                <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                  <span className="text-xs text-[#8A9BB5]/60 block mb-1">Filed By</span>
                  <span className="text-white font-medium">{ticket.phone || '—'}</span>
                </div>
                <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                  <span className="text-xs text-[#8A9BB5]/60 block mb-1">Ward</span>
                  <span className="text-white font-medium">{ticket.ward_name || '—'}</span>
                </div>
                <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                  <span className="text-xs text-[#8A9BB5]/60 block mb-1">Category / Department</span>
                  <span className="text-white font-medium capitalize">{ticket.category || '—'}</span>
                </div>
                <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                  <span className="text-xs text-[#8A9BB5]/60 block mb-1">Severity</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${sev.bg} ${sev.text}`}>{sev.label}</span>
                </div>
                <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                  <span className="text-xs text-[#8A9BB5]/60 block mb-1">Registered</span>
                  <span className="text-white text-xs">{fmt(ticket.created_at)}</span>
                </div>
                {isResolved && (
                  <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                    <span className="text-xs text-[#8A9BB5]/60 block mb-1">Resolved</span>
                    <span className="text-[#22AA22] text-xs">{fmt(ticket.closed_at)}</span>
                  </div>
                )}
                {!isResolved && sla && (
                  <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                    <span className="text-xs text-[#8A9BB5]/60 block mb-1">SLA Deadline</span>
                    <span className={`font-bold ${sla.color}`}>{sla.text}</span>
                    <span className="text-xs text-[#8A9BB5]/40 ml-2">({fmt(ticket.sla_deadline)})</span>
                  </div>
                )}
              </div>
            </div>

            {/* ─── Resolution Timeline ─── */}
            <div className="rounded-xl border border-white/10 bg-[#112240] p-6">
              <h3 className="text-sm font-semibold text-white mb-6">Resolution Timeline</h3>
              <TimelineStep step={1} current={step} label="Registered" detail="Complaint received via voice call" time={fmt(ticket.created_at)} />
              <TimelineStep step={2} current={step} label="AI Classified" detail={ticket.category ? `Category: ${ticket.category} • Severity: ${(ticket.severity || '').toUpperCase()}` : null} time={step >= 2 ? fmt(ticket.created_at) : null} />
              <TimelineStep step={3} current={step} label="Assigned to Ward" detail={ticket.ward_name ? `${ticket.ward_name} — ${ticket.category || 'General'} Department` : null} />
              <TimelineStep step={3} current={step >= 3 ? 3 : 0} label="In Progress" detail={step >= 3 ? 'Officer investigating' : null} />
              <TimelineStep step={4} current={step} label="Resolved ✓" detail={isResolved ? 'Complaint resolved' : null} time={isResolved ? fmt(ticket.closed_at) : null} isLast />
            </div>

            {/* ─── RESOLVED: Proof + Rating ─── */}
            {isResolved && (
              <div className="rounded-xl border border-[#138808]/20 bg-[#138808]/5 p-6 text-center">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="text-xl font-bold text-[#138808] mb-1">Your grievance has been resolved</h3>
                <p lang="hi" className="text-sm text-[#8A9BB5] mb-6">शिकायत का समाधान हो गया है</p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-6">
                  <div>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(ticket.ref)}`}
                      alt="Resolution Verification QR Code"
                      className="rounded-lg border border-white/10 mx-auto"
                      width={160}
                      height={160}
                    />
                    <p className="text-xs text-[#8A9BB5]/60 mt-2">Resolution Verification QR</p>
                  </div>
                  <div>
                    <p className="text-sm text-white mb-3 font-medium">Rate your experience</p>
                    <StarRating rating={rating} onRate={handleFeedback} disabled={feedbackSent || feedbackLoading} />
                    {feedbackSent && (
                      <p className="text-xs text-[#138808] mt-2 animate-fadeIn">Thank you for your feedback! 🙏</p>
                    )}
                    <a
                      href={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(ticket.ref)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-4 px-4 py-2 rounded-lg border border-white/10 text-xs text-[#8A9BB5] hover:bg-white/5 transition-all"
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

      {/* Footer */}
      <footer className="border-t border-[#FF9933]/10 bg-[#071020] py-6 px-6 text-center">
        <p className="text-xs text-[#8A9BB5]">© 2026 JanSamvaad ResolveOS | Government of India</p>
        <p className="text-xs text-[#8A9BB5]/50 mt-1">Powered by National Informatics Centre (NIC)</p>
      </footer>
    </div>
  );
}
