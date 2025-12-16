import { useState, useEffect, useRef, Component } from 'react'
import { useStore } from '../store'

// Error Boundary
class AudioErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false }
    }
    static getDerivedStateFromError() {
        return { hasError: true }
    }
    componentDidCatch(error) {
        console.log('Audio error:', error.message)
    }
    render() {
        if (this.state.hasError) return null
        return this.props.children
    }
}

export default function MusicPlayer() {
    const [isOpen, setIsOpen] = useState(false)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTrack, setCurrentTrack] = useState(null)
    const [volume, setVolume] = useState(50)
    const [progress, setProgress] = useState(0)
    const [duration, setDuration] = useState(0)
    const [streamUrl, setStreamUrl] = useState('')
    const [selectedService, setSelectedService] = useState(null)

    const audioRef = useRef(null)

    const { setMusicPlaying, setMusicCurrentTrack, setMusicAudioRef } = useStore()

    // Sync refs to store
    useEffect(() => {
        if (audioRef.current) setMusicAudioRef(audioRef.current)
    }, [])

    useEffect(() => setMusicPlaying(isPlaying), [isPlaying])
    useEffect(() => setMusicCurrentTrack(currentTrack), [currentTrack])

    // 🔐 iOS SAFE PLAY / PAUSE (FIXED)
    const handlePlayPause = () => {
        const audio = audioRef.current
        if (!audio) return

        // iOS unlock
        localStorage.setItem('orbSoundEnabled', 'true')
        audio.muted = false
        audio.volume = volume / 100

        if (audio.paused) {
            audio
                .play()
                .then(() => setIsPlaying(true))
                .catch(err => console.warn('iOS blocked playback:', err))
        } else {
            audio.pause()
            setIsPlaying(false)
        }
    }

    // Radio stations
    const radioStations = [
        { name: 'Lo-Fi Hip Hop', url: 'https://streams.ilovemusic.de/iloveradio17.mp3', genre: 'Chill' },
        { name: 'Chillout', url: 'https://streams.ilovemusic.de/iloveradio7.mp3', genre: 'Chill' },
        { name: 'Dance', url: 'https://streams.ilovemusic.de/iloveradio2.mp3', genre: 'Dance' },
        { name: 'Hip Hop', url: 'https://streams.ilovemusic.de/iloveradio3.mp3', genre: 'Hip Hop' },
    ]

    // 🔐 iOS SAFE RADIO PLAY (FIXED)
    const playStation = (station) => {
        const audio = audioRef.current
        if (!audio) return

        localStorage.setItem('orbSoundEnabled', 'true')

        audio.src = station.url
        audio.muted = false
        audio.volume = volume / 100

        audio
            .play()
            .then(() => {
                setIsPlaying(true)
                setStreamUrl(station.url)
                setCurrentTrack({
                    name: station.name,
                    artist: 'Internet Radio',
                    album: station.genre,
                })
                setSelectedService('radio')
            })
            .catch(err => console.warn('iOS radio blocked:', err))
    }

    // Audio events
    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        const timeUpdate = () => {
            setProgress(audio.currentTime)
            setDuration(audio.duration || 0)
        }

        audio.addEventListener('timeupdate', timeUpdate)
        audio.addEventListener('ended', () => setIsPlaying(false))

        return () => {
            audio.removeEventListener('timeupdate', timeUpdate)
        }
    }, [])

    return (
        <>
            {/* 🔑 FIXED AUDIO ELEMENT */}
            <AudioErrorBoundary>
                <audio
                    ref={audioRef}
                    preload="none"
                    playsInline
                />
            </AudioErrorBoundary>

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'fixed',
                    bottom: 80,
                    left: 20,
                    width: 50,
                    height: 50,
                    borderRadius: '50%',
                    background: isPlaying ? '#6366f1' : '#333',
                    color: '#fff',
                    border: 'none',
                    zIndex: 1000
                }}
            >
                🎵
            </button>

            {/* Panel */}
            {isOpen && (
                <div
                    style={{
                        position: 'fixed',
                        bottom: 140,
                        left: 20,
                        width: 320,
                        background: '#111',
                        padding: 16,
                        borderRadius: 12,
                        color: '#fff',
                        zIndex: 999
                    }}
                >
                    {currentTrack && (
                        <div style={{ marginBottom: 12 }}>
                            <strong>{currentTrack.name}</strong>
                            <div style={{ fontSize: 12, color: '#aaa' }}>
                                {currentTrack.artist}
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handlePlayPause}
                        style={{
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            border: 'none',
                            background: '#6366f1',
                            color: '#fff',
                            fontSize: 18
                        }}
                    >
                        {isPlaying ? '⏸' : '▶️'}
                    </button>

                    <div style={{ marginTop: 16 }}>
                        {radioStations.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => playStation(s)}
                                style={{
                                    display: 'block',
                                    width: '100%',
                                    marginBottom: 6,
                                    padding: 8,
                                    background: streamUrl === s.url ? '#6366f1' : '#222',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 6
                                }}
                            >
                                📻 {s.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </>
    )
}
