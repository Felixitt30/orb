/* eslint-disable */
import { create } from 'zustand'
import axios from 'axios'

const COINGECKO_API = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true'

// Stock symbols to track
const STOCK_SYMBOLS = {
  apple: 'AAPL',
  tesla: 'TSLA',
  nvidia: 'NVDA'
}

// Initial Holdings (Simulated User Portfolio)
const INITIAL_HOLDINGS = {
  bitcoin: 0.5,     // 0.5 BTC
  ethereum: 10,     // 10 ETH
  solana: 500,      // 500 SOL
  apple: 50,        // 50 Shares AAPL
  tesla: 20,        // 20 Shares TSLA
  nvidia: 15        // 15 Shares NVDA
}

// Fetch real stock prices from Yahoo Finance API via CORS proxy
async function fetchStockPrices() {
  const stockData = {}

  // Fallback prices in case API fails (updated periodically)
  const fallbackPrices = {
    apple: { usd: 175, usd_24h_change: 0.5 },
    tesla: { usd: 250, usd_24h_change: -0.3 },
    nvidia: { usd: 480, usd_24h_change: 1.2 }
  }

  try {
    // Try fetching all stocks in parallel using CORS proxy
    const fetchPromises = Object.entries(STOCK_SYMBOLS).map(async ([key, symbol]) => {
      try {
        // Using corsproxy.io to bypass CORS restrictions
        const url = `https://corsproxy.io/?${encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=2d`)}`

        const response = await axios.get(url, { timeout: 8000 })

        const result = response.data.chart?.result?.[0]
        if (!result) throw new Error('Invalid response structure')

        const meta = result.meta
        const currentPrice = meta.regularMarketPrice || meta.previousClose
        const previousClose = meta.chartPreviousClose || meta.previousClose

        const change = previousClose > 0
          ? ((currentPrice - previousClose) / previousClose) * 100
          : 0

        return {
          key,
          data: {
            usd: currentPrice || fallbackPrices[key]?.usd || 0,
            usd_24h_change: change
          }
        }
      } catch (err) {
        // If individual stock fails, use fallback
        console.warn(`Failed to fetch ${symbol}:`, err.message)
        return { key, data: fallbackPrices[key] || { usd: 0, usd_24h_change: 0 } }
      }
    })

    const results = await Promise.all(fetchPromises)
    results.forEach(({ key, data }) => {
      stockData[key] = data
    })

  } catch (err) {
    // Return fallbacks if all fail
    console.warn('Stock API failed completely, using fallback prices')
    return fallbackPrices
  }

  return stockData
}

export const useStore = create((set, get) => ({
  // State
  holdings: INITIAL_HOLDINGS,
  prices: {
    bitcoin: { usd: 0, usd_24h_change: 0 },
    ethereum: { usd: 0, usd_24h_change: 0 },
    solana: { usd: 0, usd_24h_change: 0 },
    apple: { usd: 0, usd_24h_change: 0 },
    tesla: { usd: 0, usd_24h_change: 0 },
    nvidia: { usd: 0, usd_24h_change: 0 },
  },
  // Financial Data
  totalValue: 0,
  ath: 0,
  isATH: false,
  percentChange24h: 0,
  theme: 'neon', // neon, matrix, solana, bitcoin, rainbow
  isDarkMode: true,

  // Wallet Connection State
  connectedWallets: {
    metamask: null,  // Ethereum address
    phantom: null,   // Solana address
  },
  walletBalances: {
    ethereum: 0,
    solana: 0,
  },

  // Goals
  goals: [250000, 500000, 1000000, 5000000],
  currentGoalIndex: 0,

  // Actions
  setTheme: (theme) => set({ theme }),
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),

  // Wallet Connection Functions
  connectMetaMask: async () => {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed. Please install MetaMask extension.')
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })

      if (accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask.')
      }

      const address = accounts[0]

      // Get ETH balance
      const balanceHex = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      })

      // Convert from Wei to ETH
      const balanceWei = parseInt(balanceHex, 16)
      const balanceEth = balanceWei / 1e18

      // Update holdings with real balance
      const holdings = get().holdings
      set({
        connectedWallets: { ...get().connectedWallets, metamask: address },
        walletBalances: { ...get().walletBalances, ethereum: balanceEth },
        holdings: { ...holdings, ethereum: balanceEth }
      })

      // Listen for account changes
      window.ethereum.on('accountsChanged', async (newAccounts) => {
        if (newAccounts.length === 0) {
          get().disconnectWallet('metamask')
        } else {
          // Refresh balance for new account
          const newAddress = newAccounts[0]
          const newBalanceHex = await window.ethereum.request({
            method: 'eth_getBalance',
            params: [newAddress, 'latest']
          })
          const newBalanceEth = parseInt(newBalanceHex, 16) / 1e18
          const currentHoldings = get().holdings
          set({
            connectedWallets: { ...get().connectedWallets, metamask: newAddress },
            walletBalances: { ...get().walletBalances, ethereum: newBalanceEth },
            holdings: { ...currentHoldings, ethereum: newBalanceEth }
          })
        }
      })

    } catch (err) {
      if (err.code === 4001) {
        throw new Error('Connection rejected. Please approve the connection in MetaMask.')
      }
      throw err
    }
  },

  connectPhantom: async () => {
    const phantom = window.solana

    if (!phantom?.isPhantom) {
      throw new Error('Phantom wallet is not installed. Please install Phantom extension.')
    }

    try {
      const response = await phantom.connect()
      const address = response.publicKey.toString()

      // Fetch SOL balance from public RPC
      try {
        const balanceResponse = await axios.post('https://api.mainnet-beta.solana.com', {
          jsonrpc: '2.0',
          id: 1,
          method: 'getBalance',
          params: [address]
        })

        const lamports = balanceResponse.data?.result?.value || 0
        const solBalance = lamports / 1e9 // Convert lamports to SOL

        const holdings = get().holdings
        set({
          connectedWallets: { ...get().connectedWallets, phantom: address },
          walletBalances: { ...get().walletBalances, solana: solBalance },
          holdings: { ...holdings, solana: solBalance }
        })
      } catch (balanceErr) {
        // If balance fetch fails, still save the connection
        set({
          connectedWallets: { ...get().connectedWallets, phantom: address },
        })
      }

      // Listen for disconnect
      phantom.on('disconnect', () => {
        get().disconnectWallet('phantom')
      })

    } catch (err) {
      if (err.code === 4001) {
        throw new Error('Connection rejected. Please approve the connection in Phantom.')
      }
      throw err
    }
  },

  disconnectWallet: (wallet) => {
    const currentWallets = get().connectedWallets
    const currentBalances = get().walletBalances

    if (wallet === 'metamask') {
      set({
        connectedWallets: { ...currentWallets, metamask: null },
        walletBalances: { ...currentBalances, ethereum: 0 }
      })
    } else if (wallet === 'phantom') {
      // Disconnect from Phantom
      if (window.solana?.isPhantom) {
        window.solana.disconnect()
      }
      set({
        connectedWallets: { ...currentWallets, phantom: null },
        walletBalances: { ...currentBalances, solana: 0 }
      })
    }
  },

  // Enhanced Fetch with Real Stock Market Data
  fetchData: async () => {
    try {
      // Fetch crypto prices
      const cryptoRes = await axios.get(COINGECKO_API)
      const cryptoData = cryptoRes.data

      // Fetch real stock prices
      const stockData = await fetchStockPrices()

      const newPrices = { ...cryptoData, ...stockData }

      const holdings = get().holdings
      let currentTotal = 0
      let yesterdayTotal = 0

      // Calculate totals
      const allKeys = Object.keys(holdings)
      for (const key of allKeys) {
        const priceData = newPrices[key]
        if (priceData && priceData.usd) {
          const val = priceData.usd * holdings[key]
          const changeRatio = (priceData.usd_24h_change || 0) / 100
          const oldVal = val / (1 + changeRatio)
          currentTotal += val
          yesterdayTotal += oldVal
        }
      }

      // Prevent NaN from division by zero
      const totalChangePercent = yesterdayTotal > 0
        ? ((currentTotal - yesterdayTotal) / yesterdayTotal) * 100
        : 0

      const prevAth = get().ath || 0
      const isNewAth = prevAth > 0 && currentTotal > prevAth

      // Check Goals
      const goals = get().goals
      let goalIndex = get().currentGoalIndex
      if (currentTotal > goals[goalIndex] && goalIndex < goals.length - 1) {
        goalIndex++
      }

      set({
        prices: newPrices,
        totalValue: currentTotal || 0,
        percentChange24h: isFinite(totalChangePercent) ? totalChangePercent : 0,
        ath: Math.max(prevAth, currentTotal),
        isATH: isNewAth,
        currentGoalIndex: goalIndex
      })

    } catch (err) {
      // Silent error handling - don't log to prevent beeps
      set({
        totalValue: 0,
        percentChange24h: 0
      })
    }
  },

  updateHoldings: (newHoldings) => set({ holdings: newHoldings }),
}))
