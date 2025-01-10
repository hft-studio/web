import { createTestClient } from '@/lib/supabase/test-client'

async function globalSetup() {
    console.log('Setting up test user...')
    const supabase = createTestClient()
    const { data, error } = await supabase.auth.signUp({
        email: 'test@example.com',
        password: 'password123'
    })

    if (error) {
        console.error('Setup error:', error)
    } else {
        console.log('Test user created:', data)
    }
}

export default globalSetup 