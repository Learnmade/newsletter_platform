'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Code, FileText, Image as ImageIcon, Video } from 'lucide-react';

export default function CreateCourse() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        thumbnail: '',
        videoUrl: '',
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
            // Auto-generate slug from title if slug is empty
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
            alert('Failed to create course');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div className="border-b border-gray-200 pb-5">
                <h1 className="text-3xl font-bold text-gray-900">Create New Course</h1>
                <p className="mt-2 text-gray-500">Add a new video course with explanation and code.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">

                {/* Basic Info Section */}
                <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Video className="text-blue-500" /> Basic Information
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Course Title</label>
                            <input
                                type="text"
                                name="title"
                                required
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="e.g. Build a Netflix Clone"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Slug (URL friendly)</label>
                            <input
                                type="text"
                                name="slug"
                                required
                                value={formData.slug}
                                onChange={handleChange}
                                placeholder="e.g. build-netflix-clone"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Thumbnail Image</label>
                            <div className="space-y-2">
                                <div className="flex items-center gap-4">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;

                                            setLoading(true); // Re-using loading state or add a specific one
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
                                                setLoading(false);
                                            }
                                        }}
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                </div>
                                {formData.thumbnail && (
                                    <div className="mt-2 relative w-full h-40 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                        <img src={formData.thumbnail} alt="Preview" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, thumbnail: '' }))}
                                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Video Embed URL</label>
                            <input
                                type="url"
                                name="videoUrl"
                                required
                                value={formData.videoUrl}
                                onChange={handleChange}
                                placeholder="https://www.youtube.com/embed/..."
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Tags (comma separated)</label>
                        <input
                            type="text"
                            name="tags"
                            value={formData.tags}
                            onChange={handleChange}
                            placeholder="Next.js, MongoDB, React"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </section>

                {/* Content Section */}
                <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <FileText className="text-green-500" /> Explanation & Structure
                    </h2>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Detailed Explanation (Markdown supported)</label>
                        <textarea
                            name="description"
                            required
                            rows={8}
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="# Introduction\n\nIn this course, we will build..."
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none font-mono text-sm"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">File Structure (Tree view)</label>
                        <textarea
                            name="fileStructure"
                            rows={6}
                            value={formData.fileStructure}
                            onChange={handleChange}
                            placeholder={".\n├── app/\n├── components/\n└── public/"}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none font-mono text-sm"
                        />
                    </div>
                </section>

                {/* Code Snippets Section */}
                <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <Code className="text-purple-500" /> Code Snippets
                        </h2>
                        <button
                            type="button"
                            onClick={addSnippet}
                            className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                        >
                            <Plus size={16} /> Add Snippet
                        </button>
                    </div>

                    <div className="space-y-6">
                        {snippets.map((snippet, index) => (
                            <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="grid grid-cols-2 gap-4 flex-1 mr-4">
                                        <input
                                            type="text"
                                            placeholder="Snippet Title (e.g. db.js)"
                                            value={snippet.title}
                                            onChange={(e) => handleSnippetChange(index, 'title', e.target.value)}
                                            className="px-3 py-2 border rounded focus:outline-none focus:border-purple-500 bg-white"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Language (e.g. javascript)"
                                            value={snippet.language}
                                            onChange={(e) => handleSnippetChange(index, 'language', e.target.value)}
                                            className="px-3 py-2 border rounded focus:outline-none focus:border-purple-500 bg-white"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeSnippet(index)}
                                        className="text-red-500 hover:text-red-700 p-2"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                                <textarea
                                    placeholder="// Paste your code here..."
                                    value={snippet.code}
                                    onChange={(e) => handleSnippetChange(index, 'code', e.target.value)}
                                    rows={6}
                                    className="w-full px-3 py-2 border rounded focus:outline-none focus:border-purple-500 font-mono text-sm bg-gray-900 text-gray-50"
                                />
                            </div>
                        ))}
                    </div>
                </section>

                <div className="sticky bottom-4 z-10 flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition-all"
                    >
                        {loading ? 'Creating...' : 'Publish Course'}
                    </button>
                </div>
            </form>
        </div>
    );
}
