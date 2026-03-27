'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function SettingsPage() {
  const [name, setName] = useState('Arjun Sharma')
  const [role, setRole] = useState('Operator')
  const [wardAssignment, setWardAssignment] = useState('Ward 12')
  const [phone, setPhone] = useState('+91 9876543210')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otpEnabled, setOtpEnabled] = useState(true)

  const [soundAlerts, setSoundAlerts] = useState(true)
  const [browserNotifications, setBrowserNotifications] = useState(true)
  const [smsAlerts, setSmsAlerts] = useState(false)
  const [priorityOnly, setPriorityOnly] = useState(false)
  const [language, setLanguage] = useState('English')

  const [slaHigh, setSlaHigh] = useState(4)
  const [slaMedium, setSlaMedium] = useState(24)
  const [slaLow, setSlaLow] = useState(72)

  const [aiThreshold, setAiThreshold] = useState([80])
  const [autoEscalateLowConfidence, setAutoEscalateLowConfidence] = useState(true)

  const [isGeneratingDummy, setIsGeneratingDummy] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [isSavingAccount, setIsSavingAccount] = useState(false)
  const [isSavingAlerts, setIsSavingAlerts] = useState(false)
  const [isSavingRules, setIsSavingRules] = useState(false)
  const [isSavingAi, setIsSavingAi] = useState(false)

  const handleSave = async (type) => {
    if (type === 'account') setIsSavingAccount(true)
    if (type === 'alerts') setIsSavingAlerts(true)
    if (type === 'rules') setIsSavingRules(true)
    if (type === 'ai') setIsSavingAi(true)

    await new Promise((resolve) => setTimeout(resolve, 900))

    if (type === 'account') setIsSavingAccount(false)
    if (type === 'alerts') setIsSavingAlerts(false)
    if (type === 'rules') setIsSavingRules(false)
    if (type === 'ai') setIsSavingAi(false)

    toast.success('Settings saved successfully.')
  }

  const handleGenerateDummy = async () => {
    setIsGeneratingDummy(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsGeneratingDummy(false)
    toast.success('50 dummy tickets generated for simulation.')
  }

  const handleFactoryReset = async () => {
    setIsResetting(true)
    await new Promise((resolve) => setTimeout(resolve, 1600))
    setIsResetting(false)
    toast.success('Factory reset simulation complete.')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Settings & Preferences</h1>
        <p className="text-sm text-muted-foreground">Configure account, alerts, routing rules, AI behavior, and simulation controls.</p>
      </div>

      <Tabs defaultValue="account" className="space-y-5">
        <TabsList className="w-full justify-start overflow-x-auto whitespace-nowrap rounded-lg border border-border/50 bg-background p-1">
          <TabsTrigger value="account">Account & Profile</TabsTrigger>
          <TabsTrigger value="alerts">Alerts & Preferences</TabsTrigger>
          <TabsTrigger value="rules">Routing & Rules</TabsTrigger>
          <TabsTrigger value="ai">AI & Security</TabsTrigger>
          <TabsTrigger value="demo">Demo / Simulation</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-4">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Operator Profile</CardTitle>
              <CardDescription>Manage basic operator account details used across the dashboard.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={name} onChange={(event) => setName(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Operator">Operator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ward">Ward Assignment</Label>
                  <Input id="ward" value={wardAssignment} onChange={(event) => setWardAssignment(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Control account access and authentication options.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input id="confirm-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
                </div>
              </div>
              <div className="flex items-start justify-between rounded-lg border border-border/50 p-3">
                <div>
                  <p className="text-sm font-medium">Enable OTP Login</p>
                  <p className="text-xs text-muted-foreground">Require OTP verification for operator sign-in.</p>
                </div>
                <Switch checked={otpEnabled} onCheckedChange={setOtpEnabled} />
              </div>
              <div className="flex justify-end">
                <Button onClick={() => handleSave('account')} disabled={isSavingAccount}>
                  {isSavingAccount ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Account Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Customize alert channels for civic incident handling.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  title: 'Sound Alerts',
                  subtitle: 'Play an audible alert for high-priority incidents.',
                  value: soundAlerts,
                  setter: setSoundAlerts
                },
                {
                  title: 'Browser Notifications',
                  subtitle: 'Show desktop notifications while the dashboard is open.',
                  value: browserNotifications,
                  setter: setBrowserNotifications
                },
                {
                  title: 'SMS Alerts',
                  subtitle: 'Send SMS notifications for assigned critical tickets.',
                  value: smsAlerts,
                  setter: setSmsAlerts
                },
                {
                  title: 'Priority-Only Alerts',
                  subtitle: 'Mute medium/low events and alert only on critical flows.',
                  value: priorityOnly,
                  setter: setPriorityOnly
                }
              ].map((item) => (
                <div key={item.title} className="flex items-start justify-between rounded-lg border border-border/50 p-3">
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                  </div>
                  <Switch checked={item.value} onCheckedChange={item.setter} />
                </div>
              ))}

              <div className="rounded-lg border border-border/50 p-3 space-y-2">
                <Label htmlFor="language">Default Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger id="language" className="w-full sm:w-[220px]">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Hindi">Hindi</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Used for operator UI and outgoing notification templates.</p>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSave('alerts')} disabled={isSavingAlerts}>
                  {isSavingAlerts ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Alert Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>SLA Targets</CardTitle>
              <CardDescription>Define SLA commitments by severity band.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="sla-high">High (Hours)</Label>
                <Input id="sla-high" type="number" value={slaHigh} onChange={(event) => setSlaHigh(Number(event.target.value) || 0)} />
                <p className="text-xs text-muted-foreground">Response target for high-risk complaints.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sla-medium">Medium (Hours)</Label>
                <Input id="sla-medium" type="number" value={slaMedium} onChange={(event) => setSlaMedium(Number(event.target.value) || 0)} />
                <p className="text-xs text-muted-foreground">Standard closure window for medium incidents.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sla-low">Low (Hours)</Label>
                <Input id="sla-low" type="number" value={slaLow} onChange={(event) => setSlaLow(Number(event.target.value) || 0)} />
                <p className="text-xs text-muted-foreground">Long-tail SLA for low-impact grievances.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Category Routing Matrix</CardTitle>
              <CardDescription>Department ownership for incoming complaint categories.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Escalation Path</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { category: 'Pothole', department: 'PWD', path: 'Zone Engineer → Chief Engineer' },
                    { category: 'Garbage', department: 'Sanitation', path: 'Inspector → Deputy Commissioner' },
                    { category: 'Water Leakage', department: 'Jal Board', path: 'JE Water → AE Water' },
                    { category: 'Streetlight', department: 'Electrical', path: 'Electrical Officer → EE' }
                  ].map((item) => (
                    <TableRow key={item.category}>
                      <TableCell className="font-medium">{item.category}</TableCell>
                      <TableCell>{item.department}</TableCell>
                      <TableCell className="text-muted-foreground">{item.path}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 flex justify-end">
                <Button onClick={() => handleSave('rules')} disabled={isSavingRules}>
                  {isSavingRules ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Routing Rules
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>AI Classification Controls</CardTitle>
              <CardDescription>Tune confidence and escalation behavior for model predictions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>AI Confidence Threshold</Label>
                  <Badge variant="secondary">{aiThreshold[0]}%</Badge>
                </div>
                <Slider value={aiThreshold} onValueChange={setAiThreshold} max={100} min={40} step={1} />
                <p className="text-xs text-muted-foreground">Tickets below this confidence are flagged for manual review.</p>
              </div>

              <div className="flex items-start justify-between rounded-lg border border-border/50 p-3">
                <div>
                  <p className="text-sm font-medium">Auto-escalate low confidence</p>
                  <p className="text-xs text-muted-foreground">Automatically route uncertain classifications to Tier-2 supervisors.</p>
                </div>
                <Switch checked={autoEscalateLowConfidence} onCheckedChange={setAutoEscalateLowConfidence} />
              </div>

              <div className="space-y-2 rounded-lg border border-border/50 p-3">
                <p className="text-sm font-medium">System Health</p>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-emerald-500 text-white hover:bg-emerald-500">Twilio SMS: Live</Badge>
                  <Badge className="bg-emerald-500 text-white hover:bg-emerald-500">Database: Live</Badge>
                  <Badge className="bg-emerald-500 text-white hover:bg-emerald-500">AI Engine: Live</Badge>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSave('ai')} disabled={isSavingAi}>
                  {isSavingAi ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save AI Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demo" className="space-y-4">
          <Card className="border-orange-300/70 shadow-sm bg-orange-50/40">
            <CardHeader>
              <CardTitle className="text-orange-900">Demo Controls</CardTitle>
              <CardDescription className="text-orange-800/80">Use simulation tools to populate and stress-test the dashboard.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={handleGenerateDummy} disabled={isGeneratingDummy} className="sm:w-auto">
                  {isGeneratingDummy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Generate 50 Dummy Tickets
                </Button>
                <Button variant="destructive" onClick={handleFactoryReset} disabled={isResetting} className="sm:w-auto">
                  {isResetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Factory Reset System
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                These controls are simulation-only for demo environments. No persistent backend state is modified.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
