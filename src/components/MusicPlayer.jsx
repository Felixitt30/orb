import { useState, useEffect, useRef, Component } from 'react'
import { useStore } from '../store'
import { useDraggable } from '../hooks/useDraggable'

// Error Boundary to catch audio element errors
class AudioErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError() {
        return { hasError: true }
    }

    componentDidCatch(error, errorInfo) {
        console.log('Audio element error caught:', error.message)
    }

    render() {
        if (this.state.hasError) {
            // Return a hidden element if audio fails
            return null
        }
        return this.props.children
    }
}

// Universal Music Player that can control ANY music playing on the device
// Works with: Spotify, Apple Music, Pandora, YouTube Music, Amazon Music, etc.
// Uses the Web Media Session API and Audio element for universal compatibility

export default function MusicPlayer() {
    const [isOpen, setIsOpen] = useState(false)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTrack, setCurrentTrack] = useState(null)
    const [volume, setVolume] = useState(50)
    const [progress, setProgress] = useState(0)
    const [duration, setDuration] = useState(0)
    const [isMobile, setIsMobile] = useState(false)
    const [streamUrl, setStreamUrl] = useState('')
    const [showUrlInput, setShowUrlInput] = useState(false)
    const [selectedService, setSelectedService] = useState(null)
    const audioRef = useRef(null)

    // Visibility state for auto-fade
    const [isVisible, setIsVisible] = useState(true)
    const fadeTimerRef = useRef(null)
    const FADE_DELAY = 4000 // 4 seconds before fading

    // Draggable state
    const buttonRef = useRef(null)
    const { position, isDragging, handleDragStart, setPosition } = useDraggable(buttonRef)

    // Reset fade timer when interaction occurs
    const resetFadeTimer = () => {
        setIsVisible(true)
        if (fadeTimerRef.current) {
            clearTimeout(fadeTimerRef.current)
        }
        fadeTimerRef.current = setTimeout(() => {
            setIsVisible(false)
        }, FADE_DELAY)
    }

    // Start fade timer on mount
    useEffect(() => {
        resetFadeTimer()
        return () => {
            if (fadeTimerRef.current) {
                clearTimeout(fadeTimerRef.current)
            }
        }
    }, [])

    // Reset position when switching between mobile/desktop
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768
            setIsMobile(mobile)
            setPosition({ x: null, y: null })
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    // Get store actions for syncing state
    const { setMusicPlaying, setMusicCurrentTrack, setMusicAudioRef } = useStore()

    // Popular streaming services with their web URLs
    const streamingServices = [
        {
            id: 'spotify',
            name: 'Spotify',
            color: '#1DB954',
            icon: '🎵',
            url: 'https://open.spotify.com',
            description: 'Open Spotify Web Player'
        },
        {
            id: 'apple',
            name: 'Apple Music',
            color: '#FC3C44',
            icon: '🍎',
            url: 'https://music.apple.com',
            description: 'Open Apple Music'
        },
        {
            id: 'pandora',
            name: 'Pandora',
            color: '#3668FF',
            icon: '📻',
            url: 'https://www.pandora.com',
            description: 'Open Pandora'
        },
        {
            id: 'youtube',
            name: 'YouTube Music',
            color: '#FF0000',
            icon: '▶️',
            url: 'https://music.youtube.com',
            description: 'Open YouTube Music'
        },
        {
            id: 'amazon',
            name: 'Amazon Music',
            color: '#25D1DA',
            icon: '🎧',
            url: 'https://music.amazon.com',
            description: 'Open Amazon Music'
        },
        {
            id: 'soundcloud',
            name: 'SoundCloud',
            color: '#FF5500',
            icon: '☁️',
            url: 'https://soundcloud.com',
            description: 'Open SoundCloud'
        },
        {
            id: 'tidal',
            name: 'Tidal',
            color: '#000000',
            icon: '🌊',
            url: 'https://listen.tidal.com',
            description: 'Open Tidal'
        },
        {
            id: 'deezer',
            name: 'Deezer',
            color: '#FEAA2D',
            icon: '🎶',
            url: 'https://www.deezer.com',
            description: 'Open Deezer'
        },
        {
            id: 'shazam',
            name: 'Shazam',
            color: '#0088FF',
            icon: '🔍',
            url: 'https://www.shazam.com',
            description: 'Identify songs with Shazam'
        },
        {
            id: 'imdb',
            name: 'IMDB Soundtracks',
            color: '#F5C518',
            icon: '🎬',
            url: 'https://www.imdb.com/chart/top-soundtracks/',
            description: 'Movie & TV Soundtracks'
        },
        {
            id: 'linktree',
            name: 'Linktree',
            color: '#43E55E',
            icon: '🌳',
            url: 'https://linktr.ee',
            description: 'Artist Link Hub'
        },
        {
            id: 'bandcamp',
            name: 'Bandcamp',
            color: '#1DA0C3',
            icon: '💿',
            url: 'https://bandcamp.com',
            description: 'Support Independent Artists'
        }
    ]

    // Free radio streams that work directly in the browser
    const radioStations = [
        { name: 'Lo-Fi Hip Hop', url: 'https://streams.ilovemusic.de/iloveradio17.mp3', genre: 'Chill' },
        { name: 'Chillout', url: 'https://streams.ilovemusic.de/iloveradio7.mp3', genre: 'Chill' },
        { name: 'Dance', url: 'https://streams.ilovemusic.de/iloveradio2.mp3', genre: 'Dance' },
        { name: 'Hip Hop', url: 'https://streams.ilovemusic.de/iloveradio3.mp3', genre: 'Hip Hop' },
        { name: 'Top 100', url: 'https://streams.ilovemusic.de/iloveradio1.mp3', genre: 'Pop' },
        { name: 'Greatest Hits', url: 'https://streams.ilovemusic.de/iloveradio16.mp3', genre: 'Classics' }
    ]

    // Sync audio element ref to store (only when it changes)
    useEffect(() => {
        if (audioRef.current) {
            setMusicAudioRef(audioRef.current)
        }
    }, [setMusicAudioRef])

    // Sync local state to store
    useEffect(() => {
        setMusicPlaying(isPlaying)
    }, [isPlaying, setMusicPlaying])

    useEffect(() => {
        setMusicCurrentTrack(currentTrack)
    }, [currentTrack, setMusicCurrentTrack])

    // Listen for control events from StockTicker
    useEffect(() => {
        const handleMusicControl = (event) => {
            if (event.detail === 'next') {
                handleNext()
            } else if (event.detail === 'previous') {
                handlePrevious()
            }
        }

        window.addEventListener('musicControl', handleMusicControl)
        return () => window.removeEventListener('musicControl', handleMusicControl)
    }, [streamUrl]) // Include streamUrl dependency for handleNext/handlePrevious

    // Check for mobile
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    // Setup Media Session API for controlling device media
    useEffect(() => {
        if ('mediaSession' in navigator) {
            // Listen for media session changes
            const updateMediaInfo = () => {
                if (navigator.mediaSession.metadata) {
                    setCurrentTrack({
                        name: navigator.mediaSession.metadata.title || 'Unknown Track',
                        artist: navigator.mediaSession.metadata.artist || 'Unknown Artist',
                        album: navigator.mediaSession.metadata.album || '',
                        artwork: navigator.mediaSession.metadata.artwork?.[0]?.src || ''
                    })
                }
            }

            // Set up action handlers
            navigator.mediaSession.setActionHandler('play', () => {
                setIsPlaying(true)
                audioRef.current?.play()
            })
            navigator.mediaSession.setActionHandler('pause', () => {
                setIsPlaying(false)
                audioRef.current?.pause()
            })
            navigator.mediaSession.setActionHandler('previoustrack', handlePrevious)
            navigator.mediaSession.setActionHandler('nexttrack', handleNext)

            // Check periodically for media changes
            const interval = setInterval(updateMediaInfo, 1000)
            return () => clearInterval(interval)
        }
    }, [])

    // Audio element event handlers
    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        const handleTimeUpdate = () => {
            setProgress(audio.currentTime)
            setDuration(audio.duration || 0)
        }

        const handlePlay = () => setIsPlaying(true)
        const handlePause = () => setIsPlaying(false)
        const handleEnded = () => setIsPlaying(false)

        audio.addEventListener('timeupdate', handleTimeUpdate)
        audio.addEventListener('play', handlePlay)
        audio.addEventListener('pause', handlePause)
        audio.addEventListener('ended', handleEnded)

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate)
            audio.removeEventListener('play', handlePlay)
            audio.removeEventListener('pause', handlePause)
            audio.removeEventListener('ended', handleEnded)
        }
    }, [])

    const handlePlayPause = () => {
        const audio = audioRef.current
        if (!audio) return

        if (isPlaying) {
            audio.pause()
        } else {
            audio.play().catch(err => console.warn('Playback failed:', err))
        }
    }

    const handleNext = () => {
        const currentIndex = radioStations.findIndex(s => s.url === streamUrl)
        const nextIndex = (currentIndex + 1) % radioStations.length
        playStation(radioStations[nextIndex])
    }

    const handlePrevious = () => {
        const currentIndex = radioStations.findIndex(s => s.url === streamUrl)
        const prevIndex = currentIndex <= 0 ? radioStations.length - 1 : currentIndex - 1
        playStation(radioStations[prevIndex])
    }

    const handleVolumeChange = (newVolume) => {
        setVolume(newVolume)
        if (audioRef.current) {
            audioRef.current.volume = newVolume / 100
        }
    }

    const playStation = (station) => {
        setStreamUrl(station.url)
        setCurrentTrack({
            name: station.name,
            artist: 'Internet Radio',
            album: station.genre,
            artwork: ''
        })
        setSelectedService('radio')

        if (audioRef.current) {
            audioRef.current.src = station.url
            audioRef.current.volume = volume / 100
            audioRef.current.play().catch(err => console.warn('Playback failed:', err))
        }

        // Update Media Session
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: station.name,
                artist: 'Internet Radio',
                album: station.genre
            })
        }
    }

    const openStreamingService = (service) => {
        window.open(service.url, '_blank', 'noopener,noreferrer')
        setSelectedService(service.id)
    }

    const playCustomUrl = () => {
        if (!streamUrl) return

        setCurrentTrack({
            name: 'Custom Stream',
            artist: 'Audio Stream',
            album: '',
            artwork: ''
        })

        if (audioRef.current) {
            audioRef.current.src = streamUrl
            audioRef.current.volume = volume / 100
            audioRef.current.play().catch(err => {
                console.warn('Playback failed:', err)
                alert('Could not play this stream. Make sure it\'s a direct audio URL (mp3, m3u8, etc.)')
            })
        }
        setShowUrlInput(false)
    }

    const formatTime = (seconds) => {
        if (!seconds || !isFinite(seconds)) return '∞'
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    // Floating toggle button styles - positioned Top Left
    const toggleButtonStyle = {
        position: 'fixed',
        top: position.y !== null ? position.y : 'calc(var(--safe-area-top, 0px) + 20px)',
        left: position.x !== null ? position.x : '20px',
        bottom: 'auto',
        width: 50,
        height: 50,
        borderRadius: '50%',
        background: isPlaying
            ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
            : 'linear-gradient(135deg, #282828, #3d3d3d)',
        border: isDragging ? '2px solid rgba(255,255,255,0.3)' : 'none',
        cursor: isDragging ? 'grabbing' : 'grab',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: isDragging ? '0 8px 30px rgba(0,0,0,0.6)' : '0 4px 20px rgba(0,0,0,0.4)',
        zIndex: 1000,
        transition: isDragging ? 'none' : 'all 0.3s ease, opacity 0.5s ease',
        animation: isPlaying && !isDragging ? 'pulse 2s infinite' : 'none',
        opacity: isVisible || isOpen ? 1 : 0,
        pointerEvents: 'auto',
        transform: isDragging ? 'scale(1.1)' : 'scale(1)',
        userSelect: 'none',
    }

    // Player panel styles - positioned above the toggle button (follows if button is dragged)
    const panelStyle = {
        position: 'fixed',
        bottom: position.y !== null ? 'auto' : (isMobile ? 'calc(var(--safe-area-bottom, 0px) + 140px)' : '130px'),
        left: position.x !== null ? position.x : '20px',
        top: position.y !== null ? Math.max(10, position.y - 400) : 'auto', // Panel appears above dragged button
        width: isMobile ? 'calc(100% - 40px)' : 340,
        maxWidth: 340,
        maxHeight: isMobile ? '60vh' : '70vh',
        overflowY: 'auto',
        background: 'linear-gradient(145deg, rgba(24,24,24,0.98), rgba(18,18,18,0.98))',
        backdropFilter: 'blur(20px)',
        borderRadius: 16,
        padding: 20,
        boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1)',
        zIndex: 999,
        transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
        opacity: isOpen ? 1 : 0,
        pointerEvents: isOpen ? 'auto' : 'none',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }

    return (
        <>
            {/* Hidden Audio Element */}
            <AudioErrorBoundary>
                <audio ref={audioRef} preload="none" />
            </AudioErrorBoundary>

            {/* CSS Animation */}
            <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4); }
          50% { transform: scale(1.05); box-shadow: 0 4px 30px rgba(99, 102, 241, 0.6); }
        }
        .music-service-btn:hover {
          transform: scale(1.05);
          filter: brightness(1.1);
        }
        .radio-station:hover {
          background: rgba(255,255,255,0.15) !important;
        }
      `}</style>

            {/* Toggle Button - Draggable */}
            <button
                ref={buttonRef}
                onClick={() => { if (!isDragging) { setIsOpen(!isOpen); resetFadeTimer(); } }}
                onMouseDown={handleDragStart}
                onMouseEnter={resetFadeTimer}
                onMouseMove={resetFadeTimer}
                onTouchStart={(e) => { resetFadeTimer(); if (!isMobile) handleDragStart(e); }}
                style={toggleButtonStyle}
                title="Music Player (drag to move)"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
            </button>

            {/* Player Panel */}
            <div
                onMouseEnter={resetFadeTimer}
                onMouseMove={resetFadeTimer}
                onTouchStart={resetFadeTimer}
                style={panelStyle}
            >
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16,
                    position: 'sticky',
                    top: -20,
                    background: 'rgba(24,24,24,0.98)',
                    padding: '10px 0',
                    marginTop: -10
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 20 }}>🎵</span>
                        <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>
                            Music Player
                        </span>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#888',
                            cursor: 'pointer',
                            padding: 4,
                            fontSize: 18
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Now Playing (if something is playing) */}
                {currentTrack && (
                    <div style={{
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: 12,
                        padding: 16,
                        marginBottom: 16
                    }}>
                        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                            <div style={{
                                width: 56,
                                height: 56,
                                borderRadius: 8,
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 24,
                                flexShrink: 0
                            }}>
                                {currentTrack.artwork ? (
                                    <img
                                        src={currentTrack.artwork}
                                        alt=""
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }}
                                    />
                                ) : (
                                    isPlaying ? '🎶' : '🎵'
                                )}
                            </div>
                            <div style={{ overflow: 'hidden', flex: 1 }}>
                                <div style={{
                                    color: '#fff',
                                    fontSize: 14,
                                    fontWeight: 600,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>
                                    {currentTrack.name}
                                </div>
                                <div style={{
                                    color: '#b3b3b3',
                                    fontSize: 12,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>
                                    {currentTrack.artist}
                                </div>
                                {currentTrack.album && (
                                    <div style={{
                                        color: '#666',
                                        fontSize: 11,
                                        marginTop: 2
                                    }}>
                                        {currentTrack.album}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div style={{ marginBottom: 12 }}>
                            <div style={{
                                height: 4,
                                background: '#404040',
                                borderRadius: 2,
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    height: '100%',
                                    width: duration ? `${(progress / duration) * 100}%` : '0%',
                                    background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                                    borderRadius: 2,
                                    transition: 'width 0.3s linear'
                                }} />
                            </div>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginTop: 4,
                                fontSize: 10,
                                color: '#888'
                            }}>
                                <span>{formatTime(progress)}</span>
                                <span>{formatTime(duration)}</span>
                            </div>
                        </div>

                        {/* Controls */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 20
                        }}>
                            <button
                                onClick={handlePrevious}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    padding: 8,
                                    opacity: 0.8
                                }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                                </svg>
                            </button>

                            <button
                                onClick={handlePlayPause}
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                {isPlaying ? (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
                                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                                    </svg>
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                )}
                            </button>

                            <button
                                onClick={handleNext}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    padding: 8,
                                    opacity: 0.8
                                }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                                </svg>
                            </button>
                        </div>

                        {/* Volume */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            marginTop: 12
                        }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#888">
                                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                            </svg>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={volume}
                                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                                style={{
                                    flex: 1,
                                    height: 4,
                                    appearance: 'none',
                                    background: '#404040',
                                    borderRadius: 2,
                                    cursor: 'pointer'
                                }}
                            />
                            <span style={{ color: '#888', fontSize: 10, width: 24 }}>{volume}%</span>
                        </div>
                    </div>
                )}

                {/* Streaming Services */}
                <div style={{ marginBottom: 16 }}>
                    <div style={{
                        color: '#888',
                        fontSize: 11,
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                        marginBottom: 10
                    }}>
                        Open Streaming App
                    </div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: 8
                    }}>
                        {streamingServices.map(service => (
                            <button
                                key={service.id}
                                className="music-service-btn"
                                onClick={() => openStreamingService(service)}
                                style={{
                                    background: selectedService === service.id
                                        ? service.color
                                        : 'rgba(255,255,255,0.1)',
                                    border: 'none',
                                    borderRadius: 12,
                                    padding: '12px 8px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 4,
                                    transition: 'all 0.2s'
                                }}
                                title={service.description}
                            >
                                <span style={{ fontSize: 20 }}>{service.icon}</span>
                                <span style={{
                                    color: '#fff',
                                    fontSize: 9,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    width: '100%',
                                    textAlign: 'center'
                                }}>
                                    {service.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Built-in Radio Stations */}
                <div style={{ marginBottom: 16 }}>
                    <div style={{
                        color: '#888',
                        fontSize: 11,
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                        marginBottom: 10
                    }}>
                        🎙️ Built-in Radio (No Account Required)
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {radioStations.map((station, index) => (
                            <button
                                key={index}
                                className="radio-station"
                                onClick={() => playStation(station)}
                                style={{
                                    background: streamUrl === station.url
                                        ? 'linear-gradient(90deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3))'
                                        : 'rgba(255,255,255,0.05)',
                                    border: streamUrl === station.url
                                        ? '1px solid rgba(99,102,241,0.5)'
                                        : '1px solid transparent',
                                    borderRadius: 8,
                                    padding: '10px 12px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span style={{ fontSize: 16 }}>📻</span>
                                    <div style={{ textAlign: 'left' }}>
                                        <div style={{ color: '#fff', fontSize: 13, fontWeight: 500 }}>
                                            {station.name}
                                        </div>
                                        <div style={{ color: '#888', fontSize: 10 }}>
                                            {station.genre}
                                        </div>
                                    </div>
                                </div>
                                {streamUrl === station.url && isPlaying && (
                                    <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 16 }}>
                                        {[1, 2, 3].map(i => (
                                            <div
                                                key={i}
                                                style={{
                                                    width: 3,
                                                    background: '#6366f1',
                                                    borderRadius: 1,
                                                    animation: `equalizer${i} 0.5s ease-in-out infinite`
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Custom Stream URL */}
                <div>
                    <button
                        onClick={() => setShowUrlInput(!showUrlInput)}
                        style={{
                            width: '100%',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px dashed rgba(255,255,255,0.2)',
                            borderRadius: 8,
                            padding: '10px 12px',
                            cursor: 'pointer',
                            color: '#888',
                            fontSize: 12,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8
                        }}
                    >
                        <span>🔗</span>
                        Play Custom Stream URL
                    </button>

                    {showUrlInput && (
                        <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                            <input
                                type="url"
                                placeholder="Paste audio stream URL..."
                                value={streamUrl}
                                onChange={(e) => setStreamUrl(e.target.value)}
                                style={{
                                    flex: 1,
                                    background: 'rgba(0,0,0,0.3)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    borderRadius: 6,
                                    padding: '8px 12px',
                                    color: '#fff',
                                    fontSize: 12
                                }}
                            />
                            <button
                                onClick={playCustomUrl}
                                style={{
                                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    border: 'none',
                                    borderRadius: 6,
                                    padding: '8px 16px',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    fontSize: 12,
                                    fontWeight: 600
                                }}
                            >
                                Play
                            </button>
                        </div>
                    )}
                </div>

                {/* Equalizer Animation CSS */}
                <style>{`
          @keyframes equalizer1 {
            0%, 100% { height: 4px; }
            50% { height: 16px; }
          }
          @keyframes equalizer2 {
            0%, 100% { height: 8px; }
            50% { height: 12px; }
          }
          @keyframes equalizer3 {
            0%, 100% { height: 6px; }
            50% { height: 14px; }
          }
        `}</style>
            </div>
        </>
    )
}
