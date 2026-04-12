import { useState } from 'react';
import { type Character, RACES, CLASSES, SUBCLASSES, getSpellsForCharacter } from '@/lib/types';
import { createCharacter, getStatModifier } from '@/lib/game-store';
import { useGame } from '@/hooks/use-game';
import { motion, AnimatePresence } from 'framer-motion';
import { Sword, Plus, Trash2, Play, Sparkles, Heart, ScrollText, Wand2, Shield, ChevronDown, ChevronUp } from 'lucide-react';

export function GameSetup() {
  const { startCampaign } = useGame();
  const [step, setStep] = useState<'campaign' | 'party'>('campaign');
  const [campaignName, setCampaignName] = useState('');
  const [campaignLevel, setCampaignLevel] = useState(1);
  const [party, setParty] = useState<Character[]>([]);
  const [showCharForm, setShowCharForm] = useState(false);
  const [expandedChar, setExpandedChar] = useState<string | null>(null);

  // Character form state
  const [charName, setCharName] = useState('');
  const [charRace, setCharRace] = useState<string>(RACES[0]);
  const [charClass, setCharClass] = useState<string>(CLASSES[0]);
  const [charSubclass, setCharSubclass] = useState<string>(SUBCLASSES[CLASSES[0]][0]);
  const [stats, setStats] = useState({ STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 });

  const handleClassChange = (cls: string) => {
    setCharClass(cls);
    setCharSubclass(SUBCLASSES[cls]?.[0] ?? '');
  };

  const addCharacter = () => {
    if (!charName.trim()) return;
    const char = createCharacter({
      name: charName,
      race: charRace,
      class: charClass,
      subclass: charSubclass,
      level: campaignLevel,
      stats,
    });
    setParty([...party, char]);
    setCharName('');
    setStats({ STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 });
    setShowCharForm(false);
    setExpandedChar(char.id);
  };

  const removeCharacter = (id: string) => {
    setParty(party.filter(c => c.id !== id));
    if (expandedChar === id) setExpandedChar(null);
  };

  const rollStats = () => {
    const roll4d6 = () => {
      const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
      rolls.sort((a, b) => a - b);
      return rolls.slice(1).reduce((a, b) => a + b, 0);
    };
    setStats({ STR: roll4d6(), DEX: roll4d6(), CON: roll4d6(), INT: roll4d6(), WIS: roll4d6(), CHA: roll4d6() });
  };

  const canStart = campaignName.trim() && party.length > 0;

  // Campaign step
  if (step === 'campaign') {
    return (
      <div className="min-h-screen bg-fantasy-gradient flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
          <div className="text-center mb-8">
            <Sword className="w-12 h-12 text-gold mx-auto mb-4" />
            <h1 className="text-4xl font-display font-bold text-gold text-glow-gold">Realm of Fate</h1>
            <p className="text-muted-foreground mt-2 text-lg">Begin Your Adventure</p>
          </div>

          <div className="bg-card-gradient rounded-xl border border-border p-6 border-glow-gold space-y-6">
            <div>
              <label className="block font-display text-sm text-gold-muted mb-2">Campaign Name</label>
              <input
                value={campaignName}
                onChange={e => setCampaignName(e.target.value)}
                placeholder="e.g. Lost Mine of Phandelver"
                className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 font-body"
              />
              <p className="text-xs text-muted-foreground mt-1">Try a classic campaign or create your own!</p>
            </div>

            <div>
              <label className="block font-display text-sm text-gold-muted mb-2">Party Level</label>
              <div className="flex items-center gap-4">
                <input type="range" min={1} max={20} value={campaignLevel} onChange={e => setCampaignLevel(parseInt(e.target.value))} className="flex-1 accent-gold" />
                <span className="text-gold font-display text-xl w-8 text-center">{campaignLevel}</span>
              </div>
            </div>

            <button
              onClick={() => campaignName.trim() && setStep('party')}
              disabled={!campaignName.trim()}
              className="w-full bg-primary text-primary-foreground font-display text-lg py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue to Party Creation
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Party step
  return (
    <div className="min-h-screen bg-fantasy-gradient pb-24">
      <div className="max-w-2xl mx-auto p-4">
        {/* Header */}
        <div className="text-center mb-6 pt-4">
          <h1 className="text-2xl font-display font-bold text-gold text-glow-gold">{campaignName}</h1>
          <p className="text-muted-foreground text-sm">Level {campaignLevel} · Build your party</p>
          <button onClick={() => setStep('campaign')} className="text-xs text-gold-muted hover:text-gold mt-1 transition-colors">← Change campaign</button>
        </div>

        {/* Party Characters as Sheets */}
        <div className="space-y-4 mb-4">
          <AnimatePresence>
            {party.map(char => (
              <motion.div
                key={char.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <CharacterSheet
                  char={char}
                  expanded={expandedChar === char.id}
                  onToggle={() => setExpandedChar(expandedChar === char.id ? null : char.id)}
                  onRemove={() => removeCharacter(char.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Add Character */}
        {!showCharForm ? (
          <button
            onClick={() => setShowCharForm(true)}
            className="w-full border-2 border-dashed border-gold/30 rounded-xl py-4 flex items-center justify-center gap-2 text-gold hover:border-gold/60 hover:bg-gold/5 transition-all font-display"
          >
            <Plus className="w-5 h-5" /> Add Character
          </button>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card-gradient rounded-xl border border-gold/30 border-glow-gold p-5 space-y-4">
            <h3 className="font-display text-gold text-sm">New Character</h3>

            <input
              value={charName}
              onChange={e => setCharName(e.target.value)}
              placeholder="Character name"
              className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50"
              autoFocus
            />

            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Race</label>
                <select value={charRace} onChange={e => setCharRace(e.target.value)} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground text-sm">
                  {RACES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Class</label>
                <select value={charClass} onChange={e => handleClassChange(e.target.value)} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground text-sm">
                  {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Subclass</label>
                <select value={charSubclass} onChange={e => setCharSubclass(e.target.value)} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground text-sm">
                  {(SUBCLASSES[charClass] ?? []).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Ability Scores */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gold-muted font-display">Ability Scores</span>
                <button onClick={rollStats} className="flex items-center gap-1 text-xs text-gold hover:text-gold/80 transition-colors">
                  <Sparkles className="w-3 h-3" /> Roll 4d6
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(stats) as Array<keyof typeof stats>).map(stat => {
                  const mod = getStatModifier(stats[stat]);
                  return (
                    <div key={stat} className="bg-muted/40 rounded-lg p-2 text-center border border-border">
                      <div className="text-[10px] text-muted-foreground font-display">{stat}</div>
                      <input
                        type="number" min={3} max={20} value={stats[stat]}
                        onChange={e => setStats({ ...stats, [stat]: parseInt(e.target.value) || 10 })}
                        className="w-full bg-transparent text-center text-lg text-foreground font-display focus:outline-none"
                      />
                      <div className="text-xs text-gold-muted">({mod >= 0 ? '+' : ''}{mod})</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Preview spells */}
            {(() => {
              const previewSpells = getSpellsForCharacter(charClass, charSubclass, campaignLevel);
              if (previewSpells.length === 0) return null;
              return (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Wand2 className="w-3.5 h-3.5 text-magic" />
                    <span className="text-sm text-gold-muted font-display">Available Spells</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto scrollbar-fantasy">
                    {previewSpells.map((spell, i) => (
                      <span key={i} className="text-[11px] bg-magic/10 text-magic border border-magic/20 px-2 py-0.5 rounded-full">{spell}</span>
                    ))}
                  </div>
                </div>
              );
            })()}

            <div className="flex gap-2">
              <button onClick={addCharacter} disabled={!charName.trim()} className="flex-1 bg-primary text-primary-foreground rounded-lg py-2.5 font-display text-sm hover:bg-primary/90 transition-colors disabled:opacity-40">
                Add to Party
              </button>
              <button onClick={() => setShowCharForm(false)} className="px-4 bg-secondary text-secondary-foreground rounded-lg py-2.5 text-sm hover:bg-secondary/80 transition-colors">
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Sticky Begin Adventure button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => canStart && startCampaign(campaignName, campaignLevel, party)}
            disabled={!canStart}
            className="w-full bg-primary text-primary-foreground font-display text-lg py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
          >
            <Play className="w-5 h-5" />
            {party.length === 0 ? 'Add at least one character' : `Begin Adventure (${party.length} adventurer${party.length > 1 ? 's' : ''})`}
          </button>
        </div>
      </div>
    </div>
  );
}

function CharacterSheet({ char, expanded, onToggle, onRemove }: { char: Character; expanded: boolean; onToggle: () => void; onRemove: () => void }) {
  const hpPercent = (char.hp / char.maxHp) * 100;

  return (
    <div className="bg-card-gradient rounded-xl border border-border overflow-hidden">
      {/* Header bar */}
      <button onClick={onToggle} className="w-full flex items-center justify-between p-4 text-left hover:bg-accent/20 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center font-display text-primary text-lg">
            {char.name[0]}
          </div>
          <div>
            <div className="font-display text-foreground">{char.name}</div>
            <div className="text-xs text-muted-foreground">Lv{char.level} {char.race} {char.class} · {char.subclass}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-danger" />
            <span className="text-sm text-foreground">{char.hp}/{char.maxHp}</span>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
              {/* HP Bar */}
              <div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Hit Points</span>
                  <span>{char.hp} / {char.maxHp}</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${hpPercent > 50 ? 'bg-success' : hpPercent > 25 ? 'bg-gold' : 'bg-danger'}`}
                    style={{ width: `${hpPercent}%` }}
                  />
                </div>
              </div>

              {/* Ability Scores - Character Sheet Grid */}
              <div>
                <h4 className="text-xs text-gold-muted font-display mb-2 flex items-center gap-1.5">
                  <ScrollText className="w-3 h-3" /> Ability Scores
                </h4>
                <div className="grid grid-cols-6 gap-1.5">
                  {Object.entries(char.stats).map(([stat, val]) => {
                    const mod = getStatModifier(val);
                    return (
                      <div key={stat} className="bg-muted/40 rounded-lg p-1.5 text-center border border-border">
                        <div className="text-[9px] text-muted-foreground font-display">{stat}</div>
                        <div className="text-base font-display text-foreground leading-tight">{val}</div>
                        <div className="text-[10px] text-gold-muted">({mod >= 0 ? '+' : ''}{mod})</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Spells */}
              {char.spells.length > 0 && (
                <div>
                  <h4 className="text-xs text-gold-muted font-display mb-2 flex items-center gap-1.5">
                    <Wand2 className="w-3 h-3 text-magic" /> Spells
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {char.spells.map((spell, i) => (
                      <span key={i} className="text-[11px] bg-magic/10 text-magic border border-magic/20 px-2 py-0.5 rounded-full">
                        {spell}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Inventory */}
              <div>
                <h4 className="text-xs text-gold-muted font-display mb-2 flex items-center gap-1.5">
                  <Shield className="w-3 h-3" /> Inventory
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {char.inventory.map((item, i) => (
                    <span key={i} className="text-[11px] bg-muted/50 text-muted-foreground border border-border px-2 py-0.5 rounded-full">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Remove */}
              <button onClick={onRemove} className="flex items-center gap-1.5 text-xs text-danger/70 hover:text-danger transition-colors">
                <Trash2 className="w-3 h-3" /> Remove from party
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
