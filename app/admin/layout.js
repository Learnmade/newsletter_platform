'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { LayoutDashboard, PlusCircle, PlayCircle, ExternalLink } from 'lucide-react';

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
            <aside className="w-64 bg-gray-950 text-white flex flex-col hidden md:flex shrink-0">
                <div className="p-6 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center">
                            <PlayCircle size={16} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-white">LearnMade</h1>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Admin Panel</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-3 mb-3 mt-2">Main</p>

                    <Link href="/admin/dashboard" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${pathname === '/admin/dashboard' ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                        <LayoutDashboard size={17} />
                        Dashboard
                    </Link>

                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-3 mb-3 mt-5">Content</p>

                    <Link href="/admin/courses/create" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${pathname.startsWith('/admin/courses') ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                        <PlusCircle size={17} />
                        Snippet Courses
                    </Link>

                    <Link href="/admin/video-courses" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${pathname.startsWith('/admin/video-courses') ? 'bg-indigo-500/20 text-indigo-300' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                        <PlayCircle size={17} />
                        Video Courses
                        <span className="ml-auto text-[10px] font-bold bg-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full">NEW</span>
                    </Link>
                </nav>

                <div className="p-4 border-t border-white/5">
                    <Link href="/" target="_blank" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all">
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

