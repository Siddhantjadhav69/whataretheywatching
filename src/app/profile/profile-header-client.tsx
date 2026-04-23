"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Settings, X, User, Image as ImageIcon, Type, LogOut, UserPlus } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function getInitials(username: string, email: string) {
  if (username) {
    return username.slice(0, 2).toUpperCase();
  }
  const name = email.split("@")[0] ?? "user";
  return name
    .split(/[._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatarUrl?: string | null;
  currentBio?: string | null;
  username: string;
  onUpdate: (avatarUrl: string, bio: string) => void;
}

function SettingsModal({ isOpen, onClose, currentAvatarUrl, currentBio, username, onUpdate }: SettingsModalProps) {
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl || "");
  const [bio, setBio] = useState(currentBio || "");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const response = await fetch("/api/user/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          avatarUrl: avatarUrl || null,
          bio: bio || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      onUpdate(avatarUrl, bio);
      toast.success("Profile updated successfully!");
      onClose();
    } catch (error) {
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md rounded-lg border border-zinc-800 bg-zinc-900 shadow-xl [&>button]:text-zinc-400 [&>button]:hover:text-zinc-100">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-zinc-100">Profile Settings</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Make changes to your profile here. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-zinc-300">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Avatar URL
              </div>
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:border-zinc-700 focus:outline-none"
            />
            <p className="mt-1 text-xs text-zinc-500">Enter a direct image URL for your profile picture</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-zinc-300">
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4" />
                Bio
              </div>
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              maxLength={500}
              rows={3}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:border-zinc-700 focus:outline-none"
            />
            <p className="mt-1 text-xs text-zinc-500">{bio.length}/500 characters</p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-zinc-800 bg-zinc-800 px-4 py-2 text-zinc-100 hover:bg-zinc-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="flex-1 rounded-lg bg-flame px-4 py-2 text-white hover:bg-[#ff674d] disabled:opacity-50"
            >
              {isUpdating ? "Updating..." : "Save Changes"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ConnectionsModal({
  isOpen,
  onClose,
  title,
  users
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  users: any[];
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md rounded-lg border border-zinc-800 bg-zinc-900 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-zinc-100">{title}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-2">
          {users.length === 0 ? (
             <p className="text-zinc-400 text-sm">No {title.toLowerCase()} yet.</p>
          ) : (
            users.map(u => (
              <a href={`/u/${u.username || u.id}`} key={u.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800 transition">
                <div className="h-10 w-10 shrink-0 bg-zinc-800 rounded-full overflow-hidden flex items-center justify-center text-zinc-400 font-bold">
                  {u.avatarUrl ? <img src={u.avatarUrl} alt="avatar" className="h-full w-full object-cover" /> : (u.username?.[0]?.toUpperCase() || 'U')}
                </div>
                <div>
                   <p className="text-zinc-100 font-bold text-sm">@{u.username || 'user'}</p>
                   {u.username && <p className="text-zinc-500 text-xs">{u.email}</p>}
                </div>
              </a>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ProfileHeaderClient({
  username,
  email,
  initialAvatarUrl,
  initialBio,
  stats,
  mappedFollowers,
  mappedFollowing
}: {
  username: string;
  email: string;
  initialAvatarUrl: string | null;
  initialBio: string | null;
  stats: Array<{ label: string; value: number; clickable?: boolean }>;
  mappedFollowers?: any[];
  mappedFollowing?: any[];
}) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<"Followers" | "Following" | null>(null);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [bio, setBio] = useState(initialBio);

  const initials = getInitials(username, email);

  const handleProfileUpdate = (newAvatarUrl: string, newBio: string) => {
    setAvatarUrl(newAvatarUrl || null);
    setBio(newBio || null);
  };

  const handleLogout = async () => {
    try {
      await signOut({ redirect: true, callbackUrl: '/' });
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  return (
    <>
      <header className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/25">
        <div className="border-b border-zinc-800 bg-gradient-to-r from-zinc-900 via-zinc-800/50 to-transparent p-4 sm:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-20 w-20 shrink-0 place-items-center rounded-lg border border-zinc-800 bg-zinc-800 text-2xl font-black text-zinc-100 shadow-lg overflow-hidden">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={username}
                    className="h-full w-full object-cover rounded-lg"
                  />
                ) : (
                  initials
                )}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">Profile Dashboard</p>
                <h1 className="mt-2 text-3xl font-black tracking-normal text-zinc-100 sm:text-5xl">
                  @{username}
                </h1>
                {bio && (
                  <p className="mt-2 text-sm font-semibold text-zinc-400 max-w-2xl block break-words">{bio}</p>
                )}
                <p className="mt-2 text-sm font-semibold text-zinc-500">{email}</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex gap-2 flex-wrap">
                <Link
                  href="/search?tab=users"
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-800/50 px-4 py-2 text-sm font-bold text-zinc-100 hover:bg-zinc-700 transition"
                >
                  <UserPlus className="h-4 w-4" />
                  Find Friends
                </Link>
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-800/50 px-4 py-2 text-sm font-bold text-zinc-100 hover:bg-zinc-700 transition"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-800/50 px-4 py-2 text-sm font-bold text-zinc-100 hover:bg-zinc-700 transition"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {stats.map((stat) => (
                  <div 
                    key={stat.label} 
                    className={`rounded-lg border border-zinc-800 bg-zinc-800/50 p-3 ${stat.clickable ? 'cursor-pointer hover:bg-zinc-700 transition' : ''}`}
                    onClick={stat.clickable ? () => setActiveModal(stat.label as "Followers" | "Following") : undefined}
                  >
                    <p className="text-2xl font-black text-zinc-100">{stat.value}</p>
                    <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentAvatarUrl={avatarUrl}
        currentBio={bio}
        username={username}
        onUpdate={handleProfileUpdate}
      />

      <ConnectionsModal
        isOpen={activeModal !== null}
        onClose={() => setActiveModal(null)}
        title={activeModal || ""}
        users={activeModal === "Followers" ? (mappedFollowers || []) : (mappedFollowing || [])}
      />
    </>
  );
}
