'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, FileCode, FolderTree, Play, Clock } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function CourseDetail() {
    const params = useParams();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('explanation'); // explanation, code, structure
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

    if (loading) return <div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>;
    if (!course) return <div className="min-h-screen bg-white flex items-center justify-center">Course not found</div>;

    return (
        <div className="min-h-screen bg-gray-50/50">
            <Navbar />

            <main className="max-w-4xl mx-auto px-4 py-16">
                {/* Header */}
                {/* Header */}
                <div className="mb-12 text-center animate-fadeIn">
                    <div className="flex flex-wrap justify-center gap-2 mb-6">
                        {course.tags.map(tag => (
                            <span key={tag} className="text-xs font-bold tracking-widest uppercase text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">{tag}</span>
                        ))}
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-tight tracking-tight break-words">{course.title}</h1>
                    <div className="flex justify-center items-center gap-2 text-sm text-gray-400 font-medium">
                        <Clock size={16} />
                        <span>Published on {new Date(course.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>

                {/* Video Section */}
                <div className="bg-white rounded-2xl overflow-hidden shadow-2xl shadow-indigo-900/10 aspect-video mb-16 border border-gray-100 ring-1 ring-black/5 mx-auto max-w-5xl transform hover:scale-[1.01] transition-transform duration-500 relative">
                    <iframe
                        src={course.videoUrl}
                        className="absolute top-0 left-0 w-full h-full"
                        title={course.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>

                {/* Content Tabs */}
                <div className="border-b border-gray-200 mb-12 sticky top-24 bg-gray-50/80 backdrop-blur-md z-30 pt-4 -mx-4 px-4">
                    <div className="flex justify-center space-x-8">
                        {['explanation', 'structure', 'code'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`pb-4 px-4 text-sm font-bold uppercase tracking-widest border-b-2 transition-all duration-300 ${activeTab === tab
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-gray-400 hover:text-gray-900 hover:border-gray-300'
                                    }`}
                            >
                                {tab === 'structure' ? 'File Structure' : tab === 'code' ? 'Code Changes' : 'Deep Dive'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="prose prose-lg prose-slate prose-headings:font-bold prose-headings:tracking-tight prose-a:text-indigo-600 prose-img:rounded-xl max-w-none">

                    {/* Explanation Tab */}
                    {activeTab === 'explanation' && (
                        <div className="animate-fadeIn space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-gray-100/50">
                            <ReactMarkdown>{course.description}</ReactMarkdown>
                        </div>
                    )}

                    {/* Structure Tab */}
                    {activeTab === 'structure' && (
                        <div className="animate-fadeIn">
                            <div className="bg-[#1e1e1e] rounded-xl p-8 shadow-2xl shadow-black/20 border border-gray-800 overflow-x-auto relative group">
                                <div className="absolute top-4 right-4 text-xs font-mono text-gray-500 uppercase tracking-wider bg-white/5 px-2 py-1 rounded">Project Structure</div>
                                <pre className="text-gray-300 font-mono text-sm leading-relaxed">{course.fileStructure || 'No file structure provided.'}</pre>
                            </div>
                        </div>
                    )}

                    {/* Code Tab */}
                    {activeTab === 'code' && (
                        <div className="space-y-16 animate-fadeIn">
                            {course.codeSnippets.map((snippet, index) => (
                                <div key={index} className="scroll-mt-32 group">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-xl font-bold text-gray-900 m-0 flex items-center gap-3">
                                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                                <FileCode size={20} />
                                            </div>
                                            {snippet.title}
                                        </h3>
                                        <button
                                            onClick={() => handleCopy(snippet.code, index)}
                                            className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-indigo-600 transition-colors bg-white hover:bg-indigo-50 px-4 py-2 rounded-lg border border-gray-200 hover:border-indigo-100 shadow-sm"
                                        >
                                            {copied === index ? <Check size={16} /> : <Copy size={16} />}
                                            {copied === index ? 'Copied!' : 'Copy'}
                                        </button>
                                    </div>

                                    <div className="rounded-xl overflow-hidden shadow-2xl shadow-indigo-900/5 border border-gray-200/50">
                                        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                                            <div className="flex gap-1.5">
                                                <div className="w-3 h-3 rounded-full bg-red-400/80" />
                                                <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                                                <div className="w-3 h-3 rounded-full bg-green-400/80" />
                                            </div>
                                            <span className="text-xs font-mono text-gray-400 lowercase">{snippet.language}</span>
                                        </div>
                                        <SyntaxHighlighter
                                            language={snippet.language}
                                            style={atomDark}
                                            customStyle={{ margin: 0, padding: '1.5rem', fontSize: '14px', lineHeight: '1.6', background: '#1e1e1e' }}
                                            showLineNumbers={true}
                                            wrapLongLines={true}
                                        >
                                            {snippet.code}
                                        </SyntaxHighlighter>
                                    </div>
                                </div>
                            ))}
                            {course.codeSnippets.length === 0 && (
                                <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                    <p className="text-gray-400 italic">No code snippets available for this issue.</p>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-100 mt-20 py-12 text-center">
                <p className="text-gray-400 text-sm font-medium">© 2024 LearnMade. Crafted for builders.</p>
            </footer>
        </div>
    );
}
