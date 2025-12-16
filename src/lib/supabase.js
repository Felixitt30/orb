import { createClient } from '@supabase/supabase-js'

// Supabase configuration
// Replace these with your actual Supabase project credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Check if Supabase is properly configured
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('YOUR_SUPABASE')

// Create Supabase client or mock client if not configured
export const supabase = isSupabaseConfigured
    ? createClient(supabaseUrl, supabaseAnonKey)
    : {
        // Mock client that does nothing but doesn't crash the app
        from: () => ({
            select: () => Promise.resolve({ data: null, error: null }),
            insert: () => Promise.resolve({ data: null, error: null }),
            update: () => Promise.resolve({ data: null, error: null }),
            upsert: () => Promise.resolve({ data: null, error: null }),
            delete: () => Promise.resolve({ data: null, error: null }),
        }),
        auth: {
            signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
            signUp: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
            signOut: () => Promise.resolve({ error: null }),
            getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        },
        rpc: () => Promise.resolve({ data: null, error: null }),
    }

// Log configuration status
if (!isSupabaseConfigured) {
    console.warn('[Supabase] Not configured - using mock client. App will work in local-only mode.')
    console.warn('[Supabase] To enable cloud sync, create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
}

/**
 * Lightweight keep-alive ping to prevent Supabase free-tier inactivity pause
 * This runs a simple query that resets the inactivity timer
 * Safe to call on app load - minimal bandwidth/latency impact
 */
export async function supabaseKeepAlive() {
    // Only run if Supabase is properly configured
    if (supabaseUrl === 'YOUR_SUPABASE_URL' || !supabaseUrl.includes('supabase')) {
        console.log('[Supabase] Keep-alive skipped: Not configured')
        return null
    }

    try {
        // Simple query that just gets the current server time
        // This is the lightest possible query to keep the project active
        const { data, error } = await supabase.rpc('ping', {}).catch(() => {
            // If ping function doesn't exist, fall back to a simple query
            return supabase.from('_keep_alive').select('count').limit(1).catch(() => {
                // If table doesn't exist, just do a raw health check
                return { data: null, error: null }
            })
        })

        if (error) {
            // Silent fail - don't disrupt the app
            console.log('[Supabase] Keep-alive ping completed (with fallback)')
        } else {
            console.log('[Supabase] Keep-alive ping successful')
        }

        return data
    } catch (err) {
        // Silent fail - keep-alive is not critical
        console.log('[Supabase] Keep-alive ping failed silently:', err.message)
        return null
    }
}

/**
 * Alternative: Use a simple fetch to the Supabase health endpoint
 * This doesn't require any database tables or functions
 */
export async function supabaseHealthCheck() {
    if (supabaseUrl === 'YOUR_SUPABASE_URL' || !supabaseUrl.includes('supabase')) {
        return null
    }

    try {
        // Hit the REST API health endpoint
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
            method: 'HEAD',
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${supabaseAnonKey}`
            }
        })

        console.log('[Supabase] Health check:', response.ok ? 'OK' : 'Failed')
        return response.ok
    } catch (err) {
        console.log('[Supabase] Health check failed:', err.message)
        return false
    }
}
