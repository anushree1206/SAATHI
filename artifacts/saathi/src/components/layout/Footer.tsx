import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border/40 py-12 mt-auto">
      <div className="max-w-6xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1 md:col-span-2">
          <Link href="/" className="flex items-center gap-2 mb-4" data-testid="link-footer-logo">
            <span className="font-bold text-2xl tracking-tight text-white">Saathi</span>
          </Link>
          <p className="text-muted-foreground max-w-sm">
            A voice-first AI companion for Indian students. A safe space for your late-night thoughts, academic pressure, and mental well-being.
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-4">Product</h4>
          <ul className="space-y-2">
            <li><Link href="/" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-footer-home">Home</Link></li>
            <li><Link href="/demo" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-footer-demo">Demo</Link></li>
            <li><Link href="/about" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-footer-about">About</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-4">Legal</h4>
          <ul className="space-y-2">
            <li><span className="text-muted-foreground cursor-not-allowed">Privacy Policy</span></li>
            <li><span className="text-muted-foreground cursor-not-allowed">Terms of Service</span></li>
            <li><span className="text-muted-foreground cursor-not-allowed">Contact Us</span></li>
          </ul>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 md:px-8 mt-12 pt-8 border-t border-border/40 flex flex-col md:flex-row items-center justify-between">
        <p className="text-muted-foreground text-sm">
          © {new Date().getFullYear()} Saathi. Built with care for Indian students.
        </p>
      </div>
    </footer>
  );
}