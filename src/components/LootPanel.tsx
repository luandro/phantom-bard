import { useGame } from '@/hooks/use-game';
import { Gift, User } from 'lucide-react';

const rarityColors: Record<string, string> = {
  common: 'text-muted-foreground border-muted-foreground/20 bg-muted/30',
  uncommon: 'text-success border-success/30 bg-success/10',
  rare: 'text-blue-400 border-blue-400/30 bg-blue-400/10',
  very_rare: 'text-magic border-magic/30 bg-magic/10',
  legendary: 'text-gold border-gold/40 bg-gold/15',
};

const rarityLabels: Record<string, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  very_rare: 'Very Rare',
  legendary: 'Legendary',
};

export function LootPanel() {
  const { state, assignLoot } = useGame();
  const loot = state.lootInventory;

  if (loot.length === 0) {
    return (
      <div className="p-4 text-center">
        <Gift className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
        <p className="text-xs text-muted-foreground">No loot found yet. Keep adventuring!</p>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-2">
      <h3 className="font-display text-sm text-gold-muted flex items-center gap-2">
        <Gift className="w-4 h-4" /> Loot ({loot.length})
      </h3>
      {loot.map(item => (
        <div
          key={item.id}
          className={`rounded-lg p-2.5 border ${rarityColors[item.rarity]}`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-display text-xs">{item.name}</span>
            <span className="text-[10px] opacity-70">{rarityLabels[item.rarity]}</span>
          </div>
          <p className="text-[10px] opacity-70 mb-1">{item.description}</p>
          {item.effect && (
            <p className="text-[10px] font-semibold opacity-80">✦ {item.effect}</p>
          )}
          {/* Assign to character */}
          {!item.assignedTo ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {state.party.map(c => (
                <button
                  key={c.id}
                  onClick={() => assignLoot(item.id, c.id)}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-accent/20 hover:bg-accent/40 transition-colors flex items-center gap-1"
                >
                  <User className="w-2.5 h-2.5" /> {c.name}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-[10px] mt-1 opacity-60 flex items-center gap-1">
              <User className="w-2.5 h-2.5" /> {state.party.find(c => c.id === item.assignedTo)?.name ?? 'Unknown'}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
