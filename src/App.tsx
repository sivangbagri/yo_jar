import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Navbar } from './components/layout/Navbar'
import { SendPage } from './pages/SendPage'
import { ProfilePage } from './pages/ProfilePage'
import type { Transaction } from './types'

function saveTransaction(tx: Transaction) {
  try {
    const existing: Transaction[] = JSON.parse(
      localStorage.getItem('yojar_txns') ?? '[]'
    )
    localStorage.setItem('yojar_txns', JSON.stringify([tx, ...existing]))
  } catch {
    console.error('Failed to save transaction to localStorage')
  }
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-8">
          <Routes>
            <Route
              path="/"
              element={<SendPage onTransactionComplete={saveTransaction} />}
            />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}