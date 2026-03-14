import { WagmiProvider } from "wagmi"
import { QueryClientProvider, QueryClient } from "@tanstack/react-query"
import { YieldProvider } from "@yo-protocol/react"
import { config } from "./wagmi"

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <YieldProvider>
          {children}
        </YieldProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}