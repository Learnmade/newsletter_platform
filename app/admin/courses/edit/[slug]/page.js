'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Save, Trash2, Code, FileText, Video, ArrowLeft } from 'lucide-react';
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

    if (loading) return <div className="p-10 text-center">Loading course data...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div className="border-b border-gray-200 pb-5 flex items-center gap-4">
                <Link href="/admin/dashboard" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft size={20} className="text-gray-600" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Edit Course</h1>
                    <p className="mt-2 text-gray-500">Update course content and code snippets.</p>
                </div>
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
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Slug (Read Only)</label>
                            <input
                                type="text"
                                name="slug"
                                disabled // Slugs shouldn't be changed easily as it breaks SEO/Links
                                value={formData.slug}
                                className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed outline-none"
                            />
                        </div>
                    </div>
                    {/* ... (Rest of fields matching create page) ... */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Thumbnail URL</label>
                            <input
                                type="url"
                                name="thumbnail"
                                required
                                value={formData.thumbnail}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Video Embed URL</label>
                            <input
                                type="url"
                                name="videoUrl"
                                required
                                value={formData.videoUrl}
                                onChange={handleChange}
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
                        <label className="text-sm font-medium text-gray-700">Detailed Explanation</label>
                        <textarea
                            name="description"
                            required
                            rows={8}
                            value={formData.description}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none font-mono text-sm"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">File Structure</label>
                        <textarea
                            name="fileStructure"
                            rows={6}
                            value={formData.fileStructure}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none font-mono text-sm"
                        />
                    </div>
                </section>

                {/* Snippets Section */}
                <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <Code className="text-purple-500" /> Code Snippets
                        </h2>
                        <button type="button" onClick={addSnippet} className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1">
                            <Code size={16} /> Add Snippet
                        </button>
                    </div>
                    <div className="space-y-6">
                        {snippets.map((snippet, index) => (
                            <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="grid grid-cols-2 gap-4 flex-1 mr-4">
                                        <input
                                            type="text"
                                            placeholder="Title"
                                            value={snippet.title}
                                            onChange={(e) => handleSnippetChange(index, 'title', e.target.value)}
                                            className="px-3 py-2 border rounded focus:outline-none focus:border-purple-500 bg-white"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Language"
                                            value={snippet.language}
                                            onChange={(e) => handleSnippetChange(index, 'language', e.target.value)}
                                            className="px-3 py-2 border rounded focus:outline-none focus:border-purple-500 bg-white"
                                        />
                                    </div>
                                    <button type="button" onClick={() => removeSnippet(index)} className="text-red-500 hover:text-red-700 p-2">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                                <textarea
                                    placeholder="// Code here..."
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
                        disabled={saving}
                        className="bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition-all flex items-center gap-2"
                    >
                        {saving ? 'Saving...' : <><Save size={18} /> Save Changes</>}
                    </button>
                </div>
            </form>
        </div>
    );
}
