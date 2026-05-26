"use client";

import { use, useState, useEffect } from "react";
import { ArrowLeft, Plus, Trash2, UploadCloud, Save, Loader2, Paperclip, FileText, FileSpreadsheet } from "lucide-react";
import Link from "next/link";
import { MONTHS, Tag } from "@/data/mockData";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { Task } from "@/types";

export default function EditTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // フォームステート
  const [title, setTitle] = useState("");
  const [month, setMonth] = useState<number>(4);
  const [description, setDescription] = useState("");
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [steps, setSteps] = useState<string[]>([""]);
  
  // 新規添付ファイル用
  const [newFiles, setNewFiles] = useState<File[]>([]);
  
  // 既存の添付ファイル用
  const [existingAttachments, setExistingAttachments] = useState<{ id: string; file_name: string; file_url: string; file_type: string }[]>([]);
  const [attachmentsToDelete, setAttachmentsToDelete] = useState<{ id: string; file_url: string }[]>([]);

  // 修正履歴メモステート
  const [changedSummary, setChangedSummary] = useState("");

  const allTags: Tag[] = ["校務", "行事", "ICT", "提出書類", "生徒指導", "成績処理"];

  // 既存データのフェッチ
  useEffect(() => {
    async function fetchTaskData() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select(`
            *,
            attachments (
              id,
              file_name,
              file_url,
              file_type
            )
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        if (data) {
          setTitle(data.title || "");
          setMonth(data.month || 4);
          setDescription(data.description || "");
          setSelectedTags(data.tags || []);
          setSteps(data.steps && data.steps.length > 0 ? data.steps : [""]);
          setExistingAttachments(data.attachments || []);
        }
      } catch (err) {
        console.error("Error fetching task for edit:", err);
        alert("データの読み込みに失敗しました。");
        router.push(`/task/${id}`);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchTaskData();
    }
  }, [id, router]);

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

  // 新規ファイルアップロード用
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
      
      setNewFiles([...newFiles, ...validFiles]);
    }
    e.target.value = '';
  };

  const removeNewFile = (index: number) => {
    setNewFiles(newFiles.filter((_, i) => i !== index));
  };

  // 既存ファイルの削除予約
  const handleRemoveExistingAttachment = (attId: string, fileUrl: string) => {
    if (confirm("この添付ファイルを削除しますか？（保存時に完全に削除されます）")) {
      setAttachmentsToDelete([...attachmentsToDelete, { id: attId, file_url: fileUrl }]);
      setExistingAttachments(existingAttachments.filter(a => a.id !== attId));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !user) {
      if (!user) alert("ログインが必要です");
      return;
    }
    if (!changedSummary.trim()) {
      alert("今回の修正内容（履歴メモ）を入力してください");
      return;
    }

    setSubmitting(true);

    try {
      // 1. タスクのUPDATE
      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          title,
          month,
          description,
          tags: selectedTags,
          steps: steps.filter(s => s.trim() !== ""),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // 2. 修正履歴 (task_histories) のINSERT
      const { error: historyError } = await supabase
        .from('task_histories')
        .insert({
          task_id: id,
          updated_by: user.id,
          changed_summary: changedSummary.trim()
        });

      if (historyError) {
        console.error("Failed to insert update history:", historyError);
        // 履歴保存の失敗はタスク更新自体をロールバックさせないようログのみに留める
      }

      // 3. 削除予約された既存ファイルの物理・論理削除
      if (attachmentsToDelete.length > 0) {
        const filePaths = attachmentsToDelete.map(a => a.file_url);
        
        // Storageから削除
        await supabase.storage.from('attachments').remove(filePaths);
        
        // データベース(attachmentsテーブル)から削除
        const deleteIds = attachmentsToDelete.map(a => a.id);
        await supabase.from('attachments').delete().in('id', deleteIds);
      }

      // 4. 新規ファイルのアップロードとアタッチメント保存
      if (newFiles.length > 0) {
        for (const file of newFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
          const filePath = `${id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('attachments')
            .upload(filePath, file);

          if (uploadError) {
            console.error("Upload error:", uploadError);
            continue;
          }

          await supabase.from('attachments').insert({
            task_id: id,
            file_name: file.name,
            file_url: filePath,
            file_type: file.type || 'application/octet-stream'
          });
        }
      }

      alert("マニュアルを更新しました！");
      router.push(`/task/${id}`);
      
    } catch (err: any) {
      console.error("Update error:", err);
      alert("更新エラーが発生しました: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
        <p className="text-slate-500 text-lg">マニュアルを読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <Link
        href={`/task/${id}`}
        className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
      >
        <ArrowLeft size={20} className="mr-1" />
        マニュアル詳細に戻る
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-indigo-900 mb-2">マニュアルの編集</h1>
        <p className="text-slate-600">業務の変更点や追加手順などを更新し、最新の情報にアップデートしてください。</p>
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
          
          {/* 既存の添付ファイル一覧 */}
          {existingAttachments.length > 0 && (
            <div className="space-y-2 mb-4">
              <h3 className="text-sm font-bold text-slate-700">登録済みの添付ファイル:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {existingAttachments.map((file) => (
                  <div 
                    key={file.id} 
                    className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg text-left"
                  >
                    <div className="flex items-center gap-2 overflow-hidden mr-2">
                      {file.file_name.endsWith('.xls') || file.file_name.endsWith('.xlsx') ? (
                        <FileSpreadsheet className="text-green-600 flex-shrink-0" size={20} />
                      ) : file.file_name.endsWith('.pdf') ? (
                        <FileText className="text-red-600 flex-shrink-0" size={20} />
                      ) : (
                        <Paperclip className="text-indigo-400 flex-shrink-0" size={20} />
                      )}
                      <span className="truncate text-slate-700 font-medium text-sm">{file.file_name}</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveExistingAttachment(file.id, file.file_url)}
                      className="text-slate-400 hover:text-red-500 p-1 transition-colors flex-shrink-0"
                      title="このファイルを削除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-sm text-slate-500">追加のExcelフォーマットや、配布プリントのPDFなどを新規アップロードできます。</p>
          
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

          {/* 新規アップロード予定ファイル一覧 */}
          {newFiles.length > 0 && (
            <div className="space-y-2 mt-4">
              <h3 className="text-sm font-bold text-slate-700">新規追加するファイル:</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {newFiles.map((file, idx) => (
                  <li key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex flex-col overflow-hidden mr-2">
                      <span className="truncate text-sm font-medium text-slate-700">{file.name}</span>
                      <span className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeNewFile(idx)}
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

        {/* 修正履歴（今回の変更理由）入力欄 */}
        <div className="bg-orange-50 rounded-xl shadow-sm border border-orange-200 p-6 space-y-4">
          <h2 className="text-xl font-bold text-orange-950 flex items-center gap-2 border-b border-orange-100 pb-2">
            修正履歴の入力
          </h2>
          <p className="text-sm text-orange-800 font-medium">
            共同編集にあたり、今回の変更理由や要約をクリアに入力してください。この内容は詳細画面の修正タイムラインに記録されます。
          </p>
          <div>
            <label className="block text-sm font-bold text-orange-900 mb-2">修正内容（1行メモ） <span className="text-red-500">*</span></label>
            <input 
              required
              type="text" 
              placeholder="例：令和8年度の修学旅行先変更に伴う持ち物・手順のアップデート"
              className="w-full text-base p-3 bg-white rounded-lg border border-orange-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
              value={changedSummary}
              onChange={(e) => setChangedSummary(e.target.value)}
            />
          </div>
        </div>

        {/* 保存ボタン */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-4 pt-4">
          <Link 
            href={`/task/${id}`}
            className="w-full sm:w-auto text-center px-6 py-3 rounded-lg font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            キャンセル
          </Link>
          <button 
            type="submit"
            disabled={submitting || !changedSummary.trim()}
            className="w-full sm:w-auto justify-center px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center gap-2 shadow-md transition-all disabled:opacity-50 cursor-pointer"
          >
            {submitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {submitting ? "更新中..." : "マニュアルを更新する"}
          </button>
        </div>
      </form>
    </div>
  );
}
