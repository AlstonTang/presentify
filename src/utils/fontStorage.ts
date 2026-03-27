import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'presentify_custom_fonts';
const STORE_NAME = 'fonts';
const DB_VERSION = 1;

export interface CustomFont {
    id: string; // generated ID or filename-based
    name: string; // Display name
    fontFamily: string; // The generated @font-face family name
    filename: string;
    data: ArrayBuffer;
    format: 'ttf' | 'otf' | 'woff' | 'woff2';
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

export const fontStorage = {
    async getAll(): Promise<CustomFont[]> {
        const db = await getDB();
        return db.getAll(STORE_NAME);
    },

    async save(font: CustomFont): Promise<void> {
        const db = await getDB();
        await db.put(STORE_NAME, font);
        window.dispatchEvent(new Event('custom-fonts-changed'));
    },

    async delete(id: string): Promise<void> {
        const db = await getDB();
        await db.delete(STORE_NAME, id);
        window.dispatchEvent(new Event('custom-fonts-changed'));
    },

    async getById(id: string): Promise<CustomFont | undefined> {
        const db = await getDB();
        return db.get(STORE_NAME, id);
    }
};
