'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Code, FileText, Image as ImageIcon, Video, ArrowLeft, Loader2, Save } from 'lucide-react';
import Link from 'next/link';

export default function CreateCourse() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

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

    const [snippets, setSnippets] = useState([
        { title: 'Main Component', language: 'javascript', code: '' }
    ]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
            slug: name === 'title' && !prev.slug ? value.toLowerCase().replace(/[^a-z0-9]+/g, '-') : (name === 'slug' ? value : prev.slug)
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
        setLoading(true);

        try {
            const payload = {
                ...formData,
                tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
                codeSnippets: snippets
            };

            const res = await fetch('/api/courses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
            alert('Failed to create course');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 pb-32">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
                <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/dashboard" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-900">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Create New Course</h1>
                            <p className="text-xs text-gray-500">Draft mode</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/admin/dashboard" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                            Cancel
                        </Link>
                        <button
                            onClick={handleSubmit}
                            disabled={loading || uploading}
                            className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg shadow-gray-200 hover:shadow-xl transition-all disabled:opacity-70 flex items-center gap-2"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            <span>Publish Course</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-10">
                <form className="space-y-10">

                    {/* Section 1: Core Details */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        <div className="lg:col-span-1">
                            <h2 className="text-lg font-semibold text-gray-900 mb-2">Core Details</h2>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                Basic information about the course. The title and thumbnail are what users see first.
                            </p>
                        </div>
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Course Title</label>
                                    <input
                                        type="text"
                                        name="title"
                                        required
                                        value={formData.title}
                                        onChange={handleChange}
                                        placeholder="e.g. Master Next.js 14"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Slug</label>
                                        <input
                                            type="text"
                                            name="slug"
                                            value={formData.slug}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm font-mono text-gray-600"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                                        <input
                                            type="text"
                                            name="tags"
                                            value={formData.tags}
                                            onChange={handleChange}
                                            placeholder="React, Backend"
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Thumbnail</label>
                                    <div className="relative group">
                                        <div className={`border-2 border-dashed border-gray-200 rounded-xl p-8 hover:bg-gray-50 transition-colors text-center ${formData.thumbnail ? 'hidden' : 'block'}`}>
                                            <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <ImageIcon size={24} />
                                            </div>
                                            <p className="text-sm text-gray-600 font-medium">Click to upload image</p>
                                            <p className="text-xs text-gray-400 mt-1">SVG, PNG, JPG or GIF (max. 2MB)</p>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;

                                                    setUploading(true);
                                                    const data = new FormData();
                                                    data.append('file', file);

                                                    try {
                                                        const res = await fetch('/api/upload', {
                                                            method: 'POST',
                                                            body: data,
                                                        });
                                                        const json = await res.json();
                                                        if (json.success) {
                                                            setFormData(prev => ({ ...prev, thumbnail: json.url }));
                                                        } else {
                                                            alert('Upload failed: ' + json.error);
                                                        }
                                                    } catch (err) {
                                                        console.error(err);
                                                        alert('Upload failed');
                                                    } finally {
                                                        setUploading(false);
                                                    }
                                                }}
                                            />
                                        </div>

                                        {uploading && (
                                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-xl z-10">
                                                <Loader2 className="animate-spin text-indigo-500" />
                                            </div>
                                        )}

                                        {formData.thumbnail && (
                                            <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-sm border border-gray-100 group">
                                                <img src={formData.thumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData(prev => ({ ...prev, thumbnail: '' }))}
                                                        className="p-2 bg-white text-red-500 rounded-full hover:bg-red-50 transition-colors"
                                                    >
                                                        <Trash2 size={20} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-200" />

                    {/* Section 2: Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        <div className="lg:col-span-1">
                            <h2 className="text-lg font-semibold text-gray-900 mb-2">Content & Media</h2>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                The meat of the course. Add your video URL and the written breakdown.
                            </p>
                        </div>
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                                <div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Video Embed URL</label>
                                            <div className="relative">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                                    <Video size={18} />
                                                </div>
                                                <input
                                                    type="url"
                                                    name="videoUrl"
                                                    value={formData.videoUrl}
                                                    onChange={handleChange}
                                                    placeholder="YouTube URL"
                                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm font-medium"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">GitHub Repo URL</label>
                                            <div className="relative">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                                    <Code size={18} />
                                                </div>
                                                <input
                                                    type="url"
                                                    name="repoUrl"
                                                    value={formData.repoUrl}
                                                    onChange={handleChange}
                                                    placeholder="GitHub Repo URL"
                                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm font-medium"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Description / Article</label>
                                    <textarea
                                        name="description"
                                        rows={12}
                                        value={formData.description}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm leading-relaxed"
                                        placeholder="Write your deep dive here..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">File Structure</label>
                                    <textarea
                                        name="fileStructure"
                                        rows={8}
                                        value={formData.fileStructure}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-mono text-gray-300 placeholder:text-gray-600"
                                        placeholder={".\n├── app/\n│   ├── page.js\n│   └── layout.js"}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-200" />

                    {/* Section 3: Code */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        <div className="lg:col-span-1">
                            <h2 className="text-lg font-semibold text-gray-900 mb-2">Code Snippets</h2>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                Share the exact code used in the video so users can copy-paste.
                            </p>
                            <button
                                type="button"
                                onClick={addSnippet}
                                className="mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                            >
                                <Plus size={16} /> Add Another Snippet
                            </button>
                        </div>
                        <div className="lg:col-span-2 space-y-6">
                            {snippets.map((snippet, index) => (
                                <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4 group hover:border-indigo-100 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="text"
                                            placeholder="Filename (e.g. page.js)"
                                            value={snippet.title}
                                            onChange={(e) => handleSnippetChange(index, 'title', e.target.value)}
                                            className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Language"
                                            value={snippet.language}
                                            onChange={(e) => handleSnippetChange(index, 'language', e.target.value)}
                                            className="w-32 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeSnippet(index)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <Code className="absolute top-4 right-4 text-gray-500 opacity-20" size={20} />
                                        <textarea
                                            value={snippet.code}
                                            onChange={(e) => handleSnippetChange(index, 'code', e.target.value)}
                                            rows={8}
                                            className="w-full px-4 py-4 bg-gray-900 text-gray-100 rounded-xl font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="// Paste code..."
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </form>
            </div>
        </div>
    );
}
