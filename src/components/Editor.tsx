import React from 'react';
import {
    ArrowLeft,
    Save,
    Eye,
    Check,
    AlignLeft,
    AlignCenter,
    Copy,
    Sidebar as SidebarIcon,
    Download,
    FileText,
    Presentation as PresentationIcon,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { type Presentation, type SlideContent } from '../types';
import { FontSelector } from './FontSelector';
import { ThemeSelector } from './ThemeSelector';
import { TransitionSelector } from './TransitionSelector';
import { motion, AnimatePresence } from 'framer-motion';
import { parseMarkdownToSlides } from '../utils/markdownParser';
import { storage } from '../utils/storage';
import pptxgen from 'pptxgenjs';
import { getTheme } from '../utils/themes';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface EditorProps {
    presentation: Presentation;
    onSave: (presentation: Presentation) => void;
    onBack: () => void;
    onPresent: (indices?: [number, number]) => void;
}

export const Editor: React.FC<EditorProps> = ({ presentation, onSave, onBack, onPresent }) => {
    const [markdown, setMarkdown] = React.useState(presentation.markdown);
    const [title, setTitle] = React.useState(presentation.title);
    const [theme, setTheme] = React.useState(presentation.theme || 'black');
    const [globalAlignment, setGlobalAlignment] = React.useState<'center' | 'left'>(presentation.globalAlignment || 'center');
    const [fontFamily, setFontFamily] = React.useState(presentation.fontFamily || 'Tahoma');
    const [globalTransition, setGlobalTransition] = React.useState(presentation.globalTransition || 'none');
    const [showGuide, setShowGuide] = React.useState(false);
    const [showPreview, setShowPreview] = React.useState(true);
    const [isSaved, setIsSaved] = React.useState(false);

    const [showExportMenu, setShowExportMenu] = React.useState(false);
    const [currentPreviewSlide, setCurrentPreviewSlide] = React.useState(0);
    const [lastInteraction, setLastInteraction] = React.useState<'cursor' | 'preview'>('cursor');
    const settings = React.useMemo(() => storage.getSettings(), []);


    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const gutterRef = React.useRef<HTMLDivElement>(null);

    const lineCount = markdown.split('\n').length;

    // Track if there are unsaved changes
    const hasChanges = React.useMemo(() => {
        return markdown !== presentation.markdown ||
            title !== presentation.title ||
            theme !== presentation.theme ||
            globalAlignment !== presentation.globalAlignment ||
            fontFamily !== presentation.fontFamily ||
            globalTransition !== presentation.globalTransition;
    }, [markdown, title, theme, globalAlignment, globalTransition, fontFamily, presentation]);

    // Parse slides for preview
    const slides = React.useMemo(() => {
        const parsed = parseMarkdownToSlides(markdown);
        // Flatten vertical slides for preview
        const flat: (SlideContent & { isSubSlide?: boolean })[] = [];
        parsed.forEach(slide => {
            if (slide.type === 'vertical' && slide.subSlides) {
                slide.subSlides.forEach((sub, idx) => {
                    flat.push({ ...sub, isSubSlide: idx > 0 });
                });
            } else {
                flat.push(slide);
            }
        });
        return flat;
    }, [markdown]);

    // Map flat preview slide index to [H, V] indices for Reveal
    const getIndicesForPreview = (flatIdx: number): [number, number] => {
        const parsed = parseMarkdownToSlides(markdown);
        let count = 0;
        for (let h = 0; h < parsed.length; h++) {
            const slide = parsed[h];
            if (slide.type === 'vertical' && slide.subSlides) {
                for (let v = 0; v < slide.subSlides.length; v++) {
                    if (count === flatIdx) return [h, v];
                    count++;
                }
            } else {
                if (count === flatIdx) return [h, 0];
                count++;
            }
        }
        return [0, 0];
    };

    const findSlideAtLine = (line: number): [number, number] => {
        const parsed = parseMarkdownToSlides(markdown);
        for (let h = 0; h < parsed.length; h++) {
            const slide = parsed[h];
            if (slide.type === 'vertical' && slide.subSlides) {
                for (let v = 0; v < slide.subSlides.length; v++) {
                    const sub = slide.subSlides[v];
                    if (sub.sourceLineRange && line >= sub.sourceLineRange[0] && line <= sub.sourceLineRange[1]) {
                        return [h, v];
                    }
                }
            } else if (slide.sourceLineRange && line >= slide.sourceLineRange[0] && line <= slide.sourceLineRange[1]) {
                return [h, 0];
            }
        }
        return [0, 0];
    };


    const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
        if (gutterRef.current) {
            gutterRef.current.scrollTop = e.currentTarget.scrollTop;
        }
    };

    const handleSave = () => {
        onSave({ ...presentation, title, markdown, theme, globalAlignment, fontFamily, globalTransition });
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    const exportToPDF = () => {
        const themeConfig = getTheme(theme);
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const renderMarkdownToHtml = (content: string, slideAlignment: 'center' | 'left') => {
            let html = content.trim();
            const blocks: string[] = [];

            // Helper to add block and return placeholder
            const addBlock = (content: string) => {
                const placeholder = `<!-- BLOCK_PLACEHOLDER_${blocks.length} -->`;
                blocks.push(content);
                return placeholder;
            };

            const applyInlineMarkdown = (text: string) => {
                return text
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .replace(/`(.*?)`/g, '<code style="background: rgba(255,255,255,0.12); padding: 3px 8px; border-radius: 6px; font-family: monospace; font-size: 0.9em;">$1</code>')
                    .replace(/\[(.*?)\]\((.*?)\)/g, `<a href="$2" style="color: ${themeConfig.headingColor}; text-decoration: underline;">$1</a>`)
                    .replace(/\$([^$]+)\$/g, (_, math) => {
                        try {
                            return katex.renderToString(math, { throwOnError: false });
                        } catch (e) {
                            return math;
                        }
                    });
            };

            // 0. Extract Math Blocks ($$)
            html = html.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
                try {
                    const rendered = katex.renderToString(math, { displayMode: true, throwOnError: false });
                    return addBlock(`<div style="margin: 30px 0; font-size: 24px;">${rendered}</div>`);
                } catch (e) {
                    return addBlock(`<div style="margin: 30px 0;">${math}</div>`);
                }
            });

            // 1. Extract Code Blocks (Handle Reveal.js highlights like [1-5|6-7])
            html = html.replace(/```(\w*)(\s*\[.*?\])?\n([\s\S]*?)```/g, (_, _lang, _highlights, code) => {
                return addBlock(`
                    <div class="block-code" style="background: rgba(0,0,0,0.4); padding: 30px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); font-family: 'JetBrains Mono', monospace; font-size: 18px; margin: 30px 0; white-space: pre-wrap; text-align: left; color: #e0e0e0; box-shadow: 0 15px 40px rgba(0,0,0,0.5);">${code.trim()}</div>
                `);
            });

            // 2. Extract Tables
            const tableRegex = /^\|.*\|$\n^\|[- |]*\|$(?:\n^\|.*\|$)+/gm;
            html = html.replace(tableRegex, (match) => {
                const rows = match.trim().split('\n');
                const headerRow = rows[0];
                const bodyRows = rows.slice(2);

                const parseRow = (row: string) => {
                    const cells = [];
                    let current = '';
                    let depth = 0;
                    for (let i = 0; i < row.length; i++) {
                        if (row[i] === '[' || row[i] === '(') depth++;
                        if (row[i] === ']' || row[i] === ')') depth--;
                        if (row[i] === '|' && depth === 0) {
                            cells.push(current);
                            current = '';
                        } else {
                            current += row[i];
                        }
                    }
                    cells.push(current);
                    return cells
                        .filter((_, i, arr) => i > 0 && i < arr.length - 1)
                        .map(c => applyInlineMarkdown(c.trim()));
                };

                const headers = parseRow(headerRow);
                const body = bodyRows.map(parseRow);

                return addBlock(`
                    <div style="width: 100%; overflow-x: auto; margin: 30px 0;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 20px; color: ${themeConfig.textColor};">
                            <thead>
                                <tr style="background: rgba(255,255,255,0.15);">
                                    ${headers.map(h => `<th style="border: 1px solid rgba(255,255,255,0.2); padding: 18px 20px; text-align: left; font-weight: 800;">${h}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                ${body.map(r => `<tr>${r.map(c => `<td style="border: 1px solid rgba(255,255,255,0.1); padding: 15px 20px;">${c}</td>`).join('')}</tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                `);
            });

            // 3. Extract Images
            html = html.replace(/!\[(.*?)\]\((.*?)\)/g, (_, alt, url) => {
                return addBlock(`
                    <div style="margin: 30px 0; text-align: ${slideAlignment}; width: 100%;">
                        <img src="${url}" alt="${alt}" style="max-width: 100%; max-height: 55vh; border-radius: 16px; box-shadow: 0 15px 50px rgba(0,0,0,0.5);" />
                    </div>
                `);
            });

            // 4. Process lines
            const lines = html.split('\n');
            let resultHtml = '';
            let inList = false;

            lines.forEach(line => {
                let processed = line.trim();

                // Keep track of list state to wrap in <ul>
                if (processed.startsWith('- ') || processed.startsWith('* ')) {
                    if (!inList) {
                        resultHtml += '<ul style="margin: 20px 0;">';
                        inList = true;
                    }
                } else if (inList && processed !== '' && !processed.startsWith('<!-- BLOCK_PLACEHOLDER_')) {
                    resultHtml += '</ul>';
                    inList = false;
                }

                if (!processed) return;

                // Headers
                if (processed.startsWith('# ')) {
                    resultHtml += `<h1 style="font-size: 72px; font-weight: 800; margin-bottom: 40px; ${themeConfig.headingGradient ? `background: ${themeConfig.headingGradient}; -webkit-background-clip: text; -webkit-text-fill-color: transparent;` : `color: ${themeConfig.headingColor};`} text-align: ${slideAlignment}; line-height: 1.1; letter-spacing: -0.02em;">${applyInlineMarkdown(processed.slice(2))}</h1>`;
                    return;
                }
                if (processed.startsWith('## ')) {
                    resultHtml += `<h2 style="font-size: 52px; font-weight: 700; margin-bottom: 30px; color: ${themeConfig.headingColor}; opacity: 0.9; text-align: ${slideAlignment}; letter-spacing: -0.01em;">${applyInlineMarkdown(processed.slice(3))}</h2>`;
                    return;
                }
                if (processed.startsWith('### ')) {
                    resultHtml += `<h3 style="font-size: 36px; font-weight: 600; margin-bottom: 25px; color: ${themeConfig.textColor}; text-align: ${slideAlignment};">${applyInlineMarkdown(processed.slice(4))}</h3>`;
                    return;
                }

                // Placeholder check
                if (processed.startsWith('<!-- BLOCK_PLACEHOLDER_')) {
                    resultHtml += processed;
                    return;
                }

                // List Items
                if (processed.startsWith('- ') || processed.startsWith('* ')) {
                    const content = applyInlineMarkdown(processed.slice(2));
                    resultHtml += `<li style="margin: 15px 0; font-size: 30px; color: ${themeConfig.textColor}; text-align: ${slideAlignment}; list-style-position: inside; line-height: 1.5;">${content}</li>`;
                    return;
                }

                // Blockquotes
                if (processed.startsWith('> ')) {
                    resultHtml += `<blockquote style="border-left: 8px solid ${themeConfig.headingColor}; padding: 20px 40px; margin: 40px 0; font-style: italic; background: rgba(255,255,255,0.05); color: ${themeConfig.textColor}; text-align: ${slideAlignment}; font-size: 28px; border-radius: 0 16px 16px 0;">${applyInlineMarkdown(processed.slice(2))}</blockquote>`;
                    return;
                }

                if (processed.startsWith('Note:') || processed.startsWith('::')) return;

                // Inline processing for regular paragraphs
                resultHtml += `<p style="font-size: 30px; line-height: 1.6; margin-bottom: 25px; color: ${themeConfig.textColor}; text-align: ${slideAlignment};">${applyInlineMarkdown(processed)}</p>`;
            });

            if (inList) resultHtml += '</ul>';

            // 5. Re-inject Blocks
            blocks.forEach((blockContent, idx) => {
                resultHtml = resultHtml.replace(`<!-- BLOCK_PLACEHOLDER_${idx} -->`, blockContent);
            });

            return resultHtml;
        };

        const slidesHtml = slides.map((slide) => {
            const slideAlignment = (slide.alignment || globalAlignment) as 'center' | 'left';
            return `
                <div class="slide-container" style="background: ${themeConfig.background}; background-attachment: scroll; width: 100%; height: 100%;">
                    <div class="slide" style="display: flex; flex-direction: column; align-items: ${slideAlignment === 'center' ? 'center' : 'flex-start'}; justify-content: center; width: 100%; height: 100%;">
                        <div class="slide-content">
                            ${renderMarkdownToHtml(slide.content, slideAlignment)}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        printWindow.document.write(`
            <!DOCTYPE html>
            <html style="margin: 0; padding: 0; width: 100%; height: 100%;">
            <head>
                <title>${title}</title>
                <link href="https://fonts.googleapis.com/css2?family=${fontFamily.replace(' ', '+')}:wght@400;600;800&display=swap" rel="stylesheet">
                <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono&display=swap" rel="stylesheet">
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
                <style>
                    @page {
                        size: landscape;
                        margin: 0;
                    }
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    
                    html, body {
                        width: 100%;
                        height: 100%;
                        overflow: visible;
                    }

                    body { 
                        font-family: '${fontFamily}', sans-serif; 
                        background: #000; 
                    }
                    
                    .slide-container {
                        width: 100%;
                        height: 100%;
                        page-break-after: always;
                        break-after: page;
                        overflow: hidden;
                        position: relative;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    
                    .slide {
                        width: 100%;
                        height: 100%;
                        padding: 60px 100px; /* Reduced vertical padding */
                        display: flex;
                        flex-direction: column;
                        box-sizing: border-box;
                    }

                    /* Vertical Alignment Logic */
                    .slide-content {
                        width: 100%;
                        /* Remove height: auto !important; let flexbox handle it */
                    }

                    @media print {
                        body { background: ${themeConfig.background}; }
                        .slide-container { 
                            height: 100%; 
                            width: 100%; 
                            border: none;
                            margin: 0;
                        }
                    }

                    /* Reduce vertical margins in Markdown elements for slides */
                    h1 { margin-bottom: 20px !important; }
                    h2 { margin-bottom: 15px !important; }
                    p, li { margin-bottom: 10px !important; }
                    .block-code, blockquote, table { margin: 20px 0 !important; }

                    strong { font-weight: 800; }
                    em { font-style: italic; opacity: 0.9; }
                </style>
            </head>
            <body style="margin: 0; padding: 0;">${slidesHtml}</body>
            </html>
        `);

        printWindow.document.close();

        // Wait for fonts and images to potentially load
        setTimeout(() => {
            printWindow.print();
        }, 1000);
        setShowExportMenu(false);
    };


    const exportToPPTX = async () => {
        const pptx = new pptxgen();
        pptx.title = title;
        pptx.author = 'Presentify';

        const themeConfig = getTheme(theme);

        // Helper to convert CSS color/rgb to Hex
        const toHex = (color: string) => {
            if (color.startsWith('#')) return color.replace('#', '').toUpperCase();
            if (color.startsWith('rgb')) {
                const parts = color.match(/\d+/g);
                if (parts && parts.length >= 3) {
                    const r = parseInt(parts[0]).toString(16).padStart(2, '0');
                    const g = parseInt(parts[1]).toString(16).padStart(2, '0');
                    const b = parseInt(parts[2]).toString(16).padStart(2, '0');
                    return (r + g + b).toUpperCase();
                }
            }
            return 'FFFFFF';
        };

        const bgColor = toHex(themeConfig.background.includes('gradient') ? '#1a1b26' : themeConfig.background);
        const textColor = toHex(themeConfig.textColor);
        const headingColor = toHex(themeConfig.headingColor);

        slides.forEach((slide) => {
            const pptSlide = pptx.addSlide();
            pptSlide.background = { color: bgColor };

            const slideAlignment = (slide.alignment || globalAlignment) as 'center' | 'left';
            const lines = slide.content.split('\n').filter((l: string) => l.trim() && !l.startsWith('::') && !l.startsWith('Note:'));

            let yPos = 1;
            let inCodeBlock = false;
            let codeBuffer: string[] = [];

            lines.forEach((line: string) => {
                const trimmed = line.trim();

                if (trimmed.startsWith('```')) {
                    if (inCodeBlock) {
                        // End of code block - render it
                        pptSlide.addText(codeBuffer.join('\n'), {
                            x: 0.5, y: yPos, w: 9, h: (codeBuffer.length * 0.25) + 0.4,
                            fontSize: 14, fontFace: 'Courier New',
                            color: 'E0E0E0', fill: { color: '2E2E2E' },
                            valign: 'middle', align: 'left',
                            rectRadius: 0.1
                        });
                        yPos += (codeBuffer.length * 0.25) + 0.6;
                        codeBuffer = [];
                        inCodeBlock = false;
                    } else {
                        inCodeBlock = true;
                    }
                    return;
                }

                if (inCodeBlock) {
                    codeBuffer.push(line);
                    return;
                }

                // Handle Images in PPTX
                const imgMatch = line.match(/!\[(.*?)\]\((.*?)\)/);
                if (imgMatch) {
                    const imgUrl = imgMatch[2];
                    // Note: Local images might not work if they are relative, 
                    // but we assume they are URLs or the library handles them.
                    try {
                        pptSlide.addImage({
                            path: imgUrl,
                            x: 1, y: yPos, w: 8, h: 4,
                            sizing: { type: 'contain', w: 8, h: 4 }
                        });
                        yPos += 4.2;
                    } catch (e) {
                        console.error('Failed to add image to PPTX', e);
                    }
                    return;
                }

                if (line.startsWith('# ')) {
                    pptSlide.addText(line.slice(2), {
                        x: 0.5, y: yPos, w: 9, h: 1,
                        fontSize: 44, bold: true, color: headingColor,
                        align: slideAlignment
                    });
                    yPos += 1.2;
                } else if (line.startsWith('## ')) {
                    pptSlide.addText(line.slice(3), {
                        x: 0.5, y: yPos, w: 9, h: 0.8,
                        fontSize: 32, bold: true, color: headingColor,
                        align: slideAlignment
                    });
                    yPos += 1;
                } else if (line.startsWith('### ')) {
                    pptSlide.addText(line.slice(4), {
                        x: 0.5, y: yPos, w: 9, h: 0.6,
                        fontSize: 24, bold: true, color: textColor,
                        align: slideAlignment
                    });
                    yPos += 0.8;
                } else if (line.startsWith('- ')) {
                    pptSlide.addText(line.slice(2), {
                        x: 1, y: yPos, w: 8.5, h: 0.5,
                        fontSize: 18, color: textColor,
                        bullet: true, align: slideAlignment
                    });
                    yPos += 0.5;
                } else {
                    pptSlide.addText(line, {
                        x: 0.5, y: yPos, w: 9, h: 0.5,
                        fontSize: 18, color: textColor,
                        align: slideAlignment
                    });
                    yPos += 0.5;
                }
            });
        });

        await pptx.writeFile({ fileName: `${title.replace(/[^a-z0-9]/gi, '_')}.pptx` });
        setShowExportMenu(false);
    };


    // Navigate preview slides
    const prevSlide = () => setCurrentPreviewSlide(Math.max(0, currentPreviewSlide - 1));
    const nextSlide = () => setCurrentPreviewSlide(Math.min(slides.length - 1, currentPreviewSlide + 1));

    return (
        <div className="flex flex-col h-screen bg-bg-dark text-white">
            {/* Header / Toolbar */}
            <header className="h-16 px-6 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl flex items-center justify-between shrink-0 relative z-20">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <button
                        onClick={onBack}
                        className="w-10 h-10 flex-none flex items-center justify-center hover:bg-white/5 rounded-xl transition-colors border border-transparent hover:border-white/10"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex flex-col min-w-0 flex-1">
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="bg-transparent text-lg font-bold focus:outline-none border-b border-transparent focus:border-violet-500/50 px-1 py-0.5 transition-all w-full truncate"
                            placeholder="Presentation Title"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <ThemeSelector currentTheme={theme} onThemeChange={setTheme} />
                    <FontSelector currentFont={fontFamily} onFontChange={setFontFamily} />
                    <TransitionSelector currentTransition={globalTransition} onTransitionChange={setGlobalTransition} />

                    <div className="hidden lg:flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
                        <button
                            onClick={() => setGlobalAlignment('center')}
                            className={`p-1.5 rounded-lg transition-all ${globalAlignment === 'center' ? 'bg-violet-500 text-white shadow-lg' : 'text-text-dim hover:text-white'}`}
                            title="Center Align (Global)"
                        >
                            <AlignCenter size={16} />
                        </button>
                        <button
                            onClick={() => setGlobalAlignment('left')}
                            className={`p-1.5 rounded-lg transition-all ${globalAlignment === 'left' ? 'bg-violet-500 text-white shadow-lg' : 'text-text-dim hover:text-white'}`}
                            title="Left Align (Global)"
                        >
                            <AlignLeft size={16} />
                        </button>
                    </div>

                    <div className="w-px h-6 bg-white/10 mx-2" />

                    <button
                        onClick={() => setShowPreview(!showPreview)}
                        className={`hidden lg:flex w-10 h-10 items-center justify-center rounded-xl transition-all border ${showPreview ? 'bg-violet-500/20 border-violet-500/50 text-violet-400' : 'bg-white/5 border-white/10 text-text-dim hover:text-white'}`}
                        title="Toggle Preview"
                    >
                        <Eye size={18} />
                    </button>

                    <button
                        onClick={() => setShowGuide(!showGuide)}
                        className={`hidden lg:flex w-10 h-10 items-center justify-center rounded-xl transition-all border ${showGuide ? 'bg-violet-500/20 border-violet-500/50 text-violet-400' : 'bg-white/5 border-white/10 text-text-dim hover:text-white'}`}
                        title="Toggle Editor Guide"
                    >
                        <SidebarIcon size={18} />
                    </button>

                    <div className="w-px h-6 bg-white/10 mx-2" />

                    <div className="flex gap-2">
                        {/* Export dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowExportMenu(!showExportMenu)}
                                className="px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all border border-white/10 hover:bg-gray-500/30"
                            >
                                <Download size={18} />
                                <span>Export</span>
                            </button>
                            <AnimatePresence>
                                {showExportMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute top-full right-0 mt-2 w-48 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                                    >
                                        <button
                                            onClick={exportToPDF}
                                            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
                                        >
                                            <FileText size={18} className="text-red-400" />
                                            <div>
                                                <div className="font-semibold text-sm">Export PDF (Beta)</div>
                                                <div className="text-xs text-text-dim">Print-ready format</div>
                                            </div>
                                        </button>
                                        <button
                                            onClick={exportToPPTX}
                                            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left border-t border-white/5"
                                        >
                                            <PresentationIcon size={18} className="text-orange-400" />
                                            <div>
                                                <div className="font-semibold text-sm">Export PPTX (Beta)</div>
                                                <div className="text-xs text-text-dim">PowerPoint format</div>
                                            </div>
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={!hasChanges && !isSaved}
                            className={`px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all border ${isSaved
                                ? 'bg-green-500/20 border-green-500/50 text-green-400'
                                : hasChanges
                                    ? 'bg-violet-500/20 border-violet-500/50 text-violet-300 hover:bg-violet-500/30'
                                    : 'bg-white/5 border-white/10 text-text-dim cursor-not-allowed opacity-50'
                                }`}
                        >
                            {isSaved ? <Check size={18} /> : <Save size={18} />}
                            <span>{isSaved ? 'Saved' : hasChanges ? 'Save' : 'Saved'}</span>
                        </button>

                        <button
                            onClick={() => {
                                // Save current state before presenting
                                onSave({ ...presentation, title, markdown, theme, globalAlignment, fontFamily, globalTransition });

                                if (settings.jumpToCurrentSlide) {
                                    if (lastInteraction === 'preview') {
                                        onPresent(getIndicesForPreview(currentPreviewSlide));
                                    } else {
                                        const cursorLine = textareaRef.current ? (textareaRef.current.value.substr(0, textareaRef.current.selectionStart).split("\n").length - 1) : 0;
                                        onPresent(findSlideAtLine(cursorLine));
                                    }
                                } else {
                                    onPresent();
                                }
                            }}
                            className="px-5 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 rounded-xl font-semibold flex items-center gap-2 transition-all"
                        >
                            <PresentationIcon size={18} />
                            <span>Present</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Editor Content */}
            <main className="flex-1 flex overflow-hidden relative">
                {/* Sidebar Gutter / Line Numbers */}
                <div
                    ref={gutterRef}
                    className="w-14 bg-slate-950/20 border-r border-white/5 flex-none pt-12 pb-12 overflow-hidden select-none"
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}
                >
                    {Array.from({ length: lineCount }).map((_, i) => (
                        <div
                            key={i}
                            className="text-[18px] text-text-dim/30 text-right pr-4"
                            style={{ height: '27px', lineHeight: '27px' }}
                        >
                            {i + 1}
                        </div>
                    ))}
                </div>

                <div className="flex-1 relative overflow-hidden">
                    <textarea
                        ref={textareaRef}
                        value={markdown}
                        onScroll={handleScroll}
                        onChange={(e) => setMarkdown(e.target.value)}
                        onClick={() => setLastInteraction('cursor')}
                        onKeyUp={() => setLastInteraction('cursor')}
                        className="w-full h-full bg-transparent pt-12 pb-12 px-6 text-[18px] resize-none focus:outline-none placeholder:text-text-dim/20 selection:bg-violet-500/30 overflow-y-auto whitespace-pre overflow-x-auto"
                        style={{ fontFamily: 'JetBrains Mono, monospace', lineHeight: '27px' }}
                        placeholder="Write your content here!"
                    />
                </div>

                {/* Live Preview Panel */}
                <AnimatePresence>
                    {showPreview && slides.length > 0 && (
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 360, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="hidden xl:flex w-90 bg-slate-950/50 border-l border-white/5 flex-col overflow-hidden"
                        >
                            <div className="p-4 border-b border-white/5 flex items-center justify-between">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-text-dim flex items-center gap-2">
                                    <Eye size={14} className="text-violet-500" />
                                    Preview
                                </h4>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={prevSlide}
                                        disabled={currentPreviewSlide === 0}
                                        className="p-1 rounded hover:bg-white/10 disabled:opacity-30 transition-all"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <span className="text-xs text-text-dim font-mono">
                                        {currentPreviewSlide + 1}/{slides.length}
                                    </span>
                                    <button
                                        onClick={nextSlide}
                                        disabled={currentPreviewSlide === slides.length - 1}
                                        className="p-1 rounded hover:bg-white/10 disabled:opacity-30 transition-all"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Slide Preview */}
                            <div className="flex-1 p-4 overflow-hidden flex flex-col">
                                <div
                                    className={`w-full aspect-video rounded-xl border border-white/10 overflow-hidden flex flex-col p-6`} style={{ background: getTheme(theme).background }}
                                >
                                    <div className={`w-full h-full overflow-y-auto ${globalAlignment === 'left' ? 'text-left' : 'text-center'}`} style={{ fontFamily: `'${fontFamily}', sans-serif` }}>
                                        {slides[currentPreviewSlide]?.content.split('\n').map((line: string, idx: number) => {
                                            const themeConfig = getTheme(theme);
                                            const headingClass = themeConfig.headingGradient
                                                ? `${themeConfig.headingGradient} ${themeConfig.headingColor}`
                                                : themeConfig.headingColor;

                                            if (line.startsWith('# ')) return <h1 key={idx} className={`text-2xl font-bold ${headingClass} mb-4 wrap-break-word`}>{line.slice(2)}</h1>;
                                            if (line.startsWith('## ')) return <h2 key={idx} className={`text-xl font-semibold ${headingClass} opacity-90 mb-3 wrap-break-word`}>{line.slice(3)}</h2>;
                                            if (line.startsWith('### ')) return <h3 key={idx} className={`text-lg font-medium ${themeConfig.textColor} mb-2 wrap-break-word`}>{line.slice(4)}</h3>;
                                            if (line.startsWith('- ')) return <p key={idx} className={`text-sm ${themeConfig.textColor} mb-1 pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-white/40 wrap-break-word`}>{line.slice(2)}</p>;
                                            if (line.includes('$')) return <p key={idx} className={`text-sm ${themeConfig.textColor} italic my-2 p-2 bg-white/5 rounded border border-white/5 text-center`}>📐 Math Expression</p>;
                                            if (line.trim() && !line.startsWith('Note:')) return <p key={idx} className={`text-sm ${themeConfig.textColor} mb-1 leading-relaxed wrap-break-word`}>{line}</p>;
                                            return null;
                                        })}
                                    </div>
                                </div>
                            </div>


                            {/* Slide Thumbnails */}
                            <div className="p-4 border-t border-white/5 overflow-x-auto shrink-0">
                                <div className="flex gap-2">
                                    {slides.map((slide, idx: number) => {
                                        const themeConfig = getTheme(theme);
                                        const isLightTheme = (themeConfig.baseTheme || 'black') === 'white';

                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => {
                                                    setCurrentPreviewSlide(idx);
                                                    setLastInteraction('preview');
                                                }}
                                                className={`shrink-0 w-16 h-10 rounded-lg border overflow-hidden transition-all ${idx === currentPreviewSlide
                                                    ? 'border-violet-500 ring-2 ring-violet-500/30'
                                                    : 'border-white/10 hover:border-white/30'
                                                    } ${slide.isSubSlide ? 'opacity-60' : ''}`}
                                            >
                                                <div className={`w-full h-full ${themeConfig.thumbBgClass} flex items-center justify-center p-1`}>
                                                    <span className={`text-[8px] truncate ${isLightTheme ? 'text-slate-600' : 'text-white/40'}`}>
                                                        {slide.content.split('\n')[0]?.replace(/^#+\s*/, '').slice(0, 10) || `Slide ${idx + 1}`}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Info Panel Desktop */}
                <AnimatePresence>
                    {showGuide && (
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 288, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="hidden xl:flex w-72 bg-slate-950/30 border-l border-white/5 flex-col p-6 overflow-y-auto"
                        >
                            <h4 className="text-xs font-bold uppercase tracking-widest text-text-dim mb-6 flex items-center gap-2">
                                <Check size={14} className="text-violet-500" />
                                Editor Guide
                            </h4>

                            <div className="space-y-6 text-sm">
                                <section>
                                    <h4 className="font-semibold text-text-muted mb-2">Slide Separation</h4>
                                    <div className="space-y-2">
                                        <CodeSnippet code="---" label="Horizontal slide" />
                                        <CodeSnippet code="--" label="Vertical sub-slide" />
                                        <div className="p-2 border border-violet-500/20 bg-violet-500/5 rounded-lg">
                                            <p className="text-[10px] uppercase font-bold text-violet-400 mb-1">Implicit</p>
                                            <p className="text-text-dim text-xs">Slides split at #, ##, and ### headers.</p>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h4 className="font-semibold text-text-muted mb-2">Auto-Split</h4>
                                    <p className="text-text-dim text-xs leading-relaxed">Very long slides are automatically split into vertical sub-slides to prevent cutoff.</p>
                                </section>

                                <section>
                                    <h4 className="font-semibold text-text-muted mb-2">Alignment</h4>
                                    <div className="space-y-2">
                                        <CodeSnippet code="::left" label="Slide-level left-align" />
                                    </div>
                                </section>

                                <section>
                                    <h4 className="font-semibold text-text-muted mb-2">Speaker Notes</h4>
                                    <CodeSnippet code="Note:" label="Hidden from audience" />
                                </section>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

const CodeSnippet: React.FC<{ code: string, label: string }> = ({ code, label }) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className="group relative w-full flex items-center justify-between p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 transition-all text-left"
        >
            <div className="flex flex-col">
                <code className="text-violet-300 font-mono text-xs">{code}</code>
                <span className="text-[10px] text-text-dim mt-0.5">{label}</span>
            </div>
            <div className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${copied ? 'text-green-400' : 'text-text-dim'}`}>
                {copied ? <Check size={12} /> : <Copy size={12} />}
            </div>
        </button>
    );
};
