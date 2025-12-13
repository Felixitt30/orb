import { useStore } from '../store'
import { useEffect, useState } from 'react'

export function UI() {
    const { theme, setTheme, isDarkMode, toggleDarkMode, totalValue, currentGoalIndex, goals } = useStore()

    return (
        <div style={{ pointerEvents: 'none', position: 'absolute', inset: 0, overflow: 'hidden' }}>
            {/* Header / Theme Controls */}
            <div style={{
                pointerEvents: 'auto',
                position: 'absolute',
                top: 'calc(var(--safe-area-top, 0px) + 20px)',
                right: 'calc(var(--safe-area-right, 0px) + 20px)',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                alignItems: 'flex-end'
            }}>
                <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    style={{
                        padding: 5,
                        borderRadius: 5,
                        background: '#1a1a1a',
                        color: '#ffffff',
                        border: '1px solid #444',
                        cursor: 'pointer'
                    }}
                >
                    <option value="neon">Default (Red/Green)</option>
                    <option value="neon_purple">Neon Purple</option>
                    <option value="matrix">Matrix Green</option>
                    <option value="solana">Solana Purple</option>
                    <option value="bitcoin">Bitcoin Orange</option>
                    <option value="rainbow">Rainbow Gradient</option>
                </select>

                <button
                    onClick={toggleDarkMode}
                    style={{
                        padding: '5px 10px',
                        borderRadius: 5,
                        background: 'rgba(255,255,255,0.1)',
                        color: '#fff',
                        border: '1px solid #444',
                        cursor: 'pointer'
                    }}
                >
                    {isDarkMode ? '🌙' : '☀️'}
                </button>

                {/* SOUND TOGGLE - More Visible */}
                <label
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        color: '#fff',
                        fontSize: 14,
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        background: 'rgba(0,0,0,0.7)',
                        padding: '8px 12px',
                        borderRadius: 5,
                        border: '2px solid #666',
                        userSelect: 'none'
                    }}
                >
                    <input
                        type="checkbox"
                        checked={localStorage.getItem('orbSoundEnabled') === 'true'}
                        onChange={(e) => {
                            localStorage.setItem('orbSoundEnabled', e.target.checked)
                            // Reload page to apply audio blocking changes
                            window.location.reload()
                        }}
                        style={{
                            width: 16,
                            height: 16,
                            cursor: 'pointer'
                        }}
                    />
                    <span>Sound {localStorage.getItem('orbSoundEnabled') === 'true' ? '🔊' : '🔇'}</span>
                </label>

                <a
                    href="https://vercel.com/new"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        padding: '5px 15px',
                        borderRadius: 5,
                        background: '#fff',
                        color: '#000',
                        textDecoration: 'none',
                        fontWeight: 'bold'
                    }}
                >
                    Deploy
                </a>
            </div>

            {/* Net Worth Goal Progress (Top Center) */}
            <div style={{ position: 'absolute', top: 'calc(var(--safe-area-top, 0px) + 30px)', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', opacity: 0.8 }}>
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

    useEffect(() => {
        if (isMobile) return // Don't generate orders on mobile

        const generate = () => {
            const newOrders = Array.from({ length: 15 }).map(() => ({
                price: 90000 + (Math.random() * 1000 - 500),
                size: Math.random() * 2,
                type: Math.random() > 0.5 ? 'ask' : 'bid'
            })).sort((a, b) => b.price - a.price)
            setOrders(newOrders)
        }
        generate()
        const id = setInterval(generate, 1000)
        return () => clearInterval(id)
    }, [isMobile])

    // Hide on mobile devices
    if (isMobile) return null

    return (
        <div className="order-book" style={{
            position: 'absolute',
            right: 20,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 150,
            fontSize: 10,
            fontFamily: 'monospace',
            opacity: 0.7
        }}>
            <div style={{ textAlign: 'center', marginBottom: 5, color: '#888' }}>BTC ORDER BOOK</div>
            {orders.map((o, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', color: o.type === 'ask' ? '#ff4444' : '#00ff00' }}>
                    <span>{o.price.toFixed(0)}</span>
                    <span style={{ opacity: 0.5 }}>{o.size.toFixed(2)}</span>
                </div>
            ))}
        </div>
    )
}
