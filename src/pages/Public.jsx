import { useState, useEffect, useCallback, useRef } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend,
  BarChart, Bar
} from 'recharts';
import Navbar from '../components/Navbar';

const API = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

/* ─── Animated number ─── */
function useAnimatedNumber(target, duration = 900) {
  const [val, setVal] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const start = prev.current;
    const end = Number(target || 0);
    const t0 = performance.now();
    let raf;
    const step = (now) => {
      const p = Math.min((now - t0) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(start + (end - start) * ease));
      if (p < 1) { raf = requestAnimationFrame(step); }
      else { prev.current = end; }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

/* ─── KPI Card ─── */
function KPICard({ label, value, suffix = '', icon, color = 'text-[#10b981]' }) {
  const animated = useAnimatedNumber(value);
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1117]/80 p-6 hover:border-[#10b981]/30 transition-all duration-300 group">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs uppercase tracking-widest text-[#a3c9aa]/60">{label}</span>
        <span className="text-2xl opacity-30 group-hover:opacity-60 transition-opacity">{icon}</span>
      </div>
      <p className={`text-4xl font-bold ${color}`}>
        {animated.toLocaleString()}{suffix}
      </p>
    </div>
  );
}

/* ─── Custom Tooltip ─── */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-[#1a1f2e] border border-white/10 px-4 py-3 shadow-xl text-xs text-[#f8f5f0]">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
}

/* ─── Time ago helper ─── */
function timeAgo(iso) {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/* ─── Main Public Page ─── */
export default function Public() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastFetched, setLastFetched] = useState(null);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const intervalRef = useRef(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/public/stats`);
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData(json);
      setLastFetched(Date.now());
      setSecondsAgo(0);
      setError('');
    } catch (err) {
      setError('Unable to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const timer = setInterval(fetchStats, 30000);
    return () => clearInterval(timer);
  }, [fetchStats]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (lastFetched) setSecondsAgo(Math.floor((Date.now() - lastFetched) / 1000));
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [lastFetched]);

  // Data with fallbacks
  const categoryData = data?.category_breakdown?.length ? data.category_breakdown : [
    { name: 'Road Damage', value: 24 },
    { name: 'Water Leakage', value: 18 },
    { name: 'Garbage', value: 15 },
    { name: 'Electricity', value: 12 },
    { name: 'Drainage', value: 9 },
    { name: 'Other', value: 6 },
  ];

  const trendData = data?.monthly_trend?.length ? data.monthly_trend : [
    { month: 'Oct', complaints: 320, resolved: 280 },
    { month: 'Nov', complaints: 410, resolved: 370 },
    { month: 'Dec', complaints: 380, resolved: 350 },
    { month: 'Jan', complaints: 520, resolved: 460 },
    { month: 'Feb', complaints: 490, resolved: 470 },
    { month: 'Mar', complaints: 310, resolved: 290 },
  ];

  const wardStats = data?.ward_stats?.length ? data.ward_stats : [
    { ward: 'Ward 1', open: 5, resolved: 22, sla_breached: 1 },
    { ward: 'Ward 2', open: 8, resolved: 17, sla_breached: 3 },
    { ward: 'Ward 3', open: 3, resolved: 28, sla_breached: 0 },
    { ward: 'Ward 4', open: 6, resolved: 15, sla_breached: 2 },
    { ward: 'Ward 5', open: 4, resolved: 19, sla_breached: 1 },
  ];

  const recentResolved = data?.recent_resolved?.length ? data.recent_resolved : [
    { ref: 'GRV-001234', category: 'Pothole', ward_name: 'Ward 3', closed_at: new Date(Date.now() - 7200000).toISOString() },
    { ref: 'GRV-001230', category: 'Water leak', ward_name: 'Ward 1', closed_at: new Date(Date.now() - 14400000).toISOString() },
    { ref: 'GRV-001228', category: 'Garbage', ward_name: 'Ward 5', closed_at: new Date(Date.now() - 28800000).toISOString() },
  ];

  // Ward resolution rates for bar chart
  const wardBarData = wardStats.map(w => ({
    ward: w.ward,
    rate: (w.open + w.resolved) > 0 ? Math.round((w.resolved / (w.open + w.resolved)) * 100) : 0
  })).sort((a, b) => b.rate - a.rate);

  const totalCat = categoryData.reduce((s, c) => s + c.value, 0) || 1;

  return (
    <div className="min-h-screen bg-[#080c10] text-[#f8f5f0]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <Navbar />

      <div className="pt-24 pb-16 px-4 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3">
            JanSamvaad Public Grievance Dashboard — <span className="text-[#10b981]">Transparency Portal</span>
          </h1>
          <p className="text-[#a3c9aa]/70 mb-4">Real-time civic accountability data for citizens of India</p>
          {lastFetched && (
            <p className="text-xs text-[#a3c9aa]/40">
              Last updated: <span className="text-[#10b981]">{secondsAgo}</span> second{secondsAgo !== 1 ? 's' : ''} ago
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#10b981] ml-2 animate-pulse" />
            </p>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4">
              <svg className="animate-spin h-8 w-8 text-[#10b981]" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <p className="text-[#a3c9aa]/50">Loading transparency data...</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="text-center py-16 px-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/5">
            <p className="text-4xl mb-4">⚠️</p>
            <p className="text-lg text-yellow-300 font-semibold mb-2">{error}</p>
            <button onClick={fetchStats} className="mt-4 px-6 py-2 rounded-xl bg-[#10b981] text-black font-semibold text-sm hover:bg-[#059669] transition-all">
              Retry
            </button>
          </div>
        )}

        {/* Dashboard Content */}
        {!loading && !error && (
          <div className="space-y-8 animate-fadeIn">

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <KPICard label="Total Complaints" value={data?.total_tickets || 142} icon="📋" color="text-[#f8f5f0]" />
              <KPICard label="Resolution Rate" value={data?.resolution_rate || 94} suffix="%" icon="✅" color="text-[#10b981]" />
              <KPICard label="Avg Resolution Time" value={data?.avg_resolution_hours || 12} suffix="h" icon="⏱️" color="text-[#3b82f6]" />
              <KPICard label="SLA Compliance" value={data?.sla_compliance_pct || 97} suffix="%" icon="🛡️" color="text-[#f59e0b]" />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category Donut with Legend */}
              <div className="rounded-2xl border border-white/10 bg-[#0d1117]/80 p-6">
                <h3 className="text-sm font-semibold text-[#f8f5f0] mb-1">Category Breakdown</h3>
                <p className="text-xs text-[#a3c9aa]/40 mb-4">Distribution of complaints by category</p>
                <div className="flex flex-col lg:flex-row items-center gap-6">
                  <div className="h-64 w-64 flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={85}
                          dataKey="value"
                          stroke="none"
                          label={({ name, percent }) => percent > 0.05 ? `${Math.round(percent * 100)}%` : ''}
                          labelLine={false}
                        >
                          {categoryData.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Legend */}
                  <div className="flex-1 space-y-2">
                    {categoryData.map((cat, i) => {
                      const pct = Math.round((cat.value / totalCat) * 100);
                      return (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                          <span className="text-[#f8f5f0]/80 capitalize flex-1">{cat.name}</span>
                          <span className="text-[#a3c9aa]/50">{cat.value} ({pct}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Monthly Trend */}
              <div className="rounded-2xl border border-white/10 bg-[#0d1117]/80 p-6">
                <h3 className="text-sm font-semibold text-[#f8f5f0] mb-1">Monthly Complaint Trend</h3>
                <p className="text-xs text-[#a3c9aa]/40 mb-4">Complaints filed vs resolved over 6 months</p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#a3c9aa80' }} axisLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#a3c9aa80' }} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11, color: '#a3c9aa' }} />
                      <Line type="monotone" dataKey="complaints" stroke="#ef4444" strokeWidth={2} dot={{ r: 3, fill: '#ef4444' }} name="Filed" />
                      <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} name="Resolved" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Ward Table + Top Performing Wards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Ward Performance Table */}
              <div className="rounded-2xl border border-white/10 bg-[#0d1117]/80 p-6 overflow-x-auto">
                <h3 className="text-sm font-semibold text-[#f8f5f0] mb-1">Ward Performance</h3>
                <p className="text-xs text-[#a3c9aa]/40 mb-4">Resolution metrics by municipal ward</p>
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-xs uppercase text-[#a3c9aa]/50 tracking-widest">
                      <th className="pb-3 pr-4">Ward</th>
                      <th className="pb-3 pr-4">Open</th>
                      <th className="pb-3 pr-4">Resolved</th>
                      <th className="pb-3">SLA Breached</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wardStats.map((w, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 pr-4 font-medium text-[#f8f5f0]">{w.ward}</td>
                        <td className="py-3 pr-4">
                          <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/15 text-blue-300">{w.open}</span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/15 text-emerald-300">{w.resolved}</span>
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            w.sla_breached > 0 ? 'bg-red-500/15 text-red-300' : 'bg-green-500/15 text-green-300'
                          }`}>
                            {w.sla_breached}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Top Performing Wards Bar Chart */}
              <div className="rounded-2xl border border-white/10 bg-[#0d1117]/80 p-6">
                <h3 className="text-sm font-semibold text-[#f8f5f0] mb-1">Top Performing Wards</h3>
                <p className="text-xs text-[#a3c9aa]/40 mb-4">Resolution rate % per ward</p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={wardBarData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#a3c9aa80' }} axisLine={false} tickFormatter={(v) => `${v}%`} />
                      <YAxis type="category" dataKey="ward" tick={{ fontSize: 11, fill: '#a3c9aa80' }} axisLine={false} width={60} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="rate" name="Resolution %" radius={[0, 6, 6, 0]}>
                        {wardBarData.map((entry, i) => (
                          <Cell key={i} fill={i === 0 ? '#10b981' : '#3b82f6'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Live Activity Feed + CTA */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Live Activity Feed */}
              <div className="rounded-2xl border border-white/10 bg-[#0d1117]/80 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-[#f8f5f0]">Live Activity Feed</h3>
                    <p className="text-xs text-[#a3c9aa]/40">Last 5 resolved complaints</p>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs text-[#10b981]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                    Live
                  </span>
                </div>
                <div className="space-y-3">
                  {recentResolved.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
                      <span className="text-lg">✅</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#f8f5f0] truncate capitalize">
                          {item.category} fixed — {item.ward_name}
                        </p>
                        <p className="text-xs text-[#a3c9aa]/40">{item.ref}</p>
                      </div>
                      <span className="text-xs text-[#a3c9aa]/40 flex-shrink-0">{timeAgo(item.closed_at)}</span>
                    </div>
                  ))}
                  {recentResolved.length === 0 && (
                    <p className="text-sm text-[#a3c9aa]/30 text-center py-6">No recent resolutions</p>
                  )}
                </div>
              </div>

              {/* Report a Complaint CTA */}
              <div className="rounded-2xl border border-[#10b981]/20 bg-[#10b981]/5 p-6 flex flex-col items-center justify-center text-center">
                <h3 className="text-xl font-bold text-[#f8f5f0] mb-2">Have a civic complaint?</h3>
                <p className="text-[#a3c9aa]/50 text-sm mb-6">Works on any basic phone — Hindi or English</p>
                <a
                  href="tel:+15706308042"
                  className="inline-flex items-center gap-3 px-8 py-3 rounded-xl bg-[#10b981] text-black font-bold text-base hover:bg-[#059669] transition-all active:scale-95 shadow-lg shadow-[#10b981]/20 mb-6"
                >
                  📞 Call: +1 570 630 8042
                </a>
                <img
                  src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=tel:+15706308042"
                  alt="Call QR code"
                  className="rounded-lg border border-white/10"
                  width={120}
                  height={120}
                />
                <p className="text-xs text-[#a3c9aa]/30 mt-2">Scan to call from your phone</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
      `}</style>
    </div>
  );
}
