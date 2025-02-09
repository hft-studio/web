'use client';
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useRouter } from "next/navigation"
import { loginRoute, farmsRoute } from "@/config/routes";

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
      router.push(farmsRoute)
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
              <Link className="flex items-center justify-center animate-fade-in relative z-0" href="#">
                <div className="relative w-[600px] h-[250px] -my-16 pointer-events-none">
                  <Image
                    src="/logo-t.png"
                    alt="HFT Studio Logo"
                    fill
                    className="object-contain scale-[2] transition-transform duration-300"
                    priority
                  />
                </div>
              </Link>
              <div className="grid gap-4 animate-fade-in relative z-10">
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
                    <Link href={loginRoute} className="underline">
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