import { useEffect, useRef, Suspense, useState } from 'react'
import Confetti from 'react-confetti'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows, Stars } from '@react-three/drei'
import { UI } from './components/UI'
import PortfolioUI from './components/PortfolioUI'
import WalletConnect from './components/WalletConnect'
import OrbInfo from './components/OrbInfo'
import { StockTicker } from './components/StockTicker'
import MusicPlayer from './components/MusicPlayer'
import RetroGames from './components/RetroGames'
import Settings from './components/Settings'
import LoginPage from './components/LoginPage'
import Onboarding from './components/Onboarding'
import DataSyncLoader from './components/DataSyncLoader'
import EmptyState from './components/EmptyState'
import { useStore } from './store'

function OrbModel({ isMobile }) {
  const mesh = useRef()
  const { theme, settings, percentChange24h, sentimentColorMap, volatility, featureFlags, isInputFocused } = useStore()

  // Smaller orb on mobile
  const orbSize = isMobile ? 1.3 : 1.8

  // Animation speed based on settings AND volatility (in Auto mode)
  // Stabilize (stop/slow) when user is typing
  const getAnimationSpeed = () => {
    if (isInputFocused) return 0.02 // Very slow idle rotation

    if (settings.reduceMotion) return 0.02

    let baseSpeed
    switch (settings.animationSpeed) {
      case 'slow': baseSpeed = 0.1; break
      case 'fast': baseSpeed = 0.4; break
      default: baseSpeed = 0.2
    }

    // In Auto mode with volatility animation enabled, boost speed based on volatility
    if (settings.orbMode === 'auto' && featureFlags.volatilityAnimation) {
      const volatilityBoost = 1 + (volatility / 100) * 0.5 // Up to 50% faster
      return baseSpeed * volatilityBoost
    }

    return baseSpeed
  }

  useFrame((state, delta) => {
    if (mesh.current) {
      const speed = getAnimationSpeed()
      mesh.current.rotation.y += delta * speed

      // More intense wobble with higher volatility in Auto mode
      const wobbleIntensity = settings.orbMode === 'auto' && featureFlags.volatilityAnimation
        ? 0.2 + (volatility / 100) * 0.3 // 0.2 to 0.5 based on volatility
        : 0.2

      mesh.current.rotation.x = settings.reduceMotion ? 0 : Math.sin(state.clock.elapsedTime * 0.5) * wobbleIntensity
    }
  })

  // Get sentiment for auto mode
  const getSentiment = () => {
    if (percentChange24h >= 2) return 'bullish'
    if (percentChange24h <= -2) return 'bearish'
    return 'neutral'
  }

  // Theme colors - supports manual and auto (sentiment-driven) modes
  const getThemeColor = () => {
    // Auto mode: color based on portfolio sentiment
    if (settings.orbMode === 'auto') {
      return sentimentColorMap[getSentiment()]
    }

    // Manual mode: use selected theme
    const colorTheme = settings.manualOrbColor || theme
    switch (colorTheme) {
      // Original themes
      case 'neon': return '#ff0055' // Red/Pink
      case 'neon_purple': return '#bd00ff'
      case 'matrix': return '#00ff00'
      case 'solana': return '#9945FF'
      case 'bitcoin': return '#F7931A'
      case 'rainbow': return '#00d0ff' // Light blue base

      // Pink shades
      case 'hot_pink': return '#ff1493'
      case 'pink': return '#ff69b4'
      case 'rose': return '#ff007f'
      case 'magenta': return '#ff00ff'

      // Purple shades
      case 'violet': return '#8b00ff'
      case 'lavender': return '#b57edc'
      case 'purple': return '#a020f0'

      // Blue shades
      case 'electric_blue': return '#0080ff'
      case 'sky_blue': return '#00bfff'
      case 'royal_blue': return '#4169e1'
      case 'navy': return '#000080'

      // Cyan/Teal shades
      case 'cyan': return '#00ffff'
      case 'aqua': return '#00ffaa'
      case 'teal': return '#008080'
      case 'turquoise': return '#40e0d0'

      // Green shades
      case 'lime': return '#00ff00'
      case 'emerald': return '#50c878'
      case 'mint': return '#98ff98'

      // Yellow/Gold shades
      case 'yellow': return '#ffff00'
      case 'gold': return '#ffd700'
      case 'amber': return '#ffbf00'

      // Orange/Red shades
      case 'orange': return '#ff8800'
      case 'coral': return '#ff7f50'
      case 'red': return '#ff0000'
      case 'crimson': return '#dc143c'

      // White/Silver
      case 'white': return '#ffffff'
      case 'silver': return '#c0c0c0'

      default: return '#ffffff'
    }
  }

  // Glow intensity based on settings AND volatility (in Auto mode)
  const getEmissiveIntensity = () => {
    let baseIntensity
    switch (settings.glowIntensity) {
      case 'low': baseIntensity = 0.3; break
      case 'high': baseIntensity = 1.0; break
      default: baseIntensity = 0.6
    }

    // In Auto mode with volatility animation, intensify glow based on volatility
    if (settings.orbMode === 'auto' && featureFlags.volatilityAnimation) {
      const volatilityBoost = 1 + (volatility / 100) * 0.5 // Up to 50% brighter
      return Math.min(1.5, baseIntensity * volatilityBoost)
    }

    return baseIntensity
  }

  const currentTheme = settings.orbMode === 'auto' ? 'auto' : (settings.manualOrbColor || theme)

  return (
    <mesh ref={mesh}>
      <sphereGeometry args={[orbSize, 64, 64]} />
      <meshStandardMaterial
        color={getThemeColor()}
        roughness={0.1}
        metalness={0.9}
        emissive={getThemeColor()}
        emissiveIntensity={getEmissiveIntensity()}
        wireframe={currentTheme === 'matrix'}
      />
    </mesh>
  )
}



