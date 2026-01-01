'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, FileCode, FolderTree, Play, Clock, ArrowLeft, ChevronRight, Eye, Lightbulb } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CourseDetail() {
    const params = useParams();
    const router = useRouter();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('explanation');
    const [copied, setCopied] = useState(null);

    useEffect(() => {
        if (params?.slug) {
            fetchCourse();
        }
    }, [params?.slug]);

    const fetchCourse = async () => {
        try {
            const res = await fetch(`/api/courses/${params.slug}`);
            const data = await res.json();
            if (data.success) {
                setCourse(data.data);
            } else {
                router.push('/');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (code, index) => {
        navigator.clipboard.writeText(code);
        setCopied(index);
        setTimeout(() => setCopied(null), 2000);
    };

    const getEmbedUrl = (url) => {
        if (!url) return '';
        if (url.includes('youtube.com/watch?v=')) {
            const videoId = url.split('v=')[1].split('&')[0];
            return `https://www.youtube.com/embed/${videoId}`;
        }
        if (url.includes('youtu.be/')) {
            const videoId = url.split('youtu.be/')[1].split('?')[0];
            return `https://www.youtube.com/embed/${videoId}`;
        }
        return url;
    };

    if (loading) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-400 font-medium animate-pulse">Loading content...</p>
            </div>
        </div>
    );

    if (!course) return null;

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            {/* Breadcrumb / Top Nav */}
            <div className="border-b border-gray-100 bg-white sticky top-0 z-20 backdrop-blur-md bg-white/80">
                <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center gap-4 text-sm font-medium text-gray-500">
                    <Link href="/" className="hover:text-gray-900 transition-colors flex items-center gap-1">
                        <ArrowLeft size={16} /> Back
                    </Link>
                    <ChevronRight size={14} className="text-gray-300" />
                    <span className="text-gray-900 truncate">{course.title}</span>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 md:px-8 py-10">

                {/* Hero / Video Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Video Player */}
                        <div className="bg-black rounded-2xl overflow-hidden shadow-2xl aspect-video relative group">
                            <iframe
                                src={getEmbedUrl(course.videoUrl)}
                                className="absolute top-0 left-0 w-full h-full"
                                title={course.title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>

                        {/* Mobile Title (Visible only on small screens) */}
                        <div className="lg:hidden">
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">{course.title}</h1>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1"><Clock size={14} /> {new Date(course.createdAt).toLocaleDateString()}</span>
                                <span className="flex items-center gap-1"><Eye size={14} /> {course.views || 0} views</span>
                            </div>
                        </div>

                        {/* Content Tabs */}
                        <div className="bg-gray-50 p-1 rounded-xl flex gap-1 w-full md:w-fit">
                            {['explanation', 'code', 'structure'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-semibold capitalize transition-all ${activeTab === tab
                                        ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    {tab === 'structure' ? 'File Structure' : tab === 'code' ? 'Source Code' : 'Deep Dive'}
                                </button>
                            ))}
                        </div>

                        {/* Content Area */}
                        <div className="min-h-[500px]">
                            {activeTab === 'explanation' && (
                                <div className="max-w-none">
                                    <ReactMarkdown
                                        components={{
                                            h1: ({ children }) => <h1 className="text-3xl font-bold text-gray-900 mb-6 mt-8 pb-4 border-b border-gray-100">{children}</h1>,
                                            h2: ({ children }) => (
                                                <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4 flex items-center gap-2 group">
                                                    <div className="w-1.5 h-6 bg-indigo-500 rounded-full group-hover:h-8 transition-all" />
                                                    {children}
                                                </h2>
                                            ),
                                            h3: ({ children }) => <h3 className="text-xl font-bold text-gray-800 mt-8 mb-3">{children}</h3>,
                                            p: ({ children }) => <p className="text-gray-600 leading-8 mb-6 text-lg tracking-wide">{children}</p>,
                                            ul: ({ children }) => <ul className="space-y-3 my-6 pl-4">{children}</ul>,
                                            ol: ({ children }) => <ol className="space-y-3 my-6 list-decimal list-inside pl-2">{children}</ol>,
                                            li: ({ children }) => (
                                                <li className="flex items-start gap-3 text-gray-700 leading-relaxed group">
                                                    <span className="mt-2.5 w-1.5 h-1.5 bg-indigo-400 rounded-full shrink-0 group-hover:bg-indigo-600 transition-colors" />
                                                    <span>{children}</span>
                                                </li>
                                            ),
                                            blockquote: ({ children }) => (
                                                <div className="my-8 bg-gradient-to-r from-indigo-50 to-blue-50/50 border-l-4 border-indigo-500 p-6 rounded-r-xl shadow-sm">
                                                    <div className="flex items-center gap-2 text-indigo-700 font-bold mb-3 uppercase text-xs tracking-wider">
                                                        <span className="p-1 bg-indigo-100 rounded">NOTE</span>
                                                    </div>
                                                    <div className="text-indigo-900/80 italic font-medium leading-relaxed">{children}</div>
                                                </div>
                                            ),
                                            code: ({ inline, className, children }) => {
                                                if (inline) {
                                                    return <code className="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-md font-mono text-sm font-bold border border-indigo-100/50">{children}</code>;
                                                }
                                                return (
                                                    <pre className="bg-gray-900 text-gray-50 p-6 rounded-2xl overflow-x-auto my-8 shadow-xl border border-gray-800 font-mono text-sm leading-relaxed">
                                                        {children}
                                                    </pre>
                                                );
                                            },
                                            a: ({ href, children }) => (
                                                <a href={href} className="text-indigo-600 font-semibold underline decoration-indigo-200 decoration-2 underline-offset-2 hover:decoration-indigo-500 hover:text-indigo-700 transition-all">
                                                    {children}
                                                </a>
                                            ),
                                            strong: ({ children }) => <strong className="font-bold text-gray-900">{children}</strong>,
                                        }}
                                    >
                                        {course.description}
                                    </ReactMarkdown>
                                </div>
                            )}

                            {activeTab === 'structure' && (
                                <div className="bg-gray-900 rounded-xl p-6 shadow-xl overflow-x-auto">
                                    <div className="flex items-center gap-2 mb-4 text-gray-400 border-b border-gray-800 pb-2">
                                        <FolderTree size={18} />
                                        <span className="text-sm font-bold uppercase tracking-wider">Project Structure</span>
                                    </div>
                                    <pre className="text-gray-300 font-mono text-sm leading-relaxed">{course.fileStructure || 'No file structure provided.'}</pre>
                                </div>
                            )}

                            {activeTab === 'code' && (
                                <div className="space-y-10">
                                    {course.codeSnippets.map((snippet, index) => (
                                        <div key={index} className="group">
                                            <div className="flex justify-between items-center mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                        <FileCode size={16} />
                                                    </div>
                                                    <h3 className="text-base font-bold text-gray-900">{snippet.title}</h3>
                                                </div>
                                                <button
                                                    onClick={() => handleCopy(snippet.code, index)}
                                                    className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-indigo-600 transition-colors bg-white border border-gray-200 hover:border-indigo-100 px-3 py-1.5 rounded-lg shadow-sm"
                                                >
                                                    {copied === index ? <Check size={14} /> : <Copy size={14} />}
                                                    {copied === index ? 'Copied' : 'Copy Code'}
                                                </button>
                                            </div>

                                            <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                                                <SyntaxHighlighter
                                                    language={snippet.language}
                                                    style={atomDark}
                                                    customStyle={{ margin: 0, padding: '1.5rem', fontSize: '13px', lineHeight: '1.6', background: '#0f172a' }}
                                                    showLineNumbers={true}
                                                    wrapLongLines={true}
                                                >
                                                    {snippet.code}
                                                </SyntaxHighlighter>
                                            </div>
                                        </div>
                                    ))}
                                    {course.codeSnippets.length === 0 && (
                                        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                            <p className="text-gray-500 font-medium">No code snippets available for this issue.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mobile CTA Card (Visible only on small screens) */}
                    <div className="lg:hidden mt-8 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 text-white text-center shadow-lg shadow-indigo-200">
                        <h3 className="font-bold text-lg mb-2">Want the full source?</h3>
                        <p className="text-indigo-100 text-sm mb-6">Get access to this project and 50+ others in our GitHub repo.</p>
                        {course.repoUrl ? (
                            <a
                                href={course.repoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full bg-white text-indigo-600 font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 duration-200"
                            >
                                Access Repository
                            </a>
                        ) : (
                            <button disabled className="w-full bg-white/50 text-indigo-200 font-bold py-3 rounded-xl cursor-not-allowed">
                                Repository Unavailable
                            </button>
                        )}
                    </div>

                    {/* Sidebar (Desktop Only) */}
                    <div className="hidden lg:block space-y-8">
                        <div>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {course.tags.map(tag => (
                                    <span key={tag} className="text-[10px] font-bold tracking-wider uppercase text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-4">{course.title}</h1>
                            <div className="flex items-center gap-6 text-sm text-gray-500 font-medium pb-6 border-b border-gray-100">
                                <span className="flex items-center gap-1.5"><Clock size={16} /> {new Date(course.createdAt).toLocaleDateString()}</span>
                                <span className="flex items-center gap-1.5"><Eye size={16} /> {course.views || 0} views</span>
                            </div>
                        </div>

                        {/* CTA Card */}
                        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 text-white text-center shadow-lg shadow-indigo-200">
                            <h3 className="font-bold text-lg mb-2">Want the full source?</h3>
                            <p className="text-indigo-100 text-sm mb-6">Get access to this project and 50+ others in our GitHub repo.</p>
                            {course.repoUrl ? (
                                <a
                                    href={course.repoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full bg-white text-indigo-600 font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 duration-200"
                                >
                                    Access Repository
                                </a>
                            ) : (
                                <button disabled className="w-full bg-white/50 text-indigo-200 font-bold py-3 rounded-xl cursor-not-allowed">
                                    Repository Unavailable
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </main >
        </div >
    );
}
