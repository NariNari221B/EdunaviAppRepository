"use client";

import { use, useState, useEffect } from "react";
import { ArrowLeft, CheckCircle2, MessageSquare, Plus, UserCircle2, Loader2, Trash2, ShieldCheck, Info } from "lucide-react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { Question, Answer } from "@/types";

export default function QuestionDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [newAnswer, setNewAnswer] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  
  const [deletingQuestion, setDeletingQuestion] = useState(false);
  const [confirmQuestionDelete, setConfirmQuestionDelete] = useState(false);
  
  const [deletingAnswerId, setDeletingAnswerId] = useState<string | null>(null);
  const [confirmAnswerId, setConfirmAnswerId] = useState<string | null>(null);

  const [resolvingId, setResolvingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchQuestion() {
      const { data, error } = await supabase
        .from('questions')
        .select(`
          *,
          author:users (
            name,
            role
          ),
          answers (
            *,
            author:users (
              name,
              role
            )
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) {
        console.error("Error fetching question:", error);
      } else {
        // answersをcreated_at順に並べ替え（ただしベストアンサーが一番上）
        if (data && data.answers) {
          data.answers.sort((a: any, b: any) => {
            if (a.is_best_answer && !b.is_best_answer) return -1;
            if (!a.is_best_answer && b.is_best_answer) return 1;
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          });
        }
        setQuestion(data as unknown as Question);
      }
      setLoading(false);
    }
    
    fetchQuestion();
  }, [id]);

  const handleAddAnswer = async () => {
    if (!newAnswer.trim() || !user) {
      if (!user) alert("ログインが必要です");
      return;
    }
    
    setSubmittingAnswer(true);
    const { data, error } = await supabase
      .from('answers')
      .insert({
        question_id: id,
        author_id: user.id,
        content: newAnswer,
        is_anonymous: isAnonymous
      })
      .select(`
        *,
        author:users (
          name,
          role
        )
      `)
      .single();
      
    if (error) {
      console.error("Error adding answer:", error);
      alert("回答の投稿に失敗しました。");
    } else if (data) {
      setQuestion(prev => prev ? { 
        ...prev, 
        answers: [...(prev.answers || []), data as unknown as Answer] 
      } : null);
      setNewAnswer("");
    }
    setSubmittingAnswer(false);
  };

  const handleDeleteQuestionClick = () => {
    if (confirmQuestionDelete) {
      executeDeleteQuestion();
    } else {
      setConfirmQuestionDelete(true);
      setTimeout(() => setConfirmQuestionDelete(false), 3000);
    }
  };

  const executeDeleteQuestion = async () => {
    setDeletingQuestion(true);
    try {
      const { error } = await supabase.from('questions').delete().eq('id', id);
      if (error) throw error;
      alert('質問を削除しました。');
      router.push('/qa');
    } catch (err: any) {
      console.error(err);
      alert('削除に失敗しました: ' + err.message);
      setDeletingQuestion(false);
    }
  };

  const handleDeleteAnswerClick = (answerId: string) => {
    if (confirmAnswerId === answerId) {
      executeDeleteAnswer(answerId);
    } else {
      setConfirmAnswerId(answerId);
      setTimeout(() => setConfirmAnswerId(null), 3000);
    }
  };

  const executeDeleteAnswer = async (answerId: string) => {
    setDeletingAnswerId(answerId);
    try {
      const { error } = await supabase.from('answers').delete().eq('id', answerId);
      if (error) throw error;
      setQuestion(prev => prev ? { 
        ...prev, 
        answers: prev.answers?.filter(a => a.id !== answerId) 
      } : null);
    } catch (err: any) {
      console.error(err);
      alert('回答の削除に失敗しました: ' + err.message);
    } finally {
      setDeletingAnswerId(null);
      setConfirmAnswerId(null);
    }
  };

  const handleMarkBestAnswer = async (answerId: string) => {
    if (!confirm('この回答をベストアンサーにして、質問を「解決済み」にしますか？')) return;
    
    setResolvingId(answerId);
    try {
      // 1. ベストアンサーを更新
      await supabase.from('answers').update({ is_best_answer: true }).eq('id', answerId);
      // 2. 質問を解決済みに更新
      await supabase.from('questions').update({ is_resolved: true }).eq('id', id);
      
      // ローカルステートの更新
      setQuestion(prev => {
        if (!prev) return null;
        const newAnswers = prev.answers?.map(a => 
          a.id === answerId ? { ...a, is_best_answer: true } : a
        );
        // 並べ替え
        newAnswers?.sort((a, b) => {
          if (a.is_best_answer && !b.is_best_answer) return -1;
          if (!a.is_best_answer && b.is_best_answer) return 1;
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });
        
        return {
          ...prev,
          is_resolved: true,
          answers: newAnswers
        };
      });
      alert("ベストアンサーを選び、質問を解決済みにしました！");
    } catch (err: any) {
      console.error(err);
      alert("エラーが発生しました: " + err.message);
    } finally {
      setResolvingId(null);
    }
  };

  const getAuthorDisplay = (item: Question | Answer) => {
    if (item.is_anonymous) {
      return "匿名希望の先生";
    }
    return item.author?.name || "名無し先生";
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin text-pink-600" size={40} />
        <p className="text-slate-500 text-lg">質問を読み込み中...</p>
      </div>
    );
  }

  if (!question) {
    return notFound();
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Back Button */}
      <Link
        href="/qa"
        className="inline-flex items-center text-slate-500 hover:text-pink-600 font-medium transition-colors"
      >
        <ArrowLeft size={20} className="mr-1" />
        Q&A一覧に戻る
      </Link>

      {/* Question Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className={`px-6 py-4 border-b flex flex-wrap items-center justify-between gap-3 ${
          question.is_resolved ? 'bg-green-50 border-green-100' : 'bg-slate-50 border-slate-100'
        }`}>
          <div className="flex items-center gap-3">
            {question.is_resolved ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-800">
                <CheckCircle2 size={16} />
                解決済
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold bg-pink-100 text-pink-800">
                <MessageSquare size={16} />
                質問・受付中
              </span>
            )}
            
            <div className="flex gap-2 flex-wrap">
              {question.tags.map(tag => (
                <span key={tag} className="text-xs font-bold text-slate-600 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {user && question.author_id === user.id && (
            <button 
              onClick={handleDeleteQuestionClick}
              disabled={deletingQuestion}
              className={`transition-colors p-2 rounded-lg flex items-center justify-center gap-1 text-sm font-bold min-h-[36px] ${
                confirmQuestionDelete ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-white border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 shadow-sm'
              }`}
              title="この質問を削除"
            >
              {deletingQuestion ? <Loader2 className="animate-spin pointer-events-none" size={16} /> : <Trash2 className="pointer-events-none" size={16} />}
              <span className={confirmQuestionDelete ? "inline" : "hidden sm:inline"}>
                {confirmQuestionDelete ? "本当に削除？" : "削除"}
              </span>
            </button>
          )}
        </div>

        <div className="p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-6">{question.title}</h1>
          <div className="text-slate-700 text-base sm:text-lg leading-relaxed whitespace-pre-wrap mb-8">
            {question.content}
          </div>
          
          <div className="flex items-center justify-between pt-6 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">
                <UserCircle2 size={24} />
              </div>
              <div>
                <p className="font-bold text-slate-800 leading-none">
                  {getAuthorDisplay(question)}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {new Date(question.created_at).toLocaleDateString('ja-JP')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Answers Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 px-2">
          <MessageSquare className="text-pink-500" />
          回答 ({(question.answers || []).length}件)
        </h2>

        {(question.answers || []).length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-dashed border-slate-300">
            <p className="text-slate-500 font-medium">まだ回答がありません。<br/>最初の回答を投稿して助けてあげましょう！</p>
          </div>
        ) : (
          <div className="space-y-4">
            {(question.answers || []).map((answer) => (
              <div 
                key={answer.id} 
                className={`bg-white rounded-xl p-6 shadow-sm border transition-all ${
                  answer.is_best_answer ? 'border-2 border-green-500 shadow-green-100' : 'border-slate-200'
                }`}
              >
                {answer.is_best_answer && (
                  <div className="flex items-center gap-2 text-green-700 font-bold bg-green-50 px-3 py-1.5 rounded-lg w-fit mb-4 border border-green-200">
                    <ShieldCheck size={18} />
                    ベストアンサー
                  </div>
                )}
                
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                      <UserCircle2 size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm sm:text-base leading-none">
                        {getAuthorDisplay(answer)}
                      </p>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        {new Date(answer.created_at).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {/* Delete Answer Button */}
                    {user && answer.author_id === user.id && (
                      <button 
                        onClick={() => handleDeleteAnswerClick(answer.id)}
                        disabled={deletingAnswerId === answer.id}
                        className={`transition-colors p-2 rounded-lg flex items-center gap-1 text-xs font-bold min-h-[36px] ${
                          confirmAnswerId === answer.id ? 'bg-red-500 text-white hover:bg-red-600' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'
                        }`}
                        title="回答を削除"
                      >
                        {deletingAnswerId === answer.id ? <Loader2 className="animate-spin pointer-events-none" size={16} /> : <Trash2 className="pointer-events-none" size={16} />}
                        {confirmAnswerId === answer.id && <span>本当に削除？</span>}
                      </button>
                    )}
                    
                    {/* Best Answer Button for Question Author */}
                    {user && question.author_id === user.id && !question.is_resolved && (
                      <button
                        onClick={() => handleMarkBestAnswer(answer.id)}
                        disabled={resolvingId === answer.id}
                        className="bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors"
                      >
                        {resolvingId === answer.id ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                        ベストアンサーにする
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {answer.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Answer Form */}
      {!question.is_resolved && (
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 mt-8">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Plus className="text-pink-600" />
            回答を書き込む
          </h3>
          <div className="space-y-4">
            <textarea
              placeholder="質問への回答やアドバイスを入力してください..."
              className="w-full text-base p-4 rounded-xl border border-slate-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none resize-none bg-white min-h-[120px]"
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
            />
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-5 h-5 text-pink-600 rounded border-slate-300 focus:ring-pink-500"
                />
                <span className="font-bold text-slate-700 text-sm">匿名で回答する</span>
              </label>
              
              <button 
                onClick={handleAddAnswer}
                disabled={submittingAnswer || !newAnswer.trim()}
                className="w-full sm:w-auto bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submittingAnswer ? <Loader2 className="animate-spin" size={20} /> : <MessageSquare size={20} />}
                回答を投稿する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
