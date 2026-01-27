import React from 'react';

export const THEMES = [
    { id: 'black', name: 'Cosmos Black' },
    { id: 'white', name: 'Polar White' },
    { id: 'league', name: 'League' },
    { id: 'beige', name: 'Modern Beige' },
    { id: 'sky', name: 'Sky Blue' },
    { id: 'night', name: 'Midnight' },
    { id: 'serif', name: 'Classic Serif' },
    { id: 'simple', name: 'Minimalist' },
    { id: 'solarized', name: 'Solarized' },
    { id: 'blood', name: 'Crimson' },
    { id: 'moon', name: 'Lunar' }
];

interface ThemeSelectorProps {
    currentTheme: string;
    onThemeChange: (theme: string) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ currentTheme, onThemeChange }) => {
    return (
        <select
            value={currentTheme}
            onChange={(e) => onThemeChange(e.target.value)}
            className="bg-transparent border-none text-sm font-semibold text-text-muted focus:text-white outline-none cursor-pointer hover:text-white transition-colors"
        >
            {THEMES.map(theme => (
                <option key={theme.id} value={theme.id} className="bg-[#0f172a] text-white">
                    {theme.name}
                </option>
            ))}
        </select>
    );
};
