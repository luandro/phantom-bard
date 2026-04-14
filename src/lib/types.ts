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
  lineage?: CustomLineage;
  groupPatron?: string;
}

export interface CustomLineage {
  isCustom: boolean;
  abilityBonusChoices: { stat: string; bonus: number }[];
  skillProficiency?: string;
  feat?: string;
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

export interface Artifact {
  id: string;
  name: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'very_rare' | 'legendary';
  type: 'weapon' | 'armor' | 'potion' | 'scroll' | 'wondrous' | 'ring' | 'wand' | 'artifact';
  description: string;
  effect?: string;
  value?: number;
  assignedTo?: string; // character id
}

export interface StoryEntry {
  id: string;
  type: 'narration' | 'player' | 'system' | 'dice' | 'puzzle' | 'loot';
  content: string;
  timestamp: number;
  characterName?: string;
  puzzleData?: PuzzleData;
  lootData?: Artifact[];
}

export interface PuzzleData {
  type: 'riddle' | 'sequence' | 'cipher' | 'logic';
  difficulty: 'easy' | 'medium' | 'hard';
  hint?: string;
  solved: boolean;
}

export interface GameState {
  campaignName: string;
  campaignLevel: number;
  party: Character[];
  storyLog: StoryEntry[];
  currentTurn: number;
  isInCombat: boolean;
  gameStarted: boolean;
  groupPatron?: GroupPatron;
  lootInventory: Artifact[];
}

// ─── Loot Tables ───

const RARITY_BY_LEVEL: Record<number, Artifact['rarity'][]> = {
  1: ['common', 'uncommon'],
  3: ['common', 'uncommon', 'rare'],
  5: ['uncommon', 'rare'],
  8: ['uncommon', 'rare', 'very_rare'],
  11: ['rare', 'very_rare'],
  15: ['rare', 'very_rare', 'legendary'],
  17: ['very_rare', 'legendary'],
};

export function getRarityPool(level: number): Artifact['rarity'][] {
  const keys = Object.keys(RARITY_BY_LEVEL).map(Number).sort((a, b) => a - b);
  let pool: Artifact['rarity'][] = ['common', 'uncommon'];
  for (const k of keys) {
    if (level >= k) pool = RARITY_BY_LEVEL[k];
  }
  return pool;
}

export const LOOT_TABLE: Omit<Artifact, 'id' | 'assignedTo'>[] = [
  // Common
  { name: 'Potion of Healing', rarity: 'common', type: 'potion', description: 'A vial of red liquid that restores 2d4+2 HP.', effect: 'Heal 2d4+2 HP', value: 50 },
  { name: 'Driftglobe', rarity: 'common', type: 'wondrous', description: 'A glass orb that casts Light or Daylight.', effect: 'Cast Light/Daylight', value: 75 },
  { name: 'Bag of Holding', rarity: 'uncommon', type: 'wondrous', description: 'An extradimensional bag that holds up to 500 lbs.', effect: 'Extra storage', value: 200 },
  // Uncommon
  { name: 'Cloak of Protection', rarity: 'uncommon', type: 'wondrous', description: 'A magical cloak granting +1 to AC and saving throws.', effect: '+1 AC, +1 saves', value: 300 },
  { name: 'Gauntlets of Ogre Power', rarity: 'uncommon', type: 'wondrous', description: 'Gauntlets that set STR to 19.', effect: 'STR becomes 19', value: 400 },
  { name: 'Boots of Elvenkind', rarity: 'uncommon', type: 'wondrous', description: 'Soft boots that grant advantage on Stealth checks.', effect: 'Advantage on Stealth', value: 250 },
  { name: '+1 Longsword', rarity: 'uncommon', type: 'weapon', description: 'A finely forged blade with a magical edge.', effect: '+1 to attack and damage', value: 350 },
  // Rare
  { name: 'Flame Tongue Sword', rarity: 'rare', type: 'weapon', description: 'A blade that erupts in fire on command, dealing 2d6 extra fire damage.', effect: '+2d6 fire damage', value: 1500 },
  { name: 'Amulet of Health', rarity: 'rare', type: 'wondrous', description: 'An amulet that sets CON to 19.', effect: 'CON becomes 19', value: 1200 },
  { name: 'Ring of Protection', rarity: 'rare', type: 'ring', description: 'A platinum ring granting +1 to AC and saves.', effect: '+1 AC, +1 saves', value: 1000 },
  { name: 'Wand of Fireballs', rarity: 'rare', type: 'wand', description: 'A wand with 7 charges, each casting Fireball.', effect: 'Cast Fireball (7 charges)', value: 2000 },
  // Very Rare
  { name: 'Staff of Power', rarity: 'very_rare', type: 'wand', description: 'A mighty staff granting +2 to AC, saves, and spell attacks.', effect: '+2 AC, saves, spell attacks', value: 5000 },
  { name: 'Dancing Sword', rarity: 'very_rare', type: 'weapon', description: 'A sentient sword that fights on its own in the air.', effect: 'Attacks autonomously', value: 4000 },
  { name: 'Cloak of Displacement', rarity: 'very_rare', type: 'wondrous', description: 'An illusory cloak causing attacks against you to have disadvantage.', effect: 'Disadvantage on attacks against you', value: 4500 },
  // Legendary
  { name: 'Vorpal Sword', rarity: 'legendary', type: 'weapon', description: 'A blade of impossible sharpness — on a nat 20, it severs heads.', effect: 'Decapitate on crit', value: 25000 },
  { name: 'Ring of Three Wishes', rarity: 'legendary', type: 'ring', description: 'A ring holding three charges of the Wish spell.', effect: 'Cast Wish (3 charges)', value: 50000 },
  { name: 'Robe of the Archmagi', rarity: 'legendary', type: 'wondrous', description: 'Robes that set AC to 15 + DEX and grant advantage on saves vs magic.', effect: 'AC 15+DEX, adv vs magic', value: 30000 },
  { name: 'Holy Avenger', rarity: 'legendary', type: 'weapon', description: 'A sacred blade that deals +2d10 radiant to fiends and undead.', effect: '+2d10 radiant vs evil', value: 28000 },
];

export function generateLoot(level: number, count: number = 1): Artifact[] {
  const pool = getRarityPool(level);
  const available = LOOT_TABLE.filter(l => pool.includes(l.rarity));
  const results: Artifact[] = [];
  for (let i = 0; i < count; i++) {
    const item = available[Math.floor(Math.random() * available.length)];
    if (item) {
      results.push({ ...item, id: crypto.randomUUID() });
    }
  }
  return results;
}

export interface GroupPatron {
  name: string;
  type: string;
  description: string;
  perks: string[];
  quests: string[];
}

export interface Campaign {
  name: string;
  opening: string;
  questHook: string;
  locations: string[];
  enemies: string[];
  tone: string;
}

export interface SubclassAbility {
  name: string;
  level: number;
  description: string;
}

export type { PartyPlayer } from './party-types';

// ─── Custom Lineage System ───

export const CUSTOM_LINEAGE_FEATS = [
  'Alert', 'Athlete', 'Actor', 'Charger', 'Crossbow Expert',
  'Defensive Duelist', 'Dual Wielder', 'Dungeon Delver', 'Durable',
  'Elemental Adept', 'Grappler', 'Great Weapon Master', 'Healer',
  'Heavily Armored', 'Heavy Armor Master', 'Inspiring Leader',
  'Keen Mind', 'Lightly Armored', 'Linguist', 'Lucky',
  'Mage Slayer', 'Magic Initiate', 'Martial Adept', 'Medium Armor Master',
  'Mobile', 'Moderately Armored', 'Mounted Combatant', 'Observant',
  'Polearm Master', 'Resilient', 'Ritual Caster', 'Savage Attacker',
  'Sentinel', 'Sharpshooter', 'Shield Master', 'Skilled',
  'Skulker', 'Spell Sniper', 'Tavern Brawler', 'Tough',
  'War Caster', 'Weapon Master',
  // Tasha's-inspired feats
  'Fey Touched', 'Shadow Touched', 'Telekinetic', 'Telepathic',
  'Crusher', 'Piercer', 'Slasher', 'Skill Expert',
  'Fighting Initiate', 'Metamagic Adept', 'Eldritch Adept',
  'Chef', 'Gunner', 'Poisoner',
] as const;

export const SKILL_PROFICIENCIES = [
  'Acrobatics', 'Animal Handling', 'Arcana', 'Athletics',
  'Deception', 'History', 'Insight', 'Intimidation',
  'Investigation', 'Medicine', 'Nature', 'Perception',
  'Performance', 'Persuasion', 'Religion', 'Sleight of Hand',
  'Stealth', 'Survival',
] as const;

// ─── Group Patrons ───

export const GROUP_PATRONS: GroupPatron[] = [
  {
    name: 'The Arcane Academy',
    type: 'Academic Institution',
    description: 'A prestigious school of magic that funds expeditions to recover lost knowledge and artifacts.',
    perks: ['Access to a research library', 'Free identify spells', 'Arcane supplies at discount', 'Emergency teleportation circle'],
    quests: ['Recover a lost spellbook', 'Investigate wild magic surges', 'Map an ancient arcane nexus', 'Retrieve a stolen artifact'],
  },
  {
    name: 'The Silver Ravens',
    type: 'Criminal Syndicate',
    description: 'A network of thieves and information brokers who value subtlety over violence.',
    perks: ['Fence stolen goods', 'Safe houses in major cities', 'Forged documents', 'Underground intelligence network'],
    quests: ['Steal a noble\'s ledger', 'Infiltrate a rival gang', 'Smuggle refugees to safety', 'Blackmail a corrupt official'],
  },
  {
    name: 'The Order of the Radiant Shield',
    type: 'Military Force',
    description: 'A holy military order sworn to protect the innocent and root out evil in dark places.',
    perks: ['Martial training grounds', 'Healing services', 'Reinforcements on call', 'Consecrated weapons'],
    quests: ['Clear an undead-infested crypt', 'Escort pilgrims through dangerous lands', 'Investigate a demonic cult', 'Defend a besieged town'],
  },
  {
    name: 'The Wandering Court',
    type: 'Noble Court',
    description: 'A traveling aristocratic court that moves between cities, brokering power and settling disputes.',
    perks: ['Diplomatic immunity', 'Invitations to exclusive events', 'Political favors', 'Noble lodging'],
    quests: ['Negotiate a trade agreement', 'Uncover a plot against the regent', 'Arbitrate a border dispute', 'Retrieve a stolen crown jewel'],
  },
  {
    name: 'The Verdant Circle',
    type: 'Religious Order',
    description: 'Druids and rangers who guard the balance between civilization and the wild.',
    perks: ['Animal companions', 'Herbal remedies', 'Shelter in sacred groves', 'Nature divinations'],
    quests: ['Stop poachers in the Feywood', 'Cleanse a corrupted ley line', 'Broker peace between settlers and fey', 'Halt an unnatural blight'],
  },
  {
    name: 'The Gilded Compass',
    type: 'Guild',
    description: 'A merchant guild of explorers and cartographers who map uncharted territories for profit.',
    perks: ['Expedition funding', 'Discounted supplies', 'Expert guides', 'Trade route access'],
    quests: ['Chart an unexplored cavern system', 'Establish a new trade route', 'Recover cargo from a shipwreck', 'Survey ruins for salvage value'],
  },
];

// ─── Puzzle Templates ───

export const PUZZLE_TEMPLATES = [
  {
    type: 'riddle' as const,
    difficulty: 'easy' as const,
    prompt: 'A mysterious voice echoes through the chamber: solve the riddle to proceed.',
    dcCheck: 10,
  },
  {
    type: 'sequence' as const,
    difficulty: 'medium' as const,
    prompt: 'Glowing runes on the floor must be activated in the correct sequence.',
    dcCheck: 13,
  },
  {
    type: 'cipher' as const,
    difficulty: 'medium' as const,
    prompt: 'An encoded message is carved into the wall. Decode it to reveal the path forward.',
    dcCheck: 15,
  },
  {
    type: 'logic' as const,
    difficulty: 'hard' as const,
    prompt: 'Three levers control a complex mechanism. Pull them in the wrong order and face the consequences.',
    dcCheck: 17,
  },
];

// ─── Races, Classes, Subclasses ───

export const RACES = [
  'Human', 'Elf', 'Dwarf', 'Halfling', 'Gnome', 'Half-Orc', 'Half-Elf', 'Tiefling', 'Dragonborn',
  'Custom Lineage',
] as const;

export const CLASSES = ['Fighter', 'Wizard', 'Rogue', 'Cleric', 'Ranger', 'Paladin', 'Barbarian', 'Bard', 'Druid', 'Monk', 'Sorcerer', 'Warlock', 'Artificer', 'Blood Hunter'] as const;

export const SUBCLASSES: Record<string, string[]> = {
  Fighter: ['Champion', 'Battle Master', 'Eldritch Knight', 'Psi Warrior', 'Rune Knight', 'Echo Knight'],
  Wizard: ['School of Evocation', 'School of Abjuration', 'School of Necromancy', 'School of Divination', 'School of Illusion', 'School of Conjuration', 'Bladesinging', 'Order of Scribes'],
  Rogue: ['Thief', 'Assassin', 'Arcane Trickster', 'Soulknife', 'Phantom', 'Swashbuckler'],
  Cleric: ['Life Domain', 'Light Domain', 'War Domain', 'Tempest Domain', 'Knowledge Domain', 'Peace Domain', 'Twilight Domain', 'Order Domain'],
  Ranger: ['Hunter', 'Beast Master', 'Gloom Stalker', 'Fey Wanderer', 'Swarmkeeper', 'Horizon Walker'],
  Paladin: ['Oath of Devotion', 'Oath of Vengeance', 'Oath of the Ancients', 'Oath of Glory', 'Oath of the Watchers', 'Oath of Conquest'],
  Barbarian: ['Path of the Berserker', 'Path of the Totem Warrior', 'Path of the Zealot', 'Path of Wild Magic', 'Path of the Beast', 'Path of the Storm Herald'],
  Bard: ['College of Lore', 'College of Valor', 'College of Swords', 'College of Creation', 'College of Eloquence', 'College of Spirits'],
  Druid: ['Circle of the Land', 'Circle of the Moon', 'Circle of Spores', 'Circle of Stars', 'Circle of Wildfire', 'Circle of the Shepherd'],
  Monk: ['Way of the Open Hand', 'Way of Shadow', 'Way of the Four Elements', 'Way of Mercy', 'Way of the Astral Self', 'Way of the Kensei'],
  Sorcerer: ['Draconic Bloodline', 'Wild Magic', 'Shadow Magic', 'Aberrant Mind', 'Clockwork Soul', 'Divine Soul'],
  Warlock: ['The Fiend', 'The Great Old One', 'The Archfey', 'The Hexblade', 'The Fathomless', 'The Genie', 'The Undead'],
  Artificer: ['Alchemist', 'Armorer', 'Artillerist', 'Battle Smith'],
  'Blood Hunter': ['Order of the Ghostslayer', 'Order of the Lycan', 'Order of the Mutant', 'Order of the Profane Soul'],
};

// ─── Subclass Abilities (original descriptions) ───

export const SUBCLASS_ABILITIES: Record<string, SubclassAbility[]> = {
  // Tasha's Fighter subclasses
  'Psi Warrior': [
    { name: 'Psionic Strike', level: 3, description: 'Channel psychic energy into your weapon attacks, dealing bonus force damage.' },
    { name: 'Telekinetic Shield', level: 3, description: 'Use your mental power to create a barrier that reduces damage to yourself or allies.' },
    { name: 'Psi-Powered Leap', level: 7, description: 'Propel yourself through the air using telekinetic force.' },
    { name: 'Bulwark of Force', level: 15, description: 'Project a wall of psychic energy that shields your allies from harm.' },
  ],
  'Rune Knight': [
    { name: 'Rune Carver', level: 3, description: 'Inscribe magical runes onto equipment to grant various defensive and offensive benefits.' },
    { name: 'Giant\'s Might', level: 3, description: 'Channel the power of giants to grow in size and deal extra damage.' },
    { name: 'Runic Shield', level: 7, description: 'Invoke a rune to magically deflect an attack targeting an ally.' },
    { name: 'Great Stature', level: 18, description: 'Permanently increase your height and the damage bonus of Giant\'s Might.' },
  ],
  // Tasha's Wizard subclasses
  'Bladesinging': [
    { name: 'Bladesong', level: 2, description: 'Enter an elegant dance of combat, adding INT to AC and concentration saves.' },
    { name: 'Extra Attack', level: 6, description: 'Attack twice and can replace one attack with a cantrip.' },
    { name: 'Song of Defense', level: 10, description: 'Expend spell slots to reduce incoming damage while Bladesong is active.' },
    { name: 'Song of Victory', level: 14, description: 'Add INT modifier to melee weapon damage while Bladesong is active.' },
  ],
  'Order of Scribes': [
    { name: 'Wizardly Quill', level: 2, description: 'Conjure a magical quill that transcribes spells at incredible speed.' },
    { name: 'Awakened Spellbook', level: 2, description: 'Your spellbook becomes a sentient conduit, allowing you to swap spell damage types.' },
    { name: 'Manifest Mind', level: 6, description: 'Project the mind of your spellbook as a spectral form to scout and cast through.' },
    { name: 'One with the Word', level: 14, description: 'Turn yourself into pure magical text to avoid damage, sacrificing spell knowledge.' },
  ],
  // Tasha's Rogue subclasses
  'Soulknife': [
    { name: 'Psychic Blades', level: 3, description: 'Manifest blades of pure psychic energy that can be thrown and vanish after use.' },
    { name: 'Psi-Bolstered Knack', level: 3, description: 'Use psionic dice to boost failing ability checks and skill rolls.' },
    { name: 'Psychic Whispers', level: 9, description: 'Establish telepathic communication with multiple creatures for hours.' },
    { name: 'Rend Mind', level: 17, description: 'Stun a creature with a devastating psychic attack when you land a sneak attack.' },
  ],
  'Phantom': [
    { name: 'Whispers of the Dead', level: 3, description: 'Commune with spirits to gain proficiency in a skill or tool each rest.' },
    { name: 'Wails from the Grave', level: 3, description: 'When you sneak attack, a nearby creature also takes necrotic damage from spectral wailing.' },
    { name: 'Tokens of the Departed', level: 9, description: 'Capture soul trinkets from fallen creatures to gain special advantages.' },
    { name: 'Ghost Walk', level: 13, description: 'Become spectral, gaining flight and the ability to pass through solid objects.' },
  ],
  // Tasha's Cleric subclasses
  'Peace Domain': [
    { name: 'Emboldening Bond', level: 1, description: 'Create a magical bond between allies that lets them add a bonus to attacks, checks, or saves.' },
    { name: 'Balm of Peace', level: 6, description: 'Move without provoking attacks and heal allies as you pass by them.' },
    { name: 'Protective Bond', level: 6, description: 'Bonded allies can teleport to take damage meant for each other.' },
    { name: 'Expansive Bond', level: 17, description: 'Your bond extends further and grants resistance to damage taken for allies.' },
  ],
  'Twilight Domain': [
    { name: 'Eyes of Night', level: 1, description: 'Gain superior darkvision and share it with allies through a touch.' },
    { name: 'Vigilant Blessing', level: 1, description: 'Grant a creature advantage on its next initiative roll.' },
    { name: 'Twilight Sanctuary', level: 2, description: 'Create a sphere of calming twilight that grants temporary HP or ends charm/fear effects.' },
    { name: 'Steps of Night', level: 6, description: 'Gain the ability to fly while in dim light or darkness.' },
  ],
  'Order Domain': [
    { name: 'Voice of Authority', level: 1, description: 'When you cast a spell on an ally, they can use their reaction to attack.' },
    { name: 'Embodiment of the Law', level: 6, description: 'Cast enchantment spells as a bonus action a number of times per day.' },
    { name: 'Divine Strike', level: 8, description: 'Infuse your weapon strikes with psychic energy.' },
    { name: 'Order\'s Wrath', level: 17, description: 'Allies deal extra psychic damage to creatures you have cursed.' },
  ],
  // Tasha's Ranger subclasses
  'Fey Wanderer': [
    { name: 'Dreadful Strikes', level: 3, description: 'Infuse your attacks with fey magic, dealing bonus psychic damage.' },
    { name: 'Otherworldly Glamour', level: 3, description: 'Add WIS modifier to CHA checks and gain proficiency in a CHA skill.' },
    { name: 'Beguiling Twist', level: 7, description: 'When a creature saves against charm or fear, redirect the effect to another target.' },
    { name: 'Misty Wanderer', level: 15, description: 'Cast Misty Step without a slot and bring a willing ally along.' },
  ],
  'Swarmkeeper': [
    { name: 'Gathered Swarm', level: 3, description: 'A swarm of nature spirits aids your attacks, dealing extra damage or moving creatures.' },
    { name: 'Writhing Tide', level: 7, description: 'Your swarm lifts you, granting a hover speed.' },
    { name: 'Mighty Swarm', level: 11, description: 'Your swarm grows stronger, knocking creatures prone or granting half cover.' },
    { name: 'Swarming Dispersal', level: 15, description: 'Dissolve into your swarm to teleport and gain resistance to damage.' },
  ],
  // Tasha's Paladin subclasses
  'Oath of Glory': [
    { name: 'Peerless Athlete', level: 3, description: 'Gain supernatural athletic ability, boosting jumps and carrying capacity.' },
    { name: 'Inspiring Smite', level: 3, description: 'After using Divine Smite, distribute temporary HP to nearby allies.' },
    { name: 'Aura of Alacrity', level: 7, description: 'Your walking speed increases and nearby allies gain bonus movement.' },
    { name: 'Living Legend', level: 20, description: 'Become an avatar of legend, gaining advantage on CHA checks and turning misses into hits.' },
  ],
  'Oath of the Watchers': [
    { name: 'Watcher\'s Will', level: 3, description: 'Grant allies advantage on saves against effects from aberrations, fey, and fiends.' },
    { name: 'Abjure the Extraplanar', level: 3, description: 'Force aberrations, fey, and fiends to flee from your divine rebuke.' },
    { name: 'Aura of the Sentinel', level: 7, description: 'Allies near you gain a bonus to initiative rolls.' },
    { name: 'Mortal Bulwark', level: 20, description: 'Gain truesight and banish extraplanar creatures you hit.' },
  ],
  // Tasha's Barbarian subclasses
  'Path of Wild Magic': [
    { name: 'Magic Awareness', level: 3, description: 'Sense the presence of magical effects and spellcasters nearby.' },
    { name: 'Wild Surge', level: 3, description: 'When you rage, a random magical effect erupts — bolts of energy, teleportation, or growth.' },
    { name: 'Bolstering Magic', level: 6, description: 'Touch a creature to boost their attacks or restore a spell slot.' },
    { name: 'Unstable Backlash', level: 10, description: 'When damaged or failing a save while raging, replace your Wild Surge with a new roll.' },
  ],
  'Path of the Beast': [
    { name: 'Form of the Beast', level: 3, description: 'While raging, manifest natural weapons — a bite that heals, claws that rend, or a tail that guards.' },
    { name: 'Bestial Soul', level: 6, description: 'Gain supernatural swimming, climbing, or jumping abilities.' },
    { name: 'Infectious Fury', level: 10, description: 'When you hit a creature, force it to attack an ally or take psychic damage.' },
    { name: 'Call the Hunt', level: 14, description: 'Grant allies bonus damage and temporary HP when you start raging.' },
  ],
  // Tasha's Bard subclasses
  'College of Creation': [
    { name: 'Mote of Potential', level: 3, description: 'Your Bardic Inspiration dice create motes that grant extra effects — thunder damage, temp HP, or better rolls.' },
    { name: 'Performance of Creation', level: 3, description: 'Create a nonmagical item out of nothing through a performance.' },
    { name: 'Animating Performance', level: 6, description: 'Bring a Large or smaller object to life as a dancing construct servant.' },
    { name: 'Creative Crescendo', level: 14, description: 'Create multiple items simultaneously with Performance of Creation.' },
  ],
  'College of Eloquence': [
    { name: 'Silver Tongue', level: 3, description: 'Treat any Persuasion or Deception roll below 10 as a 10.' },
    { name: 'Unsettling Words', level: 3, description: 'Subtract a Bardic Inspiration die from a creature\'s next saving throw.' },
    { name: 'Unfailing Inspiration', level: 6, description: 'Allies keep your Bardic Inspiration die if they fail the roll.' },
    { name: 'Infectious Inspiration', level: 14, description: 'When one ally uses your inspiration successfully, grant it to another ally for free.' },
  ],
  'College of Spirits': [
    { name: 'Spiritual Focus', level: 3, description: 'Use a candle, crystal ball, or talking board as a spellcasting focus for bonus healing/damage.' },
    { name: 'Tales from Beyond', level: 3, description: 'Channel a random spirit tale through Bardic Inspiration with unique magical effects.' },
    { name: 'Spirit Session', level: 6, description: 'Conduct a séance to temporarily learn additional spells from any class.' },
    { name: 'Mystical Connection', level: 14, description: 'Roll twice for Tales from Beyond and choose which spirit to channel.' },
  ],
  // Tasha's Druid subclasses
  'Circle of Stars': [
    { name: 'Star Map', level: 2, description: 'Create a star chart that lets you cast Guidance and Guiding Bolt without slots.' },
    { name: 'Starry Form', level: 2, description: 'Take on a constellation form — Archer (radiant bolt), Chalice (heal), or Dragon (concentration boost).' },
    { name: 'Cosmic Omen', level: 6, description: 'Read the stars to grant weal or woe reactions that boost or penalize nearby rolls.' },
    { name: 'Full of Stars', level: 14, description: 'While in Starry Form, become partially incorporeal with resistance to physical damage.' },
  ],
  'Circle of Wildfire': [
    { name: 'Summon Wildfire Spirit', level: 2, description: 'Expend a Wild Shape use to summon a fiery spirit companion.' },
    { name: 'Enhanced Bond', level: 6, description: 'Your fire and healing spells are more potent, and you can cast through your wildfire spirit.' },
    { name: 'Cauterizing Flames', level: 10, description: 'When a creature dies near your spirit, create a healing or damaging spectral flame.' },
    { name: 'Blazing Revival', level: 14, description: 'If you drop to 0 HP near your wildfire spirit, it dies to bring you back with half HP.' },
  ],
  // Tasha's Monk subclasses
  'Way of Mercy': [
    { name: 'Hands of Healing', level: 3, description: 'Spend ki to heal with your touch, also ending disease or conditions.' },
    { name: 'Hands of Harm', level: 3, description: 'Spend ki to inflict necrotic damage with your unarmed strikes.' },
    { name: 'Physician\'s Touch', level: 6, description: 'Your Hands of Healing can end poison, blind, deaf, or paralysis.' },
    { name: 'Hand of Ultimate Mercy', level: 17, description: 'Spend 5 ki to cast the equivalent of Revivify with a touch.' },
  ],
  'Way of the Astral Self': [
    { name: 'Arms of the Astral Self', level: 3, description: 'Summon spectral arms that use WIS for attacks and extend your reach.' },
    { name: 'Visage of the Astral Self', level: 6, description: 'Manifest an astral visage granting darkvision, advantage on Insight/Intimidation, and amplified voice.' },
    { name: 'Body of the Astral Self', level: 11, description: 'Summon the full astral body, deflecting energy damage and empowering astral strikes.' },
    { name: 'Awakened Astral Self', level: 17, description: 'Your full astral form gains bonus AC and an extra attack on each turn.' },
  ],
  // Tasha's Sorcerer subclasses
  'Aberrant Mind': [
    { name: 'Psionic Spells', level: 1, description: 'Gain a suite of telepathic and telekinetic spells that can be swapped for divination/enchantment spells.' },
    { name: 'Telepathic Speech', level: 1, description: 'Establish a telepathic link with a creature, allowing wordless communication.' },
    { name: 'Psionic Sorcery', level: 6, description: 'Cast your psionic spells using sorcery points instead of slots — no verbal or somatic components.' },
    { name: 'Revelation in Flesh', level: 14, description: 'Transform your body to gain flight, see invisible creatures, squeeze through gaps, or become aquatic.' },
  ],
  'Clockwork Soul': [
    { name: 'Clockwork Magic', level: 1, description: 'Gain spells of order and protection, swappable for abjuration or transmutation spells.' },
    { name: 'Restore Balance', level: 1, description: 'Cancel advantage or disadvantage on a nearby roll, imposing cosmic equilibrium.' },
    { name: 'Bastion of Law', level: 6, description: 'Create a ward of protective dice that absorb damage for an ally.' },
    { name: 'Trance of Order', level: 14, description: 'Enter a state where you cannot roll below 10 on attacks, checks, or saves.' },
  ],
  // Tasha's Warlock subclasses
  'The Fathomless': [
    { name: 'Tentacle of the Deeps', level: 1, description: 'Summon a spectral tentacle that attacks, deals cold damage, and slows enemies.' },
    { name: 'Gift of the Sea', level: 1, description: 'Gain a swim speed and the ability to breathe underwater.' },
    { name: 'Oceanic Soul', level: 6, description: 'Gain resistance to cold damage and communicate with sea creatures.' },
    { name: 'Grasping Tentacles', level: 10, description: 'Cast a restraining tentacle spell without using a slot, dealing cold damage.' },
  ],
  'The Genie': [
    { name: 'Genie\'s Vessel', level: 1, description: 'Gain a magical vessel you can enter and rest inside, a tiny extradimensional space.' },
    { name: 'Genie\'s Wrath', level: 1, description: 'Deal bonus damage of a type based on your patron: fire, cold, thunder, or bludgeoning.' },
    { name: 'Elemental Gift', level: 6, description: 'Gain resistance to your genie\'s damage type and a limited flight ability.' },
    { name: 'Limited Wish', level: 14, description: 'Request a minor wish, mimicking any spell of 6th level or lower without components.' },
  ],
  'The Undead': [
    { name: 'Form of Dread', level: 1, description: 'Transform into a terrifying undead form, frightening nearby enemies and dealing necrotic damage.' },
    { name: 'Grave Touched', level: 6, description: 'Your attacks deal necrotic damage and you can replace one damage die with necrotic.' },
    { name: 'Mortal Husk', level: 10, description: 'Gain resistance to necrotic damage and explode in necrotic energy when you reach 0 HP.' },
    { name: 'Spirit Projection', level: 14, description: 'Project your spirit from your body, gaining flight, incorporeality, and healing from necrotic damage.' },
  ],
  // Artificer subclasses
  'Alchemist': [
    { name: 'Experimental Elixir', level: 3, description: 'Create random magical elixirs each morning that grant healing, speed, or transformation.' },
    { name: 'Alchemical Savant', level: 5, description: 'Add INT modifier to healing and damage spells cast through alchemist supplies.' },
    { name: 'Restorative Reagents', level: 9, description: 'Cast Lesser Restoration for free and your elixirs grant temporary HP.' },
    { name: 'Chemical Mastery', level: 15, description: 'Gain resistance to acid and poison damage, and cast healing/damage spells without slots.' },
  ],
  'Armorer': [
    { name: 'Arcane Armor', level: 3, description: 'Transform a suit of armor into magical power armor with built-in weapons.' },
    { name: 'Armor Model', level: 3, description: 'Choose Guardian (melee tank) or Infiltrator (stealth sniper) configuration for your armor.' },
    { name: 'Armor Modifications', level: 9, description: 'Your armor counts as separate items for infusion purposes, allowing more enchantments.' },
    { name: 'Perfected Armor', level: 15, description: 'Your armor gains its ultimate form — Guardian pulls enemies, Infiltrator deals lightning.' },
  ],
  'Artillerist': [
    { name: 'Eldritch Cannon', level: 3, description: 'Create a magical cannon (flamethrower, force ballista, or protector) that fires each turn.' },
    { name: 'Arcane Firearm', level: 5, description: 'Turn a wand, staff, or rod into an arcane firearm that adds bonus damage to spells.' },
    { name: 'Explosive Cannon', level: 9, description: 'Your cannon deals extra damage and can self-destruct as a devastating bomb.' },
    { name: 'Fortified Position', level: 15, description: 'Create two cannons at once and allies near a protector cannon gain half cover.' },
  ],
  'Battle Smith': [
    { name: 'Steel Defender', level: 3, description: 'Construct a loyal mechanical companion that fights alongside you and repairs itself.' },
    { name: 'Battle Ready', level: 3, description: 'Use INT instead of STR or DEX for magic weapon attacks.' },
    { name: 'Arcane Jolt', level: 9, description: 'Channel energy through attacks or your defender to deal bonus damage or heal allies.' },
    { name: 'Improved Defender', level: 15, description: 'Your Steel Defender gains bonus AC, damage, and your Arcane Jolt becomes more powerful.' },
  ],
};

// ─── Spell Lists ───

export const CLASS_SPELLS: Record<string, { cantrips: string[]; level1: string[]; level2: string[]; level3: string[] }> = {
  Wizard: {
    cantrips: ['Fire Bolt', 'Mage Hand', 'Prestidigitation', 'Ray of Frost', 'Light', 'Minor Illusion', 'Shocking Grasp', 'Mind Sliver', 'Booming Blade', 'Lightning Lure'],
    level1: ['Magic Missile', 'Shield', 'Mage Armor', 'Sleep', 'Thunderwave', 'Detect Magic', 'Feather Fall', 'Burning Hands', 'Tasha\'s Hideous Laughter', 'Tasha\'s Caustic Brew'],
    level2: ['Misty Step', 'Scorching Ray', 'Hold Person', 'Invisibility', 'Web', 'Mirror Image', 'Shatter', 'Tasha\'s Mind Whip'],
    level3: ['Fireball', 'Counterspell', 'Fly', 'Lightning Bolt', 'Haste', 'Dispel Magic', 'Spirit Shroud', 'Summon Fey', 'Intellect Fortress'],
  },
  Cleric: {
    cantrips: ['Sacred Flame', 'Guidance', 'Spare the Dying', 'Thaumaturgy', 'Light', 'Toll the Dead', 'Word of Radiance'],
    level1: ['Healing Word', 'Cure Wounds', 'Bless', 'Shield of Faith', 'Guiding Bolt', 'Inflict Wounds', 'Command'],
    level2: ['Spiritual Weapon', 'Hold Person', 'Prayer of Healing', 'Lesser Restoration', 'Aid', 'Silence'],
    level3: ['Spirit Guardians', 'Revivify', 'Dispel Magic', 'Beacon of Hope', 'Mass Healing Word', 'Spirit Shroud', 'Summon Celestial'],
  },
  Bard: {
    cantrips: ['Vicious Mockery', 'Prestidigitation', 'Minor Illusion', 'Mage Hand', 'Light', 'Message'],
    level1: ['Healing Word', 'Thunderwave', 'Dissonant Whispers', 'Faerie Fire', 'Sleep', 'Charm Person', 'Heroism'],
    level2: ['Heat Metal', 'Hold Person', 'Invisibility', 'Shatter', 'Suggestion', 'Silence'],
    level3: ['Hypnotic Pattern', 'Dispel Magic', 'Fear', 'Bestow Curse', 'Leomund\'s Tiny Hut', 'Spirit Shroud', 'Intellect Fortress'],
  },
  Druid: {
    cantrips: ['Druidcraft', 'Produce Flame', 'Shillelagh', 'Thorn Whip', 'Guidance', 'Poison Spray'],
    level1: ['Entangle', 'Healing Word', 'Faerie Fire', 'Thunderwave', 'Goodberry', 'Cure Wounds', 'Fog Cloud'],
    level2: ['Moonbeam', 'Barkskin', 'Heat Metal', 'Hold Person', 'Flaming Sphere', 'Spike Growth', 'Summon Beast'],
    level3: ['Call Lightning', 'Conjure Animals', 'Plant Growth', 'Dispel Magic', 'Wind Wall', 'Summon Fey', 'Spirit Shroud'],
  },
  Sorcerer: {
    cantrips: ['Fire Bolt', 'Ray of Frost', 'Prestidigitation', 'Mage Hand', 'Light', 'Shocking Grasp', 'Chill Touch', 'Mind Sliver', 'Lightning Lure', 'Booming Blade'],
    level1: ['Magic Missile', 'Shield', 'Mage Armor', 'Chromatic Orb', 'Thunderwave', 'Sleep', 'Burning Hands', 'Tasha\'s Caustic Brew'],
    level2: ['Misty Step', 'Scorching Ray', 'Hold Person', 'Invisibility', 'Mirror Image', 'Shatter', 'Tasha\'s Mind Whip'],
    level3: ['Fireball', 'Counterspell', 'Fly', 'Lightning Bolt', 'Haste', 'Intellect Fortress', 'Summon Fey'],
  },
  Warlock: {
    cantrips: ['Eldritch Blast', 'Minor Illusion', 'Prestidigitation', 'Mage Hand', 'Chill Touch', 'Toll the Dead', 'Mind Sliver', 'Booming Blade', 'Lightning Lure'],
    level1: ['Hex', 'Armor of Agathys', 'Hellish Rebuke', 'Charm Person', 'Arms of Hadar', 'Witch Bolt'],
    level2: ['Misty Step', 'Hold Person', 'Invisibility', 'Mirror Image', 'Darkness', 'Suggestion'],
    level3: ['Counterspell', 'Fly', 'Hunger of Hadar', 'Hypnotic Pattern', 'Dispel Magic', 'Spirit Shroud', 'Summon Fey', 'Intellect Fortress'],
  },
  Paladin: {
    cantrips: [],
    level1: ['Divine Smite', 'Cure Wounds', 'Shield of Faith', 'Bless', 'Command', 'Thunderous Smite', 'Wrathful Smite'],
    level2: ['Find Steed', 'Aid', 'Lesser Restoration', 'Branding Smite', 'Magic Weapon', 'Summon Celestial'],
    level3: ['Revivify', 'Dispel Magic', 'Aura of Vitality', 'Crusader\'s Mantle', 'Elemental Weapon', 'Spirit Shroud'],
  },
  Ranger: {
    cantrips: [],
    level1: ['Hunter\'s Mark', 'Cure Wounds', 'Ensnaring Strike', 'Hail of Thorns', 'Goodberry', 'Fog Cloud'],
    level2: ['Pass without Trace', 'Spike Growth', 'Lesser Restoration', 'Silence', 'Find Traps', 'Summon Beast'],
    level3: ['Conjure Animals', 'Lightning Arrow', 'Plant Growth', 'Wind Wall', 'Summon Fey', 'Spirit Shroud'],
  },
  Artificer: {
    cantrips: ['Mending', 'Light', 'Fire Bolt', 'Shocking Grasp', 'Acid Splash', 'Guidance'],
    level1: ['Cure Wounds', 'Faerie Fire', 'Grease', 'Detect Magic', 'Sanctuary', 'Tasha\'s Caustic Brew'],
    level2: ['Aid', 'Heat Metal', 'Lesser Restoration', 'Web', 'Enlarge/Reduce', 'Invisibility'],
    level3: ['Dispel Magic', 'Haste', 'Revivify', 'Fly', 'Intellect Fortress'],
  },
  'Blood Hunter': {
    cantrips: [],
    level1: [],
    level2: [],
    level3: [],
  },
  'Eldritch Knight': {
    cantrips: ['Fire Bolt', 'Booming Blade', 'Green-Flame Blade', 'Light', 'Lightning Lure'],
    level1: ['Shield', 'Magic Missile', 'Absorb Elements', 'Burning Hands', 'Thunderwave'],
    level2: ['Misty Step', 'Mirror Image', 'Scorching Ray', 'Hold Person', 'Tasha\'s Mind Whip'],
    level3: ['Fireball', 'Counterspell', 'Haste'],
  },
  'Arcane Trickster': {
    cantrips: ['Mage Hand', 'Minor Illusion', 'Prestidigitation', 'Booming Blade'],
    level1: ['Charm Person', 'Disguise Self', 'Sleep', 'Silent Image', 'Tasha\'s Hideous Laughter'],
    level2: ['Invisibility', 'Mirror Image', 'Hold Person', 'Misty Step', 'Tasha\'s Mind Whip'],
    level3: ['Hypnotic Pattern', 'Major Image', 'Haste'],
  },
  // Subclasses with spellcasting
  'Aberrant Mind': {
    cantrips: ['Mind Sliver', 'Mage Hand', 'Minor Illusion'],
    level1: ['Arms of Hadar', 'Dissonant Whispers', 'Tasha\'s Hideous Laughter'],
    level2: ['Calm Emotions', 'Detect Thoughts', 'Tasha\'s Mind Whip'],
    level3: ['Hunger of Hadar', 'Sending', 'Summon Aberration'],
  },
  'Clockwork Soul': {
    cantrips: ['Light', 'Mending'],
    level1: ['Alarm', 'Protection from Evil and Good'],
    level2: ['Aid', 'Lesser Restoration'],
    level3: ['Dispel Magic', 'Protection from Energy'],
  },
  Fighter: { cantrips: [], level1: [], level2: [], level3: [] },
  Rogue: { cantrips: [], level1: [], level2: [], level3: [] },
  Barbarian: { cantrips: [], level1: [], level2: [], level3: [] },
  Monk: { cantrips: [], level1: [], level2: [], level3: [] },
};

export function getSpellsForCharacter(charClass: string, subclass: string, level: number): string[] {
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
