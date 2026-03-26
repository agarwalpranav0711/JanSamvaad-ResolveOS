import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import Sidebar from './Sidebar';
import GISMap from './pages/GISMap';
import Ledger from './pages/Ledger';
import Analytics from './pages/Analytics';
import ActivityLog from './pages/ActivityLog';
import OfficerPerformance from './pages/OfficerPerformance';
import Reports from './pages/Reports';
import QRScanner from './pages/QRScanner';
import SettingsPage from './pages/Settings';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
const API = 'https://jansamvaad-backend-608936922611.asia-south1.run.app';

const SEVERITY_CLASS_MAP = {
  CRITICAL: 'bg-[#CC0000]/20 text-[#FF4444] border border-[#CC0000]/30',
  HIGH: 'bg-[#FF9933]/20 text-[#FF9933] border border-[#FF9933]/30',
  MEDIUM: 'bg-[#C8A951]/20 text-[#C8A951] border border-[#C8A951]/30',
  LOW: 'bg-[#138808]/20 text-[#22AA22] border border-[#138808]/30'
};

const STATUS_CLASS_MAP = {
  open: 'bg-[#4A90D9]/20 text-[#4A90D9] border border-[#4A90D9]/30',
  in_progress: 'bg-[#FF9933]/20 text-[#FF9933] border border-[#FF9933]/30',
  resolved: 'bg-[#138808]/20 text-[#22AA22] border border-[#138808]/30'
};

function maskPhone(phone) {
  if (!phone) {
    return 'N/A';
  }

  const normalized = String(phone);
  if (normalized.length < 4) {
    return normalized;
  }

  const prefix = normalized.startsWith('+91') ? '+91' : normalized.slice(0, 2);
  const suffix = normalized.slice(-4);
  return `${prefix}******${suffix}`;
}

function normalizeSeverity(value) {
  const raw = String(value || '').trim().toUpperCase();
  if (raw === 'HIGH' || raw === 'MEDIUM' || raw === 'LOW' || raw === 'CRITICAL') {
    return raw;
  }
  if (raw === 'HIGH') return 'HIGH';
  if (raw === 'MEDIUM') return 'MEDIUM';
  if (raw === 'LOW') return 'LOW';
  return 'MEDIUM';
}

function normalizeStatus(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'open' || raw === 'in_progress' || raw === 'resolved') return raw;
  if (raw === 'closed') return 'resolved';
  return 'open';
}

