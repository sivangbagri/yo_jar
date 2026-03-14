import { parseEther, formatEther } from 'viem'

// Round up to nearest 5 multiple (ceiling)
// e.g. 16 → 20, 20 → 20, 21 → 25
export function roundUpToNearest5(amount: number): number {
  if (amount % 5 === 0) return amount
  return Math.ceil(amount / 5) * 5
}

export function getSavingsAmount(amount: number): number {
  return roundUpToNearest5(amount) - amount
}

// Convert ETH string → bigint for contracts
export function toWei(eth: string): bigint {
  try {
    return parseEther(eth)
  } catch {
    return 0n
  }
}

export function fromWei(wei: bigint): string {
  return formatEther(wei)
}