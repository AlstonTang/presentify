export interface Font {
    id: string;
    label: string;
    fontFamily: string;
}

export const fonts: Font[] = [
    { id: 'arial', label: 'Arial', fontFamily: 'Arial, sans-serif' },
    { id: 'inter', label: 'Inter', fontFamily: '"Inter", sans-serif' },
    { id: 'jetbrains', label: 'Jetbrains Mono', fontFamily: '"JetBrains Mono", monospace' },
    { id: 'outer', label: 'Outer', fontFamily: 'Outer, sans-serif' },
    { id: 'playfair', label: 'Playfair Display', fontFamily: '"Playfair Display", serif' },
];

// Helper to get font by ID (useful for the "selectedItem" prop)
export const getFontById = (id: string): Font => 
    fonts.find(f => f.id === id) || fonts[0];