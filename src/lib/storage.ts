export interface WordPair {
  word: string;
  meaning: string;
}

export interface WordSet {
  id: string;
  name: string;
  words: WordPair[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "memorizer_word_sets";

export function getWordSets(): WordSet[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to load word sets:", error);
    return [];
  }
}

export function saveWordSets(sets: WordSet[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sets));
  } catch (error) {
    console.error("Failed to save word sets:", error);
  }
}

export function createWordSet(name: string, words: WordPair[]): WordSet {
  return {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    name,
    words,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function addWordSet(wordSet: WordSet): void {
  const sets = getWordSets();
  sets.push(wordSet);
  saveWordSets(sets);
}

export function updateWordSet(id: string, updates: Partial<WordSet>): void {
  const sets = getWordSets();
  const index = sets.findIndex((s) => s.id === id);
  if (index !== -1) {
    sets[index] = {
      ...sets[index],
      ...updates,
      updatedAt: Date.now(),
    };
    saveWordSets(sets);
  }
}

export function deleteWordSet(id: string): void {
  const sets = getWordSets();
  const filtered = sets.filter((s) => s.id !== id);
  saveWordSets(filtered);
}

export function getWordSet(id: string): WordSet | undefined {
  const sets = getWordSets();
  return sets.find((s) => s.id === id);
}
