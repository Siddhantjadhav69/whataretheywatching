import Link from "next/link";
import { UserRound } from "lucide-react";

type UserSearchCardProps = {
  user: {
    id: string;
    username: string;
    avatarUrl: string | null;
    bio: string | null;
  };
};

export function UserSearchCard({ user }: UserSearchCardProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-center shadow-xl transition hover:border-zinc-700 hover:bg-zinc-800/50">
      <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full border border-zinc-800 bg-zinc-800 shadow-md">
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.username} className="h-full w-full object-cover" />
        ) : (
          <UserRound className="h-8 w-8 text-zinc-400" />
        )}
      </div>
      
      <div className="flex-1 space-y-1.5 w-full">
        <h3 className="text-lg font-black text-zinc-100 truncate">@{user.username}</h3>
        {user.bio ? (
          <p className="text-sm font-semibold text-zinc-400 line-clamp-2">{user.bio}</p>
        ) : (
          <p className="text-sm italic text-zinc-600">No bio provided.</p>
        )}
      </div>

      <Link
        href={`/u/${user.username}`}
        className="mt-2 w-full rounded-lg bg-white/5 py-2.5 text-center text-sm font-bold text-zinc-100 transition hover:bg-zinc-100 hover:text-zinc-950"
      >
        View Profile
      </Link>
    </div>
  );
}
