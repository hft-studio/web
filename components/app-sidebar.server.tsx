"use server"

import React from "react"
import { AppSidebarClient } from './app-sidebar'
import { createClient } from '@/lib/supabase/server'

export const AppSidebar = async () => {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    throw new Error(error.message)
  }
  return <AppSidebarClient user={user} />
}