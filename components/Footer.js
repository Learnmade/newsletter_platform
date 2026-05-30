'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PlayCircle } from 'lucide-react';

export default function Footer() {
    const pathname = usePathname();

    // Do not show footer in admin pages
    if (pathname?.startsWith('/admin')) {
        return null;
    }

    return (
        <footer className="bg-white border-t border-gray-100 mt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="col-span-1 md:col-span-2">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
                                <PlayCircle size={18} className="text-white" />
                            </div>
                            <span className="text-xl font-bold text-gray-900 tracking-tight">
                                LearnMade
                            </span>
                        </Link>
                        <p className="text-gray-500 text-sm leading-relaxed max-w-sm">
                            Master modern web development with production-ready code breakdowns and in-depth video courses.
                        </p>
                    </div>
                    
                    <div>
                        <h3 className="font-bold text-gray-900 mb-4">Company</h3>
                        <ul className="space-y-3 text-sm text-gray-500">
                            <li><Link href="/about" className="hover:text-blue-700 transition-colors">About Us</Link></li>
                            <li><Link href="mailto:support@learnmade.in" className="hover:text-blue-700 transition-colors">Contact</Link></li>
                        </ul>
                    </div>
                    
                    <div>
                        <h3 className="font-bold text-gray-900 mb-4">Legal</h3>
                        <ul className="space-y-3 text-sm text-gray-500">
                            <li><Link href="/privacy" className="hover:text-blue-700 transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/refund" className="hover:text-blue-700 transition-colors">Refund Policy</Link></li>
                            <li><Link href="/terms" className="hover:text-blue-700 transition-colors">Terms of Service</Link></li>
                        </ul>
                    </div>
                </div>
                
                <div className="border-t border-gray-100 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-gray-400">
                        © {new Date().getFullYear()} LearnMade. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
