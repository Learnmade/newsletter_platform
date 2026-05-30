'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { LayoutDashboard, PlusCircle, PlayCircle, ExternalLink, Calendar } from 'lucide-react';

export default function AdminLayout({ children }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (status === 'unauthenticated' && pathname !== '/admin/login') {
            router.push('/admin/login');
        }
    }, [status, router, pathname]);

    if (status === 'loading') {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (status === 'unauthenticated' && pathname !== '/admin/login') {
        return null; // Will redirect
    }

    // If on login page, just render children without sidebar
    if (pathname === '/admin/login') {
        return <div className="min-h-screen bg-gray-100">{children}</div>;
    }

    return (
        <div className="min-h-screen flex bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex shrink-0">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-700 rounded flex items-center justify-center">
                            <PlayCircle size={16} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-gray-900">LearnMade</h1>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mt-0.5">Admin Panel</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-3 mt-2">Main</p>

                    <Link href="/admin/dashboard" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${pathname === '/admin/dashboard' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                        <LayoutDashboard size={17} />
                        Dashboard
                    </Link>

                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-3 mt-6">Content</p>

                    <Link href="/admin/courses/create" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${pathname.startsWith('/admin/courses') ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                        <PlusCircle size={17} />
                        Snippet Courses
                    </Link>

                    <Link href="/admin/video-courses" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${pathname.startsWith('/admin/video-courses') ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                        <PlayCircle size={17} />
                        Video Courses
                        <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${pathname.startsWith('/admin/video-courses') ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>NEW</span>
                    </Link>

                    <Link href="/admin/bookings" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${pathname.startsWith('/admin/bookings') ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                        <Calendar size={17} />
                        1-on-1 Sessions
                    </Link>
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <Link href="/" target="_blank" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all">
                        <ExternalLink size={17} />
                        View Site
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto min-h-screen">
                {children}
            </main>
        </div>
    );
}

