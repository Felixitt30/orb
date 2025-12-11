import { useRef, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Text, Float, MeshDistortMaterial, Environment, Sparkles } from '@react-three/drei'
import Confetti from 'react-confetti'
import { useStore } from './store'
import { UI } from './components/UI'
import * as THREE from 'three'

// --- Sound Logic ---
const playSound = (type) => {
  const AudioContext = window.AudioContext || window.webkitAudioContext
  const ctx = new AudioContext()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.connect(gain)
  gain.connect(ctx.destination)

  if (type === 'success') {
    osc.frequency.setValueAtTime(800, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1)
    gain.gain.setValueAtTime(0.1, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
    osc.start()
    osc.stop(ctx.currentTime + 0.5)
  } else if (type === 'thud') {
    osc.type = 'square'
    osc.frequency.setValueAtTime(100, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.3)
    gain.gain.setValueAtTime(0.1, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
    osc.start()
    osc.stop(ctx.currentTime + 0.3)
  }
}

function Orb() {
  const { totalValue, percentChange24h, prices, theme, isDarkMode } = useStore()
  const mesh = useRef()
  const [tickerIndex, setTickerIndex] = useState(0)
  const { mouse } = useThree()

  // Tilt Logic
  useFrame((state) => {
    // Base rotation
    mesh.current.rotation.y += 0.005

    // Mouse Tilt (Parallax)
    mesh.current.rotation.x = mouse.y * 0.2
    mesh.current.rotation.z = -mouse.x * 0.2
  })

  // Cycle Ticker
  useEffect(() => {
    const interval = setInterval(() => setTickerIndex(prev => (prev + 1) % 6), 3000)
    return () => clearInterval(interval)
  }, [])

  const assets = [
    { label: 'BTC', price: prices.bitcoin?.usd },
    { label: 'ETH', price: prices.ethereum?.usd },
    { label: 'SOL', price: prices.solana?.usd },
    { label: 'AAPL', price: prices.apple?.usd },
    { label: 'TSLA', price: prices.tesla?.usd },
    { label: 'NVDA', price: prices.nvidia?.usd },
  ]
  const currentAsset = assets[tickerIndex] || assets[0]

  // Dynamic Theme Colors
  const getThemeColors = () => {
    const isPos = percentChange24h >= 0
    switch (theme) {
      case 'neon_purple': return { color: '#bd00ff', emissive: '#8b00b8' }
      case 'matrix': return { color: '#00ff00', emissive: '#003300' }
      case 'bitcoin': return { color: '#f7931a', emissive: '#b36b00' }
      case 'solana': return { color: '#9945FF', emissive: '#14F195' }
      case 'rainbow': return { color: '#00ccff', emissive: '#ff00ff' } // simplified for now
      case 'neon': default:
        return {
          color: isPos ? '#00ff9d' : '#ff0066',
          emissive: isPos ? '#00ff88' : '#ff0044'
        }
    }
  }

  const { color, emissive } = getThemeColors()

  return (
    <Float speed={2} rotationIntensity={0} floatIntensity={2}>
      <mesh ref={mesh} scale={2.8}>
        <sphereGeometry args={[1, 128, 128]} />
        <MeshDistortMaterial
          color={color}
          distort={0.5}
          speed={2}
          roughness={0.1}
          metalness={1}
          emissive={emissive}
          emissiveIntensity={1.2}
        />
        <pointLight color={color} distance={4} intensity={4} />
      </mesh>

      <Text position={[0, 0.4, 3.2]} fontSize={0.55} color={isDarkMode ? "#ffffff" : "#1a1a1a"} anchorX="center" anchorY="middle">
        ${Math.round(totalValue).toLocaleString()}
      </Text>
      <Text position={[0, -0.4, 3.2]} fontSize={0.25} color={isDarkMode ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.6)"} anchorX="center" anchorY="middle">
        {currentAsset.label}: ${currentAsset.price?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
      </Text>
    </Float>
  )
}

function SparklinePopup({ asset }) {
  if (!asset) return null
  // Generate fake historical data for demo
  const data = Array.from({ length: 20 }).map(() => Math.random() * 100)
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min
  const points = data.map((d, i) => `${i * 5},${100 - ((d - min) / range * 100)}`).join(' ')

  return (
    <div style={{ position: 'absolute', bottom: 80, left: 40, background: 'rgba(0,0,0,0.8)', padding: 10, borderRadius: 8, border: '1px solid #333' }}>
      <div style={{ fontSize: 12, color: '#aaa', marginBottom: 5 }}>{asset.toUpperCase()} 7D TREND</div>
      <svg width="100" height="40">
        <polyline points={points} fill="none" stroke="#00ff9d" strokeWidth="2" />
      </svg>
    </div>
  )
}

export default function App() {
  const { totalValue, percentChange24h, fetchData, isATH, prices, theme, background, soundEnabled, selectedAsset, selectAsset, isDarkMode } = useStore()

  // Init Data Loop
  useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, 10000)
    return () => clearInterval(id)
  }, [fetchData])

  // Sound Effects
  useEffect(() => {
    if (!soundEnabled) return
    if (percentChange24h > 0.5) playSound('success')
    if (percentChange24h < -0.5) playSound('thud')
  }, [percentChange24h, soundEnabled])

  // Voice Readout
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        const msg = new SpeechSynthesisUtterance(`Your portfolio value is ${Math.round(totalValue)} dollars.`)
        window.speechSynthesis.speak(msg)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [totalValue])

  const bgColors = {
    nebula: '#050505',
    starfield: '#000000',
    grid: '#0a0a1a',
    custom: '#111'
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: isDarkMode ? (bgColors[background] || '#000') : '#f2f2f2', transition: 'background 0.4s ease', overflow: 'hidden' }}>
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
        <pointLight position={[-10, -5, -10]} intensity={5} color={percentChange24h >= 0 ? '#00ff9d' : '#ff0066'} />

        <Orb />

        <Environment preset="city" />
        <OrbitControls enableZoom={false} enablePan={false} />

        {/* Background Effects */}
        {background === 'starfield' && <Sparkles count={500} scale={10} size={1} speed={0} opacity={0.5} />}
        {background === 'nebula' && <Sparkles count={200} scale={12} size={4} speed={0.2} opacity={0.2} color="#cc00ff" />}

        {/* Massive Golden Fireworks on ATH */}
        {isATH && (
          <group>
            <Sparkles count={100} scale={5} size={10} speed={4} color="gold" />
          </group>
        )}
      </Canvas>

      {isATH && <Confetti width={window.innerWidth} height={window.innerHeight} numberOfPieces={1000} colors={['#FFD700', '#FFA500']} recycle={true} />}

      {/* UI Overlay */}
      <UI />

      {/* Main Ticker (Responsive Safe) */}
      <div style={{ position: 'absolute', top: 40, right: 40, textAlign: 'right', pointerEvents: 'none' }}>
        <div style={{ color: percentChange24h >= 0 ? '#00ff9d' : '#ff0066', fontSize: 'min(60px, 10vw)', fontWeight: '800', fontFamily: 'Inter, sans-serif' }}>
          {percentChange24h >= 0 ? '▲' : '▼'} {Math.abs(percentChange24h).toFixed(2)}%
        </div>
      </div>

      {/* Ticker & Sparkline Trigger */}
      <div onClick={() => selectAsset('BTC')} style={{ cursor: 'pointer' }}>
        <HoldingsTicker holdings={useStore(s => s.holdings)} prices={prices} />
      </div>

      {/* Sparkline Popup */}
      <SparklinePopup asset={selectedAsset} />
    </div>
  )
}

