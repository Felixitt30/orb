import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store'
import { useDraggable } from '../hooks/useDraggable'

import { useWeb3Modal } from '@web3modal/ethers/react'

export default function WalletConnect() {
    const { open } = useWeb3Modal()
    const {
        connectedWallets,
        connectMetaMask,
        connectPhantom,
        connectCoinbaseWallet,
        connectRabby,
        connectCore,
        disconnectWallet,
        walletBalances
    } = useStore()

    const [isExpanded, setIsExpanded] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [isConnecting, setIsConnecting] = useState(null)
    const [error, setError] = useState(null)
    const containerRef = useRef(null)
    const { position, isDragging, handleDragStart, setPosition } = useDraggable(containerRef)

    // Visibility state for auto-fade
    const [isVisible, setIsVisible] = useState(true)
    const [isClosed, setIsClosed] = useState(false)
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
        const checkMobile = () => {
            const mobile = window.innerWidth < 768
            setIsMobile(mobile)
            setPosition({ x: null, y: null })
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const handleConnectMetaMask = async () => {
        if (isMobile || !window.ethereum) {
            await open()
            return
        }

        setIsConnecting('metamask')
        setError(null)
        try {
            await connectMetaMask()
        } catch (err) {
            setError(err.message)
        }
        setIsConnecting(null)
    }

    const handleConnectPhantom = async () => {
        setIsConnecting('phantom')
        setError(null)
        try {
            await connectPhantom()
        } catch (err) {
            setError(err.message)
        }
        setIsConnecting(null)
    }

    const handleConnectCoinbase = async () => {
        setIsConnecting('coinbase')
        setError(null)
        try {
            await connectCoinbaseWallet()
        } catch (err) {
            setError(err.message)
        }
        setIsConnecting(null)
    }

    const handleConnectRabby = async () => {
        setIsConnecting('rabby')
        setError(null)
        try {
            await connectRabby()
        } catch (err) {
            setError(err.message)
        }
        setIsConnecting(null)
    }

    const handleConnectCore = async () => {
        setIsConnecting('core')
        setError(null)
        try {
            await connectCore()
        } catch (err) {
            setError(err.message)
        }
        setIsConnecting(null)
    }

    const formatAddress = (address) => {
        if (!address) return ''
        return `${address.slice(0, 6)}...${address.slice(-4)}`
    }

    const formatBalance = (balance) => {
        if (!balance || balance === 0) return '0'
        if (balance < 0.0001) return '<0.0001'
        if (balance < 1) return balance.toFixed(4)
        if (balance < 1000) return balance.toFixed(2)
        return balance.toLocaleString(undefined, { maximumFractionDigits: 2 })
    }

    const hasConnectedWallets = connectedWallets.metamask || connectedWallets.phantom ||
        connectedWallets.coinbase || connectedWallets.rabby ||
        connectedWallets.core

    // If closed, show a small button to reopen
    if (isClosed) {
        return (
            <button
                onClick={() => { setIsClosed(false); resetFadeTimer(); }}
                style={{
                    position: 'absolute',
                    top: isMobile ? 'auto' : 'calc(var(--safe-area-top, 0px) + 20px)',
                    bottom: isMobile ? 'calc(var(--safe-area-bottom, 0px) + 120px)' : 'auto',
                    left: isMobile ? 'calc(var(--safe-area-left, 0px) + 12px)' : 'calc(var(--safe-area-left, 0px) + 350px)',
                    background: 'rgba(0,0,0,0.6)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 8,
                    padding: '6px 12px',
                    color: '#888',
                    fontSize: 11,
                    cursor: 'pointer',
                    zIndex: 99,
                    pointerEvents: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                }}
            >
                🔗 Wallets
            </button>
        )
    }

    const containerStyle = {
        position: 'fixed',
        top: position.y !== null ? position.y : (isMobile ? 'auto' : 'calc(var(--safe-area-top, 0px) + 20px)'),
        left: position.x !== null ? position.x : (isMobile ? 'calc(var(--safe-area-left, 0px) + 12px)' : 'calc(var(--safe-area-left, 0px) + 350px)'),
        right: isMobile && position.x === null ? 'calc(var(--safe-area-right, 0px) + 12px)' : 'auto',
        bottom: isMobile && position.y === null ? 'calc(var(--safe-area-bottom, 0px) + 120px)' : 'auto',
        width: isMobile && position.x === null ? 'auto' : 200,
        maxWidth: isMobile ? 'calc(100% - 24px)' : 200,
        background: 'rgba(20, 20, 30, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: 12,
        padding: isExpanded ? '14px' : '10px 14px',
        border: isDragging ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.1)',
        color: 'white',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 13,
        zIndex: 99,
        transition: isDragging ? 'none' : 'all 0.2s ease, opacity 0.5s ease',
        opacity: isVisible ? 1 : 0,
        pointerEvents: 'auto',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none'
    }

    return (
        <div
            ref={containerRef}
            onMouseEnter={resetFadeTimer}
            onMouseMove={resetFadeTimer}
            onTouchStart={(e) => { resetFadeTimer(); handleDragStart(e); }}
            onMouseDown={handleDragStart}
            style={containerStyle}
            title="Wallets (drag to move)"
        >
            {/* Close button */}
            <button
                onClick={() => setIsClosed(true)}
                style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    background: 'transparent',
                    border: 'none',
                    color: '#666',
                    fontSize: 12,
                    cursor: 'pointer',
                    padding: 2,
                    lineHeight: 1,
                }}
            >
                ✕
            </button>
            {/* Header */}
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    marginBottom: isExpanded ? 12 : 0,
                }}
            >
                <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                    color: '#ccc'
                }}>
                    <span style={{ fontSize: 16 }}>🔗</span>
                    WALLETS
                    {hasConnectedWallets && (
                        <span style={{
                            width: 8,
                            height: 8,
                            background: '#4ade80',
                            borderRadius: '50%',
                            boxShadow: '0 0 6px #4ade80'
                        }} />
                    )}
                </span>
                <span style={{
                    fontSize: 12,
                    transition: 'transform 0.2s',
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                }}>
                    ▼
                </span>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {/* Error Message */}
                    {error && (
                        <div style={{
                            background: 'rgba(255, 68, 68, 0.2)',
                            border: '1px solid rgba(255, 68, 68, 0.3)',
                            borderRadius: 8,
                            padding: '8px 10px',
                            fontSize: 11,
                            color: '#ff6b6b'
                        }}>
                            {error === 'Failed to fetch'
                                ? 'Network Error: Check wallet RPC or internet connection.'
                                : error}
                        </div>
                    )}

                    {/* MetaMask */}
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: 10,
                        padding: 12,
                        border: connectedWallets.metamask ? '1px solid rgba(245, 133, 66, 0.3)' : '1px solid transparent'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 20 }}>🦊</span>
                                <span style={{ fontWeight: 600 }}>MetaMask</span>
                            </div>
                            {connectedWallets.metamask ? (
                                <button
                                    onClick={() => disconnectWallet('metamask')}
                                    style={{
                                        background: 'rgba(255, 68, 68, 0.2)',
                                        border: '1px solid rgba(255, 68, 68, 0.3)',
                                        borderRadius: 6,
                                        padding: '4px 10px',
                                        color: '#ff6b6b',
                                        fontSize: 11,
                                        cursor: 'pointer'
                                    }}
                                >
                                    Disconnect
                                </button>
                            ) : (
                                <button
                                    onClick={handleConnectMetaMask}
                                    disabled={isConnecting === 'metamask'}
                                    style={{
                                        background: 'linear-gradient(135deg, #f58542, #e2761b)',
                                        border: 'none',
                                        borderRadius: 6,
                                        padding: '6px 12px',
                                        color: 'white',
                                        fontSize: 11,
                                        fontWeight: 600,
                                        cursor: isConnecting === 'metamask' ? 'wait' : 'pointer',
                                        opacity: isConnecting === 'metamask' ? 0.7 : 1
                                    }}
                                >
                                    {isConnecting === 'metamask' ? 'Connecting...' : 'Connect'}
                                </button>
                            )}
                        </div>
                        {connectedWallets.metamask && (
                            <div style={{ fontSize: 11, color: '#888' }}>
                                <div style={{ marginBottom: 4 }}>
                                    Address: <span style={{ color: '#aaa', fontFamily: 'monospace' }}>{formatAddress(connectedWallets.metamask)}</span>
                                </div>
                                {walletBalances.ethereum !== undefined && (
                                    <div style={{ color: '#4ade80' }}>
                                        Balance: {formatBalance(walletBalances.ethereum)} ETH
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Phantom */}
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: 10,
                        padding: 12,
                        border: connectedWallets.phantom ? '1px solid rgba(153, 69, 255, 0.3)' : '1px solid transparent'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 20 }}>👻</span>
                                <span style={{ fontWeight: 600 }}>Phantom</span>
                            </div>
                            {connectedWallets.phantom ? (
                                <button
                                    onClick={() => disconnectWallet('phantom')}
                                    style={{
                                        background: 'rgba(255, 68, 68, 0.2)',
                                        border: '1px solid rgba(255, 68, 68, 0.3)',
                                        borderRadius: 6,
                                        padding: '4px 10px',
                                        color: '#ff6b6b',
                                        fontSize: 11,
                                        cursor: 'pointer'
                                    }}
                                >
                                    Disconnect
                                </button>
                            ) : (
                                <button
                                    onClick={handleConnectPhantom}
                                    disabled={isConnecting === 'phantom'}
                                    style={{
                                        background: 'linear-gradient(135deg, #ab9ff2, #9945ff)',
                                        border: 'none',
                                        borderRadius: 6,
                                        padding: '6px 12px',
                                        color: 'white',
                                        fontSize: 11,
                                        fontWeight: 600,
                                        cursor: isConnecting === 'phantom' ? 'wait' : 'pointer',
                                        opacity: isConnecting === 'phantom' ? 0.7 : 1
                                    }}
                                >
                                    {isConnecting === 'phantom' ? 'Connecting...' : 'Connect'}
                                </button>
                            )}
                        </div>
                        {connectedWallets.phantom && (
                            <div style={{ fontSize: 11, color: '#888' }}>
                                <div style={{ marginBottom: 4 }}>
                                    Address: <span style={{ color: '#aaa', fontFamily: 'monospace' }}>{formatAddress(connectedWallets.phantom)}</span>
                                </div>
                                {walletBalances.solana !== undefined && (
                                    <div style={{ color: '#4ade80' }}>
                                        Balance: {formatBalance(walletBalances.solana)} SOL
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Coinbase Wallet */}
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: 10,
                        padding: 12,
                        border: connectedWallets.coinbase ? '1px solid rgba(24, 104, 250, 0.3)' : '1px solid transparent'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 20 }}>🔵</span>
                                <span style={{ fontWeight: 600 }}>Coinbase</span>
                            </div>
                            {connectedWallets.coinbase ? (
                                <button
                                    onClick={() => disconnectWallet('coinbase')}
                                    style={{
                                        background: 'rgba(255, 68, 68, 0.2)',
                                        border: '1px solid rgba(255, 68, 68, 0.3)',
                                        borderRadius: 6,
                                        padding: '4px 10px',
                                        color: '#ff6b6b',
                                        fontSize: 11,
                                        cursor: 'pointer'
                                    }}
                                >
                                    Disconnect
                                </button>
                            ) : (
                                <button
                                    onClick={handleConnectCoinbase}
                                    disabled={isConnecting === 'coinbase'}
                                    style={{
                                        background: 'linear-gradient(135deg, #1868fa, #0052ff)',
                                        border: 'none',
                                        borderRadius: 6,
                                        padding: '6px 12px',
                                        color: 'white',
                                        fontSize: 11,
                                        fontWeight: 600,
                                        cursor: isConnecting === 'coinbase' ? 'wait' : 'pointer',
                                        opacity: isConnecting === 'coinbase' ? 0.7 : 1
                                    }}
                                >
                                    {isConnecting === 'coinbase' ? 'Connecting...' : 'Connect'}
                                </button>
                            )}
                        </div>
                        {connectedWallets.coinbase && (
                            <div style={{ fontSize: 11, color: '#888' }}>
                                <div style={{ marginBottom: 4 }}>
                                    Address: <span style={{ color: '#aaa', fontFamily: 'monospace' }}>{formatAddress(connectedWallets.coinbase)}</span>
                                </div>
                                {walletBalances.ethereum !== undefined && (
                                    <div style={{ color: '#4ade80' }}>
                                        Balance: {formatBalance(walletBalances.ethereum)} ETH
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Rabby Wallet */}
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: 10,
                        padding: 12,
                        border: connectedWallets.rabby ? '1px solid rgba(138, 99, 255, 0.3)' : '1px solid transparent'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 20 }}>🐰</span>
                                <span style={{ fontWeight: 600 }}>Rabby</span>
                            </div>
                            {connectedWallets.rabby ? (
                                <button
                                    onClick={() => disconnectWallet('rabby')}
                                    style={{
                                        background: 'rgba(255, 68, 68, 0.2)',
                                        border: '1px solid rgba(255, 68, 68, 0.3)',
                                        borderRadius: 6,
                                        padding: '4px 10px',
                                        color: '#ff6b6b',
                                        fontSize: 11,
                                        cursor: 'pointer'
                                    }}
                                >
                                    Disconnect
                                </button>
                            ) : (
                                <button
                                    onClick={handleConnectRabby}
                                    disabled={isConnecting === 'rabby'}
                                    style={{
                                        background: 'linear-gradient(135deg, #8a63ff, #7c3aed)',
                                        border: 'none',
                                        borderRadius: 6,
                                        padding: '6px 12px',
                                        color: 'white',
                                        fontSize: 11,
                                        fontWeight: 600,
                                        cursor: isConnecting === 'rabby' ? 'wait' : 'pointer',
                                        opacity: isConnecting === 'rabby' ? 0.7 : 1
                                    }}
                                >
                                    {isConnecting === 'rabby' ? 'Connecting...' : 'Connect'}
                                </button>
                            )}
                        </div>
                        {connectedWallets.rabby && (
                            <div style={{ fontSize: 11, color: '#888' }}>
                                <div style={{ marginBottom: 4 }}>
                                    Address: <span style={{ color: '#aaa', fontFamily: 'monospace' }}>{formatAddress(connectedWallets.rabby)}</span>
                                </div>
                                {walletBalances.ethereum !== undefined && (
                                    <div style={{ color: '#4ade80' }}>
                                        Balance: {formatBalance(walletBalances.ethereum)} ETH
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Core Wallet (Avalanche - Trader Joe) */}
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: 10,
                        padding: 12,
                        border: connectedWallets.core ? '1px solid rgba(232, 65, 66, 0.3)' : '1px solid transparent'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 20 }}>⛰️</span>
                                <span style={{ fontWeight: 600 }}>Core (AVAX)</span>
                            </div>
                            {connectedWallets.core ? (
                                <button
                                    onClick={() => disconnectWallet('core')}
                                    style={{
                                        background: 'rgba(255, 68, 68, 0.2)',
                                        border: '1px solid rgba(255, 68, 68, 0.3)',
                                        borderRadius: 6,
                                        padding: '4px 10px',
                                        color: '#ff6b6b',
                                        fontSize: 11,
                                        cursor: 'pointer'
                                    }}
                                >
                                    Disconnect
                                </button>
                            ) : (
                                <button
                                    onClick={handleConnectCore}
                                    disabled={isConnecting === 'core'}
                                    style={{
                                        background: 'linear-gradient(135deg, #e84142, #c4302b)',
                                        border: 'none',
                                        borderRadius: 6,
                                        padding: '6px 12px',
                                        color: 'white',
                                        fontSize: 11,
                                        fontWeight: 600,
                                        cursor: isConnecting === 'core' ? 'wait' : 'pointer',
                                        opacity: isConnecting === 'core' ? 0.7 : 1
                                    }}
                                >
                                    {isConnecting === 'core' ? 'Connecting...' : 'Connect'}
                                </button>
                            )}
                        </div>
                        {connectedWallets.core && (
                            <div style={{ fontSize: 11, color: '#888' }}>
                                <div style={{ marginBottom: 4 }}>
                                    Address: <span style={{ color: '#aaa', fontFamily: 'monospace' }}>{formatAddress(connectedWallets.core)}</span>
                                </div>
                                {walletBalances.avalanche !== undefined && (
                                    <div style={{ color: '#4ade80' }}>
                                        Balance: {formatBalance(walletBalances.avalanche)} AVAX
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div style={{
                        fontSize: 10,
                        color: '#555',
                        textAlign: 'center',
                        marginTop: 4
                    }}>
                        Connect wallets to auto-import balances
                    </div>
                </div>
            )}
        </div>
    )
}
