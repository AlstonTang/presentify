export interface ThemeConfig {
    id: string;
    label: string;
    description?: string;
    baseTheme?: string; // 'black', 'white', 'league', etc. Defaults to 'black' if not specified.
    selectorColor?: string; // Tailwind class for the color dot in the selector
    // Core appearance
    background: string; // Tailwind class or raw CSS for preview
    previewBgClass: string; // Tailwind classes for the preview card container

    // Text styles (Tailwind classes for Preview)
    headingColor: string;
    textColor: string;
    headingGradient?: string; // If present, overrides headingColor

    // Thumbnail background
    thumbBgClass: string;

    // Reveal.js specific overrides (CSS strings)
    revealBg: string; // CSS background value
    revealHeadingColor?: string;
    revealTextColor?: string;
    revealHeadingGradient?: string; // CSS gradient value
    revealTextShadow?: string;

    // Background Effects (for PresentationViewer)
    bgEffectClass?: string;     // Class name for the primary background effect div
    bgEffectClass2?: string;    // Class name for the secondary background effect div
    customCss?: string;         // Additional CSS rules (e.g. keyframes, class styles)
}

export const themes: Record<string, ThemeConfig> = {
    'presentify-dark': {
        id: 'presentify-dark',
        label: 'Presentify Dark',
        baseTheme: 'black',
        selectorColor: 'bg-indigo-600',
        background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.95) 0%, rgba(59, 7, 100, 0.9) 50%, rgba(80, 7, 36, 0.8) 100%)',
        previewBgClass: 'bg-gradient-to-br from-indigo-950/80 via-purple-950/60 to-pink-950/40',
        headingColor: 'text-white', // Fallback
        headingGradient: 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300',
        textColor: 'text-white/70',
        thumbBgClass: 'bg-gradient-to-br from-indigo-950 to-purple-950',
        revealBg: 'linear-gradient(135deg, rgba(30, 27, 75, 0.95) 0%, rgba(59, 7, 100, 0.9) 50%, rgba(80, 7, 36, 0.8) 100%)',
        revealHeadingGradient: 'linear-gradient(to right, #a5b4fc, #d8b4fe, #f9a8d4)',
        revealTextColor: '#c7d2fe',
        bgEffectClass: 'presentify-aurora',
        customCss: `
            .presentify-aurora {
                position: fixed;
                inset: -100px;
                width: calc(100% + 200px);
                height: calc(100% + 200px);
                background: 
                    radial-gradient(ellipse 80% 60% at 20% 30%, rgba(99, 102, 241, 0.45) 0%, transparent 60%),
                    radial-gradient(ellipse 70% 70% at 80% 70%, rgba(168, 85, 247, 0.4) 0%, transparent 60%),
                    radial-gradient(ellipse 60% 50% at 60% 20%, rgba(236, 72, 153, 0.35) 0%, transparent 50%);
                filter: blur(80px);
                animation: orbit 50s linear infinite;
                z-index: 0;
                pointer-events: none;
            }
        `
    },
    'neon-nebula': {
        id: 'neon-nebula',
        label: 'Neon Nebula',
        baseTheme: 'black',
        selectorColor: 'bg-purple-600',
        background: 'linear-gradient(135deg, #3b0764 0%, #701a75 50%, #831843 100%)',
        previewBgClass: 'bg-gradient-to-br from-purple-950 via-fuchsia-950/80 to-pink-950/60',
        headingColor: 'text-pink-300',
        textColor: 'text-white/70',
        thumbBgClass: 'bg-gradient-to-br from-purple-950 to-pink-950',
        revealBg: 'linear-gradient(135deg, #3b0764 0%, #701a75 50%, #831843 100%)',
        revealHeadingColor: '#fca5a5',
        revealTextShadow: '0 0 40px rgba(219, 39, 119, 0.6)',
        revealTextColor: '#fbcfe8',
        bgEffectClass: 'theme-bg-effect',
        bgEffectClass2: 'theme-bg-effect-2',
        customCss: `
            .theme-bg-effect {
                position: fixed;
                inset: 0;
                width: 100vw;
                height: 100vh;
                background: radial-gradient(circle at 50% 50%, rgba(219, 39, 119, 0.28) 0%, transparent 70%);
                animation: pulse-ring 8s ease-in-out infinite;
                z-index: 0;
                pointer-events: none;
            }
            .theme-bg-effect-2 {
                position: fixed;
                inset: 0;
                background: radial-gradient(circle at 30% 70%, rgba(124, 58, 237, 0.35) 0%, transparent 60%);
                z-index: 0;
                pointer-events: none;
            }
        `
    },
    'cyber-midnight': {
        id: 'cyber-midnight',
        label: 'Cyber Midnight',
        baseTheme: 'black',
        selectorColor: 'bg-emerald-600',
        background: '#030712',
        previewBgClass: 'bg-[#030712]',
        headingColor: 'text-emerald-400',
        textColor: 'text-white/70',
        thumbBgClass: 'bg-[#030712]',
        revealBg: '#030712',
        revealHeadingColor: '#34d399',
        revealTextShadow: '0 0 30px rgba(16, 185, 129, 0.4)',
        revealTextColor: '#a7f3d0',
        bgEffectClass: 'theme-bg-effect',
        bgEffectClass2: 'theme-bg-effect-2',
        customCss: `
            .theme-bg-effect {
                position: fixed;
                inset: 0;
                background-image: 
                    linear-gradient(rgba(16, 185, 129, 0.08) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(16, 185, 129, 0.08) 1px, transparent 1px);
                background-size: 60px 60px;
                z-index: 0;
                pointer-events: none;
            }
            .theme-bg-effect-2 {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                height: 60%;
                background: linear-gradient(to top, rgba(16, 185, 129, 0.15) 0%, transparent 100%);
                z-index: 0;
                pointer-events: none;
            }
            .reveal h1 {
                border-left: 6px solid #10b981;
                padding-left: 24px !important;
            }
        `
    },
    'blood': {
        id: 'blood',
        label: 'Blood',
        baseTheme: 'black',
        selectorColor: 'bg-red-800',
        background: 'linear-gradient(135deg, #450a0a 0%, #000000 100%)',
        previewBgClass: 'bg-gradient-to-br from-red-950/80 to-black',
        headingColor: 'text-red-300',
        textColor: 'text-white/70',
        thumbBgClass: 'bg-red-950',
        revealBg: 'linear-gradient(135deg, #450a0a 0%, #000000 100%)',
        revealHeadingColor: '#fca5a5',
        revealTextShadow: '0 0 30px rgba(220, 38, 38, 0.5)',
        revealTextColor: '#fecaca',
        bgEffectClass: 'theme-bg-effect',
        customCss: `
            .theme-bg-effect {
                position: fixed;
                inset: -50px;
                width: calc(100% + 100px);
                height: calc(100% + 100px);
                background: radial-gradient(ellipse 80% 60% at 50% 30%, rgba(185, 28, 28, 0.6) 0%, transparent 60%);
                filter: blur(50px);
                animation: pulse-ring 10s ease-in-out infinite;
                z-index: 0;
                pointer-events: none;
            }
        `
    },
    'night': {
        id: 'night',
        label: 'Night',
        baseTheme: 'black',
        selectorColor: 'bg-blue-900',
        background: 'linear-gradient(180deg, #020617 0%, #172554 100%)',
        previewBgClass: 'bg-gradient-to-b from-slate-950 to-blue-950/50',
        headingColor: 'text-white',
        textColor: 'text-white/70',
        thumbBgClass: 'bg-slate-900', // Default fallback for darker themes
        revealBg: 'linear-gradient(180deg, #020617 0%, #172554 100%)',
        revealHeadingColor: '#f8fafc',
        revealTextShadow: '0 8px 30px rgba(0,0,0,0.5)',
        revealTextColor: '#cbd5e1',
        bgEffectClass: 'theme-bg-effect',
        customCss: `
            .theme-bg-effect {
                position: fixed;
                inset: -100px;
                width: calc(100% + 200px);
                height: calc(100% + 200px);
                background: 
                    radial-gradient(ellipse 70% 50% at 15% 20%, rgba(30, 68, 158, 0.6) 0%, transparent 50%),
                    radial-gradient(ellipse 60% 60% at 85% 80%, rgba(23, 47, 104, 0.7) 0%, transparent 50%);
                filter: blur(60px);
                animation: orbit 80s linear infinite;
                z-index: 0;
                pointer-events: none;
            }
            .reveal h1 { 
                filter: drop-shadow(0 0 20px rgba(56, 189, 248, 0.15));
            }
        `
    },
    'moon': {
        id: 'moon',
        label: 'Moon',
        baseTheme: 'black',
        selectorColor: 'bg-slate-700',
        background: '#0f172a',
        previewBgClass: 'bg-slate-900',
        headingColor: 'text-white',
        textColor: 'text-white/70',
        thumbBgClass: 'bg-slate-900',
        revealBg: '#0f172a',
        revealHeadingColor: '#f1f5f9',
        revealTextColor: '#94a3b8',
        bgEffectClass: 'theme-bg-effect',
        customCss: `
            .theme-bg-effect {
                position: fixed;
                inset: 0;
                background: radial-gradient(circle at 70% 30%, rgba(148, 163, 184, 0.25) 0%, transparent 60%);
                z-index: 0;
                pointer-events: none;
            }
        `
    },
    'minimal-glass': {
        id: 'minimal-glass',
        label: 'Minimal Glass',
        baseTheme: 'white',
        selectorColor: 'bg-slate-400',
        background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
        previewBgClass: 'bg-gradient-to-br from-gray-100 to-gray-200',
        headingColor: 'text-slate-900',
        textColor: 'text-slate-600',
        thumbBgClass: 'bg-gray-200',
        revealBg: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
        revealHeadingColor: '#0f172a',
        revealTextColor: '#334155',
        bgEffectClass: 'theme-bg-effect',
        customCss: `
            .theme-bg-effect {
                position: fixed;
                inset: 0;
                background: 
                    radial-gradient(circle at 10% 10%, rgba(99, 102, 241, 0.1) 0%, transparent 40%),
                    radial-gradient(circle at 90% 90%, rgba(168, 85, 247, 0.1) 0%, transparent 40%);
                z-index: 0;
                pointer-events: none;
            }
            .reveal h1 { 
                font-size: 4em !important;
                letter-spacing: -0.03em;
            }
        `
    },
    'white': {
        id: 'white',
        label: 'White',
        baseTheme: 'white',
        selectorColor: 'bg-gray-200',
        background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
        previewBgClass: 'bg-gradient-to-br from-gray-100 to-gray-200',
        headingColor: 'text-slate-900',
        textColor: 'text-slate-600',
        thumbBgClass: 'bg-gray-200',
        revealBg: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
        revealHeadingColor: '#0f172a',
        revealTextColor: '#334155',
        bgEffectClass: 'theme-bg-effect',
        customCss: `
            .theme-bg-effect {
                position: fixed;
                inset: 0;
                background: 
                    radial-gradient(circle at 10% 10%, rgba(99, 102, 241, 0.1) 0%, transparent 40%),
                    radial-gradient(circle at 90% 90%, rgba(168, 85, 247, 0.1) 0%, transparent 40%);
                z-index: 0;
                pointer-events: none;
            }
            .reveal h1 { 
                font-size: 4em !important;
                letter-spacing: -0.03em;
            }
        `
    },
    'black': {
        id: 'black',
        label: 'Cosmos Black',
        baseTheme: 'black',
        selectorColor: 'bg-black',
        background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)',
        previewBgClass: 'bg-gradient-to-br from-slate-900 to-slate-950',
        headingColor: 'text-white',
        textColor: 'text-white/70',
        thumbBgClass: 'bg-slate-900',
        revealBg: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)',
        revealHeadingColor: '#fff',
        revealTextColor: '#d4d4d4'
    }
};

export const getTheme = (id: string): ThemeConfig => {
    return themes[id] || themes['black'];
};
