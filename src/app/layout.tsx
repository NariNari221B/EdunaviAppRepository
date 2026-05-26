import type { Metadata } from 'next';
import './globals.css';
import { BookOpen } from 'lucide-react';
import Link from 'next/link';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'EdunaviApp - 校務ナレッジ共有',
  description: '先生方のための校務ナレッジ共有アプリ',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <AuthProvider>
          <ThemeProvider>
            <ProtectedRoute>
              <div className="min-h-screen flex flex-col">
                <Header />

                {/* Main Content */}
                <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8">
                  {children}
                </main>
          
                {/* Footer */}
                <footer className="bg-indigo-900 text-indigo-200 py-6 text-center text-sm mt-auto">
                  <p>&copy; 2026 EdunaviApp - 校務引き継ぎサポートシステム</p>
                </footer>
              </div>
            </ProtectedRoute>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
