'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import {
    Radio, Eye, Calendar, Clock, ThumbsUp,
    Send, ChevronRight, ArrowLeft, Share2, Bell,
    WifiOff, PlayCircle, MessageSquare, Wifi
} from 'lucide-react';

// ─── Countdown Timer ─────────────────────────────────────────────────────────
function Countdown({ targetDate }) {
    const [timeLeft, setTimeLeft] = useState({});

    const calculate = useCallback(() => {
        const diff = new Date(targetDate) - new Date();
        if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        return {
            days: Math.floor(diff / 86400000),
            hours: Math.floor((diff % 86400000) / 3600000),
            minutes: Math.floor((diff % 3600000) / 60000),
            seconds: Math.floor((diff % 60000) / 1000),
        };
    }, [targetDate]);

    useEffect(() => {
        setTimeLeft(calculate());
        const t = setInterval(() => setTimeLeft(calculate()), 1000);
        return () => clearInterval(t);
    }, [calculate]);

    return (
        <div className="flex gap-4 justify-center">
            {[{ label: 'Days', value: timeLeft.days }, { label: 'Hours', value: timeLeft.hours },
              { label: 'Minutes', value: timeLeft.minutes }, { label: 'Seconds', value: timeLeft.seconds }]
              .map(({ label, value }) => (
                <div key={label} className="flex flex-col items-center">
                    <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
                        <span className="text-3xl font-bold text-white tabular-nums">{String(value ?? 0).padStart(2, '0')}</span>
                    </div>
                    <span className="text-xs text-white/60 font-medium mt-2 uppercase tracking-wider">{label}</span>
                </div>
            ))}
        </div>
    );
}

