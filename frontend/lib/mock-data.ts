import type { Ticket, WardStats, PlatformStats, Activity, Operator, TicketCategory, TicketSeverity, TicketStatus } from './types'

const FIXED_REFS = [
  'JS-151RNY', 'JS-OEH2SA', 'JS-K9V4M1', 'JS-X7Q2LP', 'JS-4N8BZD',
  'JS-T3W6HJ', 'JS-P0R9YC', 'JS-D5K7FN', 'JS-U1M8QS', 'JS-L2J4VX',
  'JS-9C6TBG', 'JS-H8Y3KD', 'JS-R5P1ZM', 'JS-W2N7LF', 'JS-B4Q9XC',
  'JS-G6V0TR', 'JS-S8D2JP', 'JS-M3K5YN', 'JS-F7H1QB', 'JS-A9L4ZW',
  'JS-E2R6TX', 'JS-N5C8VM', 'JS-Q1P3HD', 'JS-Z7B0KL', 'JS-J4W9RF',
  'JS-Y6M2SC', 'JS-C8T5XN', 'JS-V0G1PL', 'JS-K3D7QJ', 'JS-X9H4MB',
  'JS-2R6YTW', 'JS-P8L1CF', 'JS-D0N5VK', 'JS-U7Q3ZR', 'JS-L4B9HJ',
  'JS-6M2XPD', 'JS-H1T8SN', 'JS-R9K0WL', 'JS-W5V3QC', 'JS-B7F4YG',
  'JS-G2P6ND', 'JS-S0J9XM', 'JS-M8R1TK', 'JS-F3L5VH', 'JS-A6C7QP',
  'JS-E9W2ZD', 'JS-N4H0LB', 'JS-Q5Y8RF', 'JS-Z1M3XC', 'JS-J7T6PK',
  'JS-Y0D4VN', 'JS-C2Q9HG', 'JS-V8L1SM', 'JS-K5B3TR', 'JS-X6P7WJ',
  'JS-1N4YCQ', 'JS-P3H8LF', 'JS-D9R0ZM', 'JS-U2T5KD', 'JS-L7V1XB'
]

function seeded(seed: number): number {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453
  return value - Math.floor(value)
}

function pickBySeed<T>(values: T[], seed: number): T {
  return values[Math.floor(seeded(seed) * values.length) % values.length]
}

function generateRef(index: number): string {
  return FIXED_REFS[index % FIXED_REFS.length]
}

// Mask phone number
function maskPhone(phone: string): string {
  return `+91·····${phone.slice(-4)}`
}

const categories: TicketCategory[] = [
  'Electricity Outage',
  'Water Leakage',
  'Road Damage',
  'Garbage Collection',
  'General Complaint'
]

const severities: TicketSeverity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
const statuses: TicketStatus[] = ['Open', 'In-Progress', 'Resolved', 'SLA Breached']

const addresses = [
  'Block A, Connaught Place',
  'Sector 15, Dwarka',
  'Mayur Vihar Phase 1',
  'Lajpat Nagar Central Market',
  'Karol Bagh Metro Station',
  'Saket District Centre',
  'Nehru Place IT Hub',
  'Rohini Sector 7',
  'Pitampura TV Tower Area',
  'Janakpuri West'
]

const descriptions = [
  'Power outage affecting entire block since morning. Multiple households impacted.',
  'Major water pipeline leak near the main road causing flooding.',
  'Large pothole on main highway causing accidents.',
  'Garbage not collected for 5 days. Health hazard developing.',
  'Street lights not working for the past week.',
  'Sewage overflow in residential area.',
  'Broken traffic signal at major intersection.',
  'Unauthorized construction blocking public pathway.',
  'Water supply disrupted for 48+ hours.',
  'Drainage blocked causing waterlogging.'
]

