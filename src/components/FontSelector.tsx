import React from 'react';
import { Type } from 'lucide-react'; // Using 'Type' icon for fonts
import { fonts, getFontById } from '../utils/fonts';
import { BaseSelector } from './BaseSelector';

interface FontSelectorProps {
    currentFont: string;
    onFontChange: (fontId: string) => void;
}

export const FontSelector: React.FC<FontSelectorProps> = ({ currentFont, onFontChange }) => {
    const selectedFont = getFontById(currentFont);

    return (
        <BaseSelector
            items={fonts}
            selectedItem={selectedFont}
            onSelect={onFontChange}
            icon={Type}
            iconColorClass="text-blue-400"
            // We can render a preview of the actual font as the prefix!
            renderItemPrefix={(font) => (
                <div 
                    className="w-5 h-5 flex items-center justify-center border border-white/10 rounded bg-white/5 text-[10px] font-bold"
                    style={{ fontFamily: font.fontFamily }}
                >
                    A
                </div>
            )}
        />
    );
};