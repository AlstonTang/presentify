import React from 'react';
import { ArrowLeft, Save, Sparkles, Wand2, Eye, Layout, Check, AlignLeft, AlignCenter, Copy, Type, Sidebar as SidebarIcon } from 'lucide-react';
import type { Presentation } from '../types';
import { ThemeSelector } from './ThemeSelector';
import { motion, AnimatePresence } from 'framer-motion';

interface EditorProps {
    presentation: Presentation;
    onSave: (presentation: Presentation) => void;
    onBack: () => void;
    onPreview: (markdown: string, theme: string, title: string, globalAlignment: 'center' | 'left', fontFamily: string) => void;
    onAiEnhance: (markdown: string, onProgress?: (status: string) => void) => Promise<string>;
}

export const Editor: React.FC<EditorProps> = ({ presentation, onSave, onBack, onPreview, onAiEnhance }) => {
    const [markdown, setMarkdown] = React.useState(presentation.markdown);
    const [title, setTitle] = React.useState(presentation.title);
    const [theme, setTheme] = React.useState(presentation.theme || 'black');
    const [globalAlignment, setGlobalAlignment] = React.useState<'center' | 'left'>(presentation.globalAlignment || 'center');
    const [fontFamily, setFontFamily] = React.useState(presentation.fontFamily || 'Outfit');
    const [showGuide, setShowGuide] = React.useState(true);
    const [isEnhancing, setIsEnhancing] = React.useState(false);
    const [isSaved, setIsSaved] = React.useState(false);
    const [aiStatus, setAiStatus] = React.useState('');
    const [aiError, setAiError] = React.useState<string | null>(null);

    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const gutterRef = React.useRef<HTMLDivElement>(null);

    const lineCount = markdown.split('\n').length;

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

    const handleAiEnhance = async () => {
        setIsEnhancing(true);
        setAiError(null);
        try {
            const enhancedMarkdown = await onAiEnhance(markdown, setAiStatus);
            setMarkdown(enhancedMarkdown);
        } catch (error: any) {
            console.error('AI Enhancement failed:', error);
            setAiError(error.message || 'AI Enhancement failed. Check connection or hardware support.');
        } finally {
            setIsEnhancing(false);
            setAiStatus('');
        }
    };

    return (
        <div className="flex flex-col h-screen bg-[#050811] text-white">
            {/* Header / Toolbar */}
            <header className="h-16 px-6 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl flex items-center justify-between shrink-0 relative z-20">
                <div className="flex items-center gap-4 flex-1">
                    <button
                        onClick={onBack}
                        className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-xl transition-colors border border-transparent hover:border-white/10"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex flex-col">
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="bg-transparent text-lg font-bold focus:outline-none border-b border-transparent focus:border-violet-500/50 px-1 py-0.5 transition-all w-64 md:w-96"
                            placeholder="Presentation Title"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10">
                        <Layout size={16} className="text-text-dim" />
                        <ThemeSelector currentTheme={theme} onThemeChange={setTheme} />
                    </div>

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

                    <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10">
                        <Type size={16} className="text-text-dim" />
                        <select
                            value={fontFamily}
                            onChange={(e) => setFontFamily(e.target.value)}
                            className="bg-transparent text-sm font-semibold focus:outline-none cursor-pointer"
                        >
                            <option value="Outfit" className="bg-slate-900">Outfit</option>
                            <option value="Inter" className="bg-slate-900">Inter</option>
                            <option value="JetBrains Mono" className="bg-slate-900">JetBrains Mono</option>
                            <option value="Playfair Display" className="bg-slate-900">Playfair</option>
                        </select>
                    </div>

                    <div className="w-px h-6 bg-white/10 mx-2" />

                    <button
                        onClick={() => setShowGuide(!showGuide)}
                        className={`hidden lg:flex w-10 h-10 items-center justify-center rounded-xl transition-all border ${showGuide ? 'bg-violet-500/20 border-violet-500/50 text-violet-400' : 'bg-white/5 border-white/10 text-text-dim hover:text-white'}`}
                        title="Toggle Editor Guide"
                    >
                        <SidebarIcon size={18} />
                    </button>

                    <div className="w-px h-6 bg-white/10 mx-2" />

                    <div className="flex gap-2">
                        <button
                            onClick={handleAiEnhance}
                            disabled={isEnhancing}
                            className="relative group overflow-hidden px-5 py-2.5 bg-grad-main rounded-xl font-bold flex items-center gap-2 hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <AnimatePresence mode="wait">
                                {isEnhancing ? (
                                    <motion.div
                                        key="enhancing"
                                        initial={{ opacity: 0, rotate: 0 }}
                                        animate={{ opacity: 1, rotate: 360 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    >
                                        <Wand2 size={18} />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="sparkle"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                    >
                                        <Sparkles size={18} className="fill-white" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <span>{isEnhancing ? 'Brewing...' : 'AI Magic'}</span>
                        </button>

                        <button
                            onClick={() => onPreview(markdown, theme, title, globalAlignment, fontFamily)}
                            className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-semibold flex items-center gap-2 transition-all"
                        >
                            <Eye size={18} />
                            <span>Preview</span>
                        </button>

                        <button
                            onClick={handleSave}
                            className={`px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all border ${isSaved ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-white/5 hover:bg-white/10 border-white/10'
                                }`}
                        >
                            {isSaved ? <Check size={18} /> : <Save size={18} />}
                            <span>{isSaved ? 'Saved' : 'Save'}</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Editor Content */}
            <main className="flex-1 flex overflow-hidden relative">
                {/* Sidebar Gutter / Line Numbers */}
                <div
                    ref={gutterRef}
                    className="w-12 bg-slate-950/20 border-r border-white/5 flex-none pt-[48px] pb-12 overflow-hidden select-none"
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}
                >
                    {Array.from({ length: lineCount }).map((_, i) => (
                        <div
                            key={i}
                            className="h-[27px] leading-[27px] text-[14px] text-text-dim/30 text-right pr-3"
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
                        className="w-full h-full bg-transparent pt-[48px] pb-12 px-8 md:px-12 text-[18px] font-mono resize-none focus:outline-none placeholder:text-text-dim/20 leading-[27px] selection:bg-violet-500/30 overflow-y-auto whitespace-pre overflow-x-auto"
                        style={{ fontFamily: 'JetBrains Mono, monospace' }}
                        placeholder="Write your content here!"
                    />

                    {/* Overlay glow when AI is working */}
                    <AnimatePresence>
                        {isEnhancing && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-violet-600/5 backdrop-blur-[2px] pointer-events-none flex items-center justify-center p-8"
                            >
                                <div className="flex flex-col items-center gap-4 text-center max-w-sm">
                                    <div className="w-16 h-16 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
                                    <p className="text-violet-400 font-bold tracking-widest uppercase text-xs animate-pulse">
                                        Synchronizing with Intelligence
                                    </p>
                                    {aiStatus && (
                                        <p className="text-text-dim text-xs mt-2">{aiStatus}</p>
                                    )}
                                </div>
                            </motion.div>
                        )}
                        {aiError && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="absolute top-8 left-1/2 -translate-x-1/2 bg-red-950/80 border border-red-500/50 p-4 rounded-2xl shadow-2xl backdrop-blur-xl max-w-md z-[60]"
                            >
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                                        <ArrowLeft size={16} className="rotate-90" />
                                        Hardware / Driver Issue Detected
                                    </div>
                                    <p className="text-white/80 text-xs leading-relaxed whitespace-pre-wrap">
                                        {aiError}
                                    </p>
                                    <button
                                        onClick={() => setAiError(null)}
                                        className="text-[10px] uppercase tracking-wider font-bold text-white/40 hover:text-white/80 transition-colors"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

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
                                    <h5 className="font-semibold text-text-muted mb-2">Slide Separation</h5>
                                    <div className="space-y-2">
                                        <CodeSnippet code="---" label="Horizontal slide" />
                                        <CodeSnippet code="--" label="Vertical sub-slide" />
                                        <div className="p-2 border border-violet-500/20 bg-violet-500/5 rounded-lg">
                                            <p className="text-[10px] uppercase font-bold text-violet-400 mb-1">Implicit</p>
                                            <p className="text-text-dim text-xs">Slides split at # and ## headers.</p>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h5 className="font-semibold text-text-muted mb-2">Alignment</h5>
                                    <div className="space-y-2">
                                        <CodeSnippet code="::left" label="Slide-level left-align" />
                                    </div>
                                </section>

                                <section>
                                    <h5 className="font-semibold text-text-muted mb-2">Speaker Notes</h5>
                                    <CodeSnippet code="Note:" label="Hidden from audience" />
                                </section>

                                <section>
                                    <h5 className="font-semibold text-text-muted mb-2">Auto-Split</h5>
                                    <p className="text-text-dim text-xs leading-relaxed">Very long slides (&gt;20 lines) are automatically split into vertical sub-slides to prevent cutoff.</p>
                                </section>
                            </div>

                            <div className="mt-auto pt-6 border-t border-white/5">
                                <div className="bg-grad-main/10 border border-violet-500/20 rounded-2xl p-4">
                                    <div className="flex items-center gap-2 text-violet-400 font-bold text-xs mb-2 uppercase tracking-wide">
                                        <Sparkles size={14} />
                                        Pro Tip
                                    </div>
                                    <p className="text-xs text-text-muted leading-relaxed">
                                        Use AI Magic to automatically structure messy meeting notes into slides.
                                    </p>
                                </div>
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
