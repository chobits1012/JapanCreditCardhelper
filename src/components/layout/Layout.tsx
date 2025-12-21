import React, { useState, useEffect } from 'react';
import { Calculator, CreditCard, PieChart } from 'lucide-react';

type Tab = 'calculator' | 'cards' | 'progress';

interface LayoutProps {
    currentTab: Tab;
    onTabChange: (tab: Tab) => void;
    children: React.ReactNode;
}

export default function Layout({ currentTab, onTabChange, children }: LayoutProps) {
    const [scrollY, setScrollY] = useState(0);

    // Parallax Effect: Track scroll position
    useEffect(() => {
        const handleScroll = () => {
            setScrollY(window.scrollY);
        };

        // Passive listener for performance
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Horizontal Parallax Helper
    // Moves element Horizontally (X) based on Vertical Scroll (Y)
    const getHorizontalParallaxStyle = (factor: number) => ({
        transform: `translateX(${scrollY * factor}px)`,
        willChange: 'transform',
    });

    return (
        <div className="min-h-screen flex flex-col font-sans bg-stone-50/30">
            {/* Background Decorations (Scattered Sakura - Richer & More) */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                {/* 1. Ukiyo-e Mount Fuji (Middle Bottom - Layer 1) */}
                {/* Centered, slightly transparent base to blend with Seigaiha */}
                <svg
                    className="absolute bottom-[-20px] left-1/2 transform -translate-x-1/2 w-[160%] md:w-[70%] h-auto opacity-30 text-indigo-900 fill-current"
                    viewBox="0 0 1200 400"
                    preserveAspectRatio="none"
                >
                    {/* Mountain Base */}
                    <path d="M600 50 C 750 150, 950 380, 1200 400 H 0 C 250 380, 450 150, 600 50 Z" />
                    {/* Snow Cap */}
                    <path d="M600 50 C 640 80, 660 100, 680 120 L 650 110 L 630 140 L 600 110 L 570 140 L 550 110 L 520 120 C 540 100, 560 80, 600 50 Z" className="text-white opacity-90" />
                </svg>

                {/* 2. Ukiyo-e Mist (Suyari-gasumi) - (Layer 2 - Foreground Obscuring) */}
                {/* Top Mist - Framing - MOVES RIGHT ON SCROLL */}
                <svg
                    className="absolute top-0 left-0 w-full h-48 opacity-80 transition-transform duration-75 ease-out"
                    viewBox="0 0 800 200"
                    preserveAspectRatio="none"
                    style={getHorizontalParallaxStyle(0.5)}
                >
                    <path d="M0 60 Q 300 120, 800 40 V 0 H 0 Z" fill="url(#mistGradientGoldTop)" />
                    <defs>
                        <linearGradient id="mistGradientGoldTop" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#fcd34d" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#fcd34d" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                </svg>

                {/* Bottom Mist - Crossing Fuji Base - MOVES LEFT ON SCROLL - ENDLESS FEEL */}
                <svg
                    className="absolute bottom-10 -left-1/2 w-[200%] h-64 opacity-90 transition-transform duration-75 ease-out"
                    viewBox="0 0 1600 200"
                    preserveAspectRatio="none"
                    style={getHorizontalParallaxStyle(-0.3)}
                >
                    {/* Extended wavy path for seamless feel */}
                    <path d="M0 150 Q 400 100, 800 140 T 1600 120 V 200 H 0 Z" fill="url(#mistGradientIndigoBottom)" />
                    <defs>
                        <linearGradient id="mistGradientIndigoBottom" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#4338ca" stopOpacity="0.2" />
                            <stop offset="50%" stopColor="#fcd34d" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#4338ca" stopOpacity="0.1" />
                        </linearGradient>
                    </defs>
                </svg>

                {/* Scattered Sakura Petals - Diagonal Parallax (Falling) */}
                {/* Generating 20 petals with pseudo-random positions */}
                {Array.from({ length: 20 }).map((_, i) => {
                    // Pseudo-random based on index
                    const left = (i * 17) % 100;
                    const top = (i * 23) % 100;
                    const size = 10 + (i * 5) % 20;
                    const rotation = (i * 45) % 360;
                    const speed = 0.2 + ((i % 5) * 0.1);

                    return (
                        <div
                            key={i}
                            className="absolute pointer-events-none opacity-60"
                            style={{
                                left: `${left}%`,
                                top: `${top}%`,
                                width: `${size}px`,
                                height: `${size}px`,
                                /* Fix: Apply translate BEFORE rotate to ensure consistent global direction (Down/Left) */
                                transform: `translate(-${scrollY * speed}px, ${scrollY * speed}px) rotate(${rotation}deg)`,
                                transition: 'transform 0.1s ease-out',
                                willChange: 'transform'
                            }}
                        >
                            <svg viewBox="0 0 24 24" fill={i % 3 === 0 ? '#fb7185' : '#f472b6'} className="w-full h-full drop-shadow-sm">
                                <path d="M12 2C9 2 7 4 7 7c0 2 2 4 4 5 .5.25.5-.25 1 0 2 1 5 1 5-3 0-4-3-7-5-7z" />
                            </svg>
                        </div>
                    );
                })}

                {/* Additional Cluster - Top Right Corner (Dense) */}
                {/* Generating 15 more petals concentrated in top-right */}
                {/* Fix: Using deterministic math (pseudo-random) instead of Math.random() to prevent jitter on re-render */}
                {Array.from({ length: 15 }).map((_, i) => {
                    // Deterministic pseudo-random generation based on index 'i'
                    const offset = i * 137.5; // Golden angle approximation to spread values

                    // Left: 60-100% (Right side)
                    const left = 60 + ((offset * 11) % 40);

                    // Top: 0-40% (Top side)
                    const top = (offset * 7) % 40;

                    // Size: 8-23px
                    const size = 8 + ((offset * 3) % 15);

                    // Rotation: 0-360
                    const rotation = (offset * 5) % 360;

                    // Speed: 0.2-0.6 (Normalized gentle pace)
                    const speed = 0.2 + ((offset % 100) / 100) * 0.4;

                    return (
                        <div
                            key={`tr-${i}`}
                            className="absolute pointer-events-none opacity-60"
                            style={{
                                left: `${left}%`,
                                top: `${top}%`,
                                width: `${size}px`,
                                height: `${size}px`,
                                /* Consistent Diagonal Direction */
                                transform: `translate(-${scrollY * speed}px, ${scrollY * speed}px) rotate(${rotation}deg)`,
                                transition: 'transform 0.1s ease-out',
                                willChange: 'transform'
                            }}
                        >
                            <svg viewBox="0 0 24 24" fill={i % 2 === 0 ? '#fb7185' : '#fbcfe8'} className="w-full h-full drop-shadow-sm">
                                <path d="M12 2C9 2 7 4 7 7c0 2 2 4 4 5 .5.25.5-.25 1 0 2 1 5 1 5-3 0-4-3-7-5-7z" />
                            </svg>
                        </div>
                    );
                })}
            </div>

            {/* Main Content Area - Scrollable */}
            <main className="flex-1 overflow-y-auto pb-24 relative z-10 no-scrollbar">
                {children}
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none pb-safe-offset">
                <div className="max-w-md mx-auto px-4 pb-4 ptr-events-auto">
                    <div className="glass-nav rounded-full flex justify-around items-center h-16 pointer-events-auto">
                        <button
                            onClick={() => onTabChange('calculator')}
                            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-300 relative ${currentTab === 'calculator' ? 'text-indigo-900 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <div className={`absolute -top-1 w-8 h-1 bg-indigo-900 rounded-full transition-all duration-300 ${currentTab === 'calculator' ? 'opacity-100' : 'opacity-0'}`} />
                            <Calculator className={`w-5 h-5 transition-transform duration-300 ${currentTab === 'calculator' ? 'fill-indigo-100 stroke-indigo-900' : ''}`} />
                            <span className="text-[10px] font-bold tracking-wide">試算</span>
                        </button>

                        <button
                            onClick={() => onTabChange('cards')}
                            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-300 relative ${currentTab === 'cards' ? 'text-indigo-900 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <div className={`absolute -top-1 w-8 h-1 bg-indigo-900 rounded-full transition-all duration-300 ${currentTab === 'cards' ? 'opacity-100' : 'opacity-0'}`} />
                            <CreditCard className={`w-5 h-5 transition-transform duration-300 ${currentTab === 'cards' ? 'fill-indigo-100 stroke-indigo-900' : ''}`} />
                            <span className="text-[10px] font-bold tracking-wide">卡片</span>
                        </button>

                        <button
                            onClick={() => onTabChange('progress')}
                            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-300 relative ${currentTab === 'progress' ? 'text-indigo-900 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <div className={`absolute -top-1 w-8 h-1 bg-indigo-900 rounded-full transition-all duration-300 ${currentTab === 'progress' ? 'opacity-100' : 'opacity-0'}`} />
                            <PieChart className={`w-5 h-5 transition-transform duration-300 ${currentTab === 'progress' ? 'fill-indigo-100 stroke-indigo-900' : ''}`} />
                            <span className="text-[10px] font-bold tracking-wide">進度</span>
                        </button>
                    </div>
                </div>
            </nav>
        </div>
    );
}
