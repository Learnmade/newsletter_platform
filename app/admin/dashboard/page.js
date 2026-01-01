'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PlusCircle, FileText, BarChart, Video } from 'lucide-react';

export default function AdminDashboard() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const res = await fetch('/api/courses');
            const data = await res.json();
            if (data.success) {
                setCourses(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const totalViews = courses.reduce((acc, curr) => acc + (curr.views || 0), 0);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <Link href="/admin/courses/create" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                    <PlusCircle size={20} />
                    <span>New Course</span>
                </Link>
            </div>

            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                            <Video size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Courses</p>
                            <h3 className="text-2xl font-bold text-gray-900">{courses.length}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                            <BarChart size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Views</p>
                            <h3 className="text-2xl font-bold text-gray-900">{totalViews}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Course List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Courses</h2>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading courses...</div>
                ) : courses.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No courses found. Create your first one!</div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-sm uppercase">
                            <tr>
                                <th className="px-6 py-4 font-medium">Title</th>
                                <th className="px-6 py-4 font-medium">Views</th>
                                <th className="px-6 py-4 font-medium">Created</th>
                                <th className="px-6 py-4 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {courses.map((course) => (
                                <tr key={course._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {course.thumbnail && (
                                                <img src={course.thumbnail} alt="" className="w-10 h-10 rounded object-cover" />
                                            )}
                                            <span className="font-medium text-gray-900">{course.title}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{course.views}</td>
                                    <td className="px-6 py-4 text-gray-600">{new Date(course.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <Link href={`/admin/courses/edit/${course.slug}`} className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                                                Edit
                                            </Link>
                                            <Link href={`/courses/${course.slug}`} target="_blank" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                                View
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
