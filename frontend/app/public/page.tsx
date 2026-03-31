'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import BrandLogo from '@/components/BrandLogo'

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://jansamvaad-backend-608936922611.us-central1.run.app').replace(/\/$/, '')
const API = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`
const CATEGORY_COLORS = ['#F97316', '#16A34A', '#0EA5E9', '#EF4444', '#F59E0B']
type CategoryItem = { name: string; value: number }
type WardItem = { ward: string; open: number }

function formatLastSync(secondsAgo: number): string {
  if (secondsAgo < 5) return 'just now'
  if (secondsAgo < 60) return `${secondsAgo}s ago`
  const minutes = Math.floor(secondsAgo / 60)
  if (minutes < 60) return `${minutes}m ago`
  return `${Math.floor(minutes / 60)}h ago`
}

function getHeatColor(openCount: number): string {
  if (openCount === 0) return 'bg-white/5'
  if (openCount === 1) return 'bg-blue-500/40'
  if (openCount >= 2 && openCount <= 3) return 'bg-orange-500/40'
  return 'bg-red-500/50'
}

const CATEGORY_MAP: Record<string, string> = {
  'road': 'Road Damage',
  'water': 'Water Supply',
  'sanitation': 'Sanitation',
  'electricity': 'Electricity',
  'public_safety': 'Public Safety',
  'other': 'Other'
}

function formatCategoryName(raw: string): string {
  const normalized = String(raw).toLowerCase().trim();
  if (CATEGORY_MAP[normalized]) return CATEGORY_MAP[normalized]
  if (!normalized) return 'Uncategorized'
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

export default function PublicPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastFetched, setLastFetched] = useState<number | null>(null)
  const [secondsAgo, setSecondsAgo] = useState(0)
  const [trackRef, setTrackRef] = useState('')
  const [trackResult, setTrackResult] = useState<any>(null)
  const [trackError, setTrackError] = useState('')
  const [trackLoading, setTrackLoading] = useState(false)

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`${API}/public/stats`)
      if (!response.ok) {
        throw new Error('Failed to load stats')
      }
      const payload = await response.json()
      setData(payload)
      setError('')
      setLastFetched(Date.now())
      setSecondsAgo(0)
    } catch (_) {
      setError('Unable to load transparency data right now.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
    const refreshTimer = setInterval(fetchStats, 30000)
    return () => clearInterval(refreshTimer)
  }, [fetchStats])

  useEffect(() => {
    if (!lastFetched) return undefined
    const timer = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastFetched) / 1000))
    }, 1000)
    return () => clearInterval(timer)
  }, [lastFetched])

  const categoryData = useMemo<CategoryItem[]>(() => {
    if (Array.isArray(data?.category_breakdown) && data.category_breakdown.length > 0) {
      return data.category_breakdown
        .map((item: any) => ({
          name: formatCategoryName(item.name || 'Uncategorized'),
          value: Number(item.value || 0)
        }))
        .slice(0, 5)
    }
    return [
      { name: 'Road Damage', value: 15 },
      { name: 'Garbage Collection', value: 8 },
      { name: 'Water Leakage', value: 14 },
      { name: 'General Complaints', value: 9 },
      { name: 'Electricity Outage', value: 6 }
    ]
  }, [data])

  const wardHeatmap = useMemo<WardItem[]>(() => {
    const fallback = [
      { ward: 'W1', open: 12 }, { ward: 'W2', open: 8 }, { ward: 'W3', open: 24 }, { ward: 'W4', open: 15 }, { ward: 'W5', open: 19 },
      { ward: 'W6', open: 6 }, { ward: 'W7', open: 10 }, { ward: 'W8', open: 22 }, { ward: 'W9', open: 13 }, { ward: 'W10', open: 18 },
      { ward: 'W11', open: 7 }, { ward: 'W12', open: 5 }, { ward: 'W13', open: 16 }, { ward: 'W14', open: 9 }, { ward: 'W15', open: 20 }
    ]
    if (!Array.isArray(data?.ward_stats) || data.ward_stats.length === 0) {
      return fallback
    }
    return data.ward_stats.slice(0, 15).map((entry: any, index: number) => ({
      ward: String(entry.ward || `W${index + 1}`),
      open: Number(entry.open || 0)
    }))
  }, [data])

  const totalTickets = Number(data?.total_tickets || 0)
  const resolutionRate = Number(data?.resolution_rate || 0)
  const avgResolutionHours = Number(data?.avg_resolution_hours || 0)
  const activeIssues = Number(data?.open_count || 0)
  const hasLoadedStats = Boolean(data && Object.keys(data).length > 0)
  const totalCategory = categoryData.reduce((sum: number, item: CategoryItem) => sum + item.value, 0) || 1
  const donutGradient = categoryData
    .map((item: CategoryItem, index: number, list: CategoryItem[]) => {
      const start = (list.slice(0, index).reduce((sum: number, node: CategoryItem) => sum + node.value, 0) / totalCategory) * 360
      const end = ((list.slice(0, index + 1).reduce((sum: number, node: CategoryItem) => sum + node.value, 0)) / totalCategory) * 360
      return `${CATEGORY_COLORS[index % CATEGORY_COLORS.length]} ${start}deg ${end}deg`
    })
    .join(', ')

  const searchStatus = useCallback(async () => {
    const value = trackRef.trim().toUpperCase()
    if (!value) return
    setTrackLoading(true)
    setTrackError('')
    setTrackResult(null)
    try {
      const response = await fetch(`${API}/public/tickets?ref=${encodeURIComponent(value)}`)
      if (!response.ok) {
        throw new Error('Reference number not found')
      }
      const payload = await response.json()
      setTrackResult(payload)
    } catch (_) {
      setTrackError('Reference number not found. Please check and retry.')
    } finally {
      setTrackLoading(false)
    }
  }, [trackRef])

  // Pure SVG Circular Progress
  const circleRadius = 38;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const resolutionDashoffset = circleCircumference - (resolutionRate / 100) * circleCircumference;

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      {/* Navbar Strip */}
      <div className="w-full border-b border-white/10 bg-[#0a0f1e]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
          <BrandLogo />
          <h1 className="text-xl font-bold hidden md:block">Public Transparency Portal</h1>
          <div className="flex items-center justify-end gap-3 text-sm">
            <div className="hidden sm:inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-gray-400">
              <span className="text-xs">Last sync: {formatLastSync(secondsAgo)}</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/20 px-3 py-1 text-[#22C55E]">
              <span className="h-2 w-2 rounded-full bg-[#22C55E] animate-pulse" />
              <span className="font-medium text-xs">Live Data</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
        <header className="mb-10 flex flex-col items-center justify-center text-center gap-4">
          <h1 className="text-3xl font-bold text-white md:text-4xl lg:text-5xl">Real-time civic grievance data <br className="hidden md:block"/> for citizens of New Delhi</h1>
          <p className="mt-2 text-sm text-gray-400 max-w-2xl mx-auto">
            Explore live issues, track their resolution dynamically, and hold the administration accountable.
          </p>
          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-1.5 text-xs text-gray-400">
            <span>🔒 No personal data is shared publicly</span>
          </div>
        </header>

        {error && !hasLoadedStats ? (
          <div className="mb-8 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
            {error}
          </div>
        ) : null}

        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1 — Total Complaints */}
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-50 text-blue-400 group-hover:opacity-100 transition-opacity">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
            <p className="text-sm text-gray-400">Total Complaints</p>
            <p className="mt-3 text-4xl font-bold text-blue-400">{totalTickets.toLocaleString()}</p>
          </div>

          {/* Card 2 — Resolution Rate */}
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 flex flex-row items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Resolution Rate</p>
              <p className="mt-3 text-4xl font-bold text-[#22C55E]">{resolutionRate.toFixed(1)}%</p>
            </div>
            <div className="relative w-[60px] h-[60px]">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r={circleRadius} fill="transparent" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                <circle 
                  cx="50" cy="50" r={circleRadius} 
                  fill="transparent" 
                  stroke="#22C55E" 
                  strokeWidth="6" 
                  strokeLinecap="round"
                  strokeDasharray={circleCircumference}
                  strokeDashoffset={resolutionDashoffset}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
            </div>
          </div>

          {/* Card 3 — Avg Resolution Time */}
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-50 text-[#F97316] group-hover:opacity-100 transition-opacity">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <p className="text-sm text-gray-400">Avg Resolution Time</p>
            <p className="mt-3 text-4xl font-bold text-[#F97316]">{avgResolutionHours.toFixed(1)} <span className="text-2xl font-medium text-gray-400">hrs</span></p>
          </div>

          {/* Card 4 — Active Issues */}
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-50 text-red-400 group-hover:opacity-100 transition-opacity">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
               </svg>
            </div>
            <p className="text-sm text-gray-400">Active Issues</p>
            <p className="mt-3 text-4xl font-bold text-red-500">{activeIssues.toLocaleString()}</p>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* LEFT COL (60%) */}
          <div className="space-y-6 lg:col-span-3">
            
            {/* CATEGORY BREAKDOWN */}
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
              <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
                <h2 className="text-lg font-semibold text-white">Category Breakdown</h2>
              </div>
              
              <div className="flex flex-col items-center gap-8 md:flex-row md:items-start pl-2">
                <div className="relative h-44 w-44 rounded-full border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] flex-shrink-0" style={{ background: `conic-gradient(${donutGradient})` }}>
                  <div className="absolute inset-8 rounded-full bg-[#0a0f1e] shadow-inner" />
                </div>
                
                <div className="w-full flex flex-col gap-3">
                  {categoryData.map((item: CategoryItem, index: number) => {
                    const widthPct = Math.max(2, Math.round((item.value / totalCategory) * 100))
                    const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length]
                    return (
                      <div key={item.name} className="flex flex-col gap-1 w-full">
                        <div className="flex justify-between text-sm items-center">
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                            <span className="text-gray-300 font-medium">{item.name}</span>
                          </div>
                          <span className="text-white font-bold">{item.value.toLocaleString()}</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-1000" style={{ backgroundColor: color, width: `${widthPct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* WARD HEATMAP */}
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
              <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  <h2 className="text-lg font-semibold text-white">Ward Activity Heatmap</h2>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3 md:grid-cols-5">
                {wardHeatmap.map((ward: WardItem) => (
                  <div key={ward.ward} className={`group flex flex-col items-center justify-center rounded-xl border border-white/5 p-3 text-center transition-all hover:scale-105 hover:border-white/20 cursor-default ${getHeatColor(ward.open)}`}>
                     <span className="text-sm font-bold text-white tracking-wide">{ward.ward}</span>
                     <span className="mt-1 text-xs font-medium text-white/80 mix-blend-plus-lighter">{ward.open} Issues</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 text-xs text-gray-500">
                <span>Low</span>
                <div className="flex h-2 w-24 rounded-full overflow-hidden">
                  <div className="h-full flex-1 bg-white/5" />
                  <div className="h-full flex-1 bg-blue-500/40" />
                  <div className="h-full flex-1 bg-orange-500/40" />
                  <div className="h-full flex-1 bg-red-500/50" />
                </div>
                <span>High</span>
              </div>
            </div>
          </div>

          {/* RIGHT COL (40%) */}
          <div className="space-y-6 lg:col-span-2">
            
            {/* COMPLAINT TRACKER */}
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 flex flex-col h-fit">
              <div className="mb-4 flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <h2 className="text-lg font-semibold text-white">Complaint Tracker</h2>
              </div>
              <p className="mb-5 text-sm text-gray-400">Enter your official reference number to check real-time resolution status.</p>
              
              <div className="relative">
                <input
                  value={trackRef}
                  onChange={(event) => setTrackRef(event.target.value)}
                  placeholder="e.g. JS-XXXXXX"
                  className="w-full rounded-xl border border-white/10 bg-[#0a0f1e]/50 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-[#F97316]/50 focus:ring-1 focus:ring-[#F97316]/20 transition-all font-mono uppercase"
                />
              </div>
              
              <button
                type="button"
                onClick={searchStatus}
                disabled={trackLoading}
                className="mt-4 w-full rounded-xl bg-[#F97316] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[#F97316]/20 hover:bg-[#EA580C] hover:shadow-[#F97316]/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {trackLoading ? 'Searching Securely...' : 'Search Status'}
              </button>
              
              {trackError ? <p className="mt-4 text-xs font-medium text-red-400 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20">{trackError}</p> : null}
              
              {trackResult ? (
                <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col gap-3 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#F97316]/5 rounded-full blur-2xl -mr-10 -mt-10" />
                  
                  <div className="flex justify-between items-start z-10">
                    <span className="inline-flex rounded-md bg-[#F97316]/20 px-2 py-1 text-xs font-bold font-mono text-[#F97316] tracking-wider border border-[#F97316]/30">
                      {trackResult.ref}
                    </span>
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold capitalize border 
                      ${trackResult.status === 'resolved' || trackResult.status === 'closed' ? 'bg-[#22C55E]/20 text-[#22C55E] border-[#22C55E]/30' : 
                        trackResult.status === 'in-progress' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 
                        'bg-blue-500/20 text-blue-400 border-blue-500/30'}`}>
                      {trackResult.status}
                    </span>
                  </div>

                  <div className="z-10 mt-1">
                    <p className="text-white font-medium text-sm">{formatCategoryName(trackResult.category)}</p>
                    {trackResult.ward_id && <p className="text-xs text-gray-500 mt-1">Ward {trackResult.ward_id}</p>}
                  </div>
                  
                  {trackResult.status !== 'closed' && trackResult.status !== 'resolved' && trackResult.sla_deadline && (
                    <div className="z-10 bg-[#0a0f1e]/50 border border-white/5 rounded-lg p-2.5 flex items-center gap-2 mt-2 text-xs">
                      <span className="text-gray-400">Target ETA:</span>
                      <span className="font-semibold text-white">{new Date(trackResult.sla_deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* REGISTER A GRIEVANCE */}
            <div className="rounded-2xl border border-[#F97316]/30 bg-gradient-to-br from-white/5 to-[#F97316]/10 p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 mb-2">
                 <svg viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="1.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              </div>
              <h2 className="text-xl font-bold text-white">Register a Grievance</h2>
              <p className="mt-2 text-sm text-gray-300 max-w-[200px]">Skip the typing. Report your issue via voice instantly.</p>
              
              <a
                href="tel:+15706308042"
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#F97316] py-3.5 font-bold text-white shadow-lg shadow-[#F97316]/20 ring-2 ring-[#F97316]/50 ring-offset-2 ring-offset-[#0a0f1e] hover:bg-[#EA580C] hover:scale-[1.02] transition-all"
              >
                Call +1 570 630 8042
              </a>
              
              <div className="flex items-center justify-center space-x-3 mt-5">
                 <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 bg-white/5 px-2 py-1 rounded border border-white/5"><span className="text-[10px]">📞</span> Voice Only</span>
                 <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 bg-white/5 px-2 py-1 rounded border border-white/5"><span className="text-[10px]">🕐</span> 24×7</span>
                 <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 bg-white/5 px-2 py-1 rounded border border-white/5"><span className="text-[10px]">🗣️</span> Hindi & Eng</span>
              </div>
            </div>

          </div>
        </section>

        {loading ? (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-center text-sm font-medium text-gray-400 shadow-sm animate-pulse">
            Securely fetching latest civic data...
          </div>
        ) : null}
      </div>

      <footer className="mt-auto border-t border-white/10 bg-[#0a0f1e]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-6 md:flex-row md:justify-between md:px-6">
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-center md:text-left">
             <BrandLogo />
             <p className="text-xs text-gray-500 font-medium tracking-wide">
               Data refreshes every 30 seconds · Powered by Gemini AI · Google Cloud
             </p>
          </div>
          <div className="flex items-center gap-6 text-sm font-medium text-gray-400">
            <a href="/" className="hover:text-white transition-colors">Home</a>
            <a href="/login" className="hover:text-white transition-colors">Officer Login</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
