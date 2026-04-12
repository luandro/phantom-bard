import { useGame } from '@/hooks/use-game';
import { StoryLog } from '@/components/StoryLog';
import { PartyPanel } from '@/components/PartyPanel';
import { DiceRoller } from '@/components/DiceRoller';
import { ActionBar } from '@/components/ActionBar';
import { useState } from 'react';
import { Scroll, Users, Dice6, RotateCcw, Menu, X } from 'lucide-react';

export function GameScreen() {
  const { state, resetGame } = useGame();
  const [sidePanel, setSidePanel] = useState<'party' | 'dice' | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-fantasy-gradient">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2">
          <Scroll className="w-5 h-5 text-gold" />
          <h1 className="font-display text-sm text-gold truncate max-w-[180px] md:max-w-none">{state.campaignName}</h1>
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
          <button
            onClick={resetGame}
            className="p-2 text-muted-foreground hover:text-danger transition-colors"
            title="End campaign"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

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
