'use client';

import { useState, useEffect, Suspense } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { ArrowRight, Clock, Eye, Code2, Terminal, Zap, Layers, CheckCircle2, Search } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function HomeContent() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('search');

    // Subscription State
    const [email, setEmail] = useState('');
    const [honey, setHoney] = useState(''); // Honeypot state
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchCourses();
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
        <div className="min-h-screen bg-white">
            <Navbar />

            {/* Hero Section */}
            <div className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-32 bg-white">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
                        <div>
                            {courses.length > 0 && (
                                <Link href={`/courses/${courses[0].slug}`} className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600 text-xs font-semibold uppercase tracking-wide mb-8 hover:bg-indigo-100 transition-colors">
                                    <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
                                    New Drop: {courses[0].title.substring(0, 30)}...
                                </Link>
                            )}
                            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-gray-900 tracking-tight leading-[1.1] mb-6">
                                Build better software, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">faster.</span>
                            </h1>
                            <p className="text-lg sm:text-xl text-gray-500 max-w-lg leading-relaxed mb-8 lg:mb-10">
                                Stop watching basic tutorials. Get full-stack, production-ready code breakdowns delivered to your inbox.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link href="#courses" className="bg-gray-900 text-white px-8 py-4 rounded-xl font-semibold hover:bg-black transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 text-center">
                                    Start Learning
                                </Link>
                                <Link href="#subscribe" className="bg-white text-gray-900 border border-gray-200 px-8 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-all text-center">
                                    Join Newsletter
                                </Link>
                            </div>
                            <div className="mt-12 flex items-center gap-6 text-sm text-gray-400 font-medium">
                                <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> Production Ready</div>
                                <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> Full Source Code</div>
                            </div>
                        </div>

                        {/* Hero Graphic / Code Mockup */}
                        <div className="relative mt-8 lg:mt-0">
                            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-20"></div>
                            <div className="relative bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl overflow-hidden">
                                <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800 bg-gray-900/50">
                                    <div className="w-3 h-3 rounded-full bg-red-500" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                    <div className="w-3 h-3 rounded-full bg-green-500" />
                                    <div className="ml-2 text-xs text-gray-500 font-mono">server.js</div>
                                </div>
                                <div className="p-4 sm:p-6 overflow-hidden overflow-x-auto">
                                    <pre className="font-mono text-xs sm:text-sm text-gray-300 leading-relaxed">
                                        <code>
                                            <span className="text-purple-400">import</span> {'{'} NextResponse {'}'} <span className="text-purple-400">from</span> <span className="text-green-400">'next/server'</span>;<br />
                                            <br />
                                            <span className="text-purple-400">export async function</span> <span className="text-blue-400">GET</span>(req) {'{'}<br />
                                            &nbsp;&nbsp;<span className="text-gray-500">// Production-ready API handler</span><br />
                                            &nbsp;&nbsp;<span className="text-purple-400">const</span> data = <span className="text-purple-400">await</span> db.<span className="text-blue-400">query</span>(<span className="text-green-400">'SELECT * FROM users'</span>);<br />
                                            <br />
                                            &nbsp;&nbsp;<span className="text-purple-400">return</span> NextResponse.<span className="text-blue-400">json</span>({'{'}<br />
                                            &nbsp;&nbsp;&nbsp;&nbsp;success: <span className="text-yellow-400">true</span>,<br />
                                            &nbsp;&nbsp;&nbsp;&nbsp;data: data,<br />
                                            &nbsp;&nbsp;&nbsp;&nbsp;cached: <span className="text-yellow-400">true</span><br />
                                            &nbsp;&nbsp;{'}'});<br />
                                            {'}'}
                                        </code>
                                    </pre>
                                </div>
                            </div>
                            {/* Floating decorative cards - hidden on very small mobile to prevent clutter */}
                            <div className="hidden sm:flex absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl border border-gray-100 items-center gap-3 animate-bounce-slow">
                                <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                                    <Zap size={20} />
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 font-bold uppercase">Performance</div>
                                    <div className="text-sm font-bold text-gray-900">100/100</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="py-24 bg-gray-50 border-y border-gray-100">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <div className="group">
                            <div className="w-12 h-12 bg-white rounded-xl border border-gray-200 flex items-center justify-center text-gray-900 mb-6 shadow-sm group-hover:scale-110 transition-transform">
                                <Terminal size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-3">No Fluff, Just Code</h3>
                            <p className="text-gray-500 leading-relaxed">
                                We skip the "what is a variable" talk. We build real-world systems like authentication, payments, and dashboards.
                            </p>
                        </div>
                        <div className="group">
                            <div className="w-12 h-12 bg-white rounded-xl border border-gray-200 flex items-center justify-center text-gray-900 mb-6 shadow-sm group-hover:scale-110 transition-transform">
                                <Layers size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-3">Modern Stack</h3>
                            <p className="text-gray-500 leading-relaxed">
                                Always up to date. We use Next.js 14, React Server Components, TypeScript, Tailwind, and the latest tools.
                            </p>
                        </div>
                        <div className="group">
                            <div className="w-12 h-12 bg-white rounded-xl border border-gray-200 flex items-center justify-center text-gray-900 mb-6 shadow-sm group-hover:scale-110 transition-transform">
                                <Code2 size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-3">Copy-Paste Ready</h3>
                            <p className="text-gray-500 leading-relaxed">
                                Every issue comes with a complete GitHub repository. Clone it, run it, and use it in your own projects.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Course Grid */}
            <div id="courses" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">
                                {searchQuery ? `Results for "${searchQuery}"` : 'Latest Issues'}
                            </h2>
                            <p className="text-gray-500">Hand-crafted deep dives for professional developers.</p>
                        </div>
                        {!searchQuery && (
                            <div className="hidden md:block">
                                <Link href="#" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                                    View Archive <ArrowRight size={16} />
                                </Link>
                            </div>
                        )}
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-gray-100 rounded-2xl h-96 animate-pulse"></div>
                            ))}
                        </div>
                    ) : courses.length === 0 ? (
                        <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                            <div className="bg-white p-4 rounded-full w-fit mx-auto mb-4 shadow-sm">
                                <Search className="text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">No courses found</h3>
                            <p className="text-gray-500">We couldn't find anything for "{searchQuery}".</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {courses.map((course) => (
                                <Link href={`/courses/${course.slug}`} key={course._id} className="group cursor-pointer flex flex-col h-full">
                                    <div className="bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-indigo-100 flex flex-col h-full group-hover:-translate-y-1">
                                        {/* Thumbnail */}
                                        <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                                            {course.thumbnail ? (
                                                <img
                                                    src={course.thumbnail}
                                                    alt={course.title}
                                                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400">
                                                    <Code2 size={40} />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60" />
                                            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                                                <div className="flex gap-2">
                                                    {course.tags.slice(0, 2).map((tag, idx) => (
                                                        <span key={idx} className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-white/90 text-gray-900 rounded-md backdrop-blur-sm">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-6 flex flex-col flex-1">
                                            <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-tight">
                                                {course.title}
                                            </h3>
                                            <p className="text-gray-500 text-sm line-clamp-2 mb-6 leading-relaxed flex-1">
                                                {course.description || "Learn how to build this project from scratch with best practices."}
                                            </p>

                                            <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
                                                <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                                                    <div className="flex items-center gap-1.5">
                                                        <Eye size={14} />
                                                        <span>{course.views || 0}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock size={14} />
                                                        <span>15m</span>
                                                    </div>
                                                </div>
                                                <span className="text-sm font-semibold text-indigo-600 group-hover:underline">Read Issue</span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Subscribe Section */}
            <div id="subscribe" className="py-24 relative overflow-hidden bg-gray-900">
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500 rounded-full blur-[100px]" />
                    <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500 rounded-full blur-[100px]" />
                </div>

                <div className="max-w-4xl mx-auto px-6 lg:px-8 relative z-10 text-center">
                    <span className="inline-block py-1 px-3 rounded-full bg-white/10 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-6 border border-white/10">
                        Join the Inner Circle
                    </span>
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                        Get the newsletter developers <br /> actually read.
                    </h2>
                    <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                        Join 15,000+ developers getting production-grade code, career tips, and early access to new courses. No spam, ever.
                    </p>

                    <form onSubmit={handleSubscribe} className="max-w-md mx-auto space-y-4">
                        <input type="text" name="confirm_email_address" value={honey} onChange={(e) => setHoney(e.target.value)} className="hidden" tabIndex={-1} autoComplete="off" />

                        <div className="relative">
                            <input
                                type="email"
                                placeholder="enter@email.com"
                                className="w-full px-6 py-4 rounded-xl bg-white/10 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white/20 transition-all font-medium text-center"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={submitting}
                                required
                            />
                        </div>
                        <button
                            disabled={submitting}
                            className="w-full bg-white text-gray-900 py-4 rounded-xl font-bold hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl disabled:opacity-70 flex justify-center items-center gap-2"
                        >
                            {submitting ? <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" /> : 'Subscribe for Free'}
                        </button>
                    </form>

                    {message && (
                        <div className={`mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium animate-fadeIn ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                            {message.text}
                        </div>
                    )}

                    <p className="mt-8 text-xs text-gray-500 font-medium">
                        Unsubscribe at any time. We respect your privacy.
                    </p>
                </div>
            </div>

            {/* Simple Footer */}
            <footer className="py-12 bg-white border-t border-gray-100 text-center">
                <p className="text-gray-400 text-sm">© {new Date().getFullYear()} LearnMade. All rights reserved.</p>
            </footer>
        </div>
    );
}

export default function Home() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>}>
            <HomeContent />
        </Suspense>
    );
}
