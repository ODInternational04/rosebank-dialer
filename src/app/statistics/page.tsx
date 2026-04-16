'use client'

import { useState, useEffect } from 'react'
import { ChartBarIcon, UserGroupIcon, PhoneIcon, UserPlusIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'

interface UserStats {
  id: string
  name: string
  email: string
  callCount: number
  statusCounts?: {
    completed: number
    missed: number
    busy: number
    no_answer: number
    declined: number
  }
}

interface Statistics {
  totalCalls: number
  newClients: number
  userStats: UserStats[]
  date: string
  permissions?: {
    canViewGold: boolean
    canViewVault: boolean
  }
  clientType?: 'gold' | 'vault'
}

export default function StatisticsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'gold' | 'vault'>('gold')
  const [goldStats, setGoldStats] = useState<Statistics | null>(null)
  const [vaultStats, setVaultStats] = useState<Statistics | null>(null)
  const [permissions, setPermissions] = useState({
    canViewGold: false,
    canViewVault: false
  })
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      console.log('Attempting login with:', { username, password })
      // Fetch Gold stats first to get permissions
      const response = await fetch('/api/statistics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, clientType: 'gold', date: selectedDate })
      })

      console.log('Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Login failed:', errorData)
        throw new Error('Invalid credentials')
      }

      const data = await response.json()
      console.log('Login successful, data:', data)
      
      // Store permissions
      if (data.permissions) {
        setPermissions(data.permissions)
        
        // Set initial stats based on permissions
        if (data.permissions.canViewGold) {
          setGoldStats(data)
          setActiveTab('gold')
        } else if (data.permissions.canViewVault) {
          setActiveTab('vault')
          // Fetch vault stats
          fetchStatsForType('vault')
        }
      }
      
      setIsAuthenticated(true)
      setPassword('')
    } catch (err) {
      console.error('Login error:', err)
      setError('Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setUsername('')
    setPassword('')
    setGoldStats(null)
    setVaultStats(null)
    setPermissions({ canViewGold: false, canViewVault: false })
  }

  const fetchStatsForType = async (clientType: 'gold' | 'vault') => {
    if (!isAuthenticated) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/statistics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username, 
          password: username === 'stats' ? 'stats123' : username === 'vaultstats' ? 'vault123' : 'admin123',
          clientType,
          date: selectedDate
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (clientType === 'gold') {
          setGoldStats(data)
        } else {
          setVaultStats(data)
        }
      }
    } catch (err) {
      console.error('Error fetching stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    await fetchStatsForType(activeTab)
  }

  const handleTabChange = async (tab: 'gold' | 'vault') => {
    setActiveTab(tab)
    // Fetch data if not already cached
    if (tab === 'gold' && !goldStats) {
      await fetchStatsForType('gold')
    } else if (tab === 'vault' && !vaultStats) {
      await fetchStatsForType('vault')
    }
  }

  const handleDateChange = async (newDate: string) => {
    setSelectedDate(newDate)
    // Clear cached stats and refetch for the new date
    setGoldStats(null)
    setVaultStats(null)
    // Fetch stats for active tab with new date
    await fetchStatsForType(activeTab)
  }

  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(refreshData, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, activeTab])

  // Refetch data when date changes
  useEffect(() => {
    if (isAuthenticated && selectedDate) {
      handleDateChange(selectedDate)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-4">
              <ChartBarIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Statistics Portal</h1>
            <p className="text-gray-600">Client Statistics Dashboard</p>
          </div>

          {/* Login Options Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm font-semibold text-gray-700 mb-2">Available Access Levels:</p>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <span className="font-mono bg-white px-2 py-0.5 rounded">stats / stats123</span>
                <span>→ ⭐ Gold clients only</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono bg-white px-2 py-0.5 rounded">vaultstats / vault123</span>
                <span>→ 🔒 Vault clients only</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono bg-white px-2 py-0.5 rounded">allstats / admin123</span>
                <span>→ ⭐ + 🔒 Both (Admin)</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                placeholder="Enter username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                placeholder="Enter password"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 text-red-700 text-sm font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Get current statistics based on active tab
  const currentStats = activeTab === 'gold' ? goldStats : vaultStats

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Client Statistics Dashboard</h1>
              <p className="text-gray-600">
                Daily Overview - {currentStats?.date ? new Date(currentStats.date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }) : ''}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-gray-700">
                  Date:
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 text-sm font-medium"
                />
              </div>
              <button
                onClick={refreshData}
                disabled={loading}
                className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold rounded-lg transition-all duration-200 disabled:opacity-50"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-lg transition-all duration-200"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Client Type Toggle Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 mb-6">
          <div className="flex space-x-2">
            {permissions.canViewGold && (
              <button
                onClick={() => handleTabChange('gold')}
                disabled={loading}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                  activeTab === 'gold'
                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-lg">⭐</span>
                <span>Gold Clients</span>
              </button>
            )}
            {permissions.canViewVault && (
              <button
                onClick={() => handleTabChange('vault')}
                disabled={loading}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                  activeTab === 'vault'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-lg">🔒</span>
                <span>Vault Clients</span>
              </button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Total Calls Card */}
          <div className={`bg-gradient-to-br rounded-2xl shadow-lg p-6 text-white ${
            activeTab === 'gold' ? 'from-yellow-500 to-yellow-600' : 'from-blue-500 to-blue-600'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-semibold mb-1 ${
                  activeTab === 'gold' ? 'text-yellow-100' : 'text-blue-100'
                }`}>Total Calls Today</p>
                <p className="text-5xl font-bold">{currentStats?.totalCalls || 0}</p>
              </div>
              <div className="bg-white/20 rounded-full p-4">
                <PhoneIcon className="w-10 h-10" />
              </div>
            </div>
          </div>

          {/* New Clients Card */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-semibold mb-1">
                  New {activeTab === 'gold' ? 'Gold' : 'Vault'} Clients
                </p>
                <p className="text-5xl font-bold">{currentStats?.newClients || 0}</p>
              </div>
              <div className="bg-white/20 rounded-full p-4">
                <UserPlusIcon className="w-10 h-10" />
              </div>
            </div>
          </div>
        </div>

        {/* User Statistics Table */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className={`bg-gradient-to-br rounded-lg p-3 ${
              activeTab === 'gold' ? 'from-yellow-500 to-yellow-600' : 'from-blue-500 to-blue-600'
            }`}>
              <UserGroupIcon className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              User Call Statistics - {activeTab === 'gold' ? 'Gold' : 'Vault'} Clients
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Rank</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">User Name</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Email</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Total Calls</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-green-700">Completed</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-yellow-700">Missed</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-orange-700">Busy</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-red-700">No Answer</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">Performance</th>
                </tr>
              </thead>
              <tbody>
                {currentStats?.userStats && currentStats.userStats.length > 0 ? (
                  currentStats.userStats.map((user, index) => (
                    <tr 
                      key={user.id} 
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        index === 0 && user.callCount > 0 ? 'bg-yellow-50' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {index === 0 && user.callCount > 0 ? (
                            <span className="text-2xl">🥇</span>
                          ) : index === 1 && user.callCount > 0 ? (
                            <span className="text-2xl">🥈</span>
                          ) : index === 2 && user.callCount > 0 ? (
                            <span className="text-2xl">🥉</span>
                          ) : (
                            <span className="text-gray-500 font-semibold">#{index + 1}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-800">{user.name}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{user.email}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-full text-sm">
                          {user.callCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center bg-green-100 text-green-800 font-semibold px-3 py-1 rounded-full text-sm">
                          {user.statusCounts?.completed || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center bg-yellow-100 text-yellow-800 font-semibold px-3 py-1 rounded-full text-sm">
                          {user.statusCounts?.missed || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center bg-orange-100 text-orange-800 font-semibold px-3 py-1 rounded-full text-sm">
                          {user.statusCounts?.busy || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center bg-red-100 text-red-800 font-semibold px-3 py-1 rounded-full text-sm">
                          {user.statusCounts?.no_answer || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-500 ${
                                activeTab === 'gold' 
                                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' 
                                  : 'bg-gradient-to-r from-blue-500 to-blue-600'
                              }`}
                              style={{ 
                                width: `${currentStats.totalCalls > 0 ? (user.callCount / currentStats.totalCalls) * 100 : 0}%` 
                              }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-gray-600 w-12 text-right">
                            {currentStats.totalCalls > 0 ? Math.round((user.callCount / currentStats.totalCalls) * 100) : 0}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No user data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-gray-600 text-sm">
          <p>Statistics are updated in real-time and auto-refresh every 30 seconds</p>
        </div>
      </div>
    </div>
  )
}
