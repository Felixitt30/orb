
import { createWeb3Modal, defaultConfig } from '@web3modal/ethers/react'

// 1. Get projectId at https://cloud.walletconnect.com
// This is a public demo ID. Please replace with your own for production!
const projectId = '4e91060608513364f728c68434676454'

// 2. Set chains
const localhost = {
    chainId: 31337,
    name: 'Orb Localhost',
    currency: 'AVAX',
    explorerUrl: '',
    rpcUrl: 'http://192.168.68.60:8545'
}

const avalanche = {
    chainId: 43114,
    name: 'Avalanche',
    currency: 'AVAX',
    explorerUrl: 'https://snowtrace.io',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc'
}

// 3. Create your application's metadata
const metadata = {
    name: 'Orb',
    description: 'Orb - DeFi Dashboard & Nova Nodes',
    url: 'http://192.168.68.60:5173', // Must match your mobile access URL
    icons: ['https://avatars.mywebsite.com/']
}

// 4. Create Ethers config
const ethersConfig = defaultConfig({
    /*Required*/
    metadata,

    /*Optional*/
    enableEIP6963: true, // Auto connect to installed extensions
    enableInjected: true, // Auto connect to installed extensions
    enableCoinbase: true, // Enable Coinbase Wallet SDK
    rpcUrl: '...', // used for the Coinbase SDK
    defaultChainId: 31337 // used for the Coinbase SDK
})

// 5. Create a Web3Modal instance
createWeb3Modal({
    ethersConfig,
    chains: [localhost, avalanche],
    projectId,
    enableAnalytics: true,
    themeMode: 'dark',
    themeVariables: {
        '--w3m-accent': '#bd00ff', // Match Orb purple/neon
        '--w3m-border-radius-master': '2px'
    }
})

export function Web3ModalProvider({ children }) {
    return children
}
