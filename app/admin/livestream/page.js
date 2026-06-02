'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Radio, Play, Square, Clock, Eye, Wifi, WifiOff, AlertCircle,
    ChevronDown, ChevronUp, Copy, Check, Loader2, Plus, Trash2,
    MonitorPlay, Settings, Calendar, MessageSquare, Zap, Info
} from 'lucide-react';

// Helper to extract YouTube video ID from URL or raw ID
function extractYouTubeId(input) {
    if (!input) return '';
    const trimmed = input.trim();
    // Full URL formats
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    ];
    for (const pattern of patterns) {
        const match = trimmed.match(pattern);
        if (match) return match[1];
    }
    // If it's already just an ID (11 chars, no spaces)
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
    return trimmed;
}

const STATUS_CONFIG = {
    offline: { label: 'Offline', color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400', ring: 'ring-gray-200' },
    scheduled: { label: 'Scheduled', color: 'bg-amber-50 text-amber-700', dot: 'bg-amber-400', ring: 'ring-amber-200' },
    live: { label: 'LIVE', color: 'bg-red-600 text-white', dot: 'bg-white', ring: 'ring-red-300', pulse: true },
    ended: { label: 'Ended', color: 'bg-gray-100 text-gray-500', dot: 'bg-gray-300', ring: 'ring-gray-100' },
};

export default function AdminLiveStreamPage() {
    const [stream, setStream] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(false);
    const [obsGuideOpen, setObsGuideOpen] = useState(false);

    // Form state
    const [form, setForm] = useState({
        title: '',
        description: '',
        youtubeVideoId: '',
        status: 'offline',
        scheduledAt: '',
        thumbnail: '',
        viewerCount: 0,
        chatEnabled: true,
    });

    const previewId = extractYouTubeId(form.youtubeVideoId);

    const fetchStream = useCallback(async () => {
        try {
            const res = await fetch('/api/livestream');
            const data = await res.json();
            if (data.success && data.data) {
                setStream(data.data);
                setForm({
                    title: data.data.title || '',
                    description: data.data.description || '',
                    youtubeVideoId: data.data.youtubeVideoId || '',
                    status: data.data.status || 'offline',
                    scheduledAt: data.data.scheduledAt
                        ? new Date(data.data.scheduledAt).toISOString().slice(0, 16)
                        : '',
                    thumbnail: data.data.thumbnail || '',
                    viewerCount: data.data.viewerCount || 0,
                    chatEnabled: data.data.chatEnabled !== false,
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchStream(); }, [fetchStream]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSave = async () => {
        if (!form.title.trim()) return alert('Please enter a stream title.');
        setSaving(true);
        try {
            const payload = {
                ...form,
                youtubeVideoId: previewId,
                scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
            };

            let res;
            if (stream?._id) {
                res = await fetch('/api/livestream', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: stream._id, ...payload }),
                });
            } else {
                res = await fetch('/api/livestream', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            }
            const data = await res.json();
            if (data.success) {
                setStream(data.data);
                alert('Stream settings saved!');
            } else {
                alert('Error: ' + (data.error || 'Unknown error'));
            }
        } catch (e) {
            alert('Failed to save stream settings.');
        } finally {
            setSaving(false);
        }
    };

    const handleStatusChange = async (newStatus) => {
        if (!stream?._id && !form.title.trim()) {
            return alert('Please save the stream first.');
        }
        setSaving(true);
        try {
            let streamId = stream?._id;

            // Auto-save if no stream yet
            if (!streamId) {
                const payload = {
                    ...form,
                    youtubeVideoId: previewId,
                    status: newStatus,
                    scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
                };
                const res = await fetch('/api/livestream', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                const data = await res.json();
                if (data.success) {
                    setStream(data.data);
                    setForm(prev => ({ ...prev, status: newStatus }));
                }
                return;
            }

            const res = await fetch('/api/livestream', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: streamId, status: newStatus }),
            });
            const data = await res.json();
            if (data.success) {
                setStream(data.data);
                setForm(prev => ({ ...prev, status: newStatus }));
            }
        } catch (e) {
            alert('Failed to update status.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!stream?._id) return;
        if (!confirm('Delete this stream session? This cannot be undone.')) return;
        try {
            await fetch(`/api/livestream?id=${stream._id}`, { method: 'DELETE' });
            setStream(null);
            setForm({ title: '', description: '', youtubeVideoId: '', status: 'offline', scheduledAt: '', thumbnail: '', viewerCount: 0, chatEnabled: true });
        } catch (e) {
            alert('Failed to delete stream.');
        }
    };

    const copyLiveUrl = () => {
        navigator.clipboard.writeText(`${window.location.origin}/live`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const statusCfg = STATUS_CONFIG[form.status] || STATUS_CONFIG.offline;
    const isLive = form.status === 'live';

    if (loading) {
        return (
            <div className="flex h-[70vh] items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20 max-w-6xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold ring-2 ${statusCfg.color} ${statusCfg.ring}`}>
                            <span className={`w-2 h-2 rounded-full ${statusCfg.dot} ${statusCfg.pulse ? 'animate-pulse' : ''}`} />
                            {statusCfg.label}
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Live Stream</h1>
                    <p className="text-gray-500 mt-1">Manage your YouTube live stream from OBS.</p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Copy Live URL */}
                    <button
                        onClick={copyLiveUrl}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
                    >
                        {copied ? <Check size={15} className="text-green-600" /> : <Copy size={15} />}
                        {copied ? 'Copied!' : 'Copy Live URL'}
                    </button>

                    {/* Save Settings */}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-sm font-bold transition-all shadow-sm disabled:opacity-60"
                    >
                        {saving ? <Loader2 size={15} className="animate-spin" /> : <Settings size={15} />}
                        Save Settings
                    </button>

                    {/* GO LIVE / END */}
                    {!isLive ? (
                        <button
                            onClick={() => handleStatusChange('live')}
                            disabled={saving || !previewId}
                            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <Radio size={15} className={saving ? '' : 'animate-pulse'} />
                            Go Live
                        </button>
                    ) : (
                        <button
                            onClick={() => handleStatusChange('ended')}
                            disabled={saving}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl text-sm font-bold transition-all shadow-sm"
                        >
                            <Square size={15} />
                            End Stream
                        </button>
                    )}
                </div>
            </div>

            {/* Live Banner Alert when LIVE */}
            {isLive && (
                <div className="bg-red-600 text-white rounded-2xl p-5 flex items-center gap-4 shadow-lg animate-in fade-in">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                        <Wifi size={20} />
                    </div>
                    <div className="flex-1">
                        <p className="font-bold text-lg">🔴 You are LIVE right now!</p>
                        <p className="text-red-100 text-sm mt-0.5">
                            Viewers can watch at <span className="font-mono font-bold">/live</span> — share the link to grow your audience.
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold">{form.viewerCount.toLocaleString()}</p>
                        <p className="text-red-200 text-xs font-medium flex items-center gap-1 justify-end"><Eye size={12} /> viewers</p>
                    </div>
                </div>
            )}

            {/* ⚠️ Embedding Warning - Always visible */}
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex gap-3">
                <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-bold text-amber-800">⚠️ Critical: Enable Embedding on YouTube</p>
                    <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                        Before going live, you MUST enable embedding on your YouTube stream. Without this, viewers will see "Video unavailable" error.
                        Go to <strong>YouTube Studio → Go Live → Edit stream → More options → Check ✅ "Allow embedding"</strong>.
                    </p>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

                {/* LEFT: Settings (3 cols) */}
                <div className="lg:col-span-3 space-y-6">

                    {/* Stream Details Card */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                        <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
                            <MonitorPlay size={18} className="text-blue-600" />
                            <h2 className="font-bold text-gray-900">Stream Details</h2>
                        </div>

                        {/* Title */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Stream Title <span className="text-red-400">*</span></label>
                            <input
                                name="title"
                                value={form.title}
                                onChange={handleChange}
                                placeholder="e.g. Next.js 15 Deep Dive – Live Coding Session"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                            <textarea
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                rows={3}
                                placeholder="What will you cover in this stream?"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-sm leading-relaxed resize-none"
                            />
                        </div>

                        {/* YouTube Video ID */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">YouTube Live URL or Video ID <span className="text-red-400">*</span></label>
                            <input
                                name="youtubeVideoId"
                                value={form.youtubeVideoId}
                                onChange={handleChange}
                                placeholder="https://youtu.be/xxxxxxx or paste the 11-char video ID"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all font-mono text-sm"
                            />
                            {previewId && (
                                <p className="mt-2 text-xs text-green-700 font-semibold bg-green-50 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5">
                                    <Check size={12} /> Video ID detected: <span className="font-mono">{previewId}</span>
                                </p>
                            )}
                        </div>

                        {/* Status + Viewer Count */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                                <select
                                    name="status"
                                    value={form.status}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium text-gray-700"
                                >
                                    <option value="offline">Offline</option>
                                    <option value="scheduled">Scheduled</option>
                                    <option value="live">Live</option>
                                    <option value="ended">Ended</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Viewer Count (manual)</label>
                                <input
                                    name="viewerCount"
                                    type="number"
                                    min="0"
                                    value={form.viewerCount}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium text-gray-700"
                                />
                            </div>
                        </div>

                        {/* Scheduled At */}
                        {form.status === 'scheduled' && (
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                                    <Calendar size={14} /> Scheduled Date & Time
                                </label>
                                <input
                                    name="scheduledAt"
                                    type="datetime-local"
                                    value={form.scheduledAt}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium text-gray-700"
                                />
                            </div>
                        )}

                        {/* Chat Toggle */}
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl">
                            <div className="flex items-start gap-3">
                                <MessageSquare size={18} className="text-blue-600 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold text-gray-800">Enable YouTube Live Chat</p>
                                    <p className="text-xs text-gray-500 mt-0.5">Show the YouTube live chat panel alongside the player.</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setForm(prev => ({ ...prev, chatEnabled: !prev.chatEnabled }))}
                                className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none shrink-0 ${form.chatEnabled ? 'bg-blue-600' : 'bg-gray-200'}`}
                            >
                                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${form.chatEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>

                    {/* OBS Setup Guide */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <button
                            onClick={() => setObsGuideOpen(o => !o)}
                            className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center">
                                    <Zap size={18} className="text-purple-600" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-gray-900 text-sm">OBS → YouTube Setup Guide</p>
                                    <p className="text-xs text-gray-500">How to stream from OBS to YouTube Live</p>
                                </div>
                            </div>
                            {obsGuideOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                        </button>

                        {obsGuideOpen && (
                            <div className="px-5 pb-5 border-t border-gray-100">
                                <div className="space-y-4 mt-4">
                                    {[
                                        {
                                            step: 1,
                                            title: 'Get your YouTube Stream Key',
                                            desc: 'Go to YouTube Studio → Go Live → Stream (tab) → Copy the "Stream key" shown on the page.',
                                            color: 'bg-red-100 text-red-700',
                                            critical: false,
                                        },
                                        {
                                            step: '⚠',
                                            title: '🔴 CRITICAL: Enable Embedding (do this first!)',
                                            desc: 'In YouTube Studio → Go Live → click "Edit" on your stream → More options → check the box ✅ "Allow embedding". WITHOUT THIS, viewers will see "Video unavailable" on your site.',
                                            color: 'bg-red-600 text-white',
                                            critical: true,
                                        },
                                        {
                                            step: 2,
                                            title: 'Configure OBS',
                                            desc: 'In OBS: File → Settings → Stream. Set Service = "YouTube - RTMPS", Server = "Primary YouTube ingest server", and paste your Stream Key.',
                                            color: 'bg-orange-100 text-orange-700',
                                            critical: false,
                                        },
                                        {
                                            step: 3,
                                            title: 'Set up your scene in OBS',
                                            desc: 'Add your video/audio sources, set output resolution to 1080p, bitrate to 4500 Kbps for best quality.',
                                            color: 'bg-yellow-100 text-yellow-700',
                                            critical: false,
                                        },
                                        {
                                            step: 4,
                                            title: 'Start Streaming in OBS',
                                            desc: 'Click "Start Streaming" in OBS. Return to YouTube Studio and click "Go Live". Your stream will begin.',
                                            color: 'bg-green-100 text-green-700',
                                            critical: false,
                                        },
                                        {
                                            step: 5,
                                            title: 'Get the YouTube Video ID',
                                            desc: 'Once live, your YouTube stream URL looks like: youtube.com/watch?v=XXXXXXXXXXX — copy the 11-character ID after "v=".',
                                            color: 'bg-blue-100 text-blue-700',
                                            critical: false,
                                        },
                                        {
                                            step: 6,
                                            title: 'Paste ID here & Go Live',
                                            desc: 'Paste the Video ID in the field above, click "Save Settings", then click "Go Live" button. Your viewers on /live will see the stream instantly!',
                                            color: 'bg-purple-100 text-purple-700',
                                            critical: false,
                                        },
                                    ].map(({ step, title, desc, color, critical }) => (
                                        <div key={step} className={`flex gap-3 ${critical ? 'p-3 bg-red-50 border border-red-200 rounded-xl' : ''}`}>
                                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${color}`}>
                                                {step}
                                            </div>
                                            <div>
                                                <p className={`text-sm font-semibold ${critical ? 'text-red-700' : 'text-gray-900'}`}>{title}</p>
                                                <p className={`text-xs mt-0.5 leading-relaxed ${critical ? 'text-red-600' : 'text-gray-500'}`}>{desc}</p>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex gap-2">
                                        <Info size={15} className="text-amber-600 shrink-0 mt-0.5" />
                                        <p className="text-xs text-amber-700 leading-relaxed">
                                            <strong>YouTube Chat note:</strong> For the chat to embed on your site, go to YouTube Studio → Customization → Basic Info and add <strong>courses.learnmade.in</strong> to the "Linked website" field, or your domain to the allowed embed list.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Danger Zone */}
                    {stream?._id && (
                        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-5">
                            <h3 className="text-sm font-bold text-red-700 mb-3">Danger Zone</h3>
                            <button
                                onClick={handleDelete}
                                className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-sm font-semibold transition-colors border border-red-200"
                            >
                                <Trash2 size={14} /> Delete Stream Session
                            </button>
                        </div>
                    )}
                </div>

                {/* RIGHT: Preview (2 cols) */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Live Preview */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Play size={15} className="text-blue-600" />
                            <h3 className="font-bold text-gray-900 text-sm">Live Preview</h3>
                        </div>
                        <div className="rounded-xl overflow-hidden bg-gray-900 aspect-video">
                            {previewId ? (
                                <iframe
                                    key={previewId}
                                    src={`https://www.youtube.com/embed/${previewId}?autoplay=0&rel=0&modestbranding=1`}
                                    title="Live preview"
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                                    <MonitorPlay size={40} className="mb-3 opacity-40" />
                                    <p className="text-sm font-medium opacity-60">Paste a YouTube URL above</p>
                                    <p className="text-xs opacity-40 mt-1">to see a preview here</p>
                                </div>
                            )}
                        </div>
                        {previewId && (
                            <p className="text-xs text-gray-400 mt-3 font-mono text-center">ID: {previewId}</p>
                        )}
                    </div>

                    {/* Status Summary Card */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                        <h3 className="font-bold text-gray-900 text-sm">Stream Summary</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500 font-medium">Status</span>
                                <span className={`px-2.5 py-1 text-xs font-bold rounded-full ring-1 ${statusCfg.color} ${statusCfg.ring}`}>
                                    {statusCfg.label}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500 font-medium">Video ID</span>
                                <span className="text-xs font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded">
                                    {previewId || '—'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500 font-medium">Live Chat</span>
                                <span className={`text-xs font-semibold ${form.chatEnabled ? 'text-green-600' : 'text-gray-400'}`}>
                                    {form.chatEnabled ? 'Enabled' : 'Disabled'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500 font-medium">Viewer Count</span>
                                <span className="text-xs font-bold text-gray-900">{form.viewerCount.toLocaleString()}</span>
                            </div>
                            {form.scheduledAt && form.status === 'scheduled' && (
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500 font-medium">Scheduled For</span>
                                    <span className="text-xs text-gray-700 font-medium">
                                        {new Date(form.scheduledAt).toLocaleString()}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Quick Status Switcher */}
                        <div className="pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-400 font-medium mb-2">Quick switch</p>
                            <div className="flex gap-2 flex-wrap">
                                {['offline', 'scheduled', 'live', 'ended'].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => handleStatusChange(s)}
                                        disabled={saving || form.status === s}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all capitalize disabled:opacity-40 ${
                                            form.status === s
                                                ? 'bg-blue-700 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        {s === 'live' ? '🔴 Live' : s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Viewer Page Link */}
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white">
                        <p className="text-xs font-bold uppercase tracking-wider text-blue-200 mb-1">Viewer Page</p>
                        <p className="font-bold text-lg mb-1">Public Live Page</p>
                        <p className="text-blue-100 text-sm mb-4">Share this with your audience to watch the stream.</p>
                        <a
                            href="/live"
                            target="_blank"
                            className="inline-flex items-center gap-2 bg-white text-blue-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-50 transition-colors"
                        >
                            <Eye size={14} />
                            Open /live page
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