function HoldingsTicker({ holdings, prices }) {
  const [index, setIndex] = useState(0)
  const assetKeys = Object.keys(holdings)
  const { selectAsset, isDarkMode } = useStore() // Allow clicking

  useEffect(() => {
    const interval = setInterval(() => setIndex(prev => (prev + 1) % assetKeys.length), 4000)
    return () => clearInterval(interval)
  }, [assetKeys.length])

  const key = assetKeys[index]
  const qty = holdings[key]
  const price = prices[key]?.usd || 0
  const value = qty * price

  // Format: BTC · $1,240,530
  const label = key.toUpperCase()
  const displayLabel = { bitcoin: 'BTC', ethereum: 'ETH', solana: 'SOL', apple: 'AAPL', tesla: 'TSLA', nvidia: 'NVDA' }[key] || label

  return (
    <div
      onClick={(e) => { e.stopPropagation(); selectAsset(displayLabel); }}
      style={{
        position: 'absolute',
        bottom: 40,
        left: 40,
        color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.6)',
        fontFamily: 'Inter, sans-serif',
        fontSize: 14,
        letterSpacing: '1px',
        transition: 'opacity 0.5s',
        cursor: 'pointer'
      }}>
      {displayLabel} · ${Math.round(value).toLocaleString()}
    </div>
  )
}
