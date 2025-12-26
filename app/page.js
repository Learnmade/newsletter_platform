'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { ArrowRight, Clock, Eye, Code2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

export default function Home() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('search');

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

    return (
        <div className="min-h-screen bg-gray-50/50">
            <Navbar />

            {/* Hero Section */}
            <div className="relative overflow-hidden bg-white">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30" />
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 text-center">
                    <span className="inline-block py-1 px-3 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-sm font-semibold mb-6 animate-fadeIn">
                        New: Full-Stack Next.js Course Available
                    </span>
                    <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-8 leading-tight">
                        Master modern development <br />
                        <span className="text-gradient">one newsletter at a time.</span>
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-12 leading-relaxed">
                        Stop watching endless tutorials. Get production-ready code,
                        deep-dive explanations, and file structures delivered to you.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link href="#courses" className="bg-gray-900 text-white px-8 py-4 rounded-xl font-semibold hover:bg-gray-800 transition-all hover:shadow-lg hover:-translate-y-1">
                            Browse Library
                        </Link>
                        <Link href="#subscribe" className="bg-white text-gray-900 border border-gray-200 px-8 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-all hover:border-gray-300">
                            Get Latest Issue
                        </Link>
                    </div>

                    <div className="mt-16 flex justify-center gap-8 text-gray-400 opacity-60 grayscale">
                        {/* Add logos here if needed later */}
                    </div>
                </div>
            </div>

            {/* Course Grid */}
            <div id="courses" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">
                            {searchQuery ? `Results for "${searchQuery}"` : 'Latest Issues'}
                        </h2>
                        <p className="text-gray-500">Hand-crafted tutorials for professional developers.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white rounded-2xl h-96 animate-pulse border border-gray-100"></div>
                        ))}
                    </div>
                ) : courses.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                        <h3 className="text-xl text-gray-600 font-medium">No courses found matching your criteria.</h3>
                        <p className="text-gray-400 mt-2">Try searching for different keywords.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {courses.map((course) => (
                            <Link href={`/courses/${course.slug}`} key={course._id} className="group cursor-pointer h-full">
                                <div className="bg-white rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-indigo-100 flex flex-col h-full group-hover:-translate-y-1">
                                    <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                                        <img
                                            src={course.thumbnail}
                                            alt={course.title}
                                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>

                                    <div className="p-6 flex flex-col flex-1">
                                        <div className="flex gap-2 mb-4">
                                            {course.tags.slice(0, 2).map((tag, idx) => (
                                                <span key={idx} className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 bg-gray-50 text-gray-600 rounded-full border border-gray-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-colors">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>

                                        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                                            {course.title}
                                        </h3>

                                        <p className="text-gray-500 text-sm line-clamp-2 mb-6 leading-relaxed">
                                            {course.description.substring(0, 100)}...
                                        </p>

                                        <div className="flex items-center gap-4 mt-auto text-sm text-gray-400 pt-4 border-t border-gray-50 group-hover:border-gray-100 transition-colors">
                                            <div className="flex items-center gap-1.5">
                                                <Clock size={16} />
                                                <span>15 min read</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Code2 size={16} />
                                                <span>Source Code</span>
                                            </div>
                                            <div className="flex items-center gap-1 ml-auto text-indigo-600 font-medium">
                                                Read <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Subscribe Section */}
            <div id="subscribe" className="relative py-32 overflow-hidden">
                <div className="absolute inset-0 bg-gray-900">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/50 to-purple-900/50" />
                </div>
                <div className="relative max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold mb-6 text-white tracking-tight">Stay ahead of the curve</h2>
                    <p className="text-gray-300 mb-10 max-w-xl mx-auto text-lg">
                        Join 15,000+ developers receiving high-quality code breakdowns twice a week. No spam, just code.
                    </p>
                    <form className="flex flex-col sm:flex-row gap-3 justify-center max-w-lg mx-auto" onSubmit={(e) => e.preventDefault()}>
                        <input
                            type="email"
                            placeholder="Type your email..."
                            className="px-6 py-4 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full font-medium"
                        />
                        <button className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-indigo-500 transition-all shadow-lg hover:shadow-indigo-500/25">
                            Subscribe
                        </button>
                    </form>
                    <p className="mt-6 text-sm text-gray-500">Unsubscribe at any time.</p>
                </div>
            </div>
        </div>
    );
}
