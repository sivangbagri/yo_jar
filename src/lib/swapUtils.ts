import { parseUnits, createPublicClient, http } from 'viem'
import { base } from 'wagmi/chains'
import { BASE_CHAIN_ID, TOKENS, DECIMALS } from './constants'

const ZERO_EX_API_KEY = import.meta.env.VITE_ZEROX_API_KEY as string

const HEADERS = {
  '0x-api-key': ZERO_EX_API_KEY,
  '0x-version': 'v2',
}

export interface SwapQuote {
  to: `0x${string}`             // router contract to call
  data: `0x${string}`           // encoded calldata
  value: string                 // ETH value to send (0 for ERC-20 swaps)
  buyAmount: string             // estimated cbBTC out (in cbBTC base units, 8 decimals)
  allowanceTarget: `0x${string}` // address to approve USDC on
}

/**
 * Fetch a firm quote from 0x to swap USDC → cbBTC on Base.
 * Uses the allowance-holder endpoint (no Permit2 signing needed).
 *
 * @param usdcAmountHuman  e.g. "4" for 4 USDC
 * @param takerAddress     connected wallet address
 */
export async function fetchSwapQuote(
  usdcAmountHuman: string,
  takerAddress: `0x${string}`
): Promise<SwapQuote> {
  const sellAmount = parseUnits(usdcAmountHuman, DECIMALS.USDC).toString()

  const params = new URLSearchParams({
    chainId: BASE_CHAIN_ID.toString(),
    sellToken: TOKENS.USDC,
    buyToken: TOKENS.cbBTC,
    sellAmount,
    taker: takerAddress,
    slippageBps: '100', // 1% slippage — reasonable for USDC/cbBTC
  })

  const res = await fetch(
    `/0x-api/swap/allowance-holder/quote?${params.toString()}`,
    { headers: HEADERS }
  )
//   const text = await res.text(); 
//   console.log("text", text)

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`0x quote failed: ${err?.reason ?? res.statusText}`)
  }

  const quote = await res.json()

  if (!quote.liquidityAvailable) {
    throw new Error('No liquidity available for USDC → cbBTC swap')
  }

  return {
    to: quote.transaction.to as `0x${string}`,
    data: quote.transaction.data as `0x${string}`,
    value: quote.transaction.value ?? '0',
    buyAmount: quote.buyAmount,                          // cbBTC in 8-decimal units
    allowanceTarget: quote.issues?.allowance?.spender   // where to approve USDC
      ?? quote.allowanceTarget,
  }
}