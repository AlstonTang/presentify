import React from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { getTheme } from '../utils/themes';
import { parseMarkdownToSlides } from '../utils/markdownParser';

// NOTE: heavy libs (reveal.js, plugins, mermaid, reveal css) are now loaded dynamically inside useEffect

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
    const revealInstance = React.useRef<any | null>(null); // changed to any to avoid static dependency
    const slides = React.useMemo(() => parseMarkdownToSlides(markdown, globalTransition), [markdown, globalTransition]);

    React.useEffect(() => {
        const linkId = 'reveal-theme';
        const customStyleId = 'reveal-custom-theme';
        const coreCssId = 'reveal-core-css';
        const highlightCssId = 'reveal-highlight-css';

        // Cleanup existing styles
        [linkId, customStyleId, coreCssId, highlightCssId].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });

        const themeConfig = getTheme(theme);
        const baseTheme = themeConfig.baseTheme || 'black';

        // Inject reveal core CSS and highlight theme only when needed
        const injectCss = (id: string, href: string) => {
            if (document.getElementById(id)) return;
            const l = document.createElement('link');
            l.rel = 'stylesheet';
            l.href = href;
            l.id = id;
            l.crossOrigin = '';
            document.head.appendChild(l);
        };

        injectCss(coreCssId, 'https://cdn.jsdelivr.net/npm/reveal.js/dist/reveal.css');
        injectCss(highlightCssId, 'https://cdn.jsdelivr.net/npm/reveal.js/plugin/highlight/monokai.css');

        // 1. Load Base Theme (kept same behavior, loaded from CDN)
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
            .reveal .slides section.left-align ol,
            .reveal .slides section.left-align table,
            .reveal .slides section.left-align blockquote {
                text-align: left !important;
                align-self: flex-start !important;
                width: 100%;
            }

            .reveal .slides section.left-align table {
                margin-left: 0 !important;
                margin-right: auto !important;
            }
        
            .reveal .slides section.left-align blockquote {
                margin-left: 0 !important;
                padding-left: 1.5rem !important;
                border-left: 4px solid rgba(255,255,255,0.2) !important;
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

            /* 6. CODE BLOCKS */
            .reveal pre, .reveal .code-wrapper {
                background: #1a1b26 !important;
                border-radius: 16px !important;
                padding: 0 !important; /* Padding moved to code element */
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important;
                width: 90% !important;
                margin: 1.5em auto !important;
                border: 1px solid rgba(255,255,255,0.08) !important;
                overflow: hidden !important;
                max-height: 800px !important;
                display: grid !important; /* Essential for perfect stacking */
                grid-template-areas: "stack" !important;
                position: relative !important;
            }

            .reveal .slides section.left-align pre {
                margin-left: 0 !important;
                width: 100% !important;
            }

            .reveal pre code, .reveal .code-wrapper code {
                grid-area: stack !important; /* Force overlap */
                padding: 2em 2.5em !important; /* Internal padding */
                font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace !important;
                font-size: 0.75em !important;
                line-height: 1.7 !important;
                background: transparent !important;
                border-radius: 8px !important;
                position: relative !important; /* Stacked relative to grid */
                box-sizing: border-box !important;
                transition: opacity 0.4s ease, visibility 0.4s ease !important;
                margin: 0 !important;
                width: 100% !important;
            }

            /* Absolute reset for fragments if plugin added it */
            .reveal pre code.fragment, .reveal .code-wrapper code.fragment {
                position: relative !important; /* Override absolute to stick to grid */
                top: auto !important;
                left: auto !important;
            }

            /* Prevent ghosting: When any highlight fragment is active, hide everything else */
            .reveal pre:has(code.fragment.visible) code:not(.current-fragment),
            .reveal .code-wrapper:has(code.fragment.visible) code:not(.current-fragment) {
                opacity: 0 !important;
                visibility: hidden !important;
                /* We don't use display: none to maintain layout sizing */
            }

            /* Fix stray '1' in nested tables */
            .reveal table.hljs-ln tr:has(table.hljs-ln) > td.hljs-ln-numbers {
                display: none !important;
            }

            /* Fix 'dim' code: Ensure non-focused lines are still very readable */
            .reveal pre code.has-highlights tr:not(.highlight-line) {
                opacity: 0.85 !important;
                filter: none !important;
            }

            /* Inline Code */
            .reveal :not(pre) > code {
                background: rgba(255, 255, 255, 0.1) !important;
                color: ${themeConfig.textColor} !important;
                padding: 0.1em 0.3em !important;
                border-radius: 6px !important;
                font-family: 'JetBrains Mono', monospace !important;
                font-size: 0.85em !important;
                word-wrap: break-word !important;
            }

            /* Line Highlighting Support */
            .reveal .hljs-ln-numbers {
                -webkit-touch-callout: none;
                -webkit-user-select: none;
                -khtml-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                user-select: none;
                text-align: right;
                color: #444;
                vertical-align: top;
                padding-right: 20px !important;
                min-width: 35px;
                border-right: 1px solid rgba(255,255,255,0.05) !important;
            }

            .reveal .hljs-ln-code {
                padding-left: 15px !important;
            }

            /* Scrollbar Styling for Code */
            .reveal pre::-webkit-scrollbar, .reveal .code-wrapper::-webkit-scrollbar {
                width: 10px;
                height: 10px;
            }
            .reveal pre::-webkit-scrollbar-track, .reveal .code-wrapper::-webkit-scrollbar-track {
                background: rgba(0,0,0,0.1);
                border-radius: 10px;
            }
            .reveal pre::-webkit-scrollbar-thumb, .reveal .code-wrapper::-webkit-scrollbar-thumb {
                background: rgba(255,255,255,0.1);
                border-radius: 10px;
                border: 2px solid #1a1b26;
            }
            .reveal pre::-webkit-scrollbar-thumb:hover, .reveal .code-wrapper::-webkit-scrollbar-thumb:hover {
                background: rgba(255,255,255,0.2);
            }
        
            ${themeConfig.customCss || ''}
        `;
        style.appendChild(document.createTextNode(customCss));
        document.head.appendChild(style);

        // Dynamically load reveal.js, plugins and mermaid
        let cancelled = false;
        (async () => {
            try {
                const [
                    RevealModule,
                    MarkdownMod,
                    NotesMod,
                    MathMod,
                    HighlightMod,
                    mermaidMod
                ] = await Promise.all([
                    import('reveal.js'),
                    import('reveal.js/plugin/markdown/markdown.esm.js'),
                    import('reveal.js/plugin/notes/notes.esm.js'),
                    import('reveal.js/plugin/math/math.esm.js'),
                    import('reveal.js/plugin/highlight/highlight.esm.js'),
                    import('mermaid').catch(() => null)
                ]);

                if (cancelled) return;

                const Reveal = (RevealModule as any).default ?? RevealModule;
                const Markdown = (MarkdownMod as any).default ?? MarkdownMod;
                const Notes = (NotesMod as any).default ?? NotesMod;
                const MathPlugin = (MathMod as any).default ?? MathMod;
                const Highlight = (HighlightMod as any).default ?? HighlightMod;
                const mermaid = mermaidMod ? ((mermaidMod as any).default ?? mermaidMod) : null;

                // MERMAID CONFIGURATION (if present)
                try {
                    if (mermaid && mermaid.mermaidAPI && mermaid.mermaidAPI.reset) {
                        mermaid.mermaidAPI.reset();
                    }
                } catch (e) {}

                const mermaidTheme = themeConfig.baseTheme === 'white' ? 'default' : 'dark';

                if (mermaid && mermaid.initialize) {
                    mermaid.initialize({
                        startOnLoad: false,
                        theme: mermaidTheme,
                        securityLevel: 'loose',
                        fontFamily: fontFamily
                    });
                }

                const MermaidPlugin = {
                    id: 'mermaid',
                    init: (deck: any) => {
                        const renderedNodes = new Set<HTMLElement>();

                        const renderMermaid = async (nodes: HTMLElement[]) => {
                            if (!mermaid) return;
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
                                    // Copy classes and attributes
                                    div.className = `mermaid ${pre.className}`;
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

                            if (allNodes.length > 0) deck.sync();
                            await renderMermaid(allNodes);

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
                        plugins: [Markdown, MermaidPlugin as any, Highlight, Notes, MathPlugin?.KaTeX].filter(Boolean),
                        width: 1920,
                        height: 1080,
                        margin: 0.1,
                        center: globalAlignment === 'center',
                        transition: globalTransition === 'none' ? 'none' : 'slide',
                        hash: true,
                        markdown: { notesSeparator: 'Note:' },
                        highlight: { highlightOnLoad: true, escapeHTML: false } as any
                    });

                    deck.initialize().then(() => {
                        if (initialIndices) {
                            deck.slide(initialIndices[0], initialIndices[1]);
                        }
                    });

                    revealInstance.current = deck;
                }
            } catch (err) {
                console.error('Failed to load presentation runtime:', err);
            }
        })();

        return () => {
            cancelled = true;
            [linkId, customStyleId, coreCssId, highlightCssId].forEach(id => {
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
                className="fixed top-6 right-6 z-110 w-12 h-12 flex items-center justify-center hover:bg-black/70 backdrop-blur-xl opacity-50 border border-white/10 rounded-xl text-white/70 hover:text-white transition-all"
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
                                        <textarea data-template defaultValue={sub.content} key={sub.content} />
                                    </section>
                                ))
                            ) : (
                                <section
                                    key={index}
                                    data-markdown=""
                                    className={(slide.alignment === 'left' || globalAlignment === 'left') ? 'left-align' : ''}
                                >
                                    <textarea data-template defaultValue={slide.content} key={slide.content} />
                                </section>
                            )}
                        </section>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};
