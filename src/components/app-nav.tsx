"use client";

import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Bell, Clapperboard, Compass, Library, Search, Sparkles, UserRound } from "lucide-react";
import { Suspense, useState } from "react";
import { useSession } from "next-auth/react";
import { UserMenu } from "./user-menu";
import { NotificationsMenu } from "./notifications-menu";
import { AuthModal } from "./auth-modal";

const navItems = [
  { label: "Discover", href: "/discover", icon: Compass },
  { label: "Profile", href: "/profile", icon: UserRound },
  { label: "My Lists", href: "/profile?tab=lists", icon: Library, tab: "lists" },
  { label: "AI Picks", href: "/profile?tab=picks", icon: Sparkles, tab: "picks" }
];

export function AppNav() {
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);

  return (
    <>
    <Suspense fallback={<AppNavShell onSignIn={() => setAuthModalOpen(true)} />}>
      <AppNavContent onSignIn={() => setAuthModalOpen(true)} />
    </Suspense>
    <AuthModal isOpen={isAuthModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}

function AppNavShell({ onSignIn }: { onSignIn: () => void }) {
  const { status } = useSession();
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-flame text-white shadow-glow">
              <Clapperboard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-black tracking-normal text-white">whataretheywatching</p>
              <p className="hidden text-xs text-white/45 sm:block">Media tracking for people with taste.</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1 lg:flex">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white/65 transition hover:bg-white/10 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <form 
              onSubmit={(e) => { 
                e.preventDefault(); 
                const val = new FormData(e.currentTarget).get("q"); 
                if(val) window.location.href = `/search?q=${encodeURIComponent(val as string)}`; 
              }} 
              className="relative flex items-center"
            >
              <Search className="absolute left-3 h-4 w-4 text-white/50" />
              <input 
                type="search" 
                name="q" 
                placeholder="Search..." 
                className="h-10 w-32 sm:w-48 lg:w-64 rounded-full border border-white/10 bg-white/[0.05] pl-9 pr-3 text-sm text-white placeholder-white/50 transition focus:border-white/25 focus:outline-none" 
              />
            </form>
            <NotificationsMenu />
            {status === "unauthenticated" ? (
              <button 
                onClick={onSignIn}
                className="h-10 px-4 rounded-full bg-white text-ink font-bold text-sm shadow-glow transition hover:bg-white/90"
              >
                Sign In
              </button>
            ) : (
              <UserMenu />
            )}
          </div>
        </div>
      </header>

      <nav className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-4 rounded-full border border-white/10 bg-ink/90 p-1 shadow-2xl shadow-black/60 backdrop-blur-xl lg:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex h-12 flex-col items-center justify-center gap-0.5 rounded-full text-[10px] font-bold text-white/55 transition"
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

function AppNavContent({ onSignIn }: { onSignIn: () => void }) {
  const { status } = useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab");

  const isActiveLink = (item: (typeof navItems)[number]) => {
    if (item.tab) {
      return pathname === "/profile" && activeTab === item.tab;
    }

    if (item.href === "/") {
      return pathname === "/";
    }

    return pathname === item.href && !activeTab;
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-flame text-white shadow-glow">
              <Clapperboard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-black tracking-normal text-white">whataretheywatching</p>
              <p className="hidden text-xs text-white/45 sm:block">Media tracking for people with taste.</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1 lg:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveLink(item);

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isActive ? "bg-white text-ink" : "text-white/65 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <form 
              onSubmit={(e) => { 
                e.preventDefault(); 
                const val = new FormData(e.currentTarget).get("q"); 
                if(val) window.location.href = `/search?q=${encodeURIComponent(val as string)}`; 
              }} 
              className="relative flex items-center"
            >
              <Search className="absolute left-3 h-4 w-4 text-white/50" />
              <input 
                type="search" 
                name="q" 
                placeholder="Search..." 
                className="h-10 w-32 sm:w-48 lg:w-64 rounded-full border border-white/10 bg-white/[0.05] pl-9 pr-3 text-sm text-white placeholder-white/50 transition focus:border-white/25 focus:outline-none" 
              />
            </form>
            <NotificationsMenu />
            {status === "unauthenticated" ? (
              <button 
                onClick={onSignIn}
                className="h-10 px-4 rounded-full bg-white text-ink font-bold text-sm shadow-glow transition hover:bg-white/90"
              >
                Sign In
              </button>
            ) : (
              <UserMenu />
            )}
          </div>
        </div>
      </header>

      <nav className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-4 rounded-full border border-white/10 bg-ink/90 p-1 shadow-2xl shadow-black/60 backdrop-blur-xl lg:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isActiveLink(item);

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex h-12 flex-col items-center justify-center gap-0.5 rounded-full text-[10px] font-bold transition ${
                isActive ? "bg-white text-ink" : "text-white/55"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
