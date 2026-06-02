'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/Navbar';
import {
    Radio, Eye, Calendar, Clock, ThumbsUp,
    Send, ChevronRight, ArrowLeft, Share2, Bell,
    WifiOff, PlayCircle, MessageSquare, Wifi, Users, Star
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
    const { data: session } = useSession();
    
    const [stream, setStream] = useState(null);
    const [loading, setLoading] = useState(true);
    const [embedError, setEmbedError] = useState(false);

    // Follower State
    const [followersCount, setFollowersCount] = useState(0);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isFollowLoading, setIsFollowLoading] = useState(false);

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

    const messagesContainerRef = useRef(null);
    const pollRef = useRef(null);
    const eventSourceRef = useRef(null);

    // ── Fetch stream & follower info ───────────────────────────
    const fetchStream = useCallback(async () => {
        try {
            const res = await fetch('/api/livestream', { cache: 'no-store' });
            const data = await res.json();
            if (data.success) setStream(data.data);
        } catch (_) {}
        finally { setLoading(false); }
    }, []);

    const fetchFollowData = useCallback(async () => {
        try {
            const res = await fetch('/api/follow', { cache: 'no-store' });
            const data = await res.json();
            if (data.success) {
                setFollowersCount(data.data.totalFollowers);
                setIsFollowing(data.data.isFollowing);
            }
        } catch (_) {}
    }, []);

    useEffect(() => {
        fetchStream();
        fetchFollowData();
        pollRef.current = setInterval(fetchStream, 30000);
        return () => clearInterval(pollRef.current);
    }, [fetchStream, fetchFollowData]);

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

    // ── Safe Auto-scroll messages to bottom ─────────────────────
    useEffect(() => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
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
                body: JSON.stringify({ name: questionName.trim() || session?.user?.name || 'Anonymous', text: question.trim() }),
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

    // ── Toggle Follow Status ───────────────────────────────────
    const toggleFollow = async () => {
        if (!session) {
            alert('Please login to follow channels.');
            window.location.href = '/login?callbackUrl=/live';
            return;
        }
        
        setIsFollowLoading(true);
        try {
            const res = await fetch('/api/follow', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                setIsFollowing(data.data.isFollowing);
                setFollowersCount(data.data.totalFollowers);
            }
        } catch (e) {
            console.error('Failed to follow', e);
        } finally {
            setIsFollowLoading(false);
        }
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
            <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-400 text-sm font-medium">Connecting to stream...</p>
                </div>
            </div>
        );
    }

    // ─── No stream ────────────────────────────────────────────
    if (!stream) {
        return (
            <div className="min-h-screen bg-[#09090b]">
                <Navbar />
                <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-6">
                    <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mb-6">
                        <WifiOff size={36} className="text-gray-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-3">No Stream Yet</h1>
                    <p className="text-gray-400 max-w-md mb-8">No live stream is set up. Check back soon!</p>
                    <Link href="/" className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors">Back to Home</Link>
                </div>
            </div>
        );
    }

    // ─── Scheduled ───────────────────────────────────────────
    if (stream.status === 'scheduled') {
        return (
            <div className="min-h-screen bg-[#09090b]">
                <Navbar />
                <div className="flex flex-col items-center justify-center min-h-[85vh] text-center px-6">
                    <div className="relative mb-8">
                        <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center border border-indigo-500/20 shadow-[0_0_40px_rgba(99,102,241,0.2)]">
                            <Calendar size={40} className="text-indigo-400" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                            <Clock size={13} className="text-white" />
                        </div>
                    </div>
                    <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-4 py-1.5 rounded-full text-indigo-400 text-sm font-bold mb-4 uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" /> Stream Scheduled
                    </div>
                    <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 max-w-3xl leading-tight">{stream.title}</h1>
                    {stream.description && <p className="text-gray-400 text-lg max-w-xl mb-10">{stream.description}</p>}
                    {stream.scheduledAt && (
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
                            <p className="text-indigo-300 font-semibold mb-6">STARTS IN</p>
                            <Countdown targetDate={stream.scheduledAt} />
                            <p className="text-gray-400 mt-8 text-sm font-medium">
                                <Calendar className="inline-block w-4 h-4 mr-1.5 mb-0.5" />
                                {new Date(stream.scheduledAt).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}
                            </p>
                        </div>
                    )}
                    <div className="flex gap-3 mt-10">
                        <button onClick={share} className="flex items-center gap-2 bg-white/5 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-white/10 transition-colors border border-white/10">
                            <Share2 size={16} /> Share
                        </button>
                        <button onClick={toggleFollow} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg ${isFollowing ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/20'}`}>
                            {isFollowLoading ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Star size={16} className={isFollowing ? 'fill-current text-yellow-500' : ''} />}
                            {isFollowing ? 'Following' : 'Follow Channel'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ─── Offline / Ended ──────────────────────────────────────
    if (stream.status === 'offline' || stream.status === 'ended') {
        return (
            <div className="min-h-screen bg-[#09090b]">
                <Navbar />
                <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-6">
                    <div className="w-24 h-24 bg-gray-900 border border-gray-800 rounded-3xl flex items-center justify-center mb-6 shadow-2xl">
                        {stream.status === 'ended' ? <PlayCircle size={40} className="text-gray-400" /> : <WifiOff size={40} className="text-gray-500" />}
                    </div>
                    <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">{stream.status === 'ended' ? 'Stream Ended' : 'Stream Offline'}</h1>
                    <p className="text-gray-400 max-w-md mb-3 text-lg">
                        {stream.status === 'ended' ? `"${stream.title}" has ended. The replay may be available on YouTube.` : 'No live stream is happening right now. Check back soon!'}
                    </p>
                    {stream.status === 'ended' && stream.youtubeVideoId && (
                        <a href={`https://www.youtube.com/watch?v=${stream.youtubeVideoId}`} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-red-700 transition-colors mt-6 shadow-lg shadow-red-600/20">
                            <PlayCircle size={18} /> Watch Replay on YouTube
                        </a>
                    )}
                    <Link href="/" className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold mt-8 inline-flex items-center gap-1.5 transition-colors">
                        <ArrowLeft size={16} /> Back to Home
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
        <div className="min-h-screen bg-[#09090b] selection:bg-indigo-500/30">
            <style>{`
                @keyframes floatUp {
                    0%   { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(-150px) scale(1.6) rotate(15deg); opacity: 0; }
                }
                .animate-float-up { animation: floatUp 2.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
                
                /* Custom Scrollbar for Chat */
                .chat-scrollbar::-webkit-scrollbar { width: 6px; }
                .chat-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .chat-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 10px; }
                .chat-scrollbar::-webkit-scrollbar-thumb:hover { background: #52525b; }
            `}</style>

            <Navbar />

            <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 py-4 sm:py-6">
                
                {/* Header bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                    <div className="flex items-center gap-4 flex-wrap">
                        {/* Live Badge with glow */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-red-600 blur-md opacity-40 animate-pulse rounded-full"></div>
                            <div className="relative flex items-center gap-2 bg-red-600 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg shadow-red-600/20">
                                <Radio size={16} className="animate-pulse" /> LIVE NOW
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-sm font-medium text-gray-300">
                            <Eye size={16} className="text-gray-400" />
                            <span><strong className="text-white">{stream.viewerCount?.toLocaleString() || '0'}</strong> watching</span>
                        </div>
                        
                        <div className={`flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-medium ${connected ? 'text-green-400' : 'text-amber-400'}`}>
                            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 shadow-[0_0_8px_#22c55e] animate-pulse' : 'bg-amber-500 animate-pulse'}`} />
                            {connected ? 'Real-time Sync On' : 'Connecting Sync...'}
                        </div>
                    </div>
                    
                    <button onClick={share} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all border border-white/10">
                        <Share2 size={16} /> Share Stream
                    </button>
                </div>

                {/* Main layout */}
                <div className="flex flex-col xl:flex-row gap-6">

                    {/* ── LEFT: Player + Info + Reactions ── */}
                    <div className="flex-1 min-w-0 flex flex-col gap-6">

                        {/* YouTube Player */}
                        <div className="rounded-3xl overflow-hidden bg-black shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 group">
                            <div className="aspect-video w-full relative bg-gray-900">
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
                                    <div className="w-full h-full flex flex-col items-center justify-center text-center p-8">
                                        <div className="w-20 h-20 bg-red-600/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
                                            <PlayCircle size={40} className="text-red-500" />
                                        </div>
                                        <p className="text-white font-extrabold text-2xl mb-3">Embedding Disabled</p>
                                        <p className="text-gray-400 mb-8 max-w-sm text-lg leading-relaxed">The stream owner has disabled playback on external websites. Watch directly on YouTube.</p>
                                        <a href={`https://www.youtube.com/watch?v=${stream.youtubeVideoId}`} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg shadow-red-600/30 hover:scale-105 active:scale-95">
                                            <PlayCircle size={24} /> Watch Live on YouTube
                                        </a>
                                    </div>
                                )}
                            </div>
                            {!embedError && (
                                <div className="bg-[#0f0f11] px-5 py-2.5 flex items-center justify-between border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <span className="text-xs text-gray-500 font-medium">Having trouble seeing the video?</span>
                                    <a href={`https://www.youtube.com/watch?v=${stream.youtubeVideoId}`} target="_blank" rel="noopener noreferrer"
                                        className="text-xs text-red-400 hover:text-red-300 font-bold flex items-center gap-1.5 transition-colors">
                                        <PlayCircle size={14} /> Watch on YouTube
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Stream Info & Follow Bar */}
                        <div className="bg-[#121217] rounded-3xl p-6 sm:p-8 border border-white/5 shadow-xl relative overflow-hidden">
                            {/* Decorative background gradient */}
                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
                            
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 tracking-tight relative z-10">{stream.title}</h1>
                            {stream.description && <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-6 max-w-4xl relative z-10">{stream.description}</p>}
                            
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mt-6 pt-6 border-t border-white/10 relative z-10">
                                {/* Channel Info */}
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-[2px] shadow-lg shadow-indigo-500/20">
                                        <div className="w-full h-full bg-gray-900 rounded-2xl flex items-center justify-center">
                                            <span className="text-white text-xl font-bold">LM</span>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            LearnMade
                                            <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.9 14.7L6 12.6l1.5-1.5 2.6 2.6 6.4-6.4 1.5 1.5-7.9 7.9z"/></svg>
                                        </h3>
                                        <p className="text-sm text-gray-400 font-medium">{followersCount.toLocaleString()} followers</p>
                                    </div>
                                </div>
                                
                                {/* Actions */}
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <button 
                                        onClick={toggleFollow}
                                        disabled={isFollowLoading}
                                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${
                                            isFollowing 
                                                ? 'bg-white/10 text-white hover:bg-white/15 border border-white/10' 
                                                : 'bg-indigo-600 text-white hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-600/30'
                                        }`}
                                    >
                                        {isFollowLoading ? (
                                            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <Star size={18} className={isFollowing ? "fill-white" : ""} />
                                                {isFollowing ? 'Following' : 'Follow'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ── Shared Reactions ── */}
                        <div className="bg-[#121217] rounded-3xl p-6 sm:p-8 border border-white/5 shadow-xl relative overflow-hidden">
                            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-indigo-500/5 to-transparent pointer-events-none" />
                            
                            <div className="flex items-center justify-between mb-6 relative z-10">
                                <div>
                                    <h3 className="text-lg font-bold text-white">Live Reactions</h3>
                                    <p className="text-xs text-gray-400 mt-1 font-medium">Tap to react! Everyone sees this instantly.</p>
                                </div>
                                {totalReactions > 0 && (
                                    <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl flex items-center gap-2">
                                        <div className="flex -space-x-2">
                                            <span className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center text-[10px]">🔥</span>
                                            <span className="w-5 h-5 rounded-full bg-pink-500/20 flex items-center justify-center text-[10px]">❤️</span>
                                        </div>
                                        <span className="text-sm text-gray-300 font-bold">{totalReactions.toLocaleString()} total</span>
                                    </div>
                                )}
                            </div>
                            
                            <div className="relative z-10">
                                {/* Floating bursts area */}
                                <div className="absolute bottom-full left-0 w-full h-32 pointer-events-none mb-4">
                                    <FloatingBurst bursts={bursts} />
                                </div>
                                <div className="grid grid-cols-4 sm:flex sm:flex-wrap gap-3 sm:gap-4">
                                    {REACTION_LIST.map(({ emoji, key, label }) => (
                                        <button
                                            key={key}
                                            onClick={() => handleReaction(emoji, key)}
                                            className="group relative flex flex-col items-center justify-center gap-2 p-4 bg-white/5 hover:bg-white/10 active:scale-95 rounded-2xl transition-all duration-200 border border-white/10 hover:border-white/20 sm:min-w-[100px]"
                                        >
                                            <span className="text-3xl group-hover:scale-125 group-hover:-translate-y-1 transition-transform duration-300 drop-shadow-md">{emoji}</span>
                                            <span className="text-xs font-bold text-gray-400 group-hover:text-white tabular-nums bg-black/40 px-2 py-0.5 rounded-full">
                                                {reactions[key] > 0 ? reactions[key].toLocaleString() : label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── RIGHT: Chat + Q&A (Fixed Height on Desktop) ── */}
                    <div className="xl:w-[450px] shrink-0 flex flex-col gap-6">

                        {/* YouTube Live Chat Panel */}
                        {stream.chatEnabled && stream.youtubeVideoId && (
                            <div className="bg-[#121217] rounded-3xl overflow-hidden border border-white/5 shadow-xl flex flex-col h-[400px]">
                                <div className="flex items-center gap-3 px-5 py-4 bg-[#1a1a20] border-b border-white/5">
                                    <div className="p-2 bg-red-500/10 rounded-xl">
                                        <Wifi size={16} className="text-red-400" />
                                    </div>
                                    <span className="text-sm font-bold text-white">YouTube Chat</span>
                                    <div className="ml-auto flex items-center gap-1.5 bg-red-600 text-white px-2.5 py-1 rounded-full">
                                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Live</span>
                                    </div>
                                </div>
                                <div className="flex-1 bg-black">
                                    <iframe
                                        src={`https://www.youtube.com/live_chat?v=${stream.youtubeVideoId}&embed_domain=${typeof window !== 'undefined' ? window.location.hostname : 'courses.learnmade.in'}`}
                                        title="Live Chat"
                                        className="w-full h-full border-0"
                                        allow="autoplay"
                                    />
                                </div>
                            </div>
                        )}

                        {/* ── Shared Q&A Panel ── */}
                        <div className="bg-[#121217] rounded-3xl border border-white/5 shadow-xl flex flex-col h-[500px]">
                            {/* Header */}
                            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-[#1a1a20] rounded-t-3xl">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-500/10 rounded-xl">
                                        <MessageSquare size={16} className="text-indigo-400" />
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-white text-sm">Community Q&A</h2>
                                        <p className="text-[10px] text-gray-500 font-medium">Messages are public to all</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-bold text-white bg-white/10 px-2 py-1 rounded-lg">{messages.length}</span>
                                </div>
                            </div>

                            {/* Messages list (Scrollable) */}
                            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4 chat-scrollbar scroll-smooth">
                                {messages.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center">
                                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                            <MessageSquare size={24} className="text-gray-600" />
                                        </div>
                                        <p className="text-white font-semibold">Quiet in here...</p>
                                        <p className="text-sm text-gray-500 mt-1 max-w-[200px]">Be the first to drop a question or say hello!</p>
                                    </div>
                                ) : (
                                    messages.map((msg) => {
                                        const alreadyUpvoted = upvotedIds.has(msg._id);
                                        const isMine = session?.user?.name && msg.name === session.user.name;
                                        
                                        return (
                                            <div key={msg._id} className="flex items-start gap-3 group animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-[1px] shrink-0 mt-1">
                                                    <div className="w-full h-full bg-gray-900 rounded-[11px] flex items-center justify-center text-white text-xs font-bold">
                                                        {msg.name?.[0]?.toUpperCase() || 'A'}
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-bold text-indigo-400">{msg.name || 'Anonymous'}</span>
                                                        {isMine && <span className="text-[9px] font-bold text-white bg-indigo-600 px-1.5 py-0.5 rounded uppercase">You</span>}
                                                        <span className="text-[10px] text-gray-600">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                    <p className="text-sm text-gray-200 leading-relaxed bg-white/5 border border-white/5 rounded-2xl rounded-tl-sm px-4 py-2.5 break-words">
                                                        {msg.text}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => upvoteMessage(msg._id)}
                                                    disabled={alreadyUpvoted}
                                                    className={`flex flex-col items-center justify-center gap-1 w-10 h-10 rounded-xl transition-all shrink-0 mt-1 ${
                                                        alreadyUpvoted
                                                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 cursor-default'
                                                            : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5 hover:border-white/20'
                                                    }`}
                                                    title={alreadyUpvoted ? 'Upvoted' : 'Upvote'}
                                                >
                                                    <ThumbsUp size={14} className={alreadyUpvoted ? 'fill-current' : ''} />
                                                    {msg.upvotes > 0 && <span className="text-[10px] font-bold leading-none">{msg.upvotes}</span>}
                                                </button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Submit form */}
                            <div className="p-4 bg-[#1a1a20] border-t border-white/5 rounded-b-3xl">
                                <form onSubmit={submitQuestion} className="flex flex-col gap-3">
                                    {!session?.user?.name && (
                                        <input
                                            value={questionName}
                                            onChange={e => setQuestionName(e.target.value)}
                                            placeholder="Your display name"
                                            maxLength={50}
                                            className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                                        />
                                    )}
                                    <div className="relative flex items-center">
                                        <input
                                            value={question}
                                            onChange={e => setQuestion(e.target.value)}
                                            placeholder="Type your message..."
                                            maxLength={500}
                                            className="w-full pl-4 pr-12 py-3 bg-white/5 border border-white/10 hover:border-white/20 focus:border-indigo-500 rounded-xl text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!question.trim() || sending}
                                            className="absolute right-1.5 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all disabled:opacity-30 disabled:hover:bg-indigo-600"
                                        >
                                            {sending ? (
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <Send size={16} className="-ml-0.5 mt-0.5" />
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
