import { useStore } from '../store'
import { useEffect, useState } from 'react'

export function UI() {
    const { totalValue, currentGoalIndex, goals } = useStore()

    // Permanently visible
    const isVisible = true

    return (
        <div style={{ pointerEvents: 'none', position: 'absolute', inset: 0, overflow: 'hidden' }}>

            {/* Net Worth Goal Progress (Top Center) */}
            <div
                style={{
                    position: 'absolute',
                    top: 'calc(var(--safe-area-top, 0px) + 30px)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    textAlign: 'center',
                    opacity: 1,
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

