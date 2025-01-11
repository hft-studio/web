import { createTestClient } from '@/lib/supabase/test-client'

const TEST_EMAIL = process.env.TEST_EMAIL!
const TEST_PASSWORD = process.env.TEST_PASSWORD!

async function globalSetup() {
    if( process.env.NODE_ENV === 'development' ) {
        const supabase = createTestClient()
        const { data, error } = await supabase.auth.signUp({
            email: TEST_EMAIL,
            password: TEST_PASSWORD
        })
    
        if (error) {
            console.error('Setup error:', error)
        } else {
            console.log('Test user created:', data)
        }

    }
}

export default globalSetup 