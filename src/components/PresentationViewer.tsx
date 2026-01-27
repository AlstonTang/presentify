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
    onClose: () => void;
}

export const PresentationViewer: React.FC<PresentationViewerProps> = ({ markdown, theme, globalAlignment = 'center', onClose }) => {
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

        let customCss = `
            @keyframes orbit {
                0% { transform: translate(-10%, -10%) rotate(0deg); }
                50% { transform: translate(10%, 10%) rotate(180deg); }
                100% { transform: translate(-10%, -10%) rotate(360deg); }
            }
            @keyframes pulse-ring {
                0% { transform: scale(0.8); opacity: 0.1; }
                50% { transform: scale(1.3); opacity: 0.2; }
                100% { transform: scale(0.8); opacity: 0.1; }
            }
            .reveal { font-family: 'Outfit', sans-serif !important; }
            .reveal h1, .reveal h2, .reveal h3 { 
                font-family: 'Outfit', sans-serif !important; 
                font-weight: 800 !important; 
                text-transform: none !important; 
                margin-bottom: 0.5em !important;
            }
            .reveal p, .reveal li { line-height: 1.6 !important; }
            .reveal-viewport { background: #000 !important; }

            /* Alignment classes */
            .reveal .align-left { text-align: left !important; }
            .reveal .align-left > * { text-align: left !important; }
            .reveal .align-left ul, .reveal .align-left ol { display: block; }
        `;

        if (theme === 'presentify-dark') {
            customCss += `
                .reveal-viewport { background: #010208 !important; }
                .reveal-viewport::before {
                    content: ''; position: fixed; inset: -100%;
                    background: radial-gradient(circle at 20% 30%, #4338ca 0%, transparent 40%),
                                radial-gradient(circle at 80% 70%, #7e22ce 0%, transparent 40%),
                                radial-gradient(circle at 50% 50%, #db2777 0%, transparent 40%);
                    filter: blur(150px); animation: orbit 40s linear infinite; z-index: -1; opacity: 0.4;
                }
                .reveal h1, .reveal h2 { 
                    background: linear-gradient(to right, #a5b4fc, #d8b4fe, #fb7185);
                    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                    font-size: 3.5em !important; filter: drop-shadow(0 0 30px rgba(139, 92, 246, 0.4));
                }
                .reveal section { background: rgba(255,255,255,0.02); backdrop-filter: blur(50px); border: 1px solid rgba(255,255,255,0.08); border-radius: 4rem; padding: 80px !important; box-shadow: 0 50px 100px -20px rgba(0,0,0,0.8); }
            `;
        } else if (theme === 'neon-nebula') {
            customCss += `
                .reveal-viewport { background: #050112 !important; }
                .reveal-viewport::before { content: ''; position: fixed; inset: 0; background: radial-gradient(circle at 50% 50%, #2e1065 0%, #050112 100%); z-index: -1; }
                .reveal-viewport::after { content: ''; position: fixed; width: 100vmax; height: 100vmax; top: 50%; left: 50%; transform: translate(-50%, -50%); background: radial-gradient(circle, #db2777 0%, transparent 70%); filter: blur(180px); animation: pulse-ring 20s ease-in-out infinite; opacity: 0.2; z-index: -1; }
                .reveal h1 { color: #fff !important; text-shadow: 0 0 20px #db2777, 0 0 50px #db2777, 0 0 100px #7e22ce !important; font-size: 4.5em !important; }
                .reveal section { background: transparent !important; }
            `;
        } else if (theme === 'cyber-midnight') {
            customCss += `
                .reveal-viewport { background: #010409 !important; }
                .reveal-viewport::before { content: ''; position: fixed; inset: 0; background-image: linear-gradient(rgba(16, 185, 129, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.05) 1px, transparent 1px); background-size: 80px 80px; z-index: -1; }
                .reveal h1 { color: #10b981 !important; font-family: 'JetBrains Mono', monospace !important; text-shadow: 0 0 20px rgba(16, 185, 129, 0.4) !important; font-size: 4em !important; border-left: 12px solid #10b981; padding-left: 30px !important; text-align: left !important; }
                .reveal section { border: 1px solid rgba(16, 185, 129, 0.2); background: rgba(1, 4, 9, 0.85); border-radius: 0.25rem; padding: 60px !important; }
            `;
        } else if (theme === 'blood') {
            customCss += `
                .reveal-viewport { background: #080000 !important; }
                .reveal-viewport::before {
                    content: ''; position: fixed; inset: -50%;
                    background: radial-gradient(circle at 50% 50%, #450a0a 0%, transparent 60%);
                    filter: blur(100px); animation: pulse-ring 10s ease-in-out infinite; z-index: -1;
                }
                .reveal h1, .reveal h2 { color: #f87171 !important; text-shadow: 0 0 30px rgba(220, 38, 38, 0.5) !important; font-size: 4em !important; }
                .reveal section { background: rgba(0,0,0,0.4); backdrop-filter: blur(20px); border: 1px solid rgba(220, 38, 38, 0.2); border-radius: 2rem; padding: 60px !important; }
            `;
        } else if (theme === 'night') {
            customCss += `
                .reveal-viewport { background: #020617 !important; }
                .reveal-viewport::before {
                    content: ''; position: fixed; inset: -100%;
                    background: radial-gradient(circle at 10% 10%, #1e3a8a 0%, transparent 40%), radial-gradient(circle at 90% 90%, #172554 0%, transparent 40%);
                    filter: blur(120px); animation: orbit 60s linear infinite; z-index: -1;
                }
                .reveal h1 { color: #f8fafc !important; text-shadow: 0 10px 30px rgba(0,0,0,0.5) !important; filter: drop-shadow(0 0 20px rgba(56, 189, 248, 0.2)); }
            `;
        } else if (theme === 'moon') {
            customCss += `
                .reveal-viewport { background: #0f172a !important; }
                .reveal-viewport::before {
                    content: ''; position: fixed; inset: 0; background: radial-gradient(circle at 50% 50%, #334155 0%, #0f172a 100%); z-index: -1;
                }
                .reveal section { background: rgba(255,255,255,0.03); backdrop-filter: blur(30px); border: 1px solid rgba(255,255,255,0.1); border-radius: 3rem; }
            `;
        } else if (theme === 'minimal-glass' || theme === 'white') {
            customCss += `
                .reveal-viewport { background: #fdfdfd !important; }
                .reveal-viewport::before { content: ''; position: fixed; inset: 0; background: radial-gradient(at 0% 0%, #f1f5f9 0, transparent 50%), radial-gradient(at 100% 100%, #e2e8f0 0, transparent 50%); z-index: -1; }
                .reveal section { background: rgba(255,255,255,0.6); backdrop-filter: blur(30px); border: 1px solid rgba(255,255,255,0.9); box-shadow: 0 60px 120px -30px rgba(0,0,0,0.08); border-radius: 5rem; padding: 100px !important; }
                .reveal h1 { color: #0f172a !important; font-size: 4.5em !important; letter-spacing: -3px; }
            `;
        }

        style.appendChild(document.createTextNode(customCss));
        document.head.appendChild(style);

        if (deckRef.current) {
            const deck = new Reveal(deckRef.current, {
                plugins: [Markdown, Notes, Math.KaTeX],
                width: 1920,
                height: 1080,
                margin: 0.1,
                minScale: 0.1,
                maxScale: 2.0,
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
                setTimeout(() => { deck.layout(); }, 100);
                setTimeout(() => { deck.layout(); }, 500);
            });
        }

        return () => {
            const linkToRemove = document.getElementById(linkId);
            if (linkToRemove) linkToRemove.remove();
            const styleToRemove = document.getElementById(customStyleId);
            if (styleToRemove) styleToRemove.remove();
        };
    }, [theme, globalAlignment]);

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
            className="fixed inset-0 z-[100] bg-black flex flex-col"
        >
            <div className="absolute top-8 right-8 z-[110] flex gap-3">
                <button
                    onClick={onClose}
                    className="w-14 h-14 flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-3xl border border-white/20 rounded-2xl text-white transition-all hover:scale-110 active:scale-90 shadow-2xl"
                    title="Exit Presentation"
                >
                    <X size={28} />
                </button>
            </div>

            <div className="reveal" ref={deckRef}>
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
