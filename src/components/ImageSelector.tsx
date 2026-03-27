import React from 'react';
import { Image as ImageIcon, Plus, Trash2, Copy, Check } from 'lucide-react';
import { imageStorage, type LocalImage } from '../utils/imageStorage';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageSelectorProps {
    onInsertImage: (markdown: string) => void;
}

export const ImageSelector: React.FC<ImageSelectorProps> = ({ onInsertImage }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [images, setImages] = React.useState<LocalImage[]>([]);
    const [copiedId, setCopiedId] = React.useState<string | null>(null);
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const loadImages = React.useCallback(async () => {
        const all = await imageStorage.getAll();
        setImages(all.sort((a, b) => b.createdAt - a.createdAt));
    }, []);

    React.useEffect(() => {
        loadImages();
        window.addEventListener('local-images-changed', loadImages);
        return () => window.removeEventListener('local-images-changed', loadImages);
    }, [loadImages]);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const newImage: LocalImage = {
            id: `local-img-${uuidv4()}`,
            name: file.name,
            data: file,
            type: file.type,
            createdAt: Date.now()
        };

        await imageStorage.save(newImage);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        await imageStorage.delete(id);
    };

    const copyMarkdown = (img: LocalImage) => {
        const md = `![${img.name}](${img.id})`;
        navigator.clipboard.writeText(md);
        setCopiedId(img.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all border ${isOpen ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-white/5 border-white/10 text-text-dim hover:text-white'}`}
                title="Local Images"
            >
                <ImageIcon size={18} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-full right-0 mt-2 w-80 bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-text-dim flex items-center gap-2">
                                <ImageIcon size={14} className="text-blue-400" />
                                Local Assets
                            </h4>
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors"
                                title="Upload Image"
                            >
                                <Plus size={16} />
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleFileUpload} 
                                accept="image/*" 
                                className="hidden" 
                            />
                        </div>

                        <div className="max-h-80 overflow-y-auto custom-scrollbar pr-1 -mr-1">
                            {images.length === 0 ? (
                                <div className="py-8 text-center border-2 border-dashed border-white/5 rounded-xl">
                                    <ImageIcon size={32} className="mx-auto mb-2 opacity-10" />
                                    <p className="text-xs text-text-dim opacity-50">No local images yet</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-2">
                                    {images.map((img) => (
                                        <div 
                                            key={img.id}
                                            className="group relative aspect-square rounded-xl bg-white/5 border border-white/5 overflow-hidden hover:border-blue-500/30 transition-all"
                                        >
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <ImagePreview blob={img.data} />
                                            </div>
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                                                <button 
                                                    onClick={() => onInsertImage(`![${img.name}](${img.id} =300x)`)}
                                                    className="w-full py-1 text-[10px] font-bold bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                                                >
                                                    Insert
                                                </button>
                                                <div className="flex gap-1 w-full">
                                                    <button 
                                                        onClick={() => copyMarkdown(img)}
                                                        className="flex-1 py-1 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                                                        title="Copy Markdown"
                                                    >
                                                        {copiedId === img.id ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                                                    </button>
                                                    <button 
                                                        onClick={(e) => handleDelete(e, img.id)}
                                                        className="flex-1 py-1 flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/80 to-transparent">
                                                <p className="text-[10px] truncate opacity-50">{img.name}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-white/5">
                            <p className="text-[10px] text-text-dim leading-relaxed">
                                Images are stored locally in your browser (IndexedDB). They won't work on other devices unless you export/import the presentation data.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Helper component for blob preview to handle ObjectURL lifecycle
const ImagePreview: React.FC<{ blob: Blob }> = ({ blob }) => {
    const [url, setUrl] = React.useState<string>('');
    
    React.useEffect(() => {
        const u = URL.createObjectURL(blob);
        setUrl(u);
        return () => URL.revokeObjectURL(u);
    }, [blob]);

    if (!url) return null;
    return <img src={url} className="w-full h-full object-cover" alt="preview" />;
};
