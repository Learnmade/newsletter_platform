'use client';

import { useState, useEffect, Suspense } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { ArrowRight, Clock, Eye, Code2, Terminal, Zap, Layers, CheckCircle2, Search, PlayCircle, Lock, Calendar, Users } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function HomeContent() {
    const [courses, setCourses] = useState([]);
    const [videoCourses, setVideoCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [liveStream, setLiveStream] = useState(null);
    const searchParams = useSearchParams();
    const rawQuery = searchParams.get('search');
    const searchQuery = rawQuery?.trim() || null; // treat empty string as null

    // Subscription State
    const [email, setEmail] = useState('');
    const [honey, setHoney] = useState(''); // Honeypot state
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchCourses();
        fetch('/api/video-courses?status=published')
            .then(r => r.json())
            .then(d => { if (d.success) setVideoCourses(d.data.slice(0, 3)); });
        // Fetch live stream status
        fetch('/api/livestream')
            .then(r => r.json())
            .then(d => { if (d.success && d.data?.status === 'live') setLiveStream(d.data); })
            .catch(() => {});
    }, [searchQuery]);

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const url = searchQuery ? `/api/courses?search=${searchQuery}` : '/api/courses';
            const res = await fetch(url);
            const data = await res.json();
            if (data.success) {
                setCourses(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch courses', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribe = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage(null);

        if (honey) {
            setMessage({ type: 'success', text: 'Successfully subscribed! Check your inbox.' });
            setEmail('');
            setSubmitting(false);
            return;
        }

        try {
            const res = await fetch('/api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, confirm_email_address: honey }),
            });
            const data = await res.json();

            if (data.success) {
                setMessage({ type: 'success', text: data.message });
                setEmail('');
            } else {
                setMessage({ type: 'error', text: data.error });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            {/* 🔴 LIVE NOW Banner */}
            {liveStream && (
                <div className="bg-red-600 text-white py-3 px-4 shadow-lg animate-in slide-in-from-top">
                    <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-sm font-bold">
                                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                LIVE
                            </div>
                            <p className="font-semibold text-sm md:text-base truncate max-w-sm">
                                {liveStream.title || 'Live Stream is happening now!'}
                            </p>
                        </div>
                        <a
                            href="/live"
                            className="flex items-center gap-2 bg-white text-red-600 px-4 py-1.5 rounded-full text-sm font-bold hover:bg-red-50 transition-colors whitespace-nowrap shrink-0"
                        >
                            Watch Live →
                        </a>
                    </div>
                </div>
            )}

            {/* Hero Section */}
            <div className="bg-white border-b border-gray-200 pt-16 pb-24 lg:pt-24 lg:pb-32">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight leading-tight mb-6">
                                Advance your career with <span className="text-blue-700">production-ready</span> development skills.
                            </h1>
                            <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-lg">
                                Build real-world applications from scratch. Master Next.js, React, and modern web architecture with expert-led structured courses.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link href="#courses" className="bg-blue-700 text-white px-8 py-4 rounded font-bold hover:bg-blue-800 transition-colors text-center text-lg shadow-sm">
                                    Explore Courses
                                </Link>
                                <Link href="/signup" className="bg-white text-blue-700 border border-blue-700 px-8 py-4 rounded font-bold hover:bg-blue-50 transition-colors text-center text-lg">
                                    Join for Free
                                </Link>
                            </div>
                        </div>

                        {/* Professional Graphic Placeholder */}
                        <div className="hidden lg:block relative">
                            <div className="aspect-square bg-gray-100 rounded-full absolute -right-20 -top-20 w-[600px] h-[600px] opacity-50 pointer-events-none" />
                            <div className="relative bg-white p-8 rounded-2xl shadow-2xl border border-gray-100 z-10 flex flex-col items-center text-center">
                                <Code2 size={64} className="text-blue-700 mb-6" />
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Learn by Building</h3>
                                <p className="text-gray-500 mb-8">Access 100+ hours of structured video content and source code.</p>
                                <div className="flex gap-4 w-full">
                                    <div className="flex-1 bg-blue-50 rounded-xl p-4">
                                        <div className="text-2xl font-bold text-blue-700">50+</div>
                                        <div className="text-sm text-gray-600 font-medium">Projects</div>
                                    </div>
                                    <div className="flex-1 bg-blue-50 rounded-xl p-4">
                                        <div className="text-2xl font-bold text-blue-700">10k+</div>
                                        <div className="text-sm text-gray-600 font-medium">Students</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Video Courses Section */}
            {videoCourses.length > 0 && (
                <div className="py-20 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
                        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                            <div>
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">Guided Video Courses</h2>
                                <p className="text-gray-600">Step-by-step video instruction to build comprehensive projects.</p>
                            </div>
                            <Link href="/video-courses" className="flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-800 whitespace-nowrap">
                                View All <ArrowRight size={16} />
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {videoCourses.map(course => (
                                <Link key={course._id} href={`/video-courses/${course.slug}`}
                                    className="group bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-all overflow-hidden flex flex-col h-full">
                                    <div className="relative aspect-video bg-gray-100 overflow-hidden border-b border-gray-100">
                                        {course.thumbnail
                                            ? <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            : <div className="w-full h-full flex items-center justify-center"><PlayCircle className="text-gray-400" size={40} /></div>}
                                        <div className="absolute top-3 left-3 flex gap-2">
                                            <span className={`text-xs font-bold px-2 py-1 rounded shadow-sm ${course.isPaid ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                                                {course.isPaid ? 'Paid' : 'Free'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-6 flex-1 flex flex-col">
                                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{course.level}</div>
                                        <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2 group-hover:text-blue-700 transition-colors">{course.title}</h3>
                                        <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-1">{course.description}</p>
                                        <div className="flex items-center justify-between text-xs font-medium text-gray-500 pt-4 border-t border-gray-100 mt-auto">
                                            <div className="flex gap-4">
                                                <span className="flex items-center gap-1"><Layers size={14} />{course.chapters?.length || 0} Modules</span>
                                                <span className="flex items-center gap-1"><PlayCircle size={14} />{course.chapters?.reduce((a,c)=>a+(c.episodes?.length||0),0)} Lessons</span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Mentorship CTA Section */}
            <div className="py-24 bg-white border-t border-gray-200">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="bg-blue-700 rounded-3xl overflow-hidden shadow-xl flex flex-col md:flex-row items-center">
                        <div className="p-10 md:p-16 flex-1 text-center md:text-left">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600 rounded-full text-blue-100 text-xs font-bold tracking-wider uppercase mb-6">
                                <Users size={14} /> New Feature
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                                Stuck on a problem? Let's pair program.
                            </h2>
                            <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto md:mx-0">
                                Book a 1-on-1 Google Meet session with an expert. Get code reviews, career guidance, and overcome technical roadblocks faster.
                            </p>
                            <Link href="/mentorship" className="inline-flex items-center gap-2 bg-white text-blue-700 px-8 py-4 rounded-xl font-bold hover:bg-gray-50 transition-colors shadow-sm text-lg">
                                Book a Session <ArrowRight size={18} />
                            </Link>
                        </div>
                        <div className="hidden md:flex flex-1 justify-center p-10">
                            <div className="w-64 h-64 bg-blue-600 rounded-full flex items-center justify-center opacity-50 relative">
                                <div className="absolute w-48 h-48 bg-blue-500 rounded-full animate-pulse" />
                                <Calendar size={80} className="text-white relative z-10" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Snippet Course Grid */}
            <div id="courses" className="py-20 bg-white border-t border-gray-200">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">
                                {searchQuery ? `Results for "${searchQuery}"` : 'Code Snippets & Guides'}
                            </h2>
                            <p className="text-gray-600">Quick, focused deep-dives into specific topics.</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[1, 2, 3, 4].map(i => <div key={i} className="bg-gray-100 rounded-xl h-64 animate-pulse" />)}
                        </div>
                    ) : courses.length === 0 ? (
                        <div className="text-center py-24 bg-gray-50 rounded-2xl border border-gray-200">
                            <Search className="mx-auto text-gray-400 mb-4" size={40} />
                            {searchQuery ? (
                                <>
                                    <h3 className="text-lg font-bold text-gray-900">No results found</h3>
                                    <p className="text-gray-600 mt-1">Try adjusting your search terms.</p>
                                </>
                            ) : (
                                <>
                                    <h3 className="text-lg font-bold text-gray-900">No snippets yet</h3>
                                    <p className="text-gray-600 mt-1">Check back soon for new content.</p>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {courses.map((course) => (
                                <Link href={`/courses/${course.slug}`} key={course._id} className="group flex flex-col h-full bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-all overflow-hidden">
                                    <div className="relative aspect-[16/10] bg-gray-100 border-b border-gray-100 overflow-hidden">
                                        {course.thumbnail ? (
                                            <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400"><Code2 size={32} /></div>
                                        )}
                                    </div>
                                    <div className="p-5 flex flex-col flex-1">
                                        <h3 className="text-base font-bold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors line-clamp-2">
                                            {course.title}
                                        </h3>
                                        <p className="text-gray-600 text-xs line-clamp-2 mb-4 flex-1">
                                            {course.description || "Learn how to build this with best practices."}
                                        </p>
                                        <div className="flex flex-wrap gap-1 mb-4">
                                            {course.tags?.slice(0, 2).map((tag, idx) => (
                                                <span key={idx} className="text-[10px] font-semibold px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs font-medium text-gray-500 pt-3 border-t border-gray-100 mt-auto">
                                            <span className="flex items-center gap-1"><Eye size={12} /> {course.views || 0}</span>
                                            <span className="flex items-center gap-1"><Clock size={12} /> 15m read</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Newsletter Section - Refined */}
            <div id="subscribe" className="py-24 bg-blue-50 border-t border-gray-200">
                <div className="max-w-3xl mx-auto px-6 text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                        Join 15,000+ Developers
                    </h2>
                    <p className="text-lg text-gray-600 mb-8">
                        Get production-grade code, career tips, and early access to new courses delivered directly to your inbox.
                    </p>

                    <form onSubmit={handleSubscribe} className="max-w-md mx-auto">
                        <input type="text" name="confirm_email_address" value={honey} onChange={(e) => setHoney(e.target.value)} className="hidden" tabIndex={-1} autoComplete="off" />
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="email"
                                placeholder="Email address"
                                className="flex-1 px-4 py-3 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={submitting}
                                required
                            />
                            <button
                                disabled={submitting}
                                className="bg-blue-700 text-white px-6 py-3 rounded font-bold hover:bg-blue-800 transition-colors shadow-sm whitespace-nowrap disabled:opacity-70"
                            >
                                {submitting ? 'Subscribing...' : 'Subscribe'}
                            </button>
                        </div>
                        {message && (
                            <div className={`mt-4 text-sm font-medium ${message.type === 'success' ? 'text-green-700' : 'text-red-600'}`}>
                                {message.text}
                            </div>
                        )}
                        <p className="mt-4 text-xs text-gray-500">
                            We respect your privacy. Unsubscribe at any time.
                        </p>
                    </form>
                </div>
            </div>

            <footer className="py-8 bg-white border-t border-gray-200 text-center">
                <p className="text-gray-500 text-sm">© {new Date().getFullYear()} LearnMade. All rights reserved.</p>
            </footer>
        </div>
    );
}

export default function Home() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
            <HomeContent />
        </Suspense>
    );
}

