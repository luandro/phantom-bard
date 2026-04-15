import { type GameState, type Character, type StoryEntry, type DiceRoll, getSpellsForCharacter } from './types';

const STORAGE_KEY = 'dnd-ai-game-state';

export function createDefaultGameState(): GameState {
  return {
    campaignName: '',
    campaignLevel: 1,
    party: [],
    storyLog: [],
    currentTurn: 0,
    isInCombat: false,
    gameStarted: false,
    lootInventory: [],
    pendingRoll: null,
  };
}

export function loadGameState(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export function saveGameState(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function clearGameState(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function createCharacter(partial: Partial<Character> & { name: string; race: string; class: string; subclass: string; level: number }): Character {
  const conMod = Math.floor(((partial.stats?.CON ?? 10) - 10) / 2);
  const baseHp = partial.class === 'Barbarian' ? 12 : ['Fighter', 'Paladin', 'Ranger', 'Blood Hunter'].includes(partial.class) ? 10 : ['Wizard', 'Sorcerer'].includes(partial.class) ? 6 : partial.class === 'Artificer' ? 8 : 8;
  const hp = baseHp + conMod + (partial.level - 1) * (Math.floor(baseHp / 2) + 1 + conMod);
  const spells = getSpellsForCharacter(partial.class, partial.subclass, partial.level);

  return {
    id: crypto.randomUUID(),
    name: partial.name,
    race: partial.race,
    class: partial.class,
    subclass: partial.subclass,
    level: partial.level,
    hp: partial.hp ?? hp,
    maxHp: partial.maxHp ?? hp,
    stats: partial.stats ?? { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
    inventory: partial.inventory ?? ['Backpack', 'Bedroll', 'Rations (5 days)', 'Waterskin', '50 ft rope'],
    spells,
    lineage: partial.lineage,
    groupPatron: partial.groupPatron,
  };
}

export function rollDice(sides: number, modifier: number = 0): DiceRoll {
  const result = Math.floor(Math.random() * sides) + 1;
  return {
    id: crypto.randomUUID(),
    type: `d${sides}`,
    result,
    modifier,
    total: result + modifier,
    isCriticalSuccess: sides === 20 && result === 20,
    isCriticalFail: sides === 20 && result === 1,
    timestamp: Date.now(),
  };
}

export function getStatModifier(stat: number): number {
  return Math.floor((stat - 10) / 2);
}

export function createStoryEntry(type: StoryEntry['type'], content: string, characterName?: string): StoryEntry {
  return {
    id: crypto.randomUUID(),
    type,
    content,
    timestamp: Date.now(),
    characterName,
  };
}
