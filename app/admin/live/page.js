'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Activity, Radio, Video, Save, Plus, ExternalLink, Link2, Eye, LayoutTemplate, MessageSquare } from 'lucide-react';

export default function StreamControlRoom() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [stream, setStream] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [youtubeVideoId, setYoutubeVideoId] = useState('');
    const [streamStatus, setStreamStatus] = useState('offline');
    
    // Pinned Resource state
    const [resourceTitle, setResourceTitle] = useState('');
    const [resourceUrl, setResourceUrl] = useState('');
    
    // Chapter state
    const [chapterTitle, setChapterTitle] = useState('');
    const [chapters, setChapters] = useState([]);
    
    // Metrics
    const [activeViewers, setActiveViewers] = useState(0);

    // Initial Fetch
    useEffect(() => {
        if (status === 'unauthenticated') router.push('/login');
        if (status === 'authenticated' && session?.user?.role !== 'admin') router.push('/');
        
        if (status === 'authenticated' && session?.user?.role === 'admin') {
            fetchData();
        }
    }, [status, session]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [streamRes, chaptersRes] = await Promise.all([
                fetch('/api/livestream'),
                fetch('/api/livestream/chapters')
            ]);
            const streamData = await streamRes.json();
            const chaptersData = await chaptersRes.json();
            
            if (streamData.success && streamData.data) {
                const s = streamData.data;
                setStream(s);
                setTitle(s.title || '');
                setDescription(s.description || '');
                setYoutubeVideoId(s.youtubeVideoId || '');
                setStreamStatus(s.status || 'offline');
                setResourceTitle(s.pinnedResource?.title || '');
                setResourceUrl(s.pinnedResource?.url || '');
            }
            if (chaptersData.success) {
                setChapters(chaptersData.data);
            }
        } catch (e) {
            console.error('Failed to load data', e);
        } finally {
            setLoading(false);
        }
    };

    // SSE for realtime viewer count
    useEffect(() => {
        const es = new EventSource('/api/livestream/events');
        es.onmessage = (e) => {
            try {
                const payload = JSON.parse(e.data);
                if (payload.type === 'update' && payload.activeViewers !== undefined) {
                    setActiveViewers(payload.activeViewers);
                }
            } catch (_) {}
        };
        return () => es.close();
    }, []);

    // Handlers
    const handleUpdateStream = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await fetch('/api/livestream', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: stream._id,
                    title,
                    description,
                    youtubeVideoId,
                    status: streamStatus,
                    pinnedResource: { title: resourceTitle, url: resourceUrl }
                })
            });
            alert('Stream updated successfully!');
            fetchData();
        } catch (_) {
            alert('Failed to update stream');
        } finally {
            setSaving(false);
        }
    };

    const handleCreateChapter = async (e) => {
        e.preventDefault();
        if (!chapterTitle.trim()) return;
        
        try {
            await fetch('/api/livestream/chapters', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: chapterTitle })
            });
            setChapterTitle('');
            fetchData();
        } catch (_) {
            alert('Failed to create chapter');
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
            
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Radio className="text-indigo-600" size={32} />
                        Stream Control Room
                    </h1>
                    <p className="text-gray-500 mt-1">Manage your live stream, pinned resources, and chapters.</p>
                </div>
                
                <a href="/live" target="_blank" className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition-colors">
                    <ExternalLink size={18} /> View Live Page
                </a>
            </div>

            {/* Top Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                        <Eye size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Active Viewers</p>
                        <h3 className="text-2xl font-bold text-gray-900">{activeViewers}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${streamStatus === 'live' ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-600'}`}>
                        <Radio size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Stream Status</p>
                        <h3 className="text-xl font-bold text-gray-900 capitalize">{streamStatus}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                        <LayoutTemplate size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Chapters</p>
                        <h3 className="text-2xl font-bold text-gray-900">{chapters.length}</h3>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Column: Stream Settings & Pinned Resource */}
                <div className="lg:col-span-2 space-y-8">
                    <form onSubmit={handleUpdateStream} className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Video size={20} className="text-indigo-600" /> General Settings
                        </h2>
                        
                        <div className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Stream Status</label>
                                    <select 
                                        value={streamStatus} 
                                        onChange={e => setStreamStatus(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="offline">Offline</option>
                                        <option value="scheduled">Scheduled</option>
                                        <option value="live">Live (Broadcasting)</option>
                                        <option value="ended">Ended</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">YouTube Video ID</label>
                                    <input 
                                        type="text" 
                                        value={youtubeVideoId} 
                                        onChange={e => setYoutubeVideoId(e.target.value)}
                                        placeholder="e.g. dQw4w9WgXcQ"
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Stream Title</label>
                                <input 
                                    type="text" 
                                    value={title} 
                                    onChange={e => setTitle(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                                <textarea 
                                    value={description} 
                                    onChange={e => setDescription(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                        
                        <hr className="my-8 border-gray-100" />
                        
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Link2 size={20} className="text-indigo-600" /> Pinned Resource Banner
                        </h2>
                        <p className="text-sm text-gray-500 mb-5">This pushes a live banner to the top of the video player for all viewers.</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Resource Title</label>
                                <input 
                                    type="text" 
                                    value={resourceTitle} 
                                    onChange={e => setResourceTitle(e.target.value)}
                                    placeholder="e.g. Next.js App Router Docs"
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">URL</label>
                                <input 
                                    type="url" 
                                    value={resourceUrl} 
                                    onChange={e => setResourceUrl(e.target.value)}
                                    placeholder="https://..."
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                        
                        <div className="flex justify-end">
                            <button 
                                type="submit" 
                                disabled={saving}
                                className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={18} />}
                                Save & Push Changes
                            </button>
                        </div>
                    </form>
                </div>
                
                {/* Right Column: Chapters */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[700px]">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 shrink-0">
                        <Activity size={20} className="text-indigo-600" /> Live Chapters
                    </h2>
                    
                    <form onSubmit={handleCreateChapter} className="mb-6 shrink-0">
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mark New Chapter</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={chapterTitle} 
                                onChange={e => setChapterTitle(e.target.value)}
                                placeholder="e.g. Building the Sidebar"
                                className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors">
                                <Plus size={20} />
                            </button>
                        </div>
                    </form>
                    
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                        {chapters.length === 0 ? (
                            <p className="text-gray-400 text-center py-8 text-sm">No chapters created yet.</p>
                        ) : (
                            chapters.map((c, i) => (
                                <div key={c._id} className="relative pl-6 pb-4 border-l-2 border-gray-200 last:border-0 last:pb-0">
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 bg-white border-2 border-indigo-600 rounded-full" />
                                    <h4 className="font-bold text-gray-900 text-sm -mt-1">{c.title}</h4>
                                    <p className="text-xs text-gray-500 font-mono mt-1">
                                        {new Date(c.timestamp).toLocaleTimeString()}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                
            </div>
        </div>
    );
}
