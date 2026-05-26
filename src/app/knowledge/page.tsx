"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Tag as TagIcon, ArrowUpDown, Loader2 } from "lucide-react";
import { Tag, Task } from "@/types";
import KnowledgeCard from "@/components/KnowledgeCard";
import { supabase } from "@/lib/supabaseClient";

type SortOption = "month" | "newest" | "likes";

export default function KnowledgePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<Tag | "ALL">("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("month");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const allTags: Tag[] = ["校務", "行事", "ICT", "提出書類", "生徒指導", "成績処理"];

  useEffect(() => {
    async function fetchTasks() {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          tips (
            id,
            likes
          )
        `);
      
      if (error) {
        console.error("Error fetching tasks:", error);
      } else {
        setTasks(data as Task[] || []);
      }
      setLoading(false);
    }
    
    fetchTasks();
  }, []);

  const filteredAndSortedTasks = useMemo(() => {
    // 1. Filter
    let result = tasks.filter((task) => {
      const matchSearch =
        task.title.includes(searchQuery) ||
        task.description.includes(searchQuery);
      const matchTag =
        selectedTag === "ALL" || task.tags.includes(selectedTag);
      return matchSearch && matchTag;
    });

    // 2. Sort
    result.sort((a, b) => {
      if (sortBy === "month") {
        // 学校の年度順（4月始まり）でソート
        const getSchoolMonthWeight = (month: number) => (month < 4 ? month + 12 : month);
        return getSchoolMonthWeight(a.month) - getSchoolMonthWeight(b.month);
      } 
      else if (sortBy === "newest") {
        // IDが新しい順（本来はcreatedAt等の日付フィールドで比較）
        return Number(b.id) - Number(a.id);
      } 
      else if (sortBy === "likes") {
        // いいねが多い順
        const likesA = (a.tips || []).reduce((acc, tip) => acc + (tip.likes || 0), 0);
        const likesB = (b.tips || []).reduce((acc, tip) => acc + (tip.likes || 0), 0);
        return likesB - likesA;
      }
      return 0;
    });

    return result;
  }, [tasks, searchQuery, selectedTag, sortBy]);

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold text-indigo-900 mb-2">すべてのナレッジ</h1>
        <p className="text-slate-600 text-lg">
          全期間の業務マニュアルを検索・閲覧できます。
        </p>
      </div>

      {/* Filters & Search & Sort */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white rounded-xl shadow-sm border border-indigo-100 p-4">
        <div className="md:col-span-2 flex items-center bg-slate-50 rounded-lg px-4 py-2">
          <Search className="text-slate-400 mr-3 shrink-0" size={20} />
          <input
            type="text"
            placeholder="業務名やキーワードで検索..."
            className="w-full outline-none text-slate-700 bg-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center bg-slate-50 rounded-lg px-4 py-2">
          <TagIcon className="text-slate-400 mr-3 shrink-0" size={20} />
          <select
            className="w-full outline-none text-slate-700 bg-transparent cursor-pointer font-medium text-sm"
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value as Tag | "ALL")}
          >
            <option value="ALL">すべてのタグ</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center bg-slate-50 rounded-lg px-4 py-2">
          <ArrowUpDown className="text-slate-400 mr-3 shrink-0" size={20} />
          <select
            className="w-full outline-none text-slate-700 bg-transparent cursor-pointer font-medium text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
          >
            <option value="month">実施月順（デフォルト）</option>
            <option value="newest">新着順</option>
            <option value="likes">参考になった順（いいね）</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center border-b-2 border-indigo-200 pb-2">
          <h2 className="text-xl font-bold text-slate-800">
            検索結果: {filteredAndSortedTasks.length}件
          </h2>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl p-10 text-center shadow-sm border border-indigo-100 flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
            <p className="text-slate-500 text-lg">タスクを読み込み中...</p>
          </div>
        ) : filteredAndSortedTasks.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center shadow-sm border border-indigo-100">
            <p className="text-slate-500 text-lg">
              該当する業務は見つかりませんでした。
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndSortedTasks.map((task) => (
              <KnowledgeCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
