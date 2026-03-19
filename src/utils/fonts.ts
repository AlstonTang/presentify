export interface Font {
    id: string;
    label: string;
    fontFamily: string;
    isGoogle?: boolean;
}

export const fonts: Font[] = [
    { id: 'Arial', label: 'Arial', fontFamily: 'Arial, sans-serif' },
    { id: 'Helvetica', label: 'Helvetica', fontFamily: '"Helvetica", sans-serif' },
    { id: 'Tahoma', label: 'Tahoma', fontFamily: '"Tahoma", sans-serif' },
    { id: 'JetBrains Mono', label: 'Jetbrains Mono', fontFamily: '"JetBrains Mono", monospace' },
    { id: 'IBM Plex Sans', label: 'IBM Plex Sans', fontFamily: '"IBM Plex Sans", sans-serif', isGoogle: true },
    { id: 'Fredoka', label: 'Fredoka', fontFamily: '"Fredoka", sans-serif', isGoogle: true },
    { id: 'Noto Sans', label: 'Noto Sans', fontFamily: '"Noto Sans", sans-serif', isGoogle: true },
    { id: 'Montserrat', label: 'Montserrat', fontFamily: '"Montserrat", sans-serif', isGoogle: true },
    { id: 'Inter', label: 'Inter', fontFamily: '"Inter", sans-serif', isGoogle: true },
    { id: 'Space Grotesk', label: 'Space Grotesk', fontFamily: '"Space Grotesk", sans-serif', isGoogle: true },
    { id: 'Outfit', label: 'Outfit', fontFamily: '"Outfit", sans-serif', isGoogle: true },
];

// Helper to get font by ID (useful for the "selectedItem" prop)
export const getFontById = (id: string): Font => 
    fonts.find(f => f.id === id) || { id, label: id.split(',')[0].replace(/['"]/g, ''), fontFamily: id.includes(',') ? id : `'${id}', sans-serif`, isGoogle: true };