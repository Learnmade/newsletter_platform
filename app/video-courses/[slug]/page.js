'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import {
    PlayCircle, Lock, ChevronDown, ChevronUp, CheckCircle2,
    Layers, ArrowLeft, Clock, Globe
} from 'lucide-react';

function getYouTubeEmbedUrl(url) {
    if (!url) return null;
    try {
        // youtu.be/ID or youtube.com/watch?v=ID or youtube.com/embed/ID
        const regexps = [
            /youtu\.be\/([a-zA-Z0-9_-]{11})/,
            /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
            /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
        ];
        for (const re of regexps) {
            const m = url.match(re);
            if (m) return `https://www.youtube.com/embed/${m[1]}?rel=0&modestbranding=1`;
        }
        return url; // fallback — return as-is
    } catch { return url; }
}

export default function VideoCoursePage() {
    const { slug } = useParams();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeEpisode, setActiveEpisode] = useState(null); // { chapterIdx, episodeIdx }
    const [expandedChapters, setExpandedChapters] = useState({});

    useEffect(() => {
        fetch(`/api/video-courses/${slug}`)
            .then(r => r.json())
            .then(d => {
                if (d.success && d.data.status === 'published') {
                    setCourse(d.data);
                    // Set first episode as active
                    if (d.data.chapters?.[0]?.episodes?.[0]) {
                        setActiveEpisode({ ci: 0, ei: 0 });
                        setExpandedChapters({ 0: true });
                    }
                }
            })
            .finally(() => setLoading(false));
    }, [slug]);

    const toggleChapter = (ci) => setExpandedChapters(prev => ({ ...prev, [ci]: !prev[ci] }));

    const currentEp = activeEpisode != null
        ? course?.chapters?.[activeEpisode.ci]?.episodes?.[activeEpisode.ei]
        : null;

    const totalEpisodes = course?.chapters?.reduce((a, ch) => a + (ch.episodes?.length || 0), 0) || 0;

    if (loading) {
        return (
            <div className="min-h-screen bg-white">
                <Navbar />
                <div className="flex items-center justify-center h-[80vh]">
                    <div className="animate-pulse flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-indigo-100 rounded-full" />
                        <div className="h-4 w-40 bg-gray-200 rounded" />
                    </div>
                </div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="min-h-screen bg-white">
                <Navbar />
                <div className="flex flex-col items-center justify-center h-[80vh] text-center">
                    <PlayCircle className="text-gray-200 mb-4" size={56} />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Course not found</h2>
                    <p className="text-gray-500 mb-6">This course may not exist or hasn't been published yet.</p>
                    <Link href="/video-courses" className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm">
                        Browse All Courses
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950">
            <Navbar />

            <div className="pt-16">
                {/* Top bar */}
                <div className="bg-gray-900 border-b border-white/5 px-6 py-3 flex items-center gap-4">
                    <Link href="/video-courses" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
                        <ArrowLeft size={15} /> All Courses
                    </Link>
                    <span className="text-gray-700">/</span>
                    <span className="text-gray-300 text-sm font-medium truncate">{course.title}</span>
                    <div className="ml-auto flex items-center gap-2">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${course.isPaid ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                            {course.isPaid ? <><Lock size={10} className="inline mr-1" />Paid</> : <><Globe size={10} className="inline mr-1" />Free</>}
                        </span>
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/10 text-gray-300">{course.level}</span>
                    </div>
                </div>

                <div className="flex h-[calc(100vh-112px)]">
                    {/* Video Player */}
                    <div className="flex-1 flex flex-col bg-black overflow-y-auto">
                        {/* Video */}
                        <div className="relative w-full bg-black" style={{ paddingBottom: '56.25%' }}>
                            {currentEp ? (
                                <iframe
                                    key={currentEp.videoUrl}
                                    src={getYouTubeEmbedUrl(currentEp.videoUrl)}
                                    className="absolute inset-0 w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    title={currentEp.title}
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                                    <div className="text-center">
                                        <PlayCircle className="text-gray-600 mx-auto mb-3" size={48} />
                                        <p className="text-gray-500 text-sm">Select an episode to start watching</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Episode Info */}
                        {currentEp && (
                            <div className="bg-gray-900 px-8 py-6 border-t border-white/5">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-xs text-indigo-400 font-semibold uppercase tracking-wider mb-1">
                                            Chapter {activeEpisode.ci + 1} · Episode {activeEpisode.ei + 1}
                                        </p>
                                        <h2 className="text-xl font-bold text-white">{currentEp.title}</h2>
                                        {currentEp.duration && (
                                            <p className="text-sm text-gray-400 mt-1 flex items-center gap-1.5">
                                                <Clock size={13} /> {currentEp.duration}
                                            </p>
                                        )}
                                    </div>
                                    {currentEp.isFree && (
                                        <span className="shrink-0 text-xs font-bold px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
                                            Free Preview
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Course Info (below video) */}
                        <div className="bg-gray-900 px-8 py-8 border-t border-white/5">
                            <h3 className="text-lg font-bold text-white mb-3">About this course</h3>
                            <p className="text-gray-400 leading-relaxed text-sm">{course.description}</p>
                            <div className="flex flex-wrap gap-2 mt-5">
                                {course.tags?.map(t => (
                                    <span key={t} className="text-xs px-3 py-1 bg-white/5 text-gray-400 rounded-full border border-white/10">{t}</span>
                                ))}
                            </div>
                            <div className="flex items-center gap-6 mt-6 text-sm text-gray-500">
                                <span className="flex items-center gap-1.5"><Layers size={14} /> {course.chapters?.length} chapters</span>
                                <span className="flex items-center gap-1.5"><PlayCircle size={14} /> {totalEpisodes} episodes</span>
                            </div>
                        </div>
                    </div>

                    {/* Curriculum Sidebar */}
                    <div className="w-80 bg-gray-900 border-l border-white/5 flex flex-col shrink-0 overflow-y-auto">
                        <div className="p-5 border-b border-white/5">
                            <h3 className="font-bold text-white text-sm">Course Content</h3>
                            <p className="text-xs text-gray-500 mt-0.5">{course.chapters?.length} chapters · {totalEpisodes} episodes</p>
                        </div>

                        <div className="flex-1">
                            {course.chapters?.map((chapter, ci) => (
                                <div key={ci} className="border-b border-white/5">
                                    {/* Chapter header */}
                                    <button
                                        onClick={() => toggleChapter(ci)}
                                        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/5 transition-colors text-left"
                                    >
                                        <div className="w-6 h-6 bg-indigo-500/20 text-indigo-400 rounded flex items-center justify-center text-[10px] font-bold shrink-0">
                                            {ci + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-200 truncate">{chapter.title || `Chapter ${ci + 1}`}</p>
                                            <p className="text-[11px] text-gray-500 mt-0.5">{chapter.episodes?.length} episodes</p>
                                        </div>
                                        {expandedChapters[ci] ? <ChevronUp size={14} className="text-gray-500 shrink-0" /> : <ChevronDown size={14} className="text-gray-500 shrink-0" />}
                                    </button>

                                    {/* Episodes */}
                                    {expandedChapters[ci] && chapter.episodes?.map((ep, ei) => {
                                        const isActive = activeEpisode?.ci === ci && activeEpisode?.ei === ei;
                                        return (
                                            <button
                                                key={ei}
                                                onClick={() => setActiveEpisode({ ci, ei })}
                                                className={`w-full flex items-center gap-3 px-5 py-3 hover:bg-white/5 transition-colors text-left ${isActive ? 'bg-indigo-500/10 border-l-2 border-indigo-500' : ''}`}
                                            >
                                                <div className="shrink-0">
                                                    {isActive
                                                        ? <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center"><PlayCircle size={10} className="text-white" /></div>
                                                        : <div className="w-5 h-5 bg-white/10 rounded-full flex items-center justify-center text-[9px] font-bold text-gray-500">{ei + 1}</div>
                                                    }
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-xs font-medium truncate ${isActive ? 'text-indigo-300' : 'text-gray-400'}`}>{ep.title}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        {ep.duration && <span className="text-[10px] text-gray-600 flex items-center gap-0.5"><Clock size={9} />{ep.duration}</span>}
                                                        {ep.isFree && <span className="text-[9px] font-bold text-emerald-500">FREE</span>}
                                                    </div>
                                                </div>
                                                {isActive && <CheckCircle2 size={14} className="text-indigo-400 shrink-0" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
