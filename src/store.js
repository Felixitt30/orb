/* eslint-disable */
import { create } from 'zustand'
import axios from 'axios'
import { supabase } from './lib/supabase'

const COINGECKO_API = `https://corsproxy.io/?${encodeURIComponent('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true')}`

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
    volatilityAnimation: false, // Scheduled: volatility-based orb animation
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
        'Error and offline state handling'
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
    } catch (e) {
      console.warn('[Supabase] Save holdings failed', e)
    }
  },

  // Auth Actions
  login: (method, identifier) => {
    const userId = `${method}_${identifier}` // Generate stable ID
    localStorage.setItem('orb_authenticated', 'true')
    localStorage.setItem('orb_guest', 'false')
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
    get().loadUserConfig('portfolio_holdings').then(holdings => {
      if (holdings && Object.keys(holdings).length > 0) {
        set({ holdings })
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
    return prices[normalizedId] || { usd: 0, usd_24h_change: 0 }
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

  // Coinbase Wallet Connection
  connectCoinbaseWallet: async () => {
    // Coinbase Wallet uses the same ethereum provider interface
    if (typeof window.ethereum === 'undefined' || !window.ethereum.isCoinbaseWallet) {
      throw new Error('Coinbase Wallet is not installed. Please install Coinbase Wallet extension.')
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })

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
      throw err
    }
  },

  // Rabby Wallet Connection
  connectRabby: async () => {
    if (typeof window.ethereum === 'undefined' || !window.ethereum.isRabby) {
      throw new Error('Rabby Wallet is not installed. Please install Rabby Wallet extension.')
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })

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
      if (cryptoKeys.length > 0) {
        // Map crypto keys to CoinGecko IDs
        const mappedIds = cryptoKeys.map(key => CRYPTO_ID_MAP[key] || key)
        const idsParam = mappedIds.join(',')

        const dynamicUrl = `https://corsproxy.io/?${encodeURIComponent(`https://api.coingecko.com/api/v3/simple/price?ids=${idsParam}&vs_currencies=usd&include_24hr_change=true`)}`
        const cryptoRes = await axios.get(dynamicUrl)

        // Map the response back to original keys
        // e.g., if user entered "atom", API returns "cosmos", we map it back to "atom"
        cryptoKeys.forEach((originalKey, index) => {
          const coingeckoId = mappedIds[index]
          if (cryptoRes.data[coingeckoId]) {
            cryptoData[originalKey] = cryptoRes.data[coingeckoId]
          }
        })
      }

      // Fetch real stock prices
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

      // Silent error handling - don't log to prevent beeps
      set({
        totalValue: 0,
        percentChange24h: 0
      })
    }
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
