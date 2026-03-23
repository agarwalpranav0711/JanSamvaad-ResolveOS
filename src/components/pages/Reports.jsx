import { useMemo, useCallback } from 'react';

function downloadCSV(tickets) {
  const h = ['ref', 'category', 'ward_id', 'severity', 'status', 'sla_deadline', 'created_at'];
  const rows = tickets.map(t => h.map(k => `"${(t[k] ?? '').toString().replace(/"/g, '""')}"`).join(','));
  const csv = [h.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `report_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}

export default function Reports({ tickets = [] }) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const monthAgo = new Date(now.getTime() - 30 * 86400000);

  const thisWeek = useMemo(() => tickets.filter(t => new Date(t.created_at) >= weekAgo), [tickets]);
  const thisMonth = useMemo(() => tickets.filter(t => new Date(t.created_at) >= monthAgo), [tickets]);

  const weekResolved = thisWeek.filter(t => t.status === 'resolved' || t.status === 'closed').length;
  const monthResolved = thisMonth.filter(t => t.status === 'resolved' || t.status === 'closed').length;
  const weekBreached = thisWeek.filter(t => t.status !== 'resolved' && t.status !== 'closed' && t.sla_deadline && new Date(t.sla_deadline) < now).length;
  const monthBreached = thisMonth.filter(t => t.status !== 'resolved' && t.status !== 'closed' && t.sla_deadline && new Date(t.sla_deadline) < now).length;

  // Top category this week
  const topCat = useMemo(() => {
    const map = {};
    thisWeek.forEach(t => { const c = t.category || 'Other'; map[c] = (map[c] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
  }, [thisWeek]);

  // Worst ward
  const worstWard = useMemo(() => {
    const map = {};
    thisWeek.filter(t => t.status !== 'resolved' && t.status !== 'closed').forEach(t => {
      const w = `Ward ${t.ward_id}`; map[w] = (map[w] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
  }, [thisWeek]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[#f8f5f0]">Reports</h2>
        <p className="text-xs text-[#a3c9aa]/50">Summary reports and data exports</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* This Week */}
        <div className="rounded-2xl border border-white/10 bg-[#0d1117]/80 p-6">
          <h3 className="text-sm font-bold text-[#f8f5f0] mb-4 flex items-center gap-2">
            <span className="text-[#10b981]">📅</span> This Week
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#a3c9aa]/60">Complaints Filed</span>
              <span className="text-sm font-bold text-[#f8f5f0]">{thisWeek.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#a3c9aa]/60">Resolved</span>
              <span className="text-sm font-bold text-[#10b981]">{weekResolved}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#a3c9aa]/60">SLA Breached</span>
              <span className={`text-sm font-bold ${weekBreached > 0 ? 'text-red-400' : 'text-green-400'}`}>{weekBreached}</span>
            </div>
          </div>
        </div>

        {/* This Month */}
        <div className="rounded-2xl border border-white/10 bg-[#0d1117]/80 p-6">
          <h3 className="text-sm font-bold text-[#f8f5f0] mb-4 flex items-center gap-2">
            <span className="text-[#3b82f6]">📅</span> This Month
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#a3c9aa]/60">Complaints Filed</span>
              <span className="text-sm font-bold text-[#f8f5f0]">{thisMonth.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#a3c9aa]/60">Resolved</span>
              <span className="text-sm font-bold text-[#10b981]">{monthResolved}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#a3c9aa]/60">SLA Breached</span>
              <span className={`text-sm font-bold ${monthBreached > 0 ? 'text-red-400' : 'text-green-400'}`}>{monthBreached}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-[#10b981]/20 bg-[#10b981]/5 p-6">
          <p className="text-xs text-[#a3c9aa]/50 mb-1">Top Category This Week</p>
          <p className="text-lg font-bold text-[#10b981] capitalize">{topCat}</p>
        </div>
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
          <p className="text-xs text-[#a3c9aa]/50 mb-1">Worst Performing Ward</p>
          <p className="text-lg font-bold text-red-400">{worstWard}</p>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="flex gap-4">
        <button onClick={() => window.print()} className="px-6 py-3 rounded-xl bg-[#3b82f6]/20 text-[#3b82f6] font-semibold text-sm border border-[#3b82f6]/30 hover:bg-[#3b82f6]/30 transition-all">
          📄 Download PDF
        </button>
        <button onClick={() => downloadCSV(tickets)} className="px-6 py-3 rounded-xl bg-[#10b981]/20 text-[#10b981] font-semibold text-sm border border-[#10b981]/30 hover:bg-[#10b981]/30 transition-all">
          📥 Download CSV
        </button>
      </div>
    </div>
  );
}
