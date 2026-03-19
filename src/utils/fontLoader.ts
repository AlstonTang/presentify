/**
 * Dynamically loads a Google Font if it's not already loaded.
 */
export const loadGoogleFont = (fontFamily: string) => {
    if (!fontFamily || isStandardFont(fontFamily)) return;
    
    // Normalize font name for ID (e.g., "Open Sans" -> "google-font-open-sans")
    const fontId = `google-font-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`;
    
    if (document.getElementById(fontId)) return;

    const link = document.createElement('link');
    link.id = fontId;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}:wght@300;400;500;600;700;800&display=swap`;
    document.head.appendChild(link);
};

/**
 * Checks if a font is likely a standard system font that doesn't need loading.
 */
const isStandardFont = (fontFamily: string) => {
    const standardFonts = ['Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana', 'Tahoma', 'Trebuchet MS', 'Impact', 'Comic Sans MS'];
    return standardFonts.some(f => fontFamily.toLowerCase().includes(f.toLowerCase()));
};
