'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { PlayCircle, Lock, Layers, Clock, Search, BookOpen } from 'lucide-react';

export default function VideoCoursesPublicPage() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetch('/api/video-courses?status=published')
            .then(r => r.json())
            .then(d => { if (d.success) setCourses(d.data); })
            .finally(() => setLoading(false));
    }, []);

    const totalEpisodes = (course) =>
        course.chapters?.reduce((a, ch) => a + (ch.episodes?.length || 0), 0) || 0;

    const filtered = courses.filter(c => {
        const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
            (c.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase()));
        const matchFilter = filter === 'all' || (filter === 'free' ? !c.isPaid : c.isPaid);
        return matchSearch && matchFilter;
    });

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            {/* Hero */}
            <div className="pt-32 pb-16 bg-gradient-to-b from-indigo-50/60 to-white border-b border-indigo-100/50">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wide mb-6">
                        <PlayCircle size={12} /> Video Courses
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold text-gray-900 tracking-tight mb-5">
                        Learn by <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">building</span>
                    </h1>
                    <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10">
                        Structured video courses with real-world projects, step-by-step chapters, and production-ready code.
                    </p>

                    {/* Search + Filter */}
                    <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Search courses..."
                                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm shadow-sm"
                            />
                        </div>
                        <div className="flex bg-gray-100 p-1 rounded-xl">
                            {['all', 'free', 'paid'].map(f => (
                                <button key={f} onClick={() => setFilter(f)}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Course Grid */}
            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => <div key={i} className="bg-gray-100 rounded-2xl h-80 animate-pulse" />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-24 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                        <BookOpen className="mx-auto text-gray-300 mb-4" size={40} />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses found</h3>
                        <p className="text-gray-500 text-sm">Try adjusting your search or filter.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filtered.map(course => (
                            <Link key={course._id} href={`/video-courses/${course.slug}`}
                                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col">

                                {/* Thumbnail */}
                                <div className="relative aspect-video bg-gray-100 overflow-hidden">
                                    {course.thumbnail ? (
                                        <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center">
                                            <PlayCircle className="text-indigo-300" size={40} />
                                        </div>
                                    )}
                                    {/* Play overlay */}
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                                            <PlayCircle className="text-indigo-600" size={28} />
                                        </div>
                                    </div>
                                    {/* Badges */}
                                    <div className="absolute top-3 left-3 flex gap-2">
                                        <span className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${course.isPaid ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'}`}>
                                            {course.isPaid ? <><Lock size={10} /> Paid</> : <>Free</>}
                                        </span>
                                    </div>
                                    <div className="absolute top-3 right-3">
                                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-black/40 text-white backdrop-blur-sm">{course.level}</span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-5 flex flex-col flex-1">
                                    <h3 className="font-bold text-gray-900 mb-2 leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2">{course.title}</h3>
                                    <p className="text-sm text-gray-500 line-clamp-2 mb-4 leading-relaxed flex-1">{course.description}</p>

                                    {course.tags?.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mb-4">
                                            {course.tags.slice(0, 3).map(t => (
                                                <span key={t} className="text-[10px] font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full">{t}</span>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-4 text-xs text-gray-400 pt-4 border-t border-gray-50 mt-auto">
                                        <span className="flex items-center gap-1"><Layers size={12} /> {course.chapters?.length || 0} chapters</span>
                                        <span className="flex items-center gap-1"><PlayCircle size={12} /> {totalEpisodes(course)} episodes</span>
                                        <span className="ml-auto font-semibold text-indigo-600 group-hover:underline">Start Learning →</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            <footer className="py-12 bg-white border-t border-gray-100 text-center">
                <p className="text-gray-400 text-sm">© {new Date().getFullYear()} LearnMade. All rights reserved.</p>
            </footer>
        </div>
    );
}
