'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '@/components/stat-card'
import { WardHeatmap } from '@/components/ward-heatmap'
import { generateTickets, generateWardStats, generatePlatformStats } from '@/lib/mock-data'
import { 
  TrendingUp, 
  Clock, 
  Target, 
  AlertTriangle, 
  CheckCircle2,
  BarChart3,
  PieChart as PieChartIcon,
  FileText,
  Download,
  Calendar
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart
} from 'recharts'

// Generate time series data
const generateTimeSeriesData = () => {
  const data = []
  const now = new Date()
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    data.push({
      date: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      complaints: Math.floor(40 + Math.random() * 60),
      resolved: Math.floor(30 + Math.random() * 50),
      breached: Math.floor(Math.random() * 15)
    })
  }
  return data
}

// Generate hourly data
const generateHourlyData = () => {
  return Array.from({ length: 24 }, (_, i) => ({
    hour: `${i.toString().padStart(2, '0')}:00`,
    complaints: Math.floor(Math.random() * 20),
  }))
}

export default function AnalyticsPage() {
  const [tickets] = useState(() => generateTickets(100))
  const [wardStats] = useState(() => generateWardStats())
  const [stats] = useState(() => generatePlatformStats())
  const [timeSeriesData] = useState(() => generateTimeSeriesData())
  const [hourlyData] = useState(() => generateHourlyData())

  // Category distribution
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {}
    tickets.forEach(t => {
      counts[t.category] = (counts[t.category] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [tickets])

  // Top performing wards
  const topWards = useMemo(() => {
    return [...wardStats]
      .sort((a, b) => b.solveRate - a.solveRate)
      .slice(0, 5)
  }, [wardStats])

  // Critical focus areas
  const criticalAreas = useMemo(() => {
    return [...wardStats]
      .sort((a, b) => a.solveRate - b.solveRate)
      .slice(0, 5)
  }, [wardStats])

  const COLORS = ['#FF9933', '#1e3a5f', '#138808', '#dc2626', '#f59e0b']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Detailed insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Last 30 Days
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Global Resolution Progress */}
      <Card className="bg-gradient-to-r from-green-india/10 via-green-india/5 to-transparent border-green-india/20">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-5 w-5 text-green-india" />
                <h3 className="text-lg font-semibold">Global Resolution Progress</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Overall platform performance against monthly target of 90% resolution rate
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Current: {stats.resolutionRate}%</span>
                  <span className="text-muted-foreground">Target: 90%</span>
                </div>
                <Progress value={stats.resolutionRate} className="h-3 [&>div]:bg-green-india" />
              </div>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className="text-3xl font-bold font-mono text-green-india">{stats.totalComplaints.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Processed</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold font-mono">{stats.avgResolutionTime}</p>
                <p className="text-xs text-muted-foreground">Avg. Resolution</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Complaints Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Complaints Over Time</CardTitle>
            <CardDescription>Daily complaint volume and resolution trend</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeriesData}>
                  <defs>
                    <linearGradient id="colorComplaints" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1e3a5f" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#1e3a5f" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#138808" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#138808" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="complaints" 
                    stroke="#1e3a5f" 
                    fillOpacity={1}
                    fill="url(#colorComplaints)"
                    name="Complaints"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="resolved" 
                    stroke="#138808" 
                    fillOpacity={1}
                    fill="url(#colorResolved)"
                    name="Resolved"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Category Distribution</CardTitle>
            <CardDescription>Breakdown by complaint category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={50}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
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
          </CardContent>
        </Card>
      </div>

      {/* Ward Performance */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Ward Heatmap */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Ward Performance Comparison</CardTitle>
            <CardDescription>Ticket volume by ward</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={wardStats.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="openTickets" fill="#FF9933" name="Open" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="resolvedTickets" fill="#138808" name="Resolved" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Hourly Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Peak Hours</CardTitle>
            <CardDescription>Complaint distribution by hour</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="hour" 
                    type="category" 
                    tick={{ fontSize: 10 }}
                    width={45}
                    interval={2}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="complaints" fill="#1e3a5f" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Tables */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Performing Wards */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-india" />
                  Top Performing Wards
                </CardTitle>
                <CardDescription>Highest resolution rates</CardDescription>
              </div>
              <Badge variant="secondary" className="bg-green-india/10 text-green-india">
                Top 5
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topWards.map((ward, index) => (
                <div key={ward.id} className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-india/10 text-green-india font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{ward.name}</span>
                      <span className="text-sm font-mono text-green-india">{ward.solveRate}%</span>
                    </div>
                    <Progress value={ward.solveRate} className="h-1.5 [&>div]:bg-green-india" />
                    <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                      <span>{ward.resolvedTickets} resolved</span>
                      <span>Avg: {ward.avgResolutionTime}h</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Critical Focus Areas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Critical Focus Areas
                </CardTitle>
                <CardDescription>Wards requiring attention</CardDescription>
              </div>
              <Badge variant="secondary" className="bg-destructive/10 text-destructive">
                Needs Focus
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {criticalAreas.map((ward, index) => (
                <div key={ward.id} className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-destructive/10 text-destructive font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{ward.name}</span>
                      <span className="text-sm font-mono text-destructive">{ward.solveRate}%</span>
                    </div>
                    <Progress value={ward.solveRate} className="h-1.5 [&>div]:bg-destructive" />
                    <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                      <span>{ward.openTickets} open tickets</span>
                      <span>Est. {Math.ceil(ward.avgResolutionTime * 1.5)}h to clear</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Access */}
      <Card className="border-dashed">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Detailed Audit Access</h3>
                <p className="text-sm text-muted-foreground">
                  Download complete audit reports and detailed analytics data
                </p>
              </div>
            </div>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download Audit Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
