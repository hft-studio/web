'use client';
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useRouter } from "next/navigation"
import { Bot } from "lucide-react"

interface AuthFormProps {
  mode: 'login' | 'signup'
  onSubmit: (formData: FormData) => Promise<boolean>
}

export const AuthForm = ({ mode, onSubmit }: AuthFormProps) => {
  const router = useRouter()
  const { toast } = useToast()
  
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const success = await onSubmit(formData)
    if (success) {
      router.push('/dashboard')
    } else {
      toast({
        title: "Oops",
        description: mode === 'login' ? "Invalid credentials" : "Error creating account",
      })
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="h-screen">
        <div className="w-full h-full lg:grid lg:h-full lg:grid-cols-1">
          <div className="flex items-center justify-center h-full py-12">
            <div className="mx-auto grid w-[350px] gap-6">
              <Link className="flex items-center justify-center" href="#">
                <Bot className="h-6 w-6 text-green-500" />
                <span className="ml-2 text-2xl font-bold tracking-tight">hft.studio</span>
              </Link>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="m@example.com"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                  </div>
                  <Input id="password" name="password" type="password" required />
                </div>
                <Button type="submit" className="w-full">
                  {mode === 'login' ? 'Login' : 'Sign Up'}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                {mode === 'login' ? (
                  <>
                    Don&apos;t have an account?{" "}
                    <Link href="/sign-up" className="underline">
                      Sign up
                    </Link>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <Link href="/login" className="underline">
                      Login
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
      <Toaster />
    </>
  )
} 