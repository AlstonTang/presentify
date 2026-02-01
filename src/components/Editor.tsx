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
import type { Presentation } from '../types';
import { FontSelector } from './FontSelector';
import { ThemeSelector } from './ThemeSelector';
import { motion, AnimatePresence } from 'framer-motion';
import { parseMarkdownToSlides } from '../utils/markdownParser';
import { storage } from '../utils/storage';
import pptxgen from 'pptxgenjs';
import { getTheme } from '../utils/themes';

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
    const [fontFamily, setFontFamily] = React.useState(presentation.fontFamily || 'Outfit');
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
            fontFamily !== presentation.fontFamily;
    }, [markdown, title, theme, globalAlignment, fontFamily, presentation]);

    // Parse slides for preview
    const slides = React.useMemo(() => {
        const parsed = parseMarkdownToSlides(markdown);
        // Flatten vertical slides for preview
        const flat: { content: string; isSubSlide?: boolean }[] = [];
        parsed.forEach(slide => {
            if (slide.type === 'vertical' && slide.subSlides) {
                slide.subSlides.forEach((sub, idx) => {
                    flat.push({ content: sub.content, isSubSlide: idx > 0 });
                });
            } else {
                flat.push({ content: slide.content });
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
        onSave({ ...presentation, title, markdown, theme, globalAlignment, fontFamily });
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    const exportToPDF = () => {
        // Open presentation in new window and trigger print
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const slidesHtml = slides.map((slide) => `
            <div class="slide" style="page-break-after: always; height: 100vh; display: flex; align-items: center; justify-content: center; padding: 40px; box-sizing: border-box;">
                <div style="max-width: 800px; text-align: ${globalAlignment};">
                    ${slide.content.split('\n').map(line => {
            if (line.startsWith('# ')) return `<h1 style="font-size: 48px; margin-bottom: 20px;">${line.slice(2)}</h1>`;
            if (line.startsWith('## ')) return `<h2 style="font-size: 36px; margin-bottom: 16px;">${line.slice(3)}</h2>`;
            if (line.startsWith('### ')) return `<h3 style="font-size: 28px; margin-bottom: 12px;">${line.slice(4)}</h3>`;
            if (line.startsWith('- ')) return `<li style="margin: 8px 0; font-size: 20px;">${line.slice(2)}</li>`;
            if (line.trim()) return `<p style="font-size: 20px; line-height: 1.6;">${line}</p>`;
            return '';
        }).join('')}
                </div>
            </div>
        `).join('');

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${title}</title>
                <link href="https://fonts.googleapis.com/css2?family=${fontFamily.replace(' ', '+')}&display=swap" rel="stylesheet">
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: '${fontFamily}', sans-serif; background: #000; color: #fff; }
                    @media print {
                        .slide { page-break-after: always; }
                    }
                </style>
            </head>
            <body>${slidesHtml}</body>
            </html>
        `);
        printWindow.document.close();
        setTimeout(() => {
            printWindow.print();
        }, 500);
        setShowExportMenu(false);
    };

    const exportToPPTX = async () => {
        const pptx = new pptxgen();
        pptx.title = title;
        pptx.author = 'Presentify';

        slides.forEach((slide) => {
            const pptSlide = pptx.addSlide();
            const lines = slide.content.split('\n').filter(l => l.trim());

            let yPos = 1;
            lines.forEach(line => {
                if (line.startsWith('# ')) {
                    pptSlide.addText(line.slice(2), { x: 0.5, y: yPos, w: 9, h: 1, fontSize: 44, bold: true, color: 'FFFFFF' });
                    yPos += 1.2;
                } else if (line.startsWith('## ')) {
                    pptSlide.addText(line.slice(3), { x: 0.5, y: yPos, w: 9, h: 0.8, fontSize: 32, bold: true, color: 'FFFFFF' });
                    yPos += 1;
                } else if (line.startsWith('### ')) {
                    pptSlide.addText(line.slice(4), { x: 0.5, y: yPos, w: 9, h: 0.6, fontSize: 24, bold: true, color: 'CCCCCC' });
                    yPos += 0.8;
                } else if (line.startsWith('- ')) {
                    pptSlide.addText(line.slice(2), { x: 0.8, y: yPos, w: 8.5, h: 0.5, fontSize: 18, color: 'DDDDDD', bullet: true });
                    yPos += 0.5;
                } else if (line.trim() && !line.startsWith('Note:')) {
                    pptSlide.addText(line, { x: 0.5, y: yPos, w: 9, h: 0.5, fontSize: 18, color: 'DDDDDD' });
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
                                onSave({ ...presentation, title, markdown, theme, globalAlignment, fontFamily });

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
                                        {slides[currentPreviewSlide]?.content.split('\n').map((line, idx) => {
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
                                    {slides.map((slide, idx) => {
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
