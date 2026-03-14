import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Link, useLocation } from 'react-router-dom'

export function Navbar() {
  const location = useLocation()

  return (
    <nav className="border-b border-border px-4 py-3">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="text-xl font-bold tracking-tight">🫙 YOjar</span>
          <div className="flex gap-4 text-sm">
            <Link
              to="/"
              className={location.pathname === '/' ? 'font-semibold text-foreground' : 'text-muted-foreground hover:text-foreground'}
            >
              Send
            </Link>
            <Link
              to="/profile"
              className={location.pathname === '/profile' ? 'font-semibold text-foreground' : 'text-muted-foreground hover:text-foreground'}
            >
              Profile
            </Link>
          </div>
        </div>
        <ConnectButton />
      </div>
    </nav>
  )
}