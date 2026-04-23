"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

export function UserSearchInput({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query)}&tab=users`);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 flex w-full max-w-md items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for usernames..."
          className="h-12 w-full rounded-lg border border-zinc-800 bg-zinc-900 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-flame focus:ring-1 focus:ring-flame"
        />
      </div>
      <button
        type="submit"
        className="h-12 rounded-lg bg-flame px-6 text-sm font-bold text-white shadow-glow transition hover:bg-[#ff674d]"
      >
        Search
      </button>
    </form>
  );
}
