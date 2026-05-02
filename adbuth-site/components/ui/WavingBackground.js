import { useEffect, useRef } from 'react';

export default function WavingBackground({ children }) {
    const canvasRef = useRef(null);
    const mouseRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let width, height;
        let animationFrameId;
        let time = 0;

        // Wave configuration
        // Wave configuration - Vibrant Neon Theme
        const waves = [
            { color: 'rgba(236, 72, 153, 0.5)', speed: 0.005, amplitude: 50, frequency: 0.002, offset: 0 }, // Pink
            { color: 'rgba(168, 85, 247, 0.5)', speed: 0.004, amplitude: 80, frequency: 0.0015, offset: 2 }, // Purple
            { color: 'rgba(56, 189, 248, 0.3)', speed: 0.006, amplitude: 60, frequency: 0.0025, offset: 4 }  // Cyan/Blue
        ];

        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };

        const drawWave = (wave) => {
            ctx.beginPath();
            // Start slightly below middle
            const baseHeight = height * 0.6;

            for (let x = 0; x <= width; x += 10) {
                // Interactivity: mouse influence
                const dx = x - mouseRef.current.x;
                const dy = baseHeight - mouseRef.current.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const interaction = Math.max(0, 1 - dist / 400) * 40; // 400px radius, 40px distinctness

                const y = baseHeight
                    + Math.sin(x * wave.frequency + time * wave.speed + wave.offset) * wave.amplitude
                    + Math.sin(x * wave.frequency * 2 + time * wave.speed * 1.5) * (wave.amplitude / 2)
                    + interaction;

                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }

            ctx.lineTo(width, height);
            ctx.lineTo(0, height);
            ctx.closePath();
            ctx.fillStyle = wave.color;
            ctx.fill();
        };

        const animate = () => {
            time += 1;
            ctx.clearRect(0, 0, width, height);

            // Premium Dark/Light Gradient Background
            // Use a dark purple/black theme for depth if the user asked for "shining" and "glassmorphism" usually looks better on dark/colored backgrounds
            // But the project seems to be light mode based on previous context ("bg-gray-50").
            // However, the "react-bits" request and "glassmorphism" usually implies a vibrant or dark background.
            // Let's use a rich gradient.
            // Premium Deep Dark Gradient
            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, '#020617'); // Very dark slate/blue (almost black)
            gradient.addColorStop(0.5, '#1e1b4b'); // Deep indigo
            gradient.addColorStop(1, '#4c1d95'); // Rich violet at bottom

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            waves.forEach(wave => drawWave(wave));
            animationFrameId = requestAnimationFrame(animate);
        };

        const handleMouseMove = (e) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };

        window.addEventListener('resize', resize);
        window.addEventListener('mousemove', handleMouseMove);

        resize();
        animate();

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div className="relative min-h-screen overflow-hidden text-white">
            <canvas
                ref={canvasRef}
                className="absolute inset-0 z-0 pointer-events-none"
            />
            <div className="relative z-10 w-full min-h-screen flex items-center justify-center p-4">
                {children}
            </div>
        </div>
    );
}
