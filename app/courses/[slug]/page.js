'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, FileCode, FolderTree, Play } from 'lucide-react';

export default function CourseDetail({ params }) {
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('explanation'); // explanation, code, structure
    const [copied, setCopied] = useState(null);

    useEffect(() => {
        fetchCourse();
    }, []);

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
        <div className="min-h-screen bg-white">
            <Navbar />

            <main className="max-w-4xl mx-auto px-4 py-12">
                {/* Header */}
                <div className="mb-10 text-center">
                    <div className="flex justify-center gap-2 mb-4">
                        {course.tags.map(tag => (
                            <span key={tag} className="text-sm font-bold tracking-wider uppercase text-blue-600">{tag}</span>
                        ))}
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">{course.title}</h1>
                    <p className="text-gray-500">Published on {new Date(course.createdAt).toLocaleDateString()}</p>
                </div>

                {/* Video Section */}
                <div className="bg-black rounded-2xl overflow-hidden shadow-2xl aspect-video mb-12">
                    <iframe
                        src={course.videoUrl}
                        className="w-full h-full"
                        title={course.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>

                {/* Content Tabs */}
                <div className="border-b border-gray-200 mb-10 sticky top-16 bg-white z-40">
                    <div className="flex space-x-8 overflow-x-auto no-scrollbar">
                        {['explanation', 'structure', 'code'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`pb-4 px-2 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'
                                    }`}
                            >
                                {tab === 'structure' ? 'File Structure' : tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="prose prose-lg prose-gray max-w-none">

                    {/* Explanation Tab */}
                    {activeTab === 'explanation' && (
                        <div className="animate-fadeIn">
                            <ReactMarkdown>{course.description}</ReactMarkdown>
                        </div>
                    )}

                    {/* Structure Tab */}
                    {activeTab === 'structure' && (
                        <div className="animate-fadeIn bg-gray-900 rounded-xl p-6 text-gray-300 font-mono text-sm overflow-x-auto">
                            <pre>{course.fileStructure || 'No file structure provided.'}</pre>
                        </div>
                    )}

                    {/* Code Tab */}
                    {activeTab === 'code' && (
                        <div className="space-y-12 animate-fadeIn">
                            {course.codeSnippets.map((snippet, index) => (
                                <div key={index} className="scroll-mt-24">
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="text-xl font-bold text-gray-800 m-0 flex items-center gap-2">
                                            <FileCode size={20} className="text-blue-500" />
                                            {snippet.title}
                                        </h3>
                                        <button
                                            onClick={() => handleCopy(snippet.code, index)}
                                            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200"
                                        >
                                            {copied === index ? <Check size={16} /> : <Copy size={16} />}
                                            {copied === index ? 'Copied!' : 'Copy Code'}
                                        </button>
                                    </div>

                                    <div className="rounded-xl overflow-hidden shadow-lg border border-gray-100">
                                        <SyntaxHighlighter
                                            language={snippet.language}
                                            style={atomDark}
                                            customStyle={{ margin: 0, padding: '1.5rem', fontSize: '14px', lineHeight: '1.5' }}
                                            showLineNumbers={true}
                                        >
                                            {snippet.code}
                                        </SyntaxHighlighter>
                                    </div>
                                </div>
                            ))}
                            {course.codeSnippets.length === 0 && (
                                <p className="text-gray-500 italic text-center">No code snippets provided for this course.</p>
                            )}
                        </div>
                    )}

                </div>
            </main>

            {/* Footer */}
            <footer className="bg-gray-50 border-t border-gray-200 mt-20 py-12 text-center text-gray-400 text-sm">
                <p>© 2024 DevNewsletter. All rights reserved.</p>
            </footer>
        </div>
    );
}
