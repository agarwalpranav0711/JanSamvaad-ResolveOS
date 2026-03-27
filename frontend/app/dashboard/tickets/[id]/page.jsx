'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Clock3, Loader2, MapPin, Phone, ShieldCheck, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { SeverityBadge, StatusBadge } from '@/components/severity-badge'
import { generateTickets } from '@/lib/mock-data'

function formatTimeLeft(deadline, nowMs) {
  if (!deadline || !nowMs) return 'Calculating...'
  const diff = new Date(deadline).getTime() - nowMs
  if (diff <= 0) return 'SLA breached'
  const totalMinutes = Math.floor(diff / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours}h ${minutes}m remaining`
}

function statusTone(status) {
  if (status === 'Resolved') return 'text-emerald-600'
  if (status === 'SLA Breached') return 'text-rose-600'
  return 'text-orange-600'
}

export default function TicketDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [selectedStatus, setSelectedStatus] = useState('Open')
  const [isSaving, setIsSaving] = useState(false)
  const [nowMs, setNowMs] = useState(null)

  useEffect(() => {
    setNowMs(Date.now())
    const timer = setInterval(() => setNowMs(Date.now()), 60000)
    return () => clearInterval(timer)
  }, [])

  const ticketId = String(params?.id || '')

  const ticket = useMemo(() => {
    const all = generateTickets(120)
    return all.find((item) => item.id === ticketId) || all[0]
  }, [ticketId])

  useEffect(() => {
    if (ticket?.status) {
      setSelectedStatus(ticket.status)
    }
  }, [ticket])

  const reference = ticket?.ref || `JS-${ticketId.toUpperCase()}`
  const statusText = selectedStatus || ticket?.status || 'Open'
  const severityText = ticket?.severity || 'MEDIUM'
  const slaText = formatTimeLeft(ticket?.slaDeadline, nowMs)
  const heroTitle = ticket?.category === 'Road Damage' ? 'Deep Pothole on Main Arterial' : `${ticket?.category || 'Civic Issue'} in ${ticket?.ward || 'Ward'}`

  const citizen = {
    name: 'Ramesh Kumar',
    phone: '+91 98XXXXXX' + String(ticket?.phone || '0000').slice(-4),
    address: ticket?.location?.address || 'Block A, Connaught Place, New Delhi',
    ward: ticket?.ward || 'Ward 12'
  }

  const timeline = [
    { title: 'Ticket Created', detail: 'Citizen lodged complaint via IVR', time: 'Today, 09:12 AM' },
    { title: 'Assigned to Ward', detail: 'Assigned to Tier-2 field response team', time: 'Today, 09:40 AM' },
    { title: 'Status changed to In-Progress', detail: 'Initial on-ground inspection completed', time: 'Today, 11:05 AM' },
    { title: 'Supervisor Note Added', detail: 'Material request raised for closure', time: 'Today, 01:18 PM' }
  ]

  const handleSaveStatus = async () => {
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 1200))
    setIsSaving(false)
    toast.success('Ticket status updated successfully.')
  }

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-border/50 bg-card shadow-sm p-4 sm:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <Button variant="ghost" size="sm" className="w-fit px-2 text-muted-foreground hover:text-foreground" onClick={() => router.back()}>
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back to Tickets
            </Button>
            <p className="text-xs font-mono text-muted-foreground">Ticket Reference: {reference}</p>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{heroTitle}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={statusText} />
            <SeverityBadge severity={severityText} />
            <Badge variant="outline" className="text-xs border-border/60">ID: {ticketId}</Badge>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6 lg:col-span-2">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Citizen Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Name</p>
                  <p className="font-medium text-foreground">{citizen.name}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium text-foreground">{citizen.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Address</p>
                  <p className="font-medium text-foreground">{citizen.address}</p>
                  <p className="text-xs text-muted-foreground">{citizen.ward}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Issue Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-7 text-foreground">
                A deep pothole has formed at the center lane near the market entry point, causing frequent vehicle damage and traffic slowdown.
                During peak hours, two-wheelers are swerving abruptly to avoid the depression which increases accident risk. Citizen requests urgent
                resurfacing and warning barricades until permanent repair is completed.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Photographic Evidence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <img
                  src="https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?auto=format&fit=crop&w=1200&q=80"
                  alt="Broken road surface with pothole"
                  className="h-48 w-full rounded-lg border border-border/50 object-cover shadow-sm"
                />
                <img
                  src="https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?auto=format&fit=crop&w=1200&q=80"
                  alt="Civic road damage near urban traffic"
                  className="h-48 w-full rounded-lg border border-border/50 object-cover shadow-sm"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-1">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">SLA & Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">SLA Countdown</p>
                  <p className={`font-semibold ${statusTone(statusText)}`}>{slaText}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Assigned Tier-2 Agent</p>
                  <p className="font-medium text-foreground">Arjun Sharma</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Status Update</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select ticket status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="In-Progress">In-Progress</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSaveStatus} disabled={isSaving} className="w-full">
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Resolution Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative pl-5">
                <div className="absolute left-1.5 top-1 h-[calc(100%-8px)] w-px bg-border/70" />
                <div className="space-y-5">
                  {timeline.map((step, index) => (
                    <div key={`${step.title}-${index}`} className="relative">
                      <span className="absolute -left-[15px] top-1.5 h-2.5 w-2.5 rounded-full border border-background bg-primary" />
                      <p className="text-sm font-medium text-foreground">{step.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{step.detail}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">{step.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
