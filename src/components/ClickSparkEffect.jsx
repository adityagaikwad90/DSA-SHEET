import React, { useEffect, useRef } from 'react';

const SPARK_COLORS = ['#00b8a3', '#ffa116', '#38bdf8', '#fbbf24', '#ffffff'];

const ClickSparkEffect = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        // Respect prefers-reduced-motion
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId = null;
        let sparks = [];
        let ripples = [];

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

        const createBurst = (e) => {
            const x = e.clientX;
            const y = e.clientY;

            // 1. Expanding ripple wave (LeetCode teal / amber)
            ripples.push({
                x,
                y,
                radius: 4,
                maxRadius: 36 + Math.random() * 8,
                opacity: 0.75,
                lineWidth: 2,
                color: Math.random() > 0.5 ? '#00b8a3' : '#ffa116'
            });

            // 2. Burst of luminous neon sparks
            const count = 10 + Math.floor(Math.random() * 5);
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 2.2 + Math.random() * 3.8;
                const color = SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)];
                sparks.push({
                    x,
                    y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: 1.8 + Math.random() * 1.8,
                    alpha: 1,
                    decay: 0.022 + Math.random() * 0.02,
                    friction: 0.94,
                    color
                });
            }

            // Start loop if not already running
            if (!animationFrameId) {
                render();
            }
        };

        const render = () => {
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

            // Render Ripples
            for (let i = ripples.length - 1; i >= 0; i--) {
                const r = ripples[i];
                r.radius += (r.maxRadius - r.radius) * 0.15 + 0.5;
                r.opacity *= 0.88;

                if (r.opacity <= 0.01 || r.radius >= r.maxRadius) {
                    ripples.splice(i, 1);
                    continue;
                }

                ctx.save();
                ctx.beginPath();
                ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
                ctx.strokeStyle = r.color;
                ctx.globalAlpha = r.opacity;
                ctx.lineWidth = r.lineWidth;
                ctx.shadowColor = r.color;
                ctx.shadowBlur = 10;
                ctx.stroke();
                ctx.restore();
            }

            // Render Sparks
            for (let i = sparks.length - 1; i >= 0; i--) {
                const s = sparks[i];
                s.x += s.vx;
                s.y += s.vy;
                s.vx *= s.friction;
                s.vy = s.vy * s.friction + 0.04; // subtle downward drift
                s.alpha -= s.decay;

                if (s.alpha <= 0) {
                    sparks.splice(i, 1);
                    continue;
                }

                ctx.save();
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
                ctx.fillStyle = s.color;
                ctx.globalAlpha = Math.max(0, s.alpha);
                ctx.shadowColor = s.color;
                ctx.shadowBlur = 8;
                ctx.fill();
                ctx.restore();
            }

            if (ripples.length > 0 || sparks.length > 0) {
                animationFrameId = requestAnimationFrame(render);
            } else {
                ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
                animationFrameId = null;
            }
        };

        window.addEventListener('pointerdown', createBurst, { passive: true });

        return () => {
            window.removeEventListener('pointerdown', createBurst);
            window.removeEventListener('resize', handleResize);
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
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
                zIndex: 99999,
            }}
            aria-hidden="true"
        />
    );
};

export default ClickSparkEffect;
