import { useState } from 'react'
import { useStore } from '../store'

export default function Onboarding() {
    const [currentScreen, setCurrentScreen] = useState(0)
    const { completeOnboarding } = useStore()

    const screens = [
        {
            emoji: '🔮',
            title: 'Meet the Orb',
            description: 'The orb visualizes your portfolio sentiment at a glance.',
            color: '#8b5cf6'
        },
        {
            emoji: '📊',
            title: 'Automatic by Default',
            description: 'Orb colors reflect portfolio sentiment in real time. You can switch to manual colors anytime in Settings.',
            color: '#22c55e'
        },
        {
            emoji: '⚙️',
            title: "You're in Control",
            description: 'Customize visuals, alerts, and privacy settings whenever you want.',
            color: '#6366f1'
        }
    ]

    const handleNext = () => {
        if (currentScreen < screens.length - 1) {
            setCurrentScreen(currentScreen + 1)
        } else {
            completeOnboarding()
        }
    }

    const handleSkip = () => {
        completeOnboarding()
    }

    const screen = screens[currentScreen]

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
            {/* Background Orb Glow */}
            <div style={{
                position: 'absolute',
                top: '40%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 250,
                height: 250,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${screen.color}33 0%, transparent 70%)`,
                filter: 'blur(50px)',
                animation: 'pulse 3s ease-in-out infinite',
                pointerEvents: 'none',
                transition: 'background 0.5s ease'
            }} />

            {/* Skip Button */}
            <button
                onClick={handleSkip}
                style={{
                    position: 'absolute',
                    top: 20,
                    right: 20,
                    padding: '8px 16px',
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 6,
                    color: '#666',
                    fontSize: 12,
                    cursor: 'pointer'
                }}
            >
                Skip
            </button>

            {/* Content */}
            <div style={{
                position: 'relative',
                zIndex: 1,
                maxWidth: 400,
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 20,
                textAlign: 'center'
            }}>
                {/* Emoji Icon */}
                <div style={{
                    fontSize: 72,
                    marginBottom: 8,
                    filter: `drop-shadow(0 0 30px ${screen.color})`,
                    animation: 'float 3s ease-in-out infinite',
                    transition: 'filter 0.5s ease'
                }}>
                    {screen.emoji}
                </div>

                {/* Title */}
                <h1 style={{
                    fontSize: 28,
                    fontWeight: 700,
                    margin: 0,
                    letterSpacing: '-0.5px',
                    color: '#fff'
                }}>
                    {screen.title}
                </h1>

                {/* Description */}
                <p style={{
                    fontSize: 15,
                    color: '#aaa',
                    margin: 0,
                    lineHeight: 1.7,
                    maxWidth: 320
                }}>
                    {screen.description}
                </p>

                {/* Progress Dots */}
                <div style={{
                    display: 'flex',
                    gap: 8,
                    marginTop: 20
                }}>
                    {screens.map((_, index) => (
                        <div
                            key={index}
                            style={{
                                width: index === currentScreen ? 24 : 8,
                                height: 8,
                                borderRadius: 4,
                                background: index === currentScreen ? screen.color : 'rgba(255,255,255,0.2)',
                                transition: 'all 0.3s ease'
                            }}
                        />
                    ))}
                </div>

                {/* Action Button */}
                <button
                    onClick={handleNext}
                    style={{
                        marginTop: 32,
                        padding: '16px 48px',
                        borderRadius: 12,
                        border: 'none',
                        background: `linear-gradient(135deg, ${screen.color}, ${screen.color}cc)`,
                        color: '#fff',
                        fontSize: 16,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: `0 8px 32px ${screen.color}44`
                    }}
                >
                    {currentScreen < screens.length - 1 ? 'Continue' : 'Get Started'}
                </button>
            </div>

            {/* Animations */}
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 0.4; transform: translate(-50%, -50%) scale(1); }
                    50% { opacity: 0.6; transform: translate(-50%, -50%) scale(1.1); }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
            `}</style>
        </div>
    )
}
