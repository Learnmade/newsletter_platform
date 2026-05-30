'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft, ArrowRight, Check, PlayCircle, Plus, Trash2,
    Image as ImageIcon, Loader2, ChevronDown, ChevronUp, Globe, Lock
} from 'lucide-react';

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

const defaultEpisode = () => ({ title: '', videoUrl: '', duration: '', isFree: false, order: 0 });
const defaultChapter = () => ({ title: '', order: 0, episodes: [defaultEpisode()] });

export default function CreateVideoCoursePage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [expandedChapter, setExpandedChapter] = useState(0);

    const [info, setInfo] = useState({
        title: '', slug: '', thumbnail: '', description: '',
        tags: '', level: 'Beginner', status: 'draft', isPaid: false,
    });
    const [chapters, setChapters] = useState([defaultChapter()]);

    // ── Step 1 handlers ──────────────────────────────────────────
    const handleInfoChange = (e) => {
        const { name, value } = e.target;
        setInfo(prev => ({
            ...prev,
            [name]: value,
            ...(name === 'title' && !prev.slug
                ? { slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }
                : {}),
        }));
    };

    const handleThumbnailUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        const data = new FormData();
        data.append('file', file);
        try {
            const res = await fetch('/api/upload', { method: 'POST', body: data });
            const json = await res.json();
            if (json.success) setInfo(prev => ({ ...prev, thumbnail: json.url }));
            else alert('Upload failed: ' + json.error);
        } catch { alert('Upload failed'); }
        finally { setUploading(false); }
    };

    // ── Step 2 handlers ──────────────────────────────────────────
    const addChapter = () => {
        setChapters(prev => [...prev, { ...defaultChapter(), order: prev.length }]);
        setExpandedChapter(chapters.length);
    };

    const removeChapter = (ci) => setChapters(prev => prev.filter((_, i) => i !== ci));

    const updateChapterTitle = (ci, val) =>
        setChapters(prev => prev.map((ch, i) => i === ci ? { ...ch, title: val } : ch));

    const addEpisode = (ci) =>
        setChapters(prev => prev.map((ch, i) => i === ci
            ? { ...ch, episodes: [...ch.episodes, { ...defaultEpisode(), order: ch.episodes.length }] }
            : ch));

    const removeEpisode = (ci, ei) =>
        setChapters(prev => prev.map((ch, i) => i === ci
            ? { ...ch, episodes: ch.episodes.filter((_, j) => j !== ei) }
            : ch));

    const updateEpisode = (ci, ei, field, val) =>
        setChapters(prev => prev.map((ch, i) => i === ci
            ? { ...ch, episodes: ch.episodes.map((ep, j) => j === ei ? { ...ep, [field]: val } : ep) }
            : ch));

    // ── Submit ───────────────────────────────────────────────────
    const handleSubmit = async () => {
        setLoading(true);
        try {
            const payload = {
                ...info,
                tags: info.tags.split(',').map(t => t.trim()).filter(Boolean),
                chapters: chapters.map((ch, ci) => ({
                    ...ch,
                    order: ci,
                    episodes: ch.episodes.map((ep, ei) => ({ ...ep, order: ei })),
                })),
            };
            const res = await fetch('/api/video-courses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (data.success) {
                router.push('/admin/video-courses');
            } else {
                alert('Error: ' + (data.error || 'Something went wrong'));
            }
        } catch { alert('Failed to create course'); }
        finally { setLoading(false); }
    };

    const totalEpisodes = chapters.reduce((acc, ch) => acc + ch.episodes.length, 0);

    return (
        <div className="min-h-screen bg-gray-50/50 pb-32">
            {/* Top Bar */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/video-courses" className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-700 transition-colors">
                            <ArrowLeft size={18} />
                        </Link>
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-blue-700 rounded-lg flex items-center justify-center">
                                <PlayCircle size={13} className="text-white" />
                            </div>
                            <span className="font-semibold text-gray-900 text-sm">New Video Course</span>
                        </div>
                    </div>

                    {/* Step Indicator */}
                    <div className="flex items-center gap-2">
                        {[1, 2, 3].map(s => (
                            <div key={s} className="flex items-center gap-2">
                                <button
                                    onClick={() => s < step && setStep(s)}
                                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                                        ${step === s ? 'bg-blue-700 text-white shadow-sm' :
                                        step > s ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'}`}
                                >
                                    {step > s ? <Check size={12} /> : s}
                                </button>
                                {s < 3 && <div className={`w-8 h-0.5 rounded-full ${step > s ? 'bg-emerald-400' : 'bg-gray-200'}`} />}
                            </div>
                        ))}
                    </div>

                    <div className="text-xs text-gray-400 font-medium">
                        {step === 1 ? 'Course Info' : step === 2 ? 'Curriculum' : 'Review'}
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-10">

                {/* ─── STEP 1: Course Info ─────────────────────────────── */}
                {step === 1 && (
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Course Details</h2>
                            <p className="text-sm text-gray-500 mt-1">Basic info students will see on the course card.</p>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Course Title <span className="text-red-400">*</span></label>
                                <input
                                    name="title" value={info.title} onChange={handleInfoChange}
                                    placeholder="e.g. Complete React & Next.js Masterclass"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400 shadow-sm"
                                />
                            </div>

                            {/* Slug + Level */}
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Slug</label>
                                    <input
                                        name="slug" value={info.slug} onChange={handleInfoChange}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-mono text-sm text-gray-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Level</label>
                                    <select
                                        name="level" value={info.level} onChange={handleInfoChange}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium text-gray-700"
                                    >
                                        {LEVELS.map(l => <option key={l}>{l}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Thumbnail */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Thumbnail <span className="text-red-400">*</span></label>
                                <div className="relative">
                                    {!info.thumbnail ? (
                                        <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-10 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all group">
                                            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                                                {uploading ? <Loader2 size={22} className="animate-spin text-blue-600" /> : <ImageIcon size={22} className="text-blue-500" />}
                                            </div>
                                            <p className="text-sm font-bold text-gray-700">{uploading ? 'Uploading...' : 'Click to upload thumbnail'}</p>
                                            <p className="text-xs text-gray-400 mt-1">PNG, JPG, WebP — 16:9 recommended</p>
                                            <input type="file" accept="image/*" className="hidden" onChange={handleThumbnailUpload} disabled={uploading} />
                                        </label>
                                    ) : (
                                        <div className="relative rounded-xl overflow-hidden aspect-video shadow-sm border border-gray-100 group">
                                            <img src={info.thumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button type="button" onClick={() => setInfo(p => ({ ...p, thumbnail: '' }))}
                                                    className="p-2 bg-white text-red-500 rounded-full hover:bg-red-50">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Description <span className="text-red-400">*</span></label>
                                <textarea
                                    name="description" value={info.description} onChange={handleInfoChange}
                                    rows={4} placeholder="What will students learn? What makes this course special?"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm leading-relaxed resize-none"
                                />
                            </div>

                            {/* Tags + Status + isPaid */}
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tags <span className="text-gray-400 font-normal">(comma separated)</span></label>
                                    <input
                                        name="tags" value={info.tags} onChange={handleInfoChange}
                                        placeholder="React, Next.js, TypeScript"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Publish Status</label>
                                    <select
                                        name="status" value={info.status} onChange={handleInfoChange}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium text-gray-700"
                                    >
                                        <option value="draft">Draft</option>
                                        <option value="published">Published</option>
                                    </select>
                                </div>
                            </div>

                            {/* Pricing */}
                            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
                                <div>
                                    <p className="text-sm font-semibold text-gray-800">Paid Course</p>
                                    <p className="text-xs text-gray-500 mt-0.5">Free courses are accessible to everyone. Paid courses show a lock badge.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setInfo(prev => ({ ...prev, isPaid: !prev.isPaid }))}
                                    className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                                        info.isPaid ? 'bg-amber-500' : 'bg-gray-200'
                                    }`}
                                >
                                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                                        info.isPaid ? 'translate-x-6' : 'translate-x-0'
                                    }`} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── STEP 2: Curriculum ──────────────────────────────── */}
                {step === 2 && (
                    <div className="space-y-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Curriculum</h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    {chapters.length} chapters · {totalEpisodes} episodes
                                </p>
                            </div>
                            <button
                                onClick={addChapter}
                                className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors"
                            >
                                <Plus size={16} /> Add Chapter
                            </button>
                        </div>

                        <div className="space-y-4">
                            {chapters.map((chapter, ci) => (
                                <div key={ci} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    {/* Chapter Header */}
                                    <div
                                        className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                        onClick={() => setExpandedChapter(expandedChapter === ci ? -1 : ci)}
                                    >
                                        <div className="w-7 h-7 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center text-xs font-bold shrink-0">
                                            {ci + 1}
                                        </div>
                                        <input
                                            value={chapter.title}
                                            onChange={(e) => { e.stopPropagation(); updateChapterTitle(ci, e.target.value); }}
                                            onClick={e => e.stopPropagation()}
                                            placeholder={`Chapter ${ci + 1} title`}
                                            className="flex-1 bg-transparent font-semibold text-gray-900 text-sm outline-none placeholder:text-gray-400 placeholder:font-normal"
                                        />
                                        <span className="text-xs text-gray-400 mr-2">{chapter.episodes.length} episodes</span>
                                        {chapters.length > 1 && (
                                            <button onClick={(e) => { e.stopPropagation(); removeChapter(ci); }}
                                                className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                        {expandedChapter === ci ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                                    </div>

                                    {/* Episodes */}
                                    {expandedChapter === ci && (
                                        <div className="border-t border-gray-100 divide-y divide-gray-50">
                                            {chapter.episodes.map((ep, ei) => (
                                                <div key={ei} className="px-5 py-4 space-y-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center text-[10px] font-bold text-gray-500 shrink-0">
                                                            {ei + 1}
                                                        </div>
                                                        <input
                                                            value={ep.title}
                                                            onChange={e => updateEpisode(ci, ei, 'title', e.target.value)}
                                                            placeholder="Episode title"
                                                            className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
                                                        />
                                                        <button onClick={() => removeEpisode(ci, ei)}
                                                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center gap-3 pl-9">
                                                        <input
                                                            value={ep.videoUrl}
                                                            onChange={e => updateEpisode(ci, ei, 'videoUrl', e.target.value)}
                                                            placeholder="YouTube URL (e.g. https://youtu.be/...)"
                                                            className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all font-mono"
                                                        />
                                                        <input
                                                            value={ep.duration}
                                                            onChange={e => updateEpisode(ci, ei, 'duration', e.target.value)}
                                                            placeholder="12:30"
                                                            className="w-20 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-400 transition-all text-center font-mono"
                                                        />
                                                        <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 cursor-pointer select-none whitespace-nowrap">
                                                            <input
                                                                type="checkbox"
                                                                checked={ep.isFree}
                                                                onChange={e => updateEpisode(ci, ei, 'isFree', e.target.checked)}
                                                                className="w-4 h-4 rounded accent-indigo-600"
                                                            />
                                                            Free preview
                                                        </label>
                                                    </div>
                                                </div>
                                            ))}

                                            <div className="px-5 py-3 bg-gray-50">
                                                <button
                                                    onClick={() => addEpisode(ci)}
                                                    className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                                                >
                                                    <Plus size={13} /> Add Episode
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ─── STEP 3: Review ──────────────────────────────────── */}
                {step === 3 && (
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Review & Publish</h2>
                            <p className="text-sm text-gray-500 mt-1">Check everything looks good before publishing.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Preview Card */}
                            <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                {info.thumbnail && (
                                    <div className="aspect-video bg-gray-100">
                                        <img src={info.thumbnail} alt="" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <div className="p-6 space-y-4">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${info.status === 'published' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                            {info.status === 'published' ? '🌐 Published' : '🔒 Draft'}
                                        </span>
                                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">{info.level}</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900">{info.title || 'Untitled Course'}</h3>
                                    <p className="text-sm text-gray-500 leading-relaxed">{info.description || 'No description'}</p>
                                    {info.tags && (
                                        <div className="flex flex-wrap gap-2">
                                            {info.tags.split(',').filter(Boolean).map(t => (
                                                <span key={t.trim()} className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full font-medium">{t.trim()}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Curriculum Summary */}
                            <div className="space-y-4">
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                    <h4 className="font-semibold text-gray-900 mb-3 text-sm">Curriculum Summary</h4>
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Chapters</span>
                                            <span className="font-bold text-gray-900">{chapters.length}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Episodes</span>
                                            <span className="font-bold text-gray-900">{totalEpisodes}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Free previews</span>
                                            <span className="font-bold text-gray-900">
                                                {chapters.reduce((a, ch) => a + ch.episodes.filter(e => e.isFree).length, 0)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-2">
                                    <h4 className="font-semibold text-gray-900 mb-3 text-sm">Chapters</h4>
                                    {chapters.map((ch, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                            <div className="w-5 h-5 bg-indigo-100 text-indigo-700 rounded flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</div>
                                            <span className="truncate">{ch.title || `Chapter ${i + 1}`}</span>
                                            <span className="ml-auto text-xs text-gray-400 shrink-0">{ch.episodes.length} ep</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── Navigation Buttons ───────────────────────────────── */}
                <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-200">
                    <button
                        onClick={() => setStep(s => s - 1)}
                        disabled={step === 1}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ArrowLeft size={16} /> Previous
                    </button>

                    {step < 3 ? (
                        <button
                            onClick={() => setStep(s => s + 1)}
                            className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all"
                        >
                            Next Step <ArrowRight size={16} />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            id="publish-video-course-btn"
                            className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-sm transition-all disabled:opacity-70"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : (info.status === 'published' ? <Globe size={16} /> : <Lock size={16} />)}
                            {loading ? 'Publishing...' : (info.status === 'published' ? 'Publish Course' : 'Save as Draft')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
