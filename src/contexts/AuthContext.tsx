'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@/types'

interface AuthContextType {
  user: Omit<User, 'password'> | null
  login: (email: string, password: string) => Promise<LoginResult>
  logout: () => void
  isLoading: boolean
  isAdmin: boolean
}

export interface LoginResult {
  success: boolean
  error?: string
  code?: string
  retryAfter?: number
  attemptsRemaining?: number
  status?: number
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<Omit<User, 'password'> | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      console.log('🔐 Starting login attempt for:', email)
      
      // Clear any existing auth state before attempting login
      setUser(null)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        console.log('✓ Cleared existing auth data')
      }

      console.log('📤 Sending login request to API...')
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        cache: 'no-store', // Prevent caching issues
      })

      console.log('📥 Received response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Login successful:', {
          email: data.user?.email,
          role: data.user?.role,
          hasToken: !!data.token
        })
        
        // Ensure localStorage is available (client-side only)
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', data.token)
          localStorage.setItem('user', JSON.stringify(data.user))
          console.log('✓ Auth data stored in localStorage')
        }
        
        // Set user state after successful storage
        setUser(data.user)
        return { success: true }
      }

      const errorData = await response.json().catch(() => ({}))
      console.error('❌ Login failed:', {
        status: response.status,
        error: errorData.error,
        code: errorData.code,
        attemptsRemaining: errorData.attemptsRemaining
      })
      
      const retryAfterHeader = response.headers.get('retry-after')
      return {
        success: false,
        error: errorData.error || 'Login failed',
        code: errorData.code,
        retryAfter: errorData.retryAfter || (retryAfterHeader ? Number(retryAfterHeader) : undefined),
        attemptsRemaining: errorData.attemptsRemaining,
        status: response.status,
      }
    } catch (error) {
      console.error('💥 Login error (exception):', error)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('Network error - is the server running?')
        return {
          success: false,
          error: 'Network error. Please check your connection and try again.'
        }
      }
      return {
        success: false,
        error: 'An error occurred during login. Please try again.'
      }
    }
  }

  const logout = () => {
    setUser(null)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch('/api/auth/verify', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store', // Prevent caching issues
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        return true
      }
      return false
    } catch (error) {
      console.error('Token verification error:', error)
      return false
    }
  }

  useEffect(() => {
    const initAuth = async () => {
      // Ensure we're on the client side
      if (typeof window === 'undefined') {
        setIsLoading(false)
        return
      }

      try {
        const token = localStorage.getItem('token')
        const userData = localStorage.getItem('user')

        if (token && userData) {
          const isValid = await verifyToken(token)
          if (!isValid) {
            logout()
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        logout()
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  const isAdmin = user?.role === 'admin'

  const value: AuthContextType = {
    user,
    login,
    logout,
    isLoading,
    isAdmin,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}