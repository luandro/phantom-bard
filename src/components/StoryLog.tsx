import { useRef, useEffect } from 'react';
import { useGame } from '@/hooks/use-game';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { BookOpen, User, Dice6, Info } from 'lucide-react';

export function StoryLog() {
  const { state, isLoading } = useGame();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [state.storyLog.length, isLoading]);

  const iconMap = {
    narration: <BookOpen className="w-4 h-4 text-gold" />,
    player: <User className="w-4 h-4 text-success" />,
    dice: <Dice6 className="w-4 h-4 text-magic" />,
    system: <Info className="w-4 h-4 text-muted-foreground" />,
  };

  const colorMap = {
    narration: 'border-l-gold/40',
    player: 'border-l-success/40',
    dice: 'border-l-magic/40',
    system: 'border-l-muted-foreground/40',
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
          </div>
          {entry.type === 'narration' ? (
            <div className="prose prose-sm prose-invert max-w-none text-foreground/90 leading-relaxed">
              <ReactMarkdown>{entry.content}</ReactMarkdown>
            </div>
          ) : entry.type === 'dice' ? (
            <p className="text-magic font-display text-sm">{entry.content}</p>
          ) : (
            <p className={`text-sm ${entry.type === 'player' ? 'text-foreground italic' : 'text-muted-foreground'}`}>
              {entry.content}
            </p>
          )}
        </motion.div>
      ))}

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
