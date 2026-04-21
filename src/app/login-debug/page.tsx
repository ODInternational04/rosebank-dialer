'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginDebugPage() {
  const [email, setEmail] = useState('admin@dialersystem.com')
  const [password, setPassword] = useState('admin123')
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const router = useRouter()

  const clearBrowserData = () => {
    if (typeof window === 'undefined') return
    
    // Clear all login-related data
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('loginSecurityState')
    
    // Clear session storage
    sessionStorage.clear()
    
    setResult({ message: 'All browser data cleared successfully!' })
    setError('')
  }

  const testDirectLogin = async () => {
    setResult(null)
    setError('')
    
    try {
      console.log('🔄 Testing direct login API call...')
      console.log('Email:', email)
      console.log('Password length:', password.length)
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        cache: 'no-store',
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))

      const data = await response.json()
      console.log('Response data:', data)

      if (response.ok) {
        // Store the token
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        
        setResult({
          success: true,
          message: 'Login successful!',
          user: data.user,
          token: data.token.substring(0, 20) + '...',
          stored: {
            token: localStorage.getItem('token')?.substring(0, 20) + '...',
            user: JSON.parse(localStorage.getItem('user') || '{}')
          }
        })
        
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      } else {
        setError(`Login failed: ${data.error || 'Unknown error'}`)
        setResult({
          success: false,
          status: response.status,
          error: data.error,
          code: data.code,
          attemptsRemaining: data.attemptsRemaining,
          retryAfter: data.retryAfter
        })
      }
    } catch (err) {
      console.error('❌ Login test error:', err)
      setError(`Network error: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setResult({
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      })
    }
  }

  const checkBrowserState = () => {
    const state = {
      localStorage: {
        token: localStorage.getItem('token')?.substring(0, 20),
        user: localStorage.getItem('user'),
        loginSecurityState: localStorage.getItem('loginSecurityState')
      },
      sessionStorage: {
        keys: Object.keys(sessionStorage)
      },
      cookies: document.cookie,
      navigator: {
        onLine: navigator.onLine,
        userAgent: navigator.userAgent
      }
    }
    setResult(state)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">🔧 Login Debug Tool</h1>
          
          <div className="space-y-6">
            {/* Login Form */}
            <div className="border-b pb-6">
              <h2 className="text-lg font-semibold mb-4">Test Login</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <button
                  onClick={testDirectLogin}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  🚀 Test Direct Login
                </button>
              </div>
            </div>

            {/* Diagnostic Tools */}
            <div className="border-b pb-6">
              <h2 className="text-lg font-semibold mb-4">Diagnostic Tools</h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={clearBrowserData}
                  className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
                >
                  🧹 Clear Browser Data
                </button>
                <button
                  onClick={checkBrowserState}
                  className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
                >
                  🔍 Check Browser State
                </button>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                <strong>Error:</strong> {error}
              </div>
            )}

            {/* Result Display */}
            {result && (
              <div className="bg-gray-50 border border-gray-200 rounded p-4">
                <h3 className="font-semibold mb-2">Result:</h3>
                <pre className="text-xs overflow-auto bg-gray-900 text-gray-100 p-3 rounded">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}

            {/* Default Credentials */}
            <div className="bg-blue-50 border border-blue-200 rounded p-4">
              <h3 className="font-semibold text-blue-900 mb-2">📋 Default Credentials</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>Admin:</strong> admin@dialersystem.com / admin123</p>
                <p><strong>User:</strong> user1@dialersystem.com / admin123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
