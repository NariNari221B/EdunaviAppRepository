"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [timeoutReached, setTimeoutReached] = useState(false);

  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        console.warn("Auth loading timeout reached. Forcing resolution.");
        setTimeoutReached(true);
      }, 5000); // 5秒で強制的にローディング解除
      return () => clearTimeout(timer);
    }
  }, [loading]);

  useEffect(() => {
    const isActuallyLoading = loading && !timeoutReached;
    if (!isActuallyLoading && !user && pathname !== "/login") {
      router.push("/login");
    }
  }, [user, loading, timeoutReached, router, pathname]);

  if (loading && !timeoutReached) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-indigo-600" size={48} />
          <p className="text-slate-500 font-medium">認証情報を確認中...</p>
        </div>
      </div>
    );
  }

  // 未ログインで /login 以外にいる場合は何も表示しない（useEffectでリダイレクトされる）
  if (!user && pathname !== "/login") {
    return null;
  }

  return <>{children}</>;
}
