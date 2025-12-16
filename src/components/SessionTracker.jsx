import { useState, useEffect } from 'react'
import { useStore } from '../store'

export default function SessionTracker() {
    const { percentChange24h, totalValue, volatility } = useStore()
    const [sessionStart] = useState(Date.now())
    const [sessionDuration, setSessionDuration] = useState(0)
    const [isVisible, setIsVisible] = useState(false)
    const [highestValue, setHighestValue] = useState(totalValue)
    const [lowestValue, setLowestValue] = useState(totalValue)

    useEffect(() => {
        // Update session duration every second
        const interval = setInterval(() => {
            setSessionDuration(Math.floor((Date.now() - sessionStart) / 1000))
        }, 1000)

        // Show tracker after 30 seconds
        const showTimer = setTimeout(() => {
            setIsVisible(true)
        }, 30000)

        return () => {
            clearInterval(interval)
            clearTimeout(showTimer)
        }
    }, [sessionStart])

    useEffect(() => {
        // Track highest and lowest values during session
        if (totalValue > highestValue) setHighestValue(totalValue)
        if (totalValue < lowestValue && totalValue > 0) setLowestValue(totalValue)
    }, [totalValue, highestValue, lowestValue])

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        if (mins === 0) return `${secs}s`
        return `${mins}m ${secs}s`
    }

    const sessionChange = highestValue > 0 && lowestValue > 0
        ? ((highestValue - lowestValue) / lowestValue * 100).toFixed(2)
        : 0

    if (!isVisible || sessionDuration < 30) return null

    return (
        <div style={{
            position: 'fixed',
            bottom: 'calc(var(--safe-area-bottom, 0px) + 20px)',
            right: 'calc(var(--safe-area-right, 0px) + 20px)',
            background: 'rgba(20, 20, 30, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: 12,
            padding: '12px 16px',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'white',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 12,
            zIndex: 100,
            minWidth: 200,
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            animation: 'slideInRight 0.3s ease-out'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
                paddingBottom: 8,
                borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}>
                <span style={{
                    fontSize: 11,
                    color: '#888',
                    textTransform: 'uppercase',
                    letterSpacing: 1
                }}>
                    Session
                </span>
                <span style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#4ade80'
                }}>
                    {formatDuration(sessionDuration)}
                </span>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {/* Volatility */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#888', fontSize: 11 }}>Volatility</span>
                    <span style={{
                        color: volatility > 50 ? '#ef4444' : volatility > 25 ? '#f59e0b' : '#4ade80',
                        fontSize: 12,
                        fontWeight: 600
                    }}>
                        {volatility.toFixed(1)}%
                    </span>
                </div>

                {/* Session Range */}
                {sessionChange > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#888', fontSize: 11 }}>Session Range</span>
                        <span style={{
                            color: '#6366f1',
                            fontSize: 12,
                            fontWeight: 600
                        }}>
                            ±{sessionChange}%
                        </span>
                    </div>
                )}

                {/* Current Trend */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#888', fontSize: 11 }}>Trend</span>
                    <span style={{
                        color: percentChange24h > 0 ? '#22c55e' : percentChange24h < 0 ? '#ef4444' : '#888',
                        fontSize: 12,
                        fontWeight: 600
                    }}>
                        {percentChange24h > 0 ? '↗ Bullish' : percentChange24h < 0 ? '↘ Bearish' : '→ Neutral'}
                    </span>
                </div>
            </div>

            {/* Close button */}
            <button
                onClick={() => setIsVisible(false)}
                style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    background: 'transparent',
                    border: 'none',
                    color: '#666',
                    fontSize: 16,
                    cursor: 'pointer',
                    padding: 2,
                    lineHeight: 1
                }}
            >
                ×
            </button>

            <style>{`
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    )
}
