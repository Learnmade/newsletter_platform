'use client';

import Link from 'next/link';
import { BookOpen, Search, LogOut, Menu, X, ChevronRight } from 'lucide-react'; 
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

export default function Navbar() {
    const [search, setSearch] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const router = useRouter();
    const { data: session, status } = useSession();

    const handleSearch = (e) => {
        e.preventDefault();
        if (search.trim()) {
            router.push(`/?search=${encodeURIComponent(search)}`);
            setIsMenuOpen(false);
        } else {
            router.push('/');
        }
    };

    return (
        <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex items-center gap-6">
                        <Link href="/" className="flex items-center gap-2 group" onClick={() => setIsMenuOpen(false)}>
                            <BookOpen size={28} className="text-blue-700" />
                            <span className="font-bold text-xl tracking-tight text-gray-900 group-hover:text-blue-700 transition-colors">
                                LearnMade
                            </span>
                        </Link>
                        
                        {/* Explore Dropdown Placeholder (Typical for platforms) */}
                        <div className="hidden lg:block">
                            <button className="text-sm font-semibold text-gray-700 hover:text-blue-700 hover:bg-blue-50 px-3 py-2 rounded-md transition-colors flex items-center gap-1">
                                Explore <ChevronRight size={14} className="text-gray-400 rotate-90" />
                            </button>
                        </div>
                    </div>

                    {/* Desktop Search */}
                    <div className="flex-1 max-w-xl mx-8 hidden md:block">
                        <form onSubmit={handleSearch} className="relative">
                            <input
                                type="text"
                                placeholder="What do you want to learn?"
                                className="w-full bg-white border border-gray-300 text-gray-900 rounded-full py-2 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-sm"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <button type="submit" className="absolute right-0 top-0 h-full px-4 text-white bg-blue-700 hover:bg-blue-800 rounded-r-full transition-colors flex items-center justify-center">
                                <Search size={18} />
                            </button>
                        </form>
                    </div>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-4">
                        {status === 'loading' ? (
                            <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse"></div>
                        ) : session ? (
                            <>
                                {session.user.role === 'admin' && (
                                    <Link href="/admin/dashboard" className="text-sm font-semibold text-gray-600 hover:text-blue-700 transition-colors">
                                        Admin
                                    </Link>
                                )}
                                <div className="flex items-center gap-4 pl-4 border-l border-gray-200">
                                    <span className="text-sm font-medium text-gray-900">{session.user.email?.split('@')[0]}</span>
                                    <button
                                        onClick={() => signOut({ callbackUrl: '/' })}
                                        className="text-gray-500 hover:text-gray-900 transition-colors"
                                        title="Log Out"
                                    >
                                        <LogOut size={18} />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <Link href="/login" className="text-sm font-semibold text-blue-700 hover:text-blue-800 transition-colors">
                                    Log In
                                </Link>
                                <Link href="/signup" className="text-sm font-semibold text-white bg-blue-700 px-4 py-2 rounded flex items-center justify-center hover:bg-blue-800 transition-colors shadow-sm">
                                    Join for Free
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center gap-4">
                        <button className="text-blue-700">
                            <Search size={22} />
                        </button>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="text-gray-700 hover:text-blue-700 transition-colors"
                        >
                            {isMenuOpen ? <X size={26} /> : <Menu size={26} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div className="md:hidden border-t border-gray-100 bg-white absolute inset-x-0 top-full shadow-lg z-50">
                    <div className="p-4 space-y-4">
                        <form onSubmit={handleSearch} className="relative">
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-600"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        </form>

                        <div className="flex flex-col gap-1 border-t border-gray-100 pt-4">
                            {status === 'authenticated' && session ? (
                                <>
                                    <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-900">{session.user.email}</span>
                                        <button onClick={() => signOut({ callbackUrl: '/' })} className="text-gray-500 hover:text-gray-900">
                                            <LogOut size={18} />
                                        </button>
                                    </div>
                                    {session.user.role === 'admin' && (
                                        <Link href="/admin/dashboard" className="block px-4 py-3 font-semibold text-gray-700 hover:text-blue-700" onClick={() => setIsMenuOpen(false)}>
                                            Admin Dashboard
                                        </Link>
                                    )}
                                </>
                            ) : (
                                <>
                                    <Link href="/login" className="block px-4 py-3 font-semibold text-gray-700 hover:text-blue-700" onClick={() => setIsMenuOpen(false)}>
                                        Log In
                                    </Link>
                                    <Link href="/signup" className="block px-4 py-3 font-semibold text-blue-700 hover:bg-blue-50" onClick={() => setIsMenuOpen(false)}>
                                        Join for Free
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}

