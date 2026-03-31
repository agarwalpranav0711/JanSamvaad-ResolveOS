export type TicketStatus = 'Open' | 'In-Progress' | 'Resolved' | 'SLA Breached'
export type TicketSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
export type TicketCategory = 
  | 'Electricity Outage' 
  | 'Water Leakage' 
  | 'Road Damage' 
  | 'Garbage Collection' 
  | 'General Complaint'

export interface Ticket {
  id: string
  ref: string
  category: TicketCategory
  ward: string
  wardId: number
  severity: TicketSeverity
  status: TicketStatus
  slaDeadline: Date
  createdAt: Date
  closedAt?: Date
  phone: string
  maskedPhone: string
  description: string
  aiAnalysis?: string
  suggestedActions?: string[]
  aiPriority?: string
  aiEta?: string
  aiEscalate?: boolean
  location: {
    lat: number
    lng: number
    address: string
  }
  evidenceUrl?: string
  resolution?: string
  citizenRating?: number
  citizenFeedback?: string
}

export interface WardStats {
  id: number
  name: string
  totalTickets: number
  openTickets: number
  resolvedTickets: number
  avgResolutionTime: number
  solveRate: number
}

export interface PlatformStats {
  totalComplaints: number
  resolutionRate: number
  avgResolutionTime: string
  activeIssues: number
  totalToday: number
  openToday: number
  slaBreachedToday: number
  resolvedToday: number
  deltaTotal: number
  deltaOpen: number
  deltaSla: number
  deltaResolved: number
}

export interface Activity {
  id: string
  type: 'created' | 'assigned' | 'updated' | 'resolved' | 'breached'
  ticketRef: string
  description: string
  timestamp: Date
  agent?: string
}

export interface Operator {
  id: string
  name: string
  role: string
  tier: string
  avatar?: string
}
