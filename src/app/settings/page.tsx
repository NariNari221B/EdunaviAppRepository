"use client";

import { useState, useRef } from "react";
import { User, Settings, Type, Save, Loader2, Lock, Camera, AlertCircle } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import UserAvatar from "@/components/UserAvatar";
import { useEffect } from "react";

export default function SettingsPage() {
  const { fontSize, setFontSize } = useTheme();
  const { user, profile, refreshProfile } = useAuth();
  
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedMsg, setShowSavedMsg] = useState(false);

  // プロフィール画像用の状態
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // パスワード変更用の状態
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [showPasswordSavedMsg, setShowPasswordSavedMsg] = useState(false);

  // 初回ロード時にプロフィールをセット
  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setRole(profile.role || "");
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSaving(true);
    
    const { error } = await supabase
      .from('users')
      .update({ name, role })
      .eq('id', user.id);
      
    setIsSaving(false);
    
    if (error) {
      alert("エラーが発生しました: " + error.message);
    } else {
      setShowSavedMsg(true);
      await refreshProfile(); // Contextの情報を更新してヘッダー等に反映
      setTimeout(() => setShowSavedMsg(false), 3000);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // バリデーション
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setUploadError("JPG, PNG, WebP形式の画像のみアップロード可能です。");
      return;
    }
    
    // 2MB = 2 * 1024 * 1024 bytes
    if (file.size > 2 * 1024 * 1024) {
      setUploadError("画像サイズは2MB以下にしてください。");
      return;
    }

    setUploadError("");
    setIsUploading(true);

    try {
      // ファイル名の生成（キャッシュ対策でタイムスタンプを付与）
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // 1. Storageにアップロード
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // 2. 公開URLを取得
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // 3. usersテーブルを更新
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // 4. コンテキスト（UI）を更新
      await refreshProfile();
      
    } catch (err: any) {
      console.error('Upload error:', err);
      setUploadError("画像のアップロードに失敗しました: " + err.message);
    } finally {
      setIsUploading(false);
      // 入力値をリセットして同じファイルを再度選択できるようにする
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (newPassword.length < 6) {
      setPasswordError("パスワードは6文字以上で入力してください。");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("パスワードが一致しません。");
      return;
    }

    setIsUpdatingPassword(true);
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    setIsUpdatingPassword(false);

    if (error) {
      setPasswordError("パスワードの更新に失敗しました: " + error.message);
    } else {
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordSavedMsg(true);
      setTimeout(() => setShowPasswordSavedMsg(false), 3000);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-indigo-900 mb-2">各種設定</h1>
        <p className="text-slate-600 text-lg">
          プロフィールやアプリの表示設定を変更できます。
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-indigo-100 overflow-hidden">
          <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100 flex items-center gap-2">
            <User className="text-indigo-600" />
            <h2 className="text-xl font-bold text-indigo-900">プロフィール設定</h2>
          </div>
          
          <form onSubmit={handleSave} className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <UserAvatar avatarUrl={profile?.avatar_url} name={name} size={80} />
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                />
                <button 
                  type="button" 
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm text-indigo-600 font-bold border border-indigo-200 px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? <Loader2 className="animate-spin" size={16} /> : <Camera size={16} />}
                  {isUploading ? "アップロード中..." : "画像を変更する"}
                </button>
                <p className="text-xs text-slate-500 mt-2">
                  JPG, PNG, WebP形式・最大2MBまで
                </p>
                {uploadError && (
                  <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {uploadError}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">表示名</label>
                <input 
                  type="text" 
                  className="w-full p-3 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">担当・役職</label>
                <input 
                  type="text" 
                  className="w-full p-3 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <button 
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg shadow-sm flex items-center gap-2 transition-all disabled:opacity-70"
              >
                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                {isSaving ? "保存中..." : "保存する"}
              </button>
              {showSavedMsg && (
                <span className="text-green-600 font-bold text-sm text-center sm:text-left">✓ 保存しました</span>
              )}
            </div>
          </form>
        </div>

        {/* Security Settings (Password) */}
        <div className="bg-white rounded-xl shadow-sm border border-indigo-100 overflow-hidden">
          <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100 flex items-center gap-2">
            <Lock className="text-indigo-600" />
            <h2 className="text-xl font-bold text-indigo-900">セキュリティ設定</h2>
          </div>
          
          <form onSubmit={handleUpdatePassword} className="p-6 space-y-6">
            <p className="text-sm text-slate-500 mb-4">
              ログインに使用するパスワードを変更できます。
            </p>

            {passwordError && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded text-sm mb-4">
                {passwordError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">新しいパスワード</label>
                <input 
                  type="password" 
                  required
                  placeholder="6文字以上"
                  className="w-full p-3 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">新しいパスワード（確認用）</label>
                <input 
                  type="password" 
                  required
                  placeholder="もう一度入力"
                  className="w-full p-3 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <button 
                type="submit"
                disabled={isUpdatingPassword || !newPassword}
                className="w-full sm:w-auto justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg shadow-sm flex items-center gap-2 transition-all disabled:opacity-70"
              >
                {isUpdatingPassword ? <Loader2 className="animate-spin" size={20} /> : <Lock size={20} />}
                {isUpdatingPassword ? "更新中..." : "パスワードを変更する"}
              </button>
              {showPasswordSavedMsg && (
                <span className="text-green-600 font-bold text-sm text-center sm:text-left">✓ パスワードを変更しました</span>
              )}
            </div>
          </form>
        </div>

        {/* Display Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-indigo-100 overflow-hidden">
          <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100 flex items-center gap-2">
            <Settings className="text-indigo-600" />
            <h2 className="text-xl font-bold text-indigo-900">表示設定</h2>
          </div>
          
          <div className="p-6 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Type className="text-slate-500" size={20} />
                <h3 className="text-lg font-bold text-slate-800">文字サイズの変更</h3>
              </div>
              <p className="text-sm text-slate-500 mb-4">
                アプリ全体の文字サイズを変更できます。年配の先生方で文字が小さく読みづらい場合は「大」や「特大」を選択してください。
              </p>
              
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => setFontSize("normal")}
                  className={`px-6 py-3 rounded-lg font-medium border-2 transition-all ${
                    fontSize === "normal"
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 text-slate-600 hover:border-indigo-300"
                  }`}
                >
                  標準
                </button>
                <button
                  onClick={() => setFontSize("large")}
                  className={`px-6 py-3 rounded-lg font-medium border-2 transition-all text-lg ${
                    fontSize === "large"
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 text-slate-600 hover:border-indigo-300"
                  }`}
                >
                  大
                </button>
                <button
                  onClick={() => setFontSize("xlarge")}
                  className={`px-6 py-3 rounded-lg font-medium border-2 transition-all text-xl ${
                    fontSize === "xlarge"
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 text-slate-600 hover:border-indigo-300"
                  }`}
                >
                  特大
                </button>
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 mt-6">
              <h4 className="font-bold mb-2">表示のプレビュー</h4>
              <p className="text-slate-600">
                この文章のサイズが変わることを確認してください。
                ダッシュボードやナレッジ画面の文字サイズも同様に変更されます。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
