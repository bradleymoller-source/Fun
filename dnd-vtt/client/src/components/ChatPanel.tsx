import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/Button';
import { useSessionStore } from '../stores/sessionStore';

interface ChatPanelProps {
  onSendMessage: (content: string) => void;
  playerId: string;
  playerName: string;
}

export function ChatPanel({ onSendMessage, playerId }: ChatPanelProps) {
  const [message, setMessage] = useState('');
  const { chatMessages } = useSessionStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = () => {
    if (!message.trim()) return;
    onSendMessage(message.trim());
    setMessage('');
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages List */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-3 max-h-64">
        {chatMessages.length === 0 ? (
          <p className="text-parchment/50 text-sm text-center py-4">
            No messages yet. Start the conversation!
          </p>
        ) : (
          chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`p-2 rounded text-sm ${
                msg.type === 'system'
                  ? 'bg-blue-900/30 text-blue-300 italic'
                  : msg.type === 'roll'
                  ? 'bg-amber-900/30 border-l-2 border-amber-500'
                  : msg.senderId === playerId
                  ? 'bg-leather/50'
                  : 'bg-dark-wood'
              }`}
            >
              {msg.type !== 'system' && (
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gold font-medieval text-xs">
                    {msg.senderName}
                  </span>
                  <span className="text-parchment/30 text-xs">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              )}
              <div className="text-parchment">{msg.content}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          className="flex-1 bg-parchment text-dark-wood px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gold"
        />
        <Button size="sm" onClick={handleSend} disabled={!message.trim()}>
          Send
        </Button>
      </div>
    </div>
  );
}
