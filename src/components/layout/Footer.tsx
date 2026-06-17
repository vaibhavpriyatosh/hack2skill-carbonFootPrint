import Link from "next/link";
import { Leaf } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-muted/40 pb-8 pt-16">
      <div className="container px-4 md:px-8 mx-auto flex flex-col md:flex-row justify-between gap-8 md:gap-12">
        <div className="flex flex-col max-w-sm gap-4">
          <Link href="/" className="flex items-center space-x-2">
            <Leaf className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">CarbonCoach AI</span>
          </Link>
          <p className="text-sm text-muted-foreground leading-relaxed">
            AI-powered insights to help you understand, track, simulate, and
            reduce your carbon footprint for a sustainable future.
          </p>
          <div className="flex gap-4 mt-2 text-muted-foreground">
            <Link href="#" className="hover:text-foreground transition-colors text-sm font-medium">
              GitHub
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors text-sm font-medium">
              Twitter
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors text-sm font-medium">
              LinkedIn
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 sm:gap-12 text-sm">
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-foreground">Product</h3>
            <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</Link>
            <Link href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">How it Works</Link>
            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-foreground">Resources</h3>
            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">Blog</Link>
            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">Methodology</Link>
            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">Documentation</Link>
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-foreground">Legal</h3>
            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 md:px-8 mt-16 pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} CarbonCoach AI. All rights reserved.</p>
        <p>Built for the Hackathon</p>
      </div>
    </footer>
  );
}
