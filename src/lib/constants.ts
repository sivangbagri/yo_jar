// ─── Base chain token addresses ───────────────────────────────────────────────
export const BASE_CHAIN_ID = 8453

export const TOKENS = {
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`,
  cbBTC: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf' as `0x${string}`,
} as const

// ─── YO vault ─────────────────────────────────────────────────────────────────
export const VAULT_ID = 'yoBTC' // underlying: cbBTC on Base

// ─── Token decimals ───────────────────────────────────────────────────────────
export const DECIMALS = {
  USDC: 6,   // USDC uses 6 decimals
  cbBTC: 8,  // cbBTC uses 8 decimals
} as const

// ─── Minimal ERC-20 ABI (approve + transfer only) ────────────────────────────
export const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
  },
] as const