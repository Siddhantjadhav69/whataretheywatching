"use client";

import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LogOut, Settings, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function UserMenu() {
  const session = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (session.status !== "authenticated") {
    return null;
  }

  const avatarUrl = (session.data?.user as any)?.avatarUrl;
  const userInitials = session.data?.user?.email?.[0]?.toUpperCase() || "U";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white font-bold text-ink transition hover:bg-white/90"
        aria-label="User menu"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
        ) : (
          userInitials
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-lg border border-white/10 bg-ink shadow-2xl shadow-black/60 border-white/20 z-50">
          <div className="px-4 py-3 border-b border-white/10">
            <p className="text-sm font-bold text-white truncate">{session.data?.user?.email}</p>
          </div>

          <nav className="py-1">
            <button
              onClick={() => {
                router.push("/profile");
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-white/75 hover:bg-white/10 hover:text-white transition"
            >
              <User className="h-4 w-4" />
              My Profile
            </button>

            <button
              onClick={() => {
                router.push("/profile?tab=settings");
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-white/75 hover:bg-white/10 hover:text-white transition"
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>

            <div className="border-t border-white/10 my-1" />

            <button
              onClick={async () => {
                await signOut({ redirect: false });
                setIsOpen(false);
                router.push("/login");
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-flame hover:bg-flame/10 transition"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
