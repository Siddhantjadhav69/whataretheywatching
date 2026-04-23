"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clapperboard, Loader2, LogIn } from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

type LoginFormProps = {
  callbackUrl: string;
};

export function LoginForm({ callbackUrl }: LoginFormProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    setIsPending(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl
      });

      if (result?.error) {
        toast.error("Invalid email or password.");
        return;
      }

      toast.success("Signed in.");
      router.push(result?.url ?? callbackUrl);
      router.refresh();
    } catch {
      toast.error("Unable to sign in right now.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md rounded-lg border border-white/10 bg-white/[0.045] p-6 shadow-2xl shadow-black/30">
      <div className="mb-8 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-flame text-white shadow-glow">
          <Clapperboard className="h-5 w-5" />
        </div>
        <div>
          <p className="text-lg font-black text-white">whataretheywatching</p>
          <p className="text-sm text-white/45">Sign in to sync your lists.</p>
        </div>
      </div>

      <div className="space-y-4">
        <label className="block space-y-2">
          <span className="text-sm font-bold text-white/70">Email</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            className="h-12 w-full rounded-lg border border-white/10 bg-black/30 px-4 text-sm font-semibold text-white outline-none transition placeholder:text-white/25 focus:border-flame/60"
            placeholder="you@example.com"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-bold text-white/70">Password</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="h-12 w-full rounded-lg border border-white/10 bg-black/30 px-4 text-sm font-semibold text-white outline-none transition placeholder:text-white/25 focus:border-flame/60"
            placeholder="Your password"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-flame text-sm font-black text-white shadow-glow transition hover:bg-[#ff674d] disabled:cursor-wait disabled:opacity-75"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
        Sign In
      </button>

      <p className="mt-5 text-center text-sm text-white/55">
        New here?{" "}
        <Link href={`/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="font-black text-flame transition hover:text-[#ff674d]">
          Create an account
        </Link>
      </p>
    </form>
  );
}
