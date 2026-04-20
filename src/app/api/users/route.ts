import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { verifyToken, hashPassword, validatePasswordStrength } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Only admin can manage users
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search')
    const role = searchParams.get('role')
    const isActive = searchParams.get('isActive')

    const offset = (page - 1) * limit

    let query = supabase
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        role,
        is_active,
        can_access_vault_clients,
        can_access_gold_clients,
        created_at,
        updated_at,
        last_login
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    if (role) {
      query = query.eq('role', role)
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }

    // Get total count
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    // Get paginated data
    const { data: users, error } = await query
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Get call statistics for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const { data: callStats } = await supabase
          .from('call_logs')
          .select('call_status')
          .eq('user_id', user.id)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

        const totalCalls = callStats?.length || 0
        const completedCalls = callStats?.filter(call => call.call_status === 'completed').length || 0
        const successRate = totalCalls > 0 ? Math.round((completedCalls / totalCalls) * 100) : 0

        return {
          ...user,
          stats: {
            totalCalls,
            completedCalls,
            successRate,
          }
        }
      })
    )

    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      users: usersWithStats,
      totalCount: count || 0,
      page,
      limit,
      totalPages,
    })
  } catch (error) {
    console.error('Error in users GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Only admin can create users
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      email, 
      password, 
      first_name, 
      last_name, 
      role,
      can_access_vault_clients = true,
      can_access_gold_clients = false
    } = body

    // Validate required fields
    if (!email || !password || !first_name || !last_name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password, first_name, last_name, role' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Validate password strength
    const passwordErrors = validatePasswordStrength(password)
    if (passwordErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'Password does not meet security requirements',
          details: passwordErrors
        },
        { status: 400 }
      )
    }

    // Validate role
    if (!['admin', 'user'].includes(role)) {
      return NextResponse.json({ error: 'Role must be either "admin" or "user"' }, { status: 400 })
    }

    // Validate that user has access to at least one client type
    if (!can_access_vault_clients && !can_access_gold_clients) {
      return NextResponse.json({ 
        error: 'User must have access to at least one client type (vault or gold)' 
      }, { status: 400 })
    }

    // Check if email already exists
    const normalizedEmail = email.toLowerCase()

    const { data: existingUser } = await supabase
      .from('users')
      .select('email')
      .eq('email', normalizedEmail)
      .single()

    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 })
    }

    // Hash password
    const password_hash = await hashPassword(password)

    const userData = {
      email: normalizedEmail,
      password_hash,
      first_name,
      last_name,
      role,
      is_active: true,
      can_access_vault_clients,
      can_access_gold_clients,
    }

    const { data: user, error } = await supabase
      .from('users')
      .insert(userData)
      .select(`
        id,
        email,
        first_name,
        last_name,
        role,
        is_active,
        can_access_vault_clients,
        can_access_gold_clients,
        created_at,
        updated_at
      `)
      .single()

    if (error) {
      // In rare cases, insert can succeed while the returning/select path errors.
      // Verify existence by email and treat as success if the user was created.
      const { data: createdUser } = await supabase
        .from('users')
        .select(`
          id,
          email,
          first_name,
          last_name,
          role,
          is_active,
          can_access_vault_clients,
          can_access_gold_clients,
          created_at,
          updated_at
        `)
        .eq('email', normalizedEmail)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (createdUser) {
        return NextResponse.json({
          ...createdUser,
          stats: {
            totalCalls: 0,
            completedCalls: 0,
            successRate: 0,
          }
        }, { status: 201 })
      }

      console.error('Error creating user:', error)
      return NextResponse.json(
        {
          error: 'Failed to create user',
          details: error.message
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ...user,
      stats: {
        totalCalls: 0,
        completedCalls: 0,
        successRate: 0,
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error in users POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}