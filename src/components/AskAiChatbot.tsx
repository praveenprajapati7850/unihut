import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  Loader2,
  Bot,
  RotateCcw,
  Search,
  PlusCircle,
  Megaphone,
  ShieldCheck,
  ChevronDown,
  MessageSquare,
  ArrowRight,
  Info,
} from 'lucide-react';
import { Listing } from '../types';
import { fetchAskAiChat } from '../lib/aiService';

interface AskAiChatbotProps {
  listings: Listing[];
  onNavigate: (tab: string, param?: string) => void;
  onOpenHandoverModal?: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  suggestedAction?: 'browse_marketplace' | 'post_listing' | 'post_wanted' | 'view_handover_zones' | null;
  suggestedQuery?: string | null;
  timestamp: string;
}

const STARTER_PROMPTS = [
  'Are there calculators or cycles for sale?',
  'How do I bargain safely with a seller?',
  'What are verified campus handover zones?',
  'How do I post a wanted request?',
];

export const AskAiChatbot: React.FC<AskAiChatbotProps> = ({
  listings,
  onNavigate,
  onOpenHandoverModal,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const initialGreeting: ChatMessage = {
    id: 'welcome-msg',
    role: 'model',
    content:
      "👋 Hey! I'm **Ask AI**, your UniHut Campus Marketplace assistant.\n\nI can help you find textbooks, cycles, calculators, explain how to bargain safely, and locate verified campus handover zones.\n\n*I am exclusively focused on UniHut & student essentials.* How can I help you today?",
    timestamp: 'Just now',
  };

  const [messages, setMessages] = useState<ChatMessage[]>([initialGreeting]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, loading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInputMessage('');
    setLoading(true);
    setHasInteracted(true);

    try {
      // Build lightweight inventory context from real listings
      const inventoryContext = listings
        .filter((l) => l.status === 'available')
        .slice(0, 15)
        .map((l) => ({
          id: l.id,
          title: l.title,
          price: l.price,
          category: l.category,
          condition: l.condition,
        }));

      // Prepare conversation history for Gemini
      const apiMessages = nextMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetchAskAiChat({
        messages: apiMessages,
        inventoryContext,
      });

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'model',
        content: res.reply,
        suggestedAction: res.suggestedAction,
        suggestedQuery: res.suggestedQuery,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const lower = text.toLowerCase();
      let fallbackText = "I'm your UniHut Campus Marketplace assistant. How can I help you find textbooks, cycles, calculators, or hostel essentials on campus today?";
      let suggestedAction: ChatMessage['suggestedAction'] = 'browse_marketplace';
      let suggestedQuery: string | null = null;

      if (lower.includes('calc') || lower.includes('casio')) {
        fallbackText = "Scientific calculators like Casio FX-991 are listed under Electronics (usually ₹350–₹700). Inspect and test keys at campus handover!";
        suggestedQuery = 'Calculator';
      } else if (lower.includes('cycle') || lower.includes('bike')) {
        fallbackText = "Student bicycles are listed under Cycles & Mobility (typically ₹1,500–₹3,500). Be sure to check brakes and tires before paying.";
        suggestedQuery = 'Cycle';
      } else if (lower.includes('safe') || lower.includes('handover') || lower.includes('meetup')) {
        fallbackText = "Always meet during daylight at public campus zones like the Central Library or Student Activity Center. Never pay online in advance!";
        suggestedAction = 'view_handover_zones';
      } else if (lower.includes('sell') || lower.includes('post')) {
        fallbackText = "Click 'Sell an Item' at the top of the page to list your pre-owned college essentials with our AI Listing Assistant.";
        suggestedAction = 'post_listing';
      } else if (lower.includes('bargain') || lower.includes('offer')) {
        fallbackText = "You can make offers directly on any listing. Polite offers 10–20% below asking price with fast pickup work best!";
      }

      const fallbackMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        role: 'model',
        content: fallbackText,
        suggestedAction,
        suggestedQuery,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([initialGreeting]);
  };

  const handleActionClick = (action: string, query?: string | null) => {
    if (action === 'browse_marketplace') {
      onNavigate('marketplace', query || undefined);
      setIsOpen(false);
    } else if (action === 'post_listing') {
      onNavigate('create-listing');
      setIsOpen(false);
    } else if (action === 'post_wanted') {
      onNavigate('wanted');
      setIsOpen(false);
    } else if (action === 'view_handover_zones') {
      if (onOpenHandoverModal) {
        onOpenHandoverModal();
      } else {
        onNavigate('marketplace');
      }
      setIsOpen(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Floating Chat Window */}
      {isOpen && (
        <div className="w-[360px] sm:w-[390px] h-[520px] max-h-[80vh] bg-white rounded-3xl shadow-2xl border border-stone-200/90 overflow-hidden flex flex-col mb-3 animate-in slide-in-from-bottom-5 duration-200">
          
          {/* Header */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-stone-900 via-stone-800 to-purple-950 text-white flex items-center justify-between border-b border-stone-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 to-amber-400 p-0.5 flex items-center justify-center shadow-xs">
                <div className="w-full h-full bg-stone-900 rounded-[10px] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm tracking-tight text-white">Ask AI</h3>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/30 uppercase tracking-wider">
                    UniHut Assistant
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-stone-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Campus info only • Gemini</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleClearChat}
                title="Restart Chat"
                aria-label="Restart Ask AI conversation"
                className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close Ask AI"
                aria-label="Close Ask AI assistant"
                className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scope notice banner */}
          <div className="px-3.5 py-1.5 bg-stone-50 border-b border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
            <div className="flex items-center gap-1.5 truncate">
              <Info className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span className="truncate">Specialized strictly for UniHut student marketplace</span>
            </div>
            <span className="text-[10px] font-semibold text-stone-400 shrink-0">₹ INR</span>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3.5 bg-stone-50/40">
            {messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-6 h-6 rounded-lg bg-stone-900 text-amber-300 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div className={`space-y-1.5 max-w-[82%]`}>
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed ${
                        isUser
                          ? 'bg-gradient-to-r from-stone-900 to-stone-800 text-white rounded-br-xs shadow-xs'
                          : 'bg-white border border-stone-200/90 text-stone-800 rounded-bl-xs shadow-xs'
                      }`}
                    >
                      <p className="whitespace-pre-line">{m.content}</p>
                    </div>

                    {/* Interactive Suggested Action Button if provided */}
                    {!isUser && m.suggestedAction && (
                      <div className="pt-0.5">
                        <button
                          type="button"
                          onClick={() => handleActionClick(m.suggestedAction!, m.suggestedQuery)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
                        >
                          {m.suggestedAction === 'browse_marketplace' && (
                            <>
                              <Search className="w-3 h-3 text-purple-600" />
                              <span>{m.suggestedQuery ? `Search "${m.suggestedQuery}"` : 'Browse Marketplace'}</span>
                            </>
                          )}
                          {m.suggestedAction === 'post_listing' && (
                            <>
                              <PlusCircle className="w-3 h-3 text-purple-600" />
                              <span>Sell an Item on Campus</span>
                            </>
                          )}
                          {m.suggestedAction === 'post_wanted' && (
                            <>
                              <Megaphone className="w-3 h-3 text-purple-600" />
                              <span>Post Wanted Request</span>
                            </>
                          )}
                          {m.suggestedAction === 'view_handover_zones' && (
                            <>
                              <ShieldCheck className="w-3 h-3 text-purple-600" />
                              <span>View Safe Campus Zones</span>
                            </>
                          )}
                          <ArrowRight className="w-3 h-3 ml-0.5 text-purple-400" />
                        </button>
                      </div>
                    )}

                    <span
                      className={`text-[9px] text-stone-400 block px-1 ${
                        isUser ? 'text-right' : 'text-left'
                      }`}
                    >
                      {m.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {loading && (
              <div className="flex gap-2.5 items-center">
                <div className="w-6 h-6 rounded-lg bg-stone-900 text-amber-300 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="px-3.5 py-2.5 bg-white border border-stone-200 rounded-2xl text-xs text-stone-500 flex items-center gap-2 shadow-2xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                  <span>Ask AI is checking campus info...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggested Prompt Chips (shows if few messages) */}
          {messages.length <= 2 && !loading && (
            <div className="px-3 py-2 bg-white border-t border-stone-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {STARTER_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  className="px-2.5 py-1 rounded-full bg-stone-100 hover:bg-purple-50 hover:text-purple-700 text-stone-600 text-[10px] font-semibold whitespace-nowrap border border-stone-200/80 transition-colors cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-stone-200 flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask about items, bargaining, safety..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={loading}
              className="flex-1 px-3 py-2 text-xs bg-stone-100 focus:bg-white border border-stone-200 focus:border-purple-500 rounded-xl outline-none transition-all placeholder:text-stone-400"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || loading}
              className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-40 disabled:hover:bg-stone-900 text-white transition-all cursor-pointer shrink-0 shadow-xs active:scale-95"
              title="Send message"
              aria-label="Send message to Ask AI"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Launcher Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="group relative flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-stone-900 via-stone-800 to-purple-950 text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white/20 ring-4 ring-purple-500/10"
        title="Ask AI - UniHut Campus Marketplace Assistant"
        aria-label="Open Ask AI campus assistant"
      >
        {/* Glow effect behind */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#A855F7] via-[#E45A8D] to-[#FF6B1A] rounded-full blur-xs opacity-70 group-hover:opacity-100 transition-opacity -z-10" />

        <div className="relative w-6 h-6 rounded-full bg-gradient-to-tr from-amber-400 to-pink-500 flex items-center justify-center p-0.5">
          <div className="w-full h-full bg-stone-950 rounded-full flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
          </div>
        </div>

        <span className="font-extrabold text-xs tracking-wide">Ask AI</span>

        {/* Pulse badge */}
        {!isOpen && !hasInteracted && (
          <span className="relative flex h-2 w-2 ml-0.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
          </span>
        )}

        {isOpen && <ChevronDown className="w-3.5 h-3.5 text-stone-400 ml-0.5" />}
      </button>
    </div>
  );
};
