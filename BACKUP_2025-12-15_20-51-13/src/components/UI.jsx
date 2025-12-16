import { useStore } from '../store'
import { useEffect, useState, useRef } from 'react'

export function UI() {
    const { totalValue, currentGoalIndex, goals } = useStore()

    // Visibility state for auto-fade
    const [isVisible, setIsVisible] = useState(true)
    const fadeTimerRef = useRef(null)
    const FADE_DELAY = 4000 // 4 seconds before fading

    // Reset fade timer when interaction occurs
    const resetFadeTimer = () => {
        setIsVisible(true)
        if (fadeTimerRef.current) {
            clearTimeout(fadeTimerRef.current)
        }
        fadeTimerRef.current = setTimeout(() => {
            setIsVisible(false)
        }, FADE_DELAY)
    }

    // Start fade timer on mount
    useEffect(() => {
        resetFadeTimer()
        return () => {
            if (fadeTimerRef.current) {
                clearTimeout(fadeTimerRef.current)
            }
        }
    }, [])

    return (
        <div style={{ pointerEvents: 'none', position: 'absolute', inset: 0, overflow: 'hidden' }}>

            {/* Net Worth Goal Progress (Top Center) */}
            <div
                onMouseEnter={resetFadeTimer}
                onMouseMove={resetFadeTimer}
                onTouchStart={resetFadeTimer}
                style={{
                    position: 'absolute',
                    top: 'calc(var(--safe-area-top, 0px) + 30px)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    textAlign: 'center',
                    opacity: isVisible ? 1 : 0,
                    transition: 'opacity 0.5s ease',
                    pointerEvents: 'auto',
                }}
            >
                <div style={{ fontSize: 10, color: '#888', letterSpacing: 2 }}>NEXT GOAL</div>
                <div style={{ fontSize: 18, color: '#fff', fontWeight: 'bold' }}>${goals[currentGoalIndex].toLocaleString()}</div>
                <div style={{ width: 200, height: 4, background: '#333', marginTop: 5, borderRadius: 2 }}>
                    <div style={{
                        width: `${Math.min(100, (totalValue / goals[currentGoalIndex]) * 100)}%`,
                        height: '100%',
                        background: '#00ff00',
                        borderRadius: 2,
                        transition: 'width 1s'
                    }} />
                </div>
            </div>

            {/* Order Book Visualizer (Right Side) */}
            <OrderBook />
        </div>
    )
}

function OrderBook() {
    // Simulated Order Book
    const [orders, setOrders] = useState([])
    const [isMobile, setIsMobile] = useState(false)

    // Visibility state for auto-fade
    const [isVisible, setIsVisible] = useState(true)
    const fadeTimerRef = useRef(null)
    const FADE_DELAY = 4000 // 4 seconds before fading

    // Reset fade timer when interaction occurs
    const resetFadeTimer = () => {
        setIsVisible(true)
        if (fadeTimerRef.current) {
            clearTimeout(fadeTimerRef.current)
        }
        fadeTimerRef.current = setTimeout(() => {
            setIsVisible(false)
        }, FADE_DELAY)
    }

    // Start fade timer on mount
    useEffect(() => {
        resetFadeTimer()
        return () => {
            if (fadeTimerRef.current) {
                clearTimeout(fadeTimerRef.current)
            }
        }
    }, [])

    useEffect(() => {
        // Check if mobile
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    // OrderBook is disabled - it was a debug/demo element
    // To re-enable, remove this return statement
    return null
}

