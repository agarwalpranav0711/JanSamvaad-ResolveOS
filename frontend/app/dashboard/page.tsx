'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { StatCard } from '@/components/stat-card'
import { SeverityBadge, StatusBadge } from '@/components/severity-badge'
import { SLACountdown } from '@/components/sla-countdown'
import { WardHeatmap } from '@/components/ward-heatmap'
import { ActivityFeed } from '@/components/activity-feed'
import { LiveIndicator } from '@/components/live-indicator'
import { 
  generateTickets, 
  generateWardStats, 
  generatePlatformStats, 
  generateActivities 
} from '@/lib/mock-data'
import type { Ticket, TicketStatus, TicketSeverity } from '@/lib/types'
import { 
  FileText, 
  FolderOpen, 
  AlertTriangle, 
  CheckCircle2, 
  Search,
  Filter,
  Brain,
  MapPin,
  ExternalLink,
  ChevronRight,
  Sparkles,
  ArrowUpRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip,
  Legend 
} from 'recharts'

export default function DashboardPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [wardStats] = useState(() => generateWardStats())
  const [stats] = useState(() => generatePlatformStats())
  const [activityNow, setActivityNow] = useState<number | null>(null)
  const [activitySort, setActivitySort] = useState<'newest' | 'oldest' | 'critical' | 'type'>('newest')
  const [activityFilter, setActivityFilter] = useState<'all' | 'breached' | 'resolved' | 'created' | 'updated'>('all')
  
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [wardFilter, setWardFilter] = useState<string>('all')
  
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [resolveModalOpen, setResolveModalOpen] = useState(false)
  const [resolutionStatus, setResolutionStatus] = useState('Resolved')
  const [resolutionSummary, setResolutionSummary] = useState('')
  const [evidenceUrl, setEvidenceUrl] = useState('')

  const mapTicket = (t: any): Ticket => {
    const severityMap: Record<string, TicketSeverity> = {
      High: 'HIGH',
      Medium: 'MEDIUM',
      Low: 'LOW',
      CRITICAL: 'CRITICAL',
      HIGH: 'HIGH',
      MEDIUM: 'MEDIUM',
      LOW: 'LOW'
    }
    const statusMap: Record<string, TicketStatus> = {
      open: 'Open',
      closed: 'Resolved',
      Open: 'Open',
      Resolved: 'Resolved',
      'In-Progress': 'In-Progress',
      'SLA Breached': 'SLA Breached'
    }
    const wardId = Number(t.ward_id)
    const hasWard = Number.isFinite(wardId) && wardId > 0
    return {
      id: String(t.ref || t.id),
      ref: String(t.ref || t.id || ''),
      category: (t.category || 'General Complaint') as Ticket['category'],
      severity: severityMap[String(t.severity)] || 'LOW',
      status: statusMap[String(t.status)] || 'Open',
      ward: hasWard ? `Ward ${wardId}` : 'Unknown',
      wardId: hasWard ? wardId : 0,
      phone: String(t.phone || ''),
      maskedPhone: String(t.phone || ''),
      createdAt: t.created_at ? new Date(t.created_at) : new Date(),
      slaDeadline: t.sla_deadline ? new Date(t.sla_deadline) : new Date(Date.now() + 24 * 60 * 60 * 1000),
      description: 'Voice complaint received',
      aiAnalysis: 'AI analysis will be available shortly.',
      suggestedActions: ['Review complaint details', 'Assign to ward operations team', 'Track SLA compliance'],
      location: {
        lat: 28.6139,
        lng: 77.2090,
        address: hasWard ? `Ward ${wardId}` : 'Location unavailable'
      },
      evidenceUrl: t.evidence_url || undefined,
      closedAt: t.closed_at ? new Date(t.closed_at) : undefined
    }
  }

  useEffect(() => {
    let isMounted = true
    const fetchTickets = async () => {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token')
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tickets`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        if (!res.ok) throw new Error('Failed to fetch tickets')
        const data = await res.json()
        if (isMounted) {
          setTickets((data.tickets || data).map(mapTicket))
        }
      } catch (err) {
        console.error('[dashboard] ticket fetch failed:', err)
        if (isMounted) {
          setTickets(generateTickets(50))
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchTickets()
    const interval = setInterval(fetchTickets, 10000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    setActivityNow(Date.now())
  }, [])

  const activities = useMemo(() => {
    if (activityNow === null) {
      return []
    }
    return generateActivities(15, activityNow)
  }, [activityNow])

  // Filter tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      const matchesSearch = searchQuery === '' || 
        ticket.ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.category.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter
      const matchesSeverity = severityFilter === 'all' || ticket.severity === severityFilter
      const matchesWard = wardFilter === 'all' || ticket.ward === wardFilter
      
      return matchesSearch && matchesStatus && matchesSeverity && matchesWard
    })
  }, [tickets, searchQuery, statusFilter, severityFilter, wardFilter])

  // Category breakdown for chart
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {}
    tickets.forEach(t => {
      counts[t.category] = (counts[t.category] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [tickets])

  // Severity distribution
  const severityData = useMemo(() => {
    const counts: Record<string, number> = {}
    tickets.forEach(t => {
      counts[t.severity] = (counts[t.severity] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [tickets])

  const CATEGORY_COLORS = ['#FF9933', '#1e3a5f', '#138808', '#dc2626', '#f59e0b']
  const SEVERITY_COLORS = {
    CRITICAL: '#dc2626',
    HIGH: '#f59e0b',
    MEDIUM: '#FF9933',
    LOW: '#138808'
  }

  const handleResolve = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setResolveModalOpen(true)
  }

  const handleSubmitResolution = () => {
    if (!resolutionSummary.trim()) {
      toast.error('Please provide a resolution summary')
      return
    }
    
    toast.success(`Ticket ${selectedTicket?.ref} resolved successfully!`)
    setResolveModalOpen(false)
    setResolutionSummary('')
    setEvidenceUrl('')
  }

  const visibleActivities = useMemo(() => {
    const filtered = activities.filter((activity) => {
      if (activityFilter === 'all') return true
      if (activityFilter === 'updated') return activity.type === 'updated' || activity.type === 'assigned'
      return activity.type === activityFilter
    })

    const sorted = [...filtered]
    if (activitySort === 'newest') {
      sorted.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    } else if (activitySort === 'oldest') {
      sorted.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    } else if (activitySort === 'critical') {
      const criticalPriority: Record<string, number> = {
        breached: 4,
        resolved: 3,
        updated: 2,
        assigned: 2,
        created: 1
      }
      sorted.sort((a, b) => {
        const diff = (criticalPriority[b.type] || 0) - (criticalPriority[a.type] || 0)
        if (diff !== 0) return diff
        return b.timestamp.getTime() - a.timestamp.getTime()
      })
    } else {
      const typeOrder: Record<string, number> = {
        breached: 0,
        resolved: 1,
        updated: 2,
        assigned: 2,
        created: 3
      }
      sorted.sort((a, b) => {
        const diff = (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99)
        if (diff !== 0) return diff
        return b.timestamp.getTime() - a.timestamp.getTime()
      })
    }
    return sorted
  }, [activities, activityFilter, activitySort])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Overview of all civic grievances and resolutions</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Tickets"
          value={stats.totalToday}
          delta={stats.deltaTotal}
          icon={<FileText className="h-5 w-5" />}
        />
        <StatCard
          title="Open"
          value={stats.openToday}
          delta={stats.deltaOpen}
          variant="warning"
          icon={<FolderOpen className="h-5 w-5" />}
        />
        <StatCard
          title="SLA Breached"
          value={stats.slaBreachedToday}
          delta={stats.deltaSla}
          variant="danger"
          icon={<AlertTriangle className="h-5 w-5" />}
        />
        <StatCard
          title="Resolved Today"
          value={stats.resolvedToday}
          delta={stats.deltaResolved}
          variant="success"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Ticket Table - 2 columns */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by ref or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[130px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="In-Progress">In-Progress</SelectItem>
                      <SelectItem value="Resolved">Resolved</SelectItem>
                      <SelectItem value="SLA Breached">SLA Breached</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={severityFilter} onValueChange={setSeverityFilter}>
                    <SelectTrigger className="w-full sm:w-[130px]">
                      <SelectValue placeholder="Severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severity</SelectItem>
                      <SelectItem value="CRITICAL">Critical</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="LOW">Low</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={wardFilter} onValueChange={setWardFilter}>
                    <SelectTrigger className="w-full sm:w-[120px]">
                      <SelectValue placeholder="Ward" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Wards</SelectItem>
                      {Array.from({ length: 20 }, (_, i) => (
                        <SelectItem key={i + 1} value={`Ward ${i + 1}`}>
                          Ward {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tickets Table */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Active Tickets</CardTitle>
                <span className="text-sm text-muted-foreground">
                  Showing {filteredTickets.length} of {tickets.length}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="md:hidden space-y-3 p-4">
                {loading ? (
                  <div className="rounded-lg border p-4 text-sm text-muted-foreground">Loading tickets...</div>
                ) : filteredTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={cn(
                      "rounded-lg border p-4 space-y-2 cursor-pointer",
                      selectedTicket?.id === ticket.id && "bg-muted"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-semibold text-primary text-sm">{ticket.ref}</span>
                      <SeverityBadge severity={ticket.severity} />
                    </div>
                    <div className="text-sm font-medium">{ticket.category}</div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{ticket.ward}</span>
                      <StatusBadge status={ticket.status} />
                    </div>
                    <SLACountdown deadline={ticket.slaDeadline} createdAt={ticket.createdAt} showBar={true} />
                    {ticket.status !== 'Resolved' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full h-10"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleResolve(ticket)
                        }}
                      >
                        Resolve
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <ScrollArea className="hidden md:block h-[500px]">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="w-[100px]">REF</TableHead>
                      <TableHead>CATEGORY</TableHead>
                      <TableHead>WARD</TableHead>
                      <TableHead>SEVERITY</TableHead>
                      <TableHead>STATUS</TableHead>
                      <TableHead>SLA</TableHead>
                      <TableHead>PHONE</TableHead>
                      <TableHead className="text-right">ACTION</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          Loading tickets...
                        </TableCell>
                      </TableRow>
                    ) : filteredTickets.map((ticket) => (
                      <TableRow 
                        key={ticket.id}
                        className={cn(
                          "cursor-pointer hover:bg-muted/50 transition-colors",
                          selectedTicket?.id === ticket.id && "bg-muted"
                        )}
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        <TableCell className="font-mono font-semibold text-primary">
                          {ticket.ref}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate">
                          {ticket.category}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {ticket.ward}
                        </TableCell>
                        <TableCell>
                          <SeverityBadge severity={ticket.severity} />
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={ticket.status} />
                        </TableCell>
                        <TableCell className="min-w-[120px]">
                          <SLACountdown 
                            deadline={ticket.slaDeadline} 
                            createdAt={ticket.createdAt}
                            showBar={true}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {ticket.maskedPhone}
                        </TableCell>
                        <TableCell className="text-right">
                          {ticket.status !== 'Resolved' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="h-7 px-2 text-xs"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleResolve(ticket)
                              }}
                            >
                              Resolve
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - AI Panel & Analytics */}
        <div className="space-y-4">
          {/* AI Assistant Panel */}
          {selectedTicket ? (
            <Card className="border-2 border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <Brain className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-sm">AI Assistant</CardTitle>
                    <CardDescription className="text-xs">
                      Analysis for {selectedTicket.ref}
                    </CardDescription>
                  </div>
                  <Sparkles className="h-4 w-4 text-saffron ml-auto" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm">{selectedTicket.aiAnalysis}</p>
                </div>
                
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Suggested Actions
                  </p>
                  <ul className="space-y-2">
                    {selectedTicket.suggestedActions?.map((action, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <ChevronRight className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <MapPin className="h-3 w-3" />
                    <span>{selectedTicket.location.address}</span>
                  </div>
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center relative overflow-hidden min-w-[260px]">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-green-india/20" />
                    <div className="relative text-center p-4">
                      <MapPin className="h-8 w-8 text-primary mx-auto mb-2" />
                      <p className="text-xs font-mono">
                        {selectedTicket.location.lat.toFixed(4)}° N, {selectedTicket.location.lng.toFixed(4)}° E
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    className="flex-1 bg-primary hover:bg-primary/90"
                    onClick={() => handleResolve(selectedTicket)}
                  >
                    Resolve Ticket
                  </Button>
                  <Button variant="outline" size="icon" asChild>
                    <Link href={`/dashboard/tickets/${selectedTicket.id}`}>
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <Brain className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Select a ticket to view AI analysis and suggested actions
                </p>
              </CardContent>
            </Card>
          )}

          {/* Category Breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {categoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
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
              <div className="grid grid-cols-2 gap-2 mt-2">
                {categoryData.slice(0, 4).map((item, i) => (
                  <div key={item.name} className="flex items-center gap-2 text-xs">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: CATEGORY_COLORS[i] }}
                    />
                    <span className="truncate text-muted-foreground">{item.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Resolution Rate */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Resolution Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-4">
                <div className="relative">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-muted"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${stats.resolutionRate * 2.51} 251`}
                      className="text-green-india"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold font-mono">{stats.resolutionRate}%</span>
                  </div>
                </div>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                {stats.resolvedToday} resolved out of {stats.totalToday} tickets today
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Recent Activity</CardTitle>
              <div className="flex items-center gap-2">
                <select
                  value={activitySort}
                  onChange={(event) => setActivitySort(event.target.value as 'newest' | 'oldest' | 'critical' | 'type')}
                  className="h-7 rounded-md border border-border bg-background px-2 text-[11px] text-foreground outline-none"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="critical">Critical first</option>
                  <option value="type">Type</option>
                </select>
                <LiveIndicator />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {[
                { key: 'all', label: 'All' },
                { key: 'breached', label: 'SLA Exceeded' },
                { key: 'resolved', label: 'Resolved' },
                { key: 'created', label: 'New Ticket' },
                { key: 'updated', label: 'Status Update' }
              ].map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => setActivityFilter(chip.key as 'all' | 'breached' | 'resolved' | 'created' | 'updated')}
                  className={cn(
                    'rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
                    activityFilter === chip.key
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:bg-muted'
                  )}
                >
                  {chip.label}
                </button>
              ))}
            </div>
            <div className="max-h-[280px] overflow-y-auto">
              <ActivityFeed activities={visibleActivities} maxHeight="280px" />
            </div>
          </CardContent>
        </Card>

        {/* Ward Heatmap */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Ward Load Heatmap</CardTitle>
            <CardDescription className="text-xs">
              Open tickets by ward (W1-W20)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WardHeatmap 
              wards={wardStats} 
              onWardClick={(ward) => {
                setWardFilter(ward.name)
                toast.info(`Filtering by ${ward.name}`)
              }}
            />
          </CardContent>
        </Card>

        {/* Severity Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Severity Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={severityData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={70}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    radius={[0, 4, 4, 0]}
                  >
                    {severityData.map((entry) => (
                      <Cell 
                        key={`cell-${entry.name}`} 
                        fill={SEVERITY_COLORS[entry.name as keyof typeof SEVERITY_COLORS] || '#888'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resolve Modal */}
      <Dialog open={resolveModalOpen} onOpenChange={setResolveModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Resolve Ticket</DialogTitle>
            <DialogDescription>
              {selectedTicket?.ref} - {selectedTicket?.category}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status">Resolution Status</Label>
              <Select value={resolutionStatus} onValueChange={setResolutionStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                  <SelectItem value="Duplicate">Duplicate</SelectItem>
                  <SelectItem value="Invalid">Invalid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="summary">Resolution Summary</Label>
              <Textarea
                id="summary"
                placeholder="Describe the resolution..."
                value={resolutionSummary}
                onChange={(e) => setResolutionSummary(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="evidence">Evidence URL (Optional)</Label>
              <Input
                id="evidence"
                placeholder="https://..."
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitResolution} className="bg-green-india hover:bg-green-india/90">
              Submit Resolution
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
