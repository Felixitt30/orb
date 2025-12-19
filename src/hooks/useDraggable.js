import { useState, useEffect, useCallback } from 'react';

export function useDraggable(ref, initialPosition = { x: null, y: null }) {
    const [position, setPosition] = useState(initialPosition);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const handleDragStart = useCallback((e) => {
        // Only drag from the primary mouse button
        if (e.button !== 0 && e.type !== 'touchstart') return;

        const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;

        if (ref.current) {
            const rect = ref.current.getBoundingClientRect();
            setDragOffset({
                x: clientX - rect.left,
                y: clientY - rect.top
            });
            setIsDragging(true);
        }
    }, [ref]);

    const handleDragMove = useCallback((e) => {
        if (!isDragging) return;

        const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

        setPosition({
            x: clientX - dragOffset.x,
            y: clientY - dragOffset.y
        });
    }, [isDragging, dragOffset]);

    const handleDragEnd = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleDragMove);
            window.addEventListener('mouseup', handleDragEnd);
            window.addEventListener('touchmove', handleDragMove, { passive: false });
            window.addEventListener('touchend', handleDragEnd);
        } else {
            window.removeEventListener('mousemove', handleDragMove);
            window.removeEventListener('mouseup', handleDragEnd);
            window.removeEventListener('touchmove', handleDragMove);
            window.removeEventListener('touchend', handleDragEnd);
        }
        return () => {
            window.removeEventListener('mousemove', handleDragMove);
            window.removeEventListener('mouseup', handleDragEnd);
            window.removeEventListener('touchmove', handleDragMove);
            window.removeEventListener('touchend', handleDragEnd);
        };
    }, [isDragging, handleDragMove, handleDragEnd]);

    return {
        position,
        isDragging,
        handleDragStart,
        setPosition
    };
}
