import { useState } from 'react'
import { useAccount, useWalletClient, usePublicClient } from 'wagmi'
import { parseUnits, maxUint256 } from 'viem'
import { useDeposit } from '@yo-protocol/react'
import { fetchSwapQuote } from "../lib/swapUtils"
import { TOKENS, DECIMALS, ERC20_ABI, VAULT_ID } from '../lib/constants'
import type { Transaction } from '@/types'
import { roundUpToNearest5, getSavingsAmount } from '@/hooks/useRoundUp'

// ─── Step labels shown in the UI ──────────────────────────────────────────────
export type SendStep =
  | 'idle'
  | 'approving_swap'    // 1. approve USDC → 0x allowance-holder
  | 'swapping'          // 2. swap USDC → cbBTC
  | 'depositing'        // 3. deposit cbBTC → yoBTC vault (approve handled by SDK)
  | 'sending'           // 4. transfer USDC to recipient
  | 'success'
  | 'error'

export const STEP_LABELS: Record<SendStep, string> = {
  idle: 'Send',
  approving_swap: 'Approving USDC...',
  swapping: 'Swapping to cbBTC...',
  depositing: 'Saving to vault...',
  sending: 'Sending USDC...',
  success: 'Done!',
  error: 'Failed',
}

interface UseYojarSendReturn {
  step: SendStep
  isBusy: boolean
  error: string | null
  execute: (params: {
    amount: string         // human USDC amount to send, e.g. "16"
    recipient: `0x${string}`
    roundUpEnabled: boolean
  }) => Promise<Transaction | null>
  reset: () => void
}

export function useYojarSend(
  onComplete?: (tx: Transaction) => void
): UseYojarSendReturn {
  const [step, setStep] = useState<SendStep>('idle')
  const [error, setError] = useState<string | null>(null)

  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()

  // SDK deposit hook — handles cbBTC approve + yoBTC vault deposit internally
  const { deposit, reset: resetDeposit } = useDeposit({
    vault: VAULT_ID,
    slippageBps: 50,
    onError: (err) => console.error('Vault deposit error:', err),
  })

  function reset() {
    setStep('idle')
    setError(null)
    resetDeposit()
  }

  async function execute({
    amount,
    recipient,
    roundUpEnabled,
  }: {
    amount: string
    recipient: `0x${string}`
    roundUpEnabled: boolean
  }): Promise<Transaction | null> {
    if (!address || !walletClient || !publicClient) return null

    const parsedAmount = parseFloat(amount)
    const roundedAmount = roundUpToNearest5(parsedAmount)
    const savingsAmount = getSavingsAmount(parsedAmount)
    const hasRoundUp = roundUpEnabled && savingsAmount > 0

    setError(null)

    try {
      let vaultTxHash: string | undefined

      // ── Steps 1–3: only if round-up toggle is ON ──────────────────────────
      if (hasRoundUp) {

        // ── Step 1: Approve USDC for the 0x swap router ─────────────────────
        setStep('approving_swap')

        const quote = await fetchSwapQuote(savingsAmount.toString(), address)

        // Check current allowance first — skip approve if already sufficient
        const currentAllowance = await publicClient.readContract({
          address: TOKENS.USDC,
          abi: ERC20_ABI,
          functionName: 'allowance',
          args: [address, quote.allowanceTarget],
        })

        const requiredAmount = parseUnits(savingsAmount.toString(), DECIMALS.USDC)

        if (currentAllowance < requiredAmount) {
          const approveTxHash = await walletClient.writeContract({
            address: TOKENS.USDC,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [quote.allowanceTarget, maxUint256], // approve max — saves future gas
          })
          // Wait for approve to confirm before swapping
          await publicClient.waitForTransactionReceipt({ hash: approveTxHash })
        }

        // ── Step 2: Execute the USDC → cbBTC swap ───────────────────────────
        setStep('swapping')

        const swapTxHash = await walletClient.sendTransaction({
          to: quote.to,
          data: quote.data,
          value: BigInt(quote.value),
        })

        // Wait for swap to confirm — we need the actual cbBTC received
        const swapReceipt = await publicClient.waitForTransactionReceipt({
          hash: swapTxHash,
        })

        // Parse how much cbBTC we actually received from Transfer event logs
        // Transfer(address indexed from, address indexed to, uint256 value)
        const cbBtcReceived = parseCbBtcFromReceipt(swapReceipt, address)
        const cbBtcToDeposit = cbBtcReceived ?? BigInt(quote.buyAmount)

        // ── Step 3: Deposit cbBTC into yoBTC vault ───────────────────────────
        // useDeposit SDK handles the cbBTC approve internally before depositing
        setStep('depositing')

        vaultTxHash = await deposit({
          token: TOKENS.cbBTC,
          amount: cbBtcToDeposit,
        })
      }

      // ── Step 4: Transfer USDC to recipient ────────────────────────────────
      setStep('sending')

      const usdcSendAmount = parseUnits(amount, DECIMALS.USDC)

      const sendTxHash = await walletClient.writeContract({
        address: TOKENS.USDC,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [recipient, usdcSendAmount],
      })

      await publicClient.waitForTransactionReceipt({ hash: sendTxHash })

      // ── Done ──────────────────────────────────────────────────────────────
      setStep('success')

      const tx: Transaction = {
        id: crypto.randomUUID(),
        to: recipient,
        actualAmount: amount,
        roundedAmount: roundedAmount.toString(),
        savedAmount: hasRoundUp ? savingsAmount.toString() : '0',
        didRoundUp: hasRoundUp,
        timestamp: Date.now(),
        txHash: sendTxHash,
        vaultTxHash,
      }

      onComplete?.(tx)
      return tx

    } catch (err: any) {
      console.error('YOjar send failed:', err)
      setError(err?.shortMessage ?? err?.message ?? 'Transaction failed')
      setStep('error')
      return null
    }
  }

  return {
    step,
    isBusy: step !== 'idle' && step !== 'success' && step !== 'error',
    error,
    execute,
    reset,
  }
}

// ─── Helper: parse actual cbBTC received from swap receipt ───────────────────
// Looks for ERC-20 Transfer events from the cbBTC contract to the taker address
function parseCbBtcFromReceipt(
  receipt: any,
  takerAddress: `0x${string}`
): bigint | null {
  // Transfer event topic: keccak256("Transfer(address,address,uint256)")
  const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

  const taker = takerAddress.toLowerCase()

  for (const log of receipt.logs ?? []) {
    // Must be from cbBTC contract
    if (log.address?.toLowerCase() !== TOKENS.cbBTC.toLowerCase()) continue
    // Must be a Transfer event
    if (log.topics?.[0] !== TRANSFER_TOPIC) continue
    // topics[2] = 'to' address, padded to 32 bytes
    const toAddress = '0x' + (log.topics?.[2] ?? '').slice(26)
    if (toAddress.toLowerCase() !== taker) continue
    // data = uint256 value
    return BigInt(log.data)
  }

  return null // fallback — caller uses quote.buyAmount estimate
}