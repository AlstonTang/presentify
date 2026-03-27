import React from 'react';
import { Type, ChevronDown, Plus, Upload, Trash2 } from 'lucide-react';
import { fonts, getFontById } from '../utils/fonts';
import { loadGoogleFont, registerCustomFont } from '../utils/fontLoader';
import { fontStorage, type CustomFont } from '../utils/fontStorage';
import { v4 as uuidv4 } from 'uuid';

interface FontSelectorProps {
    currentFont: string;
    onFontChange: (fontId: string) => void;
}

export const FontSelector: React.FC<FontSelectorProps> = ({ currentFont, onFontChange }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [customFontName, setCustomFontName] = React.useState('');
    const [storedCustomFonts, setStoredCustomFonts] = React.useState<CustomFont[]>([]);
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const selectedFont = React.useMemo(() => {
        const custom = storedCustomFonts.find(f => f.fontFamily === currentFont);
        if (custom) return { label: custom.name, fontFamily: custom.fontFamily };
        return getFontById(currentFont);
    }, [currentFont, storedCustomFonts]);

    const loadCustomFonts = React.useCallback(async () => {
        const custom = await fontStorage.getAll();
        setStoredCustomFonts(custom);
    }, []);

    React.useEffect(() => {
        loadCustomFonts();
        window.addEventListener('custom-fonts-changed', loadCustomFonts);
        return () => window.removeEventListener('custom-fonts-changed', loadCustomFonts);
    }, [loadCustomFonts]);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleImport = (e: React.FormEvent) => {
        e.preventDefault();
        if (customFontName.trim()) {
            loadGoogleFont(customFontName.trim());
            onFontChange(customFontName.trim());
            setCustomFontName('');
            setIsOpen(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const data = event.target?.result as ArrayBuffer;
            if (!data) return;

            // Generate a clean family name from file name
            const baseName = file.name.replace(/\.[^/.]+$/, "");
            const fontFamily = `custom-${baseName.replace(/\s+/g, '-').toLowerCase()}-${uuidv4().slice(0, 4)}`;
            
            const format = file.name.split('.').pop()?.toLowerCase() as any;
            
            const newFont: CustomFont = {
                id: uuidv4(),
                name: baseName,
                fontFamily: fontFamily,
                filename: file.name,
                data: data,
                format: format
            };

            await fontStorage.save(newFont);
            await registerCustomFont(fontFamily, data);
            onFontChange(fontFamily);
            setIsOpen(false);
        };
        reader.readAsArrayBuffer(file);
    };

    const handleDeleteCustomFont = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const fontToDelete = storedCustomFonts.find(f => f.fontFamily === id);
        if (fontToDelete) {
            await fontStorage.delete(fontToDelete.id);
            if (currentFont === id) {
                onFontChange('Tahoma'); // fallback
            }
        }
    };


    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 bg-gray-900 border border-white/5 hover:border-white/10 hover:bg-gray-800 rounded-lg transition-all text-text-dim hover:text-white"
            >
                <Type size={14} className="text-blue-400" />
                <span className="font-semibold tracking-wide whitespace-nowrap min-w-[80px] text-left">
                    {selectedFont.label}
                </span>
                <ChevronDown size={14} className={`opacity-40 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 animate-in fade-in zoom-in-95 duration-200">
                    <form onSubmit={handleImport} className="mb-2 p-1">
                        <div className="relative group">
                            <input 
                                type="text"
                                value={customFontName}
                                onChange={(e) => setCustomFontName(e.target.value)}
                                placeholder="Import Google Font..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-white/20"
                            />
                            <button 
                                type="submit"
                                className="absolute right-1.5 top-1.5 p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors"
                                title="Import and Apply"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    </form>

                    <div className="px-1 mb-2">
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl text-blue-400 text-sm font-medium transition-all group"
                        >
                            <Upload size={14} className="group-hover:-translate-y-0.5 transition-transform" />
                            Upload Local Font (.ttf, .otf, .woff)
                        </button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileUpload} 
                            accept=".ttf,.otf,.woff,.woff2" 
                            className="hidden" 
                        />
                    </div>
                    
                    <div className="h-px bg-white/5 mb-2 mx-1" />
                    
                    <div className="max-h-64 overflow-y-auto space-y-0.5 custom-scrollbar pr-1">
                        {storedCustomFonts.length > 0 && (
                            <>
                                <div className="px-2 py-1.5 text-[10px] text-text-dim/50 uppercase tracking-widest font-bold">Custom Fonts</div>
                                {storedCustomFonts.map((f) => (
                                    <button
                                        key={f.id}
                                        onClick={() => {
                                            onFontChange(f.fontFamily);
                                            setIsOpen(false);
                                        }}
                                        className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all hover:bg-white/10 text-left group ${
                                            currentFont === f.fontFamily ? 'bg-white/5 text-white' : 'text-text-dim hover:text-white'
                                        }`}
                                    >
                                        <div 
                                            className="w-6 h-6 flex-none flex items-center justify-center border border-white/10 rounded-lg bg-white/5 text-[10px] font-bold transition-transform group-hover:scale-110"
                                            style={{ fontFamily: f.fontFamily }}
                                        >
                                            A
                                        </div>
                                        <span className="font-medium truncate" style={{ fontFamily: f.fontFamily }}>{f.name}</span>
                                        <div className="ml-auto flex items-center gap-2">
                                            {currentFont === f.fontFamily && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                                            )}
                                            <button 
                                                onClick={(e) => handleDeleteCustomFont(e, f.fontFamily)}
                                                className="opacity-0 group-hover:opacity-40 hover:!opacity-100 p-1 hover:text-red-400 transition-all"
                                                title="Delete Font"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </button>
                                ))}
                                <div className="h-px bg-white/5 my-2 mx-1" />
                            </>
                        )}

                        <div className="px-2 py-1.5 text-[10px] text-text-dim/50 uppercase tracking-widest font-bold">Presets</div>
                        {fonts.map((font) => (
                            <button
                                key={font.id}
                                onClick={() => {
                                    onFontChange(font.id);
                                    setIsOpen(false);
                                }}
                                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all hover:bg-white/10 text-left group ${
                                    currentFont === font.id ? 'bg-white/5 text-white' : 'text-text-dim hover:text-white'
                                }`}
                            >
                                <div 
                                    className="w-6 h-6 flex-none flex items-center justify-center border border-white/10 rounded-lg bg-white/5 text-[10px] font-bold transition-transform group-hover:scale-110"
                                    style={{ fontFamily: font.fontFamily }}
                                >
                                    A
                                </div>
                                <span className="font-medium truncate" style={{ fontFamily: font.fontFamily }}>{font.label}</span>
                                {currentFont === font.id && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};