function formatClock(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatRelativeTime(value) {
  if (!value) return 'just now';
  const delta = Date.now() - new Date(value).getTime();
  const sec = Math.max(0, Math.floor(delta / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const day = Math.floor(hr / 24);
  return `${day} day${day === 1 ? '' : 's'} ago`;
}

function formatCountdown(deadline, nowMs) {
  if (!deadline) return { label: 'No SLA', tone: 'text-slate-300', urgent: false };
  const diff = new Date(deadline).getTime() - nowMs;
  const abs = Math.abs(diff);
  const hours = Math.floor(abs / 3600000);
  const minutes = Math.floor((abs % 3600000) / 60000);
  const seconds = Math.floor((abs % 60000) / 1000);
  const label = `${diff < 0 ? '-' : ''}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  if (diff < 0) {
    return { label: '🔴 BREACHED', tone: 'text-red-400 animate-pulse font-bold', urgent: true };
  }
  if (diff <= 30 * 60000) {
    return { label, tone: 'text-red-300', urgent: true };
  }
  if (diff <= 2 * 3600000) {
    return { label, tone: 'text-yellow-300', urgent: false };
  }
  return { label, tone: 'text-green-300', urgent: false };
}

function formatTrend(value) {
  if (value > 0) return { icon: '▲', cls: 'text-[#138808]', text: `+${value}` };
  if (value < 0) return { icon: '▼', cls: 'text-[#CC0000]', text: `${value}` };
  return { icon: '•', cls: 'text-[#8A9BB5]', text: '0' };
}

function displayCategory(category) {
  const raw = String(category || '').trim().toLowerCase();
  if (!raw || raw === 'unclassified' || raw === 'other' || raw === 'unknown') {
    return 'General Complaint';
  }
  if (raw.includes('road')) return 'Road Damage';
  if (raw.includes('pothole')) return 'Pothole';
  if (raw.includes('water')) return 'Water Leakage';
  if (raw.includes('electricity') || raw.includes('power')) return 'Electricity Outage';
  if (raw.includes('sanitation') || raw.includes('garbage')) return 'Garbage Collection';
  if (raw.includes('drainage')) return 'Drainage Blocked';
  if (raw.includes('street light') || raw.includes('streetlight')) return 'Street Light';
  if (raw.includes('noise')) return 'Noise Complaint';
  if (raw.includes('sewage')) return 'Sewage Overflow';
  if (raw.includes('park')) return 'Park Maintenance';
  return 'General Complaint';
}

function displayWard(ticket) {
  if (ticket && ticket.ward_name) {
    return ticket.ward_name;
  }
  if (ticket && ticket.ward_id !== null && ticket.ward_id !== undefined && `${ticket.ward_id}` !== '') {
    return `Ward ${ticket.ward_id}`;
  }
  return '—';
}

function displaySummary(ticket) {
  const raw = String(ticket?.summary || ticket?.ai_summary || '').trim();
  if (!raw) {
    return 'No summary available';
  }
  return raw;
}

function getDepartmentMeta(category) {
  const value = displayCategory(category).toLowerCase();
  if (value.includes('road') || value.includes('pothole') || value.includes('street')) {
    return { label: '🛣️ Roads Dept', badgeClass: 'bg-blue-500/20 text-blue-300 border border-blue-500/50' };
  }
  if (value.includes('water') || value.includes('drainage')) {
    return { label: '💧 Water Dept', badgeClass: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50' };
  }
  if (value.includes('electricity') || value.includes('power')) {
    return { label: '⚡ Electricity Dept', badgeClass: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50' };
  }
  if (value.includes('sanitation') || value.includes('garbage') || value.includes('waste')) {
    return { label: '🗑️ Sanitation Dept', badgeClass: 'bg-green-500/20 text-green-300 border border-green-500/50' };
  }
  return { label: '📋 General Dept', badgeClass: 'bg-slate-500/20 text-slate-300 border border-slate-500/50' };
}

function seededWardFromTicket(ticket) {
  const seed = `${ticket?.id || ''}${ticket?.ref || ''}`;
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 997;
  }
  return (Math.abs(hash) % 10) + 1;
}

function normalizeWardId(value, ticket) {
  if (value === null || value === undefined || value === '—') {
    return seededWardFromTicket(ticket);
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return seededWardFromTicket(ticket);
  }
  return Math.floor(parsed);
}

function normalizeTicket(ticket) {
  const wardId = normalizeWardId(ticket?.ward_id, ticket);
  return {
    ...ticket,
    ward_id: wardId,
    severity: normalizeSeverity(ticket?.severity),
    status: normalizeStatus(ticket?.status),
    phone: maskPhone(ticket?.phone),
    created_at: ticket?.created_at || new Date().toISOString(),
    summary: ticket?.summary || ticket?.ai_summary || ''
  };
}

function buildDemoTicket({
  id,
  ref,
  category,
  ward_id,
  severity,
  status,
  hoursAgo,
  phone,
  summary,
  resolutionHours
}) {
  const createdAt = new Date(Date.now() - hoursAgo * 3600000);
  const slaWindow = severity === 'CRITICAL' ? 24 : severity === 'HIGH' ? 48 : severity === 'MEDIUM' ? 72 : 96;
  const resolvedAt = status === 'resolved' && resolutionHours
    ? new Date(createdAt.getTime() + resolutionHours * 3600000)
    : null;
  return normalizeTicket({
    id,
    ref,
    category,
    ward_id,
    severity,
    status,
    phone,
    summary,
    created_at: createdAt.toISOString(),
    resolved_at: resolvedAt ? resolvedAt.toISOString() : null,
    sla_deadline: new Date(createdAt.getTime() + slaWindow * 3600000).toISOString(),
    evidence_url: status === 'resolved' ? `${API}/evidence/${ref.toLowerCase()}` : null
  });
}

const DEMO_TICKETS = [
  buildDemoTicket({ id: 1, ref: 'GRV-A1B2C3', category: 'Pothole', ward_id: 3, severity: 'HIGH', status: 'open', hoursAgo: 6, phone: '+919812345601', summary: 'Resident reports large pothole near Ward 3 market causing vehicle tire damage.' }),
  buildDemoTicket({ id: 2, ref: 'GRV-D4E5F6', category: 'Water Leakage', ward_id: 1, severity: 'CRITICAL', status: 'open', hoursAgo: 4, phone: '+919812345602', summary: 'Major pipeline leak near school in Ward 1 flooding footpath and blocking traffic.' }),
  buildDemoTicket({ id: 3, ref: 'GRV-G7H8I9', category: 'Street Light', ward_id: 5, severity: 'MEDIUM', status: 'in_progress', hoursAgo: 18, phone: '+919812345603', summary: 'Three street lights not working on Ward 5 main lane creating safety concern at night.' }),
  buildDemoTicket({ id: 4, ref: 'GRV-J1K2L3', category: 'Garbage Collection', ward_id: 2, severity: 'HIGH', status: 'open', hoursAgo: 12, phone: '+919812345604', summary: 'Garbage pileup outside apartment gate in Ward 2 attracting stray animals.' }),
  buildDemoTicket({ id: 5, ref: 'GRV-M4N5O6', category: 'Electricity Outage', ward_id: 4, severity: 'CRITICAL', status: 'in_progress', hoursAgo: 9, phone: '+919812345605', summary: 'Frequent power outage in Ward 4 block B affecting small shops and clinics.' }),
  buildDemoTicket({ id: 6, ref: 'GRV-P7Q8R9', category: 'Drainage Blocked', ward_id: 6, severity: 'HIGH', status: 'open', hoursAgo: 20, phone: '+919812345606', summary: 'Drain near Ward 6 bus stand is blocked and overflow starts after light rain.' }),
  buildDemoTicket({ id: 7, ref: 'GRV-S1T2U3', category: 'Road Damage', ward_id: 3, severity: 'MEDIUM', status: 'resolved', hoursAgo: 34, resolutionHours: 4, phone: '+919812345607', summary: 'Road surface cracked near Ward 3 hospital entry; patchwork requested by residents.' }),
  buildDemoTicket({ id: 8, ref: 'GRV-V4W5X6', category: 'Noise Complaint', ward_id: 7, severity: 'LOW', status: 'open', hoursAgo: 5, phone: '+919812345608', summary: 'Late-night loudspeaker noise near Ward 7 temple disturbing senior citizens.' }),
  buildDemoTicket({ id: 9, ref: 'GRV-Y7Z8A9', category: 'Sewage Overflow', ward_id: 2, severity: 'HIGH', status: 'in_progress', hoursAgo: 16, phone: '+919812345609', summary: 'Sewage overflow reported in Ward 2 residential lane causing foul smell and hygiene risk.' }),
  buildDemoTicket({ id: 10, ref: 'GRV-B1C2D3', category: 'Park Maintenance', ward_id: 8, severity: 'LOW', status: 'resolved', hoursAgo: 27, resolutionHours: 3, phone: '+919812345610', summary: 'Broken swings and overgrown grass in Ward 8 children park fixed after complaint.' }),
  buildDemoTicket({ id: 11, ref: 'GRV-E4F5G6', category: 'Pothole', ward_id: 1, severity: 'MEDIUM', status: 'open', hoursAgo: 30, phone: '+919812345611', summary: 'Medium pothole near Ward 1 dairy booth causing two-wheeler skidding incidents.' }),
  buildDemoTicket({ id: 12, ref: 'GRV-H7I8J9', category: 'Water Leakage', ward_id: 4, severity: 'HIGH', status: 'resolved', hoursAgo: 36, resolutionHours: 5, phone: '+919812345612', summary: 'Water leakage from overhead valve in Ward 4 repaired by pipeline team.' }),
  buildDemoTicket({ id: 13, ref: 'GRV-K1L2M3', category: 'Street Light', ward_id: 5, severity: 'LOW', status: 'in_progress', hoursAgo: 22, phone: '+919812345613', summary: 'Single street light flickering in Ward 5 internal road; maintenance team assigned.' }),
  buildDemoTicket({ id: 14, ref: 'GRV-N4O5P6', category: 'Garbage Collection', ward_id: 6, severity: 'MEDIUM', status: 'open', hoursAgo: 14, phone: '+919812345614', summary: 'Missed garbage pickup for two days in Ward 6 apartment cluster.' }),
  buildDemoTicket({ id: 15, ref: 'GRV-Q7R8S9', category: 'Electricity Outage', ward_id: 2, severity: 'CRITICAL', status: 'open', hoursAgo: 3, phone: '+919812345615', summary: 'Transformer fault in Ward 2 causing complete outage for multiple blocks.' }),
  buildDemoTicket({ id: 16, ref: 'GRV-T1U2V3', category: 'Drainage Blocked', ward_id: 7, severity: 'HIGH', status: 'resolved', hoursAgo: 32, resolutionHours: 6, phone: '+919812345616', summary: 'Ward 7 drainage line desilted and waterlogging cleared within same day.' }),
  buildDemoTicket({ id: 17, ref: 'GRV-W4X5Y6', category: 'Road Damage', ward_id: 8, severity: 'MEDIUM', status: 'in_progress', hoursAgo: 26, phone: '+919812345617', summary: 'Road edge collapse near Ward 8 flyover service lane under repair planning.' }),
  buildDemoTicket({ id: 18, ref: 'GRV-Z7A8B9', category: 'Noise Complaint', ward_id: 3, severity: 'LOW', status: 'open', hoursAgo: 8, phone: '+919812345618', summary: 'Construction noise before permitted hours reported in Ward 3 residential pocket.' }),
  buildDemoTicket({ id: 19, ref: 'GRV-C1D2E3', category: 'Sewage Overflow', ward_id: 1, severity: 'MEDIUM', status: 'in_progress', hoursAgo: 19, phone: '+919812345619', summary: 'Intermittent sewage overflow near Ward 1 metro gate under field inspection.' }),
  buildDemoTicket({ id: 20, ref: 'GRV-F4G5H6', category: 'Park Maintenance', ward_id: 5, severity: 'LOW', status: 'resolved', hoursAgo: 24, resolutionHours: 2, phone: '+919812345620', summary: 'Ward 5 park lighting and benches repaired after repeated resident complaints.' }),
  buildDemoTicket({ id: 21, ref: 'GRV-I7J8K9', category: 'Pothole', ward_id: 4, severity: 'HIGH', status: 'in_progress', hoursAgo: 10, phone: '+919812345621', summary: 'Deep pothole at Ward 4 junction marked and temporary filling started.' }),
  buildDemoTicket({ id: 22, ref: 'GRV-L1M2N3', category: 'Water Leakage', ward_id: 6, severity: 'MEDIUM', status: 'open', hoursAgo: 11, phone: '+919812345622', summary: 'Slow but continuous water leakage in Ward 6 lane affecting daily supply pressure.' }),
  buildDemoTicket({ id: 23, ref: 'GRV-O4P5Q6', category: 'Street Light', ward_id: 2, severity: 'MEDIUM', status: 'resolved', hoursAgo: 28, resolutionHours: 7, phone: '+919812345623', summary: 'Street light controller in Ward 2 replaced and corridor lighting restored.' }),
  buildDemoTicket({ id: 24, ref: 'GRV-R7S8T9', category: 'Garbage Collection', ward_id: 8, severity: 'MEDIUM', status: 'resolved', hoursAgo: 40, resolutionHours: 8, phone: '+919812345624', summary: 'Bulk waste cleared from Ward 8 market lane with follow-up collection schedule set.' }),
  buildDemoTicket({ id: 25, ref: 'GRV-U1V2W3', category: 'Electricity Outage', ward_id: 7, severity: 'HIGH', status: 'in_progress', hoursAgo: 7, phone: '+919812345625', summary: 'Localized power interruption in Ward 7 due to feeder tripping under restoration.' })
];

function decodeJwtUsername(token) {
  try {
    const payloadPart = String(token || '').split('.')[1];
    if (!payloadPart) {
      return 'Operator';
    }
    const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const padded = `${normalized}${'='.repeat((4 - (normalized.length % 4)) % 4)}`;
    const payload = JSON.parse(atob(padded));
    return payload?.username || 'Operator';
  } catch (error) {
    return 'Operator';
  }
}

function getInitials(name) {
  const tokens = String(name || 'Operator').trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) {
    return 'OP';
  }
  if (tokens.length === 1) {
    return tokens[0].slice(0, 2).toUpperCase();
  }
  return `${tokens[0][0] || ''}${tokens[1][0] || ''}`.toUpperCase();
}

function useAnimatedNumber(value, duration = 800) {
  const [display, setDisplay] = useState(0);
  const previousRef = useRef(0);

  useEffect(() => {
    const start = previousRef.current;
    const end = Number(value || 0);
    const startTime = performance.now();

    let raf = 0;
    const step = (time) => {
      const progress = Math.min((time - startTime) / duration, 1);
      const next = Math.round(start + (end - start) * progress);
      setDisplay(next);
      if (progress < 1) {
        raf = requestAnimationFrame(step);
      } else {
        previousRef.current = end;
      }
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return display;
}

/* props: { title, value, trend, accent, delayMs } */
const KPICard = memo(function KPICard({ title, value, trend, accent, delayMs }) {
  const animated = useAnimatedNumber(value, 800);
  const trendMeta = formatTrend(trend);

  return (
    <div
      className="rounded-xl border border-white/10 bg-[#1A2F4A] p-4 shadow-lg shadow-black/20 transition-all duration-200 ease-in-out"
      style={{ animation: `kpiIn 420ms ease-in-out ${delayMs}ms both` }}
    >
      <p className="text-xs uppercase tracking-wide text-slate-400">{title}</p>
      <div className="mt-3 flex items-end justify-between">
        <p className={`text-3xl font-semibold ${accent}`}>{animated.toLocaleString()}</p>
        <p className={`text-xs font-semibold ${trendMeta.cls}`}>
          {trendMeta.icon} {trendMeta.text} vs yesterday
        </p>
      </div>
    </div>
  );
});

/* props: { tickets } */
const SeverityBar = memo(function SeverityBar({ tickets, counts }) {
  const total = counts.CRITICAL + counts.HIGH + counts.MEDIUM + counts.LOW || 1;

  const segments = [
    { key: 'CRITICAL', color: 'bg-red-500', count: counts.CRITICAL },
    { key: 'HIGH', color: 'bg-orange-500', count: counts.HIGH },
    { key: 'MEDIUM', color: 'bg-yellow-500', count: counts.MEDIUM },
    { key: 'LOW', color: 'bg-green-500', count: counts.LOW }
  ];

  return (
    <div className="rounded-xl border border-white/10 bg-[#1A2F4A] p-4 shadow-lg shadow-black/20">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-100">Severity Breakdown</h3>
        <p className="text-xs text-slate-400">{tickets.length} tickets</p>
      </div>
      <div className="flex h-8 overflow-hidden rounded-md">
        {segments.map((segment, index) => {
          const pct = (segment.count / total) * 100;
          return (
            <div
              key={segment.key}
              tabIndex={0}
              className={`${segment.color} group flex items-center justify-center text-[10px] font-bold text-black transition-all duration-500 ease-in-out`}
              style={{
                width: `${Math.max(2, pct)}%`,
                transitionDelay: `${index * 120}ms`
              }}
              title={`${segment.key}: ${segment.count}`}
            >
              {pct >= 10 ? (
                <span className="hidden sm:inline group-hover:inline group-active:inline group-focus:inline">
                  {`${Math.round(pct)}%`}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300 md:grid-cols-4">
        {segments.map((segment) => (
          <div key={segment.key} className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${segment.color}`} />
            <span>{segment.key}: {segment.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

/* props: { items, ready } */
const ActivitySidebar = memo(function ActivitySidebar({ items, ready }) {
  const iconByType = {
    new_ticket: '🎫',
    ticket_resolved: '✅',
    sla_breach: '🔴'
  };

  return (
    <aside
      aria-live="polite"
      className={`h-full rounded-xl border border-white/10 bg-[#1A2F4A] p-4 shadow-lg shadow-black/20 transition-all duration-300 ${ready ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'}`}
    >
      <h3 className="mb-3 text-sm font-semibold text-slate-100">Recent Activity</h3>
      <div className="h-[540px] space-y-2 overflow-y-auto pr-1">
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">No live events yet.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-lg border border-white/10 bg-slate-900/60 p-2 md:flex md:flex-col md:items-center md:justify-center lg:block">
              <p className="text-center text-[11px] text-slate-300 md:text-base lg:text-xs">
                <span className="mr-1">{iconByType[item.type] || '•'}</span>
                {formatRelativeTime(item.timestamp)}
              </p>
              <p className="mt-1 hidden text-xs text-slate-200 lg:block">
                {item.message}
              </p>
            </div>
          ))
        )}
      </div>
    </aside>
  );
});

