import { useRef, useEffect, useState, useCallback } from 'react';
import { useGame } from '@/hooks/use-game';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { InteractiveDice } from '@/components/InteractiveDice';
import { BookOpen, User, Dice6, Info, Volume2, VolumeX, Loader2, Gift } from 'lucide-react';

declare global {
  interface Window {
    puter: {
      ai: {
        txt2speech: (text: string, options?: Record<string, unknown>) => Promise<HTMLAudioElement>;
      };
    };
  }
}

export function StoryLog() {
  const { state, isLoading } = useGame();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [state.storyLog.length, isLoading]);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setPlayingId(null);
  }, []);

  const playNarration = useCallback(async (entryId: string, text: string) => {
    // If already playing this entry, stop it
    if (playingId === entryId) {
      stopAudio();
      return;
    }

    // Stop any current playback
    stopAudio();

    if (!window.puter) {
      console.error('Puter.js not loaded yet');
      return;
    }

    setLoadingId(entryId);
    try {
      // Strip markdown for cleaner speech
      const cleanText = text
        .replace(/[#*_~`>]/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/\n+/g, '. ')
        .trim();

      const audio = await window.puter.ai.txt2speech(cleanText, {
        voice: 'Matthew',
        engine: 'neural',
        language: 'en-US',
      });

      audioRef.current = audio;
      setPlayingId(entryId);
      setLoadingId(null);

      audio.addEventListener('ended', () => {
        setPlayingId(null);
        audioRef.current = null;
      });

      audio.play();
    } catch (err) {
      console.error('TTS error:', err);
      setLoadingId(null);
    }
  }, [playingId, stopAudio]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopAudio();
  }, [stopAudio]);

  const iconMap: Record<string, React.ReactNode> = {
    narration: <BookOpen className="w-4 h-4 text-gold" />,
    player: <User className="w-4 h-4 text-success" />,
    dice: <Dice6 className="w-4 h-4 text-magic" />,
    system: <Info className="w-4 h-4 text-muted-foreground" />,
    puzzle: <Dice6 className="w-4 h-4 text-gold" />,
    loot: <Gift className="w-4 h-4 text-gold" />,
  };

  const colorMap: Record<string, string> = {
    narration: 'border-l-gold/40',
    player: 'border-l-success/40',
    dice: 'border-l-magic/40',
    system: 'border-l-muted-foreground/40',
    puzzle: 'border-l-gold/40',
    loot: 'border-l-gold/60',
  };

  const rarityStyles: Record<string, string> = {
    common: 'bg-muted/40 text-muted-foreground border-muted-foreground/20',
    uncommon: 'bg-success/10 text-success border-success/30',
    rare: 'bg-blue-500/10 text-blue-400 border-blue-400/30',
    very_rare: 'bg-magic/10 text-magic border-magic/30',
    legendary: 'bg-gold/15 text-gold border-gold/40',
  };

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-fantasy p-4 space-y-3">
      {state.storyLog.map((entry) => (
        <motion.div
          key={entry.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`border-l-2 ${colorMap[entry.type]} pl-4 py-1`}
        >
          <div className="flex items-center gap-2 mb-1">
            {iconMap[entry.type]}
            <span className="text-xs text-muted-foreground font-display">
              {entry.type === 'narration' ? 'Dungeon Master' : entry.type === 'player' ? entry.characterName ?? 'Player' : entry.type === 'dice' ? 'Dice Roll' : 'System'}
            </span>
            {entry.type === 'narration' && (
              <button
                onClick={() => playNarration(entry.id, entry.content)}
                className="ml-auto p-1 rounded hover:bg-accent/20 transition-colors"
                title={playingId === entry.id ? 'Stop narration' : 'Listen to narration'}
              >
                {loadingId === entry.id ? (
                  <Loader2 className="w-3.5 h-3.5 text-gold animate-spin" />
                ) : playingId === entry.id ? (
                  <VolumeX className="w-3.5 h-3.5 text-gold" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-muted-foreground hover:text-gold transition-colors" />
                )}
              </button>
            )}
          </div>
          {entry.type === 'narration' ? (
            <div className="prose prose-sm prose-invert max-w-none text-foreground/90 leading-relaxed">
              <ReactMarkdown>{entry.content}</ReactMarkdown>
            </div>
          ) : entry.type === 'dice' ? (
            <p className="text-magic font-display text-sm">{entry.content}</p>
          ) : entry.type === 'loot' && entry.lootData ? (
            <div className="space-y-1.5">
              <p className="text-sm text-gold font-display">{entry.content}</p>
              <div className="flex flex-wrap gap-1.5">
                {entry.lootData.map(item => (
                  <span
                    key={item.id}
                    className={`text-xs px-2 py-1 rounded-lg border ${rarityStyles[item.rarity]}`}
                    title={`${item.description}${item.effect ? ` — ${item.effect}` : ''}`}
                  >
                    {item.name} <span className="opacity-60">({item.rarity.replace('_', ' ')})</span>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className={`text-sm ${entry.type === 'player' ? 'text-foreground italic' : 'text-muted-foreground'}`}>
              {entry.content}
            </p>
          )}
        </motion.div>
      ))}

      {/* Interactive dice prompt */}
      <InteractiveDice />

      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border-l-2 border-l-gold/40 pl-4 py-2"
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-gold animate-pulse" />
            <span className="text-xs text-gold-muted font-display">The Dungeon Master is narrating...</span>
          </div>
          <div className="flex gap-1 mt-2">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-gold/50"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
