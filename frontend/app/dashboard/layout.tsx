'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import BrandLogo from '@/components/BrandLogo'
import { LiveIndicator } from '@/components/live-indicator'
import { 
  LayoutDashboard, 
  Ticket, 
  BarChart3, 
  Users, 
  Settings,
  Bell,
  Plus,
  LogOut,
  MapPin,
  Clock
} from 'lucide-react'
import { currentOperator } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Tickets', href: '/dashboard/tickets', icon: Ticket },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'GIS Map', href: '/dashboard/gis-map', icon: MapPin },
  { name: 'Agents', href: '/dashboard/agents', icon: Users },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

function LiveClock() {
  const [time, setTime] = useState<string>('')
  const [date, setDate] = useState<string>('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit',
        hour12: false 
      }))
      setDate(now.toLocaleDateString('en-IN', { 
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }))
    }
    
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center gap-2 text-sm">
      <Clock className="h-4 w-4 text-muted-foreground" />
      <span className="font-mono">{time}</span>
      <span className="text-muted-foreground">|</span>
      <span className="text-muted-foreground">{date}</span>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [notificationCount] = useState(5)

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <BrandLogo size="md" showText={true} textColor="text-white" />
          </div>
        </SidebarHeader>
        
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigation.map((item) => (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
                    >
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          
          <SidebarGroup>
            <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/dashboard/tickets/new">
                      <Plus className="h-4 w-4" />
                      <span>New Ticket</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        
        <SidebarFooter className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-saffron text-navy font-semibold text-sm">
                {currentOperator.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-medium text-sidebar-foreground truncate">
                {currentOperator.name}
              </span>
              <span className="text-xs text-sidebar-foreground/60 truncate">
                {currentOperator.tier}
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground"
              asChild
            >
              <Link href="/login">
                <LogOut className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      
      <SidebarInset className="bg-[#0a0f1e] text-white">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-white/10 bg-[#0a0f1e]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0a0f1e]/90 px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6" />
          
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">New Delhi, 28.6139° N 77.2090° E</span>
          </div>
          
          <div className="ml-auto flex items-center gap-4">
            <LiveIndicator />
            <LiveClock />
            
            <Separator orientation="vertical" className="h-6" />
            
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <Badge 
                  className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center bg-destructive text-destructive-foreground text-xs font-mono"
                >
                  {notificationCount}
                </Badge>
              )}
            </Button>
            
            <Button size="sm" className="bg-saffron hover:bg-saffron/90 text-navy font-medium">
              <Plus className="h-4 w-4 mr-1" />
              New Ticket
            </Button>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="flex-1 bg-[#0a0f1e] p-4 text-white sm:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
