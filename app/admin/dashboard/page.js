'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PlusCircle, FileText, BarChart, Video } from 'lucide-react';

export default function AdminDashboard() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [subscribers, setSubscribers] = useState([]);
    const [subLoading, setSubLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('courses');

    useEffect(() => {
        fetchCourses();
        fetchSubscribers();
    }, []);

    const fetchCourses = async () => {
        try {
            const res = await fetch('/api/courses');
            const data = await res.json();
            if (data.success) setCourses(data.data);
        } catch (error) {
            console.error('Failed to fetch courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSubscribers = async () => {
        try {
            const res = await fetch('/api/subscribers');
            const data = await res.json();
            if (data.success) setSubscribers(data.data);
        } catch (error) {
            console.error('Failed to fetch subscribers:', error);
        } finally {
            setSubLoading(false);
        }
    };

    const handleDeleteSubscriber = async (id) => {
        if (!confirm('Are you sure you want to remove this subscriber?')) return;
        try {
            const res = await fetch('/api/subscribers', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            const data = await res.json();
            if (data.success) {
                setSubscribers(prev => prev.filter(sub => sub._id !== id));
            } else {
                alert(data.error);
            }
        } catch (error) {
            alert('Failed to delete subscriber');
        }
    };

    const totalViews = courses.reduce((acc, curr) => acc + (curr.views || 0), 0);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                {activeTab === 'courses' && (
                    <Link href="/admin/courses/create" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                        <PlusCircle size={20} />
                        <span>New Course</span>
                    </Link>
                )}
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

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                            <FileText size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Subscribers</p>
                            <h3 className="text-2xl font-bold text-gray-900">{subscribers.length}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
                {['courses', 'subscribers'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 text-sm font-medium rounded-md capitalize transition-all ${activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900 capitalize">Recent {activeTab}</h2>
                </div>

                {activeTab === 'courses' && (
                    <>
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
                    </>
                )}

                {activeTab === 'subscribers' && (
                    <>
                        {subLoading ? (
                            <div className="p-8 text-center text-gray-500">Loading subscribers...</div>
                        ) : subscribers.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">No subscribers yet.</div>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-500 text-sm uppercase">
                                    <tr>
                                        <th className="px-6 py-4 font-medium">Email</th>
                                        <th className="px-6 py-4 font-medium">Status</th>
                                        <th className="px-6 py-4 font-medium">Joined</th>
                                        <th className="px-6 py-4 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {subscribers.map((sub) => (
                                        <tr key={sub._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900">{sub.email}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 text-xs font-bold uppercase rounded-full ${sub.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {sub.isActive ? 'Active' : 'Unsubscribed'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">{new Date(sub.createdAt).toLocaleDateString()}</td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleDeleteSubscriber(sub._id)}
                                                    className="text-red-600 hover:text-red-800 text-sm font-medium hover:underline"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
