import { useState } from 'react'
import { useAccount, useSendTransaction } from 'wagmi'
import { parseEther, isAddress } from 'viem'
import { useDeposit, useVaultState } from '@yo-protocol/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { RoundUpConsentModal } from './RoundUpConsentModal'
import { roundUpToNearest5, getSavingsAmount } from '@/hooks/useRoundUp'
import type { Transaction } from '@/types'

const VAULT_ID = 'yoBTC' 

export function SendForm({ onTransactionComplete }: { onTransactionComplete: (tx: Transaction) => void }) {
  const { isConnected } = useAccount()

  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [showConsent, setShowConsent] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

   
  const { vaultState } = useVaultState(VAULT_ID)

  
  const {
    deposit,
    step,          // 'idle' | 'approving' | 'depositing' | 'waiting' | 'success' | 'error'
    isLoading,
    isSuccess,
    approveHash,
    hash,
    error,
    reset,
  } = useDeposit({
    vault: VAULT_ID,
    slippageBps: 50,
    onConfirmed: (hash) => console.log('Vault deposit confirmed:', hash),
    onError: (err) => console.error('Vault deposit error:', err),
  })

  const { sendTransactionAsync } = useSendTransaction()

  const parsedAmount = parseFloat(amount)
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount > 0
  const isValidRecipient = isAddress(recipient)
  const roundedAmount = isValidAmount ? roundUpToNearest5(parsedAmount) : 0
  const savingsAmount = isValidAmount ? getSavingsAmount(parsedAmount) : 0
  const hasRoundUp = savingsAmount > 0

  // Human-readable step label for UI feedback
  const stepLabel: Record<string, string> = {
    idle: 'Send',
    approving: 'Approving token...',
    depositing: 'Depositing to vault...',
    waiting: 'Confirming...',
    success: 'Done!',
    error: 'Failed',
  }

  function handleSendClick() {
    if (!isValidAmount || !isValidRecipient) return
    if (hasRoundUp) {
      setShowConsent(true)
    } else {
      executeSend(false)
    }
  }

  async function executeSend(withRoundUp: boolean) {
    setShowConsent(false)
    setIsSaving(true)

    try {
      // 1. Send actual ETH amount to recipient
      const sendHash = await sendTransactionAsync({
        to: recipient as `0x${string}`,
        value: parseEther(amount),
      })

      let vaultTxHash: string | undefined

      // 2. If consented, deposit the savings into the vault
      if (withRoundUp && savingsAmount > 0 && vaultState?.underlying?.address) {
        const savingsWei = parseEther(savingsAmount.toString())

        // ✅ Correct deposit() signature: object with token + amount
        // useDeposit handles the ERC-20 approve step automatically before depositing
        const vaultHash = await deposit({
          token: vaultState.underlying.address,
          amount: savingsWei,
          // chainId: 1,  // optional — add if you want to force chain switch
        })
        vaultTxHash = vaultHash
      }

      // 3. Save transaction record
      const tx: Transaction = {
        id: crypto.randomUUID(),
        to: recipient,
        actualAmount: amount,
        roundedAmount: roundedAmount.toString(),
        savedAmount: withRoundUp ? savingsAmount.toString() : '0',
        didRoundUp: withRoundUp,
        timestamp: Date.now(),
        txHash: sendHash,
        vaultTxHash,
      }

      onTransactionComplete(tx)
      setAmount('')
      setRecipient('')
      reset() // reset useDeposit state back to idle

    } catch (err) {
      console.error('Transaction failed:', err)
    } finally {
      setIsSaving(false)
    }
  }

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          Connect your wallet to start sending.
        </CardContent>
      </Card>
    )
  }

  const busy = isSaving || isLoading

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Send ETH</CardTitle>
          <CardDescription>
            Send to anyone. We'll round up and grow your spare change.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="recipient">Recipient address</Label>
            <Input
              id="recipient"
              placeholder="0x..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="amount">Amount (ETH)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="e.g. 16"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          {/* Live round-up preview */}
          {isValidAmount && hasRoundUp && (
            <div className="rounded-md bg-muted px-4 py-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rounded up to</span>
                <span>{roundedAmount} ETH</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Potential savings</span>
                <span>+{savingsAmount} ETH</span>
              </div>
            </div>
          )}

          {isValidAmount && !hasRoundUp && (
            <p className="text-xs text-muted-foreground">
              Already a multiple of 5 — no round-up this time.
            </p>
          )}

          {/* Step status — only shows during vault deposit flow */}
          {isLoading && step !== 'idle' && (
            <p className="text-xs text-muted-foreground">
              Vault: {stepLabel[step] ?? step}
              {approveHash && ` (approve tx: ${approveHash.slice(0, 10)}...)`}
            </p>
          )}

          {error && (
            <p className="text-xs text-red-500">
              Error: {error.message}{' '}
              <button className="underline" onClick={reset}>Dismiss</button>
            </p>
          )}

          <Button
            className="w-full"
            onClick={handleSendClick}
            disabled={!isValidAmount || !isValidRecipient || busy}
          >
            {busy ? (stepLabel[step] ?? 'Processing...') : 'Send'}
          </Button>
        </CardContent>
      </Card>

      <RoundUpConsentModal
        open={showConsent}
        actualAmount={amount}
        roundedAmount={roundedAmount.toString()}
        savingsAmount={savingsAmount.toString()}
        recipient={recipient}
        onConsent={() => executeSend(true)}
        onDecline={() => executeSend(false)}
        isSaving={busy}
      />
    </>
  )
}