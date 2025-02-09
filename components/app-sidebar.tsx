"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { User } from "@supabase/supabase-js"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { NavUser } from "@/components/nav-user"
import { sidebarConfig } from "@/config/sidebar"
import Image from "next/image"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: User | null
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const router = useRouter()
  return (
    <Sidebar
      collapsible="icon"
      {...props}
    >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="w-full flex items-center justify-center transition-all duration-200 group">
                <div className="relative w-24 h-24 md:w-48 md:h-32 flex items-center justify-center">
                  <Image
                    src="/logo-t.png"
                    alt="HFT Studio Logo"
                    width={256}
                    height={256}
                    className="object-contain scale-125 transition-transform duration-200 group-data-[state=closed]:scale-50"
                    priority
                  />
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent className="px-1.5 md:px-0">
              <SidebarMenu>
                {sidebarConfig.navMain.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={{
                        children: item.title,
                        hidden: false,
                      }}
                      onClick={() => {
                        router.push(item.url)
                      }}
                      isActive={false}
                      className="px-2.5 md:px-2"
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={user} />
        </SidebarFooter>
      </Sidebar>
  )
}
