import { useAccount } from 'wagmi'
import { useUserPosition, useVaultState } from '@yo-protocol/react'  
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatEther } from 'viem'
import { formatUnits } from "viem"

const VAULT_ID = 'yoBTC'

export function VaultStats() {
  const { address } = useAccount()

   
  const { vaultState, isLoading: vaultLoading } = useVaultState(VAULT_ID)

   const { position, isLoading: posLoading } = useUserPosition(VAULT_ID, address)

  const isLoading = vaultLoading || posLoading

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">🏦 Your {VAULT_ID} Vault</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 text-sm">
        <div className="space-y-1">
          <p className="text-muted-foreground">Your shares</p>
          {isLoading ? (
            <Skeleton className="h-5 w-20" />
          ) : (
            <p className="font-semibold">
              {position ? formatEther(position.shares) : '0'}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground">Asset value</p>
          {isLoading ? (
            <Skeleton className="h-5 w-20" />
          ) : (
            <p className="font-semibold">
              {position ? formatEther(position.assets) : '0'} ETH
            </p>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground">Exchange rate</p>
          {isLoading ? (
            <Skeleton className="h-5 w-20" />
          ) : (
            <p className="font-semibold">
              {vaultState?.exchangeRate ? formatUnits(vaultState.exchangeRate, vaultState.decimals): "—"}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground">Total TVL</p>
          {isLoading ? (
            <Skeleton className="h-5 w-20" />
          ) : (
            <p className="font-semibold">
              {vaultState ? formatUnits(vaultState.totalAssets, vaultState.assetDecimals) : '—'} ETH
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
// 