
import type { SaveData } from '../types.ts';

const SAVE_KEY = 'ai-story-adventure-saves';
const MAX_SAVES = 5;

export const loadGames = (): (SaveData | null)[] => {
    try {
        const rawSaves = localStorage.getItem(SAVE_KEY);
        if (rawSaves) {
            const parsed = JSON.parse(rawSaves);
            // Ensure it's an array and has the correct length
            if (Array.isArray(parsed)) {
                const slots = new Array(MAX_SAVES).fill(null);
                for (let i = 0; i < MAX_SAVES; i++) {
                    if (parsed[i]) {
                        // Basic validation
                        if (parsed[i].scenario && parsed[i].chatHistory && parsed[i].savedAt) {
                            slots[i] = parsed[i];
                        }
                    }
                }
                return slots;
            }
        }
    } catch (error) {
        console.error("Failed to load games from localStorage", error);
        // If parsing fails, clear the corrupted data
        localStorage.removeItem(SAVE_KEY);
    }
    // Return a fresh array of nulls if anything goes wrong or no data exists
    return new Array(MAX_SAVES).fill(null);
};

export const saveGame = (slotIndex: number, data: SaveData): (SaveData | null)[] => {
    const currentSaves = loadGames();
    if (slotIndex >= 0 && slotIndex < MAX_SAVES) {
        currentSaves[slotIndex] = data;
        localStorage.setItem(SAVE_KEY, JSON.stringify(currentSaves));
    }
    return currentSaves;
};

export const deleteGame = (slotIndex: number): (SaveData | null)[] => {
    const currentSaves = loadGames();
     if (slotIndex >= 0 && slotIndex < MAX_SAVES) {
        currentSaves[slotIndex] = null;
        localStorage.setItem(SAVE_KEY, JSON.stringify(currentSaves));
    }
    return currentSaves;
};