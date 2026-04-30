import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

type ConversationSummary = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

type DashboardStats = {
  totalConversations: number;
  totalMessages: number;
  averageAssistantResponseLength: number;
  lastActiveAt: string | null;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);

    Promise.all([
      apiGet<DashboardStats>("/api/saathi/dashboard"),
      apiGet<ConversationSummary[]>("/api/saathi/conversations"),
    ])
      .then(([dashboardData, conversationList]) => {
        setStats(dashboardData);
        setConversations(conversationList);
      })
      .catch((error: any) => {
        toast({
          title: "Unable to load dashboard",
          description: error?.data?.error ?? error?.message ?? "Try refreshing the page.",
          variant: "destructive",
        });
      })
      .finally(() => setIsLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto p-6 bg-card/80 border border-border rounded-3xl shadow-xl mt-10 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Your conversations</h1>
        <p className="text-muted-foreground mb-6">Sign in to view your saved chats and analytics.</p>
        <Link href="/login">
          <Button className="px-8">Sign in</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-8 space-y-3">
        <h1 className="text-4xl font-bold text-white">Dashboard</h1>
        <p className="text-muted-foreground max-w-2xl">
          Welcome back, {user.name}. Track your chat activity, view previous conversations, and continue your last session.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <div className="rounded-3xl border border-border bg-card/80 p-5">
          <p className="text-sm text-muted-foreground">Conversations</p>
          <p className="mt-3 text-3xl font-semibold text-white">{stats?.totalConversations ?? "—"}</p>
        </div>
        <div className="rounded-3xl border border-border bg-card/80 p-5">
          <p className="text-sm text-muted-foreground">Messages</p>
          <p className="mt-3 text-3xl font-semibold text-white">{stats?.totalMessages ?? "—"}</p>
        </div>
        <div className="rounded-3xl border border-border bg-card/80 p-5">
          <p className="text-sm text-muted-foreground">Avg. AI response</p>
          <p className="mt-3 text-3xl font-semibold text-white">{stats ? `${stats.averageAssistantResponseLength} chars` : "—"}</p>
        </div>
        <div className="rounded-3xl border border-border bg-card/80 p-5">
          <p className="text-sm text-muted-foreground">Last active</p>
          <p className="mt-3 text-base text-white">{stats?.lastActiveAt ? new Date(stats.lastActiveAt).toLocaleString() : "—"}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card/80 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">Your conversations</h2>
            <p className="text-sm text-muted-foreground">Click any item to copy the conversation ID for use in chat.</p>
          </div>
          <Link href="/demo">
            <Button className="bg-primary text-primary-foreground">Start a new chat</Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="rounded-3xl border border-border/50 bg-background/50 p-8 text-center text-white/70">Loading conversations…</div>
        ) : conversations.length === 0 ? (
          <div className="rounded-3xl border border-border/50 bg-background/50 p-8 text-center text-white/70">
            You don't have any saved conversations yet. Start a chat and your history will be stored securely.
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((conversation) => (
              <div key={conversation.id} className="rounded-3xl border border-border/50 bg-background/50 p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-base font-medium text-white">{conversation.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Updated {new Date(conversation.updatedAt).toLocaleString()} • Created {new Date(conversation.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="secondary"
                      className="px-3"
                      onClick={() => {
                        navigator.clipboard.writeText(conversation.id);
                        toast({ title: "Copied", description: "Conversation ID copied to clipboard." });
                      }}
                    >
                      Copy ID
                    </Button>
                    <Link href={`/demo?conversationId=${conversation.id}`}>
                      <Button className="px-3">Continue</Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
