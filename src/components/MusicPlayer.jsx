import { useState, useEffect, useRef, Component } from 'react'
import { useStore } from '../store'

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
    const [volume, setVolume] = useState(60)
    const [streamUrl, setStreamUrl] = useState('')

    const audioRef = useRef(null)
    const { setMusicPlaying, setMusicCurrentTrack, setMusicAudioRef } = useStore()

    // Sync audio ref
    useEffect(() => {
        if (audioRef.current) setMusicAudioRef(audioRef.current)
    }, [])

    useEffect(() => setMusicPlaying(isPlaying), [isPlaying])
    useEffect(() => setMusicCurrentTrack(currentTrack), [currentTrack])

    /* =======================
       🎧 INTERNET RADIO (PLAYS INSIDE ORB)
       ======================= */

    const radioStations = [
        { name: 'Lo-Fi Hip Hop', url: 'https://streams.ilovemusic.de/iloveradio17.mp3', genre: 'Chill' },
        { name: 'Chillout', url: 'https://streams.ilovemusic.de/iloveradio7.mp3', genre: 'Chill' },
        { name: 'Dance', url: 'https://streams.ilovemusic.de/iloveradio2.mp3', genre: 'Dance' },
        { name: 'Hip Hop', url: 'https://streams.ilovemusic.de/iloveradio3.mp3', genre: 'Hip Hop' },
    ]

    const playStation = (station) => {
        const audio = audioRef.current
        if (!audio) return

        // iOS unlock
        localStorage.setItem('orbSoundEnabled', 'true')

        audio.src = station.url
        audio.muted = false
        audio.volume = volume / 100

        audio.play()
            .then(() => {
                setIsPlaying(true)
                setStreamUrl(station.url)
                setCurrentTrack({
                    name: station.name,
                    artist: 'Internet Radio',
                    album: station.genre,
                })
            })
            .catch(err => console.warn('iOS blocked audio:', err))
    }

    const togglePlayPause = () => {
        const audio = audioRef.current
        if (!audio) return

        localStorage.setItem('orbSoundEnabled', 'true')

        if (audio.paused) {
            audio.play()
                .then(() => setIsPlaying(true))
                .catch(err => console.warn('iOS blocked:', err))
        } else {
            audio.pause()
            setIsPlaying(false)
        }
    }

    /* =======================
       🔗 STREAMING SERVICES (EXTERNAL ONLY)
       ======================= */

    const streamingServices = [
        { name: 'Spotify', url: 'https://open.spotify.com', icon: '🎵' },
        { name: 'Apple Music', url: 'https://music.apple.com', icon: '🍎' },
        { name: 'YouTube Music', url: 'https://music.youtube.com', icon: '▶️' },
        { name: 'Pandora', url: 'https://www.pandora.com', icon: '📻' },
        { name: 'SoundCloud', url: 'https://soundcloud.com', icon: '☁️' },
    ]

    const openService = (service) => {
        window.open(service.url, '_blank', 'noopener,noreferrer')
    }

    return (
    <>
            {/* 🔑 AUDIO ELEMENT (RADIO ONLY) */}
            <AudioErrorBoundary>
                <audio ref={audioRef} preload="none" playsInline />
            </AudioErrorBoundary>

            {/* Floating Button */}
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
                        width: 340,
                        background: '#111',
                        padding: 16,
                        borderRadius: 14,
                        color: '#fff',
                        zIndex: 999
                    }}
                >
                    {/* Now Playing */}
                    {currentTrack && (
                        <div style={{ marginBottom: 12 }}>
                            <strong>{currentTrack.name}</strong>
                            <div style={{ fontSize: 12, color: '#aaa' }}>
                                {currentTrack.artist}
                            </div>
                        </div>
                    )}

                    {/* Play / Pause */}
                    <button
                        onClick={togglePlayPause}
                        style={{
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            border: 'none',
                            background: '#6366f1',
                            color: '#fff',
                            fontSize: 18,
                            marginBottom: 16
                        }}
                    >
                        {isPlaying ? '⏸' : '▶️'}
                    </button>

                    {/* 🎧 INTERNET RADIO */}
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 12, color: '#aaa', marginBottom: 8 }}>
                            🎧 Play inside ORB
                        </div>
                        {radioStations.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => playStation(s)}
                                style={{
                                    width: '100%',
                                    padding: 8,
                                    marginBottom: 6,
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

                    {/* 🔗 STREAMING APPS */}
                    <div>
                        <div style={{ fontSize: 12, color: '#aaa', marginBottom: 8 }}>
                            🔗 Open streaming apps
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                            {streamingServices.map((s, i) => (
                                <button
                                    key={i}
                                    onClick={() => openService(s)}
                                    style={{
                                        padding: 10,
                                        background: '#1f1f1f',
                                        border: 'none',
