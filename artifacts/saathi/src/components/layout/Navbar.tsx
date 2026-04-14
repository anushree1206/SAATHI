import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";

export default function Navbar() {
  const [location] = useLocation();

  return (
    <nav className="w-full border-b border-border/40 backdrop-blur-md bg-background/80 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2" data-testid="link-home-logo">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white">
            <Mic className="w-4 h-4" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">Saathi</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link href="/" className={`text-sm font-medium transition-colors hover:text-primary ${location === '/' ? 'text-primary' : 'text-muted-foreground'}`} data-testid="link-nav-home">Home</Link>
          <Link href="/about" className={`text-sm font-medium transition-colors hover:text-primary ${location === '/about' ? 'text-primary' : 'text-muted-foreground'}`} data-testid="link-nav-about">About</Link>
          <Link href="/demo" className={`text-sm font-medium transition-colors hover:text-primary ${location === '/demo' ? 'text-primary' : 'text-muted-foreground'}`} data-testid="link-nav-demo">Demo</Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/demo" data-testid="link-nav-try">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-full px-6 shadow-lg shadow-primary/20">
              Try Saathi Free
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}