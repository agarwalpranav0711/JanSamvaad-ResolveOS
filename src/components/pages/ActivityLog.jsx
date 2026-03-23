import { useState, useRef, useEffect, useCallback } from 'react';

const EVENT_ICONS = { new_ticket: '🎫', ticket_resolved: '✅', sla_breach: '⚠️', call_received: '📞' };
const FILTER_LABELS = ['All', 'Tickets', 'Resolutions', 'Alerts'];
const FILTER_TYPES = { All: null, Tickets: 'new_ticket', Resolutions: 'ticket_resolved', Alerts: 'sla_breach' };

function timeStr(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function ActivityLog({ socket, tickets = [] }) {
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState('All');
  const [soundOn, setSoundOn] = useState(false);
  const scrollRef = useRef(null);
  const audioRef = useRef(null);

  // Generate initial events from tickets
  useEffect(() => {
    const initial = tickets.slice(0, 20).map((t, i) => ({
      id: `init-${i}`,
      type: t.status === 'resolved' || t.status === 'closed' ? 'ticket_resolved' : 'new_ticket',
      message: t.status === 'resolved' || t.status === 'closed'
        ? `Ticket ${t.ref} resolved — ${t.category || 'complaint'}`
        : `New ticket ${t.ref} — ${t.category || 'complaint'} in Ward ${t.ward_id}`,
      timestamp: t.created_at,
      operator: t.status === 'resolved' ? 'Officer Sharma' : 'System',
    }));
    setEvents(initial.reverse());
  }, [tickets]);

  // Socket events
  useEffect(() => {
    if (!socket) return;
    const handler = (data) => {
      const ev = {
        id: `live-${Date.now()}-${Math.random()}`,
        type: data.type || 'new_ticket',
        message: data.message || `New event: ${data.ref || ''}`,
        timestamp: data.timestamp || new Date().toISOString(),
        operator: data.operator || 'System',
      };
      setEvents(prev => [...prev, ev]);
      if (soundOn && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    };
    socket.on('new_ticket', (d) => handler({ ...d, type: 'new_ticket', message: `🎫 New ticket ${d.ref}: ${d.category}` }));
    socket.on('ticket_resolved', (d) => handler({ ...d, type: 'ticket_resolved', message: `✅ Ticket ${d.ref} resolved` }));
    socket.on('sla_breach', (d) => handler({ ...d, type: 'sla_breach', message: `⚠️ SLA breached: ${d.ref}` }));
    return () => { socket.off('new_ticket'); socket.off('ticket_resolved'); socket.off('sla_breach'); };
  }, [socket, soundOn]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [events]);

  const filtered = filter === 'All' ? events : events.filter(e => e.type === FILTER_TYPES[filter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#f8f5f0]">Activity Log</h2>
          <p className="text-xs text-[#a3c9aa]/50">Real-time event stream</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundOn(!soundOn)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 ${
              soundOn ? 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30' : 'bg-white/[0.03] text-[#a3c9aa]/50 border-white/10'
            }`}
          >
            {soundOn ? '🔔 Sound On' : '🔇 Sound Off'}
          </button>
          <span className="flex items-center gap-1.5 text-xs text-[#10b981]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" /> Live
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-1.5">
        {FILTER_LABELS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              filter === f
                ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30'
                : 'bg-white/[0.03] text-[#a3c9aa]/50 border border-white/5 hover:bg-white/[0.06]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Event Stream */}
      <div
        ref={scrollRef}
        className="rounded-2xl border border-white/10 bg-[#0d1117]/80 p-4 space-y-2 overflow-y-auto"
        style={{ height: 'calc(100vh - 280px)' }}
      >
        {filtered.length === 0 && (
          <p className="text-sm text-[#a3c9aa]/30 text-center py-12">No events yet...</p>
        )}
        {filtered.map(ev => (
          <div key={ev.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all duration-200">
            <span className="text-lg flex-shrink-0 mt-0.5">{EVENT_ICONS[ev.type] || '•'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[#f8f5f0]">{ev.message}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-[#a3c9aa]/40">{timeStr(ev.timestamp)}</span>
                <span className="text-xs text-[#a3c9aa]/30">{ev.operator}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Hidden audio element for notification sound */}
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=" type="audio/wav" />
      </audio>
    </div>
  );
}
