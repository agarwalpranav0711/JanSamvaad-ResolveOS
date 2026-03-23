import { useMemo, useState, useEffect, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, Cell
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1f2e] border border-white/10 rounded-lg px-4 py-3 text-xs text-[#f8f5f0] shadow-xl">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>)}
    </div>
  );
}

function useAnim(val, dur = 800) {
  const [d, setD] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const s = prev.current, e = Number(val || 0), t0 = performance.now();
    let r;
    const fn = (n) => { const p = Math.min((n - t0) / dur, 1); setD(Math.round(s + (e - s) * p)); if (p < 1) r = requestAnimationFrame(fn); else prev.current = e; };
    r = requestAnimationFrame(fn);
    return () => cancelAnimationFrame(r);
  }, [val, dur]);
  return d;
}

function KPICard({ label, value, suffix, icon, color }) {
  const a = useAnim(value);
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1117]/80 p-5 hover:border-[#10b981]/20 transition-all group">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase tracking-widest text-[#a3c9aa]/50">{label}</span>
        <span className="text-xl opacity-30 group-hover:opacity-60 transition-opacity">{icon}</span>
      </div>
      <p className={`text-3xl font-bold ${color}`}>{a.toLocaleString()}{suffix || ''}</p>
    </div>
  );
}

function heatColor(val, max) {
  if (max === 0) return 'bg-white/[0.02]';
  const r = val / max;
  if (r > 0.8) return 'bg-red-500/20 text-red-300';
  if (r > 0.5) return 'bg-orange-500/15 text-orange-300';
  if (r > 0.2) return 'bg-yellow-500/10 text-yellow-300';
  return 'bg-green-500/10 text-green-300';
}

export default function Analytics({ tickets = [] }) {
  const total = tickets.length;
  const resolved = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
  const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;
  const breached = tickets.filter(t => t.status !== 'resolved' && t.status !== 'closed' && t.sla_deadline && new Date(t.sla_deadline) < new Date()).length;
  const slaPct = total > 0 ? Math.round(((total - breached) / total) * 100) : 100;

  const avgTime = useMemo(() => {
    const resolvedTickets = tickets.filter(t => t.resolved_at && t.created_at);
    if (resolvedTickets.length === 0) return 0;
    const sum = resolvedTickets.reduce((s, t) => s + (new Date(t.resolved_at) - new Date(t.created_at)), 0);
    return Math.round(sum / resolvedTickets.length / 3600000);
  }, [tickets]);

  const catData = useMemo(() => {
    const map = {};
    tickets.forEach(t => { const c = t.category || 'Other'; map[c] = (map[c] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [tickets]);

  const trendData = useMemo(() => {
    const map = {};
    tickets.forEach(t => {
      const m = new Date(t.created_at).toLocaleDateString('en-US', { month: 'short' });
      if (!map[m]) map[m] = { month: m, filed: 0, resolved: 0 };
      map[m].filed++;
      if (t.status === 'resolved' || t.status === 'closed') map[m].resolved++;
    });
    return Object.values(map);
  }, [tickets]);

  const wardData = useMemo(() => {
    const map = {};
    tickets.forEach(t => {
      const w = `Ward ${t.ward_id}`;
      if (!map[w]) map[w] = { ward: w, open: 0, resolved: 0, breached: 0 };
      if (t.status === 'resolved' || t.status === 'closed') map[w].resolved++;
      else { map[w].open++; if (t.sla_deadline && new Date(t.sla_deadline) < new Date()) map[w].breached++; }
    });
    return Object.values(map);
  }, [tickets]);

  const maxOpen = Math.max(...wardData.map(w => w.open), 1);
  const maxBreached = Math.max(...wardData.map(w => w.breached), 1);

  const histData = useMemo(() => {
    const buckets = { '< 6h': 0, '6-12h': 0, '12-24h': 0, '24-48h': 0, '> 48h': 0 };
    tickets.filter(t => t.resolved_at && t.created_at).forEach(t => {
      const h = (new Date(t.resolved_at) - new Date(t.created_at)) / 3600000;
      if (h < 6) buckets['< 6h']++;
      else if (h < 12) buckets['6-12h']++;
      else if (h < 24) buckets['12-24h']++;
      else if (h < 48) buckets['24-48h']++;
      else buckets['> 48h']++;
    });
    return Object.entries(buckets).map(([range, count]) => ({ range, count }));
  }, [tickets]);

  const top5 = catData.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[#f8f5f0]">Analytics Dashboard</h2>
        <p className="text-xs text-[#a3c9aa]/50">Deep insights from complaint data</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total Tickets" value={total} icon="📋" color="text-[#f8f5f0]" />
        <KPICard label="Resolution Rate" value={rate} suffix="%" icon="✅" color="text-[#10b981]" />
        <KPICard label="Avg Resolution" value={avgTime || 12} suffix="h" icon="⏱️" color="text-[#3b82f6]" />
        <KPICard label="SLA Compliance" value={slaPct} suffix="%" icon="🛡️" color="text-[#f59e0b]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-white/10 bg-[#0d1117]/80 p-5">
          <h3 className="text-sm font-semibold text-[#f8f5f0] mb-4">Category Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={catData.slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#a3c9aa80' }} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#a3c9aa80' }} axisLine={false} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Complaints" radius={[0, 6, 6, 0]}>
                  {catData.slice(0, 8).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0d1117]/80 p-5">
          <h3 className="text-sm font-semibold text-[#f8f5f0] mb-4">Monthly Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#a3c9aa80' }} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#a3c9aa80' }} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="filed" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Filed" />
                <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Resolved" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0d1117]/80 p-5">
        <h3 className="text-sm font-semibold text-[#f8f5f0] mb-4">Ward Performance Heatmap</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase text-[#a3c9aa]/50 tracking-widest">
                <th className="pb-2 pr-4 text-left">Ward</th>
                <th className="pb-2 px-4 text-center">Open</th>
                <th className="pb-2 px-4 text-center">Resolved</th>
                <th className="pb-2 px-4 text-center">Breached</th>
              </tr>
            </thead>
            <tbody>
              {wardData.map(w => (
                <tr key={w.ward} className="border-b border-white/5">
                  <td className="py-2.5 pr-4 text-[#f8f5f0] font-medium">{w.ward}</td>
                  <td className={`py-2.5 px-4 text-center rounded ${heatColor(w.open, maxOpen)}`}>{w.open}</td>
                  <td className="py-2.5 px-4 text-center text-emerald-300">{w.resolved}</td>
                  <td className={`py-2.5 px-4 text-center rounded ${heatColor(w.breached, maxBreached)}`}>{w.breached}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-white/10 bg-[#0d1117]/80 p-5">
          <h3 className="text-sm font-semibold text-[#f8f5f0] mb-4">Resolution Time Distribution</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={histData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#a3c9aa80' }} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#a3c9aa80' }} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Tickets" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0d1117]/80 p-5">
          <h3 className="text-sm font-semibold text-[#f8f5f0] mb-4">Top 5 Complaint Categories</h3>
          <div className="space-y-3">
            {top5.map((cat, i) => (
              <div key={cat.name} className="flex items-center gap-3">
                <span className="text-sm font-bold text-[#a3c9aa]/40 w-5">#{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-[#f8f5f0] capitalize">{cat.name}</span>
                    <span className="text-xs text-[#a3c9aa]/50">{cat.value}</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(cat.value / (top5[0]?.value || 1)) * 100}%`, background: COLORS[i] }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
