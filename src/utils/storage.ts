import type { Presentation, UserSettings, Folder } from '../types';

const STORAGE_KEY = 'presentify_decks';
const FOLDERS_KEY = 'presentify_folders';

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

    getFolders(): Folder[] {
        const data = localStorage.getItem(FOLDERS_KEY);
        try {
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Failed to parse folders:', e);
            return [];
        }
    },

    saveFolder(folder: Folder): void {
        const all = this.getFolders();
        const index = all.findIndex(f => f.id === folder.id);

        if (index >= 0) {
            all[index] = folder;
        } else {
            all.push(folder);
        }

        localStorage.setItem(FOLDERS_KEY, JSON.stringify(all));
        window.dispatchEvent(new Event('storage'));
    },

    deleteFolder(id: string): void {
        // Delete folder
        const all = this.getFolders().filter(f => f.id !== id);
        localStorage.setItem(FOLDERS_KEY, JSON.stringify(all));

        // Uncategorize presentations in this folder
        const presentations = this.getPresentations();
        const updated = presentations.map(p =>
            p.folderId === id ? { ...p, folderId: undefined } : p
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

        window.dispatchEvent(new Event('storage'));
    },

    updatePresentationFolder(presentationId: string, folderId: string | undefined): void {
        const all = this.getPresentations();
        const index = all.findIndex(p => p.id === presentationId);
        if (index >= 0) {
            all[index] = { ...all[index], folderId, updatedAt: Date.now() };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
            window.dispatchEvent(new Event('storage'));
        }
    },

    getSettings(): UserSettings {
        const data = localStorage.getItem('presentify_settings');
        const defaults: UserSettings = {
            defaultTheme: 'presentify-dark',
            defaultFontFamily: 'Tahoma',
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

