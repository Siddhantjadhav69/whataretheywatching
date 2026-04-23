"use client";

import { useState } from "react";
import { UserPlus, UserCheck } from "lucide-react";
import { toast } from "sonner";

interface FollowButtonProps {
  targetUserId: string;
  initialIsFollowing: boolean;
}

export function FollowButton({ targetUserId, initialIsFollowing }: FollowButtonProps) {
  const [following, setFollowing] = useState(initialIsFollowing);

  const handleToggleFollow = async () => {
    // Optimistic UI updates
    const newFollowingState = !following;
    setFollowing(newFollowingState);
    
    try {
      const response = await fetch("/api/friends/follow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ targetUserId }),
      });

      if (!response.ok) {
        throw new Error("Failed to follow/unfollow user");
      }

      toast.success(newFollowingState ? "Friend added" : "Unfollowed");
    } catch (error) {
      // Revert optimism
      setFollowing(!newFollowingState);
      toast.error("Failed to update status. Please try again.");
    }
  };

  return (
    <button
      onClick={handleToggleFollow}
      className={`inline-flex w-[140px] justify-center items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition ${
        following 
          ? "border border-zinc-700 bg-zinc-800 text-zinc-100 hover:bg-zinc-700" 
          : "bg-flame text-white shadow-glow hover:bg-[#ff674d]"
      }`}
    >
      {following ? (
        <>
          <UserCheck className="h-4 w-4" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4" />
          Add Friend
        </>
      )}
    </button>
  );
}