"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Menu, X, LayoutDashboard, FolderOpen, Settings, LogOut, MessageCircleQuestion, Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import UserAvatar from "@/components/UserAvatar";
import { supabase } from "@/lib/supabaseClient";

export default function Header({ className = "" }: { className?: string }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [unansweredCount, setUnansweredCount] = useState(0);
  const pathname = usePathname();
  const { user, profile, signOut } = useAuth();

  useEffect(() => {
    async function fetchUnansweredCount() {
      if (!user) return; // Only fetch if logged in
      try {
        const { data, error } = await supabase
          .from('questions')
          .select('id, answers(id)')
          .eq('is_resolved', false);
        
        if (!error && data) {
          const count = data.filter((q: any) => !q.answers || !Array.isArray(q.answers) || q.answers.length === 0).length;
          setUnansweredCount(count);
        }
      } catch (err) {
        console.error("Error fetching unanswered count:", err);
      }
    }
    fetchUnansweredCount();
  }, [user, pathname]); // Re-fetch on route change (e.g. after answering)

  const closeMenu = () => setIsMenuOpen(false);

  const navLinks = [
    { href: "/", label: "ダッシュボード", icon: LayoutDashboard },
    { href: "/knowledge", label: "すべてのナレッジ", icon: FolderOpen },
    { href: "/qa", label: "Q&A", icon: MessageCircleQuestion },
    { href: "/settings", label: "各種設定", icon: Settings },
  ];

  return (
    <header className={`bg-indigo-600 text-white shadow-md sticky top-0 z-50 ${className}`}>
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link 
          href="/" 
          className="flex items-center gap-2 hover:opacity-90 transition-opacity"
          onClick={closeMenu}
        >
          <BookOpen size={28} />
          <span className="text-xl font-bold tracking-wider">Edunavi</span>
        </Link>

        {/* Desktop Navigation (hidden on mobile, visible on sm+) */}
        <nav className="hidden sm:flex items-center gap-6 text-sm font-medium">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
                <Link 
                key={link.href}
                href={link.href} 
                className={`transition-colors flex items-center gap-1.5 hover:text-indigo-200 pb-1 border-b-2 ${isActive ? 'border-white' : 'border-transparent'}`}
              >
                {link.label}
                {link.href === '/qa' && unansweredCount > 0 && (
                  <span className="bg-pink-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full -ml-0.5">
                    {unansweredCount}
                  </span>
                )}
              </Link>
            );
          })}
          {user && (
            <div className="flex items-center gap-4 ml-4 border-l border-indigo-400 pl-4">
              <div className="flex items-center gap-2 text-sm">
                <UserAvatar avatarUrl={profile?.avatar_url} name={profile?.name} size={28} />
                <span className="font-bold">{profile?.name || user.email?.split('@')[0]}</span>
              </div>
              <button 
                onClick={signOut}
                className="flex items-center gap-1 text-sm text-indigo-100 hover:text-white transition-colors"
                title="ログアウト"
              >
                <LogOut size={18} />
              </button>
            </div>
          )}
        </nav>

        {/* Mobile Hamburger Button */}
        <button
          className="sm:hidden p-2 -mr-2 rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-white flex items-center justify-center min-h-[44px] min-w-[44px]"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-expanded={isMenuOpen}
          aria-label="メニューを開く"
        >
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Dropdown Navigation */}
      <div 
        className={`sm:hidden bg-indigo-700 overflow-hidden transition-all duration-300 ease-in-out ${
          isMenuOpen ? "max-h-[500px] border-t border-indigo-500 shadow-inner" : "max-h-0"
        }`}
      >
        <nav className="flex flex-col py-2 px-4 space-y-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link 
                key={link.href}
                href={link.href} 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium min-h-[44px] ${
                  isActive 
                    ? "bg-indigo-600 text-white" 
                    : "text-indigo-100 hover:bg-indigo-600 hover:text-white"
                }`}
                onClick={closeMenu}
              >
                <Icon size={20} className={isActive ? "opacity-100" : "opacity-80"} />
                <span>{link.label}</span>
                {link.href === '/qa' && unansweredCount > 0 && (
                  <span className="bg-pink-500 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-auto">
                    {unansweredCount}件未回答
                  </span>
                )}
              </Link>
            );
          })}
          {user && (
            <div className="mt-4 pt-4 border-t border-indigo-500">
              <div className="flex items-center gap-3 px-4 py-2 text-indigo-100">
                <UserAvatar avatarUrl={profile?.avatar_url} name={profile?.name} size={32} />
                <span className="font-bold">{profile?.name || user.email?.split('@')[0]}</span>
              </div>
              <button 
                onClick={() => {
                  closeMenu();
                  signOut();
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium min-h-[44px] text-red-200 hover:bg-indigo-600 w-full text-left"
              >
                <LogOut size={20} className="opacity-80" />
                ログアウト
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