function Scene({ isMobile }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={2} />
      <pointLight position={[-10, -10, -10]} intensity={1} color="blue" />

      <OrbModel isMobile={isMobile} />

      <ContactShadows resolution={1024} scale={10} blur={2.5} opacity={0.5} far={10} color="#000000" />

      <OrbitControls
        enablePan={false}
        maxDistance={10}
        minDistance={3}
        autoRotate
        autoRotateSpeed={0.5}
      />

      <Suspense fallback={null}>
        <Environment preset="city" />
      </Suspense>
    </>
  )
}

function App() {
  const {
    fetchData,
    isATH,
    isDarkMode,
    isAuthenticated,
    isGuest,
    hasCompletedOnboarding,
    isDataSyncing,
    setDataSyncing,
    dataSyncError,
    setDataSyncError,
    totalValue,
    setLastDataUpdate,
    authMethod
  } = useStore()

  const [isMobile, setIsMobile] = useState(false)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Data sync on login/guest mode
  useEffect(() => {
    const syncData = async () => {
      if (isAuthenticated || isGuest) {
        setDataSyncing(true)
        setDataSyncError(null)

        try {
          await fetchData()
          setLastDataUpdate(new Date().toISOString())
          setInitialLoadComplete(true)
        } catch (error) {
          setDataSyncError('Unable to load portfolio data. Please try again.')
        } finally {
          setDataSyncing(false)
        }
      }
    }

    syncData()
  }, [isAuthenticated, isGuest])

  // Regular data refresh after initial load
  useEffect(() => {
    if (initialLoadComplete && (isAuthenticated || isGuest)) {
      const interval = setInterval(() => {
        fetchData()
        setLastDataUpdate(new Date().toISOString())
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [initialLoadComplete, isAuthenticated, isGuest, fetchData])

  // FLOW 1: Show login page if not authenticated and not guest
  if (!isAuthenticated && !isGuest) {
    return <LoginPage />
  }

  // FLOW 2: Show onboarding for first-time users (skip for returning users)
  if ((isAuthenticated || isGuest) && !hasCompletedOnboarding) {
    return <Onboarding />
  }

  // FLOW 3: Show data sync loading state
  if (isDataSyncing && !initialLoadComplete) {
    return <DataSyncLoader isWalletConnected={authMethod === 'wallet'} />
  }

  // FLOW 4: Show error state if data sync failed
  if (dataSyncError) {
    return <DataSyncLoader isWalletConnected={authMethod === 'wallet'} />
  }

  // FLOW 5: Show empty state if no portfolio data (totalValue is 0 or undefined)
  // Note: We check for exactly 0 since simulated data should have values
  // In production, you'd check for actual empty portfolio
  // For now, we skip this since we have simulated data

  // Camera position - closer on mobile for better view of smaller orb
  const cameraPosition = isMobile ? [0, 0, 5] : [0, 0, 6]

  // Background color based on dark/light mode
  const backgroundColor = isDarkMode ? '#050505' : '#e8e8e8'

  // FLOW 6: Main dashboard
  return (
    <>
      <div style={{ width: '100%', height: 'var(--app-height, 100vh)', minHeight: 'var(--app-height, 100vh)', position: 'relative', background: backgroundColor, overflow: 'auto', WebkitOverflowScrolling: 'touch', transition: 'background 0.3s ease' }}>
        {isATH && <Confetti recycle={false} numberOfPieces={500} gravity={0.2} />}

        <Canvas camera={{ position: cameraPosition, fov: 45 }}>
          <Scene isMobile={isMobile} />
        </Canvas>

        {/* Orb Info - Value, Sentiment, Tooltip */}
        <OrbInfo />

        {/* UI Overlay */}
        <UI />

        {/* Portfolio Widget */}
        <PortfolioUI />

        {/* Wallet Connection */}
        <WalletConnect />

        {/* Stock Market Ticker */}
        <StockTicker />

        {/* Music Player (Optional - Spotify Integration) */}
        <MusicPlayer />

        {/* Retro Games Emulator */}
        <RetroGames />

        {/* Settings Panel */}
        <Settings />
      </div>
    </>
  )
}

export default App