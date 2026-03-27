export type ComplaintSeverity = 'critical' | 'high' | 'medium' | 'low'
export type ComplaintStatus = 'open' | 'resolved'

export interface MockComplaint {
  id: string
  title: string
  severity: ComplaintSeverity
  lat: number
  lng: number
  ward: string
  status: ComplaintStatus
  createdAt: string
}

const now = Date.now()
const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

const OFFSETS = [
  2 * HOUR,
  5 * HOUR,
  10 * HOUR,
  18 * HOUR,
  28 * HOUR,
  2 * DAY,
  3 * DAY,
  5 * DAY,
  8 * DAY,
  11 * DAY,
  14 * DAY,
  19 * DAY,
  24 * DAY,
  33 * DAY,
  45 * DAY
]

export const mockComplaints: MockComplaint[] = [
  { id: 'cmp-001', title: 'Major road collapse near terminal', severity: 'critical', lat: 28.5562, lng: 77.1000, ward: 'Vasant Kunj', status: 'open', createdAt: new Date(now - OFFSETS[0]).toISOString() },
  { id: 'cmp-002', title: 'Water pipeline burst on ring road', severity: 'high', lat: 28.5733, lng: 77.2870, ward: 'Mayur Vihar', status: 'open', createdAt: new Date(now - OFFSETS[1]).toISOString() },
  { id: 'cmp-003', title: 'Overflowing garbage transfer point', severity: 'medium', lat: 28.6448, lng: 77.2167, ward: 'Chandni Chowk', status: 'open', createdAt: new Date(now - OFFSETS[2]).toISOString() },
  { id: 'cmp-004', title: 'Streetlight outage in market lane', severity: 'low', lat: 28.6328, lng: 77.2197, ward: 'Daryaganj', status: 'resolved', createdAt: new Date(now - OFFSETS[3]).toISOString() },
  { id: 'cmp-005', title: 'Drain blockage causing waterlogging', severity: 'high', lat: 28.5355, lng: 77.3910, ward: 'Noida Link Border', status: 'open', createdAt: new Date(now - OFFSETS[4]).toISOString() },
  { id: 'cmp-006', title: 'Uncollected waste at school zone', severity: 'medium', lat: 28.6692, lng: 77.4538, ward: 'Shahdara', status: 'open', createdAt: new Date(now - OFFSETS[5]).toISOString() },
  { id: 'cmp-007', title: 'Power transformer sparks reported', severity: 'critical', lat: 28.7041, lng: 77.1025, ward: 'Rohini', status: 'open', createdAt: new Date(now - OFFSETS[6]).toISOString() },
  { id: 'cmp-008', title: 'Potholes near bus depot', severity: 'high', lat: 28.6139, lng: 77.2090, ward: 'Connaught Place', status: 'open', createdAt: new Date(now - OFFSETS[7]).toISOString() },
  { id: 'cmp-009', title: 'Sewage overflow behind hospital', severity: 'critical', lat: 28.7041, lng: 77.1710, ward: 'Model Town', status: 'open', createdAt: new Date(now - OFFSETS[8]).toISOString() },
  { id: 'cmp-010', title: 'Broken park lights', severity: 'low', lat: 28.5708, lng: 77.3272, ward: 'Laxmi Nagar', status: 'resolved', createdAt: new Date(now - OFFSETS[9]).toISOString() },
  { id: 'cmp-011', title: 'Illegal dumping near flyover', severity: 'medium', lat: 28.5494, lng: 77.2519, ward: 'Lajpat Nagar', status: 'open', createdAt: new Date(now - OFFSETS[10]).toISOString() },
  { id: 'cmp-012', title: 'Traffic signal blackout', severity: 'high', lat: 28.5245, lng: 77.1855, ward: 'Saket', status: 'open', createdAt: new Date(now - OFFSETS[11]).toISOString() },
  { id: 'cmp-013', title: 'Water tanker delay complaints', severity: 'low', lat: 28.4595, lng: 77.0266, ward: 'Najafgarh', status: 'open', createdAt: new Date(now - OFFSETS[12]).toISOString() },
  { id: 'cmp-014', title: 'Repeated manhole overflow', severity: 'medium', lat: 28.4089, lng: 77.3178, ward: 'Badarpur', status: 'open', createdAt: new Date(now - OFFSETS[13]).toISOString() },
  { id: 'cmp-015', title: 'Collapsed boundary wall hazard', severity: 'critical', lat: 28.8386, lng: 77.1020, ward: 'Narela', status: 'open', createdAt: new Date(now - OFFSETS[14]).toISOString() }
]
