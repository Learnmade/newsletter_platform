import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
    title: "LearnMade - Master Modern Development",
    description: "Learn with video, code, and explanations.",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className={`${inter.className} antialiased text-gray-900 bg-white`}>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}
