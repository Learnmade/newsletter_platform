'use client';

import Link from 'next/link';
import { Code2, Search, LogOut, Menu, X } from 'lucide-react'; // Added Menu, X
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

export default function Navbar() {
    const [search, setSearch] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false); // Mobile menu state
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
        <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 supports-[backdrop-filter]:bg-white/60">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="flex items-center gap-3 group" onClick={() => setIsMenuOpen(false)}>
                            <div className="bg-gray-900 p-2.5 rounded-xl text-white group-hover:bg-indigo-600 transition-colors shadow-lg shadow-gray-900/10">
                                <Code2 size={24} />
                            </div>
                            <span className="font-bold text-xl tracking-tight text-gray-900 hidden sm:block group-hover:text-indigo-900 transition-colors">
                                LearnMade
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Search */}
                    <div className="flex-1 max-w-lg mx-12 hidden md:block">
                        <form onSubmit={handleSearch} className="relative group">
                            <input
                                type="text"
                                placeholder="Search library..."
                                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-2xl py-2.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all shadow-sm group-hover:shadow-md"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <Search className="absolute left-3.5 top-3 text-gray-400 group-hover:text-indigo-500 transition-colors" size={18} />
                        </form>
                    </div>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-6">
                        {status === 'loading' ? (
                            <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse"></div>
                        ) : session ? (
                            <>
                                {session.user.role === 'admin' && (
                                    <Link href="/admin/dashboard" className="text-sm font-semibold text-gray-600 hover:text-indigo-600 transition-colors">
                                        Dashboard
                                    </Link>
                                )}
                                <div className="flex items-center gap-4 pl-6 border-l border-gray-200">
                                    <span className="text-sm font-medium text-gray-900">{session.user.email?.split('@')[0]}</span>
                                    <button
                                        onClick={() => signOut({ callbackUrl: '/' })}
                                        className="text-gray-400 hover:text-red-500 transition-colors bg-gray-50 p-2 rounded-lg hover:bg-red-50"
                                        title="Sign Out"
                                    >
                                        <LogOut size={18} />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <Link href="/login" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
                                    Log in
                                </Link>
                                <Link href="/signup" className="text-sm font-semibold text-white bg-gray-900 px-5 py-2.5 rounded-xl hover:bg-gray-800 transition-all hover:shadow-lg hover:-translate-y-0.5">
                                    Sign up
                                </Link>
                            </>
                        )}
                        <Link href="#subscribe" className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-500 transition-all hover:shadow-lg hover:-translate-y-0.5 shadow-indigo-500/20">
                            Subscribe
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div className="md:hidden border-t border-gray-100 bg-white/95 backdrop-blur-xl absolute inset-x-0 top-full p-4 shadow-xl space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <form onSubmit={handleSearch} className="relative">
                        <input
                            type="text"
                            placeholder="Search library..."
                            className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <Search className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
                    </form>

                    <div className="flex flex-col gap-2">
                        {status === 'authenticated' && session ? (
                            <>
                                <div className="px-4 py-2 bg-gray-50 rounded-lg flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-900">{session.user.email}</span>
                                    <button
                                        onClick={() => signOut({ callbackUrl: '/' })}
                                        className="text-red-500 p-1 hover:bg-red-50 rounded"
                                    >
                                        <LogOut size={16} />
                                    </button>
                                </div>
                                {session.user.role === 'admin' && (
                                    <Link href="/admin/dashboard" className="block px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setIsMenuOpen(false)}>
                                        Admin Dashboard
                                    </Link>
                                )}
                            </>
                        ) : (
                            <>
                                <Link href="/login" className="block px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setIsMenuOpen(false)}>
                                    Log in
                                </Link>
                                <Link href="/signup" className="block px-4 py-3 font-semibold text-center text-white bg-gray-900 rounded-lg" onClick={() => setIsMenuOpen(false)}>
                                    Sign up
                                </Link>
                            </>
                        )}
                        <Link href="#subscribe" className="block px-4 py-3 font-semibold text-center text-indigo-600 bg-indigo-50 rounded-lg" onClick={() => setIsMenuOpen(false)}>
                            Subscribe
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
}
