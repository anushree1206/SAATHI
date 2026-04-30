import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiPost } from "@/lib/api";
import { setAuthSession } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useLocation();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const response = await apiPost<{ token: string; user: { id: string; name: string; email: string } }>(
        "/api/auth/login",
        { email, password },
      );

      setAuthSession(response.token, response.user);
      toast({ title: "Welcome back", description: "You are now logged in.", variant: "default" });
      setLocation("/dashboard");
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error?.data?.error ?? error?.message ?? "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-card/80 border border-border rounded-3xl shadow-xl mt-10">
      <h1 className="text-3xl font-bold text-white mb-4">Login to Saathi</h1>
      <p className="text-sm text-muted-foreground mb-6">Access your conversations and continue where you left off.</p>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block space-y-2">
          <span className="text-sm text-white">Email</span>
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            placeholder="you@example.com"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm text-white">Password</span>
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            placeholder="Enter your password"
          />
        </label>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        New to Saathi? <Link href="/signup" className="text-primary underline">Create an account</Link>
      </p>
    </div>
  );
}
