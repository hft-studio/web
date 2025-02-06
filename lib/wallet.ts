import { decryptSeed } from "./encryption"
import { createClient } from "./supabase/server"
import { Wallet } from "@/lib/coinbase"

export const getWallet = async () => {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (!user || userError) {
        throw new Error("Unauthorized")
    }

    const { data: walletData, error: walletError } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .single()

    if (!walletData || walletError) {
        throw new Error("Wallet not found")
    }

    const wallet = await Wallet.fetch(walletData.wallet_id)
    const seed = await decryptSeed(walletData.encrypted_seed)
    wallet.setSeed(seed)

    const defaultWallet = await wallet.getDefaultAddress()
    const defaultAddress = defaultWallet.getId()
    return { wallet, defaultAddress, defaultWallet }
}