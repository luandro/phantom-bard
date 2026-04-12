export interface Character {
  id: string;
  name: string;
  race: string;
  class: string;
  subclass: string;
  level: number;
  hp: number;
  maxHp: number;
  stats: {
    STR: number;
    DEX: number;
    CON: number;
    INT: number;
    WIS: number;
    CHA: number;
  };
  inventory: string[];
  spells: string[];
}

export interface DiceRoll {
  id: string;
  type: string;
  result: number;
  modifier: number;
  total: number;
  isCriticalSuccess: boolean;
  isCriticalFail: boolean;
  timestamp: number;
}

export interface StoryEntry {
  id: string;
  type: 'narration' | 'player' | 'system' | 'dice';
  content: string;
  timestamp: number;
  characterName?: string;
}

export interface GameState {
  campaignName: string;
  campaignLevel: number;
  party: Character[];
  storyLog: StoryEntry[];
  currentTurn: number;
  isInCombat: boolean;
  gameStarted: boolean;
}

export interface Campaign {
  name: string;
  opening: string;
  questHook: string;
  locations: string[];
  enemies: string[];
  tone: string;
}

export const RACES = ['Human', 'Elf', 'Dwarf', 'Halfling', 'Gnome', 'Half-Orc', 'Half-Elf', 'Tiefling', 'Dragonborn'] as const;
export const CLASSES = ['Fighter', 'Wizard', 'Rogue', 'Cleric', 'Ranger', 'Paladin', 'Barbarian', 'Bard', 'Druid', 'Monk', 'Sorcerer', 'Warlock'] as const;

export const SUBCLASSES: Record<string, string[]> = {
  Fighter: ['Champion', 'Battle Master', 'Eldritch Knight'],
  Wizard: ['School of Evocation', 'School of Abjuration', 'School of Necromancy', 'School of Divination', 'School of Illusion', 'School of Conjuration'],
  Rogue: ['Thief', 'Assassin', 'Arcane Trickster'],
  Cleric: ['Life Domain', 'Light Domain', 'War Domain', 'Tempest Domain', 'Knowledge Domain'],
  Ranger: ['Hunter', 'Beast Master', 'Gloom Stalker'],
  Paladin: ['Oath of Devotion', 'Oath of Vengeance', 'Oath of the Ancients'],
  Barbarian: ['Path of the Berserker', 'Path of the Totem Warrior', 'Path of the Zealot'],
  Bard: ['College of Lore', 'College of Valor', 'College of Swords'],
  Druid: ['Circle of the Land', 'Circle of the Moon', 'Circle of Spores'],
  Monk: ['Way of the Open Hand', 'Way of Shadow', 'Way of the Four Elements'],
  Sorcerer: ['Draconic Bloodline', 'Wild Magic', 'Shadow Magic'],
  Warlock: ['The Fiend', 'The Great Old One', 'The Archfey', 'The Hexblade'],
};

