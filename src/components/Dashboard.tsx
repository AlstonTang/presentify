import React from 'react';
import { Plus, Presentation as PresentationIcon, Trash2, Clock, Play, Search, FolderOpen, Zap, Settings as SettingsIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Presentation } from '../types';
import { storage } from '../utils/storage';

interface DashboardProps {
    onSelect: (id: string) => void;
    onCreate: () => void;
    onPlay: (id: string) => void;
    onSettings: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelect, onCreate, onPlay, onSettings }) => {
    const [presentations, setPresentations] = React.useState<Presentation[]>([]);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [deletingId, setDeletingId] = React.useState<string | null>(null);

    React.useEffect(() => {
        const load = () => setPresentations(storage.getPresentations());
        load();
        window.addEventListener('storage', load);
        return () => window.removeEventListener('storage', load);
    }, []);

    const filteredPresentations = presentations.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((p, q) =>
        q.updatedAt - p.updatedAt
    );

    const handleDeleteClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setDeletingId(id);
    };

    const confirmDelete = () => {
        if (deletingId) {
            storage.deletePresentation(deletingId);
            setPresentations(storage.getPresentations());
            setDeletingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#050811] text-white selection:bg-violet-500/30">
            <div className="relative z-10 max-w-[calc(100%-40px)] mx-auto px-6 py-12 lg:py-20">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-grad-main flex items-center justify-center shadow-lg shadow-violet-500/20">
                                <Zap size={24} className="text-white fill-white" />
                            </div>
                            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-gradient">
                                Presentify
                            </h1>
                        </div>
                        <p className="text-text-muted text-lg">
                            Create cinematic presentations from your notes in seconds.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-4 w-full md:w-auto"
                    >
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" size={18} />
                            <input
                                type="text"
                                placeholder="Search presentations..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-violet-500/50 outline-none transition-all placeholder:text-text-dim"
                            />
                        </div>
                        <button
                            onClick={onSettings}
                            className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-text-dim hover:text-white transition-all"
                            title="Settings"
                        >
                            <SettingsIcon size={20} />
                        </button>
                        <button onClick={onCreate} className="btn-primary whitespace-nowrap">
                            <Plus size={20} />
                            <span>New Slide Deck</span>
                        </button>
                    </motion.div>
                </header>

                {presentations.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-32 text-center"
                    >
                        <div className="w-24 h-24 rounded-3xl bg-white/5 flex items-center justify-center mb-6 border border-white/10 animate-float">
                            <FolderOpen size={48} className="text-text-dim" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Your library is empty</h2>
                        <p className="text-text-muted max-w-xs mb-8">
                            Start by creating your first presentation or importing a markdown file.
                        </p>
                        <button onClick={onCreate} className="btn-secondary">
                            <Plus size={20} />
                            <span>Create First Presentation</span>
                        </button>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <AnimatePresence>
                            {filteredPresentations.map((p, index) => (
                                <motion.div
                                    key={p.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    whileHover={{ y: -8 }}
                                    className="glass-card group flex flex-col min-h-[220px] p-1"
                                >
                                    <div
                                        onClick={() => onSelect(p.id)}
                                        className="flex-1 p-6 cursor-pointer"
                                    >
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-violet-500/20 group-hover:border-violet-500/50 transition-all duration-500">
                                                <PresentationIcon size={24} className="text-violet-400" />
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onPlay(p.id); }}
                                                    className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-green-500/20 rounded-xl text-green-400 border border-transparent hover:border-green-500/50 transition-all"
                                                    title="Play Preview"
                                                >
                                                    <Play size={18} fill="currentColor" />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDeleteClick(e, p.id)}
                                                    className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-red-500/20 rounded-xl text-red-400 border border-transparent hover:border-red-500/50 transition-all"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>

                                        <h3 className="text-xl font-bold mb-2 group-hover:text-violet-400 transition-colors line-clamp-2">
                                            {p.title}
                                        </h3>

                                        <div className="flex items-center text-sm text-text-dim gap-4 mt-auto">
                                            <div className="flex items-center gap-1.5">
                                                <Clock size={14} />
                                                <span>{new Date(p.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                            </div>
                                            <div className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase tracking-wider font-bold">
                                                {p.theme}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bottom Progress Bar Decoration */}
                                    <div className="h-1 rounded-b-2xl bg-transparent overflow-hidden">
                                        <div
                                            className="h-full bg-grad-main opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Custom Delete Confirmation Modal */}
            <AnimatePresence>
                {deletingId && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-0">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setDeletingId(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md bg-[#0a0e1a] border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-red-500/50" />
                            <div className="flex flex-col items-center text-center">
                                <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
                                    <Trash2 size={32} className="text-red-400" />
                                </div>
                                <h3 className="text-2xl font-bold mb-2">Delete Presentation?</h3>
                                <p className="text-text-muted mb-8 text-[0.95rem] leading-relaxed">
                                    This action cannot be undone. All slides and content in this deck will be permanently removed.
                                </p>
                                <div className="flex gap-4 w-full">
                                    <button
                                        onClick={() => setDeletingId(null)}
                                        className="flex-1 px-6 py-3.5 bg-white/5 hover:bg-white/10 rounded-2xl font-bold transition-all border border-white/10"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        className="flex-1 px-6 py-3.5 bg-red-500 hover:bg-red-600 rounded-2xl font-bold text-white transition-all shadow-[0_10px_20px_rgba(239,68,68,0.3)]"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
