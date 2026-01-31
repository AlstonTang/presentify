import React from 'react';
import Reveal from 'reveal.js';
import Markdown from 'reveal.js/plugin/markdown/markdown.esm.js';
import Notes from 'reveal.js/plugin/notes/notes.esm.js';
import Math from 'reveal.js/plugin/math/math.esm.js';
import { parseMarkdownToSlides } from '../utils/markdownParser';
import mermaid from 'mermaid';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { getTheme } from '../utils/themes';

// Import reveal.js styles
import 'reveal.js/dist/reveal.css';

interface PresentationViewerProps {
    markdown: string;
    theme: string;
    globalAlignment?: 'center' | 'left';
    fontFamily?: string;
    onClose: () => void;
    initialIndices?: [number, number];
}

export const PresentationViewer: React.FC<PresentationViewerProps> = ({
    markdown,
    theme,
    globalAlignment = 'center',
    fontFamily = 'Outfit',
    onClose,
    initialIndices
}) => {
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

        // 1. Determine base Reveal theme from config
        const themeConfig = getTheme(theme);
        const baseTheme = themeConfig.baseTheme || 'black';

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

        // Theme-specific immersive backgrounds - Using centralized ThemeConfig

        customCss += `
            .reveal-viewport { 
                background: ${themeConfig.revealBg} !important;
                /* Ensure full viewport usage */
                ${themeConfig.id !== 'black' ? 'overflow: visible !important;' : ''}
            }
            
            .reveal { position: relative; z-index: 1; }
            
            .reveal h1, .reveal h2 { 
                 ${themeConfig.revealHeadingColor ? `color: ${themeConfig.revealHeadingColor} !important;` : ''}
                 ${themeConfig.revealHeadingGradient ? `
                    background: ${themeConfig.revealHeadingGradient};
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                 ` : ''}
                 ${themeConfig.revealTextShadow ? `text-shadow: ${themeConfig.revealTextShadow} !important;` : ''}
            }
            
            ${themeConfig.revealTextColor ? `.reveal h3, .reveal p, .reveal li { color: ${themeConfig.revealTextColor} !important; }` : ''}

            ${themeConfig.customCss || ''}
        `;


        style.appendChild(document.createTextNode(customCss));
        document.head.appendChild(style);

        // 3. Initialize Mermaid
        const mermaidTheme = themeConfig.baseTheme === 'white' ? 'default' : 'dark';
        mermaid.initialize({ startOnLoad: false, theme: mermaidTheme });

        const MermaidPlugin = {
            id: 'mermaid',
            init: (deck: any) => {
                const initAllSlides = () => {
                    const revealEl = deck.getRevealElement();
                    const codeBlocks = revealEl.querySelectorAll('pre code.language-mermaid, pre code.mermaid');
                    codeBlocks.forEach((block: HTMLElement) => {
                        const pre = block.parentElement;
                        if (pre && pre.tagName === 'PRE') {
                            const div = document.createElement('div');
                            div.className = 'mermaid';
                            div.setAttribute('data-rendered', 'false');

                            // Check for size directive: %% size: 50% or %% size: 1.5x
                            let content = block.textContent || '';
                            const sizeMatch = content.match(/^\s*%% ?size:\s*([^\n\r]+)/m);
                            if (sizeMatch) {
                                const sizeVal = sizeMatch[1].trim();
                                if (sizeVal.toLowerCase().endsWith('x')) {
                                    div.setAttribute('data-scale', sizeVal.slice(0, -1));
                                } else {
                                    div.style.width = sizeVal;
                                    div.style.maxWidth = 'none';
                                }
                                div.style.margin = '0 auto';
                                div.style.display = 'block';
                                // Remove the directive line
                                content = content.replace(/^\s*%% ?size:\s*[^\n\r]+(\r\n|\n|\r)?/, '');
                            } else {
                                div.style.width = '100%';
                                div.style.textAlign = 'center';
                            }

                            div.textContent = content;
                            pre.replaceWith(div);
                        }
                    });
                };

                const renderVisibleSlides = async () => {
                    const slide = deck.getCurrentSlide();
                    if (!slide) return;
                    const nodes = Array.from(slide.querySelectorAll('.mermaid[data-rendered="false"]')) as HTMLElement[];
                    if (nodes.length > 0) {
                        nodes.forEach(n => n.setAttribute('data-rendered', 'processing'));
                        try {
                            await mermaid.run({ nodes });
                            nodes.forEach(n => {
                                const svg = n.querySelector('svg');
                                if (svg) {
                                    svg.style.maxWidth = 'none';
                                    const scale = n.getAttribute('data-scale');
                                    if (scale) {
                                        svg.style.transform = `scale(${scale})`;
                                        svg.style.transformOrigin = 'center top';
                                    } else {
                                        svg.style.width = '100%';
                                        svg.style.height = 'auto';
                                    }
                                }
                                n.setAttribute('data-rendered', 'true');
                            });
                        } catch (err) {
                            console.error('Mermaid error', err);
                            nodes.forEach(n => n.setAttribute('data-rendered', 'error'));
                        }
                    }
                };

                deck.on('ready', () => {
                    initAllSlides();
                    renderVisibleSlides();
                });

                deck.on('slidechanged', () => {
                    renderVisibleSlides();
                });
            }
        };

        if (deckRef.current) {
            const deck = new Reveal(deckRef.current, {
                plugins: [Markdown, Notes, Math.KaTeX, MermaidPlugin as any],
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
                if (initialIndices) {
                    deck.slide(initialIndices[0], initialIndices[1]);
                }
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
            {/* Theme background effects - rendered as real DOM elements */}{getTheme(theme).bgEffectClass && (
                <div className={getTheme(theme).bgEffectClass} />
            )}
            {getTheme(theme).bgEffectClass2 && (
                <div className={getTheme(theme).bgEffectClass2} />
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
