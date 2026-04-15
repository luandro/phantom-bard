<h1 align="center">Phantom Bard</h1>

<p align="center">
  <strong>AI-Powered Dungeons & Dragons with a Virtual Dungeon Master</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React_19-blue?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TanStack_Start-orange?logo=tanstack" alt="TanStack Start" />
  <img src="https://img.shields.io/badge/TypeScript_5.8-blue?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS_4-38bdf8?logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4" />
  <img src="https://img.shields.io/badge/PartyKit- multiplayer-7c3aed" alt="PartyKit" />
  <img src="https://img.shields.io/badge/Supabase-3ecf8e?logo=supabase&logoColor=white" alt="Supabase" />
</p>

---

## What is Phantom Bard?

Phantom Bard is a browser-based D&D 5e experience powered by AI. An AI Dungeon Master narrates your adventure, responds to player actions, requests dice rolls for uncertain outcomes, tracks HP, awards loot, and weaves a dynamic story around your party. Play solo or with friends in real-time multiplayer.

### Key Features

- **AI Dungeon Master** -- A Supabase Edge Function (powered by an LLM) acts as your DM: setting scenes, reacting to player choices, requesting dice rolls, tracking HP changes, and awarding loot drops
- **Full D&D 5e Character Creation** -- 10 races (including Custom Lineage), 14 classes, 80+ subclasses, ability score rolling (4d6 drop lowest), subclass ability previews, and auto-generated spell lists
- **Prebuilt Campaigns** -- Jump right in with *Lost Mine of Phandelver*, *Curse of Strahd*, or *Dragon of Icespire Peak*, or create your own custom campaign
- **Group Patrons** -- Optional faction system (Arcane Academy, Silver Ravens, Order of the Radiant Shield, etc.) that provides perks and quest hooks woven into the narrative
- **Real-Time Multiplayer** -- Create or join a party with a 5-character code via PartyKit WebSockets; the host controls game state while guests see live updates
- **Dice Roller** -- d4 through d20 with stat modifiers, critical hit/miss detection, and animated results
- **Loot System** -- Rarity-scaled loot drops (Common through Legendary) tied to campaign level, with item assignment to party members
- **Spell Casting** -- Modal spell selector for caster classes with level-gated spell lists
- **Text-to-Speech Narration** -- Listen to the DM's narration via Puter.js TTS integration
- **Persistent State** -- Game progress auto-saves to localStorage; resume your adventure anytime
- **Responsive Fantasy UI** -- Custom dark fantasy theme with Cinzel/Crimson Text fonts, gold accents, and smooth Framer Motion animations

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [TanStack Start](https://tanstack.com/start) (React 19 + file-based routing) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) (New York style) |
| AI DM Backend | [Supabase Edge Functions](https://supabase.com/docs/guides/functions) (`dm-chat`) |
| Real-Time Multiplayer | [PartyKit](https://partykit.io) WebSocket rooms |
| Animations | [Framer Motion](https://motion.dev) |
| Build Tool | [Vite 7](https://vite.dev) with `@lovable.dev/vite-tanstack-config` |
| Deployment | Cloudflare Workers (via Wrangler) + PartyKit |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) >= 20 (or [Bun](https://bun.sh) >= 1)
- A [Supabase](https://supabase.com) project with the `dm-chat` Edge Function deployed
- (Optional) A [PartyKit](https://partykit.io) account for deployed multiplayer

### 1. Clone and Install

```bash
git clone https://github.com/luandro/phantom-bard.git
cd phantom-bard
npm install
```

### 2. Configure Environment Variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Open `.env` and set:

```env
# Supabase -- Required for the AI Dungeon Master
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key

# PartyKit -- Optional for local dev (defaults to 127.0.0.1:1999)
# Set this for production multiplayer:
# VITE_PARTYKIT_HOST=phantom-bard.your-username.partykit.dev
```

### 3. Deploy the AI DM Edge Function

The `supabase/functions/dm-chat/index.ts` Edge Function handles all AI narration. Deploy it to your Supabase project:

```bash
supabase functions deploy dm-chat
```

Make sure your Supabase project has the necessary AI/LLM secrets configured (e.g. `OPENAI_API_KEY` or equivalent) for the edge function to call the model.

---

## Usage

### Running Locally

#### Solo Play (AI DM Only)

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and start adventuring.

#### With Multiplayer (PartyKit)

Run both the Vite dev server and the PartyKit server concurrently:

```bash
npm run dev:all
```

This starts:
- **Vite** on `http://localhost:5173` (the app)
- **PartyKit** on `ws://127.0.0.1:1999` (real-time multiplayer)

### Playing the Game

1. **Choose your mode** -- On the landing screen, pick **Play Solo** for a single-player adventure, or set up multiplayer (see below)
2. **Name your campaign** -- Enter a campaign name. Use a prebuilt campaign name (e.g. "Lost Mine of Phandelver") for a curated experience, or invent your own
3. **Set the party level** -- Slide to choose a starting level (1--20)
4. **Pick a Group Patron** (optional) -- Select a faction that sponsors your party for perks and story hooks
5. **Create your party** -- Add characters with race, class, subclass, and ability scores. Click "Roll 4d6" to generate stats automatically
6. **Begin the adventure** -- The AI DM sets the scene. Type actions in the input bar, use quick-action buttons, or cast spells

### Multiplayer

#### Host a Party

1. Enter your name on the landing screen
2. Click **Create Party** -- a 5-character code is generated
3. Share the code with your friends
4. Click **Continue to Campaign Setup** and configure the game
5. Once you start the campaign, all connected players see the story unfold in real-time

#### Join a Party

1. Click **Join Party** on the landing screen
2. Enter your name and the host's 5-character code
3. Wait for the host to start the adventure -- you'll see the story live as it happens

### During Gameplay

| Action | How |
|---|---|
| **Take an action** | Type in the input bar and press Enter |
| **Quick actions** | Click Attack, Cast Spell, Investigate, Talk, or Use Item buttons |
| **Cast a spell** | Click "Cast Spell" to open the spell selector modal |
| **Roll dice** | Open the Dice panel (sidebar) and pick a die type. Optionally add a stat modifier |
| **View party** | Open the Party panel to see HP bars, stats, inventory, and spells |
| **Manage loot** | Open the Loot panel to see found items and assign them to characters |
| **Listen to narration** | Click the speaker icon on any DM narration entry for text-to-speech |
| **End campaign** | Click the reset button (circular arrow) in the header |

---

## Project Structure

```
phantom-bard/
├── party/
│   └── index.ts              # PartyKit WebSocket room (multiplayer server)
├── public/                    # Static assets
├── src/
│   ├── components/
│   │   ├── ui/                # shadcn/ui primitives (button, card, dialog, etc.)
│   │   ├── ActionBar.tsx      # Player input bar + quick action buttons
│   │   ├── DiceRoller.tsx     # Dice rolling panel with stat modifiers
│   │   ├── GameScreen.tsx     # Main game layout (story, panels, header)
│   │   ├── GameSetup.tsx      # Campaign + character creation wizard
│   │   ├── LootPanel.tsx      # Loot inventory and item assignment
│   │   ├── MultiplayerLobby.tsx  # Create/join party lobby
│   │   ├── PartyPanel.tsx     # Party member stats display
│   │   ├── SpellCastModal.tsx # Spell selection and casting modal
│   │   └── StoryLog.tsx       # Scrollable story feed with TTS
│   ├── hooks/
│   │   └── use-game.tsx       # Core game state, AI DM calls, party WebSocket
│   ├── integrations/
│   │   └── supabase/          # Supabase client setup
│   ├── lib/
│   │   ├── game-store.ts      # State persistence, character creation, dice logic
│   │   ├── party-types.ts     # Multiplayer player type
│   │   ├── types.ts           # D&D types, loot tables, spells, subclasses, campaigns
│   │   └── utils.ts           # General utilities
│   ├── routes/
│   │   ├── __root.tsx         # Root layout, fonts, meta
│   │   └── index.tsx          # Main page (lobby -> setup -> game routing)
│   ├── styles.css             # Tailwind + custom fantasy theme variables
│   └── router.tsx             # TanStack Router config
├── supabase/
│   └── functions/
│       └── dm-chat/
│           └── index.ts       # AI Dungeon Master Edge Function
├── .env.example               # Environment variable template
├── partykit.json              # PartyKit room configuration
├── vite.config.ts             # Vite build config
└── wrangler.jsonc             # Cloudflare Workers deployment config
```

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server (solo play) |
| `npm run dev:party` | Start PartyKit server only |
| `npm run dev:all` | Start both Vite and PartyKit concurrently |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run party:deploy` | Deploy PartyKit room to production |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Yes | Your Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase anon/public key |
| `VITE_PARTYKIT_HOST` | No | PartyKit host for multiplayer (defaults to `127.0.0.1:1999` for local dev) |

---

## Deployment

**For detailed step-by-step deployment instructions, see [DEPLOY.md](./DEPLOY.md).**

Quick summary:

| What | Command |
|---|---|
| Frontend (Cloudflare Workers) | `npm run build && npx wrangler deploy` |
| Multiplayer (PartyKit) | `npm run party:deploy` |
| AI DM (Supabase) | `supabase functions deploy dm-chat` |

---

## License

This project is private and not currently licensed for public use.
