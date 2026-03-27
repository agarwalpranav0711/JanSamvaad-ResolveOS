'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { IndiaFlag } from '@/components/india-flag'
import { Spinner } from '@/components/ui/spinner'
import { Shield, Lock, User, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username.trim() || !password.trim()) {
      toast.error('Please enter both username and password')
      return
    }

    setIsLoading(true)
    
    // Simulate authentication
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Demo credentials check
    if (username === 'admin' && password === 'admin123') {
      toast.success('Login successful! Redirecting...')
      router.push('/dashboard')
    } else {
      toast.error('Invalid credentials. Use admin/admin123 for demo.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-navy via-primary to-navy">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
      
      {/* Header */}
      <header className="relative z-10 p-4">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md">
          {/* Government Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center gap-3 mb-4">
              <IndiaFlag size="lg" />
              <div className="text-left">
                <p className="text-xs text-white/60 uppercase tracking-wider">Government of India</p>
                <p className="text-sm font-medium text-white">Ministry of Housing & Urban Affairs</p>
              </div>
            </div>
          </div>

          {/* Login Card */}
          <Card className="border-0 shadow-2xl">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 rounded-full bg-navy/10 flex items-center justify-center mb-3">
                <Shield className="h-8 w-8 text-navy" />
              </div>
              <CardTitle className="text-xl font-bold">Municipal Operations Portal</CardTitle>
              <CardDescription>
                Authorized personnel access only
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">
                    Username
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10 h-11"
                      disabled={isLoading}
                      autoComplete="username"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-11"
                      disabled={isLoading}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 bg-navy hover:bg-navy/90 text-white font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>

              {/* Demo Credentials */}
              <div className="mt-6 p-3 bg-muted/50 rounded-lg border border-dashed">
                <p className="text-xs text-muted-foreground text-center mb-2">Demo Credentials</p>
                <div className="flex items-center justify-center gap-4 font-mono text-sm">
                  <span className="text-foreground">admin</span>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-foreground">admin123</span>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex-col gap-3 pt-0">
              <div className="w-full border-t pt-4">
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Shield className="h-3 w-3" />
                  <span>Secured by Digital India</span>
                </div>
              </div>
            </CardFooter>
          </Card>

          {/* Security Notice */}
          <p className="text-center text-xs text-white/40 mt-6 max-w-sm mx-auto">
            This is a secure government portal. Unauthorized access is prohibited and may be subject to legal action.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-4 text-center">
        <p className="text-xs text-white/30">
          © 2024 Government of India. JanSamvaad ResolveOS
        </p>
      </footer>
    </div>
  )
}
