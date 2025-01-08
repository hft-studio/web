import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

export const createTestClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
        throw new Error(
            'Missing Supabase environment variables. Check that .env.local is being loaded properly.\n' +
            `NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl}\n` +
            `NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseKey}`
        )
    }

    return createClient<Database>(supabaseUrl, supabaseKey)
} 