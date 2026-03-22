import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Providers } from "./providers"
import { Analytics } from "@vercel/analytics/react"
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      
      <App />
      <Analytics/>
    </Providers>
  </StrictMode>,
)
