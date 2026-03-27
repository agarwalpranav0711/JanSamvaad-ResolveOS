'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/$/, '')
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
  if (openCount >= 24) return 'bg-red-500/90'
  if (openCount >= 18) return 'bg-orange-500/90'
  if (openCount >= 12) return 'bg-amber-400/90'
  if (openCount >= 7) return 'bg-lime-400/90'
  return 'bg-emerald-400/90'
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
      const response = await fetch(`${API}/api/public/stats`)
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
          name: String(item.name || 'Uncategorized'),
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
      const response = await fetch(`${API}/api/public/tickets?ref=${encodeURIComponent(value)}`)
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Public Transparency Portal</h1>
            <p className="mt-1 text-sm text-slate-500">Real-time civic grievance data for citizens</p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Live Data
            </div>
            <span className="text-slate-500">Last sync: {formatLastSync(secondsAgo)}</span>
          </div>
        </header>

        {error ? (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Total Complaints</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{totalTickets.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-sm">
            <p className="text-sm text-slate-500">Resolution Rate</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-700">{resolutionRate.toFixed(1)}%</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Avg Resolution Time</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{avgResolutionHours.toFixed(1)} hrs</p>
          </div>
          <div className="rounded-xl border border-orange-200 bg-orange-50/40 p-4 shadow-sm">
            <p className="text-sm text-slate-500">Active Issues</p>
            <p className="mt-2 text-3xl font-semibold text-orange-700">{activeIssues.toLocaleString()}</p>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">Category Breakdown</h2>
              <div className="mt-4 flex flex-col items-center gap-6 md:flex-row md:items-start">
                <div className="relative h-44 w-44 rounded-full border border-slate-200" style={{ background: `conic-gradient(${donutGradient})` }}>
                  <div className="absolute inset-8 rounded-full bg-white" />
                </div>
                <div className="w-full space-y-2">
                  {categoryData.map((item: CategoryItem, index: number) => (
                    <div key={item.name} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }} />
                        <span className="text-sm text-slate-700">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium text-slate-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">Ward Activity Heatmap</h2>
              <p className="mt-1 text-sm text-slate-500">Open complaint volumes by ward</p>
              <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
                {wardHeatmap.map((ward: WardItem) => (
                  <div key={ward.ward} className={`rounded-lg px-3 py-2 text-center text-xs font-semibold text-white ${getHeatColor(ward.open)}`}>
                    <p>{ward.ward}</p>
                    <p className="mt-1 text-[11px] opacity-90">{ward.open}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-lg">🔍</span>
                <h2 className="text-base font-semibold text-slate-900">Public Complaint Tracker</h2>
              </div>
              <p className="mb-4 text-sm text-slate-500">Enter your reference number to check status</p>
              <input
                value={trackRef}
                onChange={(event) => setTrackRef(event.target.value)}
                placeholder="JS-XXXXXX"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#0A2540]"
              />
              <button
                type="button"
                onClick={searchStatus}
                disabled={trackLoading}
                className="mt-3 w-full rounded-lg bg-[#0A2540] px-3 py-2.5 text-sm font-semibold text-white hover:bg-[#11345A] disabled:opacity-60"
              >
                {trackLoading ? 'Searching...' : 'Search Status'}
              </button>
              {trackError ? <p className="mt-3 text-xs text-rose-600">{trackError}</p> : null}
              {trackResult ? (
                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  <p><span className="font-semibold text-slate-800">Ref:</span> {trackResult.ref}</p>
                  <p className="mt-1"><span className="font-semibold text-slate-800">Status:</span> {trackResult.status}</p>
                  <p className="mt-1"><span className="font-semibold text-slate-800">Category:</span> {trackResult.category}</p>
                </div>
              ) : null}
            </div>

            <div className="rounded-xl border border-slate-700 bg-[#1B2130] p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-white">📋 Register a Grievance</h2>
              <p className="mt-2 text-sm text-slate-400">Toll-Free | Hindi & English | No Internet Required</p>
              <a
                href="tel:+15706308042"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#F97316] py-3 font-bold text-white hover:bg-[#EA580C]"
              >
                📞 Toll-Free: +1 570 630 8042
              </a>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
            Refreshing civic data...
          </div>
        ) : null}
      </div>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 text-sm text-slate-500 md:flex-row md:items-center md:justify-between md:px-6">
          <p className="text-slate-600">JanSamvaad - Government of India</p>
          <div className="flex items-center gap-4">
            <a href="/" className="hover:text-slate-900">Home</a>
            <a href="/login" className="hover:text-slate-900">Official Login</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
