"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getStatusMeta, TrackingStatusValue } from "@/lib/status";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

type Notification = {
  id: string;
  type: "TRACK_UPDATE" | "NEW_FOLLOWER";
  title?: string;
  status?: TrackingStatusValue;
  mediaType?: string;
  isFollowingBack?: boolean;
  user: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
};

export function NotificationsMenu() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pendingFollowBack, setPendingFollowBack] = useState<string | null>(null);
  const { data: session } = useSession();

  async function followBack(targetUserId: string) {
    setPendingFollowBack(targetUserId);
    try {
      const response = await fetch("/api/friends/follow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ targetUserId })
      });

      if (!response.ok) {
        throw new Error("Unable to follow back right now.");
      }

      setNotifications((current) =>
        current.map((notification) =>
          notification.type === "NEW_FOLLOWER" && notification.user.id === targetUserId
            ? { ...notification, isFollowingBack: true }
            : notification
        )
      );
      toast.success("Followed back successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to follow back right now.");
    } finally {
      setPendingFollowBack(null);
    }
  }

  useEffect(() => {
    if (session?.user?.id) {
      fetch("/api/notifications")
        .then((res) => res.json())
        .then((data) => {
          if (data.notifications) {
            const clearedId = localStorage.getItem("clearedFeedAt");
            if (clearedId) {
              const index = data.notifications.findIndex((n: any) => n.id === clearedId);
              if (index !== -1) {
                setNotifications(data.notifications.slice(0, index));
              } else {
                setNotifications(data.notifications);
              }
            } else {
              setNotifications(data.notifications);
            }
          }
        })
        .catch(() => {});
    }
  }, [session]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative hidden h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.05] text-white/75 transition hover:border-white/25 hover:text-white sm:grid">
          <Bell className="h-4 w-4" />
          <span className="sr-only">Notifications</span>
          {notifications.length > 0 && (
            <span className="absolute right-[11px] top-[11px] h-2 w-2 rounded-full border border-ink bg-flame" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[300px] border-zinc-800 bg-zinc-900 text-zinc-100 shadow-2xl p-0">
        <div className="p-3 font-semibold text-sm border-b border-zinc-800 flex items-center justify-between">
          <span>Activity Feed</span>
          {notifications.length > 0 && (
            <button 
              onClick={(e) => { 
                e.preventDefault(); 
                if (notifications.length > 0) {
                  localStorage.setItem("clearedFeedAt", notifications[0].id);
                }
                setNotifications([]); 
              }} 
              className="text-xs text-zinc-400 hover:text-white transition"
            >
              Clear
            </button>
          )}
        </div>
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-xs text-zinc-500">No recent activity from friends.</div>
        ) : (
          <div className="py-2">
            {notifications.map((notif) => {
              const statusMeta = notif.status ? getStatusMeta(notif.status) : null;
              return (
                <DropdownMenuItem key={notif.id} className="focus:bg-zinc-800 p-3 rounded-none flex items-start gap-3 cursor-pointer border-b border-zinc-900">
                  <div className="h-8 w-8 rounded-full overflow-hidden shrink-0 bg-zinc-800 grid place-items-center text-xs font-bold text-zinc-400">
                    {notif.user.avatarUrl ? (
                      <img src={notif.user.avatarUrl} alt={notif.user.username} className="h-full w-full object-cover" />
                    ) : (
                      notif.user.username.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    {notif.type === "NEW_FOLLOWER" ? (
                      <>
                        <p className="text-[13px] leading-tight text-white/80">
                          <Link href={`/u/${notif.user.username}`} className="font-bold text-white hover:underline">
                            @{notif.user.username}
                          </Link>{" "}
                          started following you.
                        </p>
                        {!notif.isFollowingBack ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              void followBack(notif.user.id);
                            }}
                            disabled={pendingFollowBack === notif.user.id}
                            className="mt-1 rounded-md border border-flame/30 bg-flame/20 px-2 py-1 text-[11px] font-bold text-flame transition hover:bg-flame/30 disabled:cursor-wait disabled:opacity-70"
                          >
                            {pendingFollowBack === notif.user.id ? "Following..." : "Follow Back"}
                          </button>
                        ) : (
                          <p className="text-[11px] font-semibold text-mint">Following each other</p>
                        )}
                      </>
                    ) : (
                      <p className="text-[13px] leading-tight text-white/80">
                        <Link href={`/u/${notif.user.username}`} className="font-bold text-white hover:underline">
                          @{notif.user.username}
                        </Link>{" "}
                        added{" "}
                        <span className="font-semibold text-zinc-300">{notif.title}</span>{" "}
                        to their {" "}
                        <span className="font-semibold text-zinc-300">{statusMeta?.label.toLowerCase()}</span>
                        {" "}list.
                      </p>
                    )}
                  </div>
                </DropdownMenuItem>
              );
            })}
          </div>
        )}
        <div className="border-t border-zinc-800 p-2 bg-zinc-950/50 text-center">
          <Link href="/profile?tab=activity" className="text-[11px] font-bold uppercase tracking-[0.1em] text-flame transition hover:text-[#ff674d]">
            View full history
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
