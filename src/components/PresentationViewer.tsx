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
    onClose: () => void;
}

export const PresentationViewer: React.FC<PresentationViewerProps> = ({ markdown, theme, onClose }) => {
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
        if (theme === 'presentify-dark' || theme === 'neon-nebula' || theme === 'cyber-midnight') baseTheme = 'black';
        if (theme === 'minimal-glass') baseTheme = 'white';

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `https://cdn.jsdelivr.net/npm/reveal.js/dist/theme/${baseTheme}.css`;
        link.id = linkId;
        document.head.appendChild(link);

        // 2. Apply Custom Overrides for Pro Themes
        if (['presentify-dark', 'neon-nebula', 'cyber-midnight', 'minimal-glass'].includes(theme)) {
            const style = document.createElement('style');
            style.id = customStyleId;

            let customCss = `
                .reveal { font-family: 'Outfit', sans-serif !important; }
                .reveal h1, .reveal h2, .reveal h3 { font-family: 'Outfit', sans-serif !important; font-weight: 800 !important; text-transform: none !important; }
            `;

            if (theme === 'presentify-dark') {
                customCss += `
                    .reveal-viewport { background: #050811 !important; }
                    .reveal-viewport::before { content: ''; position: fixed; inset: 0; background: radial-gradient(circle at 0% 0%, hsla(250, 84%, 15%, 0.4) 0%, transparent 50%), radial-gradient(circle at 100% 100%, hsla(280, 84%, 15%, 0.4) 0%, transparent 50%); pointer-events: none; }
                    .reveal h1, .reveal h2 { background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; filter: drop-shadow(0 0 30px rgba(139, 92, 246, 0.3)); }
                    .reveal section { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 2rem; padding: 2rem !important; }
                    .reveal p, .reveal li { color: #94a3b8 !important; }
                `;
            } else if (theme === 'neon-nebula') {
                customCss += `
                    .reveal-viewport { background: #0a0118 !important; }
                    .reveal h1, .reveal h2 { color: #fff !important; text-shadow: 0 0 10px #f0f, 0 0 20px #f0f, 0 0 40px #f0f !important; }
                    .reveal section { background: rgba(255, 0, 255, 0.02); border: 1px solid rgba(255, 0, 255, 0.1); border-radius: 2rem; box-shadow: 0 0 50px rgba(255, 0, 255, 0.05); }
                    .reveal p, .reveal li { color: #e0aaff !important; }
                `;
            } else if (theme === 'cyber-midnight') {
                customCss += `
                    .reveal-viewport { background: #020617 !important; }
                    .reveal h1, .reveal h2 { color: #10b981 !important; text-shadow: 0 0 15px rgba(16, 185, 129, 0.5) !important; font-family: 'JetBrains Mono', monospace !important; }
                    .reveal section { border-left: 4px solid #10b981; background: rgba(16, 185, 129, 0.05); padding-left: 3rem !important; }
                    .reveal p, .reveal li { color: #64748b !important; font-family: 'JetBrains Mono', monospace !important; }
                `;
            } else if (theme === 'minimal-glass') {
                customCss += `
                    .reveal-viewport { background: #f8fafc !important; }
                    .reveal h1, .reveal h2 { color: #0f172a !important; }
                    .reveal section { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(20px); border: 1px solid rgba(0, 0, 0, 0.05); border-radius: 1.5rem; box-shadow: 0 20px 50px rgba(0,0,0,0.05); }
                    .reveal p, .reveal li { color: #475569 !important; }
                `;
            }

            style.appendChild(document.createTextNode(customCss));
            document.head.appendChild(style);
        }

        if (deckRef.current) {
            const deck = new Reveal(deckRef.current, {
                plugins: [Markdown, Notes, Math.KaTeX],
                embedded: false,
                hash: true,
                mouseWheel: true,
                transition: 'slide',
                backgroundTransition: 'fade',
                markdown: {
                    notesSeparator: 'Note:'
                },
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
                // Force layout recalculation
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
    }, [theme]);

    // Close with Escape key
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
            <div className="absolute top-6 right-6 z-[110] flex gap-3">
                <button
                    onClick={onClose}
                    className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 rounded-2xl text-white transition-all hover:scale-110 active:scale-90 shadow-2xl"
                    title="Exit Presentation"
                >
                    <X size={24} />
                </button>
            </div>

            <div className="reveal" ref={deckRef}>
                <div className="slides">
                    {slides.map((slide, index) => (
                        <section key={index} data-markdown="">
                            <textarea
                                data-template
                                defaultValue={`${slide.content}${slide.notes ? `\n\nNote:\n${slide.notes}` : ''}`}
                            />
                        </section>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};
