import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store'
import { useDraggable } from '../hooks/useDraggable'

export default function Settings() {
    const [isOpen, setIsOpen] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [activeTab, setActiveTab] = useState('orb')
    const [toast, setToast] = useState(null)
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
    const [showLegalPage, setShowLegalPage] = useState(null)
    const { settings, updateSetting, resetAllSettings, clearCachedData, sentimentColorMap, logout, isAuthenticated, isGuest, authMethod, userEmail, appVersion, changelog, featureFlags, setFeatureFlag, trackEvent } = useStore()

    const buttonRef = useRef(null)
    const { position, isDragging, handleDragStart, setPosition } = useDraggable(buttonRef)

    // Show toast notification
    const showToast = (message) => {
        setToast(message)
        setTimeout(() => setToast(null), 2500)
    }

    // Handle orb mode change with toast
    const handleOrbModeChange = (newMode) => {
        updateSetting('orbMode', newMode)
        if (newMode === 'auto') {
            showToast('🔮 Orb set to Sentiment Driven')
        } else {
            showToast('🎨 Orb set to Manual Theme')
        }
    }

    // Visibility state for auto-fade
    const [isVisible, setIsVisible] = useState(true)
    const fadeTimerRef = useRef(null)

    const resetFadeTimer = () => {
        if (!settings.autoFadeEnabled) return
        setIsVisible(true)
        if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current)
        fadeTimerRef.current = setTimeout(() => setIsVisible(false), settings.fadeDelay)
    }

    useEffect(() => {
        if (settings.autoFadeEnabled) {
            resetFadeTimer()
        } else {
            setIsVisible(true)
            if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current)
        }
        return () => { if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current) }
    }, [settings.autoFadeEnabled, settings.fadeDelay])

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

    // Global mouse/touch listener to restore visibility when faded
    useEffect(() => {
        const handleGlobalInteraction = () => {
            // Only restore if button is faded (not if panel is open)
            if (!isVisible && !isOpen) {
                resetFadeTimer()
            }
        }

        // Only listen for mouse MOVEMENT (not clicks) to restore visibility
        // This prevents interference with other UI elements
        window.addEventListener('mousemove', handleGlobalInteraction)
        window.addEventListener('touchmove', handleGlobalInteraction)

        return () => {
            window.removeEventListener('mousemove', handleGlobalInteraction)
            window.removeEventListener('touchmove', handleGlobalInteraction)
        }
    }, [isVisible, isOpen])

    const handleDoubleClick = () => {
        if (settings.doubleClickToFade) setIsVisible(false)
    }

    // Reusable Components
    const ToggleSwitch = ({ enabled, onChange, label, description, disabled, futureFeature }) => (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            padding: '10px 0',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            opacity: disabled ? 0.5 : 1,
        }}>
            <div style={{ flex: 1, marginRight: 12 }}>
                <div style={{
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 500,
                    marginBottom: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                }}>
                    {label}
                    {futureFeature && (
                        <span style={{
                            fontSize: 8,
                            background: 'rgba(251, 191, 36, 0.2)',
                            color: '#fbbf24',
                            padding: '2px 6px',
                            borderRadius: 4,
                            fontWeight: 600
                        }}>SCHEDULED</span>
                    )}
                </div>
                {description && (
                    <div style={{ color: '#666', fontSize: 10, lineHeight: 1.4 }}>
                        {description}
                    </div>
                )}
            </div>
            <div
                onClick={disabled ? null : onChange}
                style={{
                    position: 'relative',
                    width: 40,
                    height: 22,
                    borderRadius: 11,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    background: enabled ? '#6366f1' : '#374151',
                    transition: 'all 0.2s',
                    flexShrink: 0,
                }}
            >
                <div style={{
                    position: 'absolute',
                    top: 2,
                    left: enabled ? 20 : 2,
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: '#fff',
                    transition: 'left 0.2s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }} />
            </div>
        </div>
    )

    const SelectSetting = ({ value, onChange, label, description, options }) => (
        <div style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 6
            }}>
                <div style={{ color: '#fff', fontSize: 12, fontWeight: 500 }}>{label}</div>
            </div>
            {description && (
                <div style={{ color: '#666', fontSize: 10, marginBottom: 8 }}>{description}</div>
            )}
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 6,
                    background: '#1f2937',
                    color: '#fff',
                    border: '1px solid #374151',
                    fontSize: 11,
                    cursor: 'pointer'
                }}
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    )

    const SliderSetting = ({ value, onChange, label, description, min, max, step, unit, displayValue }) => (
        <div style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 6
            }}>
                <div style={{ color: '#fff', fontSize: 12, fontWeight: 500 }}>{label}</div>
                <div style={{
                    color: '#6366f1',
                    fontSize: 11,
                    fontWeight: 600,
                    background: 'rgba(99, 102, 241, 0.1)',
                    padding: '2px 8px',
                    borderRadius: 4
                }}>
                    {displayValue || value}{unit}
                </div>
            </div>
            {description && (
                <div style={{ color: '#666', fontSize: 10, marginBottom: 8 }}>{description}</div>
            )}
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                style={{
                    width: '100%',
                    height: 4,
                    borderRadius: 2,
                    background: '#374151',
                    cursor: 'pointer',
                    accentColor: '#6366f1'
                }}
            />
        </div>
    )

    const SectionHeader = ({ icon, title }) => (
        <div style={{
            fontSize: 10,
            color: '#888',
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginBottom: 8,
            marginTop: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 6
        }}>
            <span>{icon}</span> {title}
        </div>
    )

    const InfoBox = ({ children }) => (
        <div style={{
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: 6,
            padding: 10,
            fontSize: 10,
            color: '#60a5fa',
            lineHeight: 1.5,
            marginTop: 8
        }}>
            {children}
        </div>
    )

    // Tab definitions
    const tabs = [
        { id: 'orb', label: '🔮 Orb', icon: '🔮' },
        { id: 'data', label: '📊 Data', icon: '📊' },
        { id: 'defi', label: '🧬 DeFi', icon: '🧬' },
        { id: 'display', label: '🎨 Display', icon: '🎨' },
        { id: 'notify', label: '🔔 Alerts', icon: '🔔' },
        { id: 'privacy', label: '🔒 Privacy', icon: '🔒' },
        { id: 'advanced', label: '⚙️ Advanced', icon: '⚙️' },
        { id: 'about', label: 'ℹ️ About', icon: 'ℹ️' },
    ]

    const toggleButtonStyle = {
        position: 'fixed',
        top: position.y !== null ? position.y : 'calc(var(--safe-area-top, 0px) + 20px)',
        right: position.x !== null ? 'auto' : '20px',
        bottom: 'auto',
        left: position.x !== null ? position.x : 'auto',
        width: 40,
        height: 40,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #374151, #4b5563)',
        border: isDragging ? '1px solid rgba(255,255,255,0.3)' : 'none',
        cursor: isDragging ? 'grabbing' : 'grab',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: isDragging ? '0 8px 30px rgba(0,0,0,0.6)' : '0 4px 20px rgba(0,0,0,0.4)',
        zIndex: 1000,
        transition: isDragging ? 'none' : 'all 0.3s ease, opacity 0.5s ease',
        opacity: isVisible || isOpen ? 1 : 0,
        pointerEvents: 'auto',
        fontSize: 18,
        userSelect: 'none'
    }

    const panelStyle = {
        position: 'fixed',
        bottom: position.y !== null ? 'auto' : (isMobile ? 'calc(var(--safe-area-bottom, 0px) + 130px)' : '120px'),
        left: position.x !== null ? position.x : '20px',
        top: position.y !== null ? Math.max(10, position.y - 500) : 'auto',
        width: isMobile ? 'calc(100% - 40px)' : 380,
        maxWidth: 400,
        maxHeight: isMobile ? '70vh' : '75vh',
        overflowY: 'auto',
        background: 'linear-gradient(145deg, rgba(24,24,24,0.98), rgba(18,18,18,0.98))',
        backdropFilter: 'blur(20px)',
        borderRadius: 16,
        padding: 0,
        boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1)',
        zIndex: 999,
        transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
        opacity: isOpen ? 1 : 0,
        pointerEvents: isOpen ? 'auto' : 'none',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }

    const renderTabContent = () => {
        switch (activeTab) {
            case 'orb':
                return (
                    <>
                        <SectionHeader icon="🔮" title="Orb Mode" />

                        {/* Mode Selector */}
                        <div style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ color: '#fff', fontSize: 12, fontWeight: 500, marginBottom: 8 }}>
                                Orb Color Mode
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                    onClick={() => handleOrbModeChange('auto')}
                                    style={{
                                        flex: 1,
                                        padding: '12px 10px',
                                        borderRadius: 8,
                                        border: settings.orbMode === 'auto'
                                            ? '2px solid #22c55e'
                                            : '1px solid #374151',
                                        background: settings.orbMode === 'auto'
                                            ? 'rgba(34, 197, 94, 0.15)'
                                            : '#1f2937',
                                        color: settings.orbMode === 'auto' ? '#22c55e' : '#888',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                                        📊 Auto (Sentiment Driven)
                                    </div>
                                    <div style={{ fontSize: 10, opacity: 0.8 }}>
                                        Orb visuals automatically reflect portfolio sentiment.
                                    </div>
                                </button>
                                <button
                                    onClick={() => handleOrbModeChange('manual')}
                                    style={{
                                        flex: 1,
                                        padding: '12px 10px',
                                        borderRadius: 8,
                                        border: settings.orbMode === 'manual'
                                            ? '2px solid #8b5cf6'
                                            : '1px solid #374151',
                                        background: settings.orbMode === 'manual'
                                            ? 'rgba(139, 92, 246, 0.15)'
                                            : '#1f2937',
                                        color: settings.orbMode === 'manual' ? '#8b5cf6' : '#888',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                                        🎨 Manual (Custom Theme)
                                    </div>
                                    <div style={{ fontSize: 10, opacity: 0.8 }}>
                                        Choose your own orb colors. Visual only.
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Auto Mode Info */}
                        {settings.orbMode === 'auto' && (
                            <InfoBox>
                                📊 <strong>Live Sentiment Colors:</strong><br />
                                • Bullish (+2% or more) → <span style={{ color: sentimentColorMap.bullish, fontWeight: 600 }}>Green</span><br />
                                • Neutral (-2% to +2%) → <span style={{ color: sentimentColorMap.neutral, fontWeight: 600 }}>Yellow</span><br />
                                • Bearish (-2% or less) → <span style={{ color: sentimentColorMap.bearish, fontWeight: 600 }}>Red</span><br />
                                <span style={{ fontSize: 9, color: '#888', marginTop: 4, display: 'block' }}>
                                    Colors update in real-time based on your portfolio's 24h performance.
                                </span>
                            </InfoBox>
                        )}

                        {/* Manual Theme Selector - disabled when Auto */}
                        <div style={{
                            padding: '10px 0',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            opacity: settings.orbMode === 'auto' ? 0.4 : 1,
                            pointerEvents: settings.orbMode === 'auto' ? 'none' : 'auto'
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 6
                            }}>
                                <div style={{ color: '#fff', fontSize: 12, fontWeight: 500 }}>Orb Theme</div>
                                {settings.orbMode === 'auto' && (
                                    <span style={{
                                        fontSize: 9,
                                        color: '#666',
                                        background: 'rgba(255,255,255,0.05)',
                                        padding: '2px 6px',
                                        borderRadius: 4
                                    }}>
                                        Disabled while Auto mode is active
                                    </span>
                                )}
                            </div>
                            <select
                                value={settings.manualOrbColor}
                                onChange={(e) => updateSetting('manualOrbColor', e.target.value)}
                                disabled={settings.orbMode === 'auto'}
                                title={settings.orbMode === 'auto' ? 'Disabled while Auto mode is active' : 'Choose orb theme'}
                                style={{
                                    width: '100%',
                                    padding: '8px 10px',
                                    borderRadius: 6,
                                    background: '#1f2937',
                                    color: settings.orbMode === 'auto' ? '#555' : '#fff',
                                    border: '1px solid #374151',
                                    fontSize: 11,
                                    cursor: settings.orbMode === 'auto' ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {/* Original Themes */}
                                <option value="neon">🎨 Default (Red/Pink)</option>
                                <option value="neon_purple">💜 Neon Purple</option>
                                <option value="matrix">🟢 Matrix Green</option>
                                <option value="solana">🟣 Solana Purple</option>
                                <option value="bitcoin">🟠 Bitcoin Orange</option>
                                <option value="rainbow">🌈 Rainbow Gradient</option>

                                {/* Pink Shades */}
                                <optgroup label="💗 Pink Shades">
                                    <option value="hot_pink">💗 Hot Pink</option>
                                    <option value="pink">🌸 Pink</option>
                                    <option value="rose">🌹 Rose</option>
                                    <option value="magenta">💖 Magenta</option>
                                </optgroup>

                                {/* Purple Shades */}
                                <optgroup label="💜 Purple Shades">
                                    <option value="violet">🔮 Violet</option>
                                    <option value="lavender">💐 Lavender</option>
                                    <option value="purple">👾 Purple</option>
                                </optgroup>

                                {/* Blue Shades */}
                                <optgroup label="💙 Blue Shades">
                                    <option value="electric_blue">⚡ Electric Blue</option>
                                    <option value="sky_blue">☁️ Sky Blue</option>
                                    <option value="royal_blue">👑 Royal Blue</option>
                                    <option value="navy">🌊 Navy</option>
                                </optgroup>

                                {/* Cyan/Teal Shades */}
                                <optgroup label="🩵 Cyan & Teal">
                                    <option value="cyan">💎 Cyan</option>
                                    <option value="aqua">🌊 Aqua</option>
                                    <option value="teal">🦚 Teal</option>
                                    <option value="turquoise">🐚 Turquoise</option>
                                </optgroup>

                                {/* Green Shades */}
                                <optgroup label="💚 Green Shades">
                                    <option value="lime">🍋 Lime</option>
                                    <option value="emerald">💎 Emerald</option>
                                    <option value="mint">🌿 Mint</option>
                                </optgroup>

                                {/* Yellow/Gold Shades */}
                                <optgroup label="💛 Yellow & Gold">
                                    <option value="yellow">⭐ Yellow</option>
                                    <option value="gold">🏆 Gold</option>
                                    <option value="amber">🍯 Amber</option>
                                </optgroup>

                                {/* Orange/Red Shades */}
                                <optgroup label="🧡 Orange & Red">
                                    <option value="orange">🍊 Orange</option>
                                    <option value="coral">🪸 Coral</option>
                                    <option value="red">❤️ Red</option>
                                    <option value="crimson">🌹 Crimson</option>
                                </optgroup>

                                {/* White/Silver */}
                                <optgroup label="🤍 White & Silver">
                                    <option value="white">⚪ White</option>
                                    <option value="silver">⚙️ Silver</option>
                                </optgroup>
                            </select>
                        </div>

                        <SectionHeader icon="✨" title="Visual Effects" />
                        <SelectSetting
                            value={settings.glowIntensity}
                            onChange={(val) => updateSetting('glowIntensity', val)}
                            label="Glow Intensity"
                            description="Control the brightness of the orb's glow effect."
                            options={[
                                { value: 'low', label: '🔅 Low' },
                                { value: 'medium', label: '💡 Medium' },
                                { value: 'high', label: '🔆 High' },
                            ]}
                        />

                        <SelectSetting
                            value={settings.animationSpeed}
                            onChange={(val) => updateSetting('animationSpeed', val)}
                            label="Animation Speed"
                            description="Control how fast the orb rotates and pulses."
                            options={[
                                { value: 'slow', label: '🐢 Slow' },
                                { value: 'normal', label: '⚡ Normal' },
                                { value: 'fast', label: '🚀 Fast' },
                            ]}
                        />

                        <button
                            onClick={() => {
                                updateSetting('orbMode', 'auto')
                                updateSetting('manualOrbColor', 'neon')
                                updateSetting('glowIntensity', 'medium')
                                updateSetting('animationSpeed', 'normal')
                                showToast('🔮 Orb reset to defaults')
                            }}
                            style={{
                                width: '100%',
                                marginTop: 12,
                                padding: '10px',
                                background: 'rgba(99, 102, 241, 0.1)',
                                border: '1px solid rgba(99, 102, 241, 0.3)',
                                borderRadius: 8,
                                color: '#6366f1',
                                fontSize: 11,
                                fontWeight: 500,
                                cursor: 'pointer'
                            }}
                        >
                            🔄 Reset Orb to Default
                        </button>
                    </>
                )

            case 'data':
                return (
                    <>
                        <SectionHeader icon="📊" title="Sentiment" />
                        <SelectSetting
                            value={settings.sentimentSource}
                            onChange={(val) => updateSetting('sentimentSource', val)}
                            label="Sentiment Source"
                            description="Choose what drives the sentiment indicator."
                            options={[
                                { value: 'portfolio', label: '💼 Portfolio Performance' },
                                { value: 'market', label: '📈 Overall Market Trend' },
                            ]}
                        />

                        <ToggleSwitch
                            enabled={settings.showSentimentBadge}
                            onChange={() => updateSetting('showSentimentBadge', !settings.showSentimentBadge)}
                            label="Show Sentiment Badge"
                            description="Display Bullish/Neutral/Bearish indicator below the orb."
                        />

                        <InfoBox>
                            ℹ️ <strong>How Sentiment Works:</strong><br />
                            Sentiment is calculated based on 24h price changes of your holdings.
                            This is for informational purposes only and is NOT financial advice.
                        </InfoBox>

                        <SectionHeader icon="🔄" title="Data Refresh" />
                        <SelectSetting
                            value={settings.updateFrequency}
                            onChange={(val) => updateSetting('updateFrequency', val)}
                            label="Update Frequency"
                            description="How often to refresh price data."
                            options={[
                                { value: 'realtime', label: '⚡ Real-time (~15s)' },
                                { value: '5min', label: '🕐 Every 5 minutes' },
                                { value: 'manual', label: '👆 Manual only' },
                            ]}
                        />

                        <SliderSetting
                            value={settings.refreshTimeout}
                            onChange={(val) => updateSetting('refreshTimeout', val)}
                            label="Refresh Timeout"
                            description="Seconds to wait before retrying failed requests."
                            min={10}
                            max={120}
                            step={10}
                            unit="s"
                        />
                    </>
                )

            case 'defi':
                return (
                    <>
                        <SectionHeader icon="🧬" title="Nova Nodes Protocol" />
                        <div style={{
                            background: 'rgba(189, 0, 255, 0.1)',
                            border: '1px solid rgba(189, 0, 255, 0.3)',
                            borderRadius: 12,
                            padding: 16,
                            marginBottom: 20
                        }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#bd00ff', marginBottom: 6 }}>
                                🔮 Protocol Insights Enabled
                            </div>
                            <div style={{ fontSize: 11, color: '#888', lineHeight: 1.5 }}>
                                The Orb application is officially integrated with the Nova Nodes DeFi protocol on Avalanche.
                                Your Node NFTs and $NOVA rewards are tracked in real-time.
                            </div>
                        </div>

                        <ToggleSwitch
                            enabled={true}
                            onChange={() => { }}
                            label="Auto-Update Protocol Data"
                            description="Automatically fetch TVL and rewards every 5 minutes."
                            disabled={true}
                        />

                        <ToggleSwitch
                            enabled={true}
                            onChange={() => { }}
                            label="Transaction Celebrations"
                            description="Show rocket bursts when staking or claiming rewards."
                        />

                        <InfoBox>
                            Tip: You can access the DeFi dashboard directly using the floating Nova icon on the main screen.
                        </InfoBox>
                    </>
                )

            case 'display':
                return (
                    <>
                        <SectionHeader icon="🎨" title="Theme" />
                        <SelectSetting
                            value={settings.appTheme}
                            onChange={(val) => updateSetting('appTheme', val)}
                            label="App Theme"
                            options={[
                                { value: 'dark', label: '🌙 Dark Mode' },
                                { value: 'light', label: '☀️ Light Mode' },
                                { value: 'system', label: '💻 System Default' },
                            ]}
                        />

                        <SectionHeader icon="♿" title="Accessibility" />
                        <ToggleSwitch
                            enabled={settings.reduceMotion}
                            onChange={() => updateSetting('reduceMotion', !settings.reduceMotion)}
                            label="Reduce Motion"
                            description="Minimize animations for accessibility and comfort."
                        />

                        <ToggleSwitch
                            enabled={settings.highContrast}
                            onChange={() => updateSetting('highContrast', !settings.highContrast)}
                            label="High Contrast Mode"
                            description="Increase visual clarity with higher contrast colors."
                        />

                        <SelectSetting
                            value={settings.textSize}
                            onChange={(val) => updateSetting('textSize', val)}
                            label="Text Size"
                            options={[
                                { value: 'small', label: 'A Small' },
                                { value: 'default', label: 'A Default' },
                                { value: 'large', label: 'A Large' },
                            ]}
                        />

                        <SectionHeader icon="📱" title="UI Behavior" />
                        <ToggleSwitch
                            enabled={settings.autoFadeEnabled}
                            onChange={() => updateSetting('autoFadeEnabled', !settings.autoFadeEnabled)}
                            label="Auto-Fade UI"
                            description="UI elements fade out after inactivity."
                        />

                        {settings.autoFadeEnabled && (
                            <SliderSetting
                                value={settings.fadeDelay}
                                onChange={(val) => updateSetting('fadeDelay', val)}
                                label="Fade Delay"
                                min={1000}
                                max={10000}
                                step={500}
                                unit="s"
                                displayValue={(settings.fadeDelay / 1000).toFixed(1)}
                            />
                        )}

                        <ToggleSwitch
                            enabled={settings.doubleClickToFade}
                            onChange={() => updateSetting('doubleClickToFade', !settings.doubleClickToFade)}
                            label="Double-Click to Fade"
                            description="Double-click any UI element to instantly hide it."
                        />

                        <ToggleSwitch
                            enabled={settings.showStockTicker}
                            onChange={() => updateSetting('showStockTicker', !settings.showStockTicker)}
                            label="Show Stock Ticker"
                            description="Display the scrolling ticker bar at the bottom."
                        />

                        <ToggleSwitch
                            enabled={settings.compactMode}
                            onChange={() => updateSetting('compactMode', !settings.compactMode)}
                            label="Compact Mode"
                            description="Use smaller UI elements for more screen space."
                        />
                    </>
                )

            case 'notify':
                return (
                    <>
                        {/* Scheduled Feature Notice */}
                        <div style={{
                            background: 'rgba(251, 191, 36, 0.1)',
                            border: '1px solid rgba(251, 191, 36, 0.3)',
                            borderRadius: 8,
                            padding: 12,
                            marginBottom: 16,
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: 11, color: '#fbbf24', fontWeight: 600 }}>
                                📅 Advanced Notifications — Scheduled for Phase 2
                            </div>
                            <div style={{ fontSize: 10, color: '#888', marginTop: 4 }}>
                                These features are disabled and will be available in the next minor release.
                            </div>
                        </div>

                        <SectionHeader icon="🔔" title="Alerts" />
                        <ToggleSwitch
                            enabled={settings.sentimentAlerts}
                            onChange={() => { }}
                            label="Sentiment Change Alerts"
                            description="Get notified when portfolio sentiment changes state."
                            futureFeature={true}
                            disabled={true}
                        />

                        <ToggleSwitch
                            enabled={settings.priceMovementAlerts}
                            onChange={() => { }}
                            label="Large Price Movement Alerts"
                            description="Alert when portfolio moves significantly."
                            futureFeature={true}
                            disabled={true}
                        />

                        <ToggleSwitch
                            enabled={settings.dailySummary}
                            onChange={() => { }}
                            label="Daily Summary"
                            description="Receive a daily portfolio summary notification."
                            futureFeature={true}
                            disabled={true}
                        />

                        <SectionHeader icon="🌙" title="Quiet Hours" />
                        <ToggleSwitch
                            enabled={settings.quietHoursEnabled}
                            onChange={() => { }}
                            label="Enable Quiet Hours"
                            description="Suppress notifications during specified times."
                            futureFeature={true}
                            disabled={true}
                        />

                        {settings.quietHoursEnabled && (
                            <div style={{ display: 'flex', gap: 10, padding: '10px 0' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ color: '#888', fontSize: 10, display: 'block', marginBottom: 4 }}>Start</label>
                                    <input
                                        type="time"
                                        value={settings.quietHoursStart}
                                        onChange={(e) => updateSetting('quietHoursStart', e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: 8,
                                            borderRadius: 6,
                                            background: '#1f2937',
                                            color: '#fff',
                                            border: '1px solid #374151',
                                            fontSize: 12
                                        }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ color: '#888', fontSize: 10, display: 'block', marginBottom: 4 }}>End</label>
                                    <input
                                        type="time"
                                        value={settings.quietHoursEnd}
                                        onChange={(e) => updateSetting('quietHoursEnd', e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: 8,
                                            borderRadius: 6,
                                            background: '#1f2937',
                                            color: '#fff',
                                            border: '1px solid #374151',
                                            fontSize: 12
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </>
                )

            case 'privacy':
                return (
                    <>
                        {/* Session Status */}
                        <div style={{
                            background: isGuest
                                ? 'rgba(251, 191, 36, 0.1)'
                                : 'rgba(34, 197, 94, 0.1)',
                            border: `1px solid ${isGuest ? 'rgba(251, 191, 36, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
                            borderRadius: 8,
                            padding: 12,
                            marginBottom: 16
                        }}>
                            <div style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: isGuest ? '#fbbf24' : '#4ade80',
                                marginBottom: 4
                            }}>
                                {isGuest ? '👤 Guest Mode' : '✓ Logged In'}
                            </div>
                            <div style={{ fontSize: 11, color: '#888' }}>
                                {isGuest
                                    ? 'Limited features. Settings will not be saved.'
                                    : authMethod === 'wallet'
                                        ? 'Connected via wallet'
                                        : `Signed in as ${userEmail || 'user'}`
                                }
                            </div>
                        </div>

                        <SectionHeader icon="🔒" title="Privacy" />
                        <ToggleSwitch
                            enabled={settings.hideBalances}
                            onChange={() => updateSetting('hideBalances', !settings.hideBalances)}
                            label="Hide Balances (Privacy Mode)"
                            description="Obscure portfolio values until you tap to reveal."
                        />

                        <ToggleSwitch
                            enabled={settings.blurOnSwitch}
                            onChange={() => updateSetting('blurOnSwitch', !settings.blurOnSwitch)}
                            label="Blur on App Switch"
                            description="Blur sensitive data when switching apps."
                        />

                        <SectionHeader icon="🔗" title="Wallet" />
                        <button
                            onClick={() => {
                                // Disconnect wallet logic would go here
                                console.log('[Settings] Disconnect wallet requested')
                            }}
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: 8,
                                color: '#ef4444',
                                fontSize: 12,
                                fontWeight: 500,
                                cursor: 'pointer',
                                marginTop: 8
                            }}
                        >
                            🔌 Disconnect Wallet
                        </button>

                        <SectionHeader icon="🗑️" title="Data" />
                        <button
                            onClick={() => {
                                clearCachedData()
                                showToast('🧹 Cached data cleared!')
                            }}
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: 'rgba(251, 191, 36, 0.1)',
                                border: '1px solid rgba(251, 191, 36, 0.3)',
                                borderRadius: 8,
                                color: '#fbbf24',
                                fontSize: 12,
                                fontWeight: 500,
                                cursor: 'pointer',
                                marginTop: 8
                            }}
                        >
                            🧹 Clear Cached Data
                        </button>

                        <SectionHeader icon="🚪" title="Session" />
                        <button
                            onClick={() => setShowLogoutConfirm(true)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: 'rgba(239, 68, 68, 0.15)',
                                border: '1px solid rgba(239, 68, 68, 0.4)',
                                borderRadius: 8,
                                color: '#ef4444',
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: 'pointer',
                                marginTop: 8
                            }}
                        >
                            🚪 Log Out
                        </button>
                        <p style={{
                            fontSize: 10,
                            color: '#555',
                            marginTop: 8,
                            textAlign: 'center'
                        }}>
                            Returns you to the login screen
                        </p>
                    </>
                )

            case 'advanced':
                return (
                    <>
                        <SectionHeader icon="⚙️" title="App Behavior" />
                        <ToggleSwitch
                            enabled={settings.backgroundKeepAlive}
                            onChange={() => updateSetting('backgroundKeepAlive', !settings.backgroundKeepAlive)}
                            label="Background Keep-Alive"
                            description="Prevent backend timeout during idle usage."
                        />

                        <ToggleSwitch
                            enabled={settings.offlineMode}
                            onChange={() => updateSetting('offlineMode', !settings.offlineMode)}
                            label="Offline Mode"
                            description="Use cached data when network is unavailable."
                        />

                        <SectionHeader icon="📅" title="Scheduled Features — Phase 3" />
                        <div style={{
                            background: 'rgba(99, 102, 241, 0.1)',
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                            borderRadius: 8,
                            padding: 10,
                            marginBottom: 12,
                            fontSize: 10,
                            color: '#888',
                            textAlign: 'center'
                        }}>
                            These features are scheduled for a future release.
                        </div>

                        <ToggleSwitch
                            enabled={featureFlags.volatilityAnimation}
                            onChange={() => setFeatureFlag('volatilityAnimation', !featureFlags.volatilityAnimation)}
                            label="Volatility-Based Animation"
                            description="Glow and speed influenced by market movements."
                        />

                        <ToggleSwitch
                            enabled={false}
                            onChange={() => { }}
                            label="Enhanced Orb Reactions"
                            description="Deeper visual nuance based on additional signals."
                            futureFeature={true}
                            disabled={true}
                        />

                        <ToggleSwitch
                            enabled={false}
                            onChange={() => { }}
                            label="AI Portfolio Insights"
                            description="Optional AI-generated portfolio commentary."
                            disabled={true}
                            futureFeature={true}
                        />

                        <SectionHeader icon="🔄" title="Reset" />
                        <button
                            onClick={() => {
                                if (confirm('Are you sure you want to reset ALL settings to defaults?')) {
                                    resetAllSettings()
                                    alert('All settings have been reset!')
                                }
                            }}
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: 'rgba(239, 68, 68, 0.15)',
                                border: '1px solid rgba(239, 68, 68, 0.4)',
                                borderRadius: 8,
                                color: '#ef4444',
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: 'pointer',
                                marginTop: 8
                            }}
                        >
                            ⚠️ Reset All Settings to Defaults
                        </button>

                        <InfoBox>
                            💡 Settings are automatically saved and will persist across sessions.
                        </InfoBox>
                    </>
                )

            case 'about':
                return (
                    <>
                        {/* App Info */}
                        <div style={{
                            textAlign: 'center',
                            padding: '20px 0 16px'
                        }}>
                            <div style={{ fontSize: 48, marginBottom: 8 }}>🔮</div>
                            <h2 style={{ margin: '0 0 4px', color: '#fff', fontSize: 24, fontWeight: 700 }}>ORB</h2>
                            <div style={{ color: '#888', fontSize: 12 }}>Version {appVersion}</div>
                        </div>

                        {/* Changelog */}
                        <SectionHeader icon="✨" title="What's New" />
                        <div style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 8,
                            padding: 12,
                            maxHeight: 150,
                            overflowY: 'auto'
                        }}>
                            {changelog && changelog[0] && (
                                <>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        marginBottom: 8
                                    }}>
                                        <span style={{
                                            background: '#22c55e',
                                            color: '#fff',
                                            padding: '2px 8px',
                                            borderRadius: 4,
                                            fontSize: 10,
                                            fontWeight: 600
                                        }}>
                                            v{changelog[0].version}
                                        </span>
                                        <span style={{ color: '#666', fontSize: 10 }}>{changelog[0].date}</span>
                                    </div>
                                    <ul style={{
                                        margin: 0,
                                        paddingLeft: 16,
                                        color: '#aaa',
                                        fontSize: 11,
                                        lineHeight: 1.6
                                    }}>
                                        {changelog[0].changes.slice(0, 4).map((change, i) => (
                                            <li key={i}>{change}</li>
                                        ))}
                                        {changelog[0].changes.length > 4 && (
                                            <li style={{ color: '#666' }}>+ {changelog[0].changes.length - 4} more...</li>
                                        )}
                                    </ul>
                                </>
                            )}
                        </div>

                        {/* Legal & Info */}
                        <SectionHeader icon="📜" title="Legal" />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <button
                                onClick={() => setShowLegalPage('privacy')}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: 8,
                                    color: '#aaa',
                                    fontSize: 12,
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <span>🔒 Privacy Policy</span>
                                <span style={{ color: '#666' }}>→</span>
                            </button>
                            <button
                                onClick={() => setShowLegalPage('terms')}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: 8,
                                    color: '#aaa',
                                    fontSize: 12,
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <span>📜 Terms of Service</span>
                                <span style={{ color: '#666' }}>→</span>
                            </button>
                            <button
                                onClick={() => setShowLegalPage('disclaimer')}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: 8,
                                    color: '#aaa',
                                    fontSize: 12,
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <span>⚠️ Disclaimer</span>
                                <span style={{ color: '#666' }}>→</span>
                            </button>
                        </div>

                        {/* Scheduled Features Roadmap */}
                        <SectionHeader icon="📅" title="Scheduled Features" />
                        <div style={{
                            background: 'rgba(251, 191, 36, 0.05)',
                            border: '1px solid rgba(251, 191, 36, 0.2)',
                            borderRadius: 8,
                            padding: 12,
                            marginBottom: 8
                        }}>
                            <div style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: '#fbbf24',
                                marginBottom: 8,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6
                            }}>
                                <span>Phase 2</span>
                                <span style={{
                                    fontSize: 9,
                                    color: '#888',
                                    fontWeight: 400
                                }}>Next minor release</span>
                            </div>
                            <ul style={{
                                margin: 0,
                                paddingLeft: 16,
                                color: '#888',
                                fontSize: 10,
                                lineHeight: 1.6
                            }}>
                                <li>Advanced Notification Controls</li>
                                <li>Volatility-Based Orb Animation</li>
                                <li>Sentiment Source Selection</li>
                                <li>Offline Enhancements</li>
                            </ul>
                        </div>
                        <div style={{
                            background: 'rgba(99, 102, 241, 0.05)',
                            border: '1px solid rgba(99, 102, 241, 0.2)',
                            borderRadius: 8,
                            padding: 12
                        }}>
                            <div style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: '#8b5cf6',
                                marginBottom: 8,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6
                            }}>
                                <span>Phase 3</span>
                                <span style={{
                                    fontSize: 9,
                                    color: '#888',
                                    fontWeight: 400
                                }}>Future release</span>
                            </div>
                            <ul style={{
                                margin: 0,
                                paddingLeft: 16,
                                color: '#888',
                                fontSize: 10,
                                lineHeight: 1.6
                            }}>
                                <li>AI Insights</li>
                                <li>Enhanced Orb Reactions</li>
                                <li>Changelog View</li>
                            </ul>
                        </div>

                        {/* Accessibility Info */}
                        <SectionHeader icon="♿" title="Accessibility" />
                        <InfoBox>
                            ORB supports screen readers, respects system motion preferences, and provides high contrast mode in Display settings.
                        </InfoBox>

                        {/* Security Notice */}
                        <SectionHeader icon="🛡️" title="Security" />
                        <div style={{
                            background: 'rgba(34, 197, 94, 0.1)',
                            border: '1px solid rgba(34, 197, 94, 0.3)',
                            borderRadius: 8,
                            padding: 12,
                            fontSize: 11,
                            color: '#4ade80',
                            lineHeight: 1.5
                        }}>
                            ✓ No private keys stored<br />
                            ✓ Read-only wallet connections<br />
                            ✓ Secure session handling<br />
                            ✓ Local-only settings storage
                        </div>

                        <div style={{
                            marginTop: 20,
                            padding: 12,
                            textAlign: 'center',
                            color: '#444',
                            fontSize: 10
                        }}>
                            Made with 💜 for crypto enthusiasts<br />
                            © 2024 ORB. All rights reserved.
                        </div>
                    </>
                )

            default:
                return null
        }
    }

    return (
        <>
            <button
                ref={buttonRef}
                onClick={() => { if (!isDragging) { setIsOpen(!isOpen); resetFadeTimer(); } }}
                onMouseDown={handleDragStart}
                onTouchStart={handleDragStart}
                onMouseEnter={resetFadeTimer}
                onDoubleClick={handleDoubleClick}
                style={toggleButtonStyle}
                title="Settings (drag to move)"
            >
                ⚙️
            </button>

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
                    padding: '16px 20px',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    position: 'sticky',
                    top: 0,
                    background: 'rgba(24,24,24,0.98)',
                    zIndex: 10,
                    backdropFilter: 'blur(10px)',
                }}>
                    <h3 style={{ margin: 0, color: '#fff', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                        ⚙️ Settings
                    </h3>
                    <button
                        onClick={() => setIsOpen(false)}
                        style={{ background: 'none', border: 'none', color: '#666', fontSize: 18, cursor: 'pointer', padding: 4 }}
                    >
                        ✕
                    </button>
                </div>

                {/* Tabs */}
                <div style={{
                    display: 'flex',
                    gap: 4,
                    padding: '12px 16px',
                    overflowX: 'auto',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    position: 'sticky',
                    top: 52,
                    background: 'rgba(24,24,24,0.98)',
                    zIndex: 9,
                }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: '6px 12px',
                                borderRadius: 6,
                                border: 'none',
                                background: activeTab === tab.id ? '#6366f1' : 'rgba(255,255,255,0.05)',
                                color: activeTab === tab.id ? '#fff' : '#888',
                                fontSize: 11,
                                fontWeight: 500,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                transition: 'all 0.2s'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div style={{ padding: '0 20px 20px' }}>
                    {renderTabContent()}
                </div>
            </div>

            {/* Toast Notification */}
            {toast && (
                <div style={{
                    position: 'fixed',
                    bottom: 100,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(0, 0, 0, 0.9)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 12,
                    padding: '12px 24px',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 500,
                    zIndex: 9999,
                    animation: 'toastSlideUp 0.3s ease',
                    pointerEvents: 'none'
                }}>
                    {toast}
                </div>
            )}

            {/* Toast Animation */}
            <style>{`
                @keyframes toastSlideUp {
                    from { 
                        opacity: 0; 
                        transform: translateX(-50%) translateY(20px); 
                    }
                    to { 
                        opacity: 1; 
                        transform: translateX(-50%) translateY(0); 
                    }
                }
            `}</style>

            {/* Logout Confirmation Dialog */}
            {showLogoutConfirm && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.8)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10000,
                    padding: 20
                }}>
                    <div style={{
                        background: 'linear-gradient(145deg, #1a1a1a, #252525)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 16,
                        padding: 24,
                        maxWidth: 320,
                        width: '100%',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: 40, marginBottom: 16 }}>🚪</div>
                        <h3 style={{
                            fontSize: 18,
                            fontWeight: 600,
                            margin: '0 0 12px',
                            color: '#fff'
                        }}>
                            Log out of ORB?
                        </h3>
                        <p style={{
                            fontSize: 13,
                            color: '#888',
                            margin: '0 0 24px',
                            lineHeight: 1.5
                        }}>
                            You can log back in anytime.
                        </p>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                style={{
                                    flex: 1,
                                    padding: '12px 16px',
                                    borderRadius: 8,
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    background: 'transparent',
                                    color: '#888',
                                    fontSize: 14,
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    setShowLogoutConfirm(false)
                                    setIsOpen(false)
                                    logout()
                                }}
                                style={{
                                    flex: 1,
                                    padding: '12px 16px',
                                    borderRadius: 8,
                                    border: 'none',
                                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                    color: '#fff',
                                    fontSize: 14,
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                Log Out
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Legal Pages Modal */}
            {showLegalPage && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.9)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10002,
                    padding: 20
                }}>
                    <div style={{
                        background: 'linear-gradient(145deg, #1a1a1a, #252525)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 16,
                        width: '100%',
                        maxWidth: 500,
                        maxHeight: '80vh',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '16px 20px',
                            borderBottom: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <h2 style={{ margin: 0, color: '#fff', fontSize: 16 }}>
                                {showLegalPage === 'privacy' && '🔒 Privacy Policy'}
                                {showLegalPage === 'terms' && '📜 Terms of Service'}
                                {showLegalPage === 'disclaimer' && '⚠️ Disclaimer'}
                            </h2>
                            <button
                                onClick={() => setShowLegalPage(null)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#666',
                                    fontSize: 18,
                                    cursor: 'pointer'
                                }}
                            >
                                ✕
                            </button>
                        </div>
                        <div style={{
                            padding: 20,
                            overflowY: 'auto',
                            color: '#aaa',
                            fontSize: 12,
                            lineHeight: 1.7
                        }}>
                            {showLegalPage === 'privacy' && (
                                <>
                                    <p><strong style={{ color: '#fff' }}>Last Updated:</strong> December 14, 2024</p>
                                    <h3 style={{ color: '#fff', marginTop: 16 }}>Data We Collect</h3>
                                    <p>ORB collects minimal, non-sensitive data:</p>
                                    <ul>
                                        <li>Wallet Addresses (read-only)</li>
                                        <li>Email (optional sign-in)</li>
                                        <li>Settings (stored locally)</li>
                                        <li>Anonymous usage data</li>
                                    </ul>
                                    <h3 style={{ color: '#fff', marginTop: 16 }}>What We Don't Collect</h3>
                                    <ul>
                                        <li>Private keys or seed phrases</li>
                                        <li>Transaction history</li>
                                        <li>Personal financial records</li>
                                    </ul>
                                    <h3 style={{ color: '#fff', marginTop: 16 }}>Your Rights</h3>
                                    <p>Delete your data anytime via Settings. Disconnect wallets at any time.</p>
                                </>
                            )}
                            {showLegalPage === 'terms' && (
                                <>
                                    <p><strong style={{ color: '#fff' }}>Last Updated:</strong> December 14, 2024</p>
                                    <h3 style={{ color: '#fff', marginTop: 16 }}>Service Description</h3>
                                    <p>ORB is a portfolio visualization tool. It is <strong style={{ color: '#fbbf24' }}>informational only</strong>.</p>
                                    <h3 style={{ color: '#fff', marginTop: 16 }}>Disclaimers</h3>
                                    <ul>
                                        <li><strong style={{ color: '#fff' }}>Not Financial Advice:</strong> ORB does not provide investment advice</li>
                                        <li><strong style={{ color: '#fff' }}>No Guarantees:</strong> Price data accuracy is not guaranteed</li>
                                    </ul>
                                    <h3 style={{ color: '#fff', marginTop: 16 }}>User Responsibilities</h3>
                                    <p>Keep your wallet credentials secure. ORB never asks for private keys.</p>
                                </>
                            )}
                            {showLegalPage === 'disclaimer' && (
                                <>
                                    <div style={{
                                        background: 'rgba(251, 191, 36, 0.1)',
                                        border: '1px solid rgba(251, 191, 36, 0.3)',
                                        borderRadius: 8,
                                        padding: 12,
                                        marginBottom: 16,
                                        textAlign: 'center'
                                    }}>
                                        <strong style={{ color: '#fbbf24' }}>⚠️ IMPORTANT: Please Read Carefully</strong>
                                    </div>
                                    <h3 style={{ color: '#fff' }}>Not Financial Advice</h3>
                                    <p>ORB is a <strong style={{ color: '#fff' }}>visualization tool only</strong>. Nothing in this app constitutes financial advice or investment recommendations.</p>
                                    <h3 style={{ color: '#fff', marginTop: 16 }}>Read-Only Access</h3>
                                    <p style={{ color: '#4ade80' }}><strong>ORB does not access or control user funds.</strong></p>
                                    <p>All wallet connections are read-only. We can only view public balance information.</p>
                                    <h3 style={{ color: '#fff', marginTop: 16 }}>User Responsibility</h3>
                                    <p>You are solely responsible for your investment decisions. Always do your own research (DYOR).</p>
                                </>
                            )}
                        </div>
                        <div style={{
                            padding: '12px 20px',
                            borderTop: '1px solid rgba(255,255,255,0.1)',
                            textAlign: 'center'
                        }}>
                            <span style={{ color: '#666', fontSize: 10 }}>
                                ORB v{appVersion} • © 2024
                            </span>
                        </div>
                    </div>
                </div>
            )
            }
        </>
    )
}
