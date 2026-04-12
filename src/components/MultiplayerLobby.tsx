import { useState, useRef, useEffect } from 'react';
import { useGame } from '@/hooks/use-game';
import { Scroll, Users, Copy, Check, Crown, Loader2, LogIn, Swords, LogOut } from 'lucide-react';

type View = 'select' | 'creating' | 'joining' | 'waiting';

/**
 * Props for the {@link MultiplayerLobby} component.
 */
interface MultiplayerLobbyProps {
  /** Callback invoked when the user proceeds past the lobby (solo or as host). */
  onProceed: () => void;
}

/**
 * Multiplayer lobby screen with flows for creating a party, joining an existing party,
 * and waiting for the host to start the game. Includes connection timeouts and
 * a leave-party option for non-host players.
 */
export function MultiplayerLobby({ onProceed }: MultiplayerLobbyProps) {
  const { createParty, joinParty, leaveParty, isPartyConnected, partyPlayers, isPartyHost, partyCode } = useGame();

  const [view, setView] = useState<View>('select');
  const [hostName, setHostName] = useState('');
  const [joinName, setJoinName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [copied, setCopied] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [timeoutError, setTimeoutError] = useState(false);
  const codeInputRef = useRef<HTMLInputElement>(null);
  const joinTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const secondaryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleCreateParty() {
    if (!hostName.trim()) return;
    createParty(hostName.trim());
    setView('creating');
  }

  function handleJoinParty() {
    const code = joinCode.trim().toUpperCase();
    if (!joinName.trim()) { setJoinError('Please enter your name.'); return; }
    if (code.length !== 5) { setJoinError('Party code must be 5 characters.'); return; }
    setJoinError('');
    setIsJoining(true);
    joinParty(code, joinName.trim());
    setView('waiting');

    // Timeout fallback: if not connected after 5s, revert to join view with error
    if (joinTimeoutRef.current) clearTimeout(joinTimeoutRef.current);
    joinTimeoutRef.current = setTimeout(() => {
      if (!isPartyConnected) {
        setIsJoining(false);
        setView('joining');
        setJoinError('Could not connect to party. Please check the code and try again.');
      }
    }, 5000);

    // Secondary fallback: if still on waiting screen after 10s, show error
    if (secondaryTimeoutRef.current) clearTimeout(secondaryTimeoutRef.current);
    secondaryTimeoutRef.current = setTimeout(() => {
      if (!isPartyConnected) {
        setTimeoutError(true);
      }
    }, 10000);
  }

  function handleCopyCode() {
    if (!partyCode) return;
    navigator.clipboard.writeText(partyCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleCodeInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
    setJoinCode(val);
    setJoinError('');
  }

  // ── Clear isJoining when connection succeeds (Task 5) ────────────────────────
  useEffect(() => {
    if (isPartyConnected && isJoining) {
      setIsJoining(false);
      setTimeoutError(false);
      if (joinTimeoutRef.current) {
        clearTimeout(joinTimeoutRef.current);
        joinTimeoutRef.current = null;
      }
      if (secondaryTimeoutRef.current) {
        clearTimeout(secondaryTimeoutRef.current);
        secondaryTimeoutRef.current = null;
      }
    }
  }, [isPartyConnected, isJoining]);

  // ── Cleanup timeouts on unmount ───────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (joinTimeoutRef.current) {
        clearTimeout(joinTimeoutRef.current);
      }
      if (secondaryTimeoutRef.current) {
        clearTimeout(secondaryTimeoutRef.current);
      }
    };
  }, []);

  function handleLeaveParty() {
    leaveParty();
    setView('select');
    setTimeoutError(false);
    if (joinTimeoutRef.current) { clearTimeout(joinTimeoutRef.current); joinTimeoutRef.current = null; }
    if (secondaryTimeoutRef.current) { clearTimeout(secondaryTimeoutRef.current); secondaryTimeoutRef.current = null; }
  }

  function handleRetryConnection() {
    setTimeoutError(false);
    if (joinTimeoutRef.current) { clearTimeout(joinTimeoutRef.current); joinTimeoutRef.current = null; }
    if (secondaryTimeoutRef.current) { clearTimeout(secondaryTimeoutRef.current); secondaryTimeoutRef.current = null; }
    leaveParty();
    setView('joining');
    setIsJoining(false);
    setJoinError('Connection timed out. Please try again.');
  }

  // ── Waiting screen (non-host joined, game not started yet) ─────────────────
  if (view === 'waiting' && !isPartyHost) {
    return (
      <div className="min-h-screen bg-fantasy-gradient flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-5">
          <div className="text-center space-y-1">
            <Scroll className="w-8 h-8 text-gold mx-auto" />
            <h2 className="font-display text-xl text-gold">Joined Party!</h2>
            {partyCode && (
              <p className="text-xs text-muted-foreground font-mono tracking-widest">
                Code: <span className="text-foreground font-semibold">{partyCode}</span>
              </p>
            )}
          </div>

          <PlayerList players={partyPlayers} />

          {timeoutError ? (
            <div className="flex flex-col items-center gap-3 pt-2">
              <p className="text-sm text-destructive text-center">
                Connection is taking too long. The party may no longer exist.
              </p>
              <button
                onClick={handleRetryConnection}
                className="w-full py-2 rounded-xl bg-gold text-black font-display text-sm font-semibold hover:bg-gold/90 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 pt-2">
              <Loader2 className="w-5 h-5 text-gold animate-spin" />
              <p className="text-sm text-muted-foreground text-center">
                Waiting for the host to begin the adventure…
              </p>
            </div>
          )}

          <button
            onClick={handleLeaveParty}
            aria-label="Leave party and return to lobby"
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-muted-foreground hover:text-destructive border border-border hover:border-destructive/40 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogOut className="w-4 h-4" />
            Leave Party
          </button>
        </div>
      </div>
    );
  }

  // ── Creating party screen ─────────────────────────────────────────────────
  if (view === 'creating') {
    return (
      <div className="min-h-screen bg-fantasy-gradient flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-5">
          <div className="text-center space-y-1">
            <Scroll className="w-8 h-8 text-gold mx-auto" />
            <h2 className="font-display text-xl text-gold">Your Party Code</h2>
            <p className="text-xs text-muted-foreground">Share this with your friends</p>
          </div>

          {/* Code display */}
          <div className="flex items-center justify-center gap-2">
            {(partyCode ?? '-----').split('').map((char, i) => (
              <div
                key={i}
                className="w-10 h-12 flex items-center justify-center bg-background border-2 border-gold/60 rounded-lg font-mono text-xl font-bold text-gold shadow-inner"
              >
                {char}
              </div>
            ))}
          </div>

          <button
            onClick={handleCopyCode}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 text-sm transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Code'}
          </button>

          <PlayerList players={partyPlayers} />

          <button
            onClick={onProceed}
            disabled={!isPartyConnected}
            className="w-full py-3 rounded-xl bg-gold text-black font-display text-sm font-semibold hover:bg-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Continue to Campaign Setup →
          </button>

          <p className="text-xs text-center text-muted-foreground">
            Others can join while you set up the campaign
          </p>
        </div>
      </div>
    );
  }

  // ── Joining party screen ──────────────────────────────────────────────────
  if (view === 'joining') {
    return (
      <div className="min-h-screen bg-fantasy-gradient flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-5">
          <div className="text-center space-y-1">
            <LogIn className="w-8 h-8 text-gold mx-auto" />
            <h2 className="font-display text-xl text-gold">Join a Party</h2>
            <p className="text-xs text-muted-foreground">Enter the 5-character code from your host</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-display text-muted-foreground mb-1">Your Name</label>
              <input
                type="text"
                value={joinName}
                onChange={e => setJoinName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && codeInputRef.current?.focus()}
                placeholder="Adventurer"
                maxLength={24}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-1 focus:ring-gold/60"
              />
            </div>

            <div>
              <label className="block text-xs font-display text-muted-foreground mb-1">Party Code</label>
              <input
                ref={codeInputRef}
                type="text"
                value={joinCode}
                onChange={handleCodeInput}
                onKeyDown={e => e.key === 'Enter' && handleJoinParty()}
                placeholder="AB3F7"
                maxLength={5}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground text-sm font-mono tracking-[0.3em] uppercase text-center focus:outline-none focus:ring-1 focus:ring-gold/60"
              />
              {joinError && <p className="text-xs text-destructive mt-1">{joinError}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleJoinParty}
              disabled={isJoining}
              className="w-full py-3 rounded-xl bg-gold text-black font-display text-sm font-semibold hover:bg-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isJoining && <Loader2 className="w-4 h-4 animate-spin" />}
              Join Party
            </button>
            <button
              onClick={() => { setView('select'); setJoinError(''); setJoinCode(''); setIsJoining(false); if (joinTimeoutRef.current) { clearTimeout(joinTimeoutRef.current); joinTimeoutRef.current = null; } if (secondaryTimeoutRef.current) { clearTimeout(secondaryTimeoutRef.current); secondaryTimeoutRef.current = null; } }}
              className="w-full py-2 rounded-xl text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Initial selection ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-fantasy-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-6">
        <div className="text-center space-y-2">
          <Scroll className="w-10 h-10 text-gold mx-auto" />
          <h1 className="font-display text-2xl text-gold">Realm of Fate</h1>
          <p className="text-sm text-muted-foreground">Solo adventure or gather your party?</p>
        </div>

        {/* Solo */}
        <button
          onClick={onProceed}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary border border-border hover:border-gold/40 hover:bg-secondary/80 transition-colors group"
        >
          <Swords className="w-5 h-5 text-muted-foreground group-hover:text-gold transition-colors shrink-0" />
          <div className="text-left">
            <div className="text-sm font-display text-foreground">Play Solo</div>
            <div className="text-xs text-muted-foreground">Just you and the Dungeon Master</div>
          </div>
        </button>

        {/* Create party */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-display text-center uppercase tracking-widest">— or —</p>
          <div className="space-y-2">
            <label className="block text-xs font-display text-muted-foreground">Your Name (for multiplayer)</label>
            <input
              type="text"
              value={hostName}
              onChange={e => setHostName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateParty()}
              placeholder="Enter your name…"
              maxLength={24}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-1 focus:ring-gold/60"
            />
            <button
              onClick={handleCreateParty}
              disabled={!hostName.trim()}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gold/40 bg-gold/10 hover:bg-gold/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors group"
            >
              <Crown className="w-5 h-5 text-gold shrink-0" />
              <div className="text-left">
                <div className="text-sm font-display text-gold">Create Party</div>
                <div className="text-xs text-muted-foreground">Generate a code and invite friends</div>
              </div>
            </button>
            <button
              onClick={() => setView('joining')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border hover:border-gold/40 hover:bg-secondary/80 transition-colors group"
            >
              <Users className="w-5 h-5 text-muted-foreground group-hover:text-gold transition-colors shrink-0" />
              <div className="text-left">
                <div className="text-sm font-display text-foreground">Join Party</div>
                <div className="text-xs text-muted-foreground">Enter a code from your host</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Player list sub-component ────────────────────────────────────────────────

/**
 * Displays a list of connected party players with host indicators.
 * Renders nothing if the players array is empty.
 * @param props.players - Array of player objects with id, name, and isHost flag
 */
function PlayerList({ players }: { players: { id: string; name: string; isHost: boolean }[] }) {
  if (players.length === 0) return null;
  return (
    <div className="space-y-1">
      <p className="text-xs font-display text-muted-foreground uppercase tracking-wider">
        Connected ({players.length})
      </p>
      <ul className="space-y-1">
        {players.map(p => (
          <li key={p.id} className="flex items-center gap-2 text-sm">
            {p.isHost
              ? <Crown className="w-3.5 h-3.5 text-gold shrink-0" />
              : <Users className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
            <span className={p.isHost ? 'text-gold font-medium' : 'text-foreground'}>
              {p.name}
            </span>
            {p.isHost && <span className="text-xs text-muted-foreground">(host)</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
