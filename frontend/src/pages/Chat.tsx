import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiGet, useSaathiChat, type SaathiPipelineStep } from "@/lib/api";
import { speakInChunks, stopSpeaking } from "@/lib/speech";
import VoiceButton from "@/components/VoiceButton";
import ChatMessage from "@/components/ChatMessage";
import LanguageSelect from "@/components/LanguageSelect";
import { Heart, BookOpen, BrainCircuit, ShieldAlert, Loader2, Send, Volume2 } from "lucide-react";

const TOPICS = ["Parent pressure", "Career confusion", "Burnout", "Friend betrayal", "Crush distraction"];

const AGENTS = [
  { id: "empathy",  name: "Empathy",       icon: Heart,        color: "text-rose-400",   label: "Reading your mood..." },
  { id: "study",    name: "Study Advisor", icon: BookOpen,     color: "text-blue-400",   label: "Checking context..." },
  { id: "mental",   name: "Mental Health", icon: BrainCircuit, color: "text-secondary",  label: "Assessing..." },
  { id: "reality",  name: "Reality Check", icon: ShieldAlert,  color: "text-primary",    label: "Forming response..." },
];

const LANGUAGE_NAMES: Record<string, string> = {
  "en-IN": "English", "hi-IN": "Hindi", "kn-IN": "Kannada", "te-IN": "Telugu", "ta-IN": "Tamil",
};

type Message = { role: "user" | "assistant"; content: string; pipeline?: SaathiPipelineStep[] };

