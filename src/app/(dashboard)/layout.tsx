import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Link from "next/link";
import { Leaf, LayoutDashboard, Calculator, User as UserIcon } from "lucide-react";
import { SignOutButton } from "@/components/dashboard/SignOutButton";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between mx-auto px-4 md:px-8">
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="bg-primary/10 p-2 rounded-xl">
                <Leaf className="h-6 w-6 text-primary" />
              </div>
              <span className="inline-block font-bold text-xl tracking-tight hidden sm:inline-block">
                CarbonCoach <span className="text-primary">AI</span>
              </span>
            </Link>
          </div>

          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link href="/dashboard" className="flex items-center gap-2 transition-colors hover:text-foreground/80 text-foreground/60">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <Link href="/assessment" className="flex items-center gap-2 transition-colors hover:text-foreground/80 text-foreground/60">
              <Calculator className="h-4 w-4" />
              <span className="hidden sm:inline">Assessment</span>
            </Link>
          </nav>

          <div className="flex items-center gap-4 border-l pl-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground hidden sm:flex">
              <UserIcon className="h-4 w-4" />
              {session.user.name}
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="flex-1 bg-muted/10">
        {children}
      </main>
    </div>
  );
}
