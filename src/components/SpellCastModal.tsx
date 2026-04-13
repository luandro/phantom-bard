import { useState } from 'react';
import { useGame } from '@/hooks/use-game';
import { X, Wand2, User } from 'lucide-react';

interface SpellCastModalProps {
  open: boolean;
  onClose: () => void;
  onCast: (characterName: string, spell: string) => void;
}

export function SpellCastModal({ open, onClose, onCast }: SpellCastModalProps) {
  const { state } = useGame();
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
  const [selectedSpell, setSelectedSpell] = useState<string | null>(null);

  if (!open) return null;

  const casters = state.party.filter(c => c.spells.length > 0);
  const selectedChar = casters.find(c => c.id === selectedCharId);

  const handleCast = () => {
    if (selectedChar && selectedSpell) {
      onCast(selectedChar.name, selectedSpell);
      setSelectedCharId(null);
      setSelectedSpell(null);
      onClose();
    }
  };

  const rarityColor = (spell: string) => {
    if (spell.includes('(cantrip)')) return 'border-muted-foreground/30 text-muted-foreground';
    if (spell.includes('(1st)')) return 'border-success/40 text-success';
    if (spell.includes('(2nd)')) return 'border-gold/40 text-gold';
    if (spell.includes('(3rd)')) return 'border-magic/40 text-magic';
    return 'border-border text-foreground';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-magic" />
            <h2 className="font-display text-lg text-foreground">Cast a Spell</h2>
          </div>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-fantasy">
          {/* Step 1: Pick caster */}
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-display">1. Choose a spellcaster</p>
            {casters.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No party members can cast spells.</p>
            ) : (
              <div className="grid gap-2">
                {casters.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { setSelectedCharId(c.id); setSelectedSpell(null); }}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-left transition-colors ${
                      selectedCharId === c.id
                        ? 'border-magic bg-magic/10 text-foreground'
                        : 'border-border bg-secondary/50 text-muted-foreground hover:border-muted-foreground'
                    }`}
                  >
                    <User className="w-4 h-4 shrink-0" />
                    <div>
                      <span className="text-sm font-display">{c.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">Lv{c.level} {c.class} · {c.spells.length} spells</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Step 2: Pick spell */}
          {selectedChar && (
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-display">2. Choose a spell for {selectedChar.name}</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedChar.spells.map((spell) => (
                  <button
                    key={spell}
                    onClick={() => setSelectedSpell(spell)}
                    className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                      selectedSpell === spell
                        ? 'bg-magic/20 border-magic text-magic font-semibold'
                        : `bg-card/50 ${rarityColor(spell)} hover:bg-accent/30`
                    }`}
                  >
                    {spell}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border">
          <button
            onClick={handleCast}
            disabled={!selectedChar || !selectedSpell}
            className="w-full py-2.5 bg-magic text-white rounded-lg font-display text-sm hover:bg-magic/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Wand2 className="w-4 h-4" />
            {selectedSpell ? `Cast ${selectedSpell.replace(/ \(.*\)/, '')}` : 'Select a spell'}
          </button>
        </div>
      </div>
    </div>
  );
}