export default function Chat() {
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState("en-IN");
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [pipelineOpen, setPipelineOpen] = useState<Record<number, boolean>>({});
  const [voiceUnavailable, setVoiceUnavailable] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [loadingAgentIdx, setLoadingAgentIdx] = useState(0);
  const loadingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [location] = useLocation();
  const { user } = useAuth();
  const chatMutation = useSaathiChat();
  const recognitionRef = useRef<any>(null);
  const languageRef = useRef(language);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { languageRef.current = language; setVoiceUnavailable(false); }, [language]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, chatMutation.isPending]);

  useEffect(() => {
    if (chatMutation.isPending) {
      setLoadingAgentIdx(0);
      loadingIntervalRef.current = setInterval(() => setLoadingAgentIdx((i) => (i + 1) % AGENTS.length), 900);
    } else {
      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
    }
    return () => { if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current); };
  }, [chatMutation.isPending]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const loadVoices = () => window.speechSynthesis.getVoices();
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.cancel(); if (recognitionRef.current) recognitionRef.current.abort(); };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1] ?? "");
    setConversationId(params.get("conversationId") ?? undefined);
  }, [location]);

  useEffect(() => {
    if (!conversationId || !user) return;
    let active = true;
    apiGet<{ messages: Array<{ role: "user" | "assistant"; content: string }> }>(`/api/saathi/conversations/${conversationId}`)
      .then((conversation) => { if (active) setMessages(conversation.messages.map((m) => ({ role: m.role, content: m.content }))); })
      .catch((error: any) => {
        if (!active) return;
        toast({ title: "Unable to load conversation", description: error?.data?.error ?? error?.message ?? "Try again.", variant: "destructive" });
      });
    return () => { active = false; };
  }, [conversationId, user]);

  const handleSpeak = (text: string) => {
    speakInChunks(text, language, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onVoiceUnavailable: () => { setVoiceUnavailable(true); setIsSpeaking(false); },
    });
  };

  const handleStop = () => { stopSpeaking(); setIsSpeaking(false); };

  const toggleRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "Speech recognition unavailable", description: "Use Chrome or Edge and enable microphone access.", variant: "destructive" });
      return;
    }
    if (isRecording) { recognitionRef.current?.stop(); setIsRecording(false); return; }
    handleStop();
    setInput("");
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = languageRef.current;
    recognition.onresult = (event: any) => {
      setIsRecording(false);
      let cleaned = event.results[0]?.[0]?.transcript?.trim() ?? "";
      if (!cleaned) { toast({ title: "No speech detected", description: "Please try again with a clear, loud voice.", variant: "destructive" }); return; }
      cleaned = cleaned.replace(/\b(um|uh|hmm|er|ah|like|you know|so|well|actually)\b/gi, "").replace(/\s+/g, " ").trim();
      if (cleaned.length < 2) { toast({ title: "Unclear speech", description: "Please speak more clearly or type your message.", variant: "destructive" }); return; }
      setInput(cleaned);
    };
    recognition.onerror = (event: any) => {
      setIsRecording(false);
      const msg = event?.error ?? "unknown";
      const desc = msg === "not-allowed" ? "Microphone permission denied."
        : msg === "no-speech" ? "No speech detected. Try speaking louder."
        : msg === "network" ? "Network error. Check your connection."
        : "Please allow microphone access and try again.";
      toast({ title: "Speech recognition failed", description: desc, variant: "destructive" });
    };
    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const handleSend = (explicitMessage?: string) => {
    const userMessage = explicitMessage?.trim() ?? input.trim();
    if (!userMessage || chatMutation.isPending) {
      if (chatMutation.isPending) toast({ title: "Still generating", description: "Please wait for the current reply.", variant: "default" });
      return;
    }
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    handleStop();
    chatMutation.mutate({ data: { message: userMessage, language, conversationId } }, {
      onSuccess: (data) => {
        setMessages((prev) => [...prev, { role: "assistant", content: data.response, pipeline: data.pipeline }]);
        if (data.conversationId && !conversationId) setConversationId(data.conversationId);
        handleSpeak(data.response);
      },
      onError: (error: any) => {
        toast({ title: "Failed to reach Saathi", description: error?.data?.error ?? error?.message ?? "Check your connection.", variant: "destructive" });
      },
    });
  };

  const loadingAgent = AGENTS[loadingAgentIdx];
  const LoadingIcon = loadingAgent.icon;

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto p-4 md:p-8 flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Talk to Saathi</h1>
          <p className="text-muted-foreground text-sm">Your safe space is ready.</p>
        </div>
        <LanguageSelect value={language} onChange={setLanguage} voiceUnavailable={voiceUnavailable} />
      </div>

      <div className="flex-1 bg-card/50 border border-border/50 rounded-2xl p-6 flex flex-col relative overflow-hidden">
        {/* Status bar */}
        <div className="flex justify-center mb-6 relative z-10">
          <AnimatePresence mode="wait">
            {chatMutation.isPending ? (
              <motion.div key={`agent-${loadingAgentIdx}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                className="flex items-center gap-3 bg-background/80 backdrop-blur-sm border border-primary/30 px-5 py-2.5 rounded-full"
              >
                <motion.div animate={{ scale: [1, 1.25, 1], opacity: [0.8, 1, 0.8] }} transition={{ repeat: Infinity, duration: 0.9 }}>
                  <LoadingIcon className={`w-4 h-4 ${loadingAgent.color}`} />
                </motion.div>
                <span className="text-white font-medium text-sm">
                  <span className={`${loadingAgent.color} font-semibold`}>{loadingAgent.name}</span> {loadingAgent.label}
                </span>
              </motion.div>
            ) : isRecording ? (
              <motion.div key="recording" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-3 bg-background/80 backdrop-blur-sm border border-destructive/40 px-5 py-2.5 rounded-full"
              >
                <motion.div animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-3 h-3 rounded-full bg-destructive" />
                <span className="text-white font-medium text-sm">Listening in {LANGUAGE_NAMES[language]}...</span>
              </motion.div>
            ) : isSpeaking ? (
              <motion.div key="speaking" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-3 bg-background/80 backdrop-blur-sm border border-secondary/30 px-5 py-2.5 rounded-full cursor-pointer"
                onClick={handleStop} title="Tap to stop"
              >
                {[...Array(5)].map((_, i) => (
                  <motion.div key={i} animate={{ height: ["10px", "22px", "10px"] }} transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.1 }} className="w-1.5 bg-secondary rounded-full" />
                ))}
                <Volume2 className="w-4 h-4 text-secondary ml-1" />
              </motion.div>
            ) : (
              <motion.div key="idle" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-2 bg-background border border-border px-4 py-2 rounded-full"
              >
                {AGENTS.map((a) => { const Icon = a.icon; return (
                  <div key={a.id} className="flex items-center gap-1.5 opacity-60">
                    <Icon className={`w-3.5 h-3.5 ${a.color}`} />
                    <span className="text-white/70 text-xs hidden sm:inline">{a.name}</span>
                  </div>
                ); })}
                <span className="text-white/50 text-xs ml-2">ready</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto mb-6 space-y-4 flex flex-col relative z-10 pr-2 pb-4">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-6">
                <Heart className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">I'm listening.</h3>
              <p className="text-muted-foreground mb-8 text-sm">What's on your mind? You can type, speak, or pick a topic below.</p>
              <div className="flex flex-wrap justify-center gap-3 mb-6">
                {AGENTS.map((a) => { const Icon = a.icon; return (
                  <div key={a.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background border border-border/50">
                    <Icon className={`w-3.5 h-3.5 ${a.color}`} />
                    <span className="text-white/70 text-xs">{a.name}</span>
                  </div>
                ); })}
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {TOPICS.map((topic) => (
                  <button key={topic} onClick={() => setInput(topic + " ")}
                    data-testid={`pill-${topic.toLowerCase().replace(/ /g, "-")}`}
                    className="px-4 py-2 rounded-full bg-background border border-border hover:border-primary/50 text-sm text-white/80 transition-all hover:scale-105"
                  >{topic}</button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <ChatMessage
                  key={i} role={msg.role} content={msg.content} pipeline={msg.pipeline}
                  index={i} pipelineOpen={!!pipelineOpen[i]}
                  onTogglePipeline={() => setPipelineOpen((prev) => ({ ...prev, [i]: !prev[i] }))}
                />
              ))}
              {chatMutation.isPending && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-2">
                  <div className="bg-background border border-border rounded-2xl rounded-bl-sm px-4 py-3">
                    <div className="flex gap-1 items-center">
                      {[0, 1, 2].map((i) => (
                        <motion.div key={i} animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                          transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }} className="w-1.5 h-1.5 rounded-full bg-white/50" />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input row */}
        <div className="relative z-10 flex items-end gap-3">
          <VoiceButton isRecording={isRecording} isDisabled={chatMutation.isPending} language={language} onToggle={toggleRecording} />
          <Textarea
            value={input} onChange={(e) => setInput(e.target.value)}
            placeholder={`Type in ${LANGUAGE_NAMES[language] ?? "your language"}...`}
            className="flex-1 resize-none min-h-[56px] py-4 bg-background border-border rounded-2xl text-base"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            data-testid="input-chat"
          />
          <Button
            size="icon" className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-transform hover:scale-105"
            onClick={() => handleSend()} disabled={!input.trim() || chatMutation.isPending} data-testid="btn-send"
          >
            {chatMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
