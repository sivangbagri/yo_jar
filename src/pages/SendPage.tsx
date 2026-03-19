import { useState } from 'react'
import { useAccount, useSendTransaction } from 'wagmi'
import { parseEther, isAddress } from 'viem'
import { useDeposit, useVaultState } from '@yo-protocol/react'
import { Switch } from '@/components/ui/switch'
import { roundUpToNearest5, getSavingsAmount } from '@/hooks/useRoundUp'
import type { Transaction } from '@/types'

const VAULT_ID = 'yoUSD'

export function SendPage({ onTransactionComplete }: { onTransactionComplete?: (tx: Transaction) => void }) {
    const { isConnected } = useAccount()

    const [recipient, setRecipient] = useState('')
    const [amount, setAmount] = useState('')
    const [roundUpEnabled, setRoundUpEnabled] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    const { vaultState } = useVaultState(VAULT_ID)

    const {
        deposit,
        step,
        isLoading,
        approveHash,
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
    const hasRoundUp = savingsAmount > 0 && roundUpEnabled

    const stepLabel: Record<string, string> = {
        idle: 'Send',
        approving: 'Approving...',
        depositing: 'Depositing...',
        waiting: 'Confirming...',
        success: 'Done!',
        error: 'Failed',
    }

    // Toggle IS the consent — send button fires directly, no modal
    async function handleSend() {
        if (!isValidAmount || !isValidRecipient) return

        setIsSaving(true)
        try {
            let vaultTxHash: string | undefined

            // If round-up toggle is on, deposit the savings into the vault first
            if (hasRoundUp && vaultState?.asset) {
                const savingsWei = parseEther(savingsAmount.toString())
                const vaultHash = await deposit({
                    token: vaultState.asset,
                    amount: savingsWei,
                })
                vaultTxHash = vaultHash
            }

            // Then send the actual amount to the recipient
            const sendHash = await sendTransactionAsync({
                to: recipient as `0x${string}`,
                value: parseEther(amount),
            })

            const tx: Transaction = {
                id: crypto.randomUUID(),
                to: recipient,
                actualAmount: amount,
                roundedAmount: roundedAmount.toString(),
                savedAmount: hasRoundUp ? savingsAmount.toString() : '0',
                didRoundUp: hasRoundUp,
                timestamp: Date.now(),
                txHash: sendHash,
                vaultTxHash,
            }

            onTransactionComplete?.(tx)
            setAmount('')
            setRecipient('')
            reset()
        } catch (err) {
            console.error('Transaction failed:', err)
        } finally {
            setIsSaving(false)
        }
    }

    const busy = isSaving || isLoading
    const canSend = isValidAmount && isValidRecipient && !busy

    return (
        <>
            <div className="flex flex-col max-w-[390px] mx-auto border border-[var(--color-border-tertiary)] rounded-[28px] overflow-hidden bg-[var(--color-background-primary)] min-h-[600px]">

                {/* Amount */}
                <div className="flex flex-col items-center px-6 pt-12 pb-6 border-b border-[var(--color-border-tertiary)]">
                    <div
                        className="text-[64px] font-medium tracking-[-2px] text-[var(--color-text-primary)] text-center outline-none cursor-text leading-none min-h-[72px]"
                        contentEditable={isConnected}
                        suppressContentEditableWarning
                        inputMode="decimal"
                        data-placeholder="$0"
                        onInput={(e) => {
                            const raw = (e.currentTarget.textContent ?? '').replace(/[^0-9.]/g, '')
                            setAmount(raw)
                        }}
                        onKeyDown={(e) => {
                            if (!/[\d.]|Backspace|Delete|Arrow/.test(e.key)) e.preventDefault()
                        }}
                    />
                    <p className="text-[13px] text-[var(--color-text-tertiary)] mt-2 tracking-[0.02em]">
                        Enter amount
                    </p>
                </div>

                {/* To */}
                <div className="flex items-center gap-3 px-7 py-5 border-b border-[var(--color-border-tertiary)]">
                    <span className="text-[15px] text-[var(--color-text-secondary)]">to</span>

                    <input
                        className="flex-1 border-b border-[var(--color-border-secondary)] bg-transparent text-[15px] text-[var(--color-text-primary)] py-1 outline-none font-mono placeholder:text-[var(--color-text-tertiary)] placeholder:font-sans placeholder:text-[14px] focus:border-[var(--color-border-primary)]"
                        type="text"
                        placeholder="0x address or ENS"
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        disabled={!isConnected}
                    />
                </div>

                {/* Toggle */}
                <div className="flex items-center justify-between px-7 py-5 border-b border-[var(--color-border-tertiary)]">
                    <span className="text-[15px] text-[var(--color-text-primary)]">
                        Round up and save
                    </span>

                    <Switch
                        checked={roundUpEnabled}
                        onCheckedChange={setRoundUpEnabled}
                        disabled={!isConnected}
                    />
                </div>

                {/* Preview */}
                {isValidAmount && roundUpEnabled && (
                    <div className="mx-5 my-4 border border-[var(--color-border-tertiary)] rounded-lg px-5 py-4 flex flex-col gap-2.5 bg-[var(--color-background-secondary)]">

                        <div className="flex justify-between items-center">
                            <span className="text-[14px] text-[var(--color-text-secondary)]">
                                Rounded up to
                            </span>
                            <span className="text-[14px] font-medium text-[var(--color-text-primary)]">
                                {hasRoundUp ? `$${roundedAmount}` : `$${parsedAmount}`}
                            </span>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-[14px] text-[var(--color-text-secondary)]">
                                To be invested
                            </span>
                            <span className="text-[14px] font-medium text-[var(--color-text-success)]">
                                {hasRoundUp ? `+$${savingsAmount}` : '—'}
                            </span>
                        </div>

                    </div>
                )}

                {/* Status */}
                {isLoading && step !== 'idle' && (
                    <p className="text-[12px] text-[var(--color-text-secondary)] text-center px-6">
                        {stepLabel[step] ?? step}
                        {approveHash && ` · approve sent`}
                    </p>
                )}

                {error && (
                    <p className="text-[12px] text-[var(--color-text-danger)] text-center px-6">
                        {error.message}{' '}
                        <button
                            onClick={reset}
                            className="underline bg-transparent border-none text-[var(--color-text-danger)] cursor-pointer text-[12px]"
                        >
                            dismiss
                        </button>
                    </p>
                )}

                {/* Button */}
                <button
                    className={`mt-auto mx-[10px] mb-[10px] w-[calc(100%-40px)] py-[18px] rounded-[14px] text-[15px] font-medium tracking-[0.1em] transition-opacity
  ${canSend
                            ? 'bg-[var(--color-text-primary)] text-[var(--color-background-primary)] hover:opacity-85'
                            : 'bg-[var(--color-text-primary)] text-[var(--color-background-primary)] opacity-35 cursor-not-allowed'
                        }`}
                    onClick={handleSend}
                    disabled={!canSend}
                >
                    {busy ? (stepLabel[step] ?? 'Processing…') : 'SEND'}
                </button>

                {!isConnected && (
                    <p className="text-[12px] text-[var(--color-text-tertiary)] text-center pb-3">
                        Connect your wallet to send
                    </p>
                )}
            </div>

            <style>{`
        .amount-display:empty::before {
            content: attr(data-placeholder);
            color: var(--color-text-tertiary);
          }
      `}</style>
        </>
    )
}