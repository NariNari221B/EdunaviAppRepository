"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, Mail, Lock, UserPlus, LogIn } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); // サインアップ時の名前
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      if (isLogin) {
        // ログイン処理
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/");
      } else {
        // サインアップ処理
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        
        // ユーザーテーブルにも登録
        if (data.user) {
          const { error: profileError } = await supabase.from('users').upsert({
            id: data.user.id,
            name: name || "新しい先生",
            role: "教員",
          });
          if (profileError) {
            console.error("Profile creation failed:", profileError);
            throw new Error(`プロフィール作成に失敗しました: ${profileError.message}`);
          }
        }
        
        alert("アカウントを作成しました！");
        router.push("/");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-indigo-50">
        <div className="bg-indigo-600 p-8 text-center">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">EduNaviApp</h1>
          <p className="text-indigo-100 mt-2 font-medium">校務ナレッジ共有プラットフォーム</p>
        </div>

        <div className="p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">
            {isLogin ? "ログイン" : "アカウント作成"}
          </h2>

          {errorMsg && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded text-sm">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">お名前（表示名）</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                    placeholder="例: 佐藤 太郎"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <UserPlus size={20} />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">メールアドレス</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                  placeholder="teacher@example.com"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail size={20} />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">パスワード</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                  placeholder="••••••••"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock size={20} />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg flex justify-center items-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-70 mt-4"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : isLogin ? (
                <LogIn size={20} />
              ) : (
                <UserPlus size={20} />
              )}
              {isLogin ? "ログインする" : "アカウントを作成してログイン"}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrorMsg("");
              }}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-bold underline transition-colors"
            >
              {isLogin
                ? "アカウントを作成する（サインアップ）"
                : "すでにアカウントをお持ちの方はこちら（ログイン）"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
