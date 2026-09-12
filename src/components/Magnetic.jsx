import React, { useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * Magnetic Hover Wrapper:
 * Pulls the wrapped element subtly towards the cursor on hover with a smooth spring release.
 */
const Magnetic = ({ children, strength = 0.22, className = "", style = {} }) => {
    const ref = useRef(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const shouldReduceMotion = useReducedMotion();

    const handleMouseMove = (e) => {
        if (shouldReduceMotion || !ref.current) return;
        const { clientX, clientY } = e;
        const { left, top, width, height } = ref.current.getBoundingClientRect();
        const middleX = clientX - (left + width / 2);
        const middleY = clientY - (top + height / 2);

        // Cap offset to maximum 12px for subtle, non-distracting movement
        const rawX = middleX * strength;
        const rawY = middleY * strength;
        const clamp = (val, max) => Math.max(-max, Math.min(max, val));

        setPosition({ x: clamp(rawX, 12), y: clamp(rawY, 12) });
    };

    const handleMouseLeave = () => {
        setPosition({ x: 0, y: 0 });
    };

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            animate={{ x: position.x, y: position.y }}
            transition={{ type: "spring", stiffness: 320, damping: 22, mass: 0.4 }}
            className={`magnetic-wrapper ${className}`}
            style={{ display: 'inline-flex', ...style }}
        >
            {children}
        </motion.div>
    );
};

export default Magnetic;
