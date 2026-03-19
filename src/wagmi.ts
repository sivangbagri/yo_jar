import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { base } from 'wagmi/chains'

export const config = getDefaultConfig({
    appName: 'YOjar',
    projectId: '47043425bd5e0fa11d1ca5fa73cfe16d', 
    chains: [ base],
})