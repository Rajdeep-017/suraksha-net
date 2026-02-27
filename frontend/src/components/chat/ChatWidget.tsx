import { useState, useRef, useEffect, type FormEvent } from 'react';
import { MessageCircle, X, Send, Loader2, Navigation, Bot, User } from 'lucide-react';
import { apiClient } from '../../api/client';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    route?: { origin: string; destination: string } | null;
}

// Format assistant replies: strip ```route blocks, convert markdown-ish bullets
function formatReply(text: string): string {
    return text.replace(/```route\s*\n{[\s\S]*?}\s*\n```/g, '').trim();
}

export default function ChatWidget() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content:
                "Hi! I'm **Suraksha**, your AI road safety assistant. Ask me about:\n\n• Safe driving tips\n• Pune accident patterns\n• Route queries (e.g. *\"safest route from Hinjewadi to Kothrud\"*)",
        },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, open]);

    useEffect(() => {
        if (open && inputRef.current) inputRef.current.focus();
    }, [open]);

    const sendMessage = async (e?: FormEvent) => {
        e?.preventDefault();
        const text = input.trim();
        if (!text || loading) return;

        const userMsg: Message = { role: 'user', content: text };
        const updated = [...messages, userMsg];
        setMessages(updated);
        setInput('');
        setLoading(true);

        try {
            const historyForApi = updated
                .filter((m) => m.role === 'user' || m.role === 'assistant')
                .map((m) => ({ role: m.role, content: m.content }));

            // Keep only last 10 messages to stay within context limits
            const trimmed = historyForApi.slice(-10);

            const res = await apiClient.post('/api/chat', { messages: trimmed });
            const { reply, route } = res.data;

            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: reply, route },
            ]);
        } catch (err: any) {
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content:
                        err?.response?.data?.detail ||
                        'Sorry, something went wrong. Please try again.',
                },
            ]);
        }
        setLoading(false);
    };

    const handleRouteClick = (route: { origin: string; destination: string }) => {
        // Navigate to driver page with query params for the route
        window.location.href = `/driver?origin=${encodeURIComponent(route.origin)}&destination=${encodeURIComponent(route.destination)}`;
    };

    return (
        <>
            {/* ── Floating button ─────────────────────────────────── */}
            {!open && (
                <button
                    onClick={() => setOpen(true)}
                    className="fixed bottom-6 right-6 z-50 bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-2xl shadow-2xl shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
                    aria-label="Open chat"
                >
                    <MessageCircle size={24} />
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
                </button>
            )}

            {/* ── Chat panel ──────────────────────────────────────── */}
            {open && (
                <div className="fixed bottom-6 right-6 z-50 w-[400px] h-[560px] bg-[#0b0f1a] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#0d1220]">
                        <div className="flex items-center gap-2.5">
                            <div className="bg-emerald-500 p-1.5 rounded-lg">
                                <Bot size={16} className="text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white">Suraksha AI</p>
                                <p className="text-[10px] text-emerald-400 font-medium">Road Safety Assistant</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setOpen(false)}
                            className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div
                                    className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${msg.role === 'user' ? 'bg-blue-500/15' : 'bg-emerald-500/15'
                                        }`}
                                >
                                    {msg.role === 'user' ? (
                                        <User size={13} className="text-blue-400" />
                                    ) : (
                                        <Bot size={13} className="text-emerald-400" />
                                    )}
                                </div>
                                <div
                                    className={`max-w-[85%] rounded-xl px-3 py-2.5 text-[13px] leading-relaxed ${msg.role === 'user'
                                            ? 'bg-blue-600/15 text-blue-100 border border-blue-500/10'
                                            : 'bg-slate-800/60 text-slate-300 border border-white/5'
                                        }`}
                                >
                                    <MessageContent text={formatReply(msg.content)} />

                                    {/* Route action button */}
                                    {msg.route && (
                                        <button
                                            onClick={() => handleRouteClick(msg.route!)}
                                            className="mt-2 w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold py-2 rounded-lg transition-all"
                                        >
                                            <Navigation size={12} />
                                            Navigate: {msg.route.origin} → {msg.route.destination}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex gap-2.5">
                                <div className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center bg-emerald-500/15">
                                    <Bot size={13} className="text-emerald-400" />
                                </div>
                                <div className="bg-slate-800/60 border border-white/5 rounded-xl px-4 py-3">
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <Loader2 size={12} className="animate-spin" />
                                        Thinking...
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <form
                        onSubmit={sendMessage}
                        className="shrink-0 border-t border-white/5 px-3 py-3 flex items-center gap-2 bg-[#0d1220]"
                    >
                        <input
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={loading}
                            placeholder="Ask about road safety..."
                            className="flex-1 bg-slate-800 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white p-2.5 rounded-xl transition-all"
                        >
                            <Send size={14} />
                        </button>
                    </form>
                </div>
            )}
        </>
    );
}

// ── Simple Markdown-like renderer ────────────────────────────
function MessageContent({ text }: { text: string }) {
    const lines = text.split('\n');
    return (
        <div className="space-y-1">
            {lines.map((line, i) => {
                if (!line.trim()) return <div key={i} className="h-1" />;

                // Bold
                let processed = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>');
                // Italic
                processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');
                // Bullets
                const isBullet = /^[\-•]\s/.test(processed.trim());
                if (isBullet) {
                    processed = processed.replace(/^[\-•]\s*/, '');
                    return (
                        <div key={i} className="flex gap-1.5 items-start ml-1">
                            <span className="text-emerald-400 mt-1 shrink-0">•</span>
                            <span dangerouslySetInnerHTML={{ __html: processed }} />
                        </div>
                    );
                }

                return <p key={i} dangerouslySetInnerHTML={{ __html: processed }} />;
            })}
        </div>
    );
}
