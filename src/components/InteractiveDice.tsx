import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '@/hooks/use-game';
import { Dice6 } from 'lucide-react';

export function InteractiveDice() {
  const { state, resolvePendingRoll } = useGame();
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<{ total: number; raw: number; crit: boolean; fail: boolean } | null>(null);

  const pending = state.pendingRoll;
  if (!pending && !result) return null;

  const handleClick = () => {
    if (!pending || rolling) return;
    setRolling(true);

    // Animate for 800ms then resolve
    setTimeout(() => {
      const roll = resolvePendingRoll();
      if (roll) {
        setResult({ total: roll.total, raw: roll.result, crit: roll.isCriticalSuccess, fail: roll.isCriticalFail });
        setTimeout(() => {
          setResult(null);
          setRolling(false);
        }, 2500);
      } else {
        setRolling(false);
      }
    }, 800);
  };

  return (
    <AnimatePresence>
      {(pending || result) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: -20 }}
          className="flex flex-col items-center gap-3 py-4"
        >
          {pending && !result && (
            <>
              <p className="text-sm text-gold font-display text-center">
                {pending.reason || 'The DM calls for a roll!'}
              </p>
              <p className="text-xs text-muted-foreground">
                {pending.characterName && <span className="text-foreground">{pending.characterName}</span>}
                {' '}— Roll {pending.diceType}{pending.modifier !== 0 ? ` (${pending.modifier >= 0 ? '+' : ''}${pending.modifier})` : ''}
              </p>

              <motion.button
                onClick={handleClick}
                disabled={rolling}
                className="relative group"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className={`w-24 h-24 rounded-2xl border-2 border-gold/60 bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center cursor-pointer shadow-lg shadow-gold/20 ${rolling ? 'pointer-events-none' : ''}`}
                  animate={rolling ? {
                    rotateX: [0, 360, 720, 1080],
                    rotateY: [0, 180, 360, 540],
                    scale: [1, 1.2, 0.9, 1.1],
                  } : {
                    rotateY: [0, 5, -5, 0],
                    scale: [1, 1.02, 1],
                  }}
                  transition={rolling ? {
                    duration: 0.8,
                    ease: 'easeOut',
                  } : {
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <Dice6 className="w-12 h-12 text-gold" />
                </motion.div>

                {!rolling && (
                  <motion.div
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-20 h-4 rounded-full bg-gold/10 blur-md"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </motion.button>

              {!rolling && (
                <motion.p
                  className="text-xs text-gold/60 font-display"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  TAP TO ROLL
                </motion.p>
              )}
            </>
          )}

          {result && (
            <motion.div
              initial={{ scale: 0, rotateZ: -180 }}
              animate={{ scale: 1, rotateZ: 0 }}
              className="flex flex-col items-center gap-2"
            >
              <div className={`w-24 h-24 rounded-2xl border-2 flex items-center justify-center ${
                result.crit ? 'border-success bg-success/20 shadow-lg shadow-success/30' :
                result.fail ? 'border-danger bg-danger/20 shadow-lg shadow-danger/30' :
                'border-gold/60 bg-gold/10'
              }`}>
                <span className={`font-display text-4xl ${
                  result.crit ? 'text-success' : result.fail ? 'text-danger' : 'text-gold'
                }`}>
                  {result.total}
                </span>
              </div>
              {result.crit && (
                <motion.p
                  initial={{ scale: 0 }}
                  animate={{ scale: [1, 1.2, 1] }}
                  className="text-success font-display text-sm tracking-wider"
                >
                  ✦ CRITICAL HIT! ✦
                </motion.p>
              )}
              {result.fail && (
                <motion.p
                  initial={{ scale: 0 }}
                  animate={{ scale: [1, 1.2, 1] }}
                  className="text-danger font-display text-sm tracking-wider"
                >
                  ✦ CRITICAL FAIL! ✦
                </motion.p>
              )}
              <p className="text-xs text-muted-foreground">
                Raw: {result.raw}
              </p>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
