export interface Font {
    id: string;
    label: string;
    fontFamily: string;
}

export const fonts: Font[] = [
    { id: 'Arial', label: 'Arial', fontFamily: 'Arial, sans-serif' },
    { id: 'Helvetica', label: 'Helvetica', fontFamily: '"Helvetica", sans-serif' },
    { id: 'JetBrains Mono', label: 'Jetbrains Mono', fontFamily: '"JetBrains Mono", monospace' },
	{ id: 'Tahoma', label: 'Tahoma', fontFamily: '"Tahoma", sans-serif' },
	{ id: 'Times New Roman', label: 'Times New Roman', fontFamily: '"Times New Roman", serif' },
];

// Helper to get font by ID (useful for the "selectedItem" prop)
export const getFontById = (id: string): Font => 
    fonts.find(f => f.id === id) || fonts[0];