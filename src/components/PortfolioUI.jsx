import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store'
import { useDraggable } from '../hooks/useDraggable'

export default function PortfolioUI() {
    const { holdings, updateHoldings, prices, inputDrafts, setInputDrafts, isInputFocused, setInputFocused, settings, fetchData, isLoadingPrices, getTokenPriceData } = useStore()

    const [isMobile, setIsMobile] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)
    const [balanceRevealed, setBalanceRevealed] = useState(false)
    const panelRef = useRef(null)
    const { position, isDragging, handleDragStart, setPosition } = useDraggable(panelRef)

    // Visibility state for auto-fade and close
    const [isVisible, setIsVisible] = useState(true)
    const [isClosed, setIsClosed] = useState(false)
    const fadeTimerRef = useRef(null)

    // Ref to track focus state instantly for event handlers
    const isFocusedRef = useRef(false)

    // Sync ref with store state
    useEffect(() => {
        isFocusedRef.current = isInputFocused
    }, [isInputFocused])

    // Reset fade timer when interaction occurs
    const resetFadeTimer = () => {
        setIsVisible(true)
        if (fadeTimerRef.current) {
            clearTimeout(fadeTimerRef.current)
        }

        // Respect global auto-fade setting
        if (settings.autoFadeEnabled === false) return

        // If user is typing (checked via ref for immediacy), DO NOT start the fade timer
        if (isFocusedRef.current) return

        fadeTimerRef.current = setTimeout(() => {
            setIsVisible(false)
        }, settings.fadeDelay || 4000)
    }

    // Effect: Keep UI visible while typing
    useEffect(() => {
        if (isInputFocused) {
            if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current)
            setIsVisible(true)
        } else {
            // Only restart timer if auto-fade is enabled
            if (settings.autoFadeEnabled !== false) {
                resetFadeTimer()
            }
        }
    }, [isInputFocused, settings.autoFadeEnabled])

    // Global mouse/touch listener to restore visibility when faded
    useEffect(() => {
        const handleGlobalInteraction = () => {
            // Only restore if portfolio is faded (not if manually closed)
            if (!isVisible && !isClosed) {
                resetFadeTimer()
            }
        }

        // Only listen for mouse MOVEMENT (not clicks) to restore visibility
        // This prevents interference with input fields and other UI elements
        window.addEventListener('mousemove', handleGlobalInteraction)
        window.addEventListener('touchmove', handleGlobalInteraction)

        return () => {
            window.removeEventListener('mousemove', handleGlobalInteraction)
            window.removeEventListener('touchmove', handleGlobalInteraction)
        }
    }, [isVisible, isClosed])

    // Start fade timer on mount
    useEffect(() => {
        resetFadeTimer()
        return () => {
            if (fadeTimerRef.current) {
                clearTimeout(fadeTimerRef.current)
            }
        }
    }, [])

    // Fetch price data on mount and periodically
    useEffect(() => {
        // Initial fetch
        fetchData(true)

        // Set up periodic fetching every 30 seconds
        const interval = setInterval(() => {
            fetchData(false)
        }, 30000)

        return () => clearInterval(interval)
    }, [])

    // Check for mobile viewport and reset position
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768
            setIsMobile(mobile)
            // Reset position when switching between mobile/desktop
            setPosition({ x: null, y: null })
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    // Handlers
    const handleRemove = (key) => {
        const newHoldings = { ...holdings }
        delete newHoldings[key]
        updateHoldings(newHoldings)
    }

    const handleAddOrUpdate = () => {
        if (!inputDrafts.symbol || !inputDrafts.amount) return
        const key = inputDrafts.symbol.toLowerCase()
        const val = parseFloat(inputDrafts.amount)

        if (isNaN(val)) return

        updateHoldings({
            ...holdings,
            [key]: val
        })

        // Force immediate fetch to get price for new token
        setTimeout(() => {
            fetchData(true)
        }, 50)

        setInputDrafts({ symbol: '', amount: '' })
    }

    const toggleBalanceReveal = () => {
        if (settings.hideBalances) {
            setBalanceRevealed(!balanceRevealed)
        }
    }

    // Format helpers
    const formatValue = (value) => {
        if (settings.hideBalances && !balanceRevealed) return '••••••'
        if (value === 0 || isNaN(value)) return '$0.00'
        if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`
        if (value >= 1000) return `$${(value / 1000).toFixed(2)}K`
        return `$${value.toFixed(2)}`
    }

    const formatPrice = (price) => {
        if (price === 0 || isNaN(price)) return '$0'
        if (price >= 1000) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
        if (price >= 1) return `$${price.toFixed(2)}`
        return `$${price.toFixed(4)}`
    }

    const formatQty = (qty) => {
        if (settings.hideBalances && !balanceRevealed) return '•••'
        return qty
    }

    // Sort holdings by total value (descending)
    const sortedHoldings = Object.entries(holdings)
        .map(([key, qty]) => {
            // Use helper function to get price data with proper normalization
            const priceData = getTokenPriceData(key)

            // Use null for missing prices (not 0) so UI can distinguish
            const price = typeof priceData.usd === 'number' ? priceData.usd : null
            const value = price !== null ? price * qty : null

            return {
                key,
                qty,
                price,
                value,
                change: priceData.usd_24h_change ?? null
            }
        })
        .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))

    if (isClosed) {
        return (
            <button
                onClick={() => setIsClosed(false)}
                style={{
                    position: 'absolute',
                    top: isMobile ? 'auto' : 'calc(var(--safe-area-top, 0px) + 80px)',
                    bottom: isMobile ? 'calc(var(--safe-area-bottom, 0px) + 70px)' : 'auto',
                    left: 'calc(var(--safe-area-left, 0px) + 12px)',
                    left: 'calc(var(--safe-area-left, 0px) + 12px)',
                    background: 'rgba(0,0,0,0.6)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 8,
                    padding: '6px 12px',
                    color: '#888',
                    fontSize: 11,
                    cursor: 'pointer',
                    zIndex: 1100,
                    pointerEvents: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                }}
            >
                📊 Portfolio
            </button>
        )
    }

    const baseStyles = {
        padding: '16px',
        background: 'rgba(20, 20, 20, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: 12,
        color: 'white',
        fontFamily: 'Inter, sans-serif',
        fontSize: 14,
        border: '1px solid rgba(255,255,255,0.1)',
        zIndex: 1100, // Ensure it is above Settings Button (1000) and OrbInfo (200)
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        transition: 'opacity 0.5s ease',
        opacity: (isVisible || isInputFocused) ? 1 : 0,
        pointerEvents: (isVisible || isInputFocused) ? 'auto' : 'none',
        boxSizing: 'border-box',
    }

    const desktopStyles = {
        ...baseStyles,
        position: position.x !== null ? 'fixed' : 'absolute',
        top: position.y !== null ? position.y : 'calc(var(--safe-area-top, 0px) + 80px)',
        left: position.x !== null ? position.x : 'calc(var(--safe-area-left, 0px) + 20px)',
        width: 'min(360px, 92vw)', // Responsive width that adapts to screen
        maxWidth: '100vw', // Never exceed viewport
        maxHeight: 'calc(100vh - 180px)',
        overflowY: 'auto', // Allow vertical scroll
        overflowX: 'hidden', // Prevent horizontal scroll
        cursor: isDragging ? 'grabbing' : 'default',
    }

    const mobileStyles = {
        ...baseStyles,
        position: 'absolute',
        left: 'calc(var(--safe-area-left, 0px) + 12px)',
        right: 'calc(var(--safe-area-right, 0px) + 12px)',
        bottom: 'calc(var(--safe-area-bottom, 0px) + 70px)',
        maxWidth: '100vw',
        maxHeight: '60vh', // Limit height to avoid clipping top
        overflowY: 'auto', // Always allow scrolling on mobile
        overflowX: 'hidden',
    }

    return (
        <div
            ref={panelRef}
            onMouseEnter={resetFadeTimer}
            onMouseMove={resetFadeTimer}
            onTouchStart={(e) => { resetFadeTimer(); handleDragStart(e); }}

            onMouseDown={handleDragStart}
            onClick={(e) => e.stopPropagation()}
            style={{
                ... (isMobile ? mobileStyles : desktopStyles),
                cursor: isDragging ? 'grabbing' : 'grab'
            }}
            title="Portfolio (drag to move)"
        >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>PORTFOLIO</h3>
                <button
                    onClick={() => setIsClosed(true)}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#666',
                        cursor: 'pointer',
                        fontSize: 18,
                        padding: 0,
                        lineHeight: 1
                    }}
                >
                    ✕
                </button>
            </div>

            {/* Holdings List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sortedHoldings.length === 0 && (
                    <div style={{ opacity: 0.5, fontStyle: 'italic', fontSize: 12 }}>Empty portfolio</div>
                )}

                {sortedHoldings.map(({ key, qty, price, value, change }) => {
                    const isPositive = change >= 0
                    const changeColor = isPositive ? '#4ade80' : '#f87171'

                    return (
                        <div
                            key={key}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 6,
                                paddingBottom: 12,
                                borderBottom: '1px solid rgba(255,255,255,0.05)'
                            }}
                        >
                            {/* Top Row: Token Name + Remove Button */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ textTransform: 'uppercase', fontWeight: 600, fontSize: 13, color: '#fff' }}>
                                    {key}
                                </span>
                                <button
                                    onClick={() => handleRemove(key)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: 20,
                                        height: 20,
                                        border: 'none',
                                        background: 'transparent',
                                        color: '#666',
                                        cursor: 'pointer',
                                        fontSize: 14,
                                        padding: 0,
                                        opacity: 0.6
                                    }}
                                    onMouseEnter={(e) => { e.target.style.opacity = '1'; e.target.style.color = '#ff4444' }}
                                    onMouseLeave={(e) => { e.target.style.opacity = '0.6'; e.target.style.color = '#666' }}
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Middle Row: Price + % Change */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                {isLoadingPrices ? (
                                    <div style={{
                                        width: 80,
                                        height: 12,
                                        background: 'linear-gradient(90deg, #222 25%, #333 37%, #222 63%)',
                                        backgroundSize: '200% 100%',
                                        animation: 'shimmer 1.4s infinite',
                                        borderRadius: 4
                                    }} />
                                ) : (
                                    <>
                                        <span style={{ fontSize: 11, color: '#888', fontFamily: 'monospace' }}>
                                            {price !== null ? formatPrice(price) : '—'}
                                        </span>
                                        {price !== null && change !== null && change !== 0 && (
                                            <span style={{ fontSize: 10, color: changeColor, fontWeight: 600 }}>
                                                {change > 0 ? '+' : ''}{change.toFixed(1)}%
                                            </span>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Bottom Row: Total Value (BOLD) + Quantity */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                {/* Total Value - Most Important! */}
                                {isLoadingPrices ? (
                                    <div style={{
                                        width: 100,
                                        height: 16,
                                        background: 'linear-gradient(90deg, #222 25%, #333 37%, #222 63%)',
                                        backgroundSize: '200% 100%',
                                        animation: 'shimmer 1.4s infinite',
                                        borderRadius: 4
                                    }} />
                                ) : (
                                    <span style={{
                                        fontSize: 16,
                                        fontWeight: 700,
                                        color: value !== null ? '#fff' : '#666',
                                        fontFamily: 'monospace'
                                    }}>
                                        {value !== null ? formatValue(value) : '—'}
                                    </span>
                                )}

                                {/* Quantity - Secondary */}
                                <span style={{
                                    fontFamily: 'monospace',
                                    color: '#4ade80',
                                    fontSize: 11,
                                    opacity: 0.8
                                }}>
                                    {formatQty(qty)}
                                </span>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Add/Update Form */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                <input
                    placeholder="Symbol (e.g. ATOM, BTC)"
                    value={inputDrafts?.symbol || ''}
                    onChange={(e) => setInputDrafts({ ...inputDrafts, symbol: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    style={{
                        padding: '8px 10px',
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
                    value={inputDrafts?.amount || ''}
                    onChange={(e) => setInputDrafts({ ...inputDrafts, amount: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    style={{
                        padding: '8px 10px',
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
                onClick={(e) => {
                    e.stopPropagation()
                    handleAddOrUpdate()
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                style={{
                    width: '100%',
                    padding: '10px 0',
                    borderRadius: 6,
                    border: 'none',
                    background: '#fff',
                    color: '#000',
                    fontWeight: '700',
                    fontSize: 12,
                    cursor: 'pointer',
                    transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
                UPDATE / ADD
            </button>

            <div style={{ fontSize: 10, color: '#555', textAlign: 'center' }}>
                30+ tickers supported (ATOM, ADA, DOT, etc.)
            </div>

            <style>{`
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
            `}</style>
        </div>
    )
}
