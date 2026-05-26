"use client";

import { useState } from "react";
import { ArrowLeft, Plus, Trash2, UploadCloud, Save } from "lucide-react";
import Link from "next/link";
import { MONTHS, Tag } from "@/data/mockData";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";

export default function NewTaskPage() {
  const router = useRouter();
  
  const [title, setTitle] = useState("");
  const [month, setMonth] = useState<number>(4);
  const [description, setDescription] = useState("");
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [steps, setSteps] = useState<string[]>([""]);
  const [files, setFiles] = useState<File[]>([]);
  const { user } = useAuth();

  const allTags: Tag[] = ["校務", "行事", "ICT", "提出書類", "生徒指導", "成績処理"];

  const handleTagToggle = (tag: Tag) => {
    setSelectedTags((prev) => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleStepChange = (index: number, value: string) => {
    const newSteps = [...steps];
    newSteps[index] = value;
    setSteps(newSteps);
  };

  const addStep = () => {
    setSteps([...steps, ""]);
  };

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      const MAX_SIZE = 5 * 1024 * 1024; // 5MB
      
      const validFiles = selectedFiles.filter(f => {
        if (f.size > MAX_SIZE) {
          alert(`ファイル「${f.name}」は5MBを超えています。5MB以下のファイルを選択してください。`);
          return false;
        }
        return true;
      });
      
      setFiles([...files, ...validFiles]);
    }
    // リセットして同じファイルを選択できるようにする
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !user) {
      if (!user) alert("ログインが必要です");
      return;
    }

    setSubmitting(true);
    
    // 1. タスクの作成
    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .insert({
        title,
        month,
        description,
        tags: selectedTags,
        steps: steps.filter(s => s.trim() !== ""),
        author_id: user.id,
      })
      .select()
      .single();

    if (taskError) {
      console.error("Error creating task:", taskError);
      alert("タスク作成エラー: " + taskError.message);
      setSubmitting(false);
      return;
    }

    // 2. ファイルのアップロードとアタッチメントの保存
    if (files.length > 0 && taskData) {
      for (const file of files) {
        // ファイル名を一意にする (タイムスタンプ + ランダム文字列)
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const filePath = `${taskData.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(filePath, file);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          // 失敗してもタスク自体はできているので続行
          continue;
        }

        // 3. データベースのattachmentsテーブルに記録
        await supabase.from('attachments').insert({
          task_id: taskData.id,
          file_name: file.name,
          file_url: filePath, // バケット内のパスを保存
          file_type: file.type || 'application/octet-stream'
        });
      }
    }

    setSubmitting(false);
    alert("新しい業務マニュアルを保存しました！");
    router.push("/");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <Link
        href="/"
        className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
      >
        <ArrowLeft size={20} className="mr-1" />
        ダッシュボードに戻る
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-indigo-900 mb-2">新規業務マニュアル作成</h1>
        <p className="text-slate-600">後任の先生がスムーズに業務を行えるよう、情報を登録してください。</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* 基本情報 */}
        <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-6 space-y-6">
          <h2 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-2">基本情報</h2>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">業務タイトル <span className="text-red-500">*</span></label>
            <input 
              required
              type="text" 
              placeholder="例：修学旅行のしおり作成"
              className="w-full text-lg p-3 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">実施月 <span className="text-red-500">*</span></label>
              <select 
                className="w-full text-lg p-3 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none cursor-pointer"
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
              >
                {MONTHS.map(m => (
                  <option key={m} value={m}>{m}月</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">関連タグ</label>
              <div className="flex flex-wrap gap-2">
                {allTags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                      selectedTags.includes(tag)
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-300"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">業務の概要・目的 <span className="text-red-500">*</span></label>
            <textarea 
              required
              placeholder="この業務が何のために行われるのか、簡単に記載してください。"
              rows={3}
              className="w-full text-base p-3 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* 手順 */}
        <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-6 space-y-4">
          <h2 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-2">基本手順</h2>
          
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={index} className="flex gap-3 items-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center mt-1">
                  {index + 1}
                </div>
                <input 
                  type="text" 
                  placeholder="手順を入力..."
                  className="flex-1 text-base p-3 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                  value={step}
                  onChange={(e) => handleStepChange(index, e.target.value)}
                  required
                />
                {steps.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => removeStep(index)}
                    className="p-3 text-slate-400 hover:text-red-500 transition-colors mt-1"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            ))}
          </div>
          
          <button 
            type="button" 
            onClick={addStep}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-bold py-2 transition-colors"
          >
            <Plus size={20} />
            手順を追加する
          </button>
        </div>

        {/* 添付ファイル */}
        <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-6 space-y-4">
          <h2 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-2">添付ファイル・フォーマット</h2>
          <p className="text-sm text-slate-500">過去に使用したExcelフォーマットや、配布プリントのPDFなどがあればアップロードしてください。</p>
          
          {/* ドラッグ＆ドロップ領域 (モック) */}
          <div className="border-2 border-dashed border-indigo-200 rounded-xl p-8 text-center hover:bg-indigo-50 transition-colors relative">
            <input 
              type="file" 
              multiple 
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <UploadCloud size={48} className="text-indigo-400 mx-auto mb-3" />
            <p className="text-slate-700 font-medium text-lg">クリック または ファイルをドラッグ＆ドロップ</p>
            <p className="text-slate-500 text-sm mt-1">Word, Excel, PDF, 画像ファイル対応 (各最大5MB)</p>
          </div>

          {/* アップロード済みファイル一覧 */}
          {files.length > 0 && (
            <div className="space-y-2 mt-4">
              <h3 className="text-sm font-bold text-slate-700">アップロード予定のファイル:</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {files.map((file, idx) => (
                  <li key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex flex-col overflow-hidden mr-2">
                      <span className="truncate text-sm font-medium text-slate-700">{file.name}</span>
                      <span className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="text-slate-400 hover:text-red-500 p-1 transition-colors flex-shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* 保存ボタン */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-4 pt-4">
          <Link 
            href="/"
            className="w-full sm:w-auto text-center px-6 py-3 rounded-lg font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            キャンセル
          </Link>
          <button 
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto justify-center px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
          >
            {submitting ? <Save size={20} className="animate-pulse" /> : <Save size={20} />}
            {submitting ? "保存中..." : "マニュアルを保存する"}
          </button>
        </div>
      </form>
    </div>
  );
}
