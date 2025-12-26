'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

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
            <aside className="w-64 bg-gray-900 text-white p-6 hidden md:block">
                <h1 className="text-2xl font-bold mb-10">LearnMade Admin</h1>
                <nav className="space-y-4">
                    <Link href="/admin/dashboard" className={`block py-2 px-4 rounded hover:bg-gray-800 ${pathname === '/admin/dashboard' ? 'bg-gray-800' : ''}`}>
                        Dashboard
                    </Link>
                    <Link href="/admin/courses/create" className={`block py-2 px-4 rounded hover:bg-gray-800 ${pathname === '/admin/courses/create' ? 'bg-gray-800' : ''}`}>
                        Create Course
                    </Link>
                    <Link href="/" target="_blank" className="block py-2 px-4 rounded hover:bg-gray-800 text-gray-400">
                        View Site
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
