"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, MessageSquarePlus, Info } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { Tag } from "@/types";

const AVAILABLE_TAGS: Tag[] = ["校務", "行事", "ICT", "提出書類", "生徒指導", "成績処理", "悩み相談", "その他"];

export default function NewQuestionPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const toggleTag = (tag: Tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      if (selectedTags.length >= 3) {
        alert("タグは最大3つまで選択できます。");
        return;
      }
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("質問を投稿するにはログインが必要です");
      return;
    }

    if (!title.trim() || !content.trim()) {
      alert("タイトルと本文を入力してください");
      return;
    }

    setSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('questions')
        .insert({
          title: title.trim(),
          content: content.trim(),
          author_id: user.id,
          tags: selectedTags,
          is_anonymous: isAnonymous
        })
        .select()
        .single();

      if (error) throw error;
      
      alert("質問を投稿しました！");
      router.push(`/qa/${data.id}`);
    } catch (err: any) {
      console.error(err);
      alert("投稿に失敗しました: " + err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href="/qa"
        className="inline-flex items-center text-slate-500 hover:text-pink-600 font-medium transition-colors"
      >
        <ArrowLeft size={20} className="mr-1" />
        Q&A一覧に戻る
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-pink-600 to-rose-500 px-8 py-6 text-white">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquarePlus size={28} />
            新しく質問する
          </h1>
          <p className="mt-2 text-pink-100">
            日々の業務で困っていることや、先生方に相談したいことを投稿しましょう。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <label htmlFor="title" className="block text-sm font-bold text-slate-700">
              質問のタイトル <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: タブレットの一括再起動の方法について"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all"
              required
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <label htmlFor="content" className="block text-sm font-bold text-slate-700">
              質問の詳細 <span className="text-red-500">*</span>
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="困っている状況や、知りたいことを具体的に記入してください。"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all min-h-[160px] resize-y"
              required
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">
              関連するタグ (最大3つ)
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border-2 ${
                    selectedTags.includes(tag)
                      ? "bg-pink-100 border-pink-500 text-pink-700"
                      : "bg-white border-slate-200 text-slate-600 hover:border-pink-300 hover:bg-slate-50"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Anonymous Checkbox */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-start gap-3 mt-4">
            <div className="flex-shrink-0 mt-0.5">
              <input
                id="isAnonymous"
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-5 h-5 text-pink-600 rounded border-slate-300 focus:ring-pink-500"
              />
            </div>
            <div>
              <label htmlFor="isAnonymous" className="font-bold text-slate-700 cursor-pointer block">
                匿名で投稿する
              </label>
              <p className="text-xs text-slate-500 mt-1 flex items-start gap-1">
                <Info size={14} className="flex-shrink-0 mt-0.5" />
                チェックを入れると、一覧や詳細画面であなたの名前の代わりに「匿名希望の先生」と表示されます。
              </p>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[160px]"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  投稿中...
                </>
              ) : (
                "質問を投稿する"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
