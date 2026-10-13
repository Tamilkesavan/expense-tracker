import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';

const SUGGESTIONS = [
  'How much did we spend this month?',
  'Top categories in the last 3 months',
  'How much is left on our chits and loans?',
  'When is my next period expected?',
];

export default function ChatAssistant({ userName }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isSending]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && setIsOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const sendMessage = async (text) => {
    const question = text.trim();
    if (!question || isSending) return;

    const history = [...messages.filter((m) => !m.isError), { role: 'user', content: question }];
    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setInput('');
    setIsSending(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName,
          messages: history.map(({ role, content }) => ({ role, content })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'The assistant is unavailable right now.');
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: err.message, isError: true }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      {!isOpen && (
        <button className="chat-fab" onClick={() => setIsOpen(true)} aria-label="Ask the assistant">
          <MessageCircle size={24} />
        </button>
      )}

      {isOpen && (
        <section className="chat-panel" role="dialog" aria-label="Ask about your data">
          <header className="chat-header">
            <span className="chat-avatar"><Sparkles size={18} /></span>
            <div className="chat-header-text">
              <span className="chat-title">Ask Suite</span>
              <span className="chat-sub">Answers from your expenses, chits and cycles</span>
            </div>
            <button className="chat-close" onClick={() => setIsOpen(false)} aria-label="Close chat">
              <X size={18} />
            </button>
          </header>

          <div className="chat-messages" ref={listRef} aria-live="polite">
            {messages.length === 0 && (
              <div className="chat-empty">
                <p>Hi {userName || 'there'}! Ask me anything about your data.</p>
                <div className="chat-suggestions">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} className="chat-chip" onClick={() => sendMessage(s)}>{s}</button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`chat-bubble chat-${m.role}${m.isError ? ' chat-error' : ''}`}>
                {m.content}
              </div>
            ))}
            {isSending && (
              <div className="chat-bubble chat-assistant chat-typing" aria-label="Assistant is typing">
                <span /><span /><span />
              </div>
            )}
          </div>

          <form className="chat-input-row" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. Grocery spend last month?"
              maxLength={2000}
              aria-label="Your question"
            />
            <button type="submit" className="chat-send" disabled={!input.trim() || isSending} aria-label="Send">
              <Send size={18} />
            </button>
          </form>
        </section>
      )}
    </>
  );
}
