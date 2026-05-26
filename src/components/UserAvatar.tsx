import Image from "next/image";
import { User } from "lucide-react";

interface UserAvatarProps {
  avatarUrl?: string | null;
  name?: string;
  size?: number;
  className?: string;
}

export default function UserAvatar({ avatarUrl, name, size = 40, className = "" }: UserAvatarProps) {
  // If there's an avatar URL, use next/image (or standard img if next/image isn't configured for Supabase domains)
  if (avatarUrl) {
    return (
      <div 
        className={`relative rounded-full overflow-hidden shrink-0 border border-slate-200 ${className}`}
        style={{ width: size, height: size }}
      >
        <img
          src={avatarUrl}
          alt={name ? `${name}のアイコン` : "ユーザーアイコン"}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // If there's a name but no image, we could show initials, but for now we'll stick to a default icon
  // with a nice background based on the first letter (optional enhancement)
  return (
    <div 
      className={`rounded-full shrink-0 flex items-center justify-center bg-indigo-100 text-indigo-600 border border-indigo-200 ${className}`}
      style={{ width: size, height: size }}
    >
      <User size={size * 0.6} className="opacity-80" />
    </div>
  );
}
