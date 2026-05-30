import Navbar from "@/components/Navbar";
import { PlayCircle } from "lucide-react";

export const metadata = {
    title: "About Us",
};

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <Navbar />
            <div className="pt-24 max-w-4xl mx-auto px-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 md:p-14 text-center">
                    <div className="w-16 h-16 bg-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <PlayCircle size={32} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-6">About LearnMade</h1>
                    
                    <div className="prose prose-blue max-w-2xl mx-auto text-gray-600 space-y-6 text-left">
                        <p className="text-lg text-gray-700 leading-relaxed text-center">
                            LearnMade is a premier learning platform dedicated to helping developers master modern web architecture.
                        </p>
                        
                        <div className="mt-12">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Our Mission</h2>
                            <p>
                                Our mission is to bridge the gap between beginner tutorials and production-ready code. We believe that the best way to learn is by deconstructing real-world applications and understanding the "why" behind technical decisions.
                            </p>
                        </div>
                        
                        <div className="mt-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">What We Offer</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong>In-Depth Video Courses:</strong> Comprehensive masterclasses on React, Next.js, and Full-Stack development.</li>
                                <li><strong>Snippet Breakdowns:</strong> Bite-sized lessons focusing on specific architectural patterns and code implementation.</li>
                                <li><strong>Production-Ready Repositories:</strong> Access to complete source code that you can use in your own projects.</li>
                            </ul>
                        </div>

                        <div className="mt-12 p-6 bg-blue-50 rounded-xl border border-blue-100 text-center">
                            <h3 className="font-bold text-gray-900 mb-2">Get in Touch</h3>
                            <p className="text-sm text-gray-600 mb-4">Have questions or want to collaborate?</p>
                            <a href="mailto:support@learnmade.in" className="inline-block bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg shadow-sm hover:bg-blue-800 transition-colors">
                                Email Us
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
