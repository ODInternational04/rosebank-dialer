import { createClient, SupabaseClient } from '@supabase/supabase-js'

const isBuildTime =
  process.env.NEXT_PHASE === 'phase-production-build' ||
  process.env.npm_lifecycle_event === 'build'

const getPublicSupabaseEnv = (): { url: string; anonKey: string } => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (url && anonKey) {
    return { url, anonKey }
  }

  if (isBuildTime) {
    return {
      url: 'https://placeholder.supabase.co',
      anonKey: 'placeholder-key'
    }
  }

  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

const getServiceRoleKey = (): string => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (serviceRoleKey) {
    return serviceRoleKey
  }

  if (isBuildTime) {
    return 'placeholder-service-key'
  }

  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')
}

const { url: supabaseUrl, anonKey: supabaseAnonKey } = getPublicSupabaseEnv()

// Create client with build-safe configuration
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)

// For admin operations (server-side only)
export const createAdminClient = (): SupabaseClient => {
  const { url } = getPublicSupabaseEnv()
  const serviceKey = getServiceRoleKey()
  
  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}