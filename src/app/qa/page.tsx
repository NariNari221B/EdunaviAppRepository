"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MessageCircleQuestion, Plus, Search, Tag as TagIcon, CheckCircle2, UserCircle2, Loader2, CircleDashed } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Question } from "@/types";

export default function QAPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // 一意なタグ一覧を抽出
  const allTags = Array.from(new Set(questions.flatMap(q => q.tags)));

  useEffect(() => {
    async function fetchQuestions() {
      const { data, error } = await supabase
        .from('questions')
        .select(`
          *,
          author:users (
            name,
            role
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching questions:", error);
      } else {
        setQuestions((data as unknown as Question[]) || []);
      }
      setLoading(false);
    }
    fetchQuestions();
  }, []);

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = 
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      q.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag ? q.tags.includes(selectedTag) : true;
    return matchesSearch && matchesTag;
  });

  const getAuthorDisplay = (q: Question) => {
    if (q.is_anonymous) {
      if (q.author?.role) {
        return `${q.author.role}の先生（匿名）`;
      }
      return "匿名希望の先生";
    }
    return q.author?.name || "名無し先生";
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <MessageCircleQuestion className="text-pink-500" size={32} />
            先生のQ&A広場
          </h1>
          <p className="text-slate-600 mt-2 text-sm sm:text-base">
            日常の疑問や悩み相談など、先生同士で気軽に教え合える掲示板です。
          </p>
        </div>
        <Link 
          href="/qa/new"
          className="bg-pink-600 hover:bg-pink-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md hover:shadow-lg flex-shrink-0 w-full sm:w-auto justify-center"
        >
          <Plus size={20} />
          質問を投稿する
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-4">
        <div className="relative">
          <input
            type="text"
            placeholder="質問を検索する..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-shadow bg-slate-50"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Search size={20} />
          </div>
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedTag === null
                  ? "bg-slate-800 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              すべて
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${
                  selectedTag === tag
                    ? "bg-pink-100 text-pink-700 border border-pink-200"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-pink-300 hover:bg-pink-50"
                }`}
              >
                <TagIcon size={14} />
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center items-center py-20 text-pink-600">
            <Loader2 className="animate-spin" size={40} />
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
            <MessageCircleQuestion size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-700">質問が見つかりません</h3>
            <p className="text-slate-500 mt-1">最初の質問を投稿してみましょう！</p>
          </div>
        ) : (
          filteredQuestions.map((q) => (
            <Link 
              key={q.id} 
              href={`/qa/${q.id}`}
              className="block bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:border-pink-300 hover:shadow-md transition-all group"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {q.is_resolved ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-green-100 text-green-800">
                        <CheckCircle2 size={14} />
                        解決済
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-600">
                        <CircleDashed size={14} />
                        受付中
                      </span>
                    )}
                    {q.tags.map(tag => (
                      <span key={tag} className="text-xs font-medium text-pink-600 bg-pink-50 px-2 py-0.5 rounded border border-pink-100">
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <h2 className="text-xl font-bold text-slate-900 group-hover:text-pink-600 transition-colors line-clamp-2 mb-2">
                    {q.title}
                  </h2>
                  <p className="text-slate-600 text-sm line-clamp-2 mb-4">
                    {q.content}
                  </p>
                  
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <UserCircle2 size={16} />
                    <span className="font-medium">{getAuthorDisplay(q)}</span>
                    <span>•</span>
                    <span>{new Date(q.created_at).toLocaleDateString('ja-JP')}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
