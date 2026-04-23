import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/signup-form";
import { authOptions } from "@/lib/auth";

type SignupPageProps = {
  searchParams?: {
    callbackUrl?: string;
  };
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const session = await getServerSession(authOptions);
  const callbackUrl = searchParams?.callbackUrl ?? "/";

  if (session?.user) {
    redirect(callbackUrl);
  }

  return (
    <main className="grid min-h-screen place-items-center bg-ink px-4 py-12">
      <SignupForm callbackUrl={callbackUrl} />
    </main>
  );
}
