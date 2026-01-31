import type { Presentation, UserSettings } from '../types';

const STORAGE_KEY = 'presentify_decks';

export const storage = {
    savePresentation(presentation: Presentation): void {
        const all = this.getPresentations();
        const index = all.findIndex(p => p.id === presentation.id);

        if (index >= 0) {
            all[index] = { ...presentation, updatedAt: Date.now() };
        } else {
            all.push({ ...presentation, createdAt: Date.now(), updatedAt: Date.now() });
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
        window.dispatchEvent(new Event('storage'));
    },

    getPresentations(): Presentation[] {
        const data = localStorage.getItem(STORAGE_KEY);
        try {
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Failed to parse presentations:', e);
            return [];
        }
    },

    getPresentationById(id: string): Presentation | undefined {
        return this.getPresentations().find(p => p.id === id);
    },

    deletePresentation(id: string): void {
        const all = this.getPresentations().filter(p => p.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
        window.dispatchEvent(new Event('storage'));
    },

    getSettings(): UserSettings {
        const data = localStorage.getItem('presentify_settings');
        const defaults: UserSettings = {
            defaultTheme: 'presentify-dark',
            defaultFontFamily: 'Outfit',
            defaultAlignment: 'center',
            jumpToCurrentSlide: true
        };
        try {
            return data ? { ...defaults, ...JSON.parse(data) } : defaults;
        } catch (e) {
            return defaults;
        }
    },

    saveSettings(settings: UserSettings): void {
        localStorage.setItem('presentify_settings', JSON.stringify(settings));
    }
};