// Generate mock tickets
export function generateTickets(count: number = 50): Ticket[] {
  const tickets: Ticket[] = []
  const baseTime = new Date('2026-01-15T10:00:00Z').getTime()
  
  for (let i = 0; i < count; i++) {
    const createdAt = new Date(baseTime - seeded(i + 1) * 7 * 24 * 60 * 60 * 1000)
    const status = pickBySeed(statuses, i + 11)
    const severity = pickBySeed(severities, i + 21)
    const wardId = Math.floor(seeded(i + 31) * 20) + 1
    const phone = `98${String(10000000 + Math.floor(seeded(i + 41) * 90000000)).padStart(8, '0')}`
    
    // Calculate SLA deadline based on severity
    const slaHours = severity === 'CRITICAL' ? 4 : severity === 'HIGH' ? 12 : severity === 'MEDIUM' ? 24 : 48
    const slaDeadline = new Date(createdAt.getTime() + slaHours * 60 * 60 * 1000)
    
    const ticket: Ticket = {
      id: `ticket-${i + 1}`,
      ref: generateRef(i),
      category: pickBySeed(categories, i + 51),
      ward: `Ward ${wardId}`,
      wardId,
      severity,
      status,
      slaDeadline,
      createdAt,
      closedAt: status === 'Resolved' ? new Date(createdAt.getTime() + seeded(i + 61) * 48 * 60 * 60 * 1000) : undefined,
      phone,
      maskedPhone: maskPhone(phone),
      description: pickBySeed(descriptions, i + 71),
      aiAnalysis: `AI detected ${severity.toLowerCase()} priority ${pickBySeed(categories, i + 81).toLowerCase()} issue. Confidence score: ${(85 + seeded(i + 91) * 14).toFixed(1)}%`,
      suggestedActions: [
        'Dispatch field team to location',
        'Contact local ward office',
        'Escalate to department supervisor'
      ],
      location: {
        lat: 28.6139 + (seeded(i + 101) - 0.5) * 0.1,
        lng: 77.2090 + (seeded(i + 111) - 0.5) * 0.1,
        address: pickBySeed(addresses, i + 121) + ', New Delhi'
      }
    }
    
    if (status === 'Resolved') {
      ticket.evidenceUrl = 'https://example.com/evidence/resolved.jpg'
      ticket.resolution = 'Issue resolved by field team. Verified by supervisor.'
    }
    
    tickets.push(ticket)
  }
  
  return tickets.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

// Generate ward statistics
export function generateWardStats(): WardStats[] {
  const stats: WardStats[] = []
  
  for (let i = 1; i <= 20; i++) {
    const total = Math.floor(20 + seeded(i + 201) * 80)
    const resolved = Math.floor(total * (0.5 + seeded(i + 211) * 0.4))
    const open = total - resolved
    
    stats.push({
      id: i,
      name: `Ward ${i}`,
      totalTickets: total,
      openTickets: open,
      resolvedTickets: resolved,
      avgResolutionTime: Math.floor(4 + Math.random() * 20),
      solveRate: Math.round((resolved / total) * 100)
    })
  }
  
  return stats
}

// Generate platform statistics
export function generatePlatformStats(): PlatformStats {
  return {
    totalComplaints: 12847,
    resolutionRate: 87.3,
    avgResolutionTime: '18.5 hrs',
    activeIssues: 1632,
    totalToday: 156,
    openToday: 89,
    slaBreachedToday: 12,
    resolvedToday: 67,
    deltaTotal: 12,
    deltaOpen: -8,
    deltaSla: 3,
    deltaResolved: 15
  }
}

// Generate recent activities
export function generateActivities(count: number = 20): Activity[] {
  const activities: Activity[] = []
  const types: Activity['type'][] = ['created', 'assigned', 'updated', 'resolved', 'breached']
  const agents = ['Arjun Sharma', 'Priya Verma', 'Rahul Singh', 'Neha Gupta', 'Amit Kumar']
  const now = new Date('2026-01-15T10:00:00Z')
  
  for (let i = 0; i < count; i++) {
    const type = pickBySeed(types, i + 301)
    const ticketRef = generateRef(i + 200)
    const timestamp = new Date(now.getTime() - i * 5 * 60 * 1000) // Every 5 minutes
    
    let description = ''
    switch (type) {
      case 'created':
        description = `New complaint registered via voice call`
        break
      case 'assigned':
        description = `Ticket assigned to field team`
        break
      case 'updated':
        description = `Status updated to In-Progress`
        break
      case 'resolved':
        description = `Issue resolved and verified`
        break
      case 'breached':
        description = `SLA deadline exceeded`
        break
    }
    
    activities.push({
      id: `activity-${i + 1}`,
      type,
      ticketRef,
      description,
      timestamp,
      agent: pickBySeed(agents, i + 311)
    })
  }
  
  return activities
}

// Current operator
export const currentOperator: Operator = {
  id: 'op-1',
  name: 'Arjun Sharma',
  role: 'Municipal Operations',
  tier: 'Tier-2 Resolver',
  avatar: undefined
}

// Announcements for ticker
export const announcements = [
  'Digital India Initiative: All grievances now processed within 48 hours',
  'New toll-free number active: +1 570 630 8042',
  'Ministry of Housing & Urban Affairs - Committed to citizen welfare',
  'Report civic issues 24/7 via voice call in Hindi or English',
  'Track your complaint status online with reference number',
  'JanSamvaad ResolveOS - Powered by AI for faster resolution'
]
