/* eslint-disable */
import { create } from 'zustand'
import axios from 'axios'
import { ethers } from 'ethers'
import { supabase } from './lib/supabase'
import { NOVA_ADDRESSES, NOVA_ABIS } from './lib/novaProtocol'

// CoinGecko API key (optional - increases rate limits from 10-30 calls/min to 10,000 calls/month)
const COINGECKO_API_KEY = import.meta.env.VITE_COINGECKO_API_KEY

// Helper to build CoinGecko API URL with optional API key
const buildCoinGeckoUrl = (ids) => {
  const baseUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`

  // API key usage (if available) handles its own limits
  // If no key, we use the public API directly (it supports CORS for simple/price)
  return baseUrl
}

// Stock symbols to track
const STOCK_SYMBOLS = {
  apple: 'AAPL',
  tesla: 'TSLA',
  nvidia: 'NVDA'
}

// Crypto ticker to CoinGecko ID mapping
// Use this when the ticker symbol doesn't match the CoinGecko ID
const CRYPTO_ID_MAP = {
  // Common tickers that need mapping
  'atom': 'cosmos',           // Cosmos
  'ada': 'cardano',           // Cardano
  'dot': 'polkadot',          // Polkadot
  'matic': 'matic-network',   // Polygon
  'avax': 'avalanche-2',      // Avalanche
  'link': 'chainlink',        // Chainlink
  'uni': 'uniswap',           // Uniswap
  'bnb': 'binancecoin',       // Binance Coin
  'xrp': 'ripple',            // Ripple
  'doge': 'dogecoin',         // Dogecoin
  'shib': 'shiba-inu',        // Shiba Inu
  'ltc': 'litecoin',          // Litecoin
  'trx': 'tron',              // Tron
  'etc': 'ethereum-classic',  // Ethereum Classic
  'xlm': 'stellar',           // Stellar
  'algo': 'algorand',         // Algorand
  'vet': 'vechain',           // VeChain
  'icp': 'internet-computer', // Internet Computer
  'fil': 'filecoin',          // Filecoin
  'apt': 'aptos',             // Aptos
  'arb': 'arbitrum',          // Arbitrum
  'op': 'optimism',           // Optimism
  'near': 'near',             // NEAR Protocol
  'ftm': 'fantom',            // Fantom
  'inj': 'injective-protocol',// Injective
  'sui': 'sui',               // Sui
  'sei': 'sei-network',       // Sei
  'tia': 'celestia',          // Celestia
  'btc': 'bitcoin',           // Bitcoin (alias)
  'eth': 'ethereum',          // Ethereum (alias)
  'sol': 'solana',            // Solana (alias)
  // Add more as needed
}

// Default Holdings (Simulated User Portfolio - used if no saved holdings)
const DEFAULT_HOLDINGS = {
  bitcoin: 0.5,     // 0.5 BTC
  ethereum: 10,     // 10 ETH
  solana: 500,      // 500 SOL
  apple: 50,        // 50 Shares AAPL
  tesla: 20,        // 20 Shares TSLA
  nvidia: 15        // 15 Shares NVDA
}

// Load holdings from localStorage or use defaults
const loadHoldings = () => {
  try {
    const saved = localStorage.getItem('orb_holdings')
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    console.warn('Failed to load holdings from localStorage:', e)
  }
  return DEFAULT_HOLDINGS
}

const INITIAL_HOLDINGS = loadHoldings()

// Fallback prices in case API fails (updated periodically)
const FALLBACK_STOCK_PRICES = {
  apple: { usd: 175, usd_24h_change: 0.5 },
  tesla: { usd: 250, usd_24h_change: -0.3 },
  nvidia: { usd: 480, usd_24h_change: 1.2 }
}

// Fallback Crypto Prices (used if CoinGecko API fails)
const FALLBACK_CRYPTO_PRICES = {
  bitcoin: { usd: 65000, usd_24h_change: 2.5 },
  ethereum: { usd: 3500, usd_24h_change: 1.2 },
  solana: { usd: 145, usd_24h_change: -1.5 },
  'avalanche-2': { usd: 55, usd_24h_change: 3.2 },
  'cosmos': { usd: 11, usd_24h_change: 0.5 },
  'polkadot': { usd: 8.5, usd_24h_change: -2.1 },
  'cardano': { usd: 0.60, usd_24h_change: 1.0 },
  'ripple': { usd: 0.62, usd_24h_change: 0.8 },
  'dogecoin': { usd: 0.15, usd_24h_change: 5.0 },
  'chainlink': { usd: 18, usd_24h_change: 2.2 },
  'matic-network': { usd: 0.90, usd_24h_change: -0.5 },
  'shiba-inu': { usd: 0.000028, usd_24h_change: 4.5 },
  'uniswap': { usd: 12, usd_24h_change: 1.5 },
  'binancecoin': { usd: 580, usd_24h_change: 0.5 },
  'litecoin': { usd: 85, usd_24h_change: 0.2 },
  'stellar': { usd: 0.13, usd_24h_change: 1.1 },
  'vechain': { usd: 0.04, usd_24h_change: 0.5 },
  'filecoin': { usd: 8.5, usd_24h_change: -1.2 },
  'aptos': { usd: 14, usd_24h_change: 3.5 },
  'arbitrum': { usd: 1.5, usd_24h_change: 0.2 },
  'optimism': { usd: 3.5, usd_24h_change: 1.8 },
  'near': { usd: 7.2, usd_24h_change: 2.5 },
  'fantom': { usd: 0.85, usd_24h_change: 4.0 },
  'injective-protocol': { usd: 35, usd_24h_change: 5.5 },
  'sui': { usd: 1.8, usd_24h_change: 2.0 },
  'sei-network': { usd: 0.75, usd_24h_change: 1.5 },
  'celestia': { usd: 14, usd_24h_change: -0.5 },
  'pepe': { usd: 0.000008, usd_24h_change: 10.5 },
  'render-token': { usd: 10, usd_24h_change: 3.2 },
  'fetch-ai': { usd: 2.5, usd_24h_change: 4.5 },
}

// Fetch real stock prices from Yahoo Finance API via CORS proxy
async function fetchStockPrices() {
  const stockData = {}

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
            usd: currentPrice || FALLBACK_STOCK_PRICES[key]?.usd || 0,
            usd_24h_change: change
          }
        }
      } catch (err) {
        // If individual stock fails, use fallback
        console.warn(`Failed to fetch ${symbol}:`, err.message)
        return { key, data: FALLBACK_STOCK_PRICES[key] || { usd: 0, usd_24h_change: 0 } }
      }
    })

    const results = await Promise.all(fetchPromises)
    results.forEach(({ key, data }) => {
      stockData[key] = data
    })

  } catch (err) {
    // Return fallbacks if all fail
    console.warn('Stock API failed completely, using fallback prices')
    return FALLBACK_STOCK_PRICES
  }

  return stockData
}

export const useStore = create((set, get) => ({
  // State
  holdings: INITIAL_HOLDINGS,
  prices: {
    bitcoin: { usd: null, usd_24h_change: 0 },
    ethereum: { usd: null, usd_24h_change: 0 },
    solana: { usd: null, usd_24h_change: 0 },
    apple: { usd: null, usd_24h_change: 0 },
    tesla: { usd: null, usd_24h_change: 0 },
    nvidia: { usd: null, usd_24h_change: 0 },
  },
  isLoadingPrices: true, // Track if prices are currently loading
  // Financial Data
  totalValue: 0,
  ath: 0,
  isATH: false,
  percentChange24h: 0,
  theme: 'neon', // neon, matrix, solana, bitcoin, rainbow
  isDarkMode: true,

  // === VOLATILITY & SENTIMENT (Items 20, 21) ===
  volatility: 0, // 0-100 scale
  previousPercentChange: 0,
  sentimentHistory: [], // Last 5 readings for trend detection

  // Calculate sentiment based on trend and momentum
  calculateSentiment: () => {
    const { percentChange24h, sentimentHistory, volatility } = get()

    // Add current reading to history (keep last 5)
    const newHistory = [...sentimentHistory, percentChange24h].slice(-5)
    set({ sentimentHistory: newHistory })

    // Calculate trend direction (average of recent changes)
    const avgChange = newHistory.reduce((a, b) => a + b, 0) / newHistory.length

    // Determine sentiment based on thresholds
    if (avgChange >= 2) return 'bullish'
    if (avgChange <= -2) return 'bearish'
    return 'neutral'
  },

  // Calculate volatility from price swings
  calculateVolatility: (prices) => {
    const changes = Object.values(prices)
      .filter(p => p.usd_24h_change !== undefined)
      .map(p => Math.abs(p.usd_24h_change || 0))

    if (changes.length === 0) return 0

    // Average absolute change as volatility proxy (0-100 scale)
    const avgVolatility = changes.reduce((a, b) => a + b, 0) / changes.length
    return Math.min(100, avgVolatility * 10) // Scale to 0-100
  },

  // === NOTIFICATIONS (Item 19) ===
  notifications: [],
  lastSentiment: null,

  addNotification: (type, message) => {
    const { settings } = get()

    // Check quiet hours
    if (settings.quietHoursEnabled) {
      const now = new Date()
      const currentHour = now.getHours()
      const start = parseInt(settings.quietHoursStart || '22')
      const end = parseInt(settings.quietHoursEnd || '7')

      const inQuietHours = start > end
        ? (currentHour >= start || currentHour < end)
        : (currentHour >= start && currentHour < end)

      if (inQuietHours) return // Don't add notification during quiet hours
    }

    const notification = {
      id: Date.now(),
      type,
      message,
      timestamp: new Date().toISOString(),
      read: false
    }

    set(state => ({
      notifications: [notification, ...state.notifications].slice(0, 50) // Keep last 50
    }))
  },

  markNotificationRead: (id) => {
    set(state => ({
      notifications: state.notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      )
    }))
  },

  clearNotifications: () => set({ notifications: [] }),

  // === PERFORMANCE OPTIMIZATION (Item 22) ===
  lastFetchTime: 0,
  cachedPrices: null,
  fetchThrottleMs: 5000, // Minimum 5s between fetches
  isInputFocused: false, // UI Stabilization state

  shouldFetch: () => {
    const { lastFetchTime, fetchThrottleMs, isInputFocused } = get()
    if (isInputFocused) return false // Prevent updates while user is typing
    return Date.now() - lastFetchTime >= fetchThrottleMs
  },

  // Generic config persistence
  saveUserConfig: async (key, value) => {
    const { userId } = get()
    if (!userId) return

    try {
      await supabase.from('user_configs').upsert({
        user_id: userId,
        config_key: key,
        config_value: value,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id, config_key' })
    } catch (e) {
      console.warn('[Supabase] Save config failed', e)
    }
  },

  loadUserConfig: async (key) => {
    const { userId } = get()
    if (!userId) return null

    try {
      const { data } = await supabase
        .from('user_configs')
        .select('config_value')
        .eq('user_id', userId)
        .eq('config_key', key)
        .single()

      return data?.config_value || null
    } catch (e) {
      console.warn('[Supabase] Load config failed', e)
      return null
    }
  },

  // === ANALYTICS (Item 26) - Privacy-Safe ===
  analytics: {
    sessionStart: Date.now(),
    modeToggles: 0,
    featuresUsed: [],
    errors: []
  },

  refreshAllData: async () => {
    await Promise.all([
      get().fetchData(true),
      get().fetchNovaData()
    ]);
  },

  trackEvent: (eventName, eventData = {}) => {
    // Privacy-safe: no PII, no financial data
    const event = {
      name: eventName,
      timestamp: Date.now(),
      ...eventData
    }

    // Store locally only (no external transmission in this version)
    console.log('[Analytics]', event)

    if (eventName === 'mode_toggle') {
      set(state => ({
        analytics: { ...state.analytics, modeToggles: state.analytics.modeToggles + 1 }
      }))
    }

    if (eventName === 'error') {
      set(state => ({
        analytics: {
          ...state.analytics,
          errors: [...state.analytics.errors, event].slice(-20)
        }
      }))
    }
  },

  // === FEATURE FLAGS ===
  featureFlags: {
    betaFeatures: localStorage.getItem('orb_beta') === 'true',
    // Phase 1 - Live
    notifications: true,
    analytics: true,
    // Phase 2 - Scheduled
    volatilityAnimation: true, // Now Live!
    advancedNotifications: false, // Scheduled: sentiment alerts, major movements, daily summaries
    sentimentSourceSelection: false, // Scheduled: portfolio vs market sentiment
    offlineEnhancements: false, // Scheduled: explicit offline mode
    // Phase 3 - Scheduled
    aiInsights: false, // Scheduled: AI-generated commentary
    enhancedOrbReactions: false, // Scheduled: deeper visual nuance
    changelogView: false // Scheduled: What's New screen
  },

  // Scheduled features info (for UI display)
  scheduledFeatures: {
    phase2: {
      label: 'Phase 2',
      target: 'Next minor release',
      features: [
        { id: 'advancedNotifications', name: 'Advanced Notification Controls', description: 'Sentiment alerts, major movements, daily summaries, quiet hours' },
        { id: 'volatilityAnimation', name: 'Volatility-Based Orb Animation', description: 'Volatility influences glow intensity and motion' },
        { id: 'sentimentSourceSelection', name: 'Sentiment Source Selection', description: 'Choose portfolio-based or market-wide sentiment' },
        { id: 'offlineEnhancements', name: 'Offline Enhancements', description: 'Explicit offline mode indicator and retry queue' }
      ]
    },
    phase3: {
      label: 'Phase 3',
      target: 'Future release',
      features: [
        { id: 'aiInsights', name: 'AI Insights', description: 'Optional AI-generated commentary' },
        { id: 'enhancedOrbReactions', name: 'Enhanced Orb Reactions', description: 'Deeper visual nuance based on additional signals' },
        { id: 'changelogView', name: 'Changelog View', description: "What's New screen for transparency" }
      ]
    }
  },

  setFeatureFlag: (flag, value) => {
    set(state => ({
      featureFlags: { ...state.featureFlags, [flag]: value }
    }))
    if (flag === 'betaFeatures') {
      localStorage.setItem('orb_beta', value ? 'true' : 'false')
    }
  },

  // === APP VERSION ===
  appVersion: '1.0.0',
  changelog: [
    {
      version: '1.0.0', date: '2024-12-14', changes: [
        'Sentiment-driven orb (Auto mode) - colors reflect portfolio sentiment',
        'Manual theme mode for custom orb colors',
        'Login with MetaMask, Phantom, or Email',
        'Optional Guest mode with limited functionality',
        'First-time onboarding flow',
        'Privacy controls and settings',
        'Error and offline state handling',
        'Nova Nodes DeFi protocol integration - Stake, Mint, and Claim',
        'Volatility-based orb animations'
      ]
    }
  ],

  // Wallet Connection State
  connectedWallets: {
    metamask: null,     // Ethereum address
    phantom: null,      // Solana address
    coinbase: null,     // Coinbase Wallet (multi-chain)
    rabby: null,        // Rabby Wallet (EVM)
    core: null,         // Core Wallet (Avalanche)
  },
  walletBalances: {
    ethereum: 0,
    solana: 0,
    avalanche: 0,       // AVAX balance for Core/Trader Joe
  },

  // Goals
  goals: [250000, 500000, 1000000, 5000000],
  currentGoalIndex: 0,

  // Authentication State
  isAuthenticated: localStorage.getItem('orb_authenticated') === 'true',
  isGuest: localStorage.getItem('orb_guest') === 'true',
  authMethod: localStorage.getItem('orb_authMethod') || null, // 'wallet', 'email', or null
  userEmail: localStorage.getItem('orb_userEmail') || null,
  userId: localStorage.getItem('orb_userId') || null, // For Supabase persistence
  authError: null,
  isAuthLoading: false,
  isNovaNodesOpen: false,

  // Nova Nodes State
  novaNodes: {
    tvl: 0,
    totalNodes: 0,
    rewardTokenPrice: 0.1,
    userNodes: [],
    pendingRewards: 0,
    userAssetBalance: 0,
  },
  isBurstActive: false,
  triggerBurst: () => {
    set({ isBurstActive: true });
    setTimeout(() => set({ isBurstActive: false }), 4000);
  },

  toggleNovaNodes: (open) => set((state) => ({
    isNovaNodesOpen: open !== undefined ? open : !state.isNovaNodesOpen
  })),

  // Input Draft Persistence
  inputDrafts: { symbol: '', amount: '' },

  setInputFocused: (focused) => set({ isInputFocused: focused }),

  setInputDrafts: (drafts) => {
    set({ inputDrafts: drafts })
    // Save drafts
    get().saveUserConfig('portfolio_inputs', drafts)
  },

  // Save config to Supabase (Generic)
  // Note: duplicate methods removed, relying on generic implementation up top

  saveHoldings: async () => {
    const { userId, holdings } = get()
    if (!userId) return

    try {
      await supabase.from('user_configs').upsert({
        user_id: userId,
        config_key: 'portfolio_holdings',
        config_value: holdings,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id, config_key' })

      // ALSO save to localStorage for offline/resilience
      localStorage.setItem('orb_holdings', JSON.stringify(holdings))

    } catch (e) {
      console.warn('[Supabase] Save holdings failed', e)
    }
  },

  // Auth Actions
  login: (method, identifier) => {
    const userId = `${method}_${identifier}` // Generate stable ID
    localStorage.setItem('orb_authenticated', 'true')
    localStorage.setItem('orb_guest', 'false')
    localStorage.removeItem('orb_guest') // Ensure it's cleared
    localStorage.setItem('orb_authMethod', method)
    localStorage.setItem('orb_userId', userId)

    if (method === 'email') {
      localStorage.setItem('orb_userEmail', identifier)
    }

    set({
      isAuthenticated: true,
      isGuest: false,
      authMethod: method,
      userEmail: method === 'email' ? identifier : null,
      userId: userId,
      authError: null
    })

    // Load saved inputs
    get().loadUserConfig('portfolio_inputs').then(drafts => {
      if (drafts) set({ inputDrafts: drafts })
    })

    // Load persisted holdings
    get().loadUserConfig('portfolio_holdings').then(cloudHoldings => {
      // Check if we have local holdings that might be fresher/better than cloud
      try {
        const localHoldings = JSON.parse(localStorage.getItem('orb_holdings') || '{}')

        // If local has keys that cloud/default doesn't (e.g. 'atom'), prefer local or merge
        const hasLocalCustomData = Object.keys(localHoldings).some(key =>
          !DEFAULT_HOLDINGS[key] || (cloudHoldings && !cloudHoldings[key])
        )

        // If cloud is empty but local exists, use local
        if ((!cloudHoldings || Object.keys(cloudHoldings).length === 0) && Object.keys(localHoldings).length > 0) {
          console.log('[Login] Using local holdings (Cloud empty)')
          set({ holdings: localHoldings })
          get().fetchData(true)
          // Sync to cloud for next time
          get().saveHoldings()
          return
        }

        // If local has custom data likely missing from cloud (e.g. user added 'atom' locally before login)
        if (hasLocalCustomData) {
          console.log('[Login] Merging/Preferring local holdings over cloud defaults')
          // Merge: Cloud overwrites local for matches, but keep unique local keys
          const merged = { ...localHoldings, ...(cloudHoldings || {}) }
          // Or strictly prefer local if it seems 'better'? 
          // For now, let's trust local if it has 'atom' and cloud doesn't.
          const finalHoldings = localHoldings // Strict preference for this case based on user feedback

          set({ holdings: finalHoldings })
          get().fetchData(true)
          get().saveHoldings() // Update cloud
          return
        }
      } catch (e) {
        console.warn('[Login] Local storage check failed', e)
      }

      // Default behavior: Trust Cloud if no local conflict
      if (cloudHoldings && Object.keys(cloudHoldings).length > 0) {
        set({ holdings: cloudHoldings })
        // Trigger fetch to update prices for these holdings
        get().fetchData(true)
      }
    })
  },

  continueAsGuest: () => set(() => {
    localStorage.setItem('orb_authenticated', 'false')
    localStorage.setItem('orb_guest', 'true')
    localStorage.removeItem('orb_authMethod')
    localStorage.removeItem('orb_userEmail')
    return {
      isAuthenticated: false,
      isGuest: true,
      authMethod: null,
      userEmail: null,
      authError: null
    }
  }),

  logout: () => set(() => {
    localStorage.removeItem('orb_authenticated')
    localStorage.removeItem('orb_guest')
    localStorage.removeItem('orb_authMethod')
    localStorage.removeItem('orb_userEmail')
    localStorage.removeItem('orb_userId')
    return {
      isAuthenticated: false,
      isGuest: false,
      authMethod: null,
      userEmail: null,
      userId: null,
      authError: null,
      inputDrafts: { symbol: '', amount: '' } // Clear drafts
    }
  }),

  setAuthError: (error) => set({ authError: error }),
  setAuthLoading: (loading) => set({ isAuthLoading: loading }),

  // Onboarding State
  hasCompletedOnboarding: localStorage.getItem('orb_onboarding_complete') === 'true',
  completeOnboarding: () => {
    localStorage.setItem('orb_onboarding_complete', 'true')
    set({ hasCompletedOnboarding: true })
  },
  resetOnboarding: () => {
    localStorage.removeItem('orb_onboarding_complete')
    set({ hasCompletedOnboarding: false })
  },

  // Helper function to normalize token IDs (ticker symbols to CoinGecko IDs)
  getNormalizedTokenId: (tokenId) => {
    const normalized = tokenId.toLowerCase()
    return CRYPTO_ID_MAP[normalized] || normalized
  },

  // Helper function to get price data for a token (handles normalization)
  getTokenPriceData: (tokenId) => {
    const { prices, getNormalizedTokenId } = get()
    const normalizedId = getNormalizedTokenId(tokenId)
    return prices[normalizedId] || { usd: null, usd_24h_change: 0 }
  },


  // Data Sync State
  isDataSyncing: false,
  dataSyncError: null,
  hasPortfolioData: false,
  lastDataUpdate: null,

  setDataSyncing: (syncing) => set({ isDataSyncing: syncing }),
  setDataSyncError: (error) => set({ dataSyncError: error }),
  setHasPortfolioData: (hasData) => set({ hasPortfolioData: hasData }),
  setLastDataUpdate: (timestamp) => set({ lastDataUpdate: timestamp }),

  // First-time tooltips tracking
  seenTooltips: JSON.parse(localStorage.getItem('orb_seen_tooltips') || '[]'),
  markTooltipSeen: (tooltipId) => {
    const seen = JSON.parse(localStorage.getItem('orb_seen_tooltips') || '[]')
    if (!seen.includes(tooltipId)) {
      seen.push(tooltipId)
      localStorage.setItem('orb_seen_tooltips', JSON.stringify(seen))
      set({ seenTooltips: seen })
    }
  },

  // Music Player State (shared between MusicPlayer and StockTicker)
  musicIsPlaying: false,
  musicCurrentTrack: null,
  musicAudioRef: null,



  // User Settings (loaded from localStorage) - Comprehensive settings per spec
  settings: {
    // === ORB APPEARANCE ===
    orbMode: localStorage.getItem('orbSettings_orbMode') || 'auto', // 'auto' (sentiment-driven) or 'manual' - default to auto
    manualOrbColor: localStorage.getItem('orbSettings_manualOrbColor') || 'neon', // theme name when manual
    glowIntensity: localStorage.getItem('orbSettings_glowIntensity') || 'medium', // 'low', 'medium', 'high'
    animationSpeed: localStorage.getItem('orbSettings_animationSpeed') || 'normal', // 'slow', 'normal', 'fast'

    // === SENTIMENT & DATA ===
    sentimentSource: localStorage.getItem('orbSettings_sentimentSource') || 'portfolio', // 'portfolio' or 'market'
    updateFrequency: localStorage.getItem('orbSettings_updateFrequency') || '5min', // 'realtime', '5min', 'manual'
    showSentimentBadge: localStorage.getItem('orbSettings_showSentimentBadge') !== 'false', // default true

    // === DISPLAY & ACCESSIBILITY ===
    appTheme: localStorage.getItem('orbSettings_appTheme') || 'dark', // 'dark', 'light', 'system'
    reduceMotion: localStorage.getItem('orbSettings_reduceMotion') === 'true', // default false
    highContrast: localStorage.getItem('orbSettings_highContrast') === 'true', // default false
    textSize: localStorage.getItem('orbSettings_textSize') || 'default', // 'small', 'default', 'large'

    // === UI BEHAVIOR ===
    autoFadeEnabled: localStorage.getItem('orbSettings_autoFade') !== 'false', // default true
    fadeDelay: parseInt(localStorage.getItem('orbSettings_fadeDelay')) || 4000, // default 4 seconds
    doubleClickToFade: localStorage.getItem('orbSettings_doubleClickFade') === 'true', // default false
    showStockTicker: localStorage.getItem('orbSettings_showTicker') !== 'false', // default true
    compactMode: localStorage.getItem('orbSettings_compactMode') === 'true', // default false

    // === NOTIFICATIONS ===
    sentimentAlerts: localStorage.getItem('orbSettings_sentimentAlerts') === 'true', // default false
    priceMovementAlerts: localStorage.getItem('orbSettings_priceAlerts') === 'true', // default false
    priceAlertThreshold: parseInt(localStorage.getItem('orbSettings_priceThreshold')) || 5, // percent
    dailySummary: localStorage.getItem('orbSettings_dailySummary') === 'true', // default false
    quietHoursEnabled: localStorage.getItem('orbSettings_quietHours') === 'true', // default false
    quietHoursStart: localStorage.getItem('orbSettings_quietStart') || '22:00',
    quietHoursEnd: localStorage.getItem('orbSettings_quietEnd') || '08:00',

    // === PRIVACY & SECURITY ===
    hideBalances: localStorage.getItem('orbSettings_hideBalances') === 'true', // default false
    blurOnSwitch: localStorage.getItem('orbSettings_blurOnSwitch') === 'true', // default false

    // === APP BEHAVIOR ===
    backgroundKeepAlive: localStorage.getItem('orbSettings_keepAlive') !== 'false', // default true
    offlineMode: localStorage.getItem('orbSettings_offlineMode') === 'true', // default false
    refreshTimeout: parseInt(localStorage.getItem('orbSettings_refreshTimeout')) || 30, // seconds

    // === ADVANCED / FUTURE (gated) ===
    dynamicReactionsEnabled: localStorage.getItem('orbSettings_dynamicReactions') === 'true', // default false
    aiInsightsEnabled: localStorage.getItem('orbSettings_aiInsights') === 'true', // default false, placeholder
  },

  // Sentiment Color Mapping (configurable, centralized)
  sentimentColorMap: {
    bullish: '#22c55e',   // Green
    neutral: '#eab308',   // Yellow
    bearish: '#ef4444',   // Red
  },

  // Music Player Actions
  setMusicPlaying: (isPlaying) => set({ musicIsPlaying: isPlaying }),
  setMusicCurrentTrack: (track) => set({ musicCurrentTrack: track }),
  setMusicAudioRef: (ref) => set({ musicAudioRef: ref }),

  // Settings Actions
  updateSetting: (key, value) => {
    localStorage.setItem(`orbSettings_${key}`, String(value))
    set((state) => ({
      settings: { ...state.settings, [key]: value }
    }))
  },

  // Reset all settings to defaults
  resetAllSettings: () => {
    const defaults = {
      orbMode: 'auto', // Default to auto (sentiment-driven)
      manualOrbColor: 'neon',
      glowIntensity: 'medium',
      animationSpeed: 'normal',
      sentimentSource: 'portfolio',
      updateFrequency: '5min',
      showSentimentBadge: true,
      appTheme: 'dark',
      reduceMotion: false,
      highContrast: false,
      textSize: 'default',
      autoFadeEnabled: true,
      fadeDelay: 4000,
      doubleClickToFade: false,
      showStockTicker: true,
      compactMode: false,
      sentimentAlerts: false,
      priceMovementAlerts: false,
      priceAlertThreshold: 5,
      dailySummary: false,
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
      hideBalances: false,
      blurOnSwitch: false,
      backgroundKeepAlive: true,
      offlineMode: false,
      refreshTimeout: 30,
      dynamicReactionsEnabled: false,
      aiInsightsEnabled: false,
    }
    // Clear all settings from localStorage
    Object.keys(defaults).forEach(key => {
      localStorage.removeItem(`orbSettings_${key}`)
    })
    set({ settings: defaults })
  },

  // Clear cached data
  clearCachedData: () => {
    localStorage.removeItem('retroGamesSaved')
    // Clear any other cached data here
    console.log('[Settings] Cached data cleared')
  },

  // Actions
  setTheme: (theme) => set({ theme }),
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),

  // Wallet Connection Functions
  connectMetaMask: async () => {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed. Please install MetaMask extension.')
    }

    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timeout. Please make sure MetaMask is unlocked and try again.')), 30000)
      )

      // Request account access with timeout
      const accounts = await Promise.race([
        window.ethereum.request({
          method: 'eth_requestAccounts'
        }),
        timeoutPromise
      ])

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
      if (err.message && err.message.includes('Failed to fetch')) {
        throw new Error('Network Error: Unable to reach Ethereum node. Check your RPC settings.')
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
      if (err.message && err.message.includes('Failed to fetch')) {
        throw new Error('Network Error: Unable to reach Solana node.')
      }
      throw err
    }
  },

  // Coinbase Wallet Connection
  connectCoinbaseWallet: async () => {
    // Coinbase Wallet uses the same ethereum provider interface
    if (typeof window.ethereum === 'undefined' || !window.ethereum.isCoinbaseWallet) {
      throw new Error('Coinbase Wallet is not installed. Please install Coinbase Wallet extension.')
    }

    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timeout. Please make sure Coinbase Wallet is unlocked and try again.')), 30000)
      )

      const accounts = await Promise.race([
        window.ethereum.request({
          method: 'eth_requestAccounts'
        }),
        timeoutPromise
      ])

      if (accounts.length === 0) {
        throw new Error('No accounts found. Please unlock Coinbase Wallet.')
      }

      const address = accounts[0]
      const balanceHex = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      })

      const balanceEth = parseInt(balanceHex, 16) / 1e18
      const holdings = get().holdings

      set({
        connectedWallets: { ...get().connectedWallets, coinbase: address },
        walletBalances: { ...get().walletBalances, ethereum: balanceEth },
        holdings: { ...holdings, ethereum: balanceEth }
      })

      window.ethereum.on('accountsChanged', async (newAccounts) => {
        if (newAccounts.length === 0) {
          get().disconnectWallet('coinbase')
        } else {
          const newAddress = newAccounts[0]
          const newBalanceHex = await window.ethereum.request({
            method: 'eth_getBalance',
            params: [newAddress, 'latest']
          })
          const newBalanceEth = parseInt(newBalanceHex, 16) / 1e18
          const currentHoldings = get().holdings
          set({
            connectedWallets: { ...get().connectedWallets, coinbase: newAddress },
            walletBalances: { ...get().walletBalances, ethereum: newBalanceEth },
            holdings: { ...currentHoldings, ethereum: newBalanceEth }
          })
        }
      })
    } catch (err) {
      if (err.code === 4001) {
        throw new Error('Connection rejected. Please approve the connection in Coinbase Wallet.')
      }
      if (err.message && err.message.includes('Failed to fetch')) {
        throw new Error('Network Error: Unable to reach Ethereum node. Check your RPC settings.')
      }
      throw err
    }
  },

  // Rabby Wallet Connection
  connectRabby: async () => {
    if (typeof window.ethereum === 'undefined' || !window.ethereum.isRabby) {
      throw new Error('Rabby Wallet is not installed. Please install Rabby Wallet extension.')
    }

    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timeout. Please make sure Rabby Wallet is unlocked and try again.')), 30000)
      )

      const accounts = await Promise.race([
        window.ethereum.request({
          method: 'eth_requestAccounts'
        }),
        timeoutPromise
      ])

      if (accounts.length === 0) {
        throw new Error('No accounts found. Please unlock Rabby Wallet.')
      }

      const address = accounts[0]
      const balanceHex = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      })

      const balanceEth = parseInt(balanceHex, 16) / 1e18
      const holdings = get().holdings

      set({
        connectedWallets: { ...get().connectedWallets, rabby: address },
        walletBalances: { ...get().walletBalances, ethereum: balanceEth },
        holdings: { ...holdings, ethereum: balanceEth }
      })

      window.ethereum.on('accountsChanged', async (newAccounts) => {
        if (newAccounts.length === 0) {
          get().disconnectWallet('rabby')
        } else {
          const newAddress = newAccounts[0]
          const newBalanceHex = await window.ethereum.request({
            method: 'eth_getBalance',
            params: [newAddress, 'latest']
          })
          const newBalanceEth = parseInt(newBalanceHex, 16) / 1e18
          const currentHoldings = get().holdings
          set({
            connectedWallets: { ...get().connectedWallets, rabby: newAddress },
            walletBalances: { ...get().walletBalances, ethereum: newBalanceEth },
            holdings: { ...currentHoldings, ethereum: newBalanceEth }
          })
        }
      })
    } catch (err) {
      if (err.code === 4001) {
        throw new Error('Connection rejected. Please approve the connection in Rabby Wallet.')
      }
      if (err.message && err.message.includes('Failed to fetch')) {
        throw new Error('Network Error: Unable to reach Ethereum node. Check your RPC settings.')
      }
      throw err
    }
  },

  // Core Wallet Connection (Avalanche - for Trader Joe)
  connectCore: async () => {
    if (typeof window.avalanche === 'undefined') {
      throw new Error('Core Wallet is not installed. Please install Core Wallet extension.')
    }

    try {
      const accounts = await window.avalanche.request({
        method: 'eth_requestAccounts'
      })

      if (accounts.length === 0) {
        throw new Error('No accounts found. Please unlock Core Wallet.')
      }

      const address = accounts[0]

      // Get AVAX balance
      const balanceHex = await window.avalanche.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      })

      const balanceAvax = parseInt(balanceHex, 16) / 1e18
      const holdings = get().holdings

      set({
        connectedWallets: { ...get().connectedWallets, core: address },
        walletBalances: { ...get().walletBalances, avalanche: balanceAvax },
        holdings: { ...holdings, avalanche: balanceAvax }
      })

      window.avalanche.on('accountsChanged', async (newAccounts) => {
        if (newAccounts.length === 0) {
          get().disconnectWallet('core')
        } else {
          const newAddress = newAccounts[0]
          const newBalanceHex = await window.avalanche.request({
            method: 'eth_getBalance',
            params: [newAddress, 'latest']
          })
          const newBalanceAvax = parseInt(newBalanceHex, 16) / 1e18
          const currentHoldings = get().holdings
          set({
            connectedWallets: { ...get().connectedWallets, core: newAddress },
            walletBalances: { ...get().walletBalances, avalanche: newBalanceAvax },
            holdings: { ...currentHoldings, avalanche: newBalanceAvax }
          })
        }
      })
    } catch (err) {
      if (err.code === 4001) {
        throw new Error('Connection rejected. Please approve the connection in Core Wallet.')
      }
      if (err.message && err.message.includes('Failed to fetch')) {
        throw new Error('Network Error: Unable to reach Avalanche node. Check your RPC settings.')
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
      if (window.solana?.isPhantom) {
        window.solana.disconnect()
      }
      set({
        connectedWallets: { ...currentWallets, phantom: null },
        walletBalances: { ...currentBalances, solana: 0 }
      })
    } else if (wallet === 'coinbase') {
      set({
        connectedWallets: { ...currentWallets, coinbase: null },
        walletBalances: { ...currentBalances, ethereum: 0 }
      })
    } else if (wallet === 'rabby') {
      set({
        connectedWallets: { ...currentWallets, rabby: null },
        walletBalances: { ...currentBalances, ethereum: 0 }
      })
    } else if (wallet === 'core') {
      set({
        connectedWallets: { ...currentWallets, core: null },
        walletBalances: { ...currentBalances, avalanche: 0 }
      })
    }
  },

  // Enhanced Fetch with Real Stock Market Data + Caching & Throttling
  fetchData: async (force = false) => {
    // Performance optimization: throttle requests
    const { shouldFetch, cachedPrices, lastSentiment, settings, addNotification, calculateVolatility, calculateSentiment, trackEvent } = get()

    if (!force && !shouldFetch()) {
      console.log('[Fetch] Throttled - using cached data')
      return cachedPrices
    }

    try {
      // Fetch crypto prices - Dynamic based on holdings and defaults
      const currentHoldings = get().holdings
      const holdingKeys = Object.keys(currentHoldings)
      const defaultCryptos = ['bitcoin', 'ethereum', 'solana']
      const fetchKeys = [...new Set([...holdingKeys, ...defaultCryptos])]

      // Filter out known stocks (keys present in STOCK_SYMBOLS)
      const cryptoKeys = fetchKeys.filter(key => !STOCK_SYMBOLS[key])

      let cryptoData = {}

      // Separate try-catch for Crypto API to ensure Stocks still load if Crypto fails
      try {
        if (cryptoKeys.length > 0) {
          // Map crypto keys to CoinGecko IDs
          const mappedIds = cryptoKeys.map(key => CRYPTO_ID_MAP[key] || key)
          const idsParam = mappedIds.join(',')

          const dynamicUrl = buildCoinGeckoUrl(idsParam)

          // Build request config with optional API key header
          const requestConfig = {}
          if (COINGECKO_API_KEY) {
            requestConfig.headers = {
              'x-cg-demo-api-key': COINGECKO_API_KEY
            }
          }

          const cryptoRes = await axios.get(dynamicUrl, { ...requestConfig, timeout: 5000 })
          cryptoData = cryptoRes.data

          // Validate keys: If API returned 0 or missing data, force fallback
          cryptoKeys.forEach(key => {
            const mappedId = CRYPTO_ID_MAP[key] || key
            const priceInfo = cryptoData[mappedId]

            // If data is missing or price is 0 (invalid for these assets), use fallback
            if (!priceInfo || !priceInfo.usd || priceInfo.usd === 0) {
              // Clone fallback to avoid mutating constant
              if (FALLBACK_CRYPTO_PRICES[mappedId]) {
                cryptoData[mappedId] = { ...FALLBACK_CRYPTO_PRICES[mappedId] }
              }
            }
          })
        }
      } catch (cryptoErr) {
        console.warn('Crypto API failed, using fallbacks:', cryptoErr.message)
        // Use fallbacks for requested keys
        cryptoKeys.forEach(key => {
          const mappedId = CRYPTO_ID_MAP[key] || key
          if (FALLBACK_CRYPTO_PRICES[mappedId]) {
            cryptoData[mappedId] = FALLBACK_CRYPTO_PRICES[mappedId]
          }
        })
      }

      // Paranoia check: Ensure all keys have SOME data (prevents blank UI)
      cryptoKeys.forEach(key => {
        const mappedId = CRYPTO_ID_MAP[key] || key
        if (!cryptoData[mappedId] || !cryptoData[mappedId].usd) {
          if (FALLBACK_CRYPTO_PRICES[mappedId]) {
            cryptoData[mappedId] = FALLBACK_CRYPTO_PRICES[mappedId];
          }
        }
      });

      // Fetch real stock prices (internally handles its own fallbacks)
      const stockData = await fetchStockPrices()

      const newPrices = { ...cryptoData, ...stockData }

      // Cache the prices
      set({
        cachedPrices: newPrices,
        lastFetchTime: Date.now()
      })

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

      // Calculate volatility from price data
      const volatility = calculateVolatility(newPrices)

      // Store previous change for volatility tracking
      const previousPercentChange = get().percentChange24h

      set({
        prices: newPrices,
        totalValue: currentTotal || 0,
        percentChange24h: isFinite(totalChangePercent) ? totalChangePercent : 0,
        ath: Math.max(prevAth, currentTotal),
        isATH: isNewAth,
        currentGoalIndex: goalIndex,
        volatility,
        previousPercentChange,
        isLoadingPrices: false // Done loading
      })

      // Calculate and check for sentiment changes
      const newSentiment = calculateSentiment()

      // Send notification if sentiment changed
      if (lastSentiment && newSentiment !== lastSentiment && settings.sentimentAlerts) {
        const sentimentLabels = {
          bullish: 'Bullish 📈',
          neutral: 'Neutral ➡️',
          bearish: 'Bearish 📉'
        }
        addNotification('sentiment_change', `Portfolio sentiment changed to ${sentimentLabels[newSentiment]}`)
      }

      // Update last sentiment
      set({ lastSentiment: newSentiment })

      // Check for major movement notification
      if (Math.abs(totalChangePercent) >= (settings.priceAlertThreshold || 5) && settings.priceMovementAlerts) {
        const direction = totalChangePercent > 0 ? 'up' : 'down'
        addNotification('major_movement', `Significant market movement detected: ${direction} ${Math.abs(totalChangePercent).toFixed(1)}%`)
      }

    } catch (err) {
      // Track error for analytics
      trackEvent('error', { type: 'fetch_error', message: err.message })

      // Silent error handling
      set({
        isLoadingPrices: false // Ensure loading state is cleared even on error
      })
    }
  },

  // === NOVA NODES LIVE ACTIONS ===
  fetchNovaData: async () => {
    const { connectedWallets } = get();
    let provider;

    // Use the same robust provider detection as staking
    if (connectedWallets.core && window.avalanche) {
      provider = new ethers.BrowserProvider(window.avalanche);
    } else if (connectedWallets.metamask && window.ethereum) {
      provider = new ethers.BrowserProvider(window.ethereum);
    } else if (window.avalanche) {
      provider = new ethers.BrowserProvider(window.avalanche);
    } else if (window.ethereum) {
      provider = new ethers.BrowserProvider(window.ethereum);
    } else {
      // Fallback to Localhost RPC if no wallet found (read-only)
      // Try LAN IP first for mobile, then fallback to localhost
      try {
        // Note: Some mobile wallets/browsers block HTTP RPCs. 
        // If this throws "uris require https", we fallback to empty/localhost to prevent app crash.
        provider = new ethers.JsonRpcProvider("http://192.168.68.60:8545");
      } catch (e) {
        console.warn("LAN RPC init failed, falling back to localhost", e);
        try {
          provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
        } catch (e2) {
          console.error("Localhost RPC init failed", e2);
          // create a dummy provider to prevent crash
          provider = {
            listAccounts: async () => [],
            getNetwork: async () => ({ chainId: 31337 }),
            getCode: async () => '0x'
          };
        }
      }
    }

    try {
      const vault = new ethers.Contract(NOVA_ADDRESSES.StakingVault, NOVA_ABIS.StakingVault, provider);
      const nft = new ethers.Contract(NOVA_ADDRESSES.NodeNFT, NOVA_ABIS.NodeNFT, provider);
      const distributor = new ethers.Contract(NOVA_ADDRESSES.RewardDistributor, NOVA_ABIS.RewardDistributor, provider);

      // Fetch Global Data
      const [tvl, totalNodes] = await Promise.race([
        Promise.all([
          vault.totalStaked(),
          nft.totalSupply()
        ]),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout fetching global data')), 5000))
      ]);

      // Determine User Address
      let userAddress = connectedWallets.metamask || connectedWallets.core;

      // If no address in store, try to fetch from provider (Auto-detect after refresh)
      if (!userAddress && provider.listAccounts) {
        try {
          const accounts = await provider.listAccounts();
          if (accounts.length > 0) {
            // Ethers v6: accounts[0] is a Signer. Need to get address properly.
            userAddress = await accounts[0].getAddress();

            // SYNC BACK TO STORE so the UI knows we are connected!
            const currentWallets = get().connectedWallets;
            // Ideally detect which wallet type, but for now duplicate to ensure it works
            if (window.avalanche) {
              set({ connectedWallets: { ...currentWallets, core: userAddress } });
            } else {
              set({ connectedWallets: { ...currentWallets, metamask: userAddress } });
            }
          }
        } catch (e) {
          console.log("Could not auto-detect accounts", e);
        }
      }

      // Fetch User Specific Data
      let userNodes = [];
      let pendingRewards = BigInt(0);
      let userAssetBalance = BigInt(0);

      if (userAddress) {
        try {
          // Fetch asset balance
          const assetContract = new ethers.Contract(NOVA_ADDRESSES.UnderlyingAsset, NOVA_ABIS.ERC20, provider);
          userAssetBalance = await assetContract.balanceOf(userAddress);

          const balance = await nft.balanceOf(userAddress);
          for (let i = 0; i < Number(balance); i++) {
            const tokenId = await nft.tokenOfOwnerByIndex(userAddress, i);
            // Destructure the 5 return values correctly
            const [staked, rarity, yieldMultiplier, createdAt, lastClaim] = await nft.nodes(tokenId);
            const pending = await distributor.pendingRewards(tokenId);

            userNodes.push({
              id: `#${tokenId.toString()}`,
              amount: ethers.formatEther(staked),
              rarity: ["Common", "Uncommon", "Rare", "Epic", "Legendary"][Number(rarity)], // Added Epic
              multiplier: (Number(yieldMultiplier) / 10000).toFixed(1) + "x",
              color: ["#64748b", "#00ffcc", "#bd00ff", "#ff0055", "#ffaa00"][Number(rarity)], // Added Epic color (orange)
              tokenId: tokenId.toString()
            });
            pendingRewards += pending;
          }
        } catch (err) {
          console.warn("Error fetching user data:", err);
        }
      }

      set({
        novaNodes: {
          tvl: ethers.formatEther(tvl),
          totalNodes: totalNodes.toString(),
          rewardTokenPrice: 0.124, // Mock for now
          userNodes,
          pendingRewards: ethers.formatEther(pendingRewards),
          userAssetBalance: ethers.formatEther(userAssetBalance)
        }
      });
    } catch (err) {
      console.warn('Failed to fetch Nova Nodes data:', err.message);
      get().addNotification('error', `Data Fetch Error: ${err.message}`);
    }
  },

  // Helper to ensure correct network (Localhost)
  ensureLocalhostNetwork: async (provider) => {
    const { chainId } = await provider.getNetwork();
    if (Number(chainId) === 31337) return; // Already on Localhost

    try {
      await provider.send("wallet_switchEthereumChain", [{ chainId: "0x7a69" }]); // 31337 in hex
      // If successful, the network changed.
      // Ethers providers often invalidates here. We should stop execution.
      throw new Error("Network switched to Localhost. Please click the button again to proceed.");
    } catch (switchError) {
      if (switchError.message && switchError.message.includes("Network switched")) {
        throw switchError; // Propagate our friendly error
      }

      // Handle the "network changed" error from Ethers.js
      if (switchError.message && (switchError.message.includes("network changed") || switchError.code === "NETWORK_ERROR")) {
        throw new Error("Network switched. Please click the button again.");
      }

      // This error code indicates that the chain has not been added to MetaMask.
      if (switchError.code === 4902 || switchError.code === -32603) {
        try {
          await provider.send("wallet_addEthereumChain", [{
            chainId: "0x7a69",
            chainName: "Localhost Hardhat",
            rpcUrls: ["http://192.168.68.60:8545"],
            nativeCurrency: {
              name: "ETH",
              symbol: "ETH",
              decimals: 18
            },
            blockExplorerUrls: null
          }]);
        } catch (addError) {
          console.error("Failed to add network:", addError);
          if (addError.message && (addError.message.includes("https") || addError.message.includes("match"))) {
            alert("Network Error: URL/ChainID mismatch or HTTPS required.\n\nTip: If you already have a 'Localhost 8545' network, please DELETE it or EDIT it to use RPC URL: http://192.168.68.60:8545");
          }
          throw new Error('Please manually switch/add your wallet network to Localhost (Chain ID: 31337).');
        }
      } else {
        throw new Error('Please manually switch your wallet network to Localhost (Chain ID: 31337).');
      }
    }
  },

  stakeAVAX: async (amountEth) => {
    const { connectedWallets } = get();
    let provider;

    // Prioritize the wallet typically used for this chain, or fall back to what's available
    if (connectedWallets.core && window.avalanche) {
      provider = new ethers.BrowserProvider(window.avalanche);
    } else if (connectedWallets.metamask && window.ethereum) {
      provider = new ethers.BrowserProvider(window.ethereum);
    } else if (window.avalanche) {
      provider = new ethers.BrowserProvider(window.avalanche);
    } else if (window.ethereum) {
      provider = new ethers.BrowserProvider(window.ethereum);
    } else {
      throw new Error('No wallet connected');
    }

    // Enforce Network
    await get().ensureLocalhostNetwork(provider);

    const signer = await provider.getSigner();

    // Verify contract exists on this network before calling
    const code = await provider.getCode(NOVA_ADDRESSES.UnderlyingAsset);
    if (code === '0x') {
      throw new Error(`Token contract not found on this network (${(await provider.getNetwork()).name}). Please ensure your wallet is connected to Localhost 8545.`);
    }

    const vault = new ethers.Contract(NOVA_ADDRESSES.StakingVault, NOVA_ABIS.StakingVault, signer);
    const asset = new ethers.Contract(NOVA_ADDRESSES.UnderlyingAsset, NOVA_ABIS.ERC20, signer);

    const amount = ethers.parseEther(amountEth);

    // Check allowance
    try {
      const allowance = await asset.allowance(await signer.getAddress(), NOVA_ADDRESSES.StakingVault);
      if (allowance < amount) {
        const tx = await asset.approve(NOVA_ADDRESSES.StakingVault, ethers.MaxUint256);
        await tx.wait();
      }

      const tx = await vault.stake(NOVA_ADDRESSES.UnderlyingAsset, amount);
      await tx.wait();

      // Refresh data
      await get().fetchNovaData();
      get().triggerBurst(); // Celebrate!
      get().trackEvent('nova_node_staked', { amount: amountEth });
    } catch (err) {
      if (err.code === 'CALL_EXCEPTION' || (err.message && err.message.includes('missing revert data'))) {
        throw new Error('Contracts not found on network. Please run the deploy script: npx hardhat run scripts/deploy/01-deploy-core.js --network localhost');
      }
      throw err;
    }
  },

  claimNovaReward: async (tokenId) => {
    const { connectedWallets } = get();
    let provider;

    if (connectedWallets.core && window.avalanche) {
      provider = new ethers.BrowserProvider(window.avalanche);
    } else if (connectedWallets.metamask && window.ethereum) {
      provider = new ethers.BrowserProvider(window.ethereum);
    } else if (window.avalanche) {
      provider = new ethers.BrowserProvider(window.avalanche);
    } else if (window.ethereum) {
      provider = new ethers.BrowserProvider(window.ethereum);
    } else {
      throw new Error('No wallet connected');
    }

    // Enforce Network
    await get().ensureLocalhostNetwork(provider);

    const signer = await provider.getSigner();

    const distributor = new ethers.Contract(NOVA_ADDRESSES.RewardDistributor, NOVA_ABIS.RewardDistributor, signer);
    const tx = await distributor.claimReward(tokenId);
    await tx.wait();

    // Refresh data
    await get().fetchNovaData();
    get().triggerBurst(); // Celebrate!
    get().trackEvent('nova_reward_claimed', { tokenId });
  },

  updateHoldings: (newHoldings) => {
    // Save to localStorage for persistence on same device
    try {
      localStorage.setItem('orb_holdings', JSON.stringify(newHoldings))
    } catch (e) {
      console.warn('Failed to save holdings to localStorage:', e)
    }

    // Save to Supabase for cross-device persistence
    get().saveUserConfig('portfolio_holdings', newHoldings)

    set({ holdings: newHoldings })
  },
}))