/* props: { toasts } */
const ToastStack = memo(function ToastStack({ toasts, onToastDismiss }) {
  const handleToastDismiss = useCallback((event) => {
    const { toastId } = event.currentTarget.dataset;
    if (toastId) {
      onToastDismiss(toastId);
    }
  }, [onToastDismiss]);

  return (
    <div
      aria-live="assertive"
      aria-atomic="true"
      className="pointer-events-none fixed right-4 top-4 z-50 flex w-[340px] flex-col gap-2"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-lg border px-3 py-2 text-sm shadow-lg shadow-black/30 transition-all duration-200 ${
            toast.type === 'sla_breach'
              ? 'border-red-500/50 bg-red-500/20 text-red-100'
              : toast.type === 'ticket_resolved'
                ? 'border-[#FF9933]/50 bg-[#FF9933]/20 text-[#FFD699]'
                : 'border-cyan-500/50 bg-cyan-500/20 text-cyan-100'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <span>{toast.message}</span>
            <button
              type="button"
              data-toast-id={toast.id}
              onClick={handleToastDismiss}
              aria-label={`Dismiss notification: ${toast.message}`}
              className="pointer-events-auto rounded px-1 text-xs opacity-70 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A90D9]"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
});

/* props: { ticket, nowMs, isBreached, isNew, isResolving, onResolve } */
const TicketRow = memo(function TicketRow({
  ticket,
  nowMs,
  isBreached,
  isNew,
  isResolving,
  onResolve,
  isExpanded,
  onToggleExpand,
  onCollapse
}) {
  const severity = normalizeSeverity(ticket.severity);
  const status = normalizeStatus(ticket.status);
  const countdown = formatCountdown(ticket.sla_deadline, nowMs);
  const department = getDepartmentMeta(ticket.category);
  const handleResolveClick = useCallback(() => {
    onResolve(ticket.id, 'user');
  }, [onResolve, ticket.id]);
  const handleResolveButtonClick = useCallback((event) => {
    event.stopPropagation();
    handleResolveClick();
  }, [handleResolveClick]);
  const handleToggleDetails = useCallback(() => {
    onToggleExpand(ticket.id);
  }, [onToggleExpand, ticket.id]);
  const handleToggleDetailsClick = useCallback((event) => {
    event.stopPropagation();
    handleToggleDetails();
  }, [handleToggleDetails]);
  const handleEvidenceClick = useCallback((event) => {
    event.stopPropagation();
  }, []);
  const handleRowKeyDown = useCallback((event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      onToggleExpand(ticket.id);
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      onCollapse(ticket.id);
    }
    if (event.key.toLowerCase() === 'r') {
      event.preventDefault();
      onResolve(ticket.id, 'user');
    }
  }, [onCollapse, onResolve, onToggleExpand, ticket.id]);
  const handleRowClick = useCallback(() => {
    onToggleExpand(ticket.id);
  }, [onToggleExpand, ticket.id]);

  return (
    <>
      <tr
        role="row"
        tabIndex={0}
        onKeyDown={handleRowKeyDown}
        onClick={handleRowClick}
        aria-label={`Ticket row ${ticket.ref}`}
        className={`border-b border-white/5 transition-all duration-200 ease-in-out hover:bg-slate-800/40 ${
          isBreached || countdown.urgent ? 'animate-pulse border-l-2 border-l-red-500/70' : ''
        } ${isNew ? 'bg-yellow-200/15' : ''}`}
        style={isNew ? { animation: 'rowSlide 300ms ease-out, rowFlash 2s ease-in-out' } : undefined}
      >
        <td role="gridcell" className="px-3 py-3 font-mono text-xs text-cyan-200">{ticket.ref}</td>
        <td role="gridcell" className="px-3 py-3 text-sm font-semibold text-slate-100">
          <div className="flex items-center gap-2">
            <span>{displayCategory(ticket.category)}</span>
            <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${department.badgeClass}`}>
              {department.label}
            </span>
          </div>
        </td>
        <td role="gridcell" className="hidden px-3 py-3 text-sm text-slate-300 lg:table-cell">{displayWard(ticket)}</td>
        <td role="gridcell" className="px-3 py-3">
          <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${SEVERITY_CLASS_MAP[severity]}`}>
            Severity {severity}
          </span>
        </td>
        <td role="gridcell" className="px-3 py-3">
          <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${STATUS_CLASS_MAP[status]}`}>
            Status {status}
          </span>
        </td>
        <td
          role="gridcell"
          aria-label={`SLA countdown ${countdown.label}`}
          className={`px-3 py-3 font-mono text-xs ${countdown.tone}`}
        >
          SLA {countdown.label}
        </td>
        <td role="gridcell" className="hidden px-3 py-3 font-mono text-xs text-slate-300 lg:table-cell">{ticket.phone || maskPhone('')}</td>
        <td role="gridcell" className="px-3 py-3 text-center">
          {ticket.evidence_url ? (
            <a
              href={ticket.evidence_url}
              target="_blank"
              rel="noreferrer"
              onClick={handleEvidenceClick}
              aria-label={`Open evidence for ticket ${ticket.ref}`}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-cyan-500/40 text-cyan-300 transition-all duration-200 hover:bg-cyan-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A90D9]"
              title="Open evidence"
            >
              ↗
            </a>
          ) : (
            <span className="text-slate-600">—</span>
          )}
        </td>
        <td role="gridcell" className="px-3 py-3">
          <div className="flex flex-col gap-1 md:flex-row">
            <button
              type="button"
              onClick={handleResolveButtonClick}
              disabled={isResolving || status === 'resolved'}
              aria-label={`Resolve ticket ${ticket.ref}`}
              className="rounded-md border border-[#FF9933]/40 bg-[#FF9933]/20 px-3 py-1 text-xs font-semibold text-[#FFB366] shadow-sm transition-all duration-200 hover:bg-[#FF9933]/30 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A90D9] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isResolving ? 'Resolving…' : status === 'resolved' ? 'Resolved' : 'Resolve'}
            </button>
            <button
              type="button"
              onClick={handleToggleDetailsClick}
              aria-label={`${isExpanded ? 'Collapse' : 'Expand'} details for ticket ${ticket.ref}`}
              className="rounded-md border border-slate-500/40 bg-slate-500/10 px-3 py-1 text-xs font-semibold text-slate-200 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A90D9] lg:hidden"
            >
              {isExpanded ? 'Hide' : 'Details'}
            </button>
          </div>
        </td>
      </tr>
      {isExpanded ? (
        <tr role="row" className="bg-slate-900/40">
          <td role="gridcell" colSpan={9} className="px-3 py-2 text-xs text-slate-300">
            <div className="flex flex-wrap gap-4">
              <span><span className="text-slate-500">Ward:</span> {displayWard(ticket)}</span>
              <span><span className="text-slate-500">Phone:</span> {ticket.phone || maskPhone('')}</span>
            </div>
            <p className="mt-2 text-xs italic text-slate-400">AI Summary: {displaySummary(ticket)}</p>
          </td>
        </tr>
      ) : null}
    </>
  );
});

const MobileTicketCard = memo(function MobileTicketCard({
  ticket,
  nowMs,
  isBreached,
  isNew,
  isResolving,
  onResolve
}) {
  const severity = normalizeSeverity(ticket.severity);
  const status = normalizeStatus(ticket.status);
  const countdown = formatCountdown(ticket.sla_deadline, nowMs);
  const department = getDepartmentMeta(ticket.category);
  const handleResolveClick = useCallback(() => {
    onResolve(ticket.id, 'user');
  }, [onResolve, ticket.id]);

  return (
    <div
      className={`rounded-xl border border-white/10 bg-slate-900/60 p-3 shadow-sm ${
        isBreached || countdown.urgent ? 'animate-pulse border-red-500/60' : ''
      } ${isNew ? 'bg-yellow-200/10' : ''}`}
      style={isNew ? { animation: 'rowSlide 300ms ease-out, rowFlash 2s ease-in-out' } : undefined}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="font-mono text-xs text-cyan-200">{ticket.ref}</p>
        <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${SEVERITY_CLASS_MAP[severity]}`}>
          {severity}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <p className="text-sm font-semibold text-slate-100">{displayCategory(ticket.category)}</p>
        <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${department.badgeClass}`}>
          {department.label}
        </span>
      </div>
      <p className="mt-1 text-xs italic text-slate-400">AI Summary: {displaySummary(ticket)}</p>
      <p className="mt-1 text-xs text-slate-400">Ward: {displayWard(ticket)}</p>
      <div className="mt-3 flex items-center justify-between">
        <p className={`font-mono text-xs ${countdown.tone}`}>{countdown.label}</p>
        <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${STATUS_CLASS_MAP[status]}`}>
          {status}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleResolveClick}
          disabled={isResolving || status === 'resolved'}
          aria-label={`Resolve ticket ${ticket.ref}`}
          className="w-full rounded-md border border-[#FF9933]/40 bg-[#FF9933]/20 px-3 py-2 text-xs font-semibold text-[#FFB366] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A90D9] disabled:opacity-50"
        >
          {isResolving ? 'Resolving…' : status === 'resolved' ? 'Resolved' : 'Resolve'}
        </button>
        {ticket.evidence_url ? (
          <a
            href={ticket.evidence_url}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open evidence for ticket ${ticket.ref}`}
            className="inline-flex w-full items-center justify-center rounded-md border border-cyan-500/40 bg-cyan-500/15 px-3 py-2 text-xs font-semibold text-cyan-200 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A90D9]"
          >
            Evidence
          </a>
        ) : (
          <span className="inline-flex w-full items-center justify-center rounded-md border border-slate-600/40 bg-slate-700/20 px-3 py-2 text-xs text-slate-500">
            No Evidence
          </span>
        )}
      </div>
    </div>
  );
});

export default function Dashboard() {
  const [tickets, setTickets] = useState(DEMO_TICKETS);
  const [resolvingTicketIds, setResolvingTicketIds] = useState({});
  const [stats, setStats] = useState({
    total_open: 12,
    total_closed: 85,
    breach_risk: 2
  });
  const [loading, setLoading] = useState(!DEMO_MODE);
  const [error, setError] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [operatorName, setOperatorName] = useState('Operator');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [wardFilter, setWardFilter] = useState('all');
  const [visibleCount, setVisibleCount] = useState(50);
  const [activity, setActivity] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [socketLive, setSocketLive] = useState(false);
  const [clock, setClock] = useState(new Date());
  const [nowMs, setNowMs] = useState(Date.now());
  const [newTicketIds, setNewTicketIds] = useState([]);
  const [breachTicketIds, setBreachTicketIds] = useState([]);
  const [sidebarReady, setSidebarReady] = useState(false);
  const [isActivityDrawerOpen, setIsActivityDrawerOpen] = useState(false);
  const [activityUnread, setActivityUnread] = useState(0);
  const [expandedRows, setExpandedRows] = useState({});
  const [activePage, setActivePage] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [trends, setTrends] = useState({
    total: 0,
    open: 0,
    breached: 0,
    resolvedToday: 0
  });

  const socketRef = useRef(null);
  const etagRef = useRef('');
  const kpiPrevRef = useRef(null);
  const searchDebounceRef = useRef(null);
  const bellButtonRef = useRef(null);
  const drawerRef = useRef(null);
  const drawerCloseButtonRef = useRef(null);

  useEffect(() => {
    const dmSans = document.createElement('link');
    dmSans.rel = 'stylesheet';
    dmSans.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap';

    const jetBrains = document.createElement('link');
    jetBrains.rel = 'stylesheet';
    jetBrains.href = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap';

    document.head.appendChild(dmSans);
    document.head.appendChild(jetBrains);

    return () => {
      document.head.removeChild(dmSans);
      document.head.removeChild(jetBrains);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setClock(new Date());
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setSidebarReady(true), 40);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  const dismissToast = useCallback((toastId) => {
    setToasts((prev) => prev.filter((item) => item.id !== toastId));
  }, []);

  const handleUnauthorized = useCallback(() => {
    setAuthToken('');
    setOperatorName('Operator');
    setSocketLive(false);
    setError('');
  }, []);

  const addActivity = useCallback((type, message, ticket) => {
    setActivity((prev) => [
      {
        id: `${Date.now()}-${Math.random()}`,
        type,
        message,
        ticketRef: ticket?.ref || '',
        timestamp: new Date().toISOString()
      },
      ...prev
    ].slice(0, 20));
    if (!isActivityDrawerOpen) {
      setActivityUnread((prev) => prev + 1);
    }
  }, [isActivityDrawerOpen]);

  const addToast = useCallback((type, message) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      dismissToast(id);
    }, 5000);
  }, [dismissToast]);

  const mergeTicket = useCallback((incoming) => {
    const normalized = normalizeTicket({
      ...incoming,
      created_at: incoming.created_at || new Date().toISOString()
    });
    setTickets((prev) => [normalized, ...prev.filter((item) => item.id !== normalized.id)].slice(0, 200));
  }, []);

  const authFetch = useCallback(async (url, options = {}) => {
    const headers = {
      ...(options.headers || {}),
      Authorization: `Bearer ${authToken}`
    };
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers
    });

    if (response.status === 401 || response.status === 403) {
      handleUnauthorized();
      throw new Error('Unauthorized');
    }

    return response;
  }, [authToken, handleUnauthorized]);

  const fetchData = useCallback(async (conditional = false) => {
    if (!authToken) {
      return;
    }
    try {
      const headers = conditional && etagRef.current ? { 'If-None-Match': etagRef.current } : {};
      const [ticketsRes, statsRes] = await Promise.all([
        authFetch(`${API}/api/tickets`, { headers }),
        authFetch(`${API}/api/stats`)
      ]);

      if (conditional && ticketsRes.status === 304) {
        return;
      }

      const etag = ticketsRes.headers.get('etag');
      if (etag) {
        etagRef.current = etag;
      }

      const nextTickets = await ticketsRes.json();
      const nextStats = await statsRes.json();
      setTickets(
        Array.isArray(nextTickets)
          ? nextTickets.map((ticket) => normalizeTicket(ticket))
          : []
      );
      setStats(nextStats || {});
      setError('');
    } catch (err) {
      if (err.message !== 'Unauthorized') {
        setError('Unable to refresh dashboard data');
      }
    } finally {
      setLoading(false);
    }
  }, [authFetch, authToken]);

  useEffect(() => {
    if (DEMO_MODE) {
      setLoading(false);
      return undefined;
    }

    if (!authToken) {
      return undefined;
    }

    setLoading(true);
    fetchData();

    const socket = io(API);
    socketRef.current = socket;

    const onConnect = () => setSocketLive(true);
    const onDisconnect = () => setSocketLive(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    socket.on('new_ticket', (ticket) => {
      mergeTicket(ticket);
      setNewTicketIds((prev) => [ticket.id, ...prev].slice(0, 50));
      setTimeout(() => {
        setNewTicketIds((prev) => prev.filter((id) => id !== ticket.id));
      }, 2000);
      addActivity('new_ticket', `New ticket ${ticket.ref} • ${displayCategory(ticket.category)} ${displayWard(ticket)}`, ticket);
      addToast('new_ticket', `📞 New ticket: ${displayCategory(ticket.category)} ${displayWard(ticket)}`);
    });

    socket.on('ticket_resolved', (ticket) => {
      setTickets((prev) =>
        prev.map((item) =>
          item.id === ticket.id
            ? { ...item, ...ticket, status: normalizeStatus(ticket.status || 'resolved'), severity: normalizeSeverity(ticket.severity) }
            : item
        )
      );
      addActivity('ticket_resolved', `Ticket resolved: ${ticket.ref}`, ticket);
      addToast('ticket_resolved', `✅ Ticket resolved: ${ticket.ref}`);
    });

    socket.on('sla_breach', (ticket) => {
      setBreachTicketIds((prev) => [ticket.id, ...prev.filter((id) => id !== ticket.id)].slice(0, 100));
      addActivity('sla_breach', `SLA breached: ${ticket.ref}`, ticket);
      addToast('sla_breach', `⚠ SLA Breached: ${ticket.ref}`);
    });

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.disconnect();
    };
  }, [addActivity, addToast, authToken, fetchData, mergeTicket]);

  useEffect(() => {
    if (DEMO_MODE) return undefined;
    if (!authToken) return undefined;
    if (socketLive) return undefined;

    const interval = setInterval(() => {
      fetchData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [authToken, fetchData, socketLive]);

  const handleResolve = useCallback(async (ticketId, triggerSource = 'system') => {
    setResolvingTicketIds((previous) => ({
      ...previous,
      [ticketId]: true
    }));

    try {
      const response = await authFetch(`${API}/api/tickets/${ticketId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to resolve ticket');
      }
      const updated = await response.json();
      setTickets((previous) =>
        previous.map((ticket) => (ticket.id === ticketId ? { ...ticket, ...updated, status: normalizeStatus(updated.status || 'resolved') } : ticket))
      );
      addActivity('ticket_resolved', `Ticket resolved: ${updated.ref}`, updated);
      addToast('ticket_resolved', `✅ Ticket resolved: ${updated.ref}`);
    } catch (err) {
      if (err.message === 'Unauthorized') {
        return;
      }
      if (triggerSource === 'user') {
        addToast('sla_breach', '⚠ Could not resolve ticket. Please retry.');
      }
    } finally {
      setResolvingTicketIds((previous) => ({
        ...previous,
        [ticketId]: false
      }));
    }
  }, [addActivity, addToast, authFetch]);

  const baseMetrics = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter((ticket) => normalizeStatus(ticket.status) === 'open').length;
    const today = new Date().toDateString();
    const resolvedToday = tickets.filter(
      (ticket) =>
        normalizeStatus(ticket.status) === 'resolved' &&
        new Date(ticket.created_at || Date.now()).toDateString() === today
    ).length;
    return { total, open, resolvedToday };
  }, [tickets]);

  const breachedMetric = useMemo(() => {
    return Math.max(
      tickets.filter((ticket) => formatCountdown(ticket.sla_deadline, nowMs).label.startsWith('BREACHED')).length,
      stats.breach_risk ?? 0,
      breachTicketIds.length
    );
  }, [tickets, nowMs, stats.breach_risk, breachTicketIds.length]);

  const metrics = useMemo(() => ({
    ...baseMetrics,
    breached: breachedMetric
  }), [baseMetrics, breachedMetric]);

  const categoryBreakdown = useMemo(() => {
    const palette = ['#00d4ff', '#22c55e', '#f59e0b', '#ef4444', '#a78bfa', '#14b8a6', '#64748b'];
    const map = new Map();
    tickets.forEach((ticket) => {
      const key = displayCategory(ticket.category);
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, count], index) => ({
      name,
      count,
      color: palette[index % palette.length]
    }));
  }, [tickets]);

  const resolutionAnalytics = useMemo(() => {
    const total = tickets.length;
    const resolvedTickets = tickets.filter((ticket) => normalizeStatus(ticket.status) === 'resolved');
    const resolved = resolvedTickets.length;
    const resolutionRate = total === 0 ? 0 : Math.round((resolved / total) * 100);
    const resolvedWithTimestamp = resolvedTickets.filter((ticket) => Boolean(ticket.resolved_at));
    const averageResolutionHours = resolvedWithTimestamp.length === 0
      ? 0
      : resolvedWithTimestamp.reduce((sum, ticket) => {
        const created = new Date(ticket.created_at || Date.now()).getTime();
        const closed = new Date(ticket.resolved_at).getTime();
        const durationHours = Math.max(0, (closed - created) / 3600000);
        return sum + durationHours;
      }, 0) / resolvedWithTimestamp.length;
    return {
      total,
      resolved,
      resolutionRate,
      averageResolutionHours
    };
  }, [tickets]);

  const wardPerformance = useMemo(() => {
    const wardMap = new Map();
    tickets.forEach((ticket) => {
      const ward = displayWard(ticket);
      const status = normalizeStatus(ticket.status);
      const breached = formatCountdown(ticket.sla_deadline, nowMs).label.startsWith('BREACHED');
      const current = wardMap.get(ward) || {
        ward,
        open: 0,
        resolved: 0,
        breached: 0
      };
      if (status === 'resolved') {
        current.resolved += 1;
      } else {
        current.open += 1;
      }
      if (breached) {
        current.breached += 1;
      }
      wardMap.set(ward, current);
    });
    const rows = Array.from(wardMap.values()).sort((a, b) => b.open - a.open);
    const maxOpen = rows.length > 0 ? rows[0].open : 0;
    return {
      rows,
      maxOpen
    };
  }, [tickets, nowMs]);

  useEffect(() => {
    if (!kpiPrevRef.current) {
      kpiPrevRef.current = metrics;
      return;
    }
    setTrends({
      total: metrics.total - kpiPrevRef.current.total,
      open: metrics.open - kpiPrevRef.current.open,
      breached: metrics.breached - kpiPrevRef.current.breached,
      resolvedToday: metrics.resolvedToday - kpiPrevRef.current.resolvedToday
    });
    kpiPrevRef.current = metrics;
  }, [metrics]);

  const severityCounts = useMemo(() => {
    return tickets.reduce(
      (acc, ticket) => {
        acc[normalizeSeverity(ticket.severity)] += 1;
        return acc;
      },
      { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 }
    );
  }, [tickets]);

  const handleSearchChange = useCallback((event) => {
    const value = event.target.value;
    setSearchInput(value);
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => {
      setSearch(value);
    }, 300);
  }, []);

  const handleStatusFilterChange = useCallback((event) => {
    setStatusFilter(event.target.value);
  }, []);

  const handleSeverityFilterChange = useCallback((event) => {
    setSeverityFilter(event.target.value);
  }, []);

  const handleWardFilterChange = useCallback((event) => {
    setWardFilter(event.target.value);
  }, []);

  const wards = useMemo(() => {
    return [...new Set(tickets.map((ticket) => displayWard(ticket)))];
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tickets.filter((ticket) => {
      const status = normalizeStatus(ticket.status);
      const severity = normalizeSeverity(ticket.severity);
      const ward = displayWard(ticket);
      const passStatus = statusFilter === 'all' || status === statusFilter;
      const passSeverity = severityFilter === 'all' || severity === severityFilter;
      const passWard = wardFilter === 'all' || ward === wardFilter;
      const passSearch =
        !query ||
        String(ticket.ref || '').toLowerCase().includes(query) ||
        String(ticket.category || '').toLowerCase().includes(query);
      return passStatus && passSeverity && passWard && passSearch;
    });
  }, [tickets, search, statusFilter, severityFilter, wardFilter]);

  useEffect(() => {
    setVisibleCount(50);
  }, [search, statusFilter, severityFilter, wardFilter]);

  const visibleTickets = useMemo(() => {
    return filteredTickets.slice(0, visibleCount);
  }, [filteredTickets, visibleCount]);

  const canLoadMore = filteredTickets.length > visibleCount;
  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => prev + 50);
  }, []);
  const openActivityDrawer = useCallback(() => {
    setIsActivityDrawerOpen(true);
  }, []);
  const closeActivityDrawer = useCallback(() => {
    setIsActivityDrawerOpen(false);
  }, []);
  const handleLogout = useCallback(() => {
    setAuthToken('');
    setOperatorName('Operator');
    setSocketLive(false);
    setLoginPassword('');
    setLoginError('');
  }, []);
  const toggleRowExpand = useCallback((ticketId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [ticketId]: !prev[ticketId]
    }));
  }, []);
  const collapseRow = useCallback((ticketId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [ticketId]: false
    }));
  }, []);
  const handleLoginUsernameChange = useCallback((event) => {
    setLoginUsername(event.target.value);
  }, []);
  const handleLoginPasswordChange = useCallback((event) => {
    setLoginPassword(event.target.value);
  }, []);
  const handleLoginSubmit = useCallback(async (event) => {
    event.preventDefault();
    setLoginSubmitting(true);
    setLoginError('');
    try {
      const loginUrl = `${API || ''}/api/auth/login`;
      console.log('Attempting login to:', loginUrl);
      const response = await fetch(loginUrl, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword
        })
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await response.json();
      if (!data.token) {
        throw new Error('Login failed');
      }

      setAuthToken(data.token);
      setOperatorName(decodeJwtUsername(data.token));
      setLoginPassword('');
      setError('');
    } catch (error) {
      setLoginError('Login failed. Check credentials.');
    } finally {
      setLoginSubmitting(false);
    }
  }, [loginPassword, loginUsername]);

  useEffect(() => {
    if (!authToken) {
      setOperatorName('Operator');
      return;
    }
    setOperatorName(decodeJwtUsername(authToken));
  }, [authToken]);

  useEffect(() => {
    if (isActivityDrawerOpen) {
      setActivityUnread(0);
    }
  }, [isActivityDrawerOpen]);

  useEffect(() => {
    if (!isActivityDrawerOpen) {
      return undefined;
    }

    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusable = drawerRef.current
      ? Array.from(drawerRef.current.querySelectorAll(focusableSelector))
      : [];

    const firstElement = drawerCloseButtonRef.current || focusable[0];
    const lastElement = focusable[focusable.length - 1] || firstElement;

    if (firstElement && typeof firstElement.focus === 'function') {
      firstElement.focus();
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsActivityDrawerOpen(false);
        return;
      }

      if (event.key === 'Tab' && firstElement && lastElement) {
        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActivityDrawerOpen]);

  useEffect(() => {
    if (!isActivityDrawerOpen && bellButtonRef.current) {
      bellButtonRef.current.focus();
    }
  }, [isActivityDrawerOpen]);

  if (!DEMO_MODE && !authToken) {
    return (
      <div
        className="relative grid min-h-screen place-items-center p-5 text-slate-100 overflow-hidden"
        style={{
          backgroundColor: '#0A1628',
          fontFamily: "'Inter', system-ui, sans-serif",
          background: 'radial-gradient(ellipse at center, rgba(255,153,51,0.05) 0%, #0A1628 60%)'
        }}
      >
        {/* Subtle animated glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(255,153,51,0.04) 0%, transparent 50%)',
          animation: 'loginGlow 4s ease-in-out infinite alternate'
        }} />
        <div className="relative z-10 w-full max-w-sm">
          {/* Branding */}
          <div className="text-center mb-6">
            <span className="text-3xl">🇮🇳</span>
            <p className="text-xs text-[#FF9933] mt-2 font-medium">Government of India</p>
            <h2 className="text-xl font-bold text-white mt-1">JanSamvaad <span className="text-[#E8EDF2] font-normal">ResolveOS</span></h2>
          </div>
          <form
            onSubmit={handleLoginSubmit}
            className="w-full rounded-xl border border-[#FF9933]/20 bg-[#1A2F4A]/90 p-6 shadow-xl backdrop-blur-sm"
            style={{ boxShadow: '0 0 40px rgba(255,153,51,0.04), 0 25px 50px rgba(0,0,0,0.4)' }}
          >
            <h1 lang="hi" className="mb-0.5 text-lg font-bold text-white">अधिकारी लॉगिन</h1>
            <h2 className="mb-1 text-base font-semibold text-[#E8EDF2]">Operator Login</h2>
            <p className="mb-4 text-xs text-[#8A9BB5]">Authorised Municipal Personnel Only</p>
            <div className="space-y-3">
              <input
                type="text"
                value={loginUsername}
                onChange={handleLoginUsernameChange}
                placeholder="User ID / Username"
                aria-label="User ID or Username"
                className="w-full rounded-md border border-white/10 bg-[#0A1628]/70 px-3 py-2.5 text-sm text-slate-100 outline-none placeholder:text-[#8A9BB5]/50 focus:border-[#FF9933]/50 focus:ring-1 focus:ring-[#FF9933]/20 transition-all"
                required
              />
              <input
                type="password"
                value={loginPassword}
                onChange={handleLoginPasswordChange}
                placeholder="Password"
                className="w-full rounded-md border border-white/10 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-[#FF9933]/50 focus:ring-1 focus:ring-[#FF9933]/20 transition-all"
                required
              />
              {loginError ? (
                <p className="text-xs text-rose-300">{loginError}</p>
              ) : null}
              <button
                type="submit"
                disabled={loginSubmitting}
                className="w-full rounded-md bg-[#FF9933] px-3 py-2.5 text-sm font-semibold text-[#0A1628] transition-all duration-200 hover:bg-[#E6841C] active:scale-[0.98] disabled:opacity-60"
                aria-label="Sign in to portal"
              >
                {loginSubmitting ? 'Signing in...' : 'Sign In to Portal'}
              </button>
            </div>
            <p className="text-[10px] text-[#8A9BB5]/50 mt-4 text-center leading-relaxed">🔒 This is a secure Government of India system. Unauthorised access is prohibited under IT Act 2000.</p>
          </form>
          <p className="text-center mt-4 text-xs text-[#8A9BB5]/30">© 2026 Government of India | NIC</p>
        </div>
        <style>{`
          @keyframes loginGlow {
            0% { opacity: 0.5; transform: scale(1); }
            100% { opacity: 1; transform: scale(1.1); }
          }
        `}</style>
      </div>
    );
  }

  /* ─── Render Overview (existing dashboard content) ─── */
  const renderOverview = () => (
    <>
      <section className="grid grid-cols-2 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <KPICard title="Total Tickets" value={metrics.total} trend={trends.total} accent="text-cyan-300" delayMs={0} />
        <KPICard title="Open" value={metrics.open} trend={trends.open} accent="text-blue-300" delayMs={100} />
        <KPICard title="SLA Breached" value={metrics.breached} trend={trends.breached} accent="text-red-300" delayMs={200} />
        <KPICard title="Resolved Today" value={metrics.resolvedToday} trend={trends.resolvedToday} accent="text-[#FF9933]" delayMs={300} />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-[#1A2F4A] p-4 shadow-lg shadow-black/20">
          <h3 className="mb-3 text-sm font-semibold text-slate-100">Category Breakdown</h3>
          <div className="flex items-center gap-4">
            <div
              className="h-44 w-44 rounded-full flex-shrink-0"
              style={{
                background: categoryBreakdown.length > 0
                  ? `conic-gradient(${categoryBreakdown.map((item, index, arr) => {
                    const previous = arr.slice(0, index).reduce((sum, node) => sum + node.count, 0);
                    const total = arr.reduce((sum, node) => sum + node.count, 0) || 1;
                    const start = (previous / total) * 100;
                    const end = ((previous + item.count) / total) * 100;
                    return `${item.color} ${start}% ${end}%`;
                  }).join(', ')})`
                  : '#1f2937'
              }}
            />
            <div className="space-y-2">
              {categoryBreakdown.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-xs text-slate-300">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name}: {item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#1A2F4A] p-4 shadow-lg shadow-black/20">
          <h3 className="mb-3 text-sm font-semibold text-slate-100">Resolution Rate</h3>
          <div className="grid grid-cols-2 gap-3 text-xs text-slate-300">
            <div className="rounded-lg border border-white/10 bg-slate-900/60 p-3">
              <p className="text-slate-400">Total Tickets</p>
              <p className="mt-1 text-xl font-semibold text-cyan-300">{resolutionAnalytics.total}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-slate-900/60 p-3">
              <p className="text-slate-400">Resolved</p>
              <p className="mt-1 text-xl font-semibold text-[#FF9933]">{resolutionAnalytics.resolved}</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-4xl font-bold text-[#FF9933]">{resolutionAnalytics.resolutionRate}%</p>
            <p className="mt-1 text-xs text-slate-400">Average resolution time: {resolutionAnalytics.averageResolutionHours.toFixed(1)} hours</p>
            <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-800">
              <div className="h-full rounded-full bg-[#FF9933] transition-all duration-300" style={{ width: `${Math.min(100, Math.max(0, resolutionAnalytics.resolutionRate))}%` }} />
            </div>
          </div>
        </div>
      </section>

      <SeverityBar tickets={tickets} counts={severityCounts} />

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <div className="rounded-xl border border-white/10 bg-[#1A2F4A] p-4 shadow-xl shadow-black/30">
          <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-lg font-semibold text-white">Live Ticket Feed</h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <input value={searchInput} onChange={handleSearchChange} placeholder="Search ref/category" className="rounded-md border border-white/10 bg-slate-900/70 px-3 py-2 text-xs text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-500/70" />
              <select value={statusFilter} onChange={handleStatusFilterChange} className="rounded-md border border-white/10 bg-slate-900/70 px-2 py-2 text-xs text-slate-100 outline-none">
                <option value="all">All Status</option><option value="open">Open</option><option value="in_progress">In Progress</option><option value="resolved">Resolved</option>
              </select>
              <select value={severityFilter} onChange={handleSeverityFilterChange} className="rounded-md border border-white/10 bg-slate-900/70 px-2 py-2 text-xs text-slate-100 outline-none">
                <option value="all">All Severity</option><option value="CRITICAL">CRITICAL</option><option value="HIGH">HIGH</option><option value="MEDIUM">MEDIUM</option><option value="LOW">LOW</option>
              </select>
              <select value={wardFilter} onChange={handleWardFilterChange} className="rounded-md border border-white/10 bg-slate-900/70 px-2 py-2 text-xs text-slate-100 outline-none">
                <option value="all">All Wards</option>
                {wards.map((ward) => <option key={ward} value={ward}>{ward}</option>)}
              </select>
            </div>
          </div>
          {loading ? (
            <div className="grid h-64 place-items-center text-sm text-slate-400">Loading dashboard data...</div>
          ) : error ? (
            <div className="grid h-64 place-items-center text-sm text-rose-300">{error}</div>
          ) : filteredTickets.length === 0 ? (
            <div className="grid h-64 place-items-center text-sm text-slate-400">No tickets match current filters.</div>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {visibleTickets.map((ticket) => (
                  <MobileTicketCard key={ticket.id} ticket={ticket} nowMs={nowMs} isBreached={breachTicketIds.includes(ticket.id)} isNew={newTicketIds.includes(ticket.id)} isResolving={Boolean(resolvingTicketIds[ticket.id])} onResolve={handleResolve} />
                ))}
                {canLoadMore && <button type="button" onClick={handleLoadMore} className="w-full rounded-md border border-white/10 bg-slate-800/70 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700/70">Load more</button>}
              </div>
              <div className="hidden overflow-auto md:block">
                <table role="grid" className="min-w-full text-left">
                  <thead className="sticky top-0 z-10 bg-[#0e1528] text-xs uppercase tracking-wide text-slate-400">
                    <tr role="row">
                      <th className="px-3 py-2">Ref</th><th className="px-3 py-2">Category</th><th className="hidden px-3 py-2 lg:table-cell">Ward</th><th className="px-3 py-2">Severity</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">SLA Countdown</th><th className="hidden px-3 py-2 lg:table-cell">Phone</th><th className="px-3 py-2 text-center">Evidence</th><th className="px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleTickets.map((ticket) => (
                      <TicketRow key={ticket.id} ticket={ticket} nowMs={nowMs} isBreached={breachTicketIds.includes(ticket.id)} isNew={newTicketIds.includes(ticket.id)} isResolving={Boolean(resolvingTicketIds[ticket.id])} onResolve={handleResolve} isExpanded={Boolean(expandedRows[ticket.id])} onToggleExpand={toggleRowExpand} onCollapse={collapseRow} />
                    ))}
                  </tbody>
                </table>
                {canLoadMore && <div className="mt-3 text-center"><button type="button" onClick={handleLoadMore} className="rounded-md border border-white/10 bg-slate-800/70 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700/70">Load more</button></div>}
              </div>
            </>
          )}
        </div>
        <div aria-live="polite" className="hidden lg:block">
          <ActivitySidebar items={activity} ready={sidebarReady} />
        </div>
      </section>
    </>
  );

  /* ─── Page dispatcher ─── */
  const renderActivePage = () => {
    switch (activePage) {
      case 'gis': return <GISMap tickets={tickets} />;
      case 'ledger': return <Ledger tickets={tickets} />;
      case 'analytics': return <Analytics tickets={tickets} />;
      case 'activity': return <ActivityLog socket={socketRef.current} tickets={tickets} />;
      case 'officers': return <OfficerPerformance tickets={tickets} />;
      case 'reports': return <Reports tickets={tickets} />;
      case 'qr': return <QRScanner />;
      case 'settings': return <SettingsPage />;
      default: return renderOverview();
    }
  };

  return (
    <div className="min-h-screen text-slate-100" style={{ backgroundColor: '#0A1628', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @keyframes rowFlash { 0% { background-color: rgba(250, 204, 21, 0.35); } 100% { background-color: transparent; } }
        @keyframes rowSlide { 0% { transform: translateY(-12px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
        @keyframes kpiIn { 0% { transform: translateY(8px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
      `}</style>

      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(c => !c)}
        operatorName={operatorName}
      />

      <ToastStack toasts={toasts} onToastDismiss={dismissToast} />

      {/* Main content area — offset by sidebar width */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'md:ml-[68px]' : 'md:ml-[220px]'} pb-20 md:pb-0`}>
        <header className="flex flex-col gap-3 border-b border-white/5 bg-[#112240]/80 backdrop-blur-sm p-4 md:flex-row md:items-center md:justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <div className="hidden md:grid h-9 w-9 place-items-center rounded-lg bg-[#FF9933]/10 text-lg">🇮🇳</div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#FF9933]">Municipal Operations Portal</p>
              <h1 className="text-lg font-bold text-white">JanSamvaad ResolveOS</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${socketLive ? 'border-[#138808]/50 bg-[#138808]/20 text-[#22AA22]' : 'border-rose-500/50 bg-rose-500/20 text-rose-200'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${socketLive ? 'animate-pulse bg-[#138808]' : 'bg-rose-300'}`} />
              {socketLive ? 'LIVE' : 'OFFLINE'}
            </div>
            <span className="hidden sm:inline text-xs text-slate-400 font-mono">{formatClock(clock)}</span>
            <button type="button" onClick={handleLogout} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.06] transition-all">Logout</button>
          </div>
        </header>

        <main className="p-4 md:p-6 space-y-4 max-w-[1600px] mx-auto">
          {renderActivePage()}
        </main>
      </div>
    </div>
  );
}
