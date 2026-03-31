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
  const [aiLoading, setAiLoading] = useState(false)
  const [resolveModalOpen, setResolveModalOpen] = useState(false)
  const [resolutionStatus, setResolutionStatus] = useState('Resolved')
  const [resolutionSummary, setResolutionSummary] = useState('')
  const [evidenceUrl, setEvidenceUrl] = useState('')

  const fetchAiAnalysis = async (ticketRef: string) => {
    setAiLoading(true)
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/tickets/${ticketRef}/analyze`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      )
      if (!res.ok) throw new Error('Analysis failed')
      const data = await res.json()
      setSelectedTicket(prev => prev ? {
        ...prev,
        aiAnalysis: data.summary || prev.aiAnalysis,
        suggestedActions: data.suggestedActions || prev.suggestedActions,
        aiPriority: data.priority,
        aiEta: data.estimatedResolutionTime,
        aiEscalate: data.escalationNeeded,
      } : prev)
    } catch (err) {
      console.error('[AI analysis]', err)
    } finally {
      setAiLoading(false)
    }
  }

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
      aiAnalysis: '',
      suggestedActions: [],
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
                    onClick={() => { setSelectedTicket(ticket); fetchAiAnalysis(ticket.ref || ticket.id); }}
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
                        onClick={() => { setSelectedTicket(ticket); fetchAiAnalysis(ticket.ref || ticket.id); }}
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
        <div className="flex h-fit flex-col gap-4 bg-transparent">
          {/* AI Assistant Panel */}
          {selectedTicket ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col gap-4">
              {/* Header */}
              <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
                <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2">
                    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.16"/>
                    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.16"/>
                  </svg>
                </div>
                <span className="text-sm text-gray-800 font-semibold">Gemini Analysis</span>
                <span className="ml-auto text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full border border-orange-200">
                  {selectedTicket.ref}
                </span>
              </div>

              {/* Analysis text */}
              <div>
                <p className="mb-2 text-gray-500 uppercase tracking-wider text-xs font-semibold">AI Assessment</p>
                {aiLoading ? (
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-full"/>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-4/5"/>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-3/5"/>
                  </div>
                ) : (
                  <p className="text-gray-700 text-sm leading-relaxed">{selectedTicket.aiAnalysis}</p>
                )}
              </div>

              {/* Priority + ETA row */}
              {(selectedTicket.aiPriority || selectedTicket.aiEta) && (
                <div className="flex gap-3">
                  {selectedTicket.aiPriority && (
                    <div className="flex-1 rounded-xl bg-gray-50 border border-gray-200 p-3">
                      <p className="text-xs text-gray-500 mb-1">AI Priority</p>
                      <p className={`text-sm font-semibold ${
                        selectedTicket.aiPriority === 'High' ? 'text-red-400' :
                        selectedTicket.aiPriority === 'Medium' ? 'text-orange-400' :
                        'text-green-400'
                      }`}>{selectedTicket.aiPriority}</p>
                    </div>
                  )}
                  {selectedTicket.aiEta && (
                    <div className="flex-1 rounded-xl bg-gray-50 border border-gray-200 p-3">
                      <p className="text-xs text-gray-500 mb-1">Est. Resolution</p>
                      <p className="text-sm font-semibold text-blue-600">{selectedTicket.aiEta}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Escalation warning */}
              {selectedTicket.aiEscalate && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  <span className="text-xs text-red-600 font-medium">Escalation recommended</span>
                </div>
              )}

              {/* Suggested actions */}
              <div>
                <p className="mb-3 text-gray-500 uppercase tracking-wider text-xs font-semibold">Suggested Actions</p>
                {aiLoading ? (
                  <div className="space-y-2">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-12 bg-gray-200 rounded-xl animate-pulse"/>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(selectedTicket.suggestedActions || []).map((action, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-xl bg-gray-50 border border-gray-200 p-3 cursor-default">
                        <div className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <p className="text-gray-700 text-sm leading-snug">{action}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Powered by badge */}
              <div className="pt-2 border-t border-gray-200 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>
                <span className="text-gray-400 text-xs">Powered by Gemini 2.5 Flash</span>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm h-auto px-6 py-8 flex flex-col items-center justify-center text-center gap-4">
              {/* Animated pulse ring around brain icon */}
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-orange-500/20 animate-ping"/>
                <div className="relative w-14 h-14 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
                  {/* Brain SVG inline */}
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="1.5">
                    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.16"/>
                    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.16"/>
                  </svg>
                </div>
              </div>
              <div>
                <p className="text-white font-medium text-sm">Gemini AI Analysis</p>
                <p className="text-gray-400 text-xs mt-1 max-w-[180px] leading-relaxed">
                  Select any ticket to get instant AI-powered insights and resolution steps
                </p>
              </div>
              {/* Feature pills */}
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {['Root Cause', 'Priority Score', 'Action Steps'].map(tag => (
                  <span key={tag} className="text-xs px-2 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
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
