import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
const API = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const SEVERITY_CLASS_MAP = {
  CRITICAL: 'bg-red-500/20 text-red-300 border border-red-500/50',
  HIGH: 'bg-orange-500/20 text-orange-300 border border-orange-500/50',
  MEDIUM: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50',
  LOW: 'bg-green-500/20 text-green-300 border border-green-500/50'
};

const STATUS_CLASS_MAP = {
  open: 'bg-blue-500/20 text-blue-300 border border-blue-500/50',
  in_progress: 'bg-amber-500/20 text-amber-300 border border-amber-500/50',
  resolved: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
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
    return { label: `BREACHED ${label}`, tone: 'text-red-300', urgent: true };
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
  if (value > 0) return { icon: '▲', cls: 'text-emerald-300', text: `+${value}` };
  if (value < 0) return { icon: '▼', cls: 'text-rose-300', text: `${value}` };
  return { icon: '•', cls: 'text-slate-400', text: '0' };
}

function displayCategory(category) {
  const raw = String(category || '').trim();
  if (!raw || raw.toLowerCase() === 'other') {
    return 'Unclassified';
  }
  return raw;
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
      className="rounded-xl border border-white/10 bg-[#111827] p-4 shadow-lg shadow-black/20 transition-all duration-200 ease-in-out"
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
    <div className="rounded-xl border border-white/10 bg-[#111827] p-4 shadow-lg shadow-black/20">
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
      className={`h-full rounded-xl border border-white/10 bg-[#111827] p-4 shadow-lg shadow-black/20 transition-all duration-300 ${ready ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'}`}
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
                ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-100'
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
              className="pointer-events-auto rounded px-1 text-xs opacity-70 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
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
  const handleResolveClick = useCallback(() => {
    onResolve(ticket.id, 'user');
  }, [onResolve, ticket.id]);
  const handleToggleDetails = useCallback(() => {
    onToggleExpand(ticket.id);
  }, [onToggleExpand, ticket.id]);
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

  return (
    <>
      <tr
        role="row"
        tabIndex={0}
        onKeyDown={handleRowKeyDown}
        aria-label={`Ticket row ${ticket.ref}`}
        className={`border-b border-white/5 transition-all duration-200 ease-in-out hover:bg-slate-800/40 ${
          isBreached || countdown.urgent ? 'animate-pulse border-l-2 border-l-red-500/70' : ''
        } ${isNew ? 'bg-yellow-200/15' : ''}`}
        style={isNew ? { animation: 'rowSlide 300ms ease-out, rowFlash 2s ease-in-out' } : undefined}
      >
        <td role="gridcell" className="px-3 py-3 font-mono text-xs text-cyan-200">{ticket.ref}</td>
        <td role="gridcell" className="px-3 py-3 text-sm font-semibold text-slate-100">{displayCategory(ticket.category)}</td>
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
              aria-label={`Open evidence for ticket ${ticket.ref}`}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-cyan-500/40 text-cyan-300 transition-all duration-200 hover:bg-cyan-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
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
              onClick={handleResolveClick}
              disabled={isResolving || status === 'resolved'}
              aria-label={`Resolve ticket ${ticket.ref}`}
              className="rounded-md border border-emerald-500/40 bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200 shadow-sm transition-all duration-200 hover:bg-emerald-500/30 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isResolving ? 'Resolving…' : status === 'resolved' ? 'Resolved' : 'Resolve'}
            </button>
            <button
              type="button"
              onClick={handleToggleDetails}
              aria-label={`${isExpanded ? 'Collapse' : 'Expand'} details for ticket ${ticket.ref}`}
              className="rounded-md border border-slate-500/40 bg-slate-500/10 px-3 py-1 text-xs font-semibold text-slate-200 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 lg:hidden"
            >
              {isExpanded ? 'Hide' : 'Details'}
            </button>
          </div>
        </td>
      </tr>
      {isExpanded ? (
        <tr role="row" className="bg-slate-900/40 lg:hidden">
          <td role="gridcell" colSpan={9} className="px-3 py-2 text-xs text-slate-300">
            <div className="flex flex-wrap gap-4">
              <span><span className="text-slate-500">Ward:</span> {displayWard(ticket)}</span>
              <span><span className="text-slate-500">Phone:</span> {ticket.phone || maskPhone('')}</span>
            </div>
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
      <p className="text-sm font-semibold text-slate-100">{displayCategory(ticket.category)}</p>
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
          className="w-full rounded-md border border-emerald-500/40 bg-emerald-500/20 px-3 py-2 text-xs font-semibold text-emerald-200 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:opacity-50"
        >
          {isResolving ? 'Resolving…' : status === 'resolved' ? 'Resolved' : 'Resolve'}
        </button>
        {ticket.evidence_url ? (
          <a
            href={ticket.evidence_url}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open evidence for ticket ${ticket.ref}`}
            className="inline-flex w-full items-center justify-center rounded-md border border-cyan-500/40 bg-cyan-500/15 px-3 py-2 text-xs font-semibold text-cyan-200 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
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
  const [tickets, setTickets] = useState([
    {
      id: 101,
      ref: 'GRV-A8D2K9',
      category: 'Pothole',
      ward_id: 1,
      severity: 'HIGH',
      phone: maskPhone('+919812349921'),
      status: 'open',
      created_at: new Date(Date.now() - 20 * 60000).toISOString(),
      sla_deadline: new Date(Date.now() + 90 * 60000).toISOString(),
      evidence_url: null
    },
    {
      id: 102,
      ref: 'GRV-M4Q7L1',
      category: 'Water',
      ward_id: 3,
      severity: 'MEDIUM',
      phone: maskPhone('+917600118245'),
      status: 'in_progress',
      created_at: new Date(Date.now() - 70 * 60000).toISOString(),
      sla_deadline: new Date(Date.now() + 4 * 3600000).toISOString(),
      evidence_url: null
    },
    {
      id: 103,
      ref: 'GRV-T9N3B5',
      category: 'Electricity',
      ward_id: 5,
      severity: 'CRITICAL',
      phone: maskPhone('+919990332211'),
      status: 'open',
      created_at: new Date(Date.now() - 40 * 60000).toISOString(),
      sla_deadline: new Date(Date.now() + 18 * 60000).toISOString(),
      evidence_url: null
    },
    {
      id: 104,
      ref: 'GRV-R2H6C8',
      category: 'Sanitation',
      ward_id: 2,
      severity: 'LOW',
      phone: maskPhone('+918287654310'),
      status: 'resolved',
      created_at: new Date(Date.now() - 8 * 3600000).toISOString(),
      sla_deadline: new Date(Date.now() - 2 * 3600000).toISOString(),
      evidence_url: `${API}/evidence/demo-js-r2h6c8`
    }
  ]);
  const [resolvingTicketIds, setResolvingTicketIds] = useState({});
  const [stats, setStats] = useState({
    total_open: 12,
    total_closed: 85,
    breach_risk: 2
  });
  const [loading, setLoading] = useState(!DEMO_MODE);
  const [error, setError] = useState('');
  const [authToken, setAuthToken] = useState('');
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
    const normalized = {
      ...incoming,
      severity: normalizeSeverity(incoming.severity),
      status: normalizeStatus(incoming.status),
      created_at: incoming.created_at || new Date().toISOString(),
      phone: incoming.phone ? incoming.phone : maskPhone('')
    };
    setTickets((prev) => [normalized, ...prev.filter((item) => item.id !== normalized.id)].slice(0, 200));
  }, []);

  const authFetch = useCallback(async (url, options = {}) => {
    const headers = {
      ...(options.headers || {}),
      Authorization: `Bearer ${authToken}`
    };
    const response = await fetch(url, {
      ...options,
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
          ? nextTickets.map((ticket) => ({
            ...ticket,
            severity: normalizeSeverity(ticket.severity),
            status: normalizeStatus(ticket.status),
            phone: ticket.phone || maskPhone('')
          }))
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
    return [...new Set(tickets.map((ticket) => String(ticket.ward_id ?? 'Unknown')))];
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tickets.filter((ticket) => {
      const status = normalizeStatus(ticket.status);
      const severity = normalizeSeverity(ticket.severity);
      const ward = String(ticket.ward_id ?? 'Unknown');
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
      const response = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
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
      setLoginPassword('');
      setError('');
    } catch (error) {
      setLoginError('Login failed. Check credentials.');
    } finally {
      setLoginSubmitting(false);
    }
  }, [loginPassword, loginUsername]);

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
        className="grid min-h-screen place-items-center p-5 text-slate-100"
        style={{ backgroundColor: '#0a0f1e', fontFamily: "'DM Sans', sans-serif" }}
      >
        <form
          onSubmit={handleLoginSubmit}
          className="w-full max-w-sm rounded-xl border border-white/10 bg-[#111827] p-6 shadow-xl shadow-black/40"
        >
          <h1 className="mb-1 text-xl font-bold text-white">Operator Login</h1>
          <p className="mb-4 text-sm text-slate-400">Sign in to access GrievanceOS dashboard.</p>
          <div className="space-y-3">
            <input
              type="text"
              value={loginUsername}
              onChange={handleLoginUsernameChange}
              placeholder="Username"
              className="w-full rounded-md border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-500/70"
              required
            />
            <input
              type="password"
              value={loginPassword}
              onChange={handleLoginPasswordChange}
              placeholder="Password"
              className="w-full rounded-md border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-500/70"
              required
            />
            {loginError ? (
              <p className="text-xs text-rose-300">{loginError}</p>
            ) : null}
            <button
              type="submit"
              disabled={loginSubmitting}
              className="w-full rounded-md border border-cyan-500/40 bg-cyan-500/20 px-3 py-2 text-sm font-semibold text-cyan-100 transition-all duration-200 hover:bg-cyan-500/30 disabled:opacity-60"
            >
              {loginSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-5 text-slate-100"
      style={{ backgroundColor: '#0a0f1e', fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`
        @keyframes rowFlash { 0% { background-color: rgba(250, 204, 21, 0.35); } 100% { background-color: transparent; } }
        @keyframes rowSlide { 0% { transform: translateY(-12px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
        @keyframes kpiIn { 0% { transform: translateY(8px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
      `}</style>

      <ToastStack toasts={toasts} onToastDismiss={dismissToast} />

      <div className="mx-auto max-w-[1600px] space-y-4">
        <header className="flex flex-col gap-3 rounded-xl border border-white/10 bg-[#111827] p-4 shadow-xl shadow-black/30 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-cyan-500/20 text-cyan-300">🎙️</div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Voice-first Ops</p>
              <h1 className="text-2xl font-bold text-white">GrievanceOS</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${
              socketLive ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-200' : 'border-rose-500/50 bg-rose-500/20 text-rose-200'
            }`}>
              <span className={`h-2 w-2 rounded-full ${socketLive ? 'animate-pulse bg-emerald-300' : 'bg-rose-300'}`} />
              {socketLive ? 'LIVE' : 'OFFLINE'}
            </div>
            <div className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-1 text-xs text-slate-300">
              <span className="mr-2 font-semibold text-slate-100">Clock</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{formatClock(clock)}</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-900/70 px-2 py-1">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-cyan-500/20 text-sm font-bold text-cyan-200">AS</div>
              <p className="hidden text-sm text-slate-200 md:block">A. Singh</p>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded border border-slate-500/40 bg-slate-500/10 px-2 py-1 text-xs font-semibold text-slate-200 transition-all duration-200 hover:bg-slate-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <KPICard title="Total Tickets" value={metrics.total} trend={trends.total} accent="text-cyan-300" delayMs={0} />
          <KPICard title="Open" value={metrics.open} trend={trends.open} accent="text-blue-300" delayMs={100} />
          <KPICard title="SLA Breached" value={metrics.breached} trend={trends.breached} accent="text-red-300" delayMs={200} />
          <KPICard title="Resolved Today" value={metrics.resolvedToday} trend={trends.resolvedToday} accent="text-emerald-300" delayMs={300} />
        </section>

        <SeverityBar tickets={tickets} counts={severityCounts} />

        <section className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_96px] lg:grid-cols-[1fr_320px]">
          <div className="rounded-xl border border-white/10 bg-[#111827] p-4 shadow-xl shadow-black/30">
            <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <h2 className="text-lg font-semibold text-white">Live Ticket Feed</h2>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <input
                  value={searchInput}
                  onChange={handleSearchChange}
                  placeholder="Search ref/category"
                  className="rounded-md border border-white/10 bg-slate-900/70 px-3 py-2 text-xs text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-500/70 focus-visible:ring-2 focus-visible:ring-cyan-400"
                />
                <select
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                  className="rounded-md border border-white/10 bg-slate-900/70 px-2 py-2 text-xs text-slate-100 outline-none focus:border-cyan-500/70 focus-visible:ring-2 focus-visible:ring-cyan-400"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
                <select
                  value={severityFilter}
                  onChange={handleSeverityFilterChange}
                  className="rounded-md border border-white/10 bg-slate-900/70 px-2 py-2 text-xs text-slate-100 outline-none focus:border-cyan-500/70 focus-visible:ring-2 focus-visible:ring-cyan-400"
                >
                  <option value="all">All Severity</option>
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
                <select
                  value={wardFilter}
                  onChange={handleWardFilterChange}
                  className="rounded-md border border-white/10 bg-slate-900/70 px-2 py-2 text-xs text-slate-100 outline-none focus:border-cyan-500/70 focus-visible:ring-2 focus-visible:ring-cyan-400"
                >
                  <option value="all">All Wards</option>
                  {wards.map((ward) => (
                    <option key={ward} value={ward}>{ward}</option>
                  ))}
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
                    <MobileTicketCard
                      key={ticket.id}
                      ticket={ticket}
                      nowMs={nowMs}
                      isBreached={breachTicketIds.includes(ticket.id)}
                      isNew={newTicketIds.includes(ticket.id)}
                      isResolving={Boolean(resolvingTicketIds[ticket.id])}
                      onResolve={handleResolve}
                    />
                  ))}
                  {canLoadMore ? (
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      className="w-full rounded-md border border-white/10 bg-slate-800/70 px-3 py-2 text-xs font-semibold text-slate-200 transition-all duration-200 hover:bg-slate-700/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                    >
                      Load more
                    </button>
                  ) : null}
                </div>
                <div className="hidden overflow-auto md:block">
                <table role="grid" className="min-w-full text-left">
                  <thead className="sticky top-0 z-10 bg-[#0e1528] text-xs uppercase tracking-wide text-slate-400">
                    <tr role="row">
                      <th aria-sort="none" className="px-3 py-2">Ref</th>
                      <th aria-sort="none" className="px-3 py-2">Category</th>
                      <th aria-sort="none" className="hidden px-3 py-2 lg:table-cell">Ward</th>
                      <th aria-sort="none" className="px-3 py-2">Severity</th>
                      <th aria-sort="none" className="px-3 py-2">Status</th>
                      <th aria-sort="none" className="px-3 py-2">SLA Countdown</th>
                      <th aria-sort="none" className="hidden px-3 py-2 lg:table-cell">Phone</th>
                      <th className="px-3 py-2 text-center">Evidence</th>
                      <th className="px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleTickets.map((ticket) => (
                      <TicketRow
                        key={ticket.id}
                        ticket={ticket}
                        nowMs={nowMs}
                        isBreached={breachTicketIds.includes(ticket.id)}
                        isNew={newTicketIds.includes(ticket.id)}
                        isResolving={Boolean(resolvingTicketIds[ticket.id])}
                        onResolve={handleResolve}
                        isExpanded={Boolean(expandedRows[ticket.id])}
                        onToggleExpand={toggleRowExpand}
                        onCollapse={collapseRow}
                      />
                    ))}
                  </tbody>
                </table>
                {canLoadMore ? (
                  <div className="mt-3 text-center">
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      className="rounded-md border border-white/10 bg-slate-800/70 px-4 py-2 text-xs font-semibold text-slate-200 transition-all duration-200 hover:bg-slate-700/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                    >
                      Load more
                    </button>
                  </div>
                ) : null}
              </div>
              </>
            )}
          </div>

          <div aria-live="polite" className="hidden md:block">
            <ActivitySidebar items={activity} ready={sidebarReady} />
          </div>
        </section>
      </div>

      <button
        ref={bellButtonRef}
        type="button"
        onClick={openActivityDrawer}
        aria-label="Open activity notifications"
        className="fixed bottom-5 right-5 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-[#111827] text-xl text-slate-100 shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 md:hidden"
      >
        🔔
        {activityUnread > 0 ? (
          <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white">
            {activityUnread > 99 ? '99+' : activityUnread}
          </span>
        ) : null}
      </button>

      {isActivityDrawerOpen ? (
        <div className="fixed inset-0 z-50 bg-black/60 md:hidden">
          <button
            type="button"
            onClick={closeActivityDrawer}
            className="absolute inset-0 h-full w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            aria-label="Close activity drawer"
          />
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-live="polite"
            className="absolute bottom-0 left-0 right-0 max-h-[72vh] rounded-t-2xl border border-white/10 bg-[#111827] p-4 shadow-2xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-100">Recent Activity</h3>
              <button
                ref={drawerCloseButtonRef}
                type="button"
                onClick={closeActivityDrawer}
                className="rounded-md border border-white/10 px-2 py-1 text-xs text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                Close
              </button>
            </div>
            <div className="h-[52vh] space-y-2 overflow-y-auto">
              {activity.length === 0 ? (
                <p className="text-sm text-slate-500">No live events yet.</p>
              ) : (
                activity.map((item) => (
                  <div key={item.id} className="rounded-lg border border-white/10 bg-slate-900/60 p-2">
                    <p className="text-xs text-slate-200">{item.message}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{formatRelativeTime(item.timestamp)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
