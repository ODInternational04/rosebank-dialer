'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

const LOGIN_SECURITY_STATE_KEY = 'loginSecurityState'

interface LoginSecurityState {
  email: string
  attemptsRemaining: number | null
  lockoutUntil: number | null
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null)
  const [lockoutSeconds, setLockoutSeconds] = useState(0)
  const { login, isLoading: authLoading, user } = useAuth()
  const router = useRouter()

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/dashboard')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const stored = localStorage.getItem(LOGIN_SECURITY_STATE_KEY)
    if (!stored) return

    try {
      const parsed = JSON.parse(stored) as LoginSecurityState
      if (parsed.email) {
        setEmail(parsed.email)
      }

      if (typeof parsed.attemptsRemaining === 'number') {
        setAttemptsRemaining(parsed.attemptsRemaining)
      }

      if (parsed.lockoutUntil && parsed.lockoutUntil > Date.now()) {
        setLockoutSeconds(Math.ceil((parsed.lockoutUntil - Date.now()) / 1000))
      }
    } catch {
      localStorage.removeItem(LOGIN_SECURITY_STATE_KEY)
    }
  }, [])

  useEffect(() => {
    if (lockoutSeconds <= 0) return

    const timer = setInterval(() => {
      setLockoutSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [lockoutSeconds])

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${String(seconds).padStart(2, '0')}`
  }

  const persistSecurityState = (nextState: LoginSecurityState) => {
    if (typeof window === 'undefined') return
    localStorage.setItem(LOGIN_SECURITY_STATE_KEY, JSON.stringify(nextState))
  }

  const clearSecurityState = () => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(LOGIN_SECURITY_STATE_KEY)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (lockoutSeconds > 0) {
        setError(`Too many failed attempts. Try again in ${formatTime(lockoutSeconds)}.`)
        return
      }

      // Wait for auth to be ready
      if (authLoading) {
        setError('Authentication system is initializing. Please wait...')
        setIsLoading(false)
        return
      }
      
      const result = await login(email, password)
      if (result.success) {
        setAttemptsRemaining(null)
        setLockoutSeconds(0)
        clearSecurityState()
        // Use replace to prevent back button issues
        router.replace('/dashboard')
      } else {
        if (result.code === 'ACCOUNT_LOCKED' && result.retryAfter) {
          setLockoutSeconds(result.retryAfter)
          setAttemptsRemaining(0)
          setError(`Too many failed attempts. Try again in ${formatTime(result.retryAfter)}.`)
          persistSecurityState({
            email,
            attemptsRemaining: 0,
            lockoutUntil: Date.now() + result.retryAfter * 1000,
          })
        } else if (result.code === 'RATE_LIMIT_EXCEEDED' && result.retryAfter) {
          setLockoutSeconds(result.retryAfter)
          setAttemptsRemaining(null)
          setError(`Rate limit exceeded. Try again in ${formatTime(result.retryAfter)}.`)
          persistSecurityState({
            email,
            attemptsRemaining: null,
            lockoutUntil: Date.now() + result.retryAfter * 1000,
          })
        } else {
          if (typeof result.attemptsRemaining === 'number') {
            setAttemptsRemaining(result.attemptsRemaining)
            setError(`Invalid email or password. Attempts remaining: ${result.attemptsRemaining}`)
            persistSecurityState({
              email,
              attemptsRemaining: result.attemptsRemaining,
              lockoutUntil: null,
            })
          } else {
            setAttemptsRemaining(null)
            setError(result.error || 'Invalid email or password')
            persistSecurityState({
              email,
              attemptsRemaining: null,
              lockoutUntil: null,
            })
          }
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('An error occurred during login. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="card p-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              IBV Dialer
            </h1>
            <p className="text-gray-600 mb-8">
              Sign in to your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="label">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  const nextEmail = e.target.value
                  setEmail(nextEmail)
                  if (attemptsRemaining !== null || lockoutSeconds > 0) {
                    persistSecurityState({
                      email: nextEmail,
                      attemptsRemaining,
                      lockoutUntil: lockoutSeconds > 0 ? Date.now() + lockoutSeconds * 1000 : null,
                    })
                  }
                }}
                className="input"
                placeholder="Enter your email"
                disabled={lockoutSeconds > 0}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="Enter your password"
                disabled={lockoutSeconds > 0}
                required
              />
            </div>

            {attemptsRemaining !== null && lockoutSeconds === 0 && (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Attempts remaining: {attemptsRemaining}
              </p>
            )}

            {lockoutSeconds > 0 && (
              <p className="text-sm text-danger-700 bg-danger-50 border border-danger-200 rounded-lg px-3 py-2">
                Login temporarily locked. Try again in {formatTime(lockoutSeconds)}.
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading || authLoading || lockoutSeconds > 0}
              className="w-full btn btn-primary py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {authLoading
                ? 'Initializing...'
                : lockoutSeconds > 0
                  ? `Locked (${formatTime(lockoutSeconds)})`
                  : isLoading
                    ? 'Signing in...'
                    : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Need an account? Contact your administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}