export const CLASS_SPELLS: Record<string, { cantrips: string[]; level1: string[]; level2: string[]; level3: string[] }> = {
  Wizard: {
    cantrips: ['Fire Bolt', 'Mage Hand', 'Prestidigitation', 'Ray of Frost', 'Light', 'Minor Illusion', 'Shocking Grasp'],
    level1: ['Magic Missile', 'Shield', 'Mage Armor', 'Sleep', 'Thunderwave', 'Detect Magic', 'Feather Fall', 'Burning Hands'],
    level2: ['Misty Step', 'Scorching Ray', 'Hold Person', 'Invisibility', 'Web', 'Mirror Image', 'Shatter'],
    level3: ['Fireball', 'Counterspell', 'Fly', 'Lightning Bolt', 'Haste', 'Dispel Magic'],
  },
  Cleric: {
    cantrips: ['Sacred Flame', 'Guidance', 'Spare the Dying', 'Thaumaturgy', 'Light', 'Toll the Dead'],
    level1: ['Healing Word', 'Cure Wounds', 'Bless', 'Shield of Faith', 'Guiding Bolt', 'Inflict Wounds', 'Command'],
    level2: ['Spiritual Weapon', 'Hold Person', 'Prayer of Healing', 'Lesser Restoration', 'Aid', 'Silence'],
    level3: ['Spirit Guardians', 'Revivify', 'Dispel Magic', 'Beacon of Hope', 'Mass Healing Word'],
  },
  Bard: {
    cantrips: ['Vicious Mockery', 'Prestidigitation', 'Minor Illusion', 'Mage Hand', 'Light', 'Message'],
    level1: ['Healing Word', 'Thunderwave', 'Dissonant Whispers', 'Faerie Fire', 'Sleep', 'Charm Person', 'Heroism'],
    level2: ['Heat Metal', 'Hold Person', 'Invisibility', 'Shatter', 'Suggestion', 'Silence'],
    level3: ['Hypnotic Pattern', 'Dispel Magic', 'Fear', 'Bestow Curse', 'Leomund\'s Tiny Hut'],
  },
  Druid: {
    cantrips: ['Druidcraft', 'Produce Flame', 'Shillelagh', 'Thorn Whip', 'Guidance', 'Poison Spray'],
    level1: ['Entangle', 'Healing Word', 'Faerie Fire', 'Thunderwave', 'Goodberry', 'Cure Wounds', 'Fog Cloud'],
    level2: ['Moonbeam', 'Barkskin', 'Heat Metal', 'Hold Person', 'Flaming Sphere', 'Spike Growth'],
    level3: ['Call Lightning', 'Conjure Animals', 'Plant Growth', 'Dispel Magic', 'Wind Wall'],
  },
  Sorcerer: {
    cantrips: ['Fire Bolt', 'Ray of Frost', 'Prestidigitation', 'Mage Hand', 'Light', 'Shocking Grasp', 'Chill Touch'],
    level1: ['Magic Missile', 'Shield', 'Mage Armor', 'Chromatic Orb', 'Thunderwave', 'Sleep', 'Burning Hands'],
    level2: ['Misty Step', 'Scorching Ray', 'Hold Person', 'Invisibility', 'Mirror Image', 'Shatter'],
    level3: ['Fireball', 'Counterspell', 'Fly', 'Lightning Bolt', 'Haste'],
  },
  Warlock: {
    cantrips: ['Eldritch Blast', 'Minor Illusion', 'Prestidigitation', 'Mage Hand', 'Chill Touch', 'Toll the Dead'],
    level1: ['Hex', 'Armor of Agathys', 'Hellish Rebuke', 'Charm Person', 'Arms of Hadar', 'Witch Bolt'],
    level2: ['Misty Step', 'Hold Person', 'Invisibility', 'Mirror Image', 'Darkness', 'Suggestion'],
    level3: ['Counterspell', 'Fly', 'Hunger of Hadar', 'Hypnotic Pattern', 'Dispel Magic'],
  },
  Paladin: {
    cantrips: [],
    level1: ['Divine Smite', 'Cure Wounds', 'Shield of Faith', 'Bless', 'Command', 'Thunderous Smite', 'Wrathful Smite'],
    level2: ['Find Steed', 'Aid', 'Lesser Restoration', 'Branding Smite', 'Magic Weapon'],
    level3: ['Revivify', 'Dispel Magic', 'Aura of Vitality', 'Crusader\'s Mantle', 'Elemental Weapon'],
  },
  Ranger: {
    cantrips: [],
    level1: ['Hunter\'s Mark', 'Cure Wounds', 'Ensnaring Strike', 'Hail of Thorns', 'Goodberry', 'Fog Cloud'],
    level2: ['Pass without Trace', 'Spike Growth', 'Lesser Restoration', 'Silence', 'Find Traps'],
    level3: ['Conjure Animals', 'Lightning Arrow', 'Plant Growth', 'Wind Wall'],
  },
  'Eldritch Knight': {
    cantrips: ['Fire Bolt', 'Booming Blade', 'Green-Flame Blade', 'Light'],
    level1: ['Shield', 'Magic Missile', 'Absorb Elements', 'Burning Hands', 'Thunderwave'],
    level2: ['Misty Step', 'Mirror Image', 'Scorching Ray', 'Hold Person'],
    level3: ['Fireball', 'Counterspell', 'Haste'],
  },
  'Arcane Trickster': {
    cantrips: ['Mage Hand', 'Minor Illusion', 'Prestidigitation', 'Booming Blade'],
    level1: ['Charm Person', 'Disguise Self', 'Sleep', 'Silent Image', 'Tasha\'s Hideous Laughter'],
    level2: ['Invisibility', 'Mirror Image', 'Hold Person', 'Misty Step'],
    level3: ['Hypnotic Pattern', 'Major Image', 'Haste'],
  },
  Fighter: { cantrips: [], level1: [], level2: [], level3: [] },
  Rogue: { cantrips: [], level1: [], level2: [], level3: [] },
  Barbarian: { cantrips: [], level1: [], level2: [], level3: [] },
  Monk: { cantrips: [], level1: [], level2: [], level3: [] },
};

