import React, { useEffect, useRef } from 'react';

const CELEBRATION_COLORS = [
    '#10b981', // Emerald Success
    '#34d399', // Mint
    '#a855f7', // Brand Purple
    '#ec4899', // Brand Pink
    '#f59e0b', // Gold Amber
    '#fbbf24', // Bright Gold
    '#60a5fa', // Electric Blue
];

const RewardCelebration = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let particles = [];
        let animationFrameId = null;

        const handleResize = () => {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            canvas.style.width = `${window.innerWidth}px`;
            canvas.style.height = `${window.innerHeight}px`;
            ctx.scale(dpr, dpr);
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        const onCelebration = (e) => {
            const { x, y } = e.detail || {};
            const originX = x || window.innerWidth / 2;
            const originY = y || window.innerHeight / 2;

            // Spawn confetti and star sparkle particles
            const count = 35 + Math.floor(Math.random() * 15);
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 3.5 + Math.random() * 6.5;
                const isRect = Math.random() > 0.4; // Mix of confetti ribbons and glowing circular sparks
                particles.push({
                    x: originX,
                    y: originY,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 1.5, // initial upward lift
                    gravity: 0.16 + Math.random() * 0.08,
                    friction: 0.96,
                    color: CELEBRATION_COLORS[Math.floor(Math.random() * CELEBRATION_COLORS.length)],
                    size: isRect ? 4 + Math.random() * 4 : 2 + Math.random() * 2.5,
                    length: isRect ? 7 + Math.random() * 5 : 0,
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.2,
                    alpha: 1,
                    decay: 0.014 + Math.random() * 0.012,
                    isRect
                });
            }

            if (!animationFrameId) {
                render();
            }
        };

        const render = () => {
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.vx *= p.friction;
                p.vy = p.vy * p.friction + p.gravity;
                p.rotation += p.rotationSpeed;
                p.alpha -= p.decay;

                if (p.alpha <= 0 || p.y > window.innerHeight + 50) {
                    particles.splice(i, 1);
                    continue;
                }

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                ctx.globalAlpha = Math.max(0, p.alpha);
                ctx.fillStyle = p.color;

                if (p.isRect) {
                    ctx.fillRect(-p.size / 2, -p.length / 2, p.size, p.length);
                } else {
                    ctx.shadowColor = p.color;
                    ctx.shadowBlur = 6;
                    ctx.beginPath();
                    ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.restore();
            }

            if (particles.length > 0) {
                animationFrameId = requestAnimationFrame(render);
            } else {
                ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
                animationFrameId = null;
            }
        };

        window.addEventListener('milestone-celebration', onCelebration);

        return () => {
            window.removeEventListener('milestone-celebration', onCelebration);
            window.removeEventListener('resize', handleResize);
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                pointerEvents: 'none',
                zIndex: 999999,
            }}
            aria-hidden="true"
        />
    );
};

export default RewardCelebration;