// ─── Floating Reaction Burst ──────────────────────────────────────────────────
function FloatingBurst({ bursts }) {
    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {bursts.map(b => (
                <span
                    key={b.id}
                    className="absolute text-2xl animate-float-up"
                    style={{ left: b.x + '%', bottom: '0', animationDelay: b.delay + 's' }}
                >
                    {b.emoji}
                </span>
            ))}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LivePage() {
    const [stream, setStream] = useState(null);
    const [loading, setLoading] = useState(true);
    const [embedError, setEmbedError] = useState(false);

    // Shared real-time state (from SSE)
    const [messages, setMessages] = useState([]);
    const [reactions, setReactions] = useState({ fire: 0, heart: 0, clap: 0, idea: 0 });
    const [connected, setConnected] = useState(false);

    // Local UI state
    const [bursts, setBursts] = useState([]);        // floating emojis animation
    const [question, setQuestion] = useState('');
    const [questionName, setQuestionName] = useState('');
    const [sending, setSending] = useState(false);
    const [upvotedIds, setUpvotedIds] = useState(new Set()); // prevent double upvote

    const messagesEndRef = useRef(null);
    const pollRef = useRef(null);
    const eventSourceRef = useRef(null);

    // ── Fetch stream info ──────────────────────────────────────
    const fetchStream = useCallback(async () => {
        try {
            const res = await fetch('/api/livestream', { cache: 'no-store' });
            const data = await res.json();
            if (data.success) setStream(data.data);
        } catch (_) {}
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        fetchStream();
        pollRef.current = setInterval(fetchStream, 30000);
        return () => clearInterval(pollRef.current);
    }, [fetchStream]);

    // ── SSE: connect for real-time messages + reactions ─────────
    useEffect(() => {
        const es = new EventSource('/api/livestream/events');
        eventSourceRef.current = es;

        es.onopen = () => setConnected(true);
        es.onerror = () => setConnected(false);

        es.onmessage = (e) => {
            try {
                const payload = JSON.parse(e.data);
                if (payload.type === 'connected') { setConnected(true); return; }
                if (payload.type === 'update') {
                    setMessages(payload.messages || []);
                    setReactions(payload.reactions || { fire: 0, heart: 0, clap: 0, idea: 0 });
                }
            } catch (_) {}
        };

        return () => { es.close(); setConnected(false); };
    }, []);

    // Auto-scroll messages to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ── Detect YouTube embed block ─────────────────────────────
    useEffect(() => {
        const handleMessage = (e) => {
            if (!e.origin.includes('youtube.com')) return;
            try {
                const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
                if (data?.event === 'onError' || data?.info === 101 || data?.info === 150) {
                    setEmbedError(true);
                }
            } catch (_) {}
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    // ── Reaction: fire to server + animate locally ─────────────
    const handleReaction = async (emoji, key) => {
        // Optimistic local burst animation
        const id = Date.now() + Math.random();
        setBursts(prev => [...prev.slice(-10), { id, emoji, x: 20 + Math.random() * 60, delay: Math.random() * 0.2 }]);
        setTimeout(() => setBursts(prev => prev.filter(b => b.id !== id)), 2600);

        // Persist to server (all viewers see via SSE)
        try {
            await fetch('/api/livestream/reactions', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reaction: key }),
            });
        } catch (_) {}
    };

    // ── Submit Q&A message ─────────────────────────────────────
    const submitQuestion = async (e) => {
        e.preventDefault();
        if (!question.trim() || sending) return;
        setSending(true);
        try {
            await fetch('/api/livestream/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: questionName.trim(), text: question.trim() }),
            });
            setQuestion('');
        } catch (_) {
            alert('Failed to send message. Try again.');
        } finally {
            setSending(false);
        }
    };

    // ── Upvote a message ───────────────────────────────────────
    const upvoteMessage = async (id) => {
        if (upvotedIds.has(id)) return; // already upvoted
        setUpvotedIds(prev => new Set([...prev, id]));
        try {
            await fetch('/api/livestream/messages', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
        } catch (_) {}
    };

    const share = () => {
        if (navigator.share) {
            navigator.share({ title: stream?.title || 'Live Stream', url: window.location.href });
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('Link copied!');
        }
    };

    // ─── Loading ──────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-400 text-sm font-medium">Loading stream...</p>
                </div>
            </div>
        );
    }

    // ─── No stream ────────────────────────────────────────────
    if (!stream) {
        return (
            <div className="min-h-screen bg-gray-950">
                <Navbar />
                <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-6">
                    <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-6">
                        <WifiOff size={36} className="text-gray-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-3">No Stream Yet</h1>
                    <p className="text-gray-400 max-w-md mb-8">No live stream is set up. Check back soon!</p>
                    <Link href="/" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors">Back to Home</Link>
                </div>
            </div>
        );
    }

    // ─── Scheduled ───────────────────────────────────────────
    if (stream.status === 'scheduled') {
        return (
            <div className="min-h-screen bg-gray-950">
                <Navbar />
                <div className="flex flex-col items-center justify-center min-h-[85vh] text-center px-6">
                    <div className="relative mb-8">
                        <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/20">
                            <Calendar size={40} className="text-amber-400" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                            <Clock size={13} className="text-white" />
                        </div>
                    </div>
                    <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-4 py-1.5 rounded-full text-amber-400 text-sm font-bold mb-4 uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" /> Stream Scheduled
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 max-w-2xl">{stream.title}</h1>
                    {stream.description && <p className="text-gray-400 text-lg max-w-xl mb-10">{stream.description}</p>}
                    {stream.scheduledAt && (
                        <>
                            <p className="text-gray-500 text-sm mb-6">Starts in</p>
                            <Countdown targetDate={stream.scheduledAt} />
                            <p className="text-gray-400 mt-6 text-sm">📅 {new Date(stream.scheduledAt).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}</p>
                        </>
                    )}
                    <div className="flex gap-3 mt-10">
                        <button onClick={share} className="flex items-center gap-2 bg-white/10 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-white/20 transition-colors">
                            <Share2 size={15} /> Share
                        </button>
                        <Link href="/#subscribe" className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors">
                            <Bell size={15} /> Get Notified
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // ─── Offline / Ended ──────────────────────────────────────
    if (stream.status === 'offline' || stream.status === 'ended') {
        return (
            <div className="min-h-screen bg-gray-950">
                <Navbar />
                <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-6">
                    <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-6">
                        {stream.status === 'ended' ? <PlayCircle size={36} className="text-gray-400" /> : <WifiOff size={36} className="text-gray-500" />}
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-3">{stream.status === 'ended' ? 'Stream Ended' : 'Stream Offline'}</h1>
                    <p className="text-gray-400 max-w-md mb-3">
                        {stream.status === 'ended' ? `"${stream.title}" has ended. The replay may be available on YouTube.` : 'No live stream is happening right now. Check back soon!'}
                    </p>
                    {stream.status === 'ended' && stream.youtubeVideoId && (
                        <a href={`https://www.youtube.com/watch?v=${stream.youtubeVideoId}`} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-red-700 transition-colors mt-4">
                            <PlayCircle size={16} /> Watch Replay on YouTube
                        </a>
                    )}
                    <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm font-medium mt-6 inline-flex items-center gap-1">
                        <ArrowLeft size={14} /> Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    // ─── LIVE ─────────────────────────────────────────────────
    const REACTION_LIST = [
        { emoji: '🔥', key: 'fire', label: 'Fire' },
        { emoji: '❤️', key: 'heart', label: 'Love' },
        { emoji: '🙌', key: 'clap', label: 'Clap' },
        { emoji: '💡', key: 'idea', label: 'Idea' },
    ];

    const totalReactions = Object.values(reactions).reduce((a, b) => a + b, 0);

    return (
        <div className="min-h-screen bg-gray-950">
            <style>{`
                @keyframes floatUp {
                    0%   { transform: translateY(0) scale(1);   opacity: 1; }
                    100% { transform: translateY(-130px) scale(1.5); opacity: 0; }
                }
                .animate-float-up { animation: floatUp 2.5s ease-out forwards; }
            `}</style>

            <Navbar />

            <div className="max-w-screen-xl mx-auto px-4 py-6">
                {/* Header bar */}
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-full text-sm font-bold">
                            <Radio size={14} className="animate-pulse" /> LIVE NOW
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-400 text-sm font-medium">
                            <Eye size={14} />
                            <span>{stream.viewerCount?.toLocaleString() || '—'} watching</span>
                        </div>
                        {/* SSE connection dot */}
                        <div className={`flex items-center gap-1.5 text-xs font-medium ${connected ? 'text-green-400' : 'text-gray-600'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
                            {connected ? 'Live updates on' : 'Connecting...'}
                        </div>
                    </div>
                    <button onClick={share} className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-white/20 transition-colors">
                        <Share2 size={14} /> Share
                    </button>
                </div>

                {/* Main layout */}
                <div className="flex flex-col lg:flex-row gap-6">

                    {/* ── LEFT: Player + Reactions ── */}
                    <div className="flex-1 min-w-0 space-y-5">

                        {/* YouTube Player */}
                        <div className="rounded-2xl overflow-hidden bg-black shadow-2xl shadow-red-900/20">
                            <div className="aspect-video w-full relative">
                                {!embedError ? (
                                    <iframe
                                        key={stream.youtubeVideoId}
                                        src={`https://www.youtube.com/embed/${stream.youtubeVideoId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`}
                                        title={stream.title}
                                        className="w-full h-full"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        allowFullScreen
                                        onError={() => setEmbedError(true)}
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 bg-gray-900">
                                        <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mb-4">
                                            <PlayCircle size={32} className="text-red-400" />
                                        </div>
                                        <p className="text-white font-bold text-lg mb-2">Embedding Disabled</p>
                                        <p className="text-gray-400 text-sm mb-6 max-w-xs">The stream owner has disabled playback on external websites. Watch directly on YouTube.</p>
                                        <a href={`https://www.youtube.com/watch?v=${stream.youtubeVideoId}`} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold transition-colors">
                                            <PlayCircle size={18} /> Watch Live on YouTube
                                        </a>
                                    </div>
                                )}
                            </div>
                            {!embedError && (
                                <div className="bg-gray-950 px-4 py-2 flex items-center justify-between">
                                    <span className="text-xs text-gray-600">Having trouble seeing the video?</span>
                                    <a href={`https://www.youtube.com/watch?v=${stream.youtubeVideoId}`} target="_blank" rel="noopener noreferrer"
                                        className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1">
                                        <PlayCircle size={12} /> Watch on YouTube
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Stream Info */}
                        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
                            <h1 className="text-xl font-bold text-white mb-2">{stream.title}</h1>
                            {stream.description && <p className="text-gray-400 text-sm leading-relaxed">{stream.description}</p>}
                            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-800">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">L</div>
                                    <span className="text-sm font-semibold text-white">LearnMade</span>
                                </div>
                                <a href={`https://www.youtube.com/watch?v=${stream.youtubeVideoId}`} target="_blank" rel="noopener noreferrer"
                                    className="ml-auto text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1">
                                    Open on YouTube <ChevronRight size={13} />
                                </a>
                            </div>
                        </div>

                        {/* ── Shared Reactions ── */}
                        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Live Reactions</p>
                                {totalReactions > 0 && (
                                    <span className="text-xs text-gray-600 font-medium">{totalReactions.toLocaleString()} total</span>
                                )}
                            </div>
                            <div className="relative">
                                {/* Floating bursts */}
                                <div className="relative h-2 mb-3">
                                    <FloatingBurst bursts={bursts} />
                                </div>
                                <div className="flex gap-3 flex-wrap">
                                    {REACTION_LIST.map(({ emoji, key, label }) => (
                                        <button
                                            key={key}
                                            onClick={() => handleReaction(emoji, key)}
                                            className="group flex flex-col items-center gap-1.5 px-5 py-3 bg-gray-800 hover:bg-gray-700 active:scale-90 rounded-2xl transition-all duration-150 border border-gray-700 hover:border-gray-500 min-w-[72px]"
                                        >
                                            <span className="text-2xl group-hover:scale-125 transition-transform duration-150">{emoji}</span>
                                            <span className="text-xs font-bold text-gray-400 tabular-nums">
                                                {reactions[key] > 0 ? reactions[key].toLocaleString() : label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── RIGHT: Chat + Q&A ── */}
                    <div className="lg:w-[420px] shrink-0 space-y-5">

                        {/* YouTube Live Chat */}
                        {stream.chatEnabled && stream.youtubeVideoId && (
                            <div className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 shadow-xl">
                                <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800">
                                    <Wifi size={15} className="text-blue-400" />
                                    <span className="text-sm font-bold text-white">YouTube Live Chat</span>
                                    <div className="ml-auto flex items-center gap-1.5 bg-red-600/20 border border-red-600/30 px-2 py-0.5 rounded-full">
                                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                                        <span className="text-[10px] font-bold text-red-400 uppercase">Live</span>
                                    </div>
                                </div>
                                <div className="h-72">
                                    <iframe
                                        src={`https://www.youtube.com/live_chat?v=${stream.youtubeVideoId}&embed_domain=${typeof window !== 'undefined' ? window.location.hostname : 'courses.learnmade.in'}`}
                                        title="Live Chat"
                                        className="w-full h-full"
                                        allow="autoplay"
                                    />
                                </div>
                            </div>
                        )}

                        {/* ── Shared Q&A Panel ── */}
                        <div className="bg-gray-900 rounded-2xl border border-gray-800 flex flex-col" style={{ maxHeight: '600px' }}>
                            {/* Header */}
                            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-800 shrink-0">
                                <MessageSquare size={16} className="text-blue-400" />
                                <h2 className="font-bold text-white text-sm">Q&amp;A — Everyone sees this</h2>
                                <span className="ml-auto text-xs text-gray-600 font-medium">{messages.length} messages</span>
                                {connected && (
                                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" title="Live updates active" />
                                )}
                            </div>

                            {/* Messages list */}
                            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 min-h-0">
                                {messages.length === 0 ? (
                                    <div className="text-center py-12 text-gray-600 text-sm">
                                        <MessageSquare size={28} className="mx-auto mb-3 opacity-20" />
                                        <p>No messages yet.</p>
                                        <p className="text-xs mt-1 opacity-70">Be the first to ask something!</p>
                                    </div>
                                ) : (
                                    messages.map((msg) => {
                                        const alreadyUpvoted = upvotedIds.has(msg._id);
                                        return (
                                            <div key={msg._id} className="flex items-start gap-2.5 group">
                                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5">
                                                    {msg.name?.[0]?.toUpperCase() || 'A'}
                                                </div>
                                                <div className="flex-1 min-w-0 bg-gray-800/60 rounded-xl px-3 py-2">
                                                    <p className="text-[11px] font-bold text-blue-400 mb-0.5">{msg.name || 'Anonymous'}</p>
                                                    <p className="text-sm text-gray-200 leading-relaxed break-words">{msg.text}</p>
                                                </div>
                                                <button
                                                    onClick={() => upvoteMessage(msg._id)}
                                                    disabled={alreadyUpvoted}
                                                    className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all shrink-0 ${
                                                        alreadyUpvoted
                                                            ? 'bg-blue-600/20 text-blue-400 cursor-default'
                                                            : 'bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white'
                                                    }`}
                                                    title={alreadyUpvoted ? 'Already upvoted' : 'Upvote'}
                                                >
                                                    <ThumbsUp size={12} />
                                                    <span className="text-[10px] font-bold">{msg.upvotes}</span>
                                                </button>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Submit form */}
                            <form onSubmit={submitQuestion} className="px-4 py-4 border-t border-gray-800 space-y-2.5 shrink-0">
                                <input
                                    value={questionName}
                                    onChange={e => setQuestionName(e.target.value)}
                                    placeholder="Your name (optional)"
                                    maxLength={50}
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                                />
                                <div className="flex gap-2">
                                    <input
                                        value={question}
                                        onChange={e => setQuestion(e.target.value)}
                                        placeholder="Ask a question — all viewers will see it..."
                                        maxLength={500}
                                        className="flex-1 px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!question.trim() || sending}
                                        className="px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
                                    >
                                        {sending ? (
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <Send size={14} />
                                        )}
                                    </button>
                                </div>
                                <p className="text-[10px] text-gray-600 text-center">
                                    💬 All viewers see your message in real time
                                </p>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
