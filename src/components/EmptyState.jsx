import { useStore } from '../store'

export default function EmptyState() {
    const { fetchData, logout } = useStore()

    const handleRefresh = async () => {
        await fetchData()
    }

    const handleReconnect = () => {
        logout()
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
            zIndex: 9997
        }}>
            {/* Neutral Orb Background */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 200,
                height: 200,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(100, 100, 100, 0.15) 0%, transparent 70%)',
                filter: 'blur(50px)',
                pointerEvents: 'none'
            }} />

            <div style={{
                position: 'relative',
                zIndex: 1,
                textAlign: 'center',
                maxWidth: 360
            }}>
                {/* Empty State Icon */}
                <div style={{
                    fontSize: 56,
                    marginBottom: 20,
                    opacity: 0.5
                }}>
                    📂
                </div>

                <h2 style={{
                    fontSize: 22,
                    fontWeight: 600,
                    margin: '0 0 12px',
                    color: '#fff'
                }}>
                    No portfolio data found yet
                </h2>

                <p style={{
                    fontSize: 14,
                    color: '#888',
                    margin: '0 0 32px',
                    lineHeight: 1.6
                }}>
                    Once assets are detected, your orb will reflect market sentiment.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <button
                        onClick={handleRefresh}
                        style={{
                            padding: '14px 32px',
                            borderRadius: 10,
                            border: 'none',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            color: '#fff',
                            fontSize: 15,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8
                        }}
                    >
                        🔄 Refresh
                    </button>

                    <button
                        onClick={handleReconnect}
                        style={{
                            padding: '12px 24px',
                            borderRadius: 8,
                            border: '1px solid rgba(255,255,255,0.2)',
                            background: 'transparent',
                            color: '#888',
                            fontSize: 13,
                            cursor: 'pointer'
                        }}
                    >
                        Connect a different wallet
                    </button>
                </div>
            </div>
        </div>
    )
}
