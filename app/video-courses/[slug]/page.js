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
        <div className="min-h-screen bg-white">
            <Navbar />

            <div className="pt-16 flex flex-col h-screen">
                {/* Top bar */}
                <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4 shrink-0">
                    <Link href="/video-courses" className="flex items-center gap-2 text-gray-500 hover:text-blue-700 transition-colors text-sm font-medium">
                        <ArrowLeft size={16} /> All Courses
                    </Link>
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-900 text-sm font-bold truncate">{course.title}</span>
                    <div className="ml-auto flex items-center gap-2">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded shadow-sm ${course.isPaid ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-green-100 text-green-800 border border-green-200'}`}>
                            {course.isPaid ? <><Lock size={10} className="inline mr-1" />Paid</> : <><Globe size={10} className="inline mr-1" />Free</>}
                        </span>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Video Player & Info Area */}
                    <div className="flex-1 flex flex-col overflow-y-auto bg-gray-50">
                        {/* Video */}
                        <div className="relative w-full bg-black shadow-inner" style={{ paddingBottom: '56.25%' }}>
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
                                        <p className="text-gray-400 text-sm">Select an episode to start watching</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="max-w-5xl mx-auto w-full px-8 py-8 space-y-8">
                            {/* Episode Info */}
                            {currentEp && (
                                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">
                                                Chapter {activeEpisode.ci + 1} · Lesson {activeEpisode.ei + 1}
                                            </p>
                                            <h2 className="text-2xl font-bold text-gray-900">{currentEp.title}</h2>
                                            {currentEp.duration && (
                                                <p className="text-sm text-gray-500 mt-2 flex items-center gap-1.5">
                                                    <Clock size={14} /> {currentEp.duration}
                                                </p>
                                            )}
                                        </div>
                                        {currentEp.isFree && (
                                            <span className="shrink-0 text-xs font-bold px-3 py-1.5 bg-green-100 text-green-800 border border-green-200 rounded">
                                                Free Preview
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Course Info */}
                            <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
                                <h3 className="text-xl font-bold text-gray-900 mb-4 pb-4 border-b border-gray-100">About this course</h3>
                                <p className="text-gray-700 leading-relaxed">{course.description}</p>
                                
                                <div className="flex flex-wrap gap-2 mt-6">
                                    {course.tags?.map(t => (
                                        <span key={t} className="text-xs font-semibold px-3 py-1 bg-gray-100 text-gray-700 rounded-md border border-gray-200">{t}</span>
                                    ))}
                                </div>
                                
                                <div className="flex items-center gap-8 mt-8 pt-6 border-t border-gray-100 text-sm text-gray-600 font-medium">
                                    <span className="flex items-center gap-2"><Layers size={16} className="text-blue-600" /> {course.chapters?.length} Modules</span>
                                    <span className="flex items-center gap-2"><PlayCircle size={16} className="text-blue-600" /> {totalEpisodes} Lessons</span>
                                    <span className="flex items-center gap-2"><BookOpen size={16} className="text-blue-600" /> English</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Curriculum Sidebar */}
                    <div className="w-[350px] bg-white border-l border-gray-200 flex flex-col shrink-0 overflow-y-auto shadow-xl z-10">
                        <div className="p-6 border-b border-gray-200 bg-gray-50/50 sticky top-0 z-10 backdrop-blur-sm">
                            <h3 className="font-bold text-gray-900 text-base">Course Curriculum</h3>
                            <p className="text-xs text-gray-500 mt-1">{course.chapters?.length} modules • {totalEpisodes} lessons</p>
                        </div>

                        <div className="flex-1">
                            {course.chapters?.map((chapter, ci) => (
                                <div key={ci} className="border-b border-gray-200">
                                    {/* Chapter header */}
                                    <button
                                        onClick={() => toggleChapter(ci)}
                                        className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors text-left bg-white"
                                    >
                                        <div className="w-8 h-8 bg-gray-100 text-gray-700 rounded flex items-center justify-center text-sm font-bold shrink-0">
                                            {ci + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-900 truncate">{chapter.title || `Module ${ci + 1}`}</p>
                                            <p className="text-[11px] text-gray-500 mt-1 font-medium">{chapter.episodes?.length} lessons</p>
                                        </div>
                                        {expandedChapters[ci] ? <ChevronUp size={16} className="text-gray-400 shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
                                    </button>

                                    {/* Episodes */}
                                    {expandedChapters[ci] && chapter.episodes?.map((ep, ei) => {
                                        const isActive = activeEpisode?.ci === ci && activeEpisode?.ei === ei;
                                        return (
                                            <button
                                                key={ei}
                                                onClick={() => setActiveEpisode({ ci, ei })}
                                                className={`w-full flex items-start gap-4 px-6 py-4 hover:bg-gray-50 transition-colors text-left border-t border-gray-100 ${isActive ? 'bg-blue-50/50 border-l-4 border-l-blue-600 pl-5' : ''}`}
                                            >
                                                <div className="shrink-0 mt-0.5">
                                                    {isActive
                                                        ? <PlayCircle size={16} className="text-blue-700" />
                                                        : <PlayCircle size={16} className="text-gray-400" />
                                                    }
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm leading-snug ${isActive ? 'font-bold text-blue-900' : 'font-medium text-gray-700'}`}>{ep.title}</p>
                                                    <div className="flex items-center gap-3 mt-1.5">
                                                        {ep.duration && <span className="text-[11px] text-gray-500 font-medium flex items-center gap-1"><Clock size={10} />{ep.duration}</span>}
                                                        {ep.isFree && <span className="text-[10px] font-bold text-green-700 uppercase tracking-wide">Free</span>}
                                                    </div>
                                                </div>
                                                {isActive && <CheckCircle2 size={16} className="text-blue-600 shrink-0 mt-0.5" />}
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
