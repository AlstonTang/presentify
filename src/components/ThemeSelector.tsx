import React from 'react';
import { Palette } from 'lucide-react';
import { themes } from '../utils/themes';
import { BaseSelector } from './BaseSelector';

interface ThemeSelectorProps {
    currentTheme: string;
    onThemeChange: (theme: string) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ currentTheme, onThemeChange }) => {
    // Convert the themes object into an array for the selector
    const themeList = Object.values(themes);
    const selectedTheme = themes[currentTheme] || themes['black'];

    return (
        <BaseSelector
            items={themeList}
            selectedItem={selectedTheme}
            onSelect={onThemeChange}
            icon={Palette}
            iconColorClass="text-violet-400"
            // Concrete implementation of the theme preview circle
            renderItemPrefix={(theme) => (
                <div className={`w-3 h-3 rounded-full ${theme.selectorColor} border border-white/20`} />
            )}
        />
    );
};