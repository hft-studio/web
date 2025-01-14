import React from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { AppSidebar } from "@/components/app-sidebar"
import { createClient } from "@/lib/supabase/server"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { PortfolioChart } from "@/components/portfolio-chart"
import { AssetsTable } from "@/components/assets-table"
import { Coinbase } from "@coinbase/coinbase-sdk"
import { Wallet } from "@coinbase/coinbase-sdk"
import { WalletControls } from "@/components/wallet-controls"


const API_KEY_NAME = process.env.CDP_API_KEY_NAME as string
const API_KEY_PRIVATE_KEY = process.env.CDP_API_KEY_PRIVATE_KEY as string

if (!API_KEY_NAME || !API_KEY_PRIVATE_KEY) {
  throw new Error("CDP_API_KEY_NAME and CDP_API_KEY_PRIVATE_KEY must be set")
}

Coinbase.configure({
  apiKeyName: API_KEY_NAME,
  privateKey: API_KEY_PRIVATE_KEY.replace(/\\n/g, "\n"),
})

export default async function WalletPage() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
        throw new Error(error.message)
    }
    const { data: walletData, error: walletError } = await supabase
          .from("wallets")
          .select("*")
          .eq("user_id", user?.id)
          .single()

    if (walletError) {
        throw new Error(walletError.message)
    }
    
    const cbWallet = await Wallet.fetch(walletData.wallet_id)
    const defaultWallet = await cbWallet.getDefaultAddress()
    const defaultAddress = defaultWallet.getWalletId()

    return (
        <SidebarProvider defaultOpen={true}>
            <AppSidebar user={user} />
            <SidebarInset>
                <header className="flex h-14 shrink-0 items-center gap-2">
                    <div className="flex flex-1 items-center gap-2 px-3">
                        <SidebarTrigger />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="line-clamp-1">
                                        Wallet
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-8 p-8 max-w-3xl w-full mx-auto">
                    <div className="mx-auto w-full h-72">
                        <PortfolioChart />
                    </div>
                    <div className="mx-auto w-full">
                        <WalletControls defaultAddress={defaultAddress} />
                    </div>
                    <div className="mx-auto w-full">
                        <AssetsTable />
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
} 