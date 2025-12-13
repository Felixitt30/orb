import { useState, useEffect } from 'react'
import { useStore } from '../store'

export default function WalletConnect() {
    const {
        connectedWallets,
        connectMetaMask,
        connectPhantom,
        disconnectWallet,
        walletBalances
    } = useStore()

    const [isExpanded, setIsExpanded] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [isConnecting, setIsConnecting] = useState(null)
    const [error, setError] = useState(null)

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const handleConnectMetaMask = async () => {
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

    const hasConnectedWallets = connectedWallets.metamask || connectedWallets.phantom

    return (
        <div style={{
            position: 'absolute',
            // Desktop: Left side, below where portfolio panel ends (approx 380px from top)
            // Mobile: Bottom sheet above portfolio
            top: isMobile ? 'auto' : 'calc(var(--safe-area-top, 0px) + 20px)',
            left: isMobile ? 'calc(var(--safe-area-left, 0px) + 12px)' : 'calc(var(--safe-area-left, 0px) + 350px)',
            right: isMobile ? 'calc(var(--safe-area-right, 0px) + 12px)' : 'auto',
            bottom: isMobile ? 'calc(var(--safe-area-bottom, 0px) + 120px)' : 'auto',
            width: isMobile ? 'auto' : 200,
            maxWidth: isMobile ? 'none' : 200,
            background: 'rgba(20, 20, 30, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: 12,
            padding: isExpanded ? '14px' : '10px 14px',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'white',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 13,
            zIndex: 99,
            transition: 'all 0.2s ease',
        }}>
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
                            {error}
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
