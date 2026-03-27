import { storage } from './storage';
import { fontStorage } from './fontStorage';
import { imageStorage } from './imageStorage';
import type { Presentation, Folder, UserSettings } from '../types';

export interface ExportBundle {
    version: string;
    timestamp: number;
    presentations: Presentation[];
    folders: Folder[];
    settings: UserSettings;
    fonts?: any[]; // Full CustomFont fields with base64 data
    images?: any[]; // Full LocalImage fields with base64 data
}

// Helper to convert ArrayBuffer/Blob to Base64
const bufferToBase64 = (buffer: ArrayBuffer): string => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
};

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1] || result;
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

// Helper to convert Base64 back
const base64ToBuffer = (base64: string): ArrayBuffer => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
};

const base64ToBlob = (base64: string, type: string): Blob => {
    return new Blob([base64ToBuffer(base64)], { type });
};

export interface ExportOptions {
    includeFonts?: boolean;
    includeImages?: boolean;
}

export const exportImport = {
    async createBundle(presentationIds?: string[], options: ExportOptions = { includeFonts: true, includeImages: true }): Promise<ExportBundle> {
        const allPresentations = storage.getPresentations();
        const presentations = presentationIds 
            ? allPresentations.filter(p => presentationIds.includes(p.id))
            : allPresentations;
        
        const folders = storage.getFolders();
        const settings = storage.getSettings();

        const bundle: ExportBundle = {
            version: '1.0',
            timestamp: Date.now(),
            presentations,
            folders,
            settings
        };

        if (options.includeFonts) {
            const fonts = await fontStorage.getAll();
            bundle.fonts = fonts.map(f => ({
                ...f,
                data: bufferToBase64(f.data)
            }));
        }

        if (options.includeImages) {
            const images = await imageStorage.getAll();
            bundle.images = await Promise.all(images.map(async img => ({
                ...img,
                data: await blobToBase64(img.data)
            })));
        }

        return bundle;
    },

    downloadBundle(bundle: ExportBundle, filename: string) {
        const json = JSON.stringify(bundle);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    },

    async importBundle(bundle: ExportBundle): Promise<{ count: number }> {
        if (!bundle.presentations) throw new Error('Invalid bundle: no presentations found');

        for (const p of bundle.presentations) {
            storage.savePresentation(p);
        }

        if (bundle.folders) {
            for (const f of bundle.folders) {
                storage.saveFolder(f);
            }
        }

        if (bundle.fonts) {
            for (const f of bundle.fonts) {
                await fontStorage.save({
                    ...f,
                    data: base64ToBuffer(f.data)
                });
            }
        }

        if (bundle.images) {
            for (const img of bundle.images) {
                await imageStorage.save({
                    ...img,
                    data: base64ToBlob(img.data, img.type)
                });
            }
        }

        return { count: bundle.presentations.length };
    }
};
