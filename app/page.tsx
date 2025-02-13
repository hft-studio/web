import { mainRoute } from "@/config/routes"
import { redirect } from "next/navigation"
export default function Home() {
  redirect(mainRoute)
}