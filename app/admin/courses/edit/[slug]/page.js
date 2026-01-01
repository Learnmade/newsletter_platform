'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Save, Trash2, Code, FileText, Video, ArrowLeft, Image as ImageIcon, Link as LinkIcon, Hash, Layout, FileCode, Terminal } from 'lucide-react';
import Link from 'next/link';

export default function EditCourse() {
    const router = useRouter();
    const params = useParams(); // Use useParams hook

    // Safety check for params
    const slug = params?.slug;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        thumbnail: '',
        videoUrl: '',
        repoUrl: '',
        description: '',
        fileStructure: '',
        tags: '',
    });

    const [snippets, setSnippets] = useState([]);

    useEffect(() => {
        if (slug) {
            fetchCourse();
        }
    }, [slug]);

    const fetchCourse = async () => {
        try {
            const res = await fetch(`/api/courses/${slug}`); // Use slug from params
            const data = await res.json();

            if (data.success) {
                const course = data.data;
                setFormData({
                    title: course.title,
                    slug: course.slug,
                    thumbnail: course.thumbnail,
                    videoUrl: course.videoUrl,
                    repoUrl: course.repoUrl || '',
                    description: course.description,
                    fileStructure: course.fileStructure || '',
                    tags: course.tags.join(', '),
                });
                setSnippets(course.codeSnippets || []);
            } else {
                alert('Course not found');
                router.push('/admin/dashboard');
            }
        } catch (error) {
            console.error('Failed to fetch course', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSnippetChange = (index, field, value) => {
        const newSnippets = [...snippets];
        newSnippets[index][field] = value;
        setSnippets(newSnippets);
    };

    const addSnippet = () => {
        setSnippets([...snippets, { title: '', language: 'javascript', code: '' }]);
    };

    const removeSnippet = (index) => {
        const newSnippets = snippets.filter((_, i) => i !== index);
        setSnippets(newSnippets);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const payload = {
                ...formData,
                tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
                codeSnippets: snippets
            };

            const res = await fetch(`/api/courses/${slug}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (data.success) {
                router.push('/admin/dashboard');
            } else {
                alert('Error: ' + (data.error || 'Something went wrong'));
            }
        } catch (error) {
            console.error(error);
            alert('Failed to update course');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-500 font-medium">Loading editor...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50/50 pb-32">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm backdrop-blur-xl bg-white/90">
                <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/dashboard" className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-500 hover:text-gray-900">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Edit Course</h1>
                            <p className="text-xs text-gray-500 font-medium">Updating: <span className="text-indigo-600 font-mono">{formData.slug}</span></p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Link href={`/courses/${formData.slug}`} target="_blank" className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                            <Video size={16} /> Preview
                        </Link>
                        <button
                            onClick={handleSubmit}
                            disabled={saving}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 transition-all transform hover:scale-105 ${saving ? 'bg-indigo-400 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                }`}
                        >
                            {saving ? (
                                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                            ) : (
                                <><Save size={18} /> Save Changes</>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
                <form onSubmit={handleSubmit} className="space-y-10">
                    {/* Basic Info Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1 space-y-4">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Layout className="text-indigo-500" size={20} />
                                Core Details
                            </h2>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                Basic course information, visuals, and metadata. This is what users see first.
                            </p>
                        </div>
                        <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-6">
                            <div className="space-y-4">
                                <label className="text-sm font-bold text-gray-700 ml-1">Course Title</label>
                                <input
                                    type="text"
                                    name="title"
                                    required
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="e.g. Master Next.js 14"
                                    className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent hover:bg-white hover:border-gray-200 focus:bg-white focus:border-indigo-500 rounded-2xl transition-all font-bold text-lg text-gray-900 placeholder:text-gray-400 outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Thumbnail</label>
                                    <div className="group relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                                            <ImageIcon size={18} />
                                        </div>
                                        <input
                                            type="text" // Kept as text input for now, ideally file upload
                                            name="thumbnail"
                                            value={formData.thumbnail}
                                            onChange={handleChange}
                                            placeholder="Image URL"
                                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm font-medium"
                                        />
                                    </div>
                                    {/* Helper to show image preview if valid URL */}
                                    {formData.thumbnail && (
                                        <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-100 shadow-sm mt-3">
                                            <img src={formData.thumbnail} alt="Preview" className="object-cover w-full h-full" />
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Video URL</label>
                                    <div className="group relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                                            <Video size={18} />
                                        </div>
                                        <input
                                            type="url"
                                            name="videoUrl"
                                            value={formData.videoUrl}
                                            onChange={handleChange}
                                            placeholder="YouTube Embed URL"
                                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm font-medium"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">GitHub Repo</label>
                                    <div className="group relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                                            <LinkIcon size={18} />
                                        </div>
                                        <input
                                            type="url"
                                            name="repoUrl"
                                            value={formData.repoUrl}
                                            onChange={handleChange}
                                            placeholder="https://github.com/..."
                                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm font-medium"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Tags</label>
                                    <div className="group relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                                            <Hash size={18} />
                                        </div>
                                        <input
                                            type="text"
                                            name="tags"
                                            value={formData.tags}
                                            onChange={handleChange}
                                            placeholder="react, nextjs, beginners"
                                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm font-medium"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-200/50" />

                    {/* Content Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1 space-y-4">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <FileText className="text-blue-500" size={20} />
                                Content & Structure
                            </h2>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                The educational content. Supports Markdown for rich text formatting.
                            </p>
                        </div>
                        <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-8">
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-gray-700 ml-1">Description (Markdown)</label>
                                <div className="relative">
                                    <textarea
                                        name="description"
                                        required
                                        rows={12}
                                        value={formData.description}
                                        onChange={handleChange}
                                        placeholder="# Introduction\n\nWrite your course content here..."
                                        className="w-full p-5 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-mono text-sm leading-relaxed text-gray-800 resize-y"
                                    />
                                    <div className="absolute bottom-4 right-4 text-xs text-gray-400 font-medium pointer-events-none">Markdown Supported</div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-gray-700 ml-1">File Structure</label>
                                <textarea
                                    name="fileStructure"
                                    rows={8}
                                    value={formData.fileStructure}
                                    onChange={handleChange}
                                    placeholder={`/app\n  page.js\n  layout.js`}
                                    className="w-full p-5 bg-gray-900 border border-gray-800 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-mono text-sm leading-relaxed text-gray-300 resize-y"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-200/50" />

                    {/* Code Snippets Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1 space-y-4">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Code className="text-purple-500" size={20} />
                                Code Snippets
                            </h2>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                Add copy-pasteable code blocks for users.
                            </p>
                            <button
                                type="button"
                                onClick={addSnippet}
                                className="mt-4 px-5 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-xl text-sm transition-colors flex items-center gap-2"
                            >
                                <Code size={16} /> Add New Snippet
                            </button>
                        </div>
                        <div className="lg:col-span-2 space-y-6">
                            {snippets.map((snippet, index) => (
                                <div key={index} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 group transition-all hover:border-purple-200 hover:shadow-md">
                                    <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                                            <div className="relative group/input">
                                                <FileCode className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                <input
                                                    type="text"
                                                    placeholder="Filename / Title"
                                                    value={snippet.title}
                                                    onChange={(e) => handleSnippetChange(index, 'title', e.target.value)}
                                                    className="w-full pl-10 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                                                />
                                            </div>
                                            <div className="relative group/input">
                                                <Terminal className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                <input
                                                    type="text"
                                                    placeholder="Language (js, css...)"
                                                    value={snippet.language}
                                                    onChange={(e) => handleSnippetChange(index, 'language', e.target.value)}
                                                    className="w-full pl-10 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeSnippet(index)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Remove Snippet"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    <div className="p-1 bg-gray-900">
                                        <textarea
                                            placeholder="// Paste your code here..."
                                            value={snippet.code}
                                            onChange={(e) => handleSnippetChange(index, 'code', e.target.value)}
                                            rows={8}
                                            className="w-full p-5 bg-gray-900 text-gray-300 font-mono text-sm leading-relaxed focus:bg-gray-950 outline-none resize-y"
                                        />
                                    </div>
                                </div>
                            ))}
                            {snippets.length === 0 && (
                                <div className="text-center py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                                    <Code className="mx-auto text-gray-300 mb-3" size={48} />
                                    <h3 className="text-gray-900 font-bold">No snippets yet</h3>
                                    <p className="text-gray-500 text-sm mt-1">Add code blocks to help users follow along.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
