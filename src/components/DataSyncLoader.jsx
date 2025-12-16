import { useStore } from '../store'

export default function DataSyncLoader({ isWalletConnected = false }) {
    const { dataSyncError, setDataSyncError, fetchData } = useStore()

    const handleRetry = async () => {
        setDataSyncError(null)
        try {
            await fetchData()
        } catch (error) {
            setDataSyncError('Unable to load portfolio data. Please try again.')
        }
    }

    // Error state
    if (dataSyncError) {
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
                zIndex: 9998
            }}>
                {/* Dimmed Orb Background */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 200,
                    height: 200,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(239, 68, 68, 0.15) 0%, transparent 70%)',
                    filter: 'blur(40px)',
                    pointerEvents: 'none'
                }} />

                <div style={{
                    position: 'relative',
                    zIndex: 1,
                    textAlign: 'center',
                    maxWidth: 320
                }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
                    <h2 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 12px', color: '#ef4444' }}>
                        Unable to load portfolio data
                    </h2>
                    <p style={{ fontSize: 14, color: '#888', margin: '0 0 24px' }}>
                        Please try again.
                    </p>
                    <button
                        onClick={handleRetry}
                        style={{
                            padding: '14px 32px',
                            borderRadius: 10,
                            border: 'none',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            color: '#fff',
                            fontSize: 15,
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        Retry
                    </button>
                </div>
            </div>
        )
    }

    // Loading state
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
            zIndex: 9998
        }}>
            {/* Neutral/Dimmed Orb Background */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 250,
                height: 250,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(100, 100, 100, 0.2) 0%, transparent 70%)',
                filter: 'blur(50px)',
                animation: 'syncPulse 2s ease-in-out infinite',
                pointerEvents: 'none'
            }} />

            <div style={{
                position: 'relative',
                zIndex: 1,
                textAlign: 'center'
            }}>
                {/* Animated Orb Icon */}
                <div style={{
                    fontSize: 64,
                    marginBottom: 24,
                    opacity: 0.6,
                    animation: 'syncBounce 1.5s ease-in-out infinite'
                }}>
                    🔮
                </div>

                {/* Spinner */}
                <div style={{
                    width: 32,
                    height: 32,
                    border: '3px solid rgba(255,255,255,0.1)',
                    borderTopColor: '#6366f1',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 20px'
                }} />

                <h2 style={{ fontSize: 18, fontWeight: 500, margin: '0 0 8px', color: '#fff' }}>
                    {isWalletConnected ? 'Reading portfolio data securely…' : 'Syncing your portfolio…'}
                </h2>
                <p style={{ fontSize: 13, color: '#666', margin: 0 }}>
                    This usually takes a few seconds.
                </p>
            </div>

            {/* Animations */}
            <style>{`
                @keyframes syncPulse {
                    0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
                    50% { opacity: 0.5; transform: translate(-50%, -50%) scale(1.05); }
                }
                @keyframes syncBounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    )
}
