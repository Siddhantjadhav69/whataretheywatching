"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Clapperboard, Loader2, UserPlus } from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

type SignupFormProps = {
  callbackUrl: string;
};

export function SignupForm({ callbackUrl }: SignupFormProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const username = String(formData.get("username") ?? "");
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsPending(true);

    try {
      const signupResponse = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, username, password })
      });
      const signupPayload = (await signupResponse.json().catch(() => null)) as { error?: string } | null;

      if (!signupResponse.ok) {
        throw new Error(signupPayload?.error ?? "Unable to create account.");
      }

      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl
      });

      if (signInResult?.error) {
        toast.success("Account created. Please sign in.");
        router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
        return;
      }

      toast.success("Account created.");
      router.push("/profile");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create account.");
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
          <p className="text-sm text-white/45">Create your tracking account.</p>
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
          <span className="text-sm font-bold text-white/70">Username</span>
          <input
            name="username"
            type="text"
            autoComplete="username"
            required
            minLength={3}
            maxLength={30}
            pattern="^[a-zA-Z0-9_-]+$"
            className="h-12 w-full rounded-lg border border-white/10 bg-black/30 px-4 text-sm font-semibold text-white outline-none transition placeholder:text-white/25 focus:border-flame/60"
            placeholder="3-30 characters (letters, numbers, - and _)"
            title="Username can only contain letters, numbers, underscores, and hyphens"
          />
          <p className="text-xs text-white/40">3-30 characters. Letters, numbers, hyphens, underscores only.</p>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-bold text-white/70">Password</span>
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="h-12 w-full rounded-lg border border-white/10 bg-black/30 px-4 text-sm font-semibold text-white outline-none transition placeholder:text-white/25 focus:border-flame/60"
            placeholder="At least 8 characters"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-bold text-white/70">Confirm Password</span>
          <input
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="h-12 w-full rounded-lg border border-white/10 bg-black/30 px-4 text-sm font-semibold text-white outline-none transition placeholder:text-white/25 focus:border-flame/60"
            placeholder="Repeat password"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-flame text-sm font-black text-white shadow-glow transition hover:bg-[#ff674d] disabled:cursor-wait disabled:opacity-75"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
        Create Account
      </button>

      <p className="mt-5 text-center text-sm text-white/55">
        Already have an account?{" "}
        <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="font-black text-flame transition hover:text-[#ff674d]">
          Sign in
        </Link>
      </p>
    </form>
  );
}
