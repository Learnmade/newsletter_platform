'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
    Radio, Eye, Calendar, Clock, ThumbsUp,
    Send, ChevronRight, ArrowLeft, Share2, Bell,
    WifiOff, PlayCircle, MessageSquare, Wifi, Users, Star, LogIn,
    Code, Copy, CheckCircle2, Link as LinkIcon
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
    const [activeViewers, setActiveViewers] = useState(0);
    const [pinnedResource, setPinnedResource] = useState({ title: '', url: '' });

    // Local UI state
    const [bursts, setBursts] = useState([]);        // floating emojis animation
    const [question, setQuestion] = useState('');
    const [questionName, setQuestionName] = useState('');
    const [sending, setSending] = useState(false);
    const [upvotedIds, setUpvotedIds] = useState(new Set()); // prevent double upvote
    const [isCodeMode, setIsCodeMode] = useState(false); // Code snippet input mode
    const [copiedId, setCopiedId] = useState(null); // Which snippet is currently copied

    const messagesContainerRef = useRef(null);
    const pollRef = useRef(null);
    const eventSourceRef = useRef(null);

    // Unique viewer ID for heartbeat
    const [viewerId] = useState(() => Math.random().toString(36).substring(2) + Date.now().toString(36));

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
        pollRef.current = setInterval(fetchStream, 60000); // Less frequent polling since SSE handles real-time
        return () => clearInterval(pollRef.current);
    }, [fetchStream, fetchFollowData]);

    // ── Real-time Ping Heartbeat ────────────────────────────────
    useEffect(() => {
        if (!stream) return;
        const ping = async () => {
            try {
                await fetch('/api/livestream/ping', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ viewerId })
                });
            } catch (e) {}
        };
        ping(); // initial
        const interval = setInterval(ping, 5000); // every 5s
        return () => clearInterval(interval);
    }, [stream, viewerId]);

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
                    if (payload.activeViewers !== undefined) setActiveViewers(payload.activeViewers);
                    if (payload.pinnedResource) setPinnedResource(payload.pinnedResource);
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
        const id = Date.now() + Math.random();
        setBursts(prev => [...prev.slice(-10), { id, emoji, x: 20 + Math.random() * 60, delay: Math.random() * 0.2 }]);
        setTimeout(() => setBursts(prev => prev.filter(b => b.id !== id)), 2600);

        try {
            await fetch('/api/livestream/reactions', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reaction: key }),
            });
        } catch (_) {}
    };

    // ── Submit Q&A / Code Snippet ──────────────────────────────
    const submitQuestion = async (e) => {
        e.preventDefault();
        if (!question.trim() || sending) return;
        setSending(true);
        try {
            await fetch('/api/livestream/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name: questionName.trim() || session?.user?.name || 'Anonymous', 
                    text: question.trim(),
                    isCodeSnippet: isCodeMode,
                    language: 'javascript'
                }),
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
        if (upvotedIds.has(id)) return;
        setUpvotedIds(prev => new Set([...prev, id]));
        try {
            await fetch('/api/livestream/messages', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
        } catch (_) {}
    };

    // ── Copy Code Snippet ──────────────────────────────────────
    const copyToClipboard = (id, text) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // ── Toggle Follow Status ───────────────────────────────────
    const toggleFollow = async () => {
        if (!session) {
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

    // ─── Minimal Header ──────────────────────────────────────────
    const MinimalHeader = () => (
        <header className="h-16 flex items-center justify-between px-6 shrink-0 bg-[#09090b]/95 backdrop-blur-md border-b border-white/5 z-50">
            <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                <span className="font-semibold text-sm">Back to Home</span>
            </Link>
            
            <div className="flex items-center gap-4">
                <button onClick={share} className="flex items-center gap-2 text-gray-400 hover:text-white px-3 py-1.5 rounded-full hover:bg-white/5 transition-colors text-sm font-semibold">
                    <Share2 size={16} /> Share
                </button>
                {session ? (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-[2px]">
                        <div className="w-full h-full bg-gray-900 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {session.user.name?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                    </div>
                ) : (
                    <Link href="/login?callbackUrl=/live" className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-indigo-700 transition-colors">
                        <LogIn size={14} /> Log In
                    </Link>
                )}
            </div>
        </header>
    );

    // ─── Loading ──────────────────────────────────────────────
    if (loading) {
        return (
            <div className="h-screen w-full bg-[#09090b] flex flex-col">
                <MinimalHeader />
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        <p className="text-gray-400 text-sm font-medium">Connecting to stream...</p>
                    </div>
                </div>
            </div>
        );
    }

    // ─── No stream ────────────────────────────────────────────
    if (!stream) {
        return (
            <div className="h-screen w-full bg-[#09090b] flex flex-col">
                <MinimalHeader />
                <div className="flex-1 flex items-center justify-center text-center px-6">
                    <div>
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 mx-auto">
                            <WifiOff size={36} className="text-gray-500" />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-3">No Stream Yet</h1>
                        <p className="text-gray-400 max-w-md mx-auto mb-8">No live stream is set up right now. Check back soon!</p>
                        <Link href="/" className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors">Return to Homepage</Link>
                    </div>
                </div>
            </div>
        );
    }

    // ─── Scheduled ───────────────────────────────────────────
    if (stream.status === 'scheduled') {
        return (
            <div className="h-screen w-full bg-[#09090b] flex flex-col overflow-hidden">
                <MinimalHeader />
                <div className="flex-1 flex flex-col items-center justify-center text-center px-6 relative overflow-y-auto">
                    {/* Background glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none" />
                    
                    <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center">
                        <div className="relative mb-8">
                            <div className="w-28 h-28 bg-indigo-500/10 rounded-full flex items-center justify-center border border-indigo-500/20 shadow-[0_0_60px_rgba(99,102,241,0.2)]">
                                <Calendar size={48} className="text-indigo-400" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                                <Clock size={16} className="text-white" />
                            </div>
                        </div>
                        
                        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-5 py-2 rounded-full text-indigo-400 text-sm font-bold mb-6 uppercase tracking-wider">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse" /> Stream Scheduled
                        </div>
                        
                        <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">{stream.title}</h1>
                        {stream.description && <p className="text-gray-400 text-xl max-w-2xl mb-12">{stream.description}</p>}
                        
                        {stream.scheduledAt && (
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-10 backdrop-blur-xl w-full max-w-2xl mx-auto mb-12 shadow-2xl">
                                <p className="text-indigo-400 font-bold tracking-widest mb-8 text-sm uppercase">Starts In</p>
                                <Countdown targetDate={stream.scheduledAt} />
                                <p className="text-gray-400 mt-10 text-base font-medium bg-black/30 py-3 px-6 rounded-full inline-block">
                                    <Calendar className="inline-block w-4 h-4 mr-2 mb-1" />
                                    {new Date(stream.scheduledAt).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}
                                </p>
                            </div>
                        )}
                        
                        <button onClick={toggleFollow} className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-xl ${isFollowing ? 'bg-white/10 text-white hover:bg-white/20 border border-white/10' : 'bg-indigo-600 text-white hover:bg-indigo-500 hover:shadow-indigo-600/30'}`}>
                            {isFollowLoading ? (
                                <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Star size={22} className={isFollowing ? "fill-white" : ""} />
                                    {isFollowing ? 'Following Channel' : 'Follow to get notified'}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ─── Offline / Ended ──────────────────────────────────────
    if (stream.status === 'offline' || stream.status === 'ended') {
        return (
            <div className="h-screen w-full bg-[#09090b] flex flex-col">
                <MinimalHeader />
                <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                    <div className="w-28 h-28 bg-gray-900 border border-gray-800 rounded-full flex items-center justify-center mb-8 shadow-2xl">
                        {stream.status === 'ended' ? <PlayCircle size={48} className="text-gray-400" /> : <WifiOff size={48} className="text-gray-500" />}
                    </div>
                    <h1 className="text-5xl font-extrabold text-white mb-6 tracking-tight">{stream.status === 'ended' ? 'Stream Ended' : 'Stream Offline'}</h1>
                    <p className="text-gray-400 max-w-xl mb-6 text-xl leading-relaxed">
                        {stream.status === 'ended' ? `"${stream.title}" has ended. The replay may be available on YouTube.` : 'No live stream is happening right now. Check back soon!'}
                    </p>
                    {stream.status === 'ended' && stream.youtubeVideoId && (
                        <a href={`https://www.youtube.com/watch?v=${stream.youtubeVideoId}`} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-3 bg-red-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-red-700 transition-colors mt-4 shadow-lg shadow-red-600/20">
                            <PlayCircle size={22} /> Watch Replay on YouTube
                        </a>
                    )}
                </div>
            </div>
        );
    }

    // ─── LIVE (IMMERSIVE THEATER MODE) ──────────────────────────────────────
    const REACTION_LIST = [
        { emoji: '🔥', key: 'fire', label: 'Fire' },
        { emoji: '❤️', key: 'heart', label: 'Love' },
        { emoji: '🙌', key: 'clap', label: 'Clap' },
        { emoji: '💡', key: 'idea', label: 'Idea' },
    ];

    const totalReactions = Object.values(reactions).reduce((a, b) => a + b, 0);

    return (
        <div className="h-screen w-full bg-[#09090b] flex flex-col overflow-hidden selection:bg-indigo-500/30 font-sans">
            <style>{`
                @keyframes floatUp {
                    0%   { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(-200px) scale(1.6) rotate(15deg); opacity: 0; }
                }
                .animate-float-up { animation: floatUp 2.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
                
                /* Custom Scrollbar */
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
            `}</style>

            <MinimalHeader />

            <div className="flex-1 flex flex-col lg:flex-row min-h-0 relative">
                
                {/* ── LEFT: Video & Meta ── */}
                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col relative">
                    
                    {/* Pinned Resource Banner */}
                    {pinnedResource?.url && (
                        <div className="bg-indigo-600 text-white px-4 py-2 flex items-center justify-center gap-3 shrink-0 shadow-lg relative z-20">
                            <div className="bg-white/20 p-1.5 rounded-lg">
                                <LinkIcon size={14} />
                            </div>
                            <span className="text-sm font-semibold">{pinnedResource.title || 'Current Resource'}</span>
                            <a href={pinnedResource.url} target="_blank" rel="noopener noreferrer" className="ml-2 bg-white text-indigo-700 px-3 py-1 rounded-md text-xs font-bold hover:bg-gray-100 transition-colors">
                                View
                            </a>
                        </div>
                    )}

                    {/* Immersive Video Container */}
                    <div className="w-full bg-black relative group shadow-2xl border-b border-white/5 shrink-0">
                        <div className="aspect-video w-full max-h-[85vh] mx-auto bg-black flex items-center justify-center">
                            {!embedError ? (
                                <iframe
                                    key={stream.youtubeVideoId}
                                    src={`https://www.youtube.com/embed/${stream.youtubeVideoId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`}
                                    title={stream.title}
                                    className="w-full h-full max-w-[1600px]"
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
                                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all">
                                        <PlayCircle size={24} /> Watch Live on YouTube
                                    </a>
                                </div>
                            )}
                        </div>
                        
                        <div className="absolute top-4 left-4 flex gap-2">
                            <div className="flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider shadow-lg">
                                <Radio size={14} className="animate-pulse" /> Live
                            </div>
                            <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-md text-xs font-bold shadow-lg" title="Real-time Active Viewers">
                                <Eye size={14} className="text-gray-300" />
                                {activeViewers.toLocaleString()}
                            </div>
                        </div>
                    </div>

                    {/* Meta Section */}
                    <div className="flex-1 w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 flex flex-col xl:flex-row gap-8">
                        
                        {/* Channel & Stream Info */}
                        <div className="flex-1">
                            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 leading-tight">{stream.title}</h1>
                            {stream.description && <p className="text-gray-400 text-sm mb-8 leading-relaxed max-w-3xl">{stream.description}</p>}
                            
                            <div className="flex flex-wrap items-center justify-between gap-6 pb-6 border-b border-white/10">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-[2px]">
                                        <div className="w-full h-full bg-gray-900 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                            LM
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
                                
                                <button 
                                    onClick={toggleFollow}
                                    disabled={isFollowLoading}
                                    className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm transition-all ${
                                        isFollowing 
                                            ? 'bg-white/10 text-white hover:bg-white/15' 
                                            : 'bg-white text-black hover:bg-gray-200'
                                    }`}
                                >
                                    {isFollowLoading ? (
                                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            {isFollowing ? <Star size={16} className="fill-white" /> : null}
                                            {isFollowing ? 'Following' : 'Follow'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Reactions */}
                        <div className="xl:w-80 shrink-0">
                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 relative overflow-hidden">
                                <div className="flex items-center justify-between mb-4 relative z-10">
                                    <h3 className="text-sm font-bold text-gray-300">Live Reactions</h3>
                                    {totalReactions > 0 && (
                                        <span className="text-xs text-gray-500 font-bold bg-white/5 px-2 py-1 rounded-md">{totalReactions.toLocaleString()}</span>
                                    )}
                                </div>
                                
                                <div className="relative z-10">
                                    <div className="absolute bottom-full left-0 w-full h-32 pointer-events-none mb-2">
                                        <FloatingBurst bursts={bursts} />
                                    </div>
                                    <div className="grid grid-cols-4 gap-2">
                                        {REACTION_LIST.map(({ emoji, key }) => (
                                            <button
                                                key={key}
                                                onClick={() => handleReaction(emoji, key)}
                                                className="group relative flex flex-col items-center justify-center gap-1.5 p-3 bg-white/5 hover:bg-white/10 active:scale-95 rounded-xl transition-all border border-transparent hover:border-white/10"
                                            >
                                                <span className="text-2xl group-hover:scale-125 transition-transform duration-200">{emoji}</span>
                                                <span className="text-[10px] font-bold text-gray-500 group-hover:text-gray-300 tabular-nums">
                                                    {reactions[key] > 0 ? (reactions[key] > 999 ? '999+' : reactions[key]) : 0}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── RIGHT: Chat Panel ── */}
                <div className="w-full lg:w-[380px] xl:w-[420px] shrink-0 border-t lg:border-t-0 lg:border-l border-white/10 bg-[#0f0f12] flex flex-col h-[50vh] lg:h-full relative z-20">
                    
                    <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 shrink-0 bg-[#09090b]">
                        <div className="flex items-center gap-2">
                            <MessageSquare size={16} className="text-indigo-400" />
                            <h2 className="font-bold text-white text-sm uppercase tracking-wide">Developer Q&A</h2>
                        </div>
                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${connected ? 'text-green-400 bg-green-400/10' : 'text-amber-400 bg-amber-400/10'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-amber-400'}`} />
                            {connected ? 'Sync On' : 'Connecting'}
                        </div>
                    </div>

                    <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-5 custom-scrollbar scroll-smooth">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
                                <Code size={24} className="mb-3 opacity-50" />
                                <p className="text-sm font-medium">Welcome to the stream!</p>
                                <p className="text-xs mt-1 max-w-[200px]">Ask questions or share code snippets with the community.</p>
                            </div>
                        ) : (
                            messages.map((msg) => {
                                const alreadyUpvoted = upvotedIds.has(msg._id);
                                const isMine = session?.user?.name && msg.name === session.user.name;
                                
                                return (
                                    <div key={msg._id} className="flex items-start gap-3 group animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5 border border-white/5">
                                            {msg.name?.[0]?.toUpperCase() || 'A'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-baseline gap-2 mb-1.5">
                                                <span className={`text-xs font-bold ${isMine ? 'text-indigo-400' : 'text-gray-300'}`}>{msg.name || 'Anonymous'}</span>
                                                <span className="text-[10px] text-gray-600">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            
                                            {msg.isCodeSnippet ? (
                                                <div className="bg-[#1e1e1e] rounded-lg border border-white/10 overflow-hidden relative group/code">
                                                    <div className="flex justify-between items-center px-3 py-1.5 bg-black/40 border-b border-white/5">
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{msg.language || 'Code'}</span>
                                                        <button 
                                                            onClick={() => copyToClipboard(msg._id, msg.text)}
                                                            className="text-gray-400 hover:text-white transition-colors"
                                                            title="Copy Code"
                                                        >
                                                            {copiedId === msg._id ? <CheckCircle2 size={12} className="text-green-400" /> : <Copy size={12} />}
                                                        </button>
                                                    </div>
                                                    <pre className="p-3 overflow-x-auto custom-scrollbar text-[11px] sm:text-xs text-gray-300 font-mono leading-relaxed">
                                                        <code>{msg.text}</code>
                                                    </pre>
                                                </div>
                                            ) : (
                                                <p className="text-[13px] text-gray-200 leading-relaxed break-words">
                                                    {msg.text}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => upvoteMessage(msg._id)}
                                            disabled={alreadyUpvoted}
                                            className={`flex flex-col items-center justify-center gap-0.5 w-8 h-8 rounded-lg transition-all shrink-0 mt-1 ${
                                                alreadyUpvoted
                                                    ? 'text-indigo-400 cursor-default'
                                                    : 'text-gray-600 hover:text-white hover:bg-white/5'
                                            }`}
                                        >
                                            <ThumbsUp size={12} className={alreadyUpvoted ? 'fill-current' : ''} />
                                            {msg.upvotes > 0 && <span className="text-[9px] font-bold leading-none">{msg.upvotes}</span>}
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Chat / Snippet Input */}
                    <div className="shrink-0 p-4 border-t border-white/5 bg-[#09090b]">
                        <form onSubmit={submitQuestion} className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                {!session?.user?.name ? (
                                    <input
                                        value={questionName}
                                        onChange={e => setQuestionName(e.target.value)}
                                        placeholder="Display name"
                                        maxLength={50}
                                        className="w-1/2 px-3 py-1.5 bg-white/5 border border-transparent rounded-md text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20 transition-all"
                                    />
                                ) : <div />}
                                <button 
                                    type="button" 
                                    onClick={() => setIsCodeMode(!isCodeMode)}
                                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all ml-auto ${isCodeMode ? 'bg-indigo-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
                                >
                                    <Code size={12} /> Snippet Mode
                                </button>
                            </div>
                            
                            <div className="relative flex bg-white/5 border border-white/10 focus-within:border-indigo-500 rounded-lg overflow-hidden transition-colors">
                                {isCodeMode ? (
                                    <textarea
                                        value={question}
                                        onChange={e => setQuestion(e.target.value)}
                                        placeholder="Paste your code snippet here..."
                                        className="w-full h-24 pl-3 pr-10 py-3 bg-transparent text-xs text-gray-300 font-mono placeholder:text-gray-600 focus:outline-none resize-none custom-scrollbar"
                                    />
                                ) : (
                                    <input
                                        value={question}
                                        onChange={e => setQuestion(e.target.value)}
                                        placeholder="Chat publicly..."
                                        maxLength={500}
                                        className="w-full pl-3 pr-10 py-3 bg-transparent text-sm text-white placeholder:text-gray-500 focus:outline-none"
                                    />
                                )}
                                <button
                                    type="submit"
                                    disabled={!question.trim() || sending}
                                    className={`absolute right-1 bottom-1 p-2 rounded-md transition-all ${!question.trim() || sending ? 'opacity-30' : 'text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300'}`}
                                >
                                    {sending ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Send size={16} />}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

            </div>
        </div>
    );
}
