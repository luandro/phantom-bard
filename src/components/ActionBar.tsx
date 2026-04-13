import { useState } from 'react';
import { useGame } from '@/hooks/use-game';
import { SpellCastModal } from '@/components/SpellCastModal';
import { Send, Sword, Sparkles, Search, MessageCircle, Package } from 'lucide-react';

export function ActionBar() {
  const { sendPlayerAction, isLoading } = useGame();
  const [input, setInput] = useState('');
  const [spellModalOpen, setSpellModalOpen] = useState(false);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendPlayerAction(input.trim());
    setInput('');
  };

  const handleQuickAction = (action: string) => {
    if (action === '__SPELL__') {
      setSpellModalOpen(true);
      return;
    }
    if (action.endsWith(' ')) {
      setInput(action);
    } else {
      sendPlayerAction(action);
    }
  };

  const handleSpellCast = (characterName: string, spell: string) => {
    const spellName = spell.replace(/ \(.*\)/, '');
    sendPlayerAction(`${characterName} casts ${spellName}!`);
  };

  const QUICK_ACTIONS = [
    { label: 'Attack', icon: Sword, action: 'I attack the nearest enemy!' },
    { label: 'Cast Spell', icon: Sparkles, action: '__SPELL__' },
    { label: 'Investigate', icon: Search, action: 'I investigate the area carefully.' },
    { label: 'Talk', icon: MessageCircle, action: 'I try to speak with ' },
    { label: 'Use Item', icon: Package, action: 'I use my ' },
  ];

  return (
    <>
      <div className="border-t border-border bg-card p-3 space-y-2">
        {/* Quick Actions */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-fantasy pb-1">
          {QUICK_ACTIONS.map(qa => (
            <button
              key={qa.label}
              onClick={() => handleQuickAction(qa.action)}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-full text-xs font-display whitespace-nowrap hover:bg-accent transition-colors disabled:opacity-40 shrink-0"
            >
              <qa.icon className="w-3 h-3" />
              {qa.label}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="What do you do?"
            disabled={isLoading}
            className="flex-1 bg-input border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-primary text-primary-foreground px-4 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      <SpellCastModal
        open={spellModalOpen}
        onClose={() => setSpellModalOpen(false)}
        onCast={handleSpellCast}
      />
    </>
  );
}
