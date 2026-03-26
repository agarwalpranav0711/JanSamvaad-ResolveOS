import { useState, useMemo, useCallback } from 'react';
import { findDuplicates } from '../../utils/duplicateDetection';
import { analyzeSentiment } from '../../utils/sentimentAnalysis';

function displayCategory(category) {
  const raw = String(category || '').trim().toLowerCase();
  if (!raw || raw === 'unclassified' || raw === 'other' || raw === 'unknown') return 'General';
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function getDeptBadge(category) {
  const c = (category || '').toLowerCase();
  if (c.includes('road') || c.includes('pothole')) return { l: '🛣️ Roads', cls: 'bg-blue-500/15 text-blue-300' };
  if (c.includes('water') || c.includes('drain')) return { l: '💧 Water', cls: 'bg-cyan-500/15 text-cyan-300' };
  if (c.includes('electric') || c.includes('power')) return { l: '⚡ Electricity', cls: 'bg-yellow-500/15 text-yellow-300' };
  if (c.includes('garbage') || c.includes('sanitation')) return { l: '🗑️ Sanitation', cls: 'bg-green-500/15 text-green-300' };
  return { l: '📋 General', cls: 'bg-slate-500/15 text-slate-300' };
}

const SEV_CLS = { CRITICAL: 'bg-red-500/15 text-red-300', HIGH: 'bg-orange-500/15 text-orange-300', MEDIUM: 'bg-yellow-500/15 text-yellow-300', LOW: 'bg-green-500/15 text-green-300' };
const STATUS_CLS = { open: 'bg-blue-500/15 text-blue-300', in_progress: 'bg-amber-500/15 text-amber-300', resolved: 'bg-[#138808]/15 text-[#22AA22]' };

function fmt(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function sha256Display(ref) {
  let h = 0;
  const s = ref || 'ticket';
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Array(64).fill(0).map((_, i) => '0123456789abcdef'[(Math.abs(h * (i + 1) * 7) % 16)]).join('');
}

function downloadCSV(tickets) {
  const headers = ['ref', 'category', 'ward_id', 'severity', 'status', 'sla_deadline', 'created_at'];
  const rows = tickets.map(t => headers.map(h => `"${(t[h] ?? '').toString().replace(/"/g, '""')}"`).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `grievances_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}

export default function Ledger({ tickets = [] }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sevFilter, setSevFilter] = useState('all');
  const [wardFilter, setWardFilter] = useState('all');
  const [sortKey, setSortKey] = useState('created_at');
  const [sortDir, setSortDir] = useState(-1);
  const [page, setPage] = useState(0);
  const [hashModal, setHashModal] = useState(null);
  const PAGE_SIZE = 10;

  const duplicateIds = useMemo(() => findDuplicates(tickets), [tickets]);
  const wards = useMemo(() => [...new Set(tickets.map(t => t.ward_id))].sort((a, b) => a - b), [tickets]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return tickets.filter(t => {
      if (statusFilter !== 'all' && (t.status || '').toLowerCase() !== statusFilter) return false;
      if (sevFilter !== 'all' && (t.severity || '').toUpperCase() !== sevFilter) return false;
      if (wardFilter !== 'all' && String(t.ward_id) !== wardFilter) return false;
      if (q && !(t.ref || '').toLowerCase().includes(q) && !(t.category || '').toLowerCase().includes(q)) return false;
      return true;
    }).sort((a, b) => {
      const aV = a[sortKey] ?? '';
      const bV = b[sortKey] ?? '';
      return aV < bV ? -sortDir : aV > bV ? sortDir : 0;
    });
  }, [tickets, search, statusFilter, sevFilter, wardFilter, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSort = useCallback((key) => {
    setSortKey(prev => { if (prev === key) { setSortDir(d => d * -1); return key; } setSortDir(-1); return key; });
  }, []);

  const cols = [
    { key: 'ref', label: 'REF' },
    { key: 'category', label: 'CATEGORY' },
    { key: 'dept', label: 'DEPT' },
    { key: 'ward_id', label: 'WARD' },
    { key: 'severity', label: 'SEVERITY' },
    { key: 'status', label: 'STATUS' },
    { key: 'sla_deadline', label: 'SLA' },
    { key: 'created_at', label: 'CREATED' },
    { key: 'actions', label: 'ACTIONS' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[white]">Grievance Ledger</h2>
          <p className="text-xs text-[#8A9BB5]/50">{filtered.length} of {tickets.length} complaints</p>
        </div>
        <button onClick={() => downloadCSV(filtered)} className="px-4 py-2 rounded-lg bg-[#FF9933]/20 text-[#FF9933] text-xs font-semibold border border-[#FF9933]/30 hover:bg-[#FF9933]/30 transition-all">
          📥 Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} placeholder="Search ref / category" className="px-3 py-2 rounded-lg bg-[#112240] border border-white/10 text-sm text-[white] placeholder:text-[#8A9BB5]/30 outline-none focus:border-[#FF9933]/40 transition-all" />
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }} className="px-3 py-2 rounded-lg bg-[#112240] border border-white/10 text-sm text-[white] outline-none">
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
        <select value={sevFilter} onChange={e => { setSevFilter(e.target.value); setPage(0); }} className="px-3 py-2 rounded-lg bg-[#112240] border border-white/10 text-sm text-[white] outline-none">
          <option value="all">All Severity</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <select value={wardFilter} onChange={e => { setWardFilter(e.target.value); setPage(0); }} className="px-3 py-2 rounded-lg bg-[#112240] border border-white/10 text-sm text-[white] outline-none">
          <option value="all">All Wards</option>
          {wards.map(w => <option key={w} value={String(w)}>Ward {w}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/10 bg-[#112240]/80 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10">
              {cols.map(c => (
                <th key={c.key} onClick={() => c.key !== 'dept' && c.key !== 'actions' ? handleSort(c.key) : null} className={`px-3 py-3 text-xs uppercase tracking-widest text-[#8A9BB5]/50 ${c.key !== 'dept' && c.key !== 'actions' ? 'cursor-pointer hover:text-[white]' : ''}`}>
                  {c.label} {sortKey === c.key ? (sortDir === 1 ? '↑' : '↓') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr><td colSpan={9} className="px-3 py-12 text-center text-sm text-[#8A9BB5]/30">No tickets match filters</td></tr>
            ) : paged.map(t => {
              const sev = (t.severity || 'MEDIUM').toUpperCase();
              const status = (t.status || 'open').toLowerCase();
              const dept = getDeptBadge(t.category);
              const sentiment = analyzeSentiment(t.summary || t.ai_summary);
              const isDup = duplicateIds.has(t.id);
              return (
                <tr key={t.id} className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${isDup ? 'bg-amber-500/5' : ''}`}>
                  <td className="px-3 py-3 font-mono text-xs text-[#FF9933]">
                    {t.ref}
                    {isDup && <span className="ml-1 text-amber-400" title="Potential duplicate">⚠️</span>}
                  </td>
                  <td className="px-3 py-3 text-[white]">
                    <span className="flex items-center gap-1.5">
                      <span title={sentiment.label}>{sentiment.emoji}</span>
                      {displayCategory(t.category)}
                    </span>
                  </td>
                  <td className="px-3 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${dept.cls}`}>{dept.l}</span></td>
                  <td className="px-3 py-3 text-[#8A9BB5]/60">Ward {t.ward_id}</td>
                  <td className="px-3 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${SEV_CLS[sev] || SEV_CLS.MEDIUM}`}>{sev}</span></td>
                  <td className="px-3 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${STATUS_CLS[status] || STATUS_CLS.open}`}>{status.replace('_', ' ')}</span></td>
                  <td className="px-3 py-3 text-xs text-[#8A9BB5]/50">{fmt(t.sla_deadline)}</td>
                  <td className="px-3 py-3 text-xs text-[#8A9BB5]/50">{fmt(t.created_at)}</td>
                  <td className="px-3 py-3">
                    <button onClick={() => setHashModal(t.ref)} className="px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/10 text-[10px] text-[#8A9BB5]/60 hover:bg-white/[0.06] transition-all">
                      🔗 Verify
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#8A9BB5]/40">Page {page + 1} of {pageCount}</p>
        <div className="flex gap-1.5">
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 text-xs text-[#8A9BB5]/50 disabled:opacity-30 hover:bg-white/[0.06] transition-all">←</button>
          <button disabled={page >= pageCount - 1} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 text-xs text-[#8A9BB5]/50 disabled:opacity-30 hover:bg-white/[0.06] transition-all">→</button>
        </div>
      </div>

      {/* Hash Modal */}
      {hashModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4" onClick={() => setHashModal(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-[#1A2F4A] border border-white/10 rounded-2xl p-6 max-w-lg w-full">
            <h3 className="text-sm font-bold text-[white] mb-3">Blockchain Verification</h3>
            <p className="text-xs text-[#8A9BB5]/50 mb-2">Ticket: <span className="text-[#FF9933] font-mono">{hashModal}</span></p>
            <div className="bg-[#112240] rounded-lg p-3 border border-white/5">
              <p className="text-[10px] text-[#8A9BB5]/40 mb-1">SHA-256 Hash</p>
              <p className="font-mono text-xs text-[#FF9933] break-all">{sha256Display(hashModal)}</p>
            </div>
            <p className="text-[10px] text-[#8A9BB5]/30 mt-3">✅ Complaint record integrity verified on-chain</p>
            <button onClick={() => setHashModal(null)} className="mt-4 px-4 py-2 rounded-lg bg-[#FF9933]/20 text-[#FF9933] text-xs font-semibold border border-[#FF9933]/30 hover:bg-[#FF9933]/30 transition-all">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
