'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import BrandLogo from '@/components/BrandLogo'
import { toast } from 'sonner'
import { ArrowLeft, Eye, EyeOff, Loader2, Lock, Phone, Shield, User } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [authMode, setAuthMode] = useState('password')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [mobile, setMobile] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handlePasswordLogin = async (event) => {
    event.preventDefault()
    if (!username.trim() || !password.trim()) {
      toast.error('Please enter both username and password.')
      return
    }
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    if (username.trim() === 'admin' && password === 'admin123') {
      toast.success('Login successful. Redirecting...')
      router.push('/dashboard')
      return
    }
    toast.error('Invalid credentials. Please try again.')
    setIsSubmitting(false)
  }

  const handleSendOtp = async () => {
    const digits = mobile.replace(/\D/g, '')
    if (digits.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number.')
      return
    }
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsSubmitting(false)
    toast.success('OTP sent successfully to your registered number.')
  }

  const handleAutofill = () => {
    setAuthMode('password')
    setUsername('admin')
    setPassword('admin123')
    setShowPassword(false)
    toast.success('Credentials loaded')
  }

  return (
    <div className="min-h-svh grid lg:grid-cols-2 bg-white">
      <aside className="relative hidden lg:flex flex-col justify-between bg-slate-950 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-[0.12]" style={{
          backgroundImage:
            'linear-gradient(rgba(148,163,184,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.25) 1px, transparent 1px)',
          backgroundSize: '26px 26px'
        }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.28),transparent_50%),radial-gradient(circle_at_85%_75%,rgba(14,165,233,0.18),transparent_45%)]" />
        <div className="relative z-10 px-14 pt-14">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
        <div className="relative z-10 px-14 pb-20">
          <div className="mb-14">
            <BrandLogo size="lg" showText={true} textColor="text-white" />
          </div>
          <p className="max-w-md text-2xl font-semibold leading-relaxed text-white">
            Empowering Municipal Operations for a Digital India
          </p>
        </div>
      </aside>

      <section className="bg-white flex flex-col justify-between min-h-svh">
        <div className="px-6 pt-6 lg:hidden">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
        <div className="flex flex-1 flex-col justify-center items-center px-8 lg:px-16 py-10">
          <div className="max-w-md w-full">
            <div className="mb-6">
              <div className="inline-flex items-center gap-3">
                <BrandLogo size="sm" showText={true} textColor="text-gray-900" />
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Operator Login</h1>
                  <p className="text-sm text-slate-500">Municipal Operations Access Portal</p>
                </div>
              </div>
            </div>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-slate-900">Secure Authentication</CardTitle>
                <CardDescription>Select your preferred sign-in mode</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <Tabs value={authMode} onValueChange={setAuthMode} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="password">Password</TabsTrigger>
                    <TabsTrigger value="otp">Mobile OTP</TabsTrigger>
                  </TabsList>

                  <TabsContent value="password" className="mt-4">
                    <form onSubmit={handlePasswordLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            id="username"
                            value={username}
                            onChange={(event) => setUsername(event.target.value)}
                            placeholder="Enter your username"
                            autoComplete="username"
                            disabled={isSubmitting}
                            className="pl-10 focus-visible:ring-2 focus-visible:ring-blue-600/50"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            disabled={isSubmitting}
                            className="pl-10 pr-10 focus-visible:ring-2 focus-visible:ring-blue-600/50"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((value) => !value)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900"
                            aria-label="Toggle password visibility"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <Button type="submit" disabled={isSubmitting} className="w-full bg-blue-700 hover:bg-blue-800 text-white">
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Authenticating...
                          </>
                        ) : (
                          'Sign In'
                        )}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="otp" className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="mobile">Mobile Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <div className="absolute left-10 top-1/2 -translate-y-1/2 text-sm text-slate-500">+91 |</div>
                        <Input
                          id="mobile"
                          value={mobile}
                          onChange={(event) => setMobile(event.target.value)}
                          placeholder="Enter Mobile Number"
                          disabled={isSubmitting}
                          className="pl-[88px] focus-visible:ring-2 focus-visible:ring-blue-600/50"
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={isSubmitting}
                      className="w-full bg-blue-700 hover:bg-blue-800 text-white"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending OTP...
                        </>
                      ) : (
                        'Send OTP'
                      )}
                    </Button>
                  </TabsContent>
                </Tabs>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAutofill}
                  disabled={isSubmitting}
                  className="w-full border-dashed border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Auto-fill Demo Credentials
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <footer className="px-8 lg:px-16 pb-6">
          <div className="max-w-md mx-auto w-full flex items-center justify-center gap-2 text-xs text-slate-500">
            <Shield className="h-3.5 w-3.5" />
            <span>Secured by Digital India</span>
          </div>
        </footer>
      </section>
    </div>
  )
}
