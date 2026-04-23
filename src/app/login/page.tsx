import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { authOptions } from "@/lib/auth";

type LoginPageProps = {
  searchParams?: {
    callbackUrl?: string;
  };
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getServerSession(authOptions);
  const callbackUrl = searchParams?.callbackUrl ?? "/";

  if (session?.user) {
    redirect(callbackUrl);
  }

  return (
    <main className="grid min-h-screen place-items-center bg-ink px-4 py-12">
      <LoginForm callbackUrl={callbackUrl} />
    </main>
  );
}
