import { useGame } from '@/hooks/use-game';
import { StoryLog } from '@/components/StoryLog';
import { PartyPanel } from '@/components/PartyPanel';
import { DiceRoller } from '@/components/DiceRoller';
import { ActionBar } from '@/components/ActionBar';
import { useState, useEffect } from 'react';
import { Scroll, Users, Dice6, RotateCcw, Menu, X, Crown, Wifi } from 'lucide-react';

/**
 * Main game screen component that renders the story log, action bar,
 * party panel, dice roller, and header with party info dropdown.
 * Supports both solo and multiplayer modes with responsive layout.
 */
export function GameScreen() {
  const { state, resetGame, partyCode, partyPlayers, isPartyHost, isPartyConnected } = useGame();
  const [sidePanel, setSidePanel] = useState<'party' | 'dice' | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showPartyInfo, setShowPartyInfo] = useState(false);

  // Close party info dropdown on Escape key
  useEffect(() => {
    if (!showPartyInfo) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setShowPartyInfo(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showPartyInfo]);

  const inParty = Boolean(partyCode);

  return (
    <div className="h-screen flex flex-col bg-fantasy-gradient">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Scroll className="w-5 h-5 text-gold shrink-0" />
          <h1 className="font-display text-sm text-gold truncate max-w-[140px] md:max-w-none">{state.campaignName}</h1>

          {/* Party badge */}
          {inParty && (
            <button
              onClick={() => setShowPartyInfo(v => !v)}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold/15 border border-gold/30 text-gold text-xs font-mono hover:bg-gold/25 transition-colors shrink-0"
              title="Party info"
            >
              {isPartyHost ? <Crown className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
              <span className="tracking-widest">{partyCode}</span>
              <span className="ml-0.5 text-gold/70">·{partyPlayers.length}</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Desktop buttons */}
          <div className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setSidePanel(sidePanel === 'party' ? null : 'party')}
              className={`p-2 rounded-lg transition-colors ${sidePanel === 'party' ? 'bg-gold/20 text-gold' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Users className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSidePanel(sidePanel === 'dice' ? null : 'dice')}
              className={`p-2 rounded-lg transition-colors ${sidePanel === 'dice' ? 'bg-gold/20 text-gold' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Dice6 className="w-4 h-4" />
            </button>
          </div>
          {/* Mobile menu */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
          >
            {showMobileMenu ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
          {(!inParty || isPartyHost) && (
            <button
              onClick={resetGame}
              className="p-2 text-muted-foreground hover:text-danger transition-colors"
              title="End campaign"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Party info dropdown */}
      {inParty && showPartyInfo && (
        <div className="border-b border-border bg-card/95 px-4 py-3 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-display text-muted-foreground uppercase tracking-wider mb-2">
                Party — Code: <span className="text-gold font-mono tracking-widest">{partyCode}</span>
                {!isPartyConnected && <span className="ml-2 text-destructive">(disconnected)</span>}
              </p>
              <ul className="flex flex-wrap gap-x-4 gap-y-1">
                {partyPlayers.map(p => (
                  <li key={p.id} className="flex items-center gap-1 text-xs">
                    {p.isHost
                      ? <Crown className="w-3 h-3 text-gold" />
                      : <Users className="w-3 h-3 text-muted-foreground" />}
                    <span className={p.isHost ? 'text-gold' : 'text-foreground'}>{p.name}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => setShowPartyInfo(false)}
              className="text-muted-foreground hover:text-foreground p-1 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile dropdown */}
      {showMobileMenu && (
        <div className="md:hidden border-b border-border bg-card p-2 flex gap-2 shrink-0">
          <button
            onClick={() => { setSidePanel(sidePanel === 'party' ? null : 'party'); setShowMobileMenu(false); }}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-display"
          >
            <Users className="w-4 h-4" /> Party
          </button>
          <button
            onClick={() => { setSidePanel(sidePanel === 'dice' ? null : 'dice'); setShowMobileMenu(false); }}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-display"
          >
            <Dice6 className="w-4 h-4" /> Dice
          </button>
        </div>
      )}

      {/* Main */}
      <div className="flex flex-1 overflow-hidden">
        {/* Story */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <StoryLog />
          <ActionBar />
        </div>

        {/* Side Panel */}
        {sidePanel && (
          <aside className="w-64 md:w-72 border-l border-border bg-card/50 overflow-y-auto scrollbar-fantasy shrink-0">
            {sidePanel === 'party' && <PartyPanel />}
            {sidePanel === 'dice' && <DiceRoller />}
          </aside>
        )}
      </div>
    </div>
  );
}
