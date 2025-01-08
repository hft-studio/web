import { AuthForm } from "@/components/auth-form"
import { createClient } from "@/lib/supabase/server"

export default function SignUpPage() {

    async function signup(formData: FormData) {
        "use server"
        const supabase = await createClient()
      
        const data = {
          email: formData.get('email') as string,
          password: formData.get('password') as string,
        }
      
        const { error } = await supabase.auth.signUp(data)
      
        if (error) {
          return false
        } else {
          return true
        }
      }

  return <AuthForm mode="signup" onSubmit={signup} />
}