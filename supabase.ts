import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        // Stores the session per browser tab, which matches the app's current auth UX.
        storage: window.sessionStorage,
        autoRefreshToken: true,
        persistSession: true,
        // Allows Supabase to complete auth flows that return tokens in the URL.
        detectSessionInUrl: true
    }
})
