import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'presentify_local_images';
const STORE_NAME = 'images';
const DB_VERSION = 1;

export interface LocalImage {
    id: string; // generated local ID (e.g. local-img-uuid)
    name: string;
    data: Blob;
    type: string;
    createdAt: number;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

const getDB = () => {
    if (!dbPromise) {
        dbPromise = openDB(DB_NAME, DB_VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }
            },
        });
    }
    return dbPromise;
};

export const imageStorage = {
    async getAll(): Promise<LocalImage[]> {
        const db = await getDB();
        return db.getAll(STORE_NAME);
    },

    async save(image: LocalImage): Promise<void> {
        const db = await getDB();
        await db.put(STORE_NAME, image);
        window.dispatchEvent(new Event('local-images-changed'));
    },

    async delete(id: string): Promise<void> {
        const db = await getDB();
        await db.delete(STORE_NAME, id);
        window.dispatchEvent(new Event('local-images-changed'));
    },

    async getById(id: string): Promise<LocalImage | undefined> {
        const db = await getDB();
        return db.get(STORE_NAME, id);
    }
};

const resolvedImages = new Map<string, string>();

export const resolveLocalImages = async (text: string): Promise<string> => {
    const localImgRegex = /local-img-[a-f0-9-]+/g;
    const matches = text.match(localImgRegex);
    if (!matches) return text;

    const uniqueMatches = Array.from(new Set(matches)).sort((a, b) => b.length - a.length);
    
    let result = text;
    for (const id of uniqueMatches) {
        if (!resolvedImages.has(id)) {
            const img = await imageStorage.getById(id);
            if (img) {
                const url = URL.createObjectURL(img.data);
                resolvedImages.set(id, url);
            }
        }
        const url = resolvedImages.get(id);
        if (url) {
            // Use split/join for global replace; since we sort by length desc, 
            // partial overlaps shouldn't happen for these specific IDs
            result = result.split(id).join(url);
        }
    }
    return result;
};

// Cleanup blob URLs to prevent memory leaks
export const clearImageCache = () => {
    resolvedImages.forEach(url => URL.revokeObjectURL(url));
    resolvedImages.clear();
};
