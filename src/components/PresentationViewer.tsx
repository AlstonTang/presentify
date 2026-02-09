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
    globalTransition: string | 'none';
}

export const PresentationViewer: React.FC<PresentationViewerProps> = ({
    markdown,
    theme,
    globalAlignment = 'center',
    fontFamily = 'Outfit',
    onClose,
    initialIndices,
    globalTransition
}) => {
    const deckRef = React.useRef<HTMLDivElement>(null);
    const revealInstance = React.useRef<Reveal.Api | null>(null);
    const slides = React.useMemo(() => parseMarkdownToSlides(markdown, globalTransition), [markdown, globalTransition]);

    React.useEffect(() => {
        const linkId = 'reveal-theme';
        const customStyleId = 'reveal-custom-theme';

        // Cleanup existing styles
        [linkId, customStyleId].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });

        const themeConfig = getTheme(theme);
        const baseTheme = themeConfig.baseTheme || 'black';

        // 1. Load Base Theme
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `https://cdn.jsdelivr.net/npm/reveal.js/dist/theme/${baseTheme}.css`;
        link.id = linkId;
        document.head.appendChild(link);

        // 2. Custom Overrides
        const style = document.createElement('style');
        style.id = customStyleId;

        const customCss = `
            /* 1. VIEWPORT & LAYOUT */
            .reveal-viewport { 
                background: ${themeConfig.background} !important;
            }
        
            /* 2. TYPOGRAPHY */
            .reveal h1, .reveal h2 {
                font-family: '${fontFamily}', sans-serif !important;
                font-weight: 800 !important;
                text-transform: none !important;
                margin-bottom: 0.5em !important;
                color: ${themeConfig.headingColor} !important;
                ${themeConfig.headingGradient ? `
                    background: ${themeConfig.headingGradient} !important;
                    -webkit-background-clip: text !important;
                    -webkit-text-fill-color: transparent !important;
                    background-clip: text !important;
                    display: block; 
                ` : ''}
                ${themeConfig.textShadow ? `text-shadow: ${themeConfig.textShadow} !important;` : 'text-shadow: none !important;'}
            }
        
            .reveal h3, .reveal p, .reveal li, .reveal blockquote {
                color: ${themeConfig.textColor} !important;
                font-family: '${fontFamily}', sans-serif !important;
                line-height: 1.6 !important;
            }
        
            /* 3. ALIGNMENT HELPERS */
            .reveal .slides section.left-align h1,
            .reveal .slides section.left-align h2,
            .reveal .slides section.left-align h3,
            .reveal .slides section.left-align p,
            .reveal .slides section.left-align ul,
            .reveal .slides section.left-align ol {
                text-align: left !important;
                align-self: flex-start !important;
                width: 100%;
            }
        
            .reveal .slides section.left-align blockquote {
                text-align: left !important;
                margin-left: 0 !important;
                padding-left: 1em !important;
                width: 100% !important;
                box-shadow: none !important;
            }
        
            /* 4. FRAGMENT GHOST BULLET FIX */
            .reveal li.fragment:not(.visible) {
                visibility: hidden !important;
            }
            .reveal li:has(.fragment:not(.visible)) {
                list-style-type: none !important;
            }
            .reveal li:has(.fragment:not(.visible))::marker {
                color: transparent !important;
                content: "" !important;
            }

            /* 5. MERMAID FIX & ALIGNMENT */
            .reveal div.mermaid {
                background: transparent !important;
                border: none !important;
                box-shadow: none !important;
                display: flex !important;
                width: 100% !important;
                /* Default Center */
                justify-content: center !important; 
                align-items: center !important;
            }

            /* Mermaid Left Alignment Override */
            .reveal .slides section.left-align div.mermaid {
                justify-content: flex-start !important;
            }
            
            /* Ensure SVG scales nicely but respects container */
            .reveal div.mermaid svg {
                max-width: 100% !important;
                max-height: 80vh !important;
                height: auto !important;
            }
        
            ${themeConfig.customCss || ''}
        `;

        style.appendChild(document.createTextNode(customCss));
        document.head.appendChild(style);

        // --- MERMAID CONFIGURATION ---
        try {
            mermaid.mermaidAPI.reset();
        } catch (e) { }

        const mermaidTheme = themeConfig.baseTheme === 'white' ? 'default' : 'dark';

        mermaid.initialize({
            startOnLoad: false,
            theme: mermaidTheme,
            securityLevel: 'loose',
            fontFamily: fontFamily
        });

        const MermaidPlugin = {
            id: 'mermaid',
            init: (deck: any) => {
                const renderedNodes = new Set<HTMLElement>();

                const renderMermaid = async (nodes: HTMLElement[]) => {
                    if (nodes.length > 0) {
                        try {
                            await mermaid.run({ nodes });
                            deck.layout();
                        } catch (error) {
                            console.error("Mermaid rendering failed:", error);
                        }
                    }
                };

                deck.on('ready', async () => {
                    const revealEl = deck.getRevealElement();
                    const codeBlocks = revealEl.querySelectorAll('pre code.language-mermaid, pre code.mermaid');

                    const allNodes: HTMLElement[] = [];

                    codeBlocks.forEach((block: HTMLElement) => {
                        const pre = block.parentElement;
                        if (pre && pre.tagName === 'PRE') {
                            const div = document.createElement('div');
                            // Copy classes (including fragments) and index attributes
                            div.className = `mermaid ${pre.className}`;

                            // Transfer all other attributes (data-fragment-index, etc.)
                            Array.from(pre.attributes).forEach(attr => {
                                if (attr.name !== 'class') {
                                    div.setAttribute(attr.name, attr.value);
                                }
                            });

                            div.setAttribute('data-mermaid-src', block.textContent || '');
                            div.textContent = block.textContent;
                            pre.replaceWith(div);
                            allNodes.push(div);
                        }
                    });

                    // Update Reveal.js to recognize new fragments
                    if (allNodes.length > 0) {
                        deck.sync();
                    }

                    // Initial render for everything
                    await renderMermaid(allNodes);

                    // Mark nodes in the current slide as visibly rendered
                    const currentSlide = deck.getCurrentSlide();
                    if (currentSlide) {
                        const currentMermaids = currentSlide.querySelectorAll('.mermaid');
                        currentMermaids.forEach((n: any) => renderedNodes.add(n as HTMLElement));
                    }
                });

                deck.on('slidechanged', async (event: any) => {
                    const currentSlide = event.currentSlide;
                    const mermaidNodes = currentSlide.querySelectorAll('.mermaid');
                    const nodesToFix: HTMLElement[] = [];

                    mermaidNodes.forEach((node: any) => {
                        const htmlNode = node as HTMLElement;
                        if (!renderedNodes.has(htmlNode)) {
                            const src = htmlNode.getAttribute('data-mermaid-src');
                            if (src) {
                                htmlNode.textContent = src;
                                htmlNode.removeAttribute('data-processed');
                                nodesToFix.push(htmlNode);
                                renderedNodes.add(htmlNode);
                            }
                        }
                    });

                    if (nodesToFix.length > 0) {
                        await renderMermaid(nodesToFix);
                    }
                });
            }
        };

        if (deckRef.current) {
            const deck = new Reveal(deckRef.current, {
                plugins: [Markdown, Notes, Math.KaTeX, MermaidPlugin as any],
                width: 1920,
                height: 1080,
                margin: 0.1,
                center: globalAlignment === 'center',
                transition: globalTransition === 'none' ? 'none' : 'slide',
                hash: true,
                markdown: {
                    notesSeparator: 'Note:'
                }
            });

            deck.initialize().then(() => {
                if (initialIndices) {
                    deck.slide(initialIndices[0], initialIndices[1]);
                }
            });

            revealInstance.current = deck;
        }

        return () => {
            [linkId, customStyleId].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.remove();
            });
            if (revealInstance.current) {
                try { revealInstance.current.destroy(); } catch (e) { }
            }
        };
    }, [theme, globalAlignment, fontFamily, globalTransition, markdown]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 bg-black"
            style={{ background: getTheme(theme).background }}
        >
            <button
                onClick={onClose}
                className="fixed top-6 right-6 z-110 w-12 h-12 flex items-center justify-center bg-black/50 hover:bg-black/70 backdrop-blur-xl border border-white/10 rounded-xl text-white/70 hover:text-white transition-all"
            >
                <X size={24} />
            </button>

            <div className="reveal h-full w-full z-10" ref={deckRef}>
                <div className="slides">
                    {slides.map((slide, index) => (
                        <section key={index}>
                            {slide.type === 'vertical' && slide.subSlides ? (
                                slide.subSlides.map((sub, subIdx) => (
                                    <section
                                        key={`${index}-${subIdx}`}
                                        data-markdown=""
                                        className={(sub.alignment === 'left' || globalAlignment === 'left') ? 'left-align' : ''}
                                    >
                                        <textarea data-template defaultValue={sub.content} />
                                    </section>
                                ))
                            ) : (
                                <section
                                    key={index}
                                    data-markdown=""
                                    className={(slide.alignment === 'left' || globalAlignment === 'left') ? 'left-align' : ''}
                                >
                                    <textarea data-template defaultValue={slide.content} />
                                </section>
                            )}
                        </section>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};
