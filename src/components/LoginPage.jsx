import { useState, useEffect } from 'react'
import { useStore } from '../store'

export default function LoginPage() {
    const {
        login,
        continueAsGuest,
        authError,
        isAuthLoading,
        setAuthError,
        setAuthLoading,
        connectMetaMask,
        connectPhantom,
        connectCoinbaseWallet,
        connectRabby,
        connectCore
    } = useStore()

    const [email, setEmail] = useState('')
    const [showEmailInput, setShowEmailInput] = useState(false)
    const [emailSent, setEmailSent] = useState(false)
    const [isOffline, setIsOffline] = useState(!navigator.onLine)

    // Check online status
    useEffect(() => {
        const handleOnline = () => setIsOffline(false)
        const handleOffline = () => setIsOffline(true)
        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)
        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    // Handle wallet connection
    const handleWalletConnect = async (walletType) => {
        if (isOffline) {
            setAuthError('No internet connection. Please reconnect to continue.')
            return
        }

        setAuthLoading(true)
        setAuthError(null)

        try {
            if (walletType === 'metamask') {
                await connectMetaMask()
            } else if (walletType === 'phantom') {
                await connectPhantom()
            } else if (walletType === 'coinbase') {
                await connectCoinbaseWallet()
            } else if (walletType === 'rabby') {
                await connectRabby()
            } else if (walletType === 'core') {
                await connectCore()
            }
            login('wallet', walletType)
        } catch (error) {
            if (error.message?.includes('rejected') || error.message?.includes('cancelled')) {
                setAuthError('Connection was cancelled. No changes were made.')
            } else if (error.message?.includes('not installed')) {
                setAuthError(error.message)
            } else {
                setAuthError('Unable to connect. Please try again.')
            }
        } finally {
            setAuthLoading(false)
        }
    }

    // Handle email sign in
    const handleEmailSignIn = async () => {
        if (isOffline) {
            setAuthError('No internet connection. Please reconnect to continue.')
            return
        }

        if (!email || !email.includes('@')) {
            setAuthError('Please enter a valid email address.')
            return
        }

        setAuthLoading(true)
        setAuthError(null)

        try {
            // Simulate sending magic link (in real app, this would call an API)
            await new Promise(resolve => setTimeout(resolve, 1500))
            setEmailSent(true)
            // For demo purposes, auto-login after showing success
            setTimeout(() => {
                login('email', email)
            }, 2000)
        } catch (error) {
            setAuthError('Unable to send sign-in link. Please try again.')
        } finally {
            setAuthLoading(false)
        }
    }

    // Handle guest mode
    const handleGuestMode = () => {
        continueAsGuest()
    }

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(145deg, #0a0a0a 0%, #151515 50%, #0a0a0a 100%)',
            fontFamily: 'Inter, system-ui, sans-serif',
            color: '#fff',
            padding: 20,
            overflow: 'auto'
        }}>
            {/* Background Orb Animation */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 300,
                height: 300,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(100, 100, 100, 0.15) 0%, transparent 70%)',
                filter: 'blur(60px)',
                animation: 'pulse 4s ease-in-out infinite',
                pointerEvents: 'none'
            }} />

            {/* Main Content */}
            <div style={{
                position: 'relative',
                zIndex: 1,
                maxWidth: 400,
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 24
            }}>
                {/* Logo/Header */}
                <div style={{ textAlign: 'center', marginBottom: 8 }}>
                    <div style={{
                        fontSize: 48,
                        marginBottom: 8,
                        filter: 'drop-shadow(0 0 20px rgba(150, 150, 150, 0.3))'
                    }}>
                        🔮
                    </div>
                    <h1 style={{
                        fontSize: 32,
                        fontWeight: 700,
                        margin: 0,
                        letterSpacing: '-0.5px'
                    }}>
                        Welcome to ORB
                    </h1>
                    <p style={{
                        fontSize: 14,
                        color: '#888',
                        margin: '8px 0 0',
                        fontWeight: 400
                    }}>
                        Your portfolio, visualized.
                    </p>
                </div>

                {/* Value Explanation */}
                <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 12,
                    padding: 16,
                    width: '100%',
                    textAlign: 'center'
                }}>
                    <p style={{
                        fontSize: 13,
                        color: '#aaa',
                        margin: 0,
                        lineHeight: 1.6
                    }}>
                        ORB uses your login to securely save settings, track portfolio sentiment, and personalize your experience.
                    </p>
                </div>

                {/* Offline Warning */}
                {isOffline && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: 8,
                        padding: 12,
                        width: '100%',
                        textAlign: 'center'
                    }}>
                        <span style={{ color: '#ef4444', fontSize: 13 }}>
                            📡 No internet connection. Please reconnect to continue.
                        </span>
                    </div>
                )}

                {/* Error Display */}
                {authError && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: 8,
                        padding: 12,
                        width: '100%',
                        textAlign: 'center'
                    }}>
                        <span style={{ color: '#ef4444', fontSize: 13 }}>
                            {authError}
                        </span>
                    </div>
                )}

                {/* Auth Methods */}
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>

                    {/* Wallet Connect Section */}
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: 12,
                        padding: 16
                    }}>
                        <div style={{
                            fontSize: 12,
                            color: '#666',
                            textTransform: 'uppercase',
                            letterSpacing: 1,
                            marginBottom: 12,
                            textAlign: 'center'
                        }}>
                            Connect Wallet
                        </div>
                        <p style={{
                            fontSize: 11,
                            color: '#888',
                            textAlign: 'center',
                            margin: '0 0 12px'
                        }}>
                            Securely connect to view your portfolio and sentiment.
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <button
                                onClick={() => handleWalletConnect('metamask')}
                                disabled={isAuthLoading || isOffline}
                                style={{
                                    padding: '14px 12px',
                                    borderRadius: 10,
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    background: 'linear-gradient(135deg, #1a1a1a, #252525)',
                                    color: '#fff',
                                    fontSize: 13,
                                    fontWeight: 500,
                                    cursor: isAuthLoading || isOffline ? 'not-allowed' : 'pointer',
                                    opacity: isAuthLoading || isOffline ? 0.5 : 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6,
                                    transition: 'all 0.2s'
                                }}
                            >
                                🦊 MetaMask
                            </button>
                            <button
                                onClick={() => handleWalletConnect('phantom')}
                                disabled={isAuthLoading || isOffline}
                                style={{
                                    padding: '14px 12px',
                                    borderRadius: 10,
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    background: 'linear-gradient(135deg, #1a1a1a, #252525)',
                                    color: '#fff',
                                    fontSize: 13,
                                    fontWeight: 500,
                                    cursor: isAuthLoading || isOffline ? 'not-allowed' : 'pointer',
                                    opacity: isAuthLoading || isOffline ? 0.5 : 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6,
                                    transition: 'all 0.2s'
                                }}
                            >
                                👻 Phantom
                            </button>
                            <button
                                onClick={() => handleWalletConnect('coinbase')}
                                disabled={isAuthLoading || isOffline}
                                style={{
                                    padding: '14px 12px',
                                    borderRadius: 10,
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    background: 'linear-gradient(135deg, #1a1a1a, #252525)',
                                    color: '#fff',
                                    fontSize: 13,
                                    fontWeight: 500,
                                    cursor: isAuthLoading || isOffline ? 'not-allowed' : 'pointer',
                                    opacity: isAuthLoading || isOffline ? 0.5 : 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6,
                                    transition: 'all 0.2s'
                                }}
                            >
                                🔵 Coinbase
                            </button>
                            <button
                                onClick={() => handleWalletConnect('rabby')}
                                disabled={isAuthLoading || isOffline}
                                style={{
                                    padding: '14px 12px',
                                    borderRadius: 10,
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    background: 'linear-gradient(135deg, #1a1a1a, #252525)',
                                    color: '#fff',
                                    fontSize: 13,
                                    fontWeight: 500,
                                    cursor: isAuthLoading || isOffline ? 'not-allowed' : 'pointer',
                                    opacity: isAuthLoading || isOffline ? 0.5 : 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6,
                                    transition: 'all 0.2s'
                                }}
                            >
                                🐰 Rabby
                            </button>
                            <button
                                onClick={() => handleWalletConnect('core')}
                                disabled={isAuthLoading || isOffline}
                                style={{
                                    padding: '14px 12px',
                                    borderRadius: 10,
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    background: 'linear-gradient(135deg, #1a1a1a, #252525)',
                                    color: '#fff',
                                    fontSize: 13,
                                    fontWeight: 500,
                                    cursor: isAuthLoading || isOffline ? 'not-allowed' : 'pointer',
                                    opacity: isAuthLoading || isOffline ? 0.5 : 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6,
                                    transition: 'all 0.2s',
                                    gridColumn: 'span 2'
                                }}
                            >
                                ⛰️ Core (AVAX)
                            </button>
                        </div>
                    </div>

                    {/* Divider */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        margin: '4px 0'
                    }}>
                        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
                        <span style={{ fontSize: 11, color: '#555' }}>or</span>
                        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
                    </div>

                    {/* Email Sign In */}
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: 12,
                        padding: 16
                    }}>
                        <div style={{
                            fontSize: 12,
                            color: '#666',
                            textTransform: 'uppercase',
                            letterSpacing: 1,
                            marginBottom: 12,
                            textAlign: 'center'
                        }}>
                            Sign in with Email
                        </div>

                        {!showEmailInput ? (
                            <>
                                <p style={{
                                    fontSize: 11,
                                    color: '#888',
                                    textAlign: 'center',
                                    margin: '0 0 12px'
                                }}>
                                    We'll send you a secure sign-in link. No passwords required.
                                </p>
                                <button
                                    onClick={() => setShowEmailInput(true)}
                                    disabled={isAuthLoading || isOffline}
                                    style={{
                                        width: '100%',
                                        padding: '14px 16px',
                                        borderRadius: 10,
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        background: 'linear-gradient(135deg, #1a1a1a, #252525)',
                                        color: '#fff',
                                        fontSize: 13,
                                        fontWeight: 500,
                                        cursor: isAuthLoading || isOffline ? 'not-allowed' : 'pointer',
                                        opacity: isAuthLoading || isOffline ? 0.5 : 1,
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    ✉️ Continue with Email
                                </button>
                            </>
                        ) : emailSent ? (
                            <div style={{ textAlign: 'center', padding: '10px 0' }}>
                                <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                                <p style={{ fontSize: 13, color: '#4ade80', margin: 0 }}>
                                    Sign-in link sent! Check your inbox.
                                </p>
                                <p style={{ fontSize: 11, color: '#888', margin: '8px 0 0' }}>
                                    Redirecting...
                                </p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleEmailSignIn()}
                                    disabled={isAuthLoading}
                                    style={{
                                        width: '100%',
                                        padding: '12px 14px',
                                        borderRadius: 8,
                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                        background: '#1a1a1a',
                                        color: '#fff',
                                        fontSize: 14,
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button
                                        onClick={() => { setShowEmailInput(false); setEmail('') }}
                                        style={{
                                            padding: '12px 16px',
                                            borderRadius: 8,
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            background: 'transparent',
                                            color: '#888',
                                            fontSize: 13,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleEmailSignIn}
                                        disabled={isAuthLoading || !email}
                                        style={{
                                            flex: 1,
                                            padding: '12px 16px',
                                            borderRadius: 8,
                                            border: 'none',
                                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                            color: '#fff',
                                            fontSize: 13,
                                            fontWeight: 600,
                                            cursor: isAuthLoading || !email ? 'not-allowed' : 'pointer',
                                            opacity: isAuthLoading || !email ? 0.5 : 1
                                        }}
                                    >
                                        {isAuthLoading ? 'Sending...' : 'Send Link'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Privacy Reassurance */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '12px 16px',
                    background: 'rgba(34, 197, 94, 0.08)',
                    border: '1px solid rgba(34, 197, 94, 0.2)',
                    borderRadius: 8,
                    width: '100%'
                }}>
                    <span style={{ fontSize: 16 }}>🔒</span>
                    <span style={{ fontSize: 12, color: '#4ade80' }}>
                        ORB never has access to your funds. Connections are read-only.
                    </span>
                </div>

                {/* Guest Mode */}
                <button
                    onClick={handleGuestMode}
                    style={{
                        padding: '12px 24px',
                        borderRadius: 8,
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        background: 'transparent',
                        color: '#666',
                        fontSize: 13,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    Continue as Guest
                </button>
                <p style={{
                    fontSize: 11,
                    color: '#555',
                    margin: '-12px 0 0',
                    textAlign: 'center'
                }}>
                    Limited features, no saved settings
                </p>

                {/* Loading State */}
                {isAuthLoading && (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.8)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 100
                    }}>
                        <div style={{
                            width: 40,
                            height: 40,
                            border: '3px solid rgba(255,255,255,0.1)',
                            borderTopColor: '#6366f1',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }} />
                        <p style={{ color: '#888', fontSize: 14, marginTop: 16 }}>
                            Securing connection...
                        </p>
                    </div>
                )}

                {/* Footer */}
                <div style={{
                    marginTop: 24,
                    fontSize: 11,
                    color: '#444',
                    display: 'flex',
                    gap: 16
                }}>
                    <a
                        href="#"
                        style={{ color: '#555', textDecoration: 'none' }}
                        onClick={(e) => e.preventDefault()}
                    >
                        Privacy
                    </a>
                    <span>·</span>
                    <a
                        href="#"
                        style={{ color: '#555', textDecoration: 'none' }}
                        onClick={(e) => e.preventDefault()}
                    >
                        Terms
                    </a>
                </div>
            </div>

            {/* Animations */}
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
                    50% { opacity: 0.5; transform: translate(-50%, -50%) scale(1.1); }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    )
}
