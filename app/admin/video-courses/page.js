'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PlusCircle, PlayCircle, Pencil, Trash2, Eye, BookOpen, Globe, Lock, Layers } from 'lucide-react';

export default function VideoCoursesPage() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const res = await fetch('/api/video-courses');
            const data = await res.json();
            if (data.success) setCourses(data.data);
        } catch (err) {
            console.error('Failed to fetch video courses:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (slug) => {
        if (!confirm('Are you sure you want to delete this course? This cannot be undone.')) return;
        try {
            const res = await fetch(`/api/video-courses/${slug}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                setCourses(prev => prev.filter(c => c.slug !== slug));
            } else {
                alert(data.error || 'Failed to delete course');
            }
        } catch {
            alert('Failed to delete course');
        }
    };

    const handleToggleStatus = async (course) => {
        const newStatus = course.status === 'published' ? 'draft' : 'published';
        try {
            const res = await fetch(`/api/video-courses/${course.slug}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            const data = await res.json();
            if (data.success) {
                setCourses(prev => prev.map(c => c.slug === course.slug ? { ...c, status: newStatus } : c));
            }
        } catch {
            alert('Failed to update status');
        }
    };

    const totalEpisodes = (course) => course.chapters?.reduce((acc, ch) => acc + (ch.episodes?.length || 0), 0) || 0;

    if (loading) {
        return (
            <div className="flex h-[70vh] items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full" />
                    <div className="h-4 w-32 bg-gray-200 rounded" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                            <PlayCircle size={18} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Video Courses</h1>
                    </div>
                    <p className="text-sm text-gray-500 ml-12">Manage your full video course library</p>
                </div>
                <Link
                    href="/admin/video-courses/create"
                    id="create-video-course-btn"
                    className="group flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-5 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all transform hover:scale-105"
                >
                    <PlusCircle size={18} />
                    New Course
                </Link>
            </div>

            {/* Stats Strip */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Total Courses', value: courses.length, color: 'indigo' },
                    { label: 'Published', value: courses.filter(c => c.status === 'published').length, color: 'emerald' },
                    { label: 'Drafts', value: courses.filter(c => c.status === 'draft').length, color: 'amber' },
                ].map(stat => (
                    <div key={stat.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                        <p className={`text-3xl font-bold mt-1 ${stat.color === 'indigo' ? 'text-indigo-600' : stat.color === 'emerald' ? 'text-emerald-600' : 'text-amber-600'}`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Course Grid */}
            {courses.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-24 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <PlayCircle className="text-indigo-400" size={28} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No video courses yet</h3>
                    <p className="text-sm text-gray-500 mb-6 max-w-xs">Create your first structured video course with chapters and episodes.</p>
                    <Link
                        href="/admin/video-courses/create"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors"
                    >
                        Create First Course
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {courses.map((course) => (
                        <div key={course._id} className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all overflow-hidden flex flex-col">
                            {/* Thumbnail */}
                            <div className="relative aspect-video bg-gray-100 overflow-hidden">
                                {course.thumbnail ? (
                                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center">
                                        <PlayCircle className="text-indigo-300" size={40} />
                                    </div>
                                )}
                                {/* Status badge */}
                                <div className="absolute top-3 left-3">
                                    <span className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${course.status === 'published'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                        {course.status === 'published' ? <Globe size={10} /> : <Lock size={10} />}
                                        {course.status === 'published' ? 'Published' : 'Draft'}
                                    </span>
                                </div>
                                {/* Level badge */}
                                <div className="absolute top-3 right-3">
                                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-black/40 text-white backdrop-blur-sm">
                                        {course.level}
                                    </span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-5 flex-1 flex flex-col">
                                <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-2 line-clamp-2">{course.title}</h3>
                                <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                                    <span className="flex items-center gap-1">
                                        <Layers size={12} />
                                        {course.chapters?.length || 0} chapters
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <PlayCircle size={12} />
                                        {totalEpisodes(course)} episodes
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Eye size={12} />
                                        {course.views || 0} views
                                    </span>
                                </div>

                                {/* Tags */}
                                {course.tags?.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                        {course.tags.slice(0, 3).map(tag => (
                                            <span key={tag} className="text-[10px] font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full">{tag}</span>
                                        ))}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="mt-auto flex items-center gap-2 pt-4 border-t border-gray-50">
                                    <Link
                                        href={`/admin/video-courses/edit/${course.slug}`}
                                        id={`edit-course-${course.slug}`}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                                    >
                                        <Pencil size={13} />
                                        Edit
                                    </Link>
                                    <button
                                        onClick={() => handleToggleStatus(course)}
                                        id={`toggle-status-${course.slug}`}
                                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition-colors ${course.status === 'published'
                                            ? 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                                            : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'}`}
                                    >
                                        {course.status === 'published' ? <><Lock size={13} /> Unpublish</> : <><Globe size={13} /> Publish</>}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(course.slug)}
                                        id={`delete-course-${course.slug}`}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
