// Navbar Component
import Link from "next/link";
import { Leaf, LogIn, Menu } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between mx-auto px-4 md:px-8">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-primary/10 p-2 rounded-xl">
              <Leaf className="h-6 w-6 text-primary" />
            </div>
            <span className="inline-block font-bold text-xl tracking-tight">
              CarbonCoach <span className="text-primary">AI</span>
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link
            href="#features"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Features
          </Link>
          <Link
            href="#how-it-works"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            How it Works
          </Link>
          <div className="flex items-center gap-4 border-l pl-8">
            <Link href="/login" className={cn(buttonVariants({ variant: "ghost" }), "gap-2")}>
              <LogIn className="h-4 w-4" />
              Sign In
            </Link>
            <Link href="/signup" className={cn(buttonVariants(), "rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all")}>
              Get Started
            </Link>
          </div>
        </nav>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "md:hidden")}>
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetTitle className="text-left mb-8">Menu</SheetTitle>
              <div className="flex flex-col space-y-4">
                <Link
                  href="#features"
                  className="text-foreground/70 hover:text-foreground transition-colors"
                >
                  Features
                </Link>
                <Link
                  href="#how-it-works"
                  className="text-foreground/70 hover:text-foreground transition-colors"
                >
                  How it Works
                </Link>
                <div className="h-px bg-border my-4" />
                <Link href="/login" className={cn(buttonVariants({ variant: "outline" }), "w-full justify-start")}>
                  Sign In
                </Link>
                <Link href="/signup" className={cn(buttonVariants(), "w-full justify-start")}>
                  Get Started
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
