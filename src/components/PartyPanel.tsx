import { useGame } from '@/hooks/use-game';
import { getStatModifier } from '@/lib/game-store';
import { Heart, Shield, Swords, Wand2 } from 'lucide-react';

export function PartyPanel() {
  const { state } = useGame();

  return (
    <div className="p-3 space-y-3">
      <h3 className="font-display text-sm text-gold-muted">Party</h3>
      {state.party.map((char, i) => {
        const isActive = i === state.currentTurn % state.party.length;
        const hpPercent = (char.hp / char.maxHp) * 100;
        const hpColor = hpPercent > 50 ? 'bg-success' : hpPercent > 25 ? 'bg-gold' : 'bg-danger';

        return (
          <div
            key={char.id}
            className={`bg-card-gradient rounded-lg p-3 border transition-colors ${isActive ? 'border-gold/50 border-glow-gold' : 'border-border'}`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-display text-sm text-foreground">{char.name}</span>
              {isActive && <Swords className="w-3.5 h-3.5 text-gold" />}
            </div>
            <div className="text-xs text-muted-foreground mb-2">
              Lv{char.level} {char.race} {char.class} · {char.subclass}
            </div>

            {/* HP Bar */}
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-3 h-3 text-danger" />
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div className={`h-full ${hpColor} transition-all duration-500 rounded-full`} style={{ width: `${hpPercent}%` }} />
              </div>
              <span className="text-xs text-muted-foreground">{char.hp}/{char.maxHp}</span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-1">
              {Object.entries(char.stats).map(([stat, val]) => {
                const mod = getStatModifier(val);
                return (
                  <div key={stat} className="text-center bg-muted/30 rounded py-0.5">
                    <div className="text-[10px] text-muted-foreground">{stat}</div>
                    <div className="text-xs text-foreground font-display">{val} <span className="text-gold-muted">({mod >= 0 ? '+' : ''}{mod})</span></div>
                  </div>
                );
              })}
            </div>

            {/* Inventory */}
            {char.inventory.length > 0 && (
              <div className="mt-2">
                <div className="flex items-center gap-1 mb-1">
                  <Shield className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">Inventory</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {char.inventory.slice(0, 5).map((item, idx) => (
                    <span key={idx} className="text-[10px] bg-muted/50 px-1.5 py-0.5 rounded text-muted-foreground">{item}</span>
                  ))}
                  {char.inventory.length > 5 && (
                    <span className="text-[10px] text-muted-foreground">+{char.inventory.length - 5} more</span>
                  )}
                </div>
              </div>
            )}

            {/* Spells */}
            {char.spells.length > 0 && (
              <div className="mt-2">
                <div className="flex items-center gap-1 mb-1">
                  <Wand2 className="w-3 h-3 text-magic" />
                  <span className="text-[10px] text-muted-foreground">Spells</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {char.spells.slice(0, 4).map((spell, idx) => (
                    <span key={idx} className="text-[10px] bg-magic/10 text-magic px-1.5 py-0.5 rounded">{spell}</span>
                  ))}
                  {char.spells.length > 4 && (
                    <span className="text-[10px] text-muted-foreground">+{char.spells.length - 4} more</span>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
