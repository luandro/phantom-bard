import { useState } from 'react';
import { useGame } from '@/hooks/use-game';
import { motion, AnimatePresence } from 'framer-motion';
import { getStatModifier } from '@/lib/game-store';

const DICE = [
  { sides: 20, label: 'd20', color: 'bg-gold' },
  { sides: 12, label: 'd12', color: 'bg-magic' },
  { sides: 10, label: 'd10', color: 'bg-success' },
  { sides: 8, label: 'd8', color: 'bg-chart-5' },
  { sides: 6, label: 'd6', color: 'bg-danger' },
  { sides: 4, label: 'd4', color: 'bg-gold-muted' },
];

export function DiceRoller() {
  const { performDiceRoll, state } = useGame();
  const [lastRoll, setLastRoll] = useState<{ result: number; type: string; total: number; crit: boolean; fail: boolean } | null>(null);
  const [selectedStat, setSelectedStat] = useState<string>('none');

  const activeChar = state.party[state.currentTurn % state.party.length];
  const modifier = selectedStat !== 'none' && activeChar
    ? getStatModifier(activeChar.stats[selectedStat as keyof typeof activeChar.stats])
    : 0;

  const handleRoll = (sides: number) => {
    const roll = performDiceRoll(sides, modifier);
    setLastRoll({ result: roll.result, type: roll.type, total: roll.total, crit: roll.isCriticalSuccess, fail: roll.isCriticalFail });
    setTimeout(() => setLastRoll(null), 3000);
  };

  return (
    <div className="p-3 space-y-3">
      <h3 className="font-display text-sm text-gold-muted">Dice</h3>

      {activeChar && (
        <select
          value={selectedStat}
          onChange={e => setSelectedStat(e.target.value)}
          className="w-full bg-input border border-border rounded px-2 py-1.5 text-xs text-foreground"
        >
          <option value="none">No modifier</option>
          {Object.entries(activeChar.stats).map(([stat, val]) => (
            <option key={stat} value={stat}>{stat} ({getStatModifier(val) >= 0 ? '+' : ''}{getStatModifier(val)})</option>
          ))}
        </select>
      )}

      <div className="grid grid-cols-3 gap-2">
        {DICE.map(d => (
          <button
            key={d.sides}
            onClick={() => handleRoll(d.sides)}
            className={`${d.color} text-primary-foreground font-display text-sm py-2 rounded-lg hover:opacity-80 transition-opacity active:scale-95`}
          >
            {d.label}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {lastRoll && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className={`text-center py-3 rounded-lg border ${lastRoll.crit ? 'bg-success/20 border-success' : lastRoll.fail ? 'bg-danger/20 border-danger' : 'bg-card border-border'}`}
          >
            <div className="font-display text-3xl dice-roll-animation">
              <span className={lastRoll.crit ? 'text-success' : lastRoll.fail ? 'text-danger' : 'text-gold'}>{lastRoll.total}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {lastRoll.type} → {lastRoll.result}{modifier !== 0 ? ` (${modifier >= 0 ? '+' : ''}${modifier})` : ''}
            </div>
            {lastRoll.crit && <div className="text-success text-xs font-display mt-1">CRITICAL!</div>}
            {lastRoll.fail && <div className="text-danger text-xs font-display mt-1">CRITICAL FAIL!</div>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
