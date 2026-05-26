"use client";

import { use, useState, useEffect } from "react";
import { ArrowLeft, CheckCircle2, MessageSquare, Plus, UserCircle2, Heart, Paperclip, FileText, FileSpreadsheet, Loader2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { Task, Tip } from "@/types";

export default function TaskDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [newTip, setNewTip] = useState("");
  const [submittingTip, setSubmittingTip] = useState(false);

  useEffect(() => {
    async function fetchTask() {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          tips (
            id,
            content,
            created_at,
            likes,
            author:users (
              name,
              role
            )
          ),
          attachments (
            id,
            file_name,
            file_url,
            file_type
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) {
        console.error("Error fetching task:", error);
      } else {
        setTask(data as unknown as Task);
      }
      setLoading(false);
    }
    
    fetchTask();
  }, [id]);

  const handleAddTip = async () => {
    if (!newTip.trim() || !user) {
      if (!user) alert("ログインが必要です");
      return;
    }
    
    setSubmittingTip(true);
    const { data, error } = await supabase
      .from('tips')
      .insert({
        task_id: id,
        author_id: user.id,
        content: newTip
      })
      .select(`
        id,
        content,
        created_at,
        likes,
        author:users (
          name,
          role
        )
      `)
      .single();
      
    if (error) {
      console.error("Error adding tip:", error);
      alert("Tipsの投稿に失敗しました。");
    } else if (data) {
      setTask(prev => prev ? { ...prev, tips: [...(prev.tips || []), data as unknown as Tip] } : null);
      setNewTip("");
    }
    setSubmittingTip(false);
  };

  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('attachments')
        .createSignedUrl(fileUrl, 60); // 60秒間有効なURL

      if (error) throw error;
      if (data?.signedUrl) {
        // 別タブで開くかダウンロード
        window.open(data.signedUrl, '_blank');
      }
    } catch (err) {
      console.error('Download error:', err);
      alert('ファイルの取得に失敗しました。');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
        <p className="text-slate-500 text-lg">タスクを読み込み中...</p>
      </div>
    );
  }

  if (!task) {
    return notFound();
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back Button */}
      <Link
        href="/"
        className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
      >
        <ArrowLeft size={20} className="mr-1" />
        ダッシュボードに戻る
      </Link>

      {/* Header Info */}
      <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-6 sm:p-8">
        <div className="flex gap-2 mb-4">
          {task.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-full"
            >
              {tag}
            </span>
          ))}
          <span className="px-3 py-1 bg-slate-100 text-slate-700 text-sm font-medium rounded-full flex items-center">
            {task.month}月予定
          </span>
        </div>
        
        <h1 className="text-3xl sm:text-4xl font-bold text-indigo-900 mb-4">{task.title}</h1>
        <p className="text-slate-600 text-lg leading-relaxed">{task.description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Official Manual / Steps */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-indigo-100 overflow-hidden">
            <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100">
              <h2 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
                <CheckCircle2 className="text-indigo-600" />
                基本マニュアル（手順）
              </h2>
            </div>
            <div className="p-6">
              <ul className="space-y-4">
                {task.steps.map((step, index) => (
                  <li key={index} className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center mt-0.5">
                      {index + 1}
                    </div>
                    <p className="text-lg text-slate-800 pt-1 leading-relaxed">{step}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Attachments Section */}
          {task.attachments && task.attachments.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-indigo-100 overflow-hidden mt-6">
              <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100">
                <h2 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                  <Paperclip className="text-indigo-600" size={20} />
                  添付ファイル・フォーマット
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {task.attachments.map((file) => (
                    <button 
                      key={file.id} 
                      onClick={() => handleDownload(file.file_url, file.file_name)}
                      className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-left"
                    >
                      {file.file_name.endsWith('.xls') || file.file_name.endsWith('.xlsx') ? (
                        <FileSpreadsheet className="text-green-600 flex-shrink-0" size={24} />
                      ) : file.file_name.endsWith('.pdf') ? (
                        <FileText className="text-red-600 flex-shrink-0" size={24} />
                      ) : (
                        <Paperclip className="text-blue-600 flex-shrink-0" size={24} />
                      )}
                      <span className="text-slate-700 font-medium break-all text-sm">{file.file_name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Tips / Comments (SNS style) */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-indigo-100 overflow-hidden flex flex-col h-full">
            <div className="bg-orange-50 px-6 py-4 border-b border-orange-100">
              <h2 className="text-xl font-bold text-orange-800 flex items-center gap-2">
                <MessageSquare className="text-orange-600" />
                先生方のTips・落とし穴
              </h2>
            </div>
            
            <div className="p-4 space-y-4 flex-1">
              {(task.tips || []).length === 0 ? (
                <p className="text-slate-500 text-center py-4">まだTipsがありません。</p>
              ) : (
                (task.tips || []).map((tip) => (
                  <div key={tip.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <UserCircle2 className="text-slate-400" size={24} />
                      <div>
                        <p className="font-bold text-slate-800 text-sm leading-none">{tip.author?.name || "匿名"}</p>
                        <p className="text-xs text-slate-500 mt-1">{tip.author?.role || ""} • {tip.created_at ? new Date(tip.created_at).toLocaleDateString('ja-JP') : ""}</p>
                      </div>
                    </div>
                    <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap mb-3">{tip.content}</p>
                    <div className="flex items-center gap-1 text-slate-400 hover:text-pink-500 transition-colors cursor-pointer w-fit">
                      <Heart size={16} className={(tip.likes || 0) > 0 ? "fill-pink-100 text-pink-500" : ""} />
                      <span className="text-xs font-bold">{(tip.likes || 0) > 0 ? tip.likes : 'いいね'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Tip Input */}
            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <textarea
                placeholder="後任の先生へアドバイスを残す..."
                className="w-full text-base p-3 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                rows={3}
                value={newTip}
                onChange={(e) => setNewTip(e.target.value)}
              />
              <button 
                onClick={handleAddTip}
                disabled={submittingTip || !newTip.trim()}
                className="mt-3 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {submittingTip ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                Tipsを投稿
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
