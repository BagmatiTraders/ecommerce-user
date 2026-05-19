'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Settings, ShieldOff, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { messagingService, ChatMessage } from '@/lib/messaging';

const FloatingChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSyncEnabled(localStorage.getItem('sync_to_messaging_app') !== 'false');
    }
  }, []);

  useEffect(() => {
    if (isOpen && !conversationId) {
      initChat();
    }
  }, [isOpen, conversationId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const initChat = async () => {
    try {
      const conv = await messagingService.getOrCreateConversation();
      if (conv) {
        setConversationId(conv.id);
        // Load existing messages
        const { data: messages } = await (await import('@/lib/supabase')).supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: true });
        
        if (messages) setChatHistory(messages);

        // Subscribe to new messages
        messagingService.subscribeToMessages(conv.id, (newMsg) => {
          setChatHistory(prev => {
            if (prev.find(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        });
      }
    } catch (err) {
      console.error('Failed to init chat:', err);
    }
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    
    const text = message;
    setMessage('');

    try {
      const sentMsg = await messagingService.sendMessage(text);
      if (sentMsg) {
        setChatHistory(prev => [...prev, sentMsg]);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const toggleSync = () => {
    const newVal = !syncEnabled;
    setSyncEnabled(newVal);
    localStorage.setItem('sync_to_messaging_app', String(newVal));
  };

  return (
    <div className="hidden md:block fixed bottom-8 right-8 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 w-80 sm:w-96 glass rounded-[2rem] premium-shadow flex flex-col overflow-hidden border-[var(--glass-border)]"
          >
            {/* Chat Header */}
            <div className="p-6 bg-[var(--primary-gradient)] text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex-center">
                  <MessageCircle size={20} />
                </div>
                <div>
                  <div className="font-bold">Chat with us</div>
                  <div className="text-xs opacity-80 flex items-center gap-1">
                    {syncEnabled ? <ShieldCheck size={10} /> : <ShieldOff size={10} />}
                    {syncEnabled ? 'Syncing to Admin' : 'Private (Offline)'}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowSettings(!showSettings)} className="hover:rotate-45 transition-transform opacity-70 hover:opacity-100">
                  <Settings size={18} />
                </button>
                <button onClick={() => setIsOpen(false)} className="hover:rotate-90 transition-transform opacity-70 hover:opacity-100">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Settings Overlay */}
            {showSettings && (
              <div className="p-4 bg-[var(--surface-1)] border-b border-[var(--glass-border)] animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Settings</span>
                  <button onClick={() => setShowSettings(false)} className="text-xs text-[var(--primary)] font-bold">Done</button>
                </div>
                <div className="mt-3 flex items-center justify-between bg-white p-3 rounded-xl shadow-sm">
                  <div className="text-sm font-medium">Sync with Messaging App</div>
                  <button 
                    onClick={toggleSync}
                    className={`w-12 h-6 rounded-full transition-all relative ${syncEnabled ? 'bg-[var(--primary)]' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${syncEnabled ? 'left-7' : 'left-1'}`}></div>
                  </button>
                </div>
              </div>
            )}

            {/* Chat Body */}
            <div ref={scrollRef} className="h-80 p-6 overflow-y-auto bg-[var(--card-bg)] flex flex-col gap-4 scroll-smooth">
              {chatHistory.length === 0 ? (
                <div className="h-full flex-center flex-col gap-3 text-center text-[var(--text-muted)]">
                  <div className="w-12 h-12 rounded-full bg-[var(--surface-1)] flex-center">
                    <MessageCircle size={24} />
                  </div>
                  <p className="text-sm">Welcome! How can we help you today?</p>
                </div>
              ) : (
                chatHistory.map((msg, i) => (
                  <div 
                    key={msg.id || i} 
                    className={`max-w-[80%] p-4 rounded-2xl text-sm ${
                      msg.sender === 'customer' 
                        ? 'bg-[var(--primary)] text-white self-end rounded-tr-none' 
                        : 'bg-[var(--surface-1)] text-[var(--text-primary)] self-start rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                ))
              )}
            </div>

            {/* Chat Input */}
            <div className="p-4 bg-[var(--surface-0)] border-t border-[var(--glass-border)] flex gap-2 items-center">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-[var(--surface-1)] border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-[var(--primary)] outline-none"
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <button 
                onClick={handleSend}
                className="w-10 h-10 rounded-xl bg-[var(--primary)] text-white flex-center hover:bg-[var(--primary-hover)] transition-all"
              >
                <Send size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 rounded-full bg-[var(--primary)] text-white flex-center premium-shadow hover:scale-110 transition-all hover:bg-[var(--primary-hover)] relative"
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
        {!isOpen && chatHistory.length > 0 && chatHistory[chatHistory.length - 1].sender === 'agent' && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex-center text-[10px] font-bold">1</span>
        )}
      </button>
    </div>
  );
};

export default FloatingChat;
