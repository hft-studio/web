import { Home, Droplets, Wallet } from "lucide-react";

export const sidebarConfig = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
    },
    {
      title: "Pools",
      url: "/pools",
      icon: Droplets,
    },
    {
      title: "Wallet",
      url: "/wallet",
      icon: Wallet,
    }
  ]
}
