import { useEffect } from 'react'

// import { createYoClient } from '@yo-protocol/core'
import { useVaults } from "@yo-protocol/react"
// import type { VaultConfig } from "@yo-protocol/core"

import './App.css'

function App() {
  const { vaults, isLoading } = useVaults()

  if (isLoading) return <p>Loading vaults...</p>
  console.log(vaults)
  return (
    <ul>
      {vaults.map((v) => (
        <li key={v.asset.address}>
          <strong>{v.name}</strong> ({v.asset.symbol})
        </li>
      ))}
    </ul>
  )
}


export default App
