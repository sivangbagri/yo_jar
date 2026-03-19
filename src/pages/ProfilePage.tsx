import { useAccount, useEnsAvatar } from 'wagmi'
import {
    useUserPosition,
    useVaultHistory,
    useUserHistory,
    useUserRewards,
    useVaultState,
    useVaults
} from '@yo-protocol/react'
import type { Transaction } from '@/types'
import { formatEther } from 'viem'
import { formatUnits } from "viem"

import { StatCard } from "@/components/profile/StatCard"
const VAULT_ID = 'yoBTC'

function loadTransactions(): Transaction[] {
    try {
        return JSON.parse(localStorage.getItem('yojar_txns') ?? '[]')
    } catch {
        return []
    }
}

function shortenAddress(addr: string) {
    return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function formatDate(ts: number) {
    return new Date(ts).toISOString().split('T')[0]
}

export function ProfilePage() {
    const { address, isConnected } = useAccount()
    const { data: avatar } = useEnsAvatar({
        address,
    })
    const transactions = loadTransactions()

    // ── Vault stats hooks ──────────────────────────────────────────────
    // Your shares + assets
    const { position, isLoading: posLoading } = useUserPosition(VAULT_ID, address)
    // Exchange rate + TVL from on-chain state
    const { vaultState, isLoading: vaultLoading } = useVaultState(VAULT_ID)
    // APY % — latest point from yield history
    const { vaults, isLoading: vaultsLoading } = useVaults()

    // User on-chain history (total deposits count/sum)
    const { history, isLoading: userHistLoading } = useUserHistory(VAULT_ID, address)
    // User YO rewards
    // const { rewards, isLoading: rewardsLoading } = useUserRewards(address)

    const totalDeposited = history?.length
        ? history
            .filter((h: any) => h.type === 'deposit')
            .reduce((sum: number, h: any) => sum + parseFloat(h.assets ?? '0'), 0)
            .toFixed(4)
        : null

    // const rewardDisplay = rewards
    //     ? typeof rewards === 'object'
    //         ? JSON.stringify(rewards)
    //         : String(rewards)
    //     : null

    if (!isConnected) {
        return (
            <div className="profile-page profile-page--disconnected">
                <p>Connect your wallet to view your profile.</p>
                <style>{profileStyles}</style>
            </div>
        )
    }
    const matchedVault = vaults?.find(
        (v: any) => v.id === VAULT_ID
    )
    console.log("matchedVault ",matchedVault)
    const apy7d = matchedVault?.yield["7d"] != null
        ? `${Number(matchedVault.yield["7d"]).toFixed(2)}%`
        : null


    const TVL = matchedVault?.tvl.formatted != null
        ? `${matchedVault.tvl.raw}`
        : null



    console.log("vaults", vaults)

    return (
        <>
            <div className="profile-page">

                {/* ── Avatar + address ── */}
                <div className="profile-header">
                    <div className="profile-avatar">
                        {/* X-circle avatar matching wireframe */}
                        <img
                            src={avatar ?? `https://effigy.im/a/${address}.svg`}
                            alt="avatar"
                            width={60}
                            height={60}
                            className='rounded-full'
                        />
                    </div>
                    <p className="profile-address">{address ? shortenAddress(address) : '—'}</p>
                </div>

                {/* ── TXN History ── */}
                <section className="profile-section">
                    <h2 className="section-title">TXN history</h2>
                    <div className="txn-table-wrapper">
                        {transactions.length === 0 ? (
                            <p className="empty-state">No transactions yet.</p>
                        ) : (
                            <table className="txn-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>To</th>
                                        <th>Amount</th>
                                        <th>Rounded off</th>
                                        <th>Sent to vault</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((tx) => (
                                        <tr key={tx.id}>
                                            <td>{formatDate(tx.timestamp)}</td>
                                            <td className="td-mono">{shortenAddress(tx.to)}</td>
                                            <td>{tx.actualAmount}</td>
                                            <td className={tx.didRoundUp ? 'td-yes' : 'td-no'}>
                                                {tx.didRoundUp ? 'YES' : 'NO'}
                                            </td>
                                            <td>{tx.didRoundUp ? tx.savedAmount : '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </section>

                {/* ── Vault Stats ── */}
                <section className="profile-section">
                    <h2 className="section-title">Vault stat {VAULT_ID}</h2>
                    <div className="vault-stats-grid">

                        <StatCard
                            label="Your shares"
                            value={posLoading ? null : position ? parseFloat(formatEther(position.shares)).toFixed(4) : '0'}
                        />
                        <StatCard
                            label="Exchange rate"
                            value={vaultState?.exchangeRate ? formatUnits(vaultState.exchangeRate, vaultState.decimals) : "—"}
                        />
                        <StatCard
                            label="TVL"
                            value={
                                vaultsLoading
                                    ? null
                                    : TVL
                                        ? `${(TVL / 1_000_000).toFixed(2)}M`
                                        : '—'
                            }
                        />
                        <StatCard
                            label="Total deposits"
                            value={userHistLoading ? null : totalDeposited ?? '—'}
                        />
                        <StatCard
                            label="APY %"
                            value={vaultsLoading ? null : apy7d ?? '—'}
                            accent
                        />
                        {/* <StatCard
                            label="User rewards"
                            value={rewardsLoading ? null : rewardDisplay ?? '—'}
                        /> */}

                    </div>
                </section>

            </div>
            <style>{profileStyles}</style>
        </>
    )
}


// ── Styles ────────────────────────────────────────────────────────────
const profileStyles = `
  .profile-page {
    max-width: 390px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    border: 1.5px solid var(--color-border-tertiary);
    border-radius: 28px;
    overflow: hidden;
    background: var(--color-background-primary);
    min-height: 700px;
    padding-bottom: 32px;
  }
  .profile-page--disconnected {
    align-items: center;
    justify-content: center;
    font-size: 14px;
    color: var(--color-text-tertiary);
    min-height: 300px;
  }

  /* ── header ── */
  .profile-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40px 24px 24px;
    border-bottom: 0.5px solid var(--color-border-tertiary);
    gap: 12px;
  }
  .profile-avatar {
    color: var(--color-text-tertiary);
    width: 64px;
    height: 64px;
  }
  .profile-address {
    font-family: var(--font-mono);
    font-size: 14px;
    color: var(--color-text-secondary);
    letter-spacing: 0.02em;
  }

  /* ── sections ── */
  .profile-section {
    padding: 20px 20px 8px;
    border-bottom: 0.5px solid var(--color-border-tertiary);
  }
  .section-title {
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 14px;
  }

  /* ── txn table ── */
  .txn-table-wrapper {
    overflow-x: auto;
    border: 0.5px solid var(--color-border-tertiary);
    border-radius: var(--border-radius-lg);
  }
  .txn-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
    table-layout: fixed;
  }
  .txn-table th {
    padding: 10px 12px;
    text-align: left;
    font-size: 11px;
    font-weight: 500;
    color: var(--color-text-tertiary);
    border-bottom: 0.5px solid var(--color-border-tertiary);
    white-space: nowrap;
    background: var(--color-background-secondary);
  }
  .txn-table td {
    padding: 10px 12px;
    color: var(--color-text-primary);
    border-bottom: 0.5px solid var(--color-border-tertiary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .txn-table tr:last-child td {
    border-bottom: none;
  }
  .td-mono {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--color-text-secondary);
  }
  .td-yes {
    color: var(--color-text-success);
    font-weight: 500;
  }
  .td-no {
    color: var(--color-text-tertiary);
  }
  .empty-state {
    padding: 24px;
    text-align: center;
    font-size: 13px;
    color: var(--color-text-tertiary);
  }

  /* ── vault stats grid ── */
  .vault-stats-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    padding-bottom: 8px;
  }
  .stat-card {
    background: var(--color-background-secondary);
    border-radius: var(--border-radius-md);
    padding: 14px 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .stat-card--accent {
    border: 0.5px solid var(--color-border-success);
  }
  .stat-label {
    font-size: 11px;
    color: var(--color-text-tertiary);
    font-weight: 500;
    letter-spacing: 0.02em;
  }
  .stat-value {
    font-size: 15px;
    font-weight: 500;
    color: var(--color-text-primary);
  }
  .stat-skeleton {
    height: 18px;
    border-radius: 4px;
    background: var(--color-border-tertiary);
    width: 60%;
    animation: pulse 1.5s ease-in-out infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
`