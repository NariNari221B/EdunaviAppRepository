"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

interface AuthContextType {
  user: User | null;
  profile: { name: string; role: string; avatar_url?: string | null } | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<{ name: string; role: string; avatar_url?: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    console.log(`[AuthDebug] 👤 usersテーブルからプロフィールを取得中... (userId: ${userId})`);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('name, role, avatar_url')
        .eq('id', userId)
        .single();
      if (error) throw error;
      console.log("[AuthDebug] 👤 プロフィールデータの取得に成功しました:", data);
      setProfile(data);
    } catch (err: any) {
      console.error('[AuthDebug] 🚨 プロフィール取得失敗 (usersテーブルへのクエリ中にエラーが発生しました):', err.message || err);
      setProfile(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    // タイムアウト付きの Promise ユーティリティ
    const withTimeout = <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
      return Promise.race([
        promise,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`[AuthTimeout] ${label} が ${ms}ms 以内に応答しませんでした。Supabaseの接続情報（URL・Key）や、テーブル・ネットワーク状態を確認してください。`)), ms)
        )
      ]);
    };

    const initializeAuth = async () => {
      console.log("[AuthDebug] 🚀 initializeAuth を開始します...");
      try {
        console.log("[AuthDebug] 🔑 getSession を呼び出し中...");
        const { data: { session }, error } = await withTimeout(
          supabase.auth.getSession(),
          4000,
          "supabase.auth.getSession()"
        );
        if (error) throw error;
        
        const currentUser = session?.user ?? null;
        console.log("[AuthDebug] 🔑 現在のセッションユーザーを取得しました:", currentUser?.email || "未ログイン");
        if (mounted) setUser(currentUser);
        
        if (currentUser) {
          console.log("[AuthDebug] 👤 プロフィール（users）の読み込みを開始します...");
          await withTimeout(
            fetchProfile(currentUser.id),
            4000,
            "fetchProfile()"
          );
          console.log("[AuthDebug] 👤 プロフィール読み込みが正常に完了しました。");
        } else {
          if (mounted) setProfile(null);
          console.log("[AuthDebug] 👤 未ログイン状態のため、プロフィールをクリアしました。");
        }
      } catch (err: any) {
        console.error('[AuthDebug] 🚨 認証初期化プロセスで例外が発生しました:', err.message || err);
      } finally {
        console.log("[AuthDebug] 🔓 setLoading(false) を実行し、ローディングを完了します。");
        setLoading(false);
      }
    };
    
    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'INITIAL_SESSION') return;
        console.log(`[AuthDebug] 🔄 onAuthStateChange イベント発生: ${event}`);
        
        const currentUser = session?.user ?? null;
        if (mounted) setUser(currentUser);
        
        if (currentUser) {
          try {
            await withTimeout(
              fetchProfile(currentUser.id),
              4000,
              `onAuthStateChange fetchProfile(${event})`
            );
          } catch (err: any) {
            console.error('[AuthDebug] 🚨 onAuthStateChange内でのプロフィール取得中にエラー:', err.message || err);
          }
        } else {
          if (mounted) setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      // セッションの有無に関わらず強制的に状態をリセット
      setUser(null);
      setProfile(null);
      window.location.href = "/login";
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
