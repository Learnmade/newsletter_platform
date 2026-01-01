'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { PlusCircle, Users, BarChart3, Video, TrendingUp, Search, MoreVertical, Trash2, ArrowRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
    const [courses, setCourses] = useState([]);
    const [subscribers, setSubscribers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('courses');

    useEffect(() => {
        Promise.all([fetchCourses(), fetchSubscribers()]).finally(() => setLoading(false));
    }, []);

    const fetchCourses = async () => {
        try {
            const res = await fetch('/api/courses');
            const data = await res.json();
            if (data.success) setCourses(data.data);
        } catch (error) {
            console.error('Failed to fetch courses:', error);
        }
    };

    const fetchSubscribers = async () => {
        try {
            const res = await fetch('/api/subscribers');
            const data = await res.json();
            if (data.success) setSubscribers(data.data);
        } catch (error) {
            console.error('Failed to fetch subscribers:', error);
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

    // Calculate Analytics
    const totalViews = courses.reduce((acc, curr) => acc + (curr.views || 0), 0);
    const totalSubscribers = subscribers.length;
    const activeSubscribers = subscribers.filter(s => s.isActive).length;

    // Process Data for Flow Graph (Last 7 Days)
    const chartData = useMemo(() => {
        const days = 7;
        const data = [];
        const now = new Date();

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            // Count items created on or before this day to show cumulative growth
            // Actually, let's show "New Subscribers" per day for "Flow", or "Total" for growth.
            // "Flow" usually implies activity. Let's do Cumulative Growth (Total Subs up to that day).
            const subsCount = subscribers.filter(s => new Date(s.createdAt) <= date).length;

            data.push({
                name: dateStr,
                subscribers: subsCount,
            });
        }
        return data;
    }, [subscribers]);


    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
                    <p className="text-gray-500 mt-1">Overview of your platform's performance.</p>
                </div>
                <Link
                    href="/admin/courses/create"
                    className="group bg-gray-900 hover:bg-black text-white px-5 py-3 rounded-xl font-medium shadow-lg shadow-gray-200 transition-all flex items-center gap-2 transform hover:scale-105"
                >
                    <PlusCircle size={20} />
                    <span>Create Course</span>
                </Link>
            </div>

            {/* Analytics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard
                    title="Total Subscribers"
                    value={totalSubscribers}
                    icon={Users}
                    trend="+12%"
                    color="blue"
                />
                <StatsCard
                    title="Total Views"
                    value={totalViews.toLocaleString()}
                    icon={BarChart3}
                    trend="+5%"
                    color="green"
                />
                <StatsCard
                    title="Active Courses"
                    value={courses.length}
                    icon={Video}
                    color="purple"
                    active
                />
            </div>

            {/* Flow Graph Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Subscriber Growth</h3>
                            <p className="text-sm text-gray-400">Cumulative subscribers over last 7 days</p>
                        </div>
                        <div className="p-2 bg-gray-50 rounded-lg">
                            <TrendingUp className="text-green-500" size={20} />
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorSubs" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#9ca3af' }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#9ca3af' }}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="subscribers"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorSubs)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Quick Actions / Mini List */}
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-8 text-white flex flex-col justify-between shadow-lg shadow-indigo-200">
                    <div>
                        <h3 className="text-xl font-bold mb-2">Premium Access</h3>
                        <p className="text-indigo-100 text-sm mb-6">Manage your premium subscribers and content details.</p>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                                <span className="text-sm font-medium">Active Subs</span>
                                <span className="text-xl font-bold">{activeSubscribers}</span>
                            </div>
                            <div className="flex items-center justify-between bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                                <span className="text-sm font-medium">Churn Rate</span>
                                <span className="text-xl font-bold">0.0%</span>
                            </div>
                        </div>
                    </div>
                    <button className="w-full bg-white text-indigo-600 py-3 rounded-xl font-bold mt-8 hover:bg-indigo-50 transition-colors">
                        View Analytics Report
                    </button>
                </div>
            </div>

            {/* Main Content Tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex space-x-1 bg-gray-100/50 p-1 rounded-xl w-fit">
                        {['courses', 'subscribers'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-2.5 text-sm font-semibold rounded-lg capitalize transition-all ${activeTab === tab
                                        ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5'
                                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
                        />
                    </div>
                </div>

                {activeTab === 'courses' ? (
                    <CoursesTable courses={courses} />
                ) : (
                    <SubscribersTable subscribers={subscribers} onDelete={handleDeleteSubscriber} />
                )}
            </div>
        </div>
    );
}

function StatsCard({ title, value, icon: Icon, trend, color, active }) {
    const colors = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        purple: 'bg-purple-50 text-purple-600',
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${colors[color] || colors.blue}`}>
                    <Icon size={24} />
                </div>
                {trend && (
                    <span className="bg-green-50 text-green-700 text-xs font-bold px-2 py-1 rounded-full">
                        {trend}
                    </span>
                )}
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-1">{value}</h3>
            </div>
        </div>
    );
}

function CoursesTable({ courses }) {
    if (courses.length === 0) {
        return <EmptyState message="No courses found." action="Create your first course" />;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider font-semibold border-b border-gray-100">
                    <tr>
                        <th className="px-6 py-4">Course Details</th>
                        <th className="px-6 py-4">Stats</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {courses.map((course) => (
                        <tr key={course._id} className="hover:bg-gray-50/50 transition-colors group">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-20 rounded-lg bg-gray-200 overflow-hidden relative shrink-0">
                                        {course.thumbnail ? (
                                            <img src={course.thumbnail} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900 text-sm">{course.title}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{course.slug}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-1.5 text-gray-600 text-sm">
                                    <BarChart3 size={16} />
                                    <span className="font-medium">{course.views}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className="text-sm text-gray-500 font-medium whitespace-nowrap">
                                    {new Date(course.createdAt).toLocaleDateString()}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Link href={`/admin/courses/edit/${course.slug}`} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                        <span className="text-xs font-semibold">Edit</span>
                                    </Link>
                                    <Link href={`/courses/${course.slug}`} target="_blank" className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                                        <ArrowRight size={18} />
                                    </Link>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function SubscribersTable({ subscribers, onDelete }) {
    if (subscribers.length === 0) {
        return <EmptyState message="No subscribers yet." />;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider font-semibold border-b border-gray-100">
                    <tr>
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Joined</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {subscribers.map((sub) => (
                        <tr key={sub._id} className="hover:bg-gray-50/50 transition-colors group">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                                        {sub.email[0].toUpperCase()}
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">{sub.email}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full border ${sub.isActive
                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                        : 'bg-red-50 text-red-600 border-red-100'
                                    }`}>
                                    {sub.isActive ? 'Active' : 'Unsubscribed'}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <span className="text-sm text-gray-500 font-medium">
                                    {new Date(sub.createdAt).toLocaleDateString()}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button
                                    onClick={() => onDelete(sub._id)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function EmptyState({ message, action }) {
    return (
        <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="bg-gray-50 p-4 rounded-full mb-4">
                <Search className="text-gray-400" size={24} />
            </div>
            <p className="text-gray-900 font-medium mb-1">{message}</p>
            {action && <p className="text-sm text-blue-600 hover:underline cursor-pointer">{action}</p>}
        </div>
    );
}
