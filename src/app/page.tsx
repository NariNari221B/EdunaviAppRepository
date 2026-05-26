"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Calendar, Tag as TagIcon, PlusCircle, Loader2 } from "lucide-react";
import { MONTHS } from "@/data/mockData";
import { Tag, Task } from "@/types";
import Link from "next/link";
import KnowledgeCard from "@/components/KnowledgeCard";
import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  const [selectedMonth, setSelectedMonth] = useState<number>(4);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<Tag | "ALL">("ALL");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const allTags: Tag[] = ["校務", "行事", "ICT", "提出書類", "生徒指導", "成績処理"];

  useEffect(() => {
    async function fetchTasks() {
      setLoading(true);
      try {
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
          setTasks([]);
        } else {
          setTasks((data as Task[]) || []);
        }
      } catch (err) {
        console.error("Exception in fetchTasks:", err);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchTasks();
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchMonth = task.month === selectedMonth;
      const matchSearch =
        task.title.includes(searchQuery) ||
        task.description.includes(searchQuery);
      const matchTag =
        selectedTag === "ALL" || task.tags.includes(selectedTag);
      return matchMonth && matchSearch && matchTag;
    });
  }, [tasks, selectedMonth, searchQuery, selectedTag]);

  return (
    <div className="space-y-8">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-indigo-900 mb-2">校務ダッシュボード</h1>
          <p className="text-slate-600 text-lg">
            時期に応じた業務や、過去の先生方のノウハウを確認できます。
          </p>
        </div>
        <Link 
          href="/task/new" 
          className="inline-flex w-full sm:w-auto items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl shadow-sm hover:shadow-md transition-all shrink-0"
        >
          <PlusCircle size={22} />
          新規マニュアル作成
        </Link>
      </div>

      {/* Month Selector */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-indigo-100 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 min-w-max">
          {MONTHS.map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMonth(m)}
              className={`px-5 py-3 rounded-lg font-bold text-lg transition-colors flex flex-col items-center min-w-[80px] ${
                selectedMonth === m
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
              }`}
            >
              <span className="text-sm font-normal opacity-80">令和8年度</span>
              <span>{m}月</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 flex items-center bg-white rounded-xl shadow-sm border border-indigo-100 px-4 py-3">
          <Search className="text-slate-400 mr-3" size={24} />
          <input
            type="text"
            placeholder="業務名やキーワードで検索..."
            className="w-full text-lg outline-none text-slate-700 bg-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center bg-white rounded-xl shadow-sm border border-indigo-100 px-4 py-3">
          <TagIcon className="text-slate-400 mr-3" size={24} />
          <select
            className="w-full text-lg outline-none text-slate-700 bg-transparent cursor-pointer"
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value as Tag | "ALL")}
          >
            <option value="ALL">すべてのタグ</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 border-b-2 border-indigo-200 pb-2">
          <Calendar className="text-indigo-600" />
          {selectedMonth}月の業務一覧
        </h2>

        {loading ? (
          <div className="bg-white rounded-xl p-10 text-center shadow-sm border border-indigo-100 flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
            <p className="text-slate-500 text-lg">タスクを読み込み中...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center shadow-sm border border-indigo-100">
            <p className="text-slate-500 text-lg">
              該当する業務は見つかりませんでした。
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredTasks.map((task) => (
              <KnowledgeCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
