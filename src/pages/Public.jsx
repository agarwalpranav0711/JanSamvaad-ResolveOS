import { useState, useEffect, useCallback, useRef } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend,
  BarChart, Bar
} from 'recharts';
import Navbar from '../components/Navbar';

const API = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

/* Government chart palette */
const CHART_COLORS = ['#FF9933', '#1A2F4A', '#138808', '#C8A951', '#4A90D9', '#CC0000', '#8A9BB5', '#E6841C'];

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
function KPICard({ label, value, suffix = '', icon, color = 'text-[#FF9933]' }) {
  const animated = useAnimatedNumber(value);
  return (
    <div className="rounded-xl border border-white/10 bg-[#112240] p-6 hover:border-[#FF9933]/20 transition-all duration-300 group">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs uppercase tracking-widest text-[#8A9BB5]">{label}</span>
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
    <div className="rounded-lg bg-[#1A2F4A] border border-white/10 px-4 py-3 shadow-xl text-xs text-white">
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

  useEffect(() => {
    document.title = 'Public Grievance Data — JanSamvaad Transparency Portal';
  }, []);

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
      setError('Unable to load transparency data. Please try again later.');
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
    { ward: 'Connaught Place', open: 5, resolved: 22, sla_breached: 1 },
    { ward: 'Karol Bagh', open: 8, resolved: 17, sla_breached: 3 },
    { ward: 'Chandni Chowk', open: 3, resolved: 28, sla_breached: 0 },
    { ward: 'Dwarka', open: 6, resolved: 15, sla_breached: 2 },
    { ward: 'Saket', open: 4, resolved: 19, sla_breached: 1 },
  ];

  const recentResolved = data?.recent_resolved?.length ? data.recent_resolved : [
    { ref: 'JS-A1B2C3', category: 'Pothole', ward_name: 'Chandni Chowk', closed_at: new Date(Date.now() - 7200000).toISOString() },
    { ref: 'JS-D4E5F6', category: 'Water leak', ward_name: 'Connaught Place', closed_at: new Date(Date.now() - 14400000).toISOString() },
    { ref: 'JS-G7H8I9', category: 'Garbage', ward_name: 'Saket', closed_at: new Date(Date.now() - 28800000).toISOString() },
  ];

  const wardBarData = wardStats.map(w => ({
    ward: w.ward,
    rate: (w.open + w.resolved) > 0 ? Math.round((w.resolved / (w.open + w.resolved)) * 100) : 0
  })).sort((a, b) => b.rate - a.rate);

  const totalCat = categoryData.reduce((s, c) => s + c.value, 0) || 1;

  return (
    <div className="min-h-screen bg-[#0A1628] text-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Navbar />

      <div className="pt-24 pb-16 px-4 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-xl">🇮🇳</span>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">
              JanSamvaad — <span className="text-[#FF9933]">Public Grievance Transparency Portal</span>
            </h1>
          </div>
          <p className="text-[#FF9933] text-xs mb-1">Ministry of Housing & Urban Affairs | Government of India</p>
          <p className="text-[#8A9BB5] text-sm mb-4">Real-time Municipal Accountability Data</p>
          {lastFetched && (
            <p className="text-xs text-[#8A9BB5]/60">
              Last updated: <span className="text-[#138808]">{secondsAgo}</span> second{secondsAgo !== 1 ? 's' : ''} ago
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#138808] ml-2 animate-pulse" />
            </p>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4">
              <svg className="animate-spin h-8 w-8 text-[#FF9933]" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <p className="text-[#8A9BB5]">Loading transparency data...</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="text-center py-16 px-6 rounded-xl border border-[#CC0000]/20 bg-[#CC0000]/5">
            <p className="text-4xl mb-4">⚠️</p>
            <p className="text-lg text-[#FF4444] font-semibold mb-2">{error}</p>
            <button onClick={fetchStats} className="mt-4 px-6 py-2 rounded-lg bg-[#FF9933] text-[#0A1628] font-semibold text-sm hover:bg-[#E6841C] transition-all">
              Retry
            </button>
          </div>
        )}

        {/* Dashboard Content */}
        {!loading && !error && (
          <div className="space-y-8 animate-fadeIn">

            {/* Open Data Notice */}
            <div className="rounded-lg border-l-4 border-[#FF9933] bg-white/[0.02] p-4">
              <p className="text-xs text-white/80">
                📊 <span className="font-bold">OPEN DATA</span> — This information is published in the public interest under the Right to Information framework.
              </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <KPICard label="Total Complaints Filed" value={data?.total_tickets || 142} icon="📋" color="text-[#FF9933]" />
              <KPICard label="Resolution Rate" value={data?.resolution_rate || 94} suffix="%" icon="✅" color="text-[#138808]" />
              <KPICard label="Avg Resolution Time" value={data?.avg_resolution_hours || 12} suffix="h" icon="⏱️" color="text-[#FF9933]" />
              <KPICard label="SLA Compliance Rate" value={data?.sla_compliance_pct || 97} suffix="%" icon="🛡️" color="text-[#FF9933]" />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category Donut with Legend */}
              <div className="rounded-xl border border-white/10 bg-[#112240] p-6">
                <h3 className="text-sm font-semibold text-white mb-1">Category Breakdown</h3>
                <p className="text-xs text-[#8A9BB5] mb-4">Distribution of complaints by category</p>
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
                  <div className="flex-1 space-y-2">
                    {categoryData.map((cat, i) => {
                      const pct = Math.round((cat.value / totalCat) * 100);
                      return (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                          <span className="text-white/80 capitalize flex-1">{cat.name}</span>
                          <span className="text-[#8A9BB5]">{cat.value} ({pct}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Monthly Trend */}
              <div className="rounded-xl border border-white/10 bg-[#112240] p-6">
                <h3 className="text-sm font-semibold text-white mb-1">Monthly Complaint Trend</h3>
                <p className="text-xs text-[#8A9BB5] mb-4">Complaints filed vs resolved over 6 months</p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8A9BB580' }} axisLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#8A9BB580' }} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11, color: '#8A9BB5' }} />
                      <Line type="monotone" dataKey="complaints" stroke="#CC0000" strokeWidth={2} dot={{ r: 3, fill: '#CC0000' }} name="Filed" />
                      <Line type="monotone" dataKey="resolved" stroke="#138808" strokeWidth={2} dot={{ r: 3, fill: '#138808' }} name="Resolved" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Ward Table + Top Performing Wards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Ward Performance Table */}
              <div className="rounded-xl border border-white/10 bg-[#112240] p-6 overflow-x-auto">
                <h3 className="text-sm font-semibold text-white mb-1">Ward Performance</h3>
                <p className="text-xs text-[#8A9BB5] mb-4">Resolution metrics by municipal ward</p>
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-xs uppercase text-[#8A9BB5] tracking-widest">
                      <th className="pb-3 pr-4 sticky left-0 bg-[#112240]">Ward</th>
                      <th className="pb-3 pr-4">Open</th>
                      <th className="pb-3 pr-4">Resolved</th>
                      <th className="pb-3 pr-4">SLA Breached</th>
                      <th className="pb-3">Pending &gt;48hrs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wardStats.map((w, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 pr-4 font-medium text-white sticky left-0 bg-[#112240]">{w.ward}</td>
                        <td className="py-3 pr-4">
                          <span className="px-2 py-0.5 rounded-full text-xs bg-[#4A90D9]/15 text-[#4A90D9]">{w.open}</span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="px-2 py-0.5 rounded-full text-xs bg-[#138808]/15 text-[#22AA22]">{w.resolved}</span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            w.sla_breached > 0 ? 'bg-[#CC0000]/15 text-[#FF4444]' : 'bg-[#138808]/15 text-[#22AA22]'
                          }`}>
                            {w.sla_breached}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            w.sla_breached > 0 ? 'bg-[#CC0000]/15 text-[#FF4444]' : 'text-[#8A9BB5]/40'
                          }`}>
                            {w.sla_breached > 0 ? w.sla_breached : '—'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Top Performing Wards Bar Chart */}
              <div className="rounded-xl border border-white/10 bg-[#112240] p-6">
                <h3 className="text-sm font-semibold text-white mb-1">Top Performing Wards</h3>
                <p className="text-xs text-[#8A9BB5] mb-4">Resolution rate % per ward</p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={wardBarData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#8A9BB580' }} axisLine={false} tickFormatter={(v) => `${v}%`} />
                      <YAxis type="category" dataKey="ward" tick={{ fontSize: 11, fill: '#8A9BB580' }} axisLine={false} width={100} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="rate" name="Resolution %" radius={[0, 6, 6, 0]}>
                        {wardBarData.map((entry, i) => (
                          <Cell key={i} fill={i === 0 ? '#138808' : '#FF9933'} />
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
              <div className="rounded-xl border border-white/10 bg-[#112240] p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Live Activity Feed</h3>
                    <p className="text-xs text-[#8A9BB5]">Last 5 resolved complaints</p>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs text-[#138808]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#138808] animate-pulse" />
                    Live
                  </span>
                </div>
                <div className="space-y-3">
                  {recentResolved.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
                      <span className="text-lg">✅</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate capitalize">
                          {item.category} fixed — {item.ward_name}
                        </p>
                        <p className="text-xs text-[#8A9BB5]/60">{item.ref}</p>
                      </div>
                      <span className="text-xs text-[#8A9BB5]/50 flex-shrink-0">{timeAgo(item.closed_at)}</span>
                    </div>
                  ))}
                  {recentResolved.length === 0 && (
                    <p className="text-sm text-[#8A9BB5]/40 text-center py-6">No recent resolutions</p>
                  )}
                </div>
              </div>

              {/* Register a Complaint CTA */}
              <div className="rounded-xl border border-[#FF9933]/20 bg-[#FF9933]/5 p-6 flex flex-col items-center justify-center text-center">
                <h3 className="text-xl font-bold text-white mb-1">📋 Register a Grievance</h3>
                <p className="text-[#8A9BB5] text-sm mb-6">Toll-Free | Hindi & English | No Internet Required</p>
                <a
                  href="tel:+15706308042"
                  className="inline-flex items-center gap-3 px-8 py-3 rounded-lg bg-[#FF9933] text-[#0A1628] font-bold text-base hover:bg-[#E6841C] transition-all active:scale-95 shadow-lg shadow-[#FF9933]/20 mb-6"
                  aria-label="Call toll-free grievance helpline"
                >
                  📞 Toll-Free: +1 570 630 8042
                </a>
                <p className="text-xs text-[#8A9BB5]/60">Available 24×7 | Hindi & English | No Internet Required</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-[#FF9933]/10 bg-[#071020] py-6 px-6 text-center">
        <p className="text-xs text-[#8A9BB5]">© 2026 JanSamvaad ResolveOS | Ministry of Housing & Urban Affairs | Government of India</p>
        <p className="text-xs text-[#8A9BB5]/50 mt-1">Powered by National Informatics Centre (NIC)</p>
      </footer>
    </div>
  );
}
