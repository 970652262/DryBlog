import './globals.css';
import type { ReactNode } from 'react';
import AuthControls from '../components/AuthControls';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
// import ParticleBackground from '../components/ParticleBackground';
import { ThemeProvider } from '../components/ThemeProvider';
import ThemeToggle from '../components/ThemeToggle';
import GlobalSearch from '../components/GlobalSearch';

export const metadata = {
  title: 'DryBlog',
  description: 'Next.js + Supabase + Tailwind CSS',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="relative mx-auto max-w-7xl px-4 py-4 font-sans transition-colors bg-gray-50 text-gray-900 dark:bg-[#0f1216] dark:text-gray-100">
        <ThemeProvider>
          <div className="pointer-events-none fixed right-4 top-4 z-50 flex items-center gap-3">
            <div className="pointer-events-auto"><ThemeToggle /></div>
          </div>
          <header className="mb-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h1 className="m-0 text-2xl font-bold tracking-tight">
                <a href="/" className="text-gray-900 dark:text-gray-100 no-underline hover:text-brand-500 dark:hover:text-brand-400">DryBlog</a>
              </h1>
              <div className="flex-1 max-w-md mx-4">
                <GlobalSearch />
              </div>
              <NavBar />
              <AuthControls />
            </div>
            {/* <div className="surface px-4 py-2 flex justify-between items-center gap-4">
              <NavBar />
            </div> */}
          </header>
          {/* <ParticleBackground /> */}
          <div className="min-h-[60vh]">{children}</div>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}