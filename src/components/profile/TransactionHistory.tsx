import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { Transaction } from '@/types'

interface Props {
  transactions: Transaction[]
}

export function TransactionHistory({ transactions }: Props) {
  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-sm text-muted-foreground">
          No transactions yet. Send ETH to get started.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Transaction History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-0 divide-y">
        {transactions.map((tx, i) => (
          <div key={tx.id} className="py-3 text-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-muted-foreground truncate w-36">
                → {tx.to.slice(0, 6)}...{tx.to.slice(-4)}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{tx.actualAmount} ETH</span>
                {tx.didRoundUp && (
                  <Badge variant="secondary" className="text-green-600 text-xs">
                    +{tx.savedAmount} saved
                  </Badge>
                )}
              </div>
            </div>
            {tx.didRoundUp && (
              <div className="flex justify-between text-xs text-muted-foreground pl-1">
                <span>Rounded: {tx.actualAmount} → {tx.roundedAmount} ETH</span>
                <span>{new Date(tx.timestamp).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}