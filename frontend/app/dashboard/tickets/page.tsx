'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SeverityBadge, StatusBadge } from '@/components/severity-badge'
import { SLACountdown } from '@/components/sla-countdown'
import { generateTickets } from '@/lib/mock-data'
import { 
  Search, 
  Filter, 
  Plus,
  ExternalLink,
  Download
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function TicketsPage() {
  const [tickets] = useState(() => generateTickets(100))
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [wardFilter, setWardFilter] = useState<string>('all')

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">All Tickets</h1>
          <p className="text-muted-foreground">Manage and track all civic grievances</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm" className="bg-saffron hover:bg-saffron/90 text-navy">
            <Plus className="h-4 w-4 mr-2" />
            New Ticket
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by ref, category, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
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
                <SelectTrigger className="w-[130px]">
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
                <SelectTrigger className="w-[120px]">
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
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter('all')
                  setSeverityFilter('all')
                  setWardFilter('all')
                }}
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Tickets</CardTitle>
            <span className="text-sm text-muted-foreground">
              Showing {filteredTickets.length} of {tickets.length}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-350px)]">
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
                {filteredTickets.map((ticket) => (
                  <TableRow 
                    key={ticket.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <TableCell className="font-mono font-semibold text-primary">
                      <Link href={`/dashboard/tickets/${ticket.id}`} className="hover:underline">
                        {ticket.ref}
                      </Link>
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
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        asChild
                      >
                        <Link href={`/dashboard/tickets/${ticket.id}`}>
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
