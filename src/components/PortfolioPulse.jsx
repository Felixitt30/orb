import { useEffect, useState } from 'react'
import { useStore } from '../store'

export default function PortfolioPulse() {
    const { percentChange24h, totalValue } = useStore()
    const [pulseColor, setPulseColor] = useState('#888')
    const [pulseIntensity, setPulseIntensity] = useState(0.5)

    useEffect(() => {
        // Determine color based on portfolio change
        if (percentChange24h > 0) {
            setPulseColor('#22c55e') // Green for gains
            setPulseIntensity(Math.min(percentChange24h / 10, 1)) // Max at 10%
        } else if (percentChange24h < 0) {
            setPulseColor('#ef4444') // Red for losses
            setPulseIntensity(Math.min(Math.abs(percentChange24h) / 10, 1))
        } else {
            setPulseColor('#888') // Gray for neutral
            setPulseIntensity(0.3)
        }
    }, [percentChange24h])

    return (
        <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 1
        }}>
            {/* Outer pulse ring */}
            <div style={{
                width: 320,
                height: 320,
                borderRadius: '50%',
                border: `3px solid ${pulseColor}`,
                opacity: pulseIntensity * 0.6,
                animation: 'pulse-ring 3s ease-in-out infinite',
                boxShadow: `0 0 30px ${pulseColor}`
            }} />

            {/* Middle pulse ring */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 340,
                height: 340,
                borderRadius: '50%',
                border: `2px solid ${pulseColor}`,
                opacity: pulseIntensity * 0.4,
                animation: 'pulse-ring 3s ease-in-out infinite 0.5s',
                boxShadow: `0 0 20px ${pulseColor}`
            }} />

            {/* Inner pulse ring */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 360,
                height: 360,
                borderRadius: '50%',
                border: `1px solid ${pulseColor}`,
                opacity: pulseIntensity * 0.2,
                animation: 'pulse-ring 3s ease-in-out infinite 1s',
                boxShadow: `0 0 10px ${pulseColor}`
            }} />

            {/* Performance indicator */}
            {totalValue > 0 && (
                <div style={{
                    position: 'absolute',
                    top: -50,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: `${pulseColor}22`,
                    border: `1px solid ${pulseColor}`,
                    borderRadius: 20,
                    padding: '6px 16px',
                    fontSize: 12,
                    fontWeight: 600,
                    color: pulseColor,
                    whiteSpace: 'nowrap',
                    backdropFilter: 'blur(10px)',
                    boxShadow: `0 0 20px ${pulseColor}33`
                }}>
                    {percentChange24h > 0 ? '↗' : percentChange24h < 0 ? '↘' : '→'}
                    {' '}
                    {percentChange24h > 0 ? '+' : ''}{percentChange24h.toFixed(2)}%
                </div>
            )}

            <style>{`
                @keyframes pulse-ring {
                    0%, 100% {
                        transform: translate(-50%, -50%) scale(1);
                        opacity: ${pulseIntensity * 0.6};
                    }
                    50% {
                        transform: translate(-50%, -50%) scale(1.05);
                        opacity: ${pulseIntensity * 0.3};
                    }
                }
            `}</style>
        </div>
    )
}
