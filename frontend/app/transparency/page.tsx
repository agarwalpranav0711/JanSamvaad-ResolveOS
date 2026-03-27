'use client'

import { useState, useMemo, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { AnnouncementTicker } from '@/components/announcement-ticker'
import { IndiaFlag } from '@/components/india-flag'
import { LiveIndicator } from '@/components/live-indicator'
import { StatCard } from '@/components/stat-card'
import { WardHeatmap } from '@/components/ward-heatmap'
import { StatusBadge, SeverityBadge } from '@/components/severity-badge'
import { 
  announcements, 
  generatePlatformStats, 
  generateWardStats, 
  generateTickets 
} from '@/lib/mock-data'
import { 
  ArrowLeft, 
  Search, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Users,
  Server,
  RefreshCw,
  Lock,
  ExternalLink,
  Phone,
  MapPin,
  Calendar,
  AlertCircle
} from 'lucide-react'
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip 
} from 'recharts'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

function TransparencyContent() {
  const searchParams = useSearchParams()
  const refFromUrl = searchParams.get('ref') || ''
  
  const [stats] = useState(() => generatePlatformStats())
  const [wardStats] = useState(() => generateWardStats())
  const [tickets] = useState(() => generateTickets(50))
  const [trackingRef, setTrackingRef] = useState(refFromUrl)
  const [searchedTicket, setSearchedTicket] = useState<typeof tickets[0] | null>(null)
  const [searchError, setSearchError] = useState('')
  const [lastSync, setLastSync] = useState(new Date())
  const [isSearching, setIsSearching] = useState(false)

  // Category breakdown
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {}
    tickets.forEach(t => {
      counts[t.category] = (counts[t.category] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [tickets])

  const COLORS = ['#FF9933', '#1e3a5f', '#138808', '#dc2626', '#f59e0b']

  // Auto-search if ref in URL
  useEffect(() => {
    if (refFromUrl) {
      handleSearch()
    }
  }, [refFromUrl])

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault()
    
    if (!trackingRef.trim()) {
      setSearchError('Please enter a reference number')
      return
    }
    
    setIsSearching(true)
    setSearchError('')
    
    // Simulate search delay
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const found = tickets.find(t => 
      t.ref.toLowerCase() === trackingRef.trim().toLowerCase()
    )
    
    if (found) {
      setSearchedTicket(found)
      setSearchError('')
    } else {
      setSearchedTicket(null)
      setSearchError('No complaint found with this reference number')
    }
    
    setIsSearching(false)
  }

  const handleRefresh = () => {
    setLastSync(new Date())
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Announcement Ticker */}
      <AnnouncementTicker announcements={announcements} />

      {/* Header */}
      <header className="bg-navy text-white">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <IndiaFlag size="lg" />
              <div>
                <p className="text-xs text-white/70 uppercase tracking-wider">Government of India</p>
                <p className="text-sm font-medium">Ministry of Housing & Urban Affairs</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-sm text-white/80 hover:text-white transition-colors">
                Home
              </Link>
              <Link href="/transparency" className="text-sm text-white font-medium">
                Public Data
              </Link>
              <Link href="/login" className="text-sm text-white/80 hover:text-white transition-colors flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Official Login
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Page Header */}
      <section className="bg-gradient-to-b from-navy/5 to-transparent py-8 border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <LiveIndicator label="LIVE DATA" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold">Public Transparency Portal</h1>
              <p className="text-muted-foreground mt-1">
                Real-time civic grievance data for citizens
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Server className="h-4 w-4 text-green-india" />
                <span>Server Status: Online</span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Last sync: {format(lastSync, 'HH:mm:ss')}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Platform Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Complaints"
            value={stats.totalComplaints.toLocaleString()}
            icon={<FileText className="h-5 w-5" />}
          />
          <StatCard
            title="Resolution Rate"
            value={`${stats.resolutionRate}%`}
            variant="success"
            icon={<CheckCircle2 className="h-5 w-5" />}
          />
          <StatCard
            title="Avg Resolution Time"
            value={stats.avgResolutionTime}
            icon={<Clock className="h-5 w-5" />}
          />
          <StatCard
            title="Active Issues"
            value={stats.activeIssues.toLocaleString()}
            variant="warning"
            icon={<Users className="h-5 w-5" />}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Charts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
                <CardDescription>Distribution of complaints by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {categoryData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3">
                    {categoryData.map((item, i) => (
                      <div key={item.name} className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: COLORS[i % COLORS.length] }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium truncate">{item.name}</span>
                            <span className="text-sm font-mono text-muted-foreground">{item.value}</span>
                          </div>
                          <Progress 
                            value={(item.value / tickets.length) * 100} 
                            className="h-1.5 mt-1"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ward Heatmap */}
            <Card>
              <CardHeader>
                <CardTitle>Ward Activity Heatmap</CardTitle>
                <CardDescription>Open complaint volume by ward</CardDescription>
              </CardHeader>
              <CardContent>
                <WardHeatmap wards={wardStats} />
                <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-green-india/30" />
                    <span>Low</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-saffron/50" />
                    <span>Medium</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-warning/70" />
                    <span>High</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-destructive/80" />
                    <span>Critical</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Tracker */}
          <div className="space-y-6">
            {/* Public Complaint Tracker */}
            <Card className="border-2">
              <CardHeader className="text-center pb-3">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Search className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Public Complaint Tracker</CardTitle>
                <CardDescription>
                  Enter your reference number to check status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSearch} className="space-y-3">
                  <div className="relative">
                    <Input
                      placeholder="JS-XXXXXX"
                      value={trackingRef}
                      onChange={(e) => {
                        setTrackingRef(e.target.value.toUpperCase())
                        setSearchError('')
                      }}
                      className="font-mono text-center text-lg h-12 uppercase tracking-wider"
                      maxLength={9}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-11 bg-primary hover:bg-primary/90"
                    disabled={isSearching}
                  >
                    {isSearching ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Track Status
                      </>
                    )}
                  </Button>
                </form>

                {searchError && (
                  <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {searchError}
                  </div>
                )}

                {/* Search Result */}
                {searchedTicket && (
                  <div className="mt-6 space-y-4">
                    <Separator />
                    
                    <div className="space-y-4">
                      {/* Status Header */}
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-primary">{searchedTicket.ref}</span>
                        <StatusBadge status={searchedTicket.status} />
                      </div>

                      {/* Timeline */}
                      <div className="relative pl-6 space-y-4">
                        <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-border" />
                        
                        {/* Created */}
                        <div className="relative">
                          <div className="absolute -left-4 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                          <div>
                            <p className="text-sm font-medium">Complaint Registered</p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {format(searchedTicket.createdAt, 'dd MMM yyyy, HH:mm')}
                            </p>
                          </div>
                        </div>

                        {/* In Progress */}
                        {(searchedTicket.status === 'In-Progress' || searchedTicket.status === 'Resolved') && (
                          <div className="relative">
                            <div className="absolute -left-4 w-3 h-3 rounded-full bg-saffron border-2 border-background" />
                            <div>
                              <p className="text-sm font-medium">In Progress</p>
                              <p className="text-xs text-muted-foreground">Assigned to field team</p>
                            </div>
                          </div>
                        )}

                        {/* Resolved */}
                        {searchedTicket.status === 'Resolved' && (
                          <div className="relative">
                            <div className="absolute -left-4 w-3 h-3 rounded-full bg-green-india border-2 border-background" />
                            <div>
                              <p className="text-sm font-medium text-green-india">Resolved</p>
                              <p className="text-xs text-muted-foreground font-mono">
                                {searchedTicket.closedAt && format(searchedTicket.closedAt, 'dd MMM yyyy, HH:mm')}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* SLA Breached */}
                        {searchedTicket.status === 'SLA Breached' && (
                          <div className="relative">
                            <div className="absolute -left-4 w-3 h-3 rounded-full bg-destructive border-2 border-background animate-pulse" />
                            <div>
                              <p className="text-sm font-medium text-destructive">SLA Breached</p>
                              <p className="text-xs text-muted-foreground">Escalated for priority handling</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Category:</span>
                          <span className="font-medium">{searchedTicket.category}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Ward:</span>
                          <span className="font-medium">{searchedTicket.ward}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <AlertCircle className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Severity:</span>
                          <SeverityBadge severity={searchedTicket.severity} />
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="text-center pt-2">
                        <p className="text-xs text-muted-foreground">
                          For queries, call the helpline with your reference number
                        </p>
                        <p className="font-mono text-sm font-medium mt-1">+1 570 630 8042</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Info */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>Toll-free: <span className="font-mono font-medium">+1 570 630 8042</span></span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Available 24/7</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>New Delhi, India</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-navy text-white py-6 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <IndiaFlag size="sm" />
              <span className="text-sm">JanSamvaad ResolveOS - Government of India</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-white/60">
              <Link href="/" className="hover:text-white">Home</Link>
              <Link href="/login" className="hover:text-white">Official Login</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function TransparencyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    }>
      <TransparencyContent />
    </Suspense>
  )
}
