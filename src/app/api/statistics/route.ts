import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { username, password, clientType = 'gold', date } = await request.json()
    
    console.log('Received credentials:', { username, password, clientType, date })
    console.log('Username match:', username === 'stats')
    console.log('Password match:', password === 'stats123')

    // Validate credentials and determine permissions
    let canViewGold = false
    let canViewVault = false

    if (username === 'stats' && password === 'stats123') {
      // Gold only access
      canViewGold = true
    } else if (username === 'vaultstats' && password === 'vault123') {
      // Vault only access
      canViewVault = true
    } else if (username === 'allstats' && password === 'admin123') {
      // Both access (admin)
      canViewGold = true
      canViewVault = true
    } else {
      console.log('Invalid credentials - rejecting')
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Check if user has permission for requested client type
    if (clientType === 'gold' && !canViewGold) {
      return NextResponse.json(
        { error: 'Unauthorized to view gold clients' },
        { status: 403 }
      )
    }
    if (clientType === 'vault' && !canViewVault) {
      return NextResponse.json(
        { error: 'Unauthorized to view vault clients' },
        { status: 403 }
      )
    }

    // Validate client type
    if (clientType !== 'gold' && clientType !== 'vault') {
      return NextResponse.json(
        { error: 'Invalid client type' },
        { status: 400 }
      )
    }

    // Get date range for the specified date (or today if not provided)
    const targetDate = date ? new Date(date) : new Date()
    targetDate.setHours(0, 0, 0, 0)
    const nextDay = new Date(targetDate)
    nextDay.setDate(nextDay.getDate() + 1)

    // Get total calls for today (filtered by client type)
    const { data: calls, error: callsError } = await supabase
      .from('call_logs')
      .select(`
        id,
        created_at,
        user_id,
        call_status,
        clients!inner(client_type)
      `)
      .eq('clients.client_type', clientType)
      .gte('created_at', targetDate.toISOString())
      .lt('created_at', nextDay.toISOString())

    if (callsError) {
      console.error('Error fetching calls:', callsError)
      throw callsError
    }

    // Get new clients created today (filtered by client type)
    const { data: newClients, error: clientsError } = await supabase
      .from('clients')
      .select('id')
      .eq('client_type', clientType)
      .gte('created_at', targetDate.toISOString())
      .lt('created_at', nextDay.toISOString())

    if (clientsError) {
      console.error('Error fetching new clients:', clientsError)
      throw clientsError
    }

    // Get user call counts
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, first_name, last_name, email')

    if (usersError) {
      console.error('Error fetching users:', usersError)
      throw usersError
    }

    // Count calls per user
    const userCallCounts = users.map(user => {
      const userCalls = calls?.filter(call => call.user_id === user.id) || []
      
      // Count by status
      const statusCounts = {
        completed: userCalls.filter(call => call.call_status === 'completed').length,
        missed: userCalls.filter(call => call.call_status === 'missed').length,
        busy: userCalls.filter(call => call.call_status === 'busy').length,
        no_answer: userCalls.filter(call => call.call_status === 'no_answer').length,
        declined: userCalls.filter(call => call.call_status === 'declined').length
      }
      
      return {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        callCount: userCalls.length,
        statusCounts
      }
    }).sort((a, b) => b.callCount - a.callCount)

    return NextResponse.json({
      totalCalls: calls?.length || 0,
      newClients: newClients?.length || 0,
      userStats: userCallCounts,
      date: targetDate.toISOString(),
      permissions: {
        canViewGold,
        canViewVault
      },
      clientType
    })

  } catch (error) {
    console.error('Statistics API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}
