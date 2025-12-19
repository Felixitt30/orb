import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store'
import { useDraggable } from '../hooks/useDraggable'

export function StockTicker() {
    const { prices, musicIsPlaying, musicCurrentTrack, musicAudioRef, isDarkMode, settings, isInputFocused } = useStore()
    const isPlaying = musicIsPlaying
    const currentTrack = musicCurrentTrack
    const audioRef = musicAudioRef

    // Sections
    const musicRef = useRef(null)
    const stocksRef = useRef(null)
    const cryptoRef = useRef(null)

    const musicDrag = useDraggable(musicRef)
    const stocksDrag = useDraggable(stocksRef)
    const cryptoDrag = useDraggable(cryptoRef)

    // Visibility state for auto-fade
    const [isVisible, setIsVisible] = useState(true)
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

        // Prevent fade if user is typing
        if (isInputFocused) return

        fadeTimerRef.current = setTimeout(() => {
            setIsVisible(false)
        }, settings.fadeDelay || 3000)
    }

    // Handle double-click to fade
    const handleDoubleClick = () => {
        if (settings.doubleClickToFade) {
            setIsVisible(false)
        }
    }

    // Effect: Keep UI visible while typing and manage auto-fade
    useEffect(() => {
        // If input is focused, clear timer and show UI
        if (isInputFocused) {
            if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current)
            setIsVisible(true)
            return
        }

        // Otherwise handle normal auto-fade logic
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
    }, [isInputFocused, settings.autoFadeEnabled, settings.fadeDelay])

    // If showStockTicker is disabled, don't render
    if (!settings.showStockTicker) {
        return null
    }

    const stocks = [
        { key: 'apple', symbol: 'AAPL', name: 'Apple' },
        { key: 'tesla', symbol: 'TSLA', name: 'Tesla' },
        { key: 'nvidia', symbol: 'NVDA', name: 'NVIDIA' }
    ]

    const cryptos = [
        { key: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
        { key: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
        { key: 'solana', symbol: 'SOL', name: 'Solana' }
    ]

    const formatPrice = (price) => {
        if (!price || price === 0) return '$--'
        return price >= 1000
            ? `$${(price / 1000).toFixed(2)}k`
            : `$${price.toFixed(2)}`
    }

    const formatChange = (change) => {
        if (!change || !isFinite(change)) return '0.00%'
        const sign = change >= 0 ? '+' : ''
        return `${sign}${change.toFixed(2)}%`
    }

    // Music control functions
    const handlePlayPause = () => {
        if (audioRef) {
            if (isPlaying) {
                audioRef.pause()
            } else {
                audioRef.play().catch(err => console.warn('Playback failed:', err))
            }
        }
    }

    const handleNext = () => {
        // Dispatch custom event for MusicPlayer to handle
        window.dispatchEvent(new CustomEvent('musicControl', { detail: 'next' }))
    }

    const handlePrevious = () => {
        // Dispatch custom event for MusicPlayer to handle
        window.dispatchEvent(new CustomEvent('musicControl', { detail: 'previous' }))
    }

    // Colors based on dark/light mode
    const bgColor = isDarkMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.95)'
    const borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
    const textColor = isDarkMode ? '#fff' : '#000'
    const mutedTextColor = isDarkMode ? '#aaa' : '#666'
    const labelColor = isDarkMode ? '#888' : '#555'

    return (
        <div
            onMouseEnter={resetFadeTimer}
            onMouseMove={resetFadeTimer}
            onTouchStart={resetFadeTimer}
            onTouchMove={resetFadeTimer}
            onDoubleClick={handleDoubleClick}
            style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: bgColor,
                backdropFilter: 'blur(10px)',
                borderTop: `1px solid ${borderColor}`,
                padding: '12px 20px',
                paddingLeft: 'calc(var(--safe-area-left, 0px) + 20px)',
                paddingRight: 'calc(var(--safe-area-right, 0px) + 20px)',
                paddingBottom: 'max(12px, var(--safe-area-bottom, 0px))',
                display: 'flex',
                gap: 30,
                overflowX: 'auto',
                fontSize: 13,
                fontFamily: 'monospace',
                pointerEvents: 'auto',
                zIndex: 100,
                alignItems: 'center',
                opacity: isVisible ? 1 : 0,
                transition: 'background 0.3s ease, border-color 0.3s ease, opacity 0.5s ease'
            }}>
            {/* Music Controls - Only show if track is loaded */}
            {currentTrack && (
                <div
                    ref={musicRef}
                    onMouseDown={musicDrag.handleDragStart}
                    onTouchStart={musicDrag.handleDragStart}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: musicDrag.position.x !== null ? '10px 15px' : '0 15px 0 0',
                        borderRight: musicDrag.position.x !== null ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                        flexShrink: 0,
                        position: musicDrag.position.x !== null ? 'fixed' : 'relative',
                        left: musicDrag.position.x !== null ? musicDrag.position.x : 'auto',
                        top: musicDrag.position.y !== null ? musicDrag.position.y : 'auto',
                        background: musicDrag.position.x !== null ? bgColor : 'transparent',
                        backdropFilter: musicDrag.position.x !== null ? 'blur(10px)' : 'none',
                        borderRadius: musicDrag.position.x !== null ? 8 : 0,
                        border: musicDrag.position.x !== null ? `1px solid ${borderColor}` : 'none',
                        zIndex: 1001,
                        cursor: musicDrag.isDragging ? 'grabbing' : 'grab',
                        transition: musicDrag.isDragging ? 'none' : 'all 0.3s ease'
                    }}
                    title="Music Status (drag to move)"
                >
                    {/* Now Playing Indicator */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        maxWidth: 120,
                        overflow: 'hidden'
                    }}>
                        <span style={{ fontSize: 14 }}>{isPlaying ? '🎶' : '🎵'}</span>
                        <span style={{
                            color: '#fff',
                            fontSize: 11,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}>
                            {currentTrack.name}
                        </span>
                    </div>

                    {/* Control Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {/* Previous/Rewind */}
                        <button
                            onClick={handlePrevious}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#fff',
                                cursor: 'pointer',
                                padding: 4,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: 0.8
                            }}
                            title="Previous"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                            </svg>
                        </button>

                        {/* Play/Pause */}
                        <button
                            onClick={handlePlayPause}
                            style={{
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                border: 'none',
                                borderRadius: '50%',
                                width: 28,
                                height: 28,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            title={isPlaying ? 'Pause' : 'Play'}
                        >
                            {isPlaying ? (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff">
                                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                                </svg>
                            ) : (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            )}
                        </button>

                        {/* Next/Skip */}
                        <button
                            onClick={handleNext}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#fff',
                                cursor: 'pointer',
                                padding: 4,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: 0.8
                            }}
                            title="Next"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Stocks Section */}
            <div
                ref={stocksRef}
                onMouseDown={stocksDrag.handleDragStart}
                onTouchStart={stocksDrag.handleDragStart}
                style={{
                    display: 'flex',
                    gap: 20,
                    alignItems: 'center',
                    position: stocksDrag.position.x !== null ? 'fixed' : 'relative',
                    left: stocksDrag.position.x !== null ? stocksDrag.position.x : 'auto',
                    top: stocksDrag.position.y !== null ? stocksDrag.position.y : 'auto',
                    padding: stocksDrag.position.x !== null ? '10px 15px' : 0,
                    background: stocksDrag.position.x !== null ? bgColor : 'transparent',
                    backdropFilter: stocksDrag.position.x !== null ? 'blur(10px)' : 'none',
                    borderRadius: stocksDrag.position.x !== null ? 8 : 0,
                    border: stocksDrag.position.x !== null ? `1px solid ${borderColor}` : 'none',
                    zIndex: 1001,
                    cursor: stocksDrag.isDragging ? 'grabbing' : 'grab',
                    transition: stocksDrag.isDragging ? 'none' : 'all 0.3s ease'
                }}
                title="Stock Ticker (drag to move)"
            >
                <span style={{ color: labelColor, fontWeight: 'bold', fontSize: 11 }}>STOCKS</span>
                {stocks.map(({ key, symbol }) => {
                    const price = prices[key]
                    const change = price?.usd_24h_change || 0
                    const isPositive = change >= 0

                    return (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ color: textColor, fontWeight: 'bold' }}>{symbol}</span>
                            <span style={{ color: mutedTextColor }}>{formatPrice(price?.usd)}</span>
                            <span style={{
                                color: isPositive ? '#00ff00' : '#ff4444',
                                fontSize: 11
                            }}>
                                {formatChange(change)}
                            </span>
                        </div>
                    )
                })}
            </div>

            {/* Divider */}
            {stocksDrag.position.x === null && cryptoDrag.position.x === null && (
                <div style={{ width: 1, background: borderColor, height: 20 }} />
            )}

            {/* Crypto Section */}
            <div
                ref={cryptoRef}
                onMouseDown={cryptoDrag.handleDragStart}
                onTouchStart={cryptoDrag.handleDragStart}
                style={{
                    display: 'flex',
                    gap: 20,
                    alignItems: 'center',
                    position: cryptoDrag.position.x !== null ? 'fixed' : 'relative',
                    left: cryptoDrag.position.x !== null ? cryptoDrag.position.x : 'auto',
                    top: cryptoDrag.position.y !== null ? cryptoDrag.position.y : 'auto',
                    padding: cryptoDrag.position.x !== null ? '10px 15px' : 0,
                    background: cryptoDrag.position.x !== null ? bgColor : 'transparent',
                    backdropFilter: cryptoDrag.position.x !== null ? 'blur(10px)' : 'none',
                    borderRadius: cryptoDrag.position.x !== null ? 8 : 0,
                    border: cryptoDrag.position.x !== null ? `1px solid ${borderColor}` : 'none',
                    zIndex: 1001,
                    cursor: cryptoDrag.isDragging ? 'grabbing' : 'grab',
                    transition: cryptoDrag.isDragging ? 'none' : 'all 0.3s ease'
                }}
                title="Crypto Ticker (drag to move)"
            >
                <span style={{ color: labelColor, fontWeight: 'bold', fontSize: 11 }}>CRYPTO</span>
                {cryptos.map(({ key, symbol }) => {
                    const price = prices[key]
                    const change = price?.usd_24h_change || 0
                    const isPositive = change >= 0

                    return (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ color: textColor, fontWeight: 'bold' }}>{symbol}</span>
                            <span style={{ color: mutedTextColor }}>{formatPrice(price?.usd)}</span>
                            <span style={{
                                color: isPositive ? '#00ff00' : '#ff4444',
                                fontSize: 11
                            }}>
                                {formatChange(change)}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
