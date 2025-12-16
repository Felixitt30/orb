import { useState, useEffect, useRef } from 'react'

export default function RetroGames() {
    const [isOpen, setIsOpen] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [selectedConsole, setSelectedConsole] = useState(null)
    const [romFile, setRomFile] = useState(null)
    const [romName, setRomName] = useState('')
    const [isPlaying, setIsPlaying] = useState(false)
    const [savedGames, setSavedGames] = useState([])
    const fileInputRef = useRef(null)
    const emulatorContainerRef = useRef(null)

    // Visibility state for auto-fade
    const [isVisible, setIsVisible] = useState(true)
    const fadeTimerRef = useRef(null)
    const FADE_DELAY = 4000

    // Drag state
    const [isDragging, setIsDragging] = useState(false)
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
    const [position, setPosition] = useState({ x: null, y: null })
    const buttonRef = useRef(null)

    const resetFadeTimer = () => {
        setIsVisible(true)
        if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current)
        fadeTimerRef.current = setTimeout(() => setIsVisible(false), FADE_DELAY)
    }

    useEffect(() => {
        resetFadeTimer()
        return () => { if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current) }
    }, [])

    // Drag handlers
    const handleDragStart = (e) => {
        if (isMobile) return
        e.preventDefault()
        const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX
        const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect()
            setDragOffset({ x: clientX - rect.left, y: clientY - rect.top })
        }
        setIsDragging(true)
        resetFadeTimer()
    }

    const handleDragMove = (e) => {
        if (!isDragging) return
        const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX
        const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY
        setPosition({ x: clientX - dragOffset.x, y: clientY - dragOffset.y })
        resetFadeTimer()
    }

    const handleDragEnd = () => setIsDragging(false)

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleDragMove)
            window.addEventListener('mouseup', handleDragEnd)
            window.addEventListener('touchmove', handleDragMove)
            window.addEventListener('touchend', handleDragEnd)
        }
        return () => {
            window.removeEventListener('mousemove', handleDragMove)
            window.removeEventListener('mouseup', handleDragEnd)
            window.removeEventListener('touchmove', handleDragMove)
            window.removeEventListener('touchend', handleDragEnd)
        }
    }, [isDragging, dragOffset])

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768)
            setPosition({ x: null, y: null })
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    // Load saved games from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('retroGamesSaved')
        if (saved) setSavedGames(JSON.parse(saved))
    }, [])

    // Console definitions with EmulatorJS core names
    const consoles = [
        { id: 'nes', name: 'NES', icon: '🎮', color: '#E60012', core: 'nes', extensions: ['.nes'] },
        { id: 'snes', name: 'SNES', icon: '🕹️', color: '#7B68A6', core: 'snes', extensions: ['.smc', '.sfc'] },
        { id: 'gb', name: 'Game Boy', icon: '🎲', color: '#8B956D', core: 'gb', extensions: ['.gb'] },
        { id: 'gbc', name: 'Game Boy Color', icon: '🌈', color: '#663399', core: 'gbc', extensions: ['.gbc'] },
        { id: 'gba', name: 'Game Boy Advance', icon: '📱', color: '#5A1BA9', core: 'gba', extensions: ['.gba'] },
        { id: 'genesis', name: 'Sega Genesis', icon: '🎯', color: '#0066CC', core: 'segaMD', extensions: ['.md', '.gen', '.bin'] },
        { id: 'n64', name: 'Nintendo 64', icon: '🎪', color: '#009900', core: 'n64', extensions: ['.n64', '.z64', '.v64'] },
        { id: 'psx', name: 'PlayStation', icon: '💿', color: '#003087', core: 'psx', extensions: ['.bin', '.cue', '.iso'] },
    ]

    const handleFileSelect = (e) => {
        const file = e.target.files[0]
        if (file) {
            setRomFile(file)
            setRomName(file.name)
        }
    }

    const startEmulator = async () => {
        if (!romFile || !selectedConsole) return

        setIsPlaying(true)

        // Create EmulatorJS container
        const container = emulatorContainerRef.current
        if (!container) return

        // Clear previous content
        container.innerHTML = ''

        // Create game div
        const gameDiv = document.createElement('div')
        gameDiv.id = 'game'
        gameDiv.style.width = '100%'
        gameDiv.style.height = '100%'
        container.appendChild(gameDiv)

        // Read ROM file as data URL
        const reader = new FileReader()
        reader.onload = () => {
            // Set EmulatorJS config
            window.EJS_player = '#game'
            window.EJS_gameUrl = reader.result
            window.EJS_core = selectedConsole.core
            window.EJS_pathtodata = 'https://cdn.emulatorjs.org/stable/data/'
            window.EJS_startOnLoaded = true
            window.EJS_color = '#6366f1'
            window.EJS_backgroundColor = '#1a1a2e'

            // Load EmulatorJS script
            const script = document.createElement('script')
            script.src = 'https://cdn.emulatorjs.org/stable/data/loader.js'
            script.async = true
            container.appendChild(script)
        }
        reader.readAsDataURL(romFile)

        // Save to recent games
        const newSave = {
            name: romName,
            console: selectedConsole.id,
            date: new Date().toISOString()
        }
        const updated = [newSave, ...savedGames.filter(g => g.name !== romName)].slice(0, 10)
        setSavedGames(updated)
        localStorage.setItem('retroGamesSaved', JSON.stringify(updated))
    }

    const stopEmulator = () => {
        setIsPlaying(false)
        if (emulatorContainerRef.current) {
            emulatorContainerRef.current.innerHTML = ''
        }
        // Clean up EmulatorJS globals
        delete window.EJS_player
        delete window.EJS_gameUrl
        delete window.EJS_core
    }

    const toggleButtonStyle = {
        position: 'fixed',
        bottom: position.y !== null ? 'auto' : (isMobile ? 'calc(var(--safe-area-bottom, 0px) + 80px)' : '70px'),
        right: position.x !== null ? 'auto' : '20px',
        left: position.x !== null ? position.x : 'auto',
        top: position.y !== null ? position.y : 'auto',
        width: 50,
        height: 50,
        borderRadius: '50%',
        background: isPlaying
            ? 'linear-gradient(135deg, #10b981, #059669)'
            : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        border: isDragging ? '2px solid rgba(255,255,255,0.3)' : 'none',
        cursor: isDragging ? 'grabbing' : 'grab',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: isDragging ? '0 8px 30px rgba(0,0,0,0.6)' : '0 4px 20px rgba(0,0,0,0.4)',
        zIndex: 1000,
        transition: isDragging ? 'none' : 'all 0.3s ease, opacity 0.5s ease',
        opacity: isVisible || isOpen ? 1 : 0,
        pointerEvents: 'auto',
        transform: isDragging ? 'scale(1.1)' : 'scale(1)',
        userSelect: 'none',
        fontSize: 24,
    }

    const panelStyle = {
        position: 'fixed',
        bottom: position.y !== null ? 'auto' : (isMobile ? 'calc(var(--safe-area-bottom, 0px) + 140px)' : '130px'),
        right: position.x !== null ? 'auto' : '20px',
        left: position.x !== null ? position.x : 'auto',
        top: position.y !== null ? Math.max(10, position.y - 500) : 'auto',
        width: isMobile ? 'calc(100% - 40px)' : isPlaying ? 600 : 360,
        maxWidth: isPlaying ? 800 : 360,
        maxHeight: isMobile ? '70vh' : isPlaying ? '80vh' : '60vh',
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
            {/* Toggle Button */}
            <button
                ref={buttonRef}
                onClick={() => { if (!isDragging) { setIsOpen(!isOpen); resetFadeTimer(); } }}
                onMouseDown={handleDragStart}
                onMouseEnter={resetFadeTimer}
                onMouseMove={resetFadeTimer}
                onTouchStart={(e) => { resetFadeTimer(); if (!isMobile) handleDragStart(e); }}
                style={toggleButtonStyle}
                title="Retro Games (drag to move)"
            >
                🎮
            </button>

            {/* Panel */}
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
                    paddingBottom: 12,
                    borderBottom: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <h3 style={{
                        margin: 0,
                        color: '#fff',
                        fontSize: 18,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                    }}>
                        🎮 Retro Games
                        {isPlaying && (
                            <span style={{
                                fontSize: 10,
                                background: '#10b981',
                                padding: '2px 8px',
                                borderRadius: 10,
                                color: '#000',
                                fontWeight: 700
                            }}>
                                PLAYING
                            </span>
                        )}
                    </h3>
                    <button
                        onClick={() => setIsOpen(false)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#666',
                            fontSize: 20,
                            cursor: 'pointer',
                            padding: 4
                        }}
                    >
                        ✕
                    </button>
                </div>

                {isPlaying ? (
                    /* Emulator View */
                    <div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 12
                        }}>
                            <span style={{ color: '#aaa', fontSize: 14 }}>
                                {romName}
                            </span>
                            <button
                                onClick={stopEmulator}
                                style={{
                                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                    border: 'none',
                                    borderRadius: 8,
                                    padding: '8px 16px',
                                    color: '#fff',
                                    fontSize: 12,
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                ⏹ Stop Game
                            </button>
                        </div>
                        <div
                            ref={emulatorContainerRef}
                            style={{
                                width: '100%',
                                height: isMobile ? '50vh' : '400px',
                                background: '#000',
                                borderRadius: 8,
                                overflow: 'hidden'
                            }}
                        />
                        <p style={{
                            color: '#666',
                            fontSize: 10,
                            marginTop: 12,
                            textAlign: 'center'
                        }}>
                            Controls: Arrow Keys, Z/X = A/B, Enter = Start, Shift = Select
                        </p>
                    </div>
                ) : (
                    /* Selection View */
                    <div>
                        {/* Console Selection */}
                        {!selectedConsole ? (
                            <div>
                                <p style={{ color: '#888', fontSize: 13, marginBottom: 16 }}>
                                    Select a console to play:
                                </p>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(2, 1fr)',
                                    gap: 10
                                }}>
                                    {consoles.map(console => (
                                        <button
                                            key={console.id}
                                            onClick={() => setSelectedConsole(console)}
                                            style={{
                                                background: `linear-gradient(135deg, ${console.color}22, ${console.color}11)`,
                                                border: `1px solid ${console.color}44`,
                                                borderRadius: 12,
                                                padding: '16px 12px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: 8,
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'scale(1.02)'
                                                e.currentTarget.style.borderColor = console.color
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'scale(1)'
                                                e.currentTarget.style.borderColor = `${console.color}44`
                                            }}
                                        >
                                            <span style={{ fontSize: 28 }}>{console.icon}</span>
                                            <span style={{
                                                color: '#fff',
                                                fontSize: 12,
                                                fontWeight: 600
                                            }}>
                                                {console.name}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            /* ROM Selection */
                            <div>
                                <button
                                    onClick={() => { setSelectedConsole(null); setRomFile(null); setRomName(''); }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#888',
                                        fontSize: 12,
                                        cursor: 'pointer',
                                        marginBottom: 16,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4
                                    }}
                                >
                                    ← Back to consoles
                                </button>

                                <div style={{
                                    background: `linear-gradient(135deg, ${selectedConsole.color}22, ${selectedConsole.color}11)`,
                                    border: `1px solid ${selectedConsole.color}44`,
                                    borderRadius: 12,
                                    padding: 16,
                                    marginBottom: 16,
                                    textAlign: 'center'
                                }}>
                                    <span style={{ fontSize: 40 }}>{selectedConsole.icon}</span>
                                    <h4 style={{ color: '#fff', margin: '8px 0 4px' }}>{selectedConsole.name}</h4>
                                    <p style={{ color: '#888', fontSize: 11, margin: 0 }}>
                                        Supported: {selectedConsole.extensions.join(', ')}
                                    </p>
                                </div>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept={selectedConsole.extensions.join(',')}
                                    onChange={handleFileSelect}
                                    style={{ display: 'none' }}
                                />

                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{
                                        width: '100%',
                                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                        border: 'none',
                                        borderRadius: 10,
                                        padding: '14px',
                                        color: '#fff',
                                        fontSize: 14,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        marginBottom: 12
                                    }}
                                >
                                    📁 Load ROM File
                                </button>

                                {romFile && (
                                    <div style={{
                                        background: 'rgba(16, 185, 129, 0.1)',
                                        border: '1px solid rgba(16, 185, 129, 0.3)',
                                        borderRadius: 8,
                                        padding: 12,
                                        marginBottom: 12
                                    }}>
                                        <p style={{ color: '#10b981', fontSize: 12, margin: '0 0 8px' }}>
                                            ✓ ROM loaded: {romName}
                                        </p>
                                        <button
                                            onClick={startEmulator}
                                            style={{
                                                width: '100%',
                                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                                border: 'none',
                                                borderRadius: 8,
                                                padding: '12px',
                                                color: '#fff',
                                                fontSize: 14,
                                                fontWeight: 700,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            ▶ START GAME
                                        </button>
                                    </div>
                                )}

                                {/* Legal Notice & Homebrew Links */}
                                <div style={{
                                    background: 'rgba(59, 130, 246, 0.1)',
                                    border: '1px solid rgba(59, 130, 246, 0.2)',
                                    borderRadius: 8,
                                    padding: 12,
                                    marginTop: 16
                                }}>
                                    <p style={{
                                        color: '#60a5fa',
                                        fontSize: 11,
                                        margin: '0 0 8px',
                                        fontWeight: 600
                                    }}>
                                        📋 Legal Notice
                                    </p>
                                    <p style={{
                                        color: '#888',
                                        fontSize: 10,
                                        margin: '0 0 10px',
                                        lineHeight: 1.5
                                    }}>
                                        This emulator requires your own ROM files. Only use games you legally own or free homebrew/public domain games. No ROMs are included with this app.
                                    </p>
                                    <p style={{
                                        color: '#666',
                                        fontSize: 10,
                                        margin: '0 0 6px',
                                        fontWeight: 600
                                    }}>
                                        🎮 Free Homebrew Games:
                                    </p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                        <a
                                            href="https://www.romhacking.net/homebrew/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                color: '#60a5fa',
                                                fontSize: 10,
                                                textDecoration: 'none',
                                                background: 'rgba(96, 165, 250, 0.1)',
                                                padding: '4px 8px',
                                                borderRadius: 4
                                            }}
                                        >
                                            ROMhacking.net
                                        </a>
                                        <a
                                            href="https://itch.io/games/tag-rom"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                color: '#60a5fa',
                                                fontSize: 10,
                                                textDecoration: 'none',
                                                background: 'rgba(96, 165, 250, 0.1)',
                                                padding: '4px 8px',
                                                borderRadius: 4
                                            }}
                                        >
                                            itch.io ROMs
                                        </a>
                                        <a
                                            href="https://pdroms.de/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                color: '#60a5fa',
                                                fontSize: 10,
                                                textDecoration: 'none',
                                                background: 'rgba(96, 165, 250, 0.1)',
                                                padding: '4px 8px',
                                                borderRadius: 4
                                            }}
                                        >
                                            PDRoms
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Recent Games */}
                        {savedGames.length > 0 && !selectedConsole && (
                            <div style={{ marginTop: 20 }}>
                                <p style={{
                                    color: '#666',
                                    fontSize: 11,
                                    marginBottom: 8,
                                    textTransform: 'uppercase',
                                    letterSpacing: 1
                                }}>
                                    Recent Games
                                </p>
                                {savedGames.slice(0, 3).map((game, i) => (
                                    <div key={i} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 10,
                                        padding: '8px 0',
                                        borderBottom: '1px solid rgba(255,255,255,0.05)'
                                    }}>
                                        <span>{consoles.find(c => c.id === game.console)?.icon || '🎮'}</span>
                                        <span style={{ color: '#aaa', fontSize: 12, flex: 1 }}>
                                            {game.name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    )
}
