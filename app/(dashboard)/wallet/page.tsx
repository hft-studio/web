import React from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { AppSidebar } from "@/components/app-sidebar"s
import { createClient } from "@/lib/supabase/server"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { PortfolioChart } from "@/components/portfolio-chart"
import { AssetsTable } from "@/components/assets-table"
import { WalletControls } from "@/components/wallet-controls"
import { fetchTokenPrices } from "@/lib/prices"
import { Wallet} from '@/lib/coinbase/config'

export default async function WalletPage() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
        throw new Error(error?.message || "No user found")
    }
    // Get or create wallet
    const { data: walletData, error: walletError } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .single()

    if (!walletData) {
        throw new Error("No wallet found")
    }
    if (walletError) {
        throw new Error(walletError.message)
    }

    const cbWallet = await Wallet.fetch(walletData.wallet_id)
    const defaultWallet = await cbWallet.getDefaultAddress()
    const defaultAddress = defaultWallet.getId()
    
    // Fetch balances and prices in parallel
    const [balances, prices] = await Promise.all([
        defaultWallet.listBalances(),
        fetchTokenPrices()
    ])

    // Format balances
    const formattedBalances: Record<string, number> = {}
    balances.forEach((balance, currency) => {
        formattedBalances[currency.toLowerCase()] = parseFloat(balance.toString())
    })

    // Calculate total portfolio value
    let totalValue = 0
    Object.entries(formattedBalances).forEach(([currency, balance]) => {
        const price = prices[currency]?.price || 0
        totalValue += balance * price
    })

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
                    <div className="mx-auto w-full h-[300px]">
                        <PortfolioChart 
                            balances={formattedBalances} 
                            prices={prices} 
                            totalValue={totalValue}
                        />
                    </div>
                    <div className="mx-auto w-full">
                        <WalletControls defaultAddress={defaultAddress} />
                    </div>
                    <div className="mx-auto w-full">
                        <AssetsTable 
                            balances={formattedBalances} 
                            prices={prices} 
                        />
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
} 