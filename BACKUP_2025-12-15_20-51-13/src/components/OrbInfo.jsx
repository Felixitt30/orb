import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store'

export default function OrbInfo() {
    const { percentChange24h, totalValue, isATH, settings } = useStore()
    const [showTooltip, setShowTooltip] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [balanceRevealed, setBalanceRevealed] = useState(false)

    // Visibility state for auto-fade and close
    const [isVisible, setIsVisible] = useState(true)
    const [isClosed, setIsClosed] = useState(false)
    const fadeTimerRef = useRef(null)

    // Reset fade timer when interaction occurs
    const resetFadeTimer = () => {
        if (!settings.autoFadeEnabled) {
            setIsVisible(true)
            return
        }
        setIsVisible(true)
        if (fadeTimerRef.current) {
            clearTimeout(fadeTimerRef.current)
        }
        fadeTimerRef.current = setTimeout(() => {
            setIsVisible(false)
        }, settings.fadeDelay || 4000)
    }

    // Handle double-click to fade
    const handleDoubleClick = () => {
        if (settings.doubleClickToFade) {
            setIsVisible(false)
        }
    }

    // Start fade timer on mount and when settings change
    useEffect(() => {
        if (settings.autoFadeEnabled) {
            resetFadeTimer()
        } else {
            setIsVisible(true)
            if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current)
        }
        return () => {
            if (fadeTimerRef.current) {
                clearTimeout(fadeTimerRef.current)
            }
        }
    }, [settings.autoFadeEnabled, settings.fadeDelay])

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    // Determine sentiment based on portfolio performance
    const getSentiment = () => {
        if (isATH) return { text: 'All-Time High! 🚀', color: '#ffd700', glow: '#ffd700' }
        if (percentChange24h >= 5) return { text: 'Strong Rally', color: '#00ff00', glow: '#00ff00' }
        if (percentChange24h >= 2) return { text: 'Bullish', color: '#4ade80', glow: '#4ade80' }
        if (percentChange24h >= 0.5) return { text: 'Gaining', color: '#86efac', glow: '#86efac' }
        if (percentChange24h >= -0.5) return { text: 'Stable', color: '#888', glow: 'transparent' }
        if (percentChange24h >= -2) return { text: 'Cooling', color: '#fbbf24', glow: '#fbbf24' }
        if (percentChange24h >= -5) return { text: 'Bearish', color: '#f87171', glow: '#f87171' }
        return { text: 'Volatile', color: '#ef4444', glow: '#ef4444' }
    }

    const sentiment = getSentiment()

    const formatValue = (value) => {
        // If hide balances is enabled and not revealed, show asterisks
        if (settings.hideBalances && !balanceRevealed) {
            return '••••••'
        }
        if (!value || value === 0) return '$0'
        if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`
        if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`
        return `$${value.toFixed(0)}`
    }

    const formatChange = (change) => {
        // If hide balances is enabled and not revealed, show asterisks
        if (settings.hideBalances && !balanceRevealed) {
            return '••••%'
        }
        if (!change || !isFinite(change)) return '0.00%'
        const sign = change >= 0 ? '+' : ''
        return `${sign}${change.toFixed(2)}%`
    }

    // Handle tap to reveal balance
    const handleBalanceTap = () => {
        if (settings.hideBalances) {
            setBalanceRevealed(!balanceRevealed)
        }
    }

    // If closed, show a small button to reopen
    if (isClosed) {
        return (
            <button
                onClick={() => { setIsClosed(false); resetFadeTimer(); }}
                style={{
                    position: 'absolute',
                    bottom: isMobile ? 'calc(var(--safe-area-bottom, 0px) + 75px)' : 'calc(var(--safe-area-bottom, 0px) + 85px)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(0,0,0,0.6)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 20,
                    padding: '6px 12px',
                    color: '#888',
                    fontSize: 11,
                    cursor: 'pointer',
                    zIndex: 50,
                    pointerEvents: 'auto',
                }}
            >
                Show Info ▲
            </button>
        )
    }

    return (
        <>
            {/* Tooltip on tap/click */}
            {showTooltip && (
                <div
                    onClick={() => setShowTooltip(false)}
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -120%)',
                        background: 'rgba(0, 0, 0, 0.9)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: 12,
                        padding: '16px 20px',
                        color: 'white',
                        fontSize: 13,
                        textAlign: 'center',
                        zIndex: 200,
                        maxWidth: 300,
                        animation: 'fadeIn 0.2s ease',
                        cursor: 'pointer',
                        pointerEvents: 'auto',
                    }}
                >
                    <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 14 }}>
                        ✨ The Orb
                    </div>
                    <div style={{ color: '#aaa', lineHeight: 1.6, marginBottom: 12, textAlign: 'left' }}>
                        <div style={{ marginBottom: 8 }}>
                            <span style={{ color: '#4ade80', fontWeight: 600 }}>📊 Sentiment Indicator</span>
                            <br />
                            <span style={{ fontSize: 12 }}>The status badge below shows your portfolio's real-time performance (Bullish, Bearish, etc.)</span>
                        </div>
                        <div style={{ marginBottom: 8 }}>
                            <span style={{ color: '#8b5cf6', fontWeight: 600 }}>🎨 Orb Appearance</span>
                            <br />
                            <span style={{ fontSize: 12 }}>Customize the orb's color and style via Settings (⚙️). Enable "Auto Mode" for sentiment-driven colors.</span>
                        </div>
                    </div>
                    <div style={{
                        fontSize: 11,
                        color: '#555',
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                        paddingTop: 10
                    }}>
                        Tap anywhere to dismiss
                    </div>
                </div>
            )}

            {/* Clickable area over the orb center */}
            <div
                onClick={() => setShowTooltip(!showTooltip)}
                onMouseEnter={() => !isMobile && setShowTooltip(true)}
                onMouseLeave={() => !isMobile && setShowTooltip(false)}
                style={{
                    position: 'absolute',
                    top: isMobile ? '40%' : '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: isMobile ? 150 : 200,
                    height: isMobile ? 150 : 200,
                    borderRadius: '50%',
                    cursor: 'pointer',
                    zIndex: 50,
                    pointerEvents: 'auto',
                }}
            />

            {/* Bottom sentiment indicator */}
            <div
                onMouseEnter={resetFadeTimer}
                onMouseMove={resetFadeTimer}
                onTouchStart={resetFadeTimer}
                style={{
                    position: 'absolute',
                    bottom: isMobile ? 'calc(var(--safe-area-bottom, 0px) + 75px)' : 'calc(var(--safe-area-bottom, 0px) + 85px)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    textAlign: 'center',
                    pointerEvents: 'auto',
                    zIndex: 50,
                    opacity: isVisible ? 1 : 0,
                    transition: 'opacity 0.5s ease',
                }}>
                {/* Close button */}
                <button
                    onClick={() => setIsClosed(true)}
                    style={{
                        position: 'absolute',
                        top: -8,
                        right: -30,
                        background: 'rgba(0,0,0,0.5)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '50%',
                        width: 20,
                        height: 20,
                        color: '#888',
                        fontSize: 10,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    ✕
                </button>
                {/* Total Value */}
                <div style={{
                    fontSize: isMobile ? 22 : 28,
                    fontWeight: 700,
                    color: 'white',
                    textShadow: '0 2px 20px rgba(0,0,0,0.5)',
                    marginBottom: 4,
                    fontFamily: 'Inter, system-ui, sans-serif',
                }}>
                    {formatValue(totalValue)}
                </div>

                {/* Change percentage */}
                <div style={{
                    fontSize: isMobile ? 13 : 16,
                    fontWeight: 600,
                    color: percentChange24h >= 0 ? '#4ade80' : '#f87171',
                    marginBottom: 6,
                }}>
                    {formatChange(percentChange24h)} today
                </div>

                {/* Sentiment label - only show if enabled in settings */}
                {settings.showSentimentBadge && (
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: isMobile ? 5 : 6,
                        background: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(10px)',
                        padding: isMobile ? '5px 10px' : '6px 14px',
                        borderRadius: 20,
                        border: `1px solid ${sentiment.color}33`,
                    }}>
                        <span style={{
                            width: isMobile ? 6 : 8,
                            height: isMobile ? 6 : 8,
                            borderRadius: '50%',
                            background: sentiment.color,
                            boxShadow: sentiment.glow !== 'transparent' ? `0 0 8px ${sentiment.glow}` : 'none',
                        }} />
                        <span style={{
                            fontSize: isMobile ? 10 : 12,
                            fontWeight: 600,
                            color: sentiment.color,
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                        }}>
                            {sentiment.text}
                        </span>
                    </div>
                )}

                {/* Privacy mode hint */}
                {settings.hideBalances && (
                    <div style={{
                        marginTop: 6,
                        fontSize: 9,
                        color: '#666',
                        cursor: 'pointer',
                    }}
                        onClick={handleBalanceTap}
                    >
                        {balanceRevealed ? '🔓 Tap to hide' : '🔒 Tap to reveal'}
                    </div>
                )}

                {/* Subtle helper text - hide on mobile to save space */}
                {!isMobile && !settings.hideBalances && (
                    <div style={{
                        marginTop: 8,
                        fontSize: 10,
                        color: '#555',
                        pointerEvents: 'auto',
                        cursor: 'pointer',
                    }}
                        onClick={() => setShowTooltip(true)}
                    >
                        Tap orb for details
                    </div>
                )}
            </div >

            {/* CSS animation */}
            < style > {`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translate(-50%, -110%); }
                    to { opacity: 1; transform: translate(-50%, -120%); }
                }
            `}</style >
        </>
    )
}
