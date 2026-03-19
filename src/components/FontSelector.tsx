import React from 'react';
import { Type, ChevronDown, Plus } from 'lucide-react';
import { fonts, getFontById } from '../utils/fonts';
import { loadGoogleFont } from '../utils/fontLoader';

interface FontSelectorProps {
    currentFont: string;
    onFontChange: (fontId: string) => void;
}

export const FontSelector: React.FC<FontSelectorProps> = ({ currentFont, onFontChange }) => {
    const selectedFont = getFontById(currentFont);
    const [isOpen, setIsOpen] = React.useState(false);
    const [customFont, setCustomFont] = React.useState('');
    const dropdownRef = React.useRef<HTMLDivElement>(null);

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
        if (customFont.trim()) {
            loadGoogleFont(customFont.trim());
            onFontChange(customFont.trim());
            setCustomFont('');
            setIsOpen(false);
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
                                value={customFont}
                                onChange={(e) => setCustomFont(e.target.value)}
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
                        <div className="mt-2 px-2 flex justify-between items-center">
                            <span className="text-[10px] text-text-dim/50 uppercase tracking-wider font-bold">Try: "IBM Plex Sans", "Fredoka"</span>
                        </div>
                    </form>
                    
                    <div className="h-px bg-white/5 mb-2 mx-1" />
                    
                    <div className="max-h-80 overflow-y-auto space-y-0.5 custom-scrollbar pr-1">
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