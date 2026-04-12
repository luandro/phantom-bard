import { useState } from 'react';
import { type Character, type CustomLineage, RACES, CLASSES, SUBCLASSES, SUBCLASS_ABILITIES, getSpellsForCharacter, CUSTOM_LINEAGE_FEATS, SKILL_PROFICIENCIES, GROUP_PATRONS, type GroupPatron } from '@/lib/types';
import { createCharacter, getStatModifier } from '@/lib/game-store';
import { useGame } from '@/hooks/use-game';
import { motion, AnimatePresence } from 'framer-motion';
import { Sword, Plus, Trash2, Play, Sparkles, Heart, ScrollText, Wand2, Shield, ChevronDown, ChevronUp, Users, Zap, Crown } from 'lucide-react';

export function GameSetup() {
  const { startCampaign } = useGame();
  const [step, setStep] = useState<'campaign' | 'patron' | 'party'>('campaign');
  const [campaignName, setCampaignName] = useState('');
  const [campaignLevel, setCampaignLevel] = useState(1);
  const [party, setParty] = useState<Character[]>([]);
  const [showCharForm, setShowCharForm] = useState(false);
  const [expandedChar, setExpandedChar] = useState<string | null>(null);
  const [selectedPatron, setSelectedPatron] = useState<GroupPatron | null>(null);

  // Character form state
  const [charName, setCharName] = useState('');
  const [charRace, setCharRace] = useState<string>(RACES[0]);
  const [charClass, setCharClass] = useState<string>(CLASSES[0]);
  const [charSubclass, setCharSubclass] = useState<string>(SUBCLASSES[CLASSES[0]][0]);
  const [stats, setStats] = useState({ STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 });

  // Custom lineage state
  const [useCustomLineage, setUseCustomLineage] = useState(false);
  const [lineageFeat, setLineageFeat] = useState<string>(CUSTOM_LINEAGE_FEATS[0]);
  const [lineageSkill, setLineageSkill] = useState<string>(SKILL_PROFICIENCIES[0]);
  const [lineageBonusStat, setLineageBonusStat] = useState<string>('STR');

  const handleClassChange = (cls: string) => {
    setCharClass(cls);
    setCharSubclass(SUBCLASSES[cls]?.[0] ?? '');
  };

  const handleRaceChange = (race: string) => {
    setCharRace(race);
    setUseCustomLineage(race === 'Custom Lineage');
  };

  const addCharacter = () => {
    if (!charName.trim()) return;
    const lineage: CustomLineage | undefined = useCustomLineage ? {
      isCustom: true,
      abilityBonusChoices: [{ stat: lineageBonusStat, bonus: 2 }],
      skillProficiency: lineageSkill,
      feat: lineageFeat,
    } : undefined;

    const char = createCharacter({
      name: charName,
      race: charRace,
      class: charClass,
      subclass: charSubclass,
      level: campaignLevel,
      stats,
      lineage,
      groupPatron: selectedPatron?.name,
    });
    setParty([...party, char]);
    setCharName('');
    setStats({ STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 });
    setShowCharForm(false);
    setUseCustomLineage(false);
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
              onClick={() => campaignName.trim() && setStep('patron')}
              disabled={!campaignName.trim()}
              className="w-full bg-primary text-primary-foreground font-display text-lg py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Choose Group Patron
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Group Patron step
  if (step === 'patron') {
    return (
      <div className="min-h-screen bg-fantasy-gradient pb-24">
        <div className="max-w-2xl mx-auto p-4">
          <div className="text-center mb-6 pt-4">
            <Crown className="w-10 h-10 text-gold mx-auto mb-3" />
            <h1 className="text-2xl font-display font-bold text-gold text-glow-gold">Group Patron</h1>
            <p className="text-muted-foreground text-sm">Choose an organization that sponsors your party (optional)</p>
            <button onClick={() => setStep('campaign')} className="text-xs text-gold-muted hover:text-gold mt-1 transition-colors">← Change campaign</button>
          </div>

          <div className="space-y-3 mb-4">
            {/* No patron option */}
            <button
              onClick={() => setSelectedPatron(null)}
              className={`w-full text-left bg-card-gradient rounded-xl border p-4 transition-all ${!selectedPatron ? 'border-gold/60 border-glow-gold' : 'border-border hover:border-gold/30'}`}
            >
              <div className="font-display text-foreground text-sm">No Patron</div>
              <div className="text-xs text-muted-foreground mt-1">Adventure as independent freelancers.</div>
            </button>

            {GROUP_PATRONS.map(patron => (
              <button
                key={patron.name}
                onClick={() => setSelectedPatron(patron)}
                className={`w-full text-left bg-card-gradient rounded-xl border p-4 transition-all ${selectedPatron?.name === patron.name ? 'border-gold/60 border-glow-gold' : 'border-border hover:border-gold/30'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-display text-foreground text-sm">{patron.name}</div>
                  <span className="text-[10px] bg-gold/10 text-gold px-2 py-0.5 rounded-full">{patron.type}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{patron.description}</p>
                {selectedPatron?.name === patron.name && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 space-y-2">
                    <div>
                      <div className="text-[10px] text-gold-muted font-display mb-1">Perks</div>
                      <div className="flex flex-wrap gap-1">
                        {patron.perks.map(p => (
                          <span key={p} className="text-[10px] bg-success/10 text-success border border-success/20 px-2 py-0.5 rounded-full">{p}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gold-muted font-display mb-1">Quest Hooks</div>
                      <div className="flex flex-wrap gap-1">
                        {patron.quests.map(q => (
                          <span key={q} className="text-[10px] bg-magic/10 text-magic border border-magic/20 px-2 py-0.5 rounded-full">{q}</span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </button>
            ))}
          </div>

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
            <div className="max-w-2xl mx-auto">
              <button
                onClick={() => setStep('party')}
                className="w-full bg-primary text-primary-foreground font-display text-lg py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                Continue to Party Creation
              </button>
            </div>
          </div>
        </div>
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
          <p className="text-muted-foreground text-sm">
            Level {campaignLevel} · Build your party
            {selectedPatron && <span className="text-gold-muted"> · {selectedPatron.name}</span>}
          </p>
          <button onClick={() => setStep('patron')} className="text-xs text-gold-muted hover:text-gold mt-1 transition-colors">← Change patron</button>
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
                <label className="text-xs text-muted-foreground mb-1 block">Race / Origin</label>
                <select value={charRace} onChange={e => handleRaceChange(e.target.value)} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground text-sm">
                  {RACES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* Custom Lineage Options */}
              {useCustomLineage && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-gold/5 border border-gold/20 rounded-lg p-3 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs text-gold font-display">
                    <Sparkles className="w-3 h-3" /> Custom Lineage Options
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">Ability Score Bonus (+2)</label>
                    <select value={lineageBonusStat} onChange={e => setLineageBonusStat(e.target.value)} className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-foreground text-xs">
                      {['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">Skill Proficiency</label>
                    <select value={lineageSkill} onChange={e => setLineageSkill(e.target.value)} className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-foreground text-xs">
                      {SKILL_PROFICIENCIES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">Starting Feat</label>
                    <select value={lineageFeat} onChange={e => setLineageFeat(e.target.value)} className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-foreground text-xs">
                      {CUSTOM_LINEAGE_FEATS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                </motion.div>
              )}

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

            {/* Subclass Abilities Preview */}
            {SUBCLASS_ABILITIES[charSubclass] && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Zap className="w-3.5 h-3.5 text-gold" />
                  <span className="text-sm text-gold-muted font-display">Subclass Abilities</span>
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto scrollbar-fantasy">
                  {SUBCLASS_ABILITIES[charSubclass]
                    .filter(a => a.level <= campaignLevel)
                    .map((ability) => (
                      <div key={ability.name} className="bg-gold/5 border border-gold/15 rounded-lg px-3 py-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-foreground font-display">{ability.name}</span>
                          <span className="text-[9px] text-gold-muted">Lv{ability.level}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{ability.description}</p>
                      </div>
                    ))}
                  {SUBCLASS_ABILITIES[charSubclass].filter(a => a.level > campaignLevel).length > 0 && (
                    <div className="text-[10px] text-muted-foreground/50 italic px-1">
                      +{SUBCLASS_ABILITIES[charSubclass].filter(a => a.level > campaignLevel).length} abilities at higher levels
                    </div>
                  )}
                </div>
              </div>
            )}

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
                  const lineageBonus = useCustomLineage && lineageBonusStat === stat ? 2 : 0;
                  return (
                    <div key={stat} className={`bg-muted/40 rounded-lg p-2 text-center border ${lineageBonus ? 'border-gold/40' : 'border-border'}`}>
                      <div className="text-[10px] text-muted-foreground font-display">{stat}</div>
                      <input
                        type="number" min={3} max={20} value={stats[stat]}
                        onChange={e => setStats({ ...stats, [stat]: parseInt(e.target.value) || 10 })}
                        className="w-full bg-transparent text-center text-lg text-foreground font-display focus:outline-none"
                      />
                      <div className="text-xs text-gold-muted">
                        ({mod >= 0 ? '+' : ''}{mod})
                        {lineageBonus > 0 && <span className="text-gold ml-1">+{lineageBonus}</span>}
                      </div>
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
              <button onClick={() => { setShowCharForm(false); setUseCustomLineage(false); }} className="px-4 bg-secondary text-secondary-foreground rounded-lg py-2.5 text-sm hover:bg-secondary/80 transition-colors">
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
            onClick={() => canStart && startCampaign(campaignName, campaignLevel, party, selectedPatron ?? undefined)}
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
  const abilities = SUBCLASS_ABILITIES[char.subclass] ?? [];
  const unlockedAbilities = abilities.filter(a => a.level <= char.level);

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

              {/* Custom Lineage Info */}
              {char.lineage?.isCustom && (
                <div className="bg-gold/5 border border-gold/20 rounded-lg p-3">
                  <h4 className="text-xs text-gold font-display mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" /> Custom Lineage
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {char.lineage.feat && <span className="text-[10px] bg-gold/10 text-gold px-2 py-0.5 rounded-full">Feat: {char.lineage.feat}</span>}
                    {char.lineage.skillProficiency && <span className="text-[10px] bg-success/10 text-success px-2 py-0.5 rounded-full">{char.lineage.skillProficiency}</span>}
                    {char.lineage.abilityBonusChoices.map(b => (
                      <span key={b.stat} className="text-[10px] bg-magic/10 text-magic px-2 py-0.5 rounded-full">{b.stat} +{b.bonus}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Ability Scores */}
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

              {/* Subclass Abilities */}
              {unlockedAbilities.length > 0 && (
                <div>
                  <h4 className="text-xs text-gold-muted font-display mb-2 flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-gold" /> Subclass Abilities
                  </h4>
                  <div className="space-y-1.5">
                    {unlockedAbilities.map(a => (
                      <div key={a.name} className="bg-gold/5 border border-gold/15 rounded-lg px-3 py-1.5">
                        <span className="text-[11px] text-foreground font-display">{a.name}</span>
                        <p className="text-[10px] text-muted-foreground">{a.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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

              {/* Group Patron */}
              {char.groupPatron && (
                <div className="flex items-center gap-1.5 text-[11px] text-gold-muted">
                  <Crown className="w-3 h-3" /> Patron: {char.groupPatron}
                </div>
              )}

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
