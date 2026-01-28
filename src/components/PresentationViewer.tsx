import React from 'react';
import Reveal from 'reveal.js';
import Markdown from 'reveal.js/plugin/markdown/markdown.esm.js';
import Notes from 'reveal.js/plugin/notes/notes.esm.js';
import Math from 'reveal.js/plugin/math/math.esm.js';
import { parseMarkdownToSlides } from '../utils/markdownParser';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';

// Import reveal.js styles
import 'reveal.js/dist/reveal.css';

interface PresentationViewerProps {
    markdown: string;
    theme: string;
    globalAlignment?: 'center' | 'left';
    fontFamily?: string;
    onClose: () => void;
}

export const PresentationViewer: React.FC<PresentationViewerProps> = ({ markdown, theme, globalAlignment = 'center', fontFamily = 'Outfit', onClose }) => {
    const deckRef = React.useRef<HTMLDivElement>(null);
    const slides = React.useMemo(() => parseMarkdownToSlides(markdown), [markdown]);

    React.useEffect(() => {
        // Dynamically load theme CSS
        const linkId = 'reveal-theme';
        const customStyleId = 'reveal-custom-theme';
        const existingLink = document.getElementById(linkId);
        if (existingLink) existingLink.remove();
        const existingStyle = document.getElementById(customStyleId);
        if (existingStyle) existingStyle.remove();

        // 1. Determine base Reveal theme
        let baseTheme = theme;
        if (['presentify-dark', 'neon-nebula', 'cyber-midnight', 'minimal-glass'].includes(theme)) {
            baseTheme = theme === 'minimal-glass' ? 'white' : 'black';
        }

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `https://cdn.jsdelivr.net/npm/reveal.js/dist/theme/${baseTheme}.css`;
        link.id = linkId;
        document.head.appendChild(link);

        // 2. Apply Immersive Custom Overrides for ALL Themes
        const style = document.createElement('style');
        style.id = customStyleId;

        // Base styles with crisp rendering
        let customCss = `
            @keyframes orbit {
                0% { transform: translate(-10%, -10%) rotate(0deg); }
                50% { transform: translate(10%, 10%) rotate(180deg); }
                100% { transform: translate(-10%, -10%) rotate(360deg); }
            }
            @keyframes pulse-ring {
                0% { transform: scale(0.9); opacity: 0.15; }
                50% { transform: scale(1.1); opacity: 0.25; }
                100% { transform: scale(0.9); opacity: 0.15; }
            }
            @keyframes shimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }

            /* Force crisp text rendering */
            .reveal, .reveal * {
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                text-rendering: optimizeLegibility;
            }

            .reveal { 
                font-family: '${fontFamily}', system-ui, sans-serif !important; 
            }
            .reveal h1, .reveal h2, .reveal h3 { 
                font-family: '${fontFamily}', system-ui, sans-serif !important; 
                font-weight: 800 !important; 
                text-transform: none !important; 
                margin-bottom: 0.5em !important;
                letter-spacing: -0.02em;
            }
            .reveal p, .reveal li { 
                font-family: '${fontFamily}', system-ui, sans-serif !important; 
                line-height: 1.7 !important; 
            }

            /* Full viewport background - no shrinking */
            .reveal-viewport { 
                background: #000 !important;
                position: fixed !important;
                inset: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
            }

            /* Ensure slides don't clip backgrounds */
            .reveal .slides {
                background: transparent !important;
            }
            .reveal .slides > section,
            .reveal .slides > section > section {
                background: transparent !important;
            }

            /* Alignment classes */
            .reveal .align-left { text-align: left !important; }
            .reveal .align-left > * { text-align: left !important; }
            .reveal .align-left ul, .reveal .align-left ol { display: block; margin-left: 1em; }
        `;

        // Theme-specific immersive backgrounds
        if (theme === 'presentify-dark') {
            customCss += `
                .reveal-viewport { 
                    background: #050010 !important;
                    overflow: visible !important;
                }
                .presentify-aurora {
                    position: fixed;
                    inset: -100px;
                    width: calc(100% + 200px);
                    height: calc(100% + 200px);
                    background: 
                        radial-gradient(ellipse 80% 60% at 20% 30%, rgba(99, 102, 241, 0.5) 0%, transparent 60%),
                        radial-gradient(ellipse 70% 70% at 80% 70%, rgba(168, 85, 247, 0.45) 0%, transparent 60%),
                        radial-gradient(ellipse 60% 50% at 60% 20%, rgba(236, 72, 153, 0.4) 0%, transparent 50%);
                    filter: blur(60px);
                    animation: orbit 50s linear infinite;
                    z-index: 0;
                    pointer-events: none;
                }
                .reveal { position: relative; z-index: 1; }
                .reveal h1, .reveal h2 { 
                    background: linear-gradient(135deg, #a5b4fc 0%, #c4b5fd 50%, #f9a8d4 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    font-size: 3.2em !important;
                    filter: drop-shadow(0 4px 20px rgba(139, 92, 246, 0.3));
                }
                .reveal h3 { color: #e0e7ff !important; }
                .reveal p, .reveal li { color: #c7d2fe !important; }
            `;
        } else if (theme === 'neon-nebula') {
            customCss += `
                .reveal-viewport { 
                    background: linear-gradient(135deg, #0c0015 0%, #1a0a2e 50%, #0f051d 100%) !important;
                }
                .reveal-viewport::before {
                    content: '';
                    position: fixed;
                    inset: 0;
                    width: 100vw;
                    height: 100vh;
                    background: radial-gradient(circle at 50% 50%, rgba(219, 39, 119, 0.15) 0%, transparent 60%);
                    animation: pulse-ring 8s ease-in-out infinite;
                    z-index: 0;
                    pointer-events: none;
                }
                .reveal-viewport::after {
                    content: '';
                    position: fixed;
                    inset: 0;
                    background: radial-gradient(circle at 30% 70%, rgba(124, 58, 237, 0.2) 0%, transparent 50%);
                    z-index: 0;
                    pointer-events: none;
                }
                .reveal { position: relative; z-index: 1; }
                .reveal h1 { 
                    color: #fff !important;
                    text-shadow: 0 0 40px rgba(219, 39, 119, 0.8), 0 0 80px rgba(124, 58, 237, 0.5) !important;
                    font-size: 4em !important;
                }
                .reveal h2, .reveal h3 { color: #f9a8d4 !important; }
                .reveal p, .reveal li { color: #e9d5ff !important; }
            `;
        } else if (theme === 'cyber-midnight') {
            customCss += `
                .reveal-viewport { 
                    background: #030712 !important;
                }
                .reveal-viewport::before {
                    content: '';
                    position: fixed;
                    inset: 0;
                    background-image: 
                        linear-gradient(rgba(16, 185, 129, 0.03) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(16, 185, 129, 0.03) 1px, transparent 1px);
                    background-size: 60px 60px;
                    z-index: 0;
                    pointer-events: none;
                }
                .reveal-viewport::after {
                    content: '';
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 40%;
                    background: linear-gradient(to top, rgba(16, 185, 129, 0.05) 0%, transparent 100%);
                    z-index: 0;
                    pointer-events: none;
                }
                .reveal { position: relative; z-index: 1; }
                .reveal h1 { 
                    color: #34d399 !important;
                    font-family: 'JetBrains Mono', monospace !important;
                    text-shadow: 0 0 30px rgba(16, 185, 129, 0.5) !important;
                    font-size: 3.5em !important;
                    border-left: 6px solid #10b981;
                    padding-left: 24px !important;
                }
                .reveal h2, .reveal h3 { color: #6ee7b7 !important; }
                .reveal p, .reveal li { color: #a7f3d0 !important; }
            `;
        } else if (theme === 'blood') {
            customCss += `
                .reveal-viewport { 
                    background: radial-gradient(ellipse at center, #1a0000 0%, #000 100%) !important;
                }
                .reveal-viewport::before {
                    content: '';
                    position: fixed;
                    inset: -20%;
                    width: 140%;
                    height: 140%;
                    background: radial-gradient(circle at 50% 30%, rgba(127, 29, 29, 0.4) 0%, transparent 60%);
                    animation: pulse-ring 12s ease-in-out infinite;
                    z-index: 0;
                    pointer-events: none;
                }
                .reveal { position: relative; z-index: 1; }
                .reveal h1, .reveal h2 { 
                    color: #fca5a5 !important;
                    text-shadow: 0 0 40px rgba(220, 38, 38, 0.6) !important;
                    font-size: 3.5em !important;
                }
                .reveal h3 { color: #f87171 !important; }
                .reveal p, .reveal li { color: #fecaca !important; }
            `;
        } else if (theme === 'night') {
            customCss += `
                .reveal-viewport { 
                    background: linear-gradient(180deg, #020617 0%, #0f172a 100%) !important;
                }
                .reveal-viewport::before {
                    content: '';
                    position: fixed;
                    inset: -50%;
                    width: 200%;
                    height: 200%;
                    background: 
                        radial-gradient(circle at 15% 20%, rgba(30, 58, 138, 0.4) 0%, transparent 40%),
                        radial-gradient(circle at 85% 80%, rgba(23, 37, 84, 0.5) 0%, transparent 50%);
                    animation: orbit 80s linear infinite;
                    z-index: 0;
                    pointer-events: none;
                }
                .reveal { position: relative; z-index: 1; }
                .reveal h1 { 
                    color: #f8fafc !important;
                    text-shadow: 0 8px 30px rgba(0,0,0,0.5) !important;
                    filter: drop-shadow(0 0 20px rgba(56, 189, 248, 0.15));
                }
                .reveal h2, .reveal h3 { color: #e2e8f0 !important; }
                .reveal p, .reveal li { color: #cbd5e1 !important; }
            `;
        } else if (theme === 'moon') {
            customCss += `
                .reveal-viewport { 
                    background: radial-gradient(ellipse at 30% 20%, #1e293b 0%, #0f172a 100%) !important;
                }
                .reveal-viewport::before {
                    content: '';
                    position: fixed;
                    inset: 0;
                    background: radial-gradient(circle at 70% 30%, rgba(100, 116, 139, 0.15) 0%, transparent 50%);
                    z-index: 0;
                    pointer-events: none;
                }
                .reveal { position: relative; z-index: 1; }
                .reveal h1, .reveal h2 { color: #f1f5f9 !important; }
                .reveal h3 { color: #cbd5e1 !important; }
                .reveal p, .reveal li { color: #94a3b8 !important; }
            `;
        } else if (theme === 'minimal-glass' || theme === 'white') {
            customCss += `
                .reveal-viewport { 
                    background: linear-gradient(135deg, #fafafa 0%, #f1f5f9 50%, #e2e8f0 100%) !important;
                }
                .reveal-viewport::before {
                    content: '';
                    position: fixed;
                    inset: 0;
                    background: 
                        radial-gradient(circle at 10% 10%, rgba(99, 102, 241, 0.05) 0%, transparent 40%),
                        radial-gradient(circle at 90% 90%, rgba(168, 85, 247, 0.05) 0%, transparent 40%);
                    z-index: 0;
                    pointer-events: none;
                }
                .reveal { position: relative; z-index: 1; }
                .reveal h1 { 
                    color: #0f172a !important;
                    font-size: 4em !important;
                    letter-spacing: -0.03em;
                }
                .reveal h2, .reveal h3 { color: #1e293b !important; }
                .reveal p, .reveal li { color: #334155 !important; }
            `;
        } else if (theme === 'black') {
            customCss += `
                .reveal-viewport { 
                    background: radial-gradient(ellipse at center, #111 0%, #000 100%) !important;
                }
                .reveal { position: relative; z-index: 1; }
                .reveal h1, .reveal h2 { color: #fff !important; }
                .reveal h3 { color: #e5e5e5 !important; }
                .reveal p, .reveal li { color: #d4d4d4 !important; }
            `;
        }

        style.appendChild(document.createTextNode(customCss));
        document.head.appendChild(style);

        if (deckRef.current) {
            const deck = new Reveal(deckRef.current, {
                plugins: [Markdown, Notes, Math.KaTeX],
                width: 1920,
                height: 1080,
                margin: 0.08,
                minScale: 0.2,
                maxScale: 1.5,
                embedded: false,
                hash: true,
                mouseWheel: true,
                transition: 'slide',
                backgroundTransition: 'fade',
                markdown: {
                    notesSeparator: 'Note:'
                },
                center: globalAlignment === 'center',
                katex: {
                    version: 'latest',
                    delimiters: [
                        { left: '$$', right: '$$', display: true },
                        { left: '$', right: '$', display: false },
                        { left: '\\(', right: '\\)', display: false },
                        { left: '\\[', right: '\\]', display: true }
                    ],
                    ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code']
                }
            });

            deck.initialize().then(() => {
                deck.layout();
            });
        }

        return () => {
            const linkToRemove = document.getElementById(linkId);
            if (linkToRemove) linkToRemove.remove();
            const styleToRemove = document.getElementById(customStyleId);
            if (styleToRemove) styleToRemove.remove();
        };
    }, [theme, globalAlignment, fontFamily]);

    React.useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black"
        >
            {/* Aurora background for presentify-dark theme */}
            {theme === 'presentify-dark' && (
                <div className="presentify-aurora" />
            )}

            <button
                onClick={onClose}
                className="fixed top-6 right-6 z-[110] w-12 h-12 flex items-center justify-center bg-black/50 hover:bg-black/70 backdrop-blur-xl border border-white/10 rounded-xl text-white/70 hover:text-white transition-all hover:scale-105 active:scale-95"
                title="Exit (ESC)"
            >
                <X size={24} />
            </button>

            <div className="reveal h-full w-full" ref={deckRef}>
                <div className="slides">
                    {slides.map((slide, index) => (
                        slide.type === 'vertical' && slide.subSlides ? (
                            <section key={index}>
                                {slide.subSlides.map((sub, subIdx) => {
                                    const isLeft = sub.alignment === 'left' || globalAlignment === 'left';
                                    return (
                                        <section
                                            key={`${index}-${subIdx}`}
                                            data-markdown=""
                                            className={isLeft ? 'align-left' : ''}
                                        >
                                            <textarea
                                                data-template
                                                defaultValue={`${sub.content}${sub.notes ? `\n\nNote:\n${sub.notes}` : ''}`}
                                            />
                                        </section>
                                    );
                                })}
                            </section>
                        ) : (
                            <section
                                key={index}
                                data-markdown=""
                                className={(slide.alignment === 'left' || globalAlignment === 'left') ? 'align-left' : ''}
                            >
                                <textarea
                                    data-template
                                    defaultValue={`${slide.content}${slide.notes ? `\n\nNote:\n${slide.notes}` : ''}`}
                                />
                            </section>
                        )
                    ))}
                </div>
            </div>
        </motion.div>
    );
};
