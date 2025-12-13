import { useState, useEffect } from 'react'
import { useStore } from '../store'

export default function PortfolioUI() {
    const { holdings, updateHoldings } = useStore()
    const [symbol, setSymbol] = useState('')
    const [amount, setAmount] = useState('')
    const [isMobile, setIsMobile] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)

    // Check for mobile viewport
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const handleAddOrUpdate = () => {
        if (!symbol || !amount) return
        const key = symbol.toLowerCase()
        const val = parseFloat(amount)

        if (isNaN(val)) return

        updateHoldings({
            ...holdings,
            [key]: val
        })

        setSymbol('')
        setAmount('')
    }

    const handleRemove = (key) => {
        const newHoldings = { ...holdings }
        delete newHoldings[key]
        updateHoldings(newHoldings)
    }

    // Mobile: Bottom sheet style
    const mobileStyles = {
        position: 'absolute',
        left: 'calc(var(--safe-area-left, 0px) + 12px)',
        right: 'calc(var(--safe-area-right, 0px) + 12px)',
        bottom: 'calc(var(--safe-area-bottom, 0px) + 70px)', // Above ticker
        top: 'auto',
        padding: isExpanded ? '12px' : '10px 12px',
        background: 'rgba(20, 20, 20, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: 12,
        color: 'white',
        fontFamily: 'Inter, sans-serif',
        fontSize: 13,
        maxWidth: 'none',
        maxHeight: isExpanded ? '45vh' : 'auto', // Limit height when expanded to not crush orb
        overflowY: isExpanded ? 'auto' : 'hidden',
        border: '1px solid rgba(255,255,255,0.15)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        transition: 'max-height 0.3s ease, padding 0.2s ease',
    }

    // Desktop: Side panel style
    const desktopStyles = {
        position: 'absolute',
        top: 'calc(var(--safe-area-top, 0px) + 80px)',
        left: 'calc(var(--safe-area-left, 0px) + 20px)',
        right: 'auto',
        bottom: 'auto',
        padding: '16px',
        background: 'rgba(20, 20, 20, 0.9)',
        backdropFilter: 'blur(10px)',
        borderRadius: 12,
        color: 'white',
        fontFamily: 'Inter, sans-serif',
        fontSize: 14,
        maxWidth: 320,
        maxHeight: 'calc(100vh - var(--safe-area-top, 0px) - var(--safe-area-bottom, 0px) - 180px)',
        overflowY: 'auto',
        border: '1px solid rgba(255,255,255,0.1)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
    }

    return (
        <div style={isMobile ? mobileStyles : desktopStyles}>
            {/* Header - Tappable on mobile to expand/collapse */}
            <div
                onClick={() => isMobile && setIsExpanded(!isExpanded)}
                style={{
                    fontWeight: 700,
                    marginBottom: isMobile && !isExpanded ? 0 : 12,
                    letterSpacing: '0.5px',
                    color: '#ccc',
                    flexShrink: 0,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: isMobile ? 'pointer' : 'default',
                }}
            >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    PORTFOLIO
                    {isMobile && !isExpanded && Object.keys(holdings).length > 0 && (
                        <span style={{
                            background: '#4ade80',
                            color: '#000',
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: 10,
                        }}>
                            {Object.keys(holdings).length}
                        </span>
                    )}
                </span>
                {isMobile && (
                    <span style={{
                        fontSize: 12,
                        transition: 'transform 0.2s',
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}>
                        ▲
                    </span>
                )}
            </div>

            {/* Collapsible content - hidden on mobile when collapsed */}
            {(!isMobile || isExpanded) && (
                <>
                    <div style={{ marginBottom: 16, flex: 1, minHeight: 0, overflowY: 'auto' }}>
                        {Object.keys(holdings).length === 0 && (
                            <div style={{ opacity: 0.5, fontStyle: 'italic' }}>Empty portfolio</div>
                        )}

                        {Object.entries(holdings).map(([key, qty]) => (
                            <div
                                key={key}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: 8,
                                    paddingBottom: 8,
                                    borderBottom: '1px solid rgba(255,255,255,0.05)'
                                }}
                            >
                                <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>{key}</span>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <span style={{ fontFamily: 'monospace', color: '#4ade80' }}>{qty}</span>
                                    <button
                                        onClick={() => handleRemove(key)}
                                        style={{
                                            border: 'none',
                                            background: 'transparent',
                                            color: '#666',
                                            cursor: 'pointer',
                                            fontSize: 14,
                                            padding: 2
                                        }}
                                        onMouseEnter={(e) => e.target.style.color = '#ff4444'}
                                        onMouseLeave={(e) => e.target.style.color = '#666'}
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexShrink: 0 }}>
                        <input
                            placeholder="ID (e.g. bitcoin)"
                            value={symbol}
                            onChange={(e) => setSymbol(e.target.value)}
                            style={{
                                flex: 2,
                                padding: '6px 10px',
                                borderRadius: 6,
                                border: '1px solid #333',
                                background: 'rgba(0,0,0,0.5)',
                                color: 'white',
                                fontSize: 12,
                                outline: 'none'
                            }}
                        />
                        <input
                            placeholder="Qty"
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            style={{
                                flex: 1,
                                padding: '6px 10px',
                                borderRadius: 6,
                                border: '1px solid #333',
                                background: 'rgba(0,0,0,0.5)',
                                color: 'white',
                                fontSize: 12,
                                outline: 'none'
                            }}
                        />
                    </div>

                    <button
                        onClick={handleAddOrUpdate}
                        style={{
                            width: '100%',
                            padding: '8px 0',
                            borderRadius: 6,
                            border: 'none',
                            background: '#fff',
                            color: '#000',
                            fontWeight: '700',
                            fontSize: 12,
                            cursor: 'pointer',
                            transition: 'opacity 0.2s',
                            flexShrink: 0
                        }}
                        onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                        onMouseLeave={(e) => e.target.style.opacity = '1'}
                    >
                        UPDATE / ADD
                    </button>
                    <div style={{ marginTop: 8, fontSize: 10, color: '#555', textAlign: 'center', flexShrink: 0 }}>
                        Use CoinGecko IDs (e.g. 'ethereum')
                    </div>
                </>
            )}
        </div>
    )
}