export function getSpellsForCharacter(charClass: string, subclass: string, level: number): string[] {
  // Check subclass spells first (e.g. Eldritch Knight, Arcane Trickster)
  const subSpells = CLASS_SPELLS[subclass];
  const classSpells = CLASS_SPELLS[charClass];
  const source = subSpells && subSpells.cantrips.length > 0 ? subSpells : classSpells;
  if (!source) return [];

  const spells: string[] = [...source.cantrips.map(s => `${s} (cantrip)`)];
  if (level >= 1) spells.push(...source.level1.map(s => `${s} (1st)`));
  if (level >= 3) spells.push(...source.level2.map(s => `${s} (2nd)`));
  if (level >= 5) spells.push(...source.level3.map(s => `${s} (3rd)`));
  return spells;
}

export const PREBUILT_CAMPAIGNS: Campaign[] = [
  {
    name: "Lost Mine of Phandelver",
    opening: "You've been hired by a dwarf named Gundren Rockseeker to escort a wagon of supplies from Neverwinter to the rough-and-tumble settlement of Phandalin. Gundren has gone ahead with a warrior escort, but the road ahead is dangerous...",
    questHook: "Find the lost mine of Wave Echo Cave and rescue Gundren Rockseeker from the clutches of the Black Spider.",
    locations: ["Cragmaw Hideout", "Phandalin", "Tresendar Manor", "Wave Echo Cave", "Cragmaw Castle"],
    enemies: ["Goblins", "Bugbears", "Redbrands", "Doppelganger", "Black Spider"],
    tone: "Classic adventure with exploration, combat, and intrigue"
  },
  {
    name: "Curse of Strahd",
    opening: "A thick, impenetrable fog surrounds you, cutting off all escape. When it finally lifts, you find yourselves in a land of perpetual twilight — Barovia. The air is heavy with dread, and in the distance, Castle Ravenloft looms against a blood-red sky...",
    questHook: "Defeat the vampire lord Strahd von Zarovich and free the people of Barovia from his eternal curse.",
    locations: ["Village of Barovia", "Castle Ravenloft", "Vallaki", "The Amber Temple", "Krezk"],
    enemies: ["Strahd von Zarovich", "Dire Wolves", "Vampire Spawn", "Baba Lysaga", "Rahadin"],
    tone: "Gothic horror with psychological tension and moral dilemmas"
  },
  {
    name: "Dragon of Icespire Peak",
    opening: "The town of Phandalin is in peril. A young white dragon named Cryovain has descended from the Sword Mountains, driving other dangerous creatures into the lowlands. The townmaster has posted notices seeking brave adventurers...",
    questHook: "Track down and slay the white dragon Cryovain before it destroys Phandalin.",
    locations: ["Phandalin", "Icespire Hold", "Gnomengarde", "Dwarven Excavation", "Dragon Barrow"],
    enemies: ["Cryovain", "Orcs", "Manticores", "Ankhegs", "Ochre Jelly"],
    tone: "Heroic adventure with escalating dragon threat"
  },
];
