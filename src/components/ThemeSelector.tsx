import React from 'react';
import { Palette, ChevronDown } from 'lucide-react';

export const THEMES = [
    { id: 'presentify-dark', name: 'Presentify Dark', color: 'bg-indigo-600' },
    { id: 'neon-nebula', name: 'Neon Nebula', color: 'bg-purple-600' },
    { id: 'cyber-midnight', name: 'Cyber Midnight', color: 'bg-emerald-600' },
    { id: 'minimal-glass', name: 'Minimal Glass', color: 'bg-slate-400' },
    { id: 'black', name: 'Cosmos Black', color: 'bg-black' },
    { id: 'night', name: 'Midnight Blue', color: 'bg-blue-900' },
    { id: 'blood', name: 'Crimson', color: 'bg-red-800' },
    { id: 'moon', name: 'Lunar Grey', color: 'bg-slate-700' }
];

interface ThemeSelectorProps {
    currentTheme: string;
    onThemeChange: (theme: string) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ currentTheme, onThemeChange }) => {
    const selectedTheme = THEMES.find(t => t.id === currentTheme) || THEMES[0];

    return (
        <div className="relative group/theme text-sm">
            <button className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-white/5 rounded-lg transition-all text-text-muted hover:text-white cursor-pointer group-hover/theme:bg-white/5">
                <Palette size={14} className="text-violet-400" />
                <span className="font-semibold tracking-wide whitespace-nowrap">{selectedTheme.name}</span>
                <ChevronDown size={14} className="opacity-40 group-hover/theme:rotate-180 transition-transform" />
            </button>

            <div className="absolute top-full right-0 pt-2 opacity-0 translate-y-2 pointer-events-none group-hover/theme:opacity-100 group-hover/theme:translate-y-0 group-hover/theme:pointer-events-auto transition-all z-[100]">
                <div className="w-56 bg-slate-950/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 shadow-2xl">
                    <div className="grid grid-cols-1 gap-1">
                        {THEMES.map(theme => (
                            <button
                                key={theme.id}
                                onClick={() => onThemeChange(theme.id)}
                                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all hover:bg-white/10 text-left ${currentTheme === theme.id ? 'bg-white/5 text-white' : 'text-text-dim hover:text-white'
                                    }`}
                            >
                                <div className={`w-3 h-3 rounded-full ${theme.color} border border-white/20`} />
                                <span className="font-medium">{theme.name}</span>
                                {currentTheme === theme.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
