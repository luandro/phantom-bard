import { useState, useCallback, useEffect, createContext, useContext, type ReactNode } from 'react';
import { type GameState, type Character, type StoryEntry, type DiceRoll, PREBUILT_CAMPAIGNS, type Campaign, type GroupPatron } from '@/lib/types';
import { createDefaultGameState, loadGameState, saveGameState, clearGameState, createStoryEntry, rollDice, createCharacter } from '@/lib/game-store';

interface GameContextType {
  state: GameState;
  isLoading: boolean;
  startCampaign: (name: string, level: number, party: Character[], patron?: GroupPatron) => void;
  addStoryEntry: (entry: StoryEntry) => void;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  performDiceRoll: (sides: number, modifier?: number) => DiceRoll;
  sendPlayerAction: (action: string) => Promise<void>;
  resetGame: () => void;
  matchedCampaign: Campaign | null;
}

const GameContext = createContext<GameContextType | null>(null);

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(() => loadGameState() ?? createDefaultGameState());
  const [isLoading, setIsLoading] = useState(false);
  const [matchedCampaign, setMatchedCampaign] = useState<Campaign | null>(null);

  useEffect(() => { saveGameState(state); }, [state]);

  const addStoryEntry = useCallback((entry: StoryEntry) => {
    setState(prev => ({ ...prev, storyLog: [...prev.storyLog, entry] }));
  }, []);

  const updateCharacter = useCallback((id: string, updates: Partial<Character>) => {
    setState(prev => ({
      ...prev,
      party: prev.party.map(c => c.id === id ? { ...c, ...updates } : c),
    }));
  }, []);

  const performDiceRoll = useCallback((sides: number, modifier: number = 0) => {
    const roll = rollDice(sides, modifier);
    const label = roll.isCriticalSuccess ? '🎯 CRITICAL SUCCESS!' : roll.isCriticalFail ? '💀 CRITICAL FAIL!' : '';
    addStoryEntry(createStoryEntry('dice', `Rolled ${roll.type}: ${roll.result}${modifier !== 0 ? ` (${modifier >= 0 ? '+' : ''}${modifier}) = ${roll.total}` : ''} ${label}`));
    return roll;
  }, [addStoryEntry]);

  const startCampaign = useCallback((name: string, level: number, party: Character[], patron?: GroupPatron) => {
    const matched = PREBUILT_CAMPAIGNS.find(c => c.name.toLowerCase() === name.toLowerCase());
    setMatchedCampaign(matched ?? null);

    const opening = matched
      ? matched.opening
      : `Your adventure "${name}" begins...`;

    setState({
      campaignName: name,
      campaignLevel: level,
      party,
      storyLog: [createStoryEntry('narration', opening)],
      currentTurn: 0,
      isInCombat: false,
      gameStarted: true,
      groupPatron: patron,
    });

    // Trigger AI for initial scene
    setTimeout(() => {
      sendInitialScene(name, level, party, matched ?? null, patron);
    }, 500);
  }, []);

  const sendInitialScene = async (name: string, level: number, party: Character[], campaign: Campaign | null, patron?: GroupPatron) => {
    setIsLoading(true);
    try {
      const partyDesc = party.map(c => `${c.name} (Level ${c.level} ${c.race} ${c.class}, HP: ${c.hp}/${c.maxHp})`).join(', ');
      const campaignContext = campaign
        ? `Campaign: "${campaign.name}". Quest: ${campaign.questHook}. Tone: ${campaign.tone}. Key locations: ${campaign.locations.join(', ')}. Enemies: ${campaign.enemies.join(', ')}.`
        : `Original campaign: "${name}". Create a compelling opening scene.`;
      const patronCtx = patron ? ` The party is sponsored by "${patron.name}" (${patron.type}): ${patron.description}. Perks: ${patron.perks.join(', ')}.` : '';

      const response = await callAIDM([
        { role: 'user', content: `Begin the campaign. ${campaignContext} Party: ${partyDesc}. Level: ${level}. Set the scene with vivid description, present the party with their first situation, and give them clear choices for what to do next. Keep it to 2-3 paragraphs.` }
      ]);

      setState(prev => ({
        ...prev,
        storyLog: [...prev.storyLog, createStoryEntry('narration', response)],
      }));
    } catch (e) {
      console.error('AI DM error:', e);
      setState(prev => ({
        ...prev,
        storyLog: [...prev.storyLog, createStoryEntry('system', 'The Dungeon Master is gathering their thoughts... (AI temporarily unavailable)')],
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const sendPlayerAction = useCallback(async (action: string) => {
    const activeChar = state.party[state.currentTurn % state.party.length];
    addStoryEntry(createStoryEntry('player', action, activeChar?.name));
    setIsLoading(true);

    try {
      const recentLog = state.storyLog.slice(-10).map(e => {
        if (e.type === 'narration') return `DM: ${e.content}`;
        if (e.type === 'player') return `${e.characterName ?? 'Player'}: ${e.content}`;
        if (e.type === 'dice') return `[${e.content}]`;
        return `[System: ${e.content}]`;
      }).join('\n');

      const partyDesc = state.party.map(c => `${c.name} (Lv${c.level} ${c.race} ${c.class}, HP:${c.hp}/${c.maxHp}, STR:${c.stats.STR} DEX:${c.stats.DEX} CON:${c.stats.CON} INT:${c.stats.INT} WIS:${c.stats.WIS} CHA:${c.stats.CHA})`).join('; ');

      const campaign = matchedCampaign;
      const campaignCtx = campaign ? `Campaign: "${campaign.name}". Tone: ${campaign.tone}.` : `Campaign: "${state.campaignName}".`;

      const response = await callAIDM([
        { role: 'system', content: `You are a D&D Dungeon Master. ${campaignCtx} Party: ${partyDesc}. Rules: 1) Request dice rolls for uncertain outcomes using [ROLL:d20+modifier] format. 2) Adapt difficulty to party level ${state.campaignLevel}. 3) Be descriptive and immersive. 4) Present clear choices. 5) If combat starts, describe enemy positions. 6) Track HP changes with [HP:characterName:-amount] or [HP:characterName:+amount]. 7) Never resolve uncertain outcomes without dice.` },
        { role: 'user', content: `Recent events:\n${recentLog}\n\nPlayer action: ${activeChar?.name ?? 'Player'} says: "${action}"\n\nRespond as the DM. Keep to 2-3 paragraphs.` }
      ]);

      // Parse response for game effects
      const hpChanges = response.matchAll(/\[HP:([^:]+):([+-]\d+)\]/g);
      for (const match of hpChanges) {
        const charName = match[1];
        const amount = parseInt(match[2]);
        const char = state.party.find(c => c.name.toLowerCase() === charName.toLowerCase());
        if (char) {
          updateCharacter(char.id, { hp: Math.max(0, Math.min(char.maxHp, char.hp + amount)) });
        }
      }

      const cleanResponse = response.replace(/\[HP:[^\]]+\]/g, '').trim();

      setState(prev => ({
        ...prev,
        storyLog: [...prev.storyLog, createStoryEntry('narration', cleanResponse)],
        currentTurn: prev.currentTurn + 1,
      }));
    } catch (e) {
      console.error('AI DM error:', e);
      addStoryEntry(createStoryEntry('system', 'The Dungeon Master pauses... (AI temporarily unavailable, try again)'));
    } finally {
      setIsLoading(false);
    }
  }, [state, addStoryEntry, updateCharacter, matchedCampaign]);

  const resetGame = useCallback(() => {
    clearGameState();
    setState(createDefaultGameState());
    setMatchedCampaign(null);
  }, []);

  return (
    <GameContext.Provider value={{ state, isLoading, startCampaign, addStoryEntry, updateCharacter, performDiceRoll, sendPlayerAction, resetGame, matchedCampaign }}>
      {children}
    </GameContext.Provider>
  );
}

async function callAIDM(messages: { role: string; content: string }[]): Promise<string> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const resp = await fetch(`${supabaseUrl}/functions/v1/dm-chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (!resp.ok) {
    if (resp.status === 429) throw new Error('Rate limited');
    if (resp.status === 402) throw new Error('Credits exhausted');
    throw new Error(`AI error: ${resp.status}`);
  }

  const data = await resp.json();
  return data.content;
}
