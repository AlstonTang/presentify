import type { CSSProperties } from 'react';

export interface ThemeConfig {
    id: string;
    label: string;
    description?: string;
    baseTheme?: 'black' | 'white' | 'league' | 'beige' | 'night' | 'serif' | 'simple' | 'sky' | 'solarized' | 'blood' | 'moon'; 
    selectorColor: string; // Tailwind class for the UI dot

    // Unified Styling (Standard CSS)
    background: string;     // CSS value (color or gradient)
    headingColor: string;   // CSS color
    headingGradient?: string; // CSS linear-gradient
    textColor: string;      // CSS color
    textShadow?: string;    // CSS text-shadow
    
    // UI/Preview specifics
    thumbBgClass: string;   // Tailwind class for the sidebar thumbnail
    
    // Background Effects
    bgEffectClass?: string;
    bgEffectClass2?: string;
    customCss?: string;     // Injected into both Preview and Presentation
}

/**
 * Helper to generate React styles for the Preview components 
 * to ensure they match Reveal.js logic exactly.
 */
export const getThemePreviewStyles = (theme: ThemeConfig) => {
    const headingStyle: CSSProperties = {
        color: theme.headingColor,
        textShadow: theme.textShadow || 'none',
    };

    if (theme.headingGradient) {
        headingStyle.backgroundImage = theme.headingGradient;
        headingStyle.WebkitBackgroundClip = 'text';
        headingStyle.WebkitTextFillColor = 'transparent';
        headingStyle.backgroundClip = 'text';
    }

    return {
        container: { background: theme.background } as CSSProperties,
        heading: headingStyle,
        text: { color: theme.textColor } as CSSProperties,
    };
};

export const themes: Record<string, ThemeConfig> = {
    'presentify-dark': {
        id: 'presentify-dark',
        label: 'Presentify Dark',
        baseTheme: 'black',
        selectorColor: 'bg-indigo-600',
        background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.95) 0%, rgba(59, 7, 100, 0.9) 50%, rgba(80, 7, 36, 0.8) 100%)',
        headingColor: '#ffffff',
        headingGradient: 'linear-gradient(to right, #a5b4fc, #d8b4fe, #f9a8d4)',
        textColor: '#c7d2fe',
        thumbBgClass: 'bg-gradient-to-br from-indigo-950 to-purple-950',
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
        headingColor: '#fca5a5',
        textShadow: '0 0 40px rgba(219, 39, 119, 0.6)',
        textColor: '#fbcfe8',
        thumbBgClass: 'bg-gradient-to-br from-purple-950 to-pink-950',
        bgEffectClass: 'theme-bg-effect',
        bgEffectClass2: 'theme-bg-effect-2',
        customCss: `
            .theme-bg-effect {
                position: fixed;
                inset: 0;
                background: radial-gradient(circle at 50% 50%, rgba(219, 39, 119, 0.28) 0%, transparent 70%);
                animation: pulse-ring 8s ease-in-out infinite;
                z-index: 0;
            }
            .theme-bg-effect-2 {
                position: fixed;
                inset: 0;
                background: radial-gradient(circle at 30% 70%, rgba(124, 58, 237, 0.35) 0%, transparent 60%);
                z-index: 0;
            }
        `
    },
    'cyber-midnight': {
        id: 'cyber-midnight',
        label: 'Cyber Midnight',
        baseTheme: 'black',
        selectorColor: 'bg-emerald-600',
        background: '#030712',
        headingColor: '#34d399',
        textShadow: '0 0 30px rgba(16, 185, 129, 0.4)',
        textColor: '#a7f3d0',
        thumbBgClass: 'bg-[#030712]',
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
            }
            .theme-bg-effect-2 {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                height: 60%;
                background: linear-gradient(to top, rgba(16, 185, 129, 0.15) 0%, transparent 100%);
                z-index: 0;
            }
            .reveal h1, .preview-h1 {
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
        headingColor: '#fca5a5',
        textShadow: '0 0 30px rgba(220, 38, 38, 0.5)',
        textColor: '#fecaca',
        thumbBgClass: 'bg-red-950',
        bgEffectClass: 'theme-bg-effect',
        customCss: `
            .theme-bg-effect {
                position: fixed;
                inset: -50px;
                background: radial-gradient(ellipse 80% 60% at 50% 30%, rgba(185, 28, 28, 0.6) 0%, transparent 60%);
                filter: blur(50px);
                animation: pulse-ring 10s ease-in-out infinite;
                z-index: 0;
            }
        `
    },
    'night': {
        id: 'night',
        label: 'Night',
        baseTheme: 'black',
        selectorColor: 'bg-blue-900',
        background: 'linear-gradient(180deg, #020617 0%, #172554 100%)',
        headingColor: '#f8fafc',
        textShadow: '0 8px 30px rgba(0,0,0,0.5)',
        textColor: '#cbd5e1',
        thumbBgClass: 'bg-slate-900',
        bgEffectClass: 'theme-bg-effect',
        customCss: `
            .theme-bg-effect {
                position: fixed;
                inset: -100px;
                background: 
                    radial-gradient(ellipse 70% 50% at 15% 20%, rgba(30, 68, 158, 0.6) 0%, transparent 50%),
                    radial-gradient(ellipse 60% 60% at 85% 80%, rgba(23, 47, 104, 0.7) 0%, transparent 50%);
                filter: blur(60px);
                animation: orbit 80s linear infinite;
                z-index: 0;
            }
            .reveal h1, .preview-h1 { 
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
        headingColor: '#f1f5f9',
        textColor: '#94a3b8',
        thumbBgClass: 'bg-slate-900',
        bgEffectClass: 'theme-bg-effect',
        customCss: `
            .theme-bg-effect {
                position: fixed;
                inset: 0;
                background: radial-gradient(circle at 70% 30%, rgba(148, 163, 184, 0.25) 0%, transparent 60%);
                z-index: 0;
            }
        `
    },
    'minimal-glass': {
        id: 'minimal-glass',
        label: 'Minimal Glass',
        baseTheme: 'white',
        selectorColor: 'bg-slate-400',
        background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
        headingColor: '#0f172a',
        textColor: '#334155',
        thumbBgClass: 'bg-gray-200',
        bgEffectClass: 'theme-bg-effect',
        customCss: `
            .theme-bg-effect {
                position: fixed;
                inset: 0;
                background: 
                    radial-gradient(circle at 10% 10%, rgba(99, 102, 241, 0.1) 0%, transparent 40%),
                    radial-gradient(circle at 90% 90%, rgba(168, 85, 247, 0.1) 0%, transparent 40%);
                z-index: 0;
            }
            .reveal h1, .preview-h1 { 
                font-size: 3.5rem !important;
                letter-spacing: -0.03em;
                font-weight: 800;
            }
        `
    },
    'white': {
        id: 'white',
        label: 'White',
        baseTheme: 'white',
        selectorColor: 'bg-gray-200',
        background: '#ffffff',
        headingColor: '#000000',
        textColor: '#333333',
        thumbBgClass: 'bg-gray-100',
    },
    'black': {
        id: 'black',
        label: 'Cosmos Black',
        baseTheme: 'black',
        selectorColor: 'bg-black',
        background: '#000000',
        headingColor: '#ffffff',
        textColor: '#eeeeee',
        thumbBgClass: 'bg-black',
    }
};

export const getTheme = (id: string): ThemeConfig => {
    return themes[id] || themes['black'];
};