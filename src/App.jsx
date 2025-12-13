import { useEffect, useRef, Suspense } from 'react'
import Confetti from 'react-confetti'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows, Stars } from '@react-three/drei'
import { UI } from './components/UI'
import PortfolioUI from './components/PortfolioUI'
import WalletConnect from './components/WalletConnect'
import { StockTicker } from './components/StockTicker'
import { useStore } from './store'

function OrbModel() {
  const mesh = useRef()
  const { theme } = useStore()

  useFrame((state, delta) => {
    if (mesh.current) {
      mesh.current.rotation.y += delta * 0.2
      mesh.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.2
    }
  })

  // Theme colors
  const getThemeColor = () => {
    switch (theme) {
      case 'neon': return '#ff0055' // Red/Pink
      case 'neon_purple': return '#bd00ff'
      case 'matrix': return '#00ff00'
      case 'solana': return '#9945FF'
      case 'bitcoin': return '#F7931A'
      case 'rainbow': return '#00d0ff' // Light blue base
      default: return '#ffffff'
    }
  }

  return (
    <mesh ref={mesh}>
      <sphereGeometry args={[1.8, 64, 64]} />
      <meshStandardMaterial
        color={getThemeColor()}
        roughness={0.15}
        metalness={0.9}
        emissive={getThemeColor()}
        emissiveIntensity={0.6}
        wireframe={theme === 'matrix'}
      />
    </mesh>
  )
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={2} />
      <pointLight position={[-10, -10, -10]} intensity={1} color="blue" />

      <OrbModel />

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
  const { fetchData, isATH } = useStore()

  useEffect(() => {
    fetchData()
    const interval = setInterval(() => fetchData(), 5000)
    return () => clearInterval(interval)
  }, [fetchData])

  return (
    <>
      <div style={{ width: '100%', height: 'var(--app-height, 100vh)', minHeight: 'var(--app-height, 100vh)', position: 'relative', background: '#050505', overflow: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {isATH && <Confetti recycle={false} numberOfPieces={500} gravity={0.2} />}

        <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
          <Scene />
        </Canvas>

        {/* UI Overlay */}
        <UI />

        {/* Portfolio Widget */}
        <PortfolioUI />

        {/* Wallet Connection */}
        <WalletConnect />

        {/* Stock Market Ticker */}
        <StockTicker />
      </div>
    </>
  )
}

export default App