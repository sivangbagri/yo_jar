export interface Transaction {
    id: string
    to: string
    actualAmount: string      // what user typed, e.g. "16"
    roundedAmount: string     // rounded up, e.g. "20"
    savedAmount: string       // difference deposited, e.g. "4"
    didRoundUp: boolean
    timestamp: number
    txHash?: string
    vaultTxHash?: string
  }