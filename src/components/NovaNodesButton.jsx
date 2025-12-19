import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { useDraggable } from '../hooks/useDraggable';

const NovaNodesButton = () => {
    const { toggleNovaNodes, settings, isDarkMode } = useStore();
    const [isMobile, setIsMobile] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const containerRef = useRef(null);
    const { position, isDragging, handleDragStart, setPosition } = useDraggable(containerRef);

    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            setPosition({ x: null, y: null });
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => {
            window.removeEventListener('resize', checkMobile);
        };
    }, []);

    const styles = {
        container: {
            position: 'fixed',
            bottom: position.y !== null ? 'auto' : (isMobile ? 'calc(var(--safe-area-bottom, 0px) + 90px)' : '90px'), // Raised to clear ticker
            left: position.x !== null ? position.x : '20px',
            top: position.y !== null ? position.y : 'auto',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            opacity: 1, // Always visible
            pointerEvents: 'auto',
            transition: isDragging ? 'none' : 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            transform: isDragging ? 'none' : 'translateX(0)',
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none'
        },
        button: {
            width: '56px',
            height: '56px',
            borderRadius: '18px',
            background: isDarkMode ? 'rgba(20, 20, 25, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isHovered
                ? '0 20px 40px -10px rgba(189, 0, 255, 0.4)'
                : '0 10px 20px -5px rgba(0, 0, 0, 0.3)',
            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            transform: isHovered ? 'scale(1.1) translateY(-4px)' : 'scale(1)',
            overflow: 'hidden',
            position: 'relative'
        },
        glow: {
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at center, rgba(189, 0, 255, 0.3) 0%, transparent 70%)',
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.4s ease',
        },
        orb: {
            width: '24px',
            height: '24px',
            background: 'linear-gradient(135deg, #bd00ff, #ff0055)',
            borderRadius: '50%',
            boxShadow: '0 0 15px rgba(189, 0, 255, 0.6)',
            zIndex: 2,
            position: 'relative'
        },
        label: {
            color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
            fontSize: '12px',
            fontWeight: 800,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            opacity: isHovered ? 1 : 0,
            transform: isHovered ? 'translateX(0)' : 'translateX(-10px)',
            transition: 'all 0.4s ease',
            textShadow: isDarkMode ? '0 0 10px rgba(0,0,0,0.5)' : 'none',
            whiteSpace: 'nowrap',
            pointerEvents: 'none'
        }
    };

    return (
        <div
            ref={containerRef}
            style={styles.container}
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
        >
            <button
                onClick={() => { if (!isDragging) toggleNovaNodes(true) }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={styles.button}
                title="Nova Nodes Protocol"
            >
                <div style={styles.glow}></div>
                <div style={styles.orb}></div>
            </button>
            <span style={styles.label}>Nova Nodes</span>
        </div>
    );
};

export default NovaNodesButton;
