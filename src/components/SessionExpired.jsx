import { useStore } from '../store'

export default function SessionExpired() {
    const { logout } = useStore()

    const handleSignIn = () => {
        logout() // This will redirect to login page
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
            zIndex: 9999
        }}>
            {/* Dimmed Background */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 200,
                height: 200,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(251, 191, 36, 0.15) 0%, transparent 70%)',
                filter: 'blur(40px)',
                pointerEvents: 'none'
            }} />

            <div style={{
                position: 'relative',
                zIndex: 1,
                textAlign: 'center',
                maxWidth: 320
            }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>⏰</div>
                <h2 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 12px', color: '#fbbf24' }}>
                    Session expired
                </h2>
                <p style={{ fontSize: 14, color: '#888', margin: '0 0 28px', lineHeight: 1.6 }}>
                    Please sign in again to continue.
                </p>
                <button
                    onClick={handleSignIn}
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
                    Sign In Again
                </button>
            </div>
        </div>
    )
}
