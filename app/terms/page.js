import Navbar from "@/components/Navbar";

export const metadata = {
    title: "Terms of Service",
};

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <Navbar />
            <div className="pt-24 max-w-4xl mx-auto px-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 md:p-14">
                    <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
                    
                    <div className="prose prose-blue max-w-none text-gray-600 space-y-6">
                        <p>Last updated: {new Date().toLocaleDateString()}</p>
                        
                        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
                        <p>By accessing or using LearnMade ("the Service"), you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the Service.</p>
                        
                        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">2. Use License</h2>
                        <p>Permission is granted to temporarily download one copy of the materials (information or software) on LearnMade for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Modify or copy the materials;</li>
                            <li>Use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
                            <li>Attempt to decompile or reverse engineer any software contained on LearnMade;</li>
                            <li>Remove any copyright or other proprietary notations from the materials; or</li>
                            <li>Transfer the materials to another person or "mirror" the materials on any other server.</li>
                        </ul>
                        
                        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">3. Disclaimer</h2>
                        <p>The materials on LearnMade are provided on an 'as is' basis. LearnMade makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
                        
                        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">4. Limitations</h2>
                        <p>In no event shall LearnMade or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on LearnMade, even if LearnMade or an authorized representative has been notified orally or in writing of the possibility of such damage.</p>
                        
                        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">5. Contact Information</h2>
                        <p>If you have any questions about these Terms, please contact us at support@learnmade.in.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
