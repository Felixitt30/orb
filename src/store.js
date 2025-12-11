import { create } from 'zustand'
import axios from 'axios'

const COINGECKO_API = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true'

// Initial Holdings (Simulated User Portfolio)
const INITIAL_HOLDINGS = {
  bitcoin: 0.5,     // 0.5 BTC
  ethereum: 10,     // 10 ETH
  solana: 500,      // 500 SOL
  apple: 50,        // 50 Shares AAPL
  tesla: 20,        // 20 Shares TSLA
  nvidia: 15        // 15 Shares NVDA
}

// Initial Mock Stock Data (Base prices to simmer around)
const STOCK_BASE_PRICES = {
  apple: 180,
  tesla: 240,
  nvidia: 450
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
  // ... existing state ...
  theme: 'neon', // neon, matrix, solana, bitcoin, rainbow
  background: 'nebula', // nebula, starfield, grid, custom
  isDarkMode: true, // auto-detect init
  soundEnabled: true,

  // Goals
  goals: [250000, 500000, 1000000, 5000000],
  currentGoalIndex: 0,

  // Interaction
  selectedAsset: null, // for sparkline popup
  showOrderBook: true,

  // Actions
  setTheme: (theme) => set({ theme }),
  setBackground: (bg) => set({ background }),
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  selectAsset: (asset) => set({ selectedAsset: asset }),

  // Enhanced Fetch (Mock Order Book Update could go here or in component)
  fetchData: async () => {
    try {
      // ... existing fetch logic ...
      // (Preserving existing logic, just wrapping it to ensure we don't break it)
      const cryptoRes = await axios.get(COINGECKO_API)
      const cryptoData = cryptoRes.data

      const stockData = {}
      for (const [key, base] of Object.entries(STOCK_BASE_PRICES)) {
        const volatility = 0.02
        const randomMove = (Math.random() - 0.5) * volatility * base
        const price = base + randomMove
        const change = (randomMove / base) * 100
        stockData[key] = { usd: price, usd_24h_change: change }
      }

      const newPrices = { ...cryptoData, ...stockData }

      const holdings = get().holdings
      let currentTotal = 0
      let yesterdayTotal = 0

      // Calculate totals (same loop as before)
      const allKeys = Object.keys(holdings)
      for (const key of allKeys) {
        const priceData = newPrices[key]
        if (priceData) {
          const val = priceData.usd * holdings[key]
          const oldVal = val / (1 + (priceData.usd_24h_change / 100))
          currentTotal += val
          yesterdayTotal += oldVal
        }
      }

      const totalChangePercent = ((currentTotal - yesterdayTotal) / yesterdayTotal) * 100

      const prevAth = get().ath
      const isNewAth = prevAth > 0 && currentTotal > prevAth

      // Check Goals
      const goals = get().goals
      let goalIndex = get().currentGoalIndex
      if (currentTotal > goals[goalIndex] && goalIndex < goals.length - 1) {
        goalIndex++
      }

      set({
        prices: newPrices,
        totalValue: currentTotal,
        percentChange24h: totalChangePercent,
        ath: Math.max(prevAth, currentTotal),
        isATH: isNewAth,
        currentGoalIndex: goalIndex
      })

    } catch (err) {
      console.error("Failed to fetch prices", err)
    }
  },


  updateHoldings: (newHoldings) => set({ holdings: newHoldings }),
}))
