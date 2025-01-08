import { AuthForm } from "@/components/auth-form"
import { createClient } from "@/lib/supabase/server"

export default function LoginPage() {
  
  const login = async (formData: FormData) => {
    "use server";
    const supabase = await createClient()
  
    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    }
  
    const { data: _loginData, error } = await supabase.auth.signInWithPassword(data)
  
    if (error) {
      console.error(error)
      return false
    } else {
      return true
    }
  }

  return <AuthForm mode="login" onSubmit={login} />
}