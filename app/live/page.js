'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import {
    Radio, Eye, Calendar, Clock, Heart, Flame, ThumbsUp,
    Lightbulb, Send, ChevronRight, ArrowLeft, Share2, Bell,
    Wifi, WifiOff, PlayCircle, MessageSquare
} from 'lucide-react';

// ─── Countdown Timer ───────────────────────────────────────────────────────
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
            {[
                { label: 'Days', value: timeLeft.days },
                { label: 'Hours', value: timeLeft.hours },
                { label: 'Minutes', value: timeLeft.minutes },
                { label: 'Seconds', value: timeLeft.seconds },
            ].map(({ label, value }) => (
                <div key={label} className="flex flex-col items-center">
                    <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
                        <span className="text-3xl font-bold text-white tabular-nums">
                            {String(value ?? 0).padStart(2, '0')}
                        </span>
                    </div>
                    <span className="text-xs text-white/60 font-medium mt-2 uppercase tracking-wider">{label}</span>
                </div>
            ))}
        </div>
    );
}

// ─── Floating Reaction ─────────────────────────────────────────────────────
function FloatingReaction({ emoji, id }) {
    return (
        <div
            key={id}
            className="pointer-events-none absolute bottom-0 text-2xl animate-float-up"
            style={{
                left: `${20 + Math.random() * 60}%`,
                animationDelay: `${Math.random() * 0.3}s`,
            }}
        >
            {emoji}
        </div>
    );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function LivePage() {
    const [stream, setStream] = useState(null);
    const [loading, setLoading] = useState(true);
    const [embedError, setEmbedError] = useState(false);
    const [reactions, setReactions] = useState([]);
    const [reactionCounts, setReactionCounts] = useState({ '🔥': 0, '❤️': 0, '🙌': 0, '💡': 0 });
    const [question, setQuestion] = useState('');
    const [questions, setQuestions] = useState([]);
    const [questionName, setQuestionName] = useState('');
    const reactionsRef = useRef(null);
    const pollRef = useRef(null);

    const fetchStream = useCallback(async () => {
        try {
            const res = await fetch('/api/livestream', { cache: 'no-store' });
            const data = await res.json();
            if (data.success) setStream(data.data);
        } catch (e) { /* silent */ }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        fetchStream();
        // Poll every 30 seconds to detect status changes
        pollRef.current = setInterval(fetchStream, 30000);
        return () => clearInterval(pollRef.current);
    }, [fetchStream]);

    // Detect YouTube embed blocked via postMessage
    useEffect(() => {
        const handleMessage = (e) => {
            if (!e.origin.includes('youtube.com')) return;
            try {
                const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
                // YouTube sends this when video is blocked from embedding
                if (data?.event === 'onError' || data?.info === 101 || data?.info === 150) {
                    setEmbedError(true);
                }
            } catch (_) {}
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const addReaction = (emoji) => {
        const id = Date.now() + Math.random();
        setReactions(prev => [...prev.slice(-8), { emoji, id }]);
        setReactionCounts(prev => ({ ...prev, [emoji]: prev[emoji] + 1 }));
        setTimeout(() => setReactions(prev => prev.filter(r => r.id !== id)), 2500);
    };

    const submitQuestion = (e) => {
        e.preventDefault();
        if (!question.trim()) return;
        setQuestions(prev => [
            { text: question.trim(), name: questionName.trim() || 'Anonymous', id: Date.now(), upvotes: 0 },
            ...prev,
        ]);
        setQuestion('');
    };

    const upvoteQuestion = (id) => {
        setQuestions(prev => prev.map(q => q.id === id ? { ...q, upvotes: q.upvotes + 1 } : q));
    };

    const share = () => {
        if (navigator.share) {
            navigator.share({ title: stream?.title || 'Live Stream', url: window.location.href });
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('Link copied!');
        }
    };

    // ─── Loading ─────────────────────────────────────────────
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

    // ─── No stream configured ─────────────────────────────────
    if (!stream) {
        return (
            <div className="min-h-screen bg-gray-950">
                <Navbar />
                <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-6">
                    <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-6">
                        <WifiOff size={36} className="text-gray-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-3">No Stream Yet</h1>
                    <p className="text-gray-400 max-w-md mb-8">There's no live stream set up. Check back soon or subscribe to be notified when we go live.</p>
                    <Link href="/" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors">
                        Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    // ─── Scheduled State ──────────────────────────────────────
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
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        Stream Scheduled
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 max-w-2xl">{stream.title}</h1>
                    {stream.description && (
                        <p className="text-gray-400 text-lg max-w-xl mb-10">{stream.description}</p>
                    )}
                    {stream.scheduledAt && (
                        <>
                            <p className="text-gray-500 text-sm mb-6">Starts in</p>
                            <Countdown targetDate={stream.scheduledAt} />
                            <p className="text-gray-400 mt-6 text-sm">
                                📅 {new Date(stream.scheduledAt).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}
                            </p>
                        </>
                    )}
                    <div className="flex gap-3 mt-10">
                        <button
                            onClick={share}
                            className="flex items-center gap-2 bg-white/10 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-white/20 transition-colors"
                        >
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

    // ─── Offline / Ended State ────────────────────────────────
    if (stream.status === 'offline' || stream.status === 'ended') {
        return (
            <div className="min-h-screen bg-gray-950">
                <Navbar />
                <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-6">
                    <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-6">
                        {stream.status === 'ended' ? (
                            <PlayCircle size={36} className="text-gray-400" />
                        ) : (
                            <WifiOff size={36} className="text-gray-500" />
                        )}
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-3">
                        {stream.status === 'ended' ? 'Stream Ended' : 'Stream Offline'}
                    </h1>
                    <p className="text-gray-400 max-w-md mb-3">
                        {stream.status === 'ended'
                            ? `"${stream.title}" has ended. The replay may be available on YouTube.`
                            : 'No live stream is happening right now. Check back soon!'}
                    </p>
                    {stream.status === 'ended' && stream.youtubeVideoId && (
                        <a
                            href={`https://www.youtube.com/watch?v=${stream.youtubeVideoId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-red-700 transition-colors mt-4"
                        >
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

    // ─── LIVE State ───────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gray-950">
            <style>{`
                @keyframes floatUp {
                    0% { transform: translateY(0) scale(1); opacity: 1; }
                    100% { transform: translateY(-120px) scale(1.4); opacity: 0; }
                }
                .animate-float-up { animation: floatUp 2.5s ease-out forwards; }
            `}</style>

            <Navbar />

            <div className="max-w-screen-xl mx-auto px-4 py-6">
                {/* LIVE Badge Header */}
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-full text-sm font-bold">
                            <Radio size={14} className="animate-pulse" />
                            LIVE NOW
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-400 text-sm font-medium">
                            <Eye size={14} />
                            <span>{stream.viewerCount?.toLocaleString() || '—'} watching</span>
                        </div>
                    </div>
                    <button
                        onClick={share}
                        className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-white/20 transition-colors"
                    >
                        <Share2 size={14} /> Share
                    </button>
                </div>

                {/* Main layout: Player + Chat */}
                <div className="flex flex-col lg:flex-row gap-6">

                    {/* ── Left: Player + Info + Reactions + Q&A ── */}
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
                                    // Fallback when embedding is disabled
                                    <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 bg-gray-900">
                                        <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mb-4">
                                            <PlayCircle size={32} className="text-red-400" />
                                        </div>
                                        <p className="text-white font-bold text-lg mb-2">Embedding Disabled</p>
                                        <p className="text-gray-400 text-sm mb-6 max-w-xs">
                                            The stream owner has disabled playback on external websites. Watch directly on YouTube.
                                        </p>
                                        <a
                                            href={`https://www.youtube.com/watch?v=${stream.youtubeVideoId}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold transition-colors"
                                        >
                                            <PlayCircle size={18} />
                                            Watch Live on YouTube
                                        </a>
                                    </div>
                                )}
                            </div>
                            {/* Always-visible YouTube escape link */}
                            {!embedError && (
                                <div className="bg-gray-950 px-4 py-2 flex items-center justify-between">
                                    <span className="text-xs text-gray-600">Having trouble seeing the video?</span>
                                    <a
                                        href={`https://www.youtube.com/watch?v=${stream.youtubeVideoId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1"
                                    >
                                        <PlayCircle size={12} /> Watch on YouTube
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Stream Title & Description */}
                        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
                            <h1 className="text-xl font-bold text-white mb-2">{stream.title}</h1>
                            {stream.description && (
                                <p className="text-gray-400 text-sm leading-relaxed">{stream.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-800">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">L</div>
                                    <span className="text-sm font-semibold text-white">LearnMade</span>
                                </div>
                                <a
                                    href={`https://www.youtube.com/watch?v=${stream.youtubeVideoId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-auto text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1"
                                >
                                    Open on YouTube <ChevronRight size={13} />
                                </a>
                            </div>
                        </div>

                        {/* Reactions Bar */}
                        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">React to the stream</p>
                            <div className="relative" ref={reactionsRef}>
                                {/* Floating reactions */}
                                <div className="absolute inset-0 pointer-events-none overflow-hidden h-32 -top-32">
                                    {reactions.map(r => <FloatingReaction key={r.id} emoji={r.emoji} id={r.id} />)}
                                </div>
                                <div className="flex gap-3 flex-wrap">
                                    {[
                                        { emoji: '🔥', label: 'Fire' },
                                        { emoji: '❤️', label: 'Love' },
                                        { emoji: '🙌', label: 'Clap' },
                                        { emoji: '💡', label: 'Idea' },
                                    ].map(({ emoji, label }) => (
                                        <button
                                            key={emoji}
                                            onClick={() => addReaction(emoji)}
                                            className="group flex flex-col items-center gap-1.5 px-5 py-3 bg-gray-800 hover:bg-gray-700 active:scale-90 rounded-2xl transition-all duration-150 border border-gray-700 hover:border-gray-500"
                                        >
                                            <span className="text-2xl group-hover:scale-125 transition-transform duration-150">{emoji}</span>
                                            <span className="text-xs text-gray-500 font-medium">{reactionCounts[emoji] > 0 ? reactionCounts[emoji] : label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Q&A Section */}
                        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
                            <div className="flex items-center gap-2 mb-5">
                                <MessageSquare size={18} className="text-blue-400" />
                                <h2 className="font-bold text-white">Q&amp;A</h2>
                                <span className="ml-auto text-xs text-gray-500">{questions.length} questions</span>
                            </div>

                            {/* Submit Question */}
                            <form onSubmit={submitQuestion} className="mb-6 space-y-3">
                                <input
                                    value={questionName}
                                    onChange={e => setQuestionName(e.target.value)}
                                    placeholder="Your name (optional)"
                                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                                />
                                <div className="flex gap-3">
                                    <input
                                        value={question}
                                        onChange={e => setQuestion(e.target.value)}
                                        placeholder="Ask a question..."
                                        className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!question.trim()}
                                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        <Send size={14} />
                                    </button>
                                </div>
                            </form>

                            {/* Questions List */}
                            <div className="space-y-3">
                                {questions.length === 0 ? (
                                    <div className="text-center py-8 text-gray-600 text-sm">
                                        <MessageSquare size={24} className="mx-auto mb-2 opacity-30" />
                                        No questions yet. Be the first to ask!
                                    </div>
                                ) : (
                                    questions.map(q => (
                                        <div key={q.id} className="flex items-start gap-3 p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                                {q.name[0]?.toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-blue-400 mb-1">{q.name}</p>
                                                <p className="text-sm text-gray-200 leading-relaxed">{q.text}</p>
                                            </div>
                                            <button
                                                onClick={() => upvoteQuestion(q.id)}
                                                className="flex flex-col items-center gap-0.5 px-2 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors shrink-0"
                                            >
                                                <ThumbsUp size={13} className="text-gray-300" />
                                                <span className="text-[10px] font-bold text-gray-400">{q.upvotes}</span>
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Right: YouTube Chat ── */}
                    {stream.chatEnabled && stream.youtubeVideoId && (
                        <div className="lg:w-96 shrink-0">
                            <div className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 sticky top-4 shadow-xl">
                                <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800 bg-gray-900">
                                    <MessageSquare size={15} className="text-blue-400" />
                                    <span className="text-sm font-bold text-white">Live Chat</span>
                                    <div className="ml-auto flex items-center gap-1.5 bg-red-600/20 border border-red-600/30 px-2 py-0.5 rounded-full">
                                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                                        <span className="text-[10px] font-bold text-red-400 uppercase">Live</span>
                                    </div>
                                </div>
                                <div className="h-[620px]">
                                    <iframe
                                        src={`https://www.youtube.com/live_chat?v=${stream.youtubeVideoId}&embed_domain=${typeof window !== 'undefined' ? window.location.hostname : 'courses.learnmade.in'}`}
                                        title="Live Chat"
                                        className="w-full h-full"
                                        allow="autoplay"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
