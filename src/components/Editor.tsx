import React from 'react';
import { ArrowLeft, Save, Sparkles, Wand2, Eye, Layout, Check } from 'lucide-react';
import type { Presentation } from '../types';
import { ThemeSelector } from './ThemeSelector';
import { motion, AnimatePresence } from 'framer-motion';

interface EditorProps {
    presentation: Presentation;
    onSave: (presentation: Presentation) => void;
    onBack: () => void;
    onPreview: (markdown: string, theme: string, title: string) => void;
    onAiEnhance: (markdown: string, onProgress?: (status: string) => void) => Promise<string>;
}

export const Editor: React.FC<EditorProps> = ({ presentation, onSave, onBack, onPreview, onAiEnhance }) => {
    const [markdown, setMarkdown] = React.useState(presentation.markdown);
    const [title, setTitle] = React.useState(presentation.title);
    const [theme, setTheme] = React.useState(presentation.theme || 'black');
    const [isEnhancing, setIsEnhancing] = React.useState(false);
    const [isSaved, setIsSaved] = React.useState(false);
    const [aiStatus, setAiStatus] = React.useState('');
    const [aiError, setAiError] = React.useState<string | null>(null);

    const handleSave = () => {
        onSave({ ...presentation, title, markdown, theme });
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
                            onClick={() => onPreview(markdown, theme, title)}
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
                {/* Sidebar Gutter / Line Numbers Mockup */}
                <div className="w-12 bg-slate-950/20 border-r border-white/5 flex flex-col items-center py-6 gap-4 text-text-dim/30 font-mono text-sm select-none">
                    {Array.from({ length: 20 }).map((_, i) => (
                        <span key={i}>{i + 1}</span>
                    ))}
                </div>

                <div className="flex-1 relative">
                    <textarea
                        value={markdown}
                        onChange={(e) => setMarkdown(e.target.value)}
                        className="w-full h-full bg-transparent p-8 md:p-12 text-lg font-mono resize-none focus:outline-none placeholder:text-text-dim/20 leading-relaxed selection:bg-violet-500/30"
                        placeholder="# Start with a title\n\nWrite your content here.\n\n---\n\n## New Slide\n\n- Use bullet points\n- Add some spice!"
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
                <div className="hidden xl:flex w-72 bg-slate-950/30 border-l border-white/5 flex-col p-6 overflow-y-auto">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-text-dim mb-6 flex items-center gap-2">
                        <Check size={14} className="text-violet-500" />
                        Editor Guide
                    </h4>

                    <div className="space-y-6 text-sm">
                        <section>
                            <h5 className="font-semibold text-text-muted mb-2">Slide Separation</h5>
                            <code className="block bg-white/5 p-2 rounded-lg text-violet-300 font-mono border border-white/5">---</code>
                            <p className="text-text-dim mt-2 leading-relaxed">Place three dashes on a new line to start a horizontal slide.</p>
                        </section>

                        <section>
                            <h5 className="font-semibold text-text-muted mb-2">Speaker Notes</h5>
                            <code className="block bg-white/5 p-2 rounded-lg text-violet-300 font-mono border border-white/5">Note:</code>
                            <p className="text-text-dim mt-2 leading-relaxed">Content after "Note:" will only be visible in speaker view.</p>
                        </section>

                        <section>
                            <h5 className="font-semibold text-text-muted mb-2">Fragments</h5>
                            <p className="text-text-dim leading-relaxed">Add <span className="text-violet-300">.fragment</span> class to elements for step-by-step appearance.</p>
                        </section>

                        <section>
                            <h5 className="font-semibold text-text-muted mb-2">Mathematics (KaTeX)</h5>
                            <div className="space-y-2">
                                <code className="block bg-white/5 p-2 rounded-lg text-violet-300 font-mono border border-white/5">$E = mc^2$</code>
                                <p className="text-text-dim leading-relaxed">Use single $ for inline and double $$ for block math.</p>
                            </div>
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
                </div>
            </main>
        </div>
    );
};
