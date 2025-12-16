import { useEffect, useState } from 'react'
import { useStore } from '../store'

export default function RocketBurst() {
    const { percentChange24h, isATH } = useStore()
    const [rockets, setRockets] = useState([])
    const [showBurst, setShowBurst] = useState(false)

    // Trigger rocket burst on big gains or ATH
    useEffect(() => {
        // Trigger on ATH or big gains (>5%)
        if (isATH || percentChange24h > 5) {
            triggerBurst()
        }
    }, [isATH, percentChange24h])

    const triggerBurst = () => {
        setShowBurst(true)

        // Create 8 rockets in a circle around the orb
        const newRockets = []
        const rocketCount = 8

        for (let i = 0; i < rocketCount; i++) {
            const angle = (i / rocketCount) * Math.PI * 2
            newRockets.push({
                id: Date.now() + i,
                angle,
                delay: i * 100, // Stagger the launches
            })
        }

        setRockets(newRockets)

        // Clear after animation completes
        setTimeout(() => {
            setShowBurst(false)
            setRockets([])
        }, 3000)
    }

    if (!showBurst) return null

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            {rockets.map((rocket) => (
                <Rocket key={rocket.id} angle={rocket.angle} delay={rocket.delay} />
            ))}
        </div>
    )
}

function Rocket({ angle, delay }) {
    const [isLaunched, setIsLaunched] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => setIsLaunched(true), delay)
        return () => clearTimeout(timer)
    }, [delay])

    // Calculate end position (far away from center)
    const distance = 800 // pixels to travel
    const endX = Math.cos(angle) * distance
    const endY = Math.sin(angle) * distance

    // Rotation to point in direction of travel
    const rotation = (angle * 180 / Math.PI) + 90

    return (
        <div
            style={{
                position: 'absolute',
                fontSize: 32,
                transform: isLaunched
                    ? `translate(${endX}px, ${endY}px) rotate(${rotation}deg) scale(0.5)`
                    : `translate(0, 0) rotate(${rotation}deg) scale(1)`,
                opacity: isLaunched ? 0 : 1,
                transition: 'all 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
                filter: 'drop-shadow(0 0 10px rgba(255, 100, 0, 0.8))',
            }}
        >
            🚀
        </div>
    )
}
