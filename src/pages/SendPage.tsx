import { useState } from 'react'
import { useAccount } from 'wagmi'
import { isAddress } from 'viem'
import { Switch } from '@/components/ui/switch'
import { roundUpToNearest5, getSavingsAmount } from '@/hooks/useRoundUp'
import { useYojarSend, STEP_LABELS } from '@/hooks/useYojarSend'
import type { Transaction } from '@/types'

export function SendPage({ onTransactionComplete }: { onTransactionComplete?: (tx: Transaction) => void }) {
  const { isConnected } = useAccount()

  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [roundUpEnabled, setRoundUpEnabled] = useState(true)

  const { step, isBusy, error, execute, reset } = useYojarSend(onTransactionComplete)

  const parsedAmount = parseFloat(amount)
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount > 0
  const isValidRecipient = isAddress(recipient)
  const roundedAmount = isValidAmount ? roundUpToNearest5(parsedAmount) : 0
  const savingsAmount = isValidAmount ? getSavingsAmount(parsedAmount) : 0
  const hasRoundUp = savingsAmount > 0 && roundUpEnabled

  const canSend = isValidAmount && isValidRecipient && !isBusy && isConnected

  async function handleSend() {
    if (!canSend) return
    const tx = await execute({
      amount,
      recipient: recipient as `0x${string}`,
      roundUpEnabled,
    })
    if (tx) {
      setAmount('')
      setRecipient('')
    }
  }

  return (
    <>
      <div className="yojar-send-page">

        {/* ── Big amount display ── */}
        <div className="amount-section">
          <div
            className="amount-display"
            contentEditable={isConnected}
            suppressContentEditableWarning
            inputMode="decimal"
            onInput={(e) => {
              const raw = (e.currentTarget.textContent ?? '').replace(/[^0-9.]/g, '')
              setAmount(raw)
            }}
            onKeyDown={(e) => {
              if (!/[\d.]|Backspace|Delete|Arrow/.test(e.key)) e.preventDefault()
            }}
            data-placeholder="$0"
          />
          <p className="amount-label">Enter USDC amount</p>
        </div>

        {/* ── To field ── */}
        <div className="to-row">
          <span className="to-label">to</span>
          <input
            className="to-input"
            type="text"
            placeholder="0x address or ENS"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            disabled={!isConnected}
          />
        </div>

        {/* ── Round up toggle — this is the consent mechanism ── */}
        <div className="roundup-toggle-row">
          <span className="roundup-toggle-label">Round up and save</span>
          <Switch
            checked={roundUpEnabled}
            onCheckedChange={setRoundUpEnabled}
            disabled={!isConnected}
          />
        </div>

        {/* ── Preview card — only when toggle on + valid amount ── */}
        {isValidAmount && roundUpEnabled && (
          <div className="preview-card">
            <div className="preview-row">
              <span className="preview-key">Rounded up to</span>
              <span className="preview-val">
                {hasRoundUp ? `$${roundedAmount}` : `$${parsedAmount}`}
              </span>
            </div>
            <div className="preview-row">
              <span className="preview-key">To be invested</span>
              <span className="preview-val preview-val--green">
                {hasRoundUp ? `+$${savingsAmount}` : '—'}
              </span>
            </div>
          </div>
        )}

        {/* ── Step progress — shown while any tx is in flight ── */}
        {isBusy && (
          <div className="step-progress">
            <StepDots currentStep={step} />
            <p className="step-label">{STEP_LABELS[step]}</p>
          </div>
        )}

        {step === 'success' && (
          <p className="step-success">
            Sent ✓{' '}
            <button className="step-link" onClick={reset}>New send</button>
          </p>
        )}

        {step === 'error' && error && (
          <p className="error-text">
            {error}{' '}
            <button onClick={reset} className="error-dismiss">dismiss</button>
          </p>
        )}

        {/* ── Send button ── */}
        <button
          className={`send-btn ${!canSend ? 'send-btn--disabled' : ''}`}
          onClick={handleSend}
          disabled={!canSend}
        >
          {isBusy ? STEP_LABELS[step] : 'SEND'}
        </button>

        {!isConnected && (
          <p className="connect-hint">Connect your wallet to send</p>
        )}
      </div>

      <style>{`
        .yojar-send-page {
          display: flex;
          flex-direction: column;
          gap: 0;
          max-width: 390px;
          margin: 0 auto;
          border: 1.5px solid var(--color-border-tertiary);
          border-radius: 28px;
          overflow: hidden;
          background: var(--color-background-primary);
          min-height: 600px;
        }
        .amount-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 48px 24px 24px;
          border-bottom: 0.5px solid var(--color-border-tertiary);
        }
        .amount-display {
          font-size: 64px;
          font-weight: 500;
          letter-spacing: -2px;
          color: var(--color-text-primary);
          min-width: 40px;
          text-align: center;
          outline: none;
          cursor: text;
          line-height: 1;
          min-height: 72px;
        }
        .amount-display:empty::before {
          content: attr(data-placeholder);
          color: var(--color-text-tertiary);
        }
        .amount-label {
          font-size: 13px;
          color: var(--color-text-tertiary);
          margin-top: 8px;
          letter-spacing: 0.02em;
        }
        .to-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px 28px;
          border-bottom: 0.5px solid var(--color-border-tertiary);
        }
        .to-label {
          font-size: 15px;
          color: var(--color-text-secondary);
          flex-shrink: 0;
        }
        .to-input {
          flex: 1;
          border: none;
          border-bottom: 1px solid var(--color-border-secondary);
          background: transparent;
          font-size: 15px;
          color: var(--color-text-primary);
          padding: 4px 0;
          outline: none;
          font-family: var(--font-mono);
        }
        .to-input::placeholder {
          color: var(--color-text-tertiary);
          font-family: var(--font-sans);
          font-size: 14px;
        }
        .to-input:focus {
          border-bottom-color: var(--color-border-primary);
        }
        .roundup-toggle-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 28px;
          border-bottom: 0.5px solid var(--color-border-tertiary);
        }
        .roundup-toggle-label {
          font-size: 15px;
          color: var(--color-text-primary);
        }
        .preview-card {
          margin: 16px 20px;
          border: 0.5px solid var(--color-border-tertiary);
          border-radius: var(--border-radius-lg);
          padding: 16px 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          background: var(--color-background-secondary);
        }
        .preview-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .preview-key {
          font-size: 14px;
          color: var(--color-text-secondary);
        }
        .preview-val {
          font-size: 14px;
          font-weight: 500;
          color: var(--color-text-primary);
        }
        .preview-val--green {
          color: var(--color-text-success);
        }
        .step-progress {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 8px 24px 0;
        }
        .step-dots {
          display: flex;
          gap: 6px;
        }
        .step-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--color-border-secondary);
          transition: background 0.2s;
        }
        .step-dot--active {
          background: var(--color-text-primary);
        }
        .step-dot--done {
          background: var(--color-text-success);
        }
        .step-label {
          font-size: 12px;
          color: var(--color-text-secondary);
          text-align: center;
        }
        .step-success {
          font-size: 13px;
          color: var(--color-text-success);
          text-align: center;
          padding: 4px 24px 0;
        }
        .step-link {
          background: none;
          border: none;
          color: var(--color-text-secondary);
          font-size: 13px;
          text-decoration: underline;
          cursor: pointer;
          padding: 0;
        }
        .error-text {
          font-size: 12px;
          color: var(--color-text-danger);
          text-align: center;
          padding: 0 24px;
        }
        .error-dismiss {
          text-decoration: underline;
          background: none;
          border: none;
          color: var(--color-text-danger);
          cursor: pointer;
          font-size: 12px;
        }
        .send-btn {
          margin: auto 20px 20px;
          margin-top: auto;
          width: calc(100% - 40px);
          padding: 18px;
          background: var(--color-text-primary);
          color: var(--color-background-primary);
          border: none;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 500;
          letter-spacing: 0.1em;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .send-btn:hover:not(.send-btn--disabled) {
          opacity: 0.85;
        }
        .send-btn--disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
        .connect-hint {
          font-size: 12px;
          color: var(--color-text-tertiary);
          text-align: center;
          padding-bottom: 12px;
        }
      `}</style>
    </>
  )
}

// ─── Step dots indicator ──────────────────────────────────────────────────────
const STEP_ORDER = ['approving_swap', 'swapping', 'depositing', 'sending']

function StepDots({ currentStep }: { currentStep: string }) {
  const currentIndex = STEP_ORDER.indexOf(currentStep)
  return (
    <div className="step-dots">
      {STEP_ORDER.map((s, i) => (
        <div
          key={s}
          className={`step-dot ${
            i < currentIndex
              ? 'step-dot--done'
              : i === currentIndex
              ? 'step-dot--active'
              : ''
          }`}
        />
      ))}
    </div>
  )
}
