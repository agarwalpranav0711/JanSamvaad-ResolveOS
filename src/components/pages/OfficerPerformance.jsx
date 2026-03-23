import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const MOCK_OFFICERS = [
  { name: 'Priya Sharma', dept: 'Roads', resolved: 45, avgHours: 4.2, slaRate: 96 },
  { name: 'Rahul Verma', dept: 'Water', resolved: 38, avgHours: 5.8, slaRate: 92 },
  { name: 'Anita Patel', dept: 'Sanitation', resolved: 33, avgHours: 6.1, slaRate: 88 },
  { name: 'Vikram Singh', dept: 'Electricity', resolved: 28, avgHours: 7.4, slaRate: 85 },
  { name: 'Meera Gupta', dept: 'General', resolved: 22, avgHours: 8.9, slaRate: 82 },
];

const BADGES = ['🥇', '🥈', '🥉'];
const BAR_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

function calcScore(o) {
  return Math.round(o.resolved * 2 + o.slaRate * 0.5 + (100 / Math.max(o.avgHours, 1)) * 3);
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1f2e] border border-white/10 rounded-lg px-4 py-3 text-xs text-[#f8f5f0] shadow-xl">
      {payload.map((p, i) => <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>)}
    </div>
  );
}

export default function OfficerPerformance({ tickets = [] }) {
  const officers = useMemo(() => {
    return MOCK_OFFICERS.map(o => ({ ...o, score: calcScore(o) })).sort((a, b) => b.score - a.score);
  }, []);

  const chartData = officers.map(o => ({ name: o.name.split(' ')[0], resolved: o.resolved, sla: o.slaRate }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[#f8f5f0]">Officer Performance</h2>
        <p className="text-xs text-[#a3c9aa]/50">Leaderboard and performance metrics</p>
      </div>

      {/* Leaderboard Table */}
      <div className="rounded-2xl border border-white/10 bg-[#0d1117]/80 p-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase text-[#a3c9aa]/50 tracking-widest">
              <th className="pb-3 text-left">Rank</th>
              <th className="pb-3 text-left">Officer</th>
              <th className="pb-3 text-center">Tickets Resolved</th>
              <th className="pb-3 text-center">Avg Time</th>
              <th className="pb-3 text-center">SLA Rate</th>
              <th className="pb-3 text-center">Score</th>
            </tr>
          </thead>
          <tbody>
            {officers.map((o, i) => (
              <tr key={o.name} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="py-3 text-lg">{BADGES[i] || `#${i + 1}`}</td>
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#10b981]/15 flex items-center justify-center text-xs font-bold text-[#10b981]">
                      {o.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-[#f8f5f0] font-medium">{o.name}</p>
                      <p className="text-[10px] text-[#a3c9aa]/40">{o.dept} Dept</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 text-center text-[#10b981] font-bold">{o.resolved}</td>
                <td className="py-3 text-center text-[#a3c9aa]/60">{o.avgHours}h</td>
                <td className="py-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${o.slaRate >= 90 ? 'bg-green-500/15 text-green-300' : 'bg-yellow-500/15 text-yellow-300'}`}>
                    {o.slaRate}%
                  </span>
                </td>
                <td className="py-3 text-center font-bold text-[#f8f5f0]">{o.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Performance Chart */}
      <div className="rounded-2xl border border-white/10 bg-[#0d1117]/80 p-5">
        <h3 className="text-sm font-semibold text-[#f8f5f0] mb-4">Performance Comparison</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#a3c9aa80' }} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#a3c9aa80' }} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="resolved" name="Tickets Resolved" radius={[6, 6, 0, 0]}>
                {chartData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
