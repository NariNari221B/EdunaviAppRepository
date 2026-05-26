import { Tag, MessageCircle, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Task } from "@/types";

export default function KnowledgeCard({ task }: { task: Task }) {
  // いいね数の合計を計算
  const totalLikes = (task.tips || []).reduce((acc, tip) => acc + (tip.likes || 0), 0);

  return (
    <Link
      href={`/task/${task.id}`}
      className="group block bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-indigo-100 overflow-hidden relative"
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="shrink-0 w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center">
              {task.month}月
            </span>
            <h3 className="text-xl font-bold text-indigo-900 group-hover:text-indigo-600 transition-colors">
              {task.title}
            </h3>
          </div>
          <div className="flex gap-2 shrink-0 ml-4 hidden sm:flex">
            {task.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        
        {/* モバイル用タグ表示 */}
        <div className="flex gap-2 shrink-0 mb-3 sm:hidden">
          {task.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>

        <p className="text-slate-600 mb-4">{task.description}</p>
        
        <div className="flex items-center text-sm font-medium text-slate-500 gap-4">
          <div className="flex items-center gap-1">
            <MessageCircle size={18} className="text-indigo-400" />
            Tips: <span className="text-indigo-600 font-bold">{(task.tips || []).length}</span>件
          </div>
          {totalLikes > 0 && (
             <div className="flex items-center gap-1">
               <span className="text-pink-500 font-bold">♥</span> {totalLikes}
             </div>
          )}
        </div>
      </div>
      
      {/* Arrow indicator */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
        <ChevronRight size={28} className="text-indigo-400" />
      </div>
    </Link>
  );
}
