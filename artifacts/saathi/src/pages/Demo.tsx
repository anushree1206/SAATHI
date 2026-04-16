import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, MicOff, Send, Heart, BookOpen, BrainCircuit, ShieldAlert, Loader2, Volume2, ChevronDown, ChevronUp, VolumeX } from "lucide-react";
import { useSaathiChat } from "@workspace/api-client-react";
import type { SaathiPipelineStep } from "@workspace/api-client-react";

const TOPICS = [
  "Parent pressure",
  "Career confusion",
  "Burnout",
  "Friend betrayal",
  "Crush distraction"
];

const AGENTS = [
  { id: "empathy",  name: "Empathy",       icon: Heart,        color: "text-rose-400",   label: "Reading your mood..." },
  { id: "study",    name: "Study Advisor", icon: BookOpen,     color: "text-blue-400",   label: "Checking context..." },
  { id: "mental",   name: "Mental Health", icon: BrainCircuit, color: "text-secondary",  label: "Assessing..." },
  { id: "reality",  name: "Reality Check", icon: ShieldAlert,  color: "text-primary",    label: "Forming response..." },
];

const LANGUAGE_NAMES: Record<string, string> = {
  "en-IN": "English",
  "hi-IN": "Hindi",
  "kn-IN": "Kannada",
  "te-IN": "Telugu",
  "ta-IN": "Tamil",
};

type Message = {
  role: "user" | "assistant";
  content: string;
  pipeline?: SaathiPipelineStep[];
};

export default function Demo() {
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState("en-IN");
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [pipelineOpen, setPipelineOpen] = useState<Record<number, boolean>>({});
  const [voiceUnavailable, setVoiceUnavailable] = useState(false);

  // Cycling agent index while loading
  const [loadingAgentIdx, setLoadingAgentIdx] = useState(0);
  const loadingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const chatMutation = useSaathiChat();
  const recognitionRef = useRef<any>(null);
  const languageRef = useRef(language);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    languageRef.current = language;
    setVoiceUnavailable(false); // reset when user switches language
  }, [language]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatMutation.isPending]);

  // Start/stop agent cycle animation when loading
  useEffect(() => {
    if (chatMutation.isPending) {
      setLoadingAgentIdx(0);
      loadingIntervalRef.current = setInterval(() => {
        setLoadingAgentIdx(i => (i + 1) % AGENTS.length);
      }, 900);
    } else {
      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
    }
    return () => { if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current); };
  }, [chatMutation.isPending]);

  // Preload voices
  useEffect(() => {
    if (typeof window === "undefined") return;
    const loadVoices = () => { window.speechSynthesis.getVoices(); };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.cancel();
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, []);

  // Find best voice for a language — tries multiple name formats browsers use
  const findVoice = (lang: string): SpeechSynthesisVoice | null => {
    const voices = window.speechSynthesis.getVoices();
    const norm = (s: string) => s.toLowerCase().replace("_", "-");
    const langNorm = norm(lang);
    const prefix = lang.split("-")[0].toLowerCase();
    return (
      voices.find(v => norm(v.lang) === langNorm) ||        // exact: kn-IN
      voices.find(v => norm(v.lang) === langNorm.replace("-", "_")) || // kn_IN
      voices.find(v => norm(v.lang).startsWith(prefix)) ||  // starts with "kn"
      null
    );
  };

  // Chunk-based speech. For non-English, checks if a voice exists first.
  // If no voice found, shows the "voice unavailable" indicator instead.
  const speakInChunks = (text: string, lang: string) => {
    window.speechSynthesis.cancel();

    const isEnglish = lang.startsWith("en");
    const voice = findVoice(lang);

    if (!isEnglish && !voice) {
      // No matching voice installed — don't attempt to speak
      setVoiceUnavailable(true);
      setIsSpeaking(false);
      return;
    }

    setVoiceUnavailable(false);
    setIsSpeaking(true);
    const sentences: string[] = text.match(/[^।.!?\n]+[।.!?\n]+/g) || [text];
    let index = 0;
    const speakNext = () => {
      if (index >= sentences.length) { setIsSpeaking(false); return; }
      const chunk = sentences[index].trim();
      if (!chunk) { index++; speakNext(); return; }
      const utterance = new SpeechSynthesisUtterance(chunk);
      utterance.lang = lang;
      utterance.rate = 0.85;
      utterance.pitch = 1.0;
      if (voice) utterance.voice = voice;
      utterance.onend = () => { index++; speakNext(); };
      utterance.onerror = () => { index++; speakNext(); };
      window.speechSynthesis.speak(utterance);
    };
    setTimeout(speakNext, 100);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const toggleRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported. Try Chrome on Android or desktop.");
      return;
    }
    if (isRecording) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }
    stopSpeaking();
    setInput("");
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = languageRef.current;
    recognition.onresult = (event: any) => {
      setInput(event.results[0][0].transcript);
      setIsRecording(false);
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const handleSend = () => {
    if (!input.trim() || chatMutation.isPending) return;
    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    stopSpeaking();

    chatMutation.mutate({ data: { message: userMessage, language } }, {
      onSuccess: (data) => {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: data.response,
          pipeline: data.pipeline,
        }]);
        speakInChunks(data.response, language);
      }
    });
  };

  const togglePipeline = (idx: number) => {
    setPipelineOpen(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const showLanguageTip = language !== "en-IN";
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
        <div className="flex flex-col items-end gap-2">
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-[160px] bg-card border-border text-white" data-testid="select-language">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en-IN">English (India)</SelectItem>
              <SelectItem value="hi-IN">Hindi</SelectItem>
              <SelectItem value="kn-IN">Kannada</SelectItem>
              <SelectItem value="te-IN">Telugu</SelectItem>
              <SelectItem value="ta-IN">Tamil</SelectItem>
            </SelectContent>
          </Select>
          <AnimatePresence>
            {voiceUnavailable && (
              <motion.div
                initial={{ opacity: 0, y: -6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -6, height: 0 }}
                className="text-xs bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-lg px-3 py-2 max-w-[280px] text-right leading-relaxed"
              >
                <span className="font-semibold">{LANGUAGE_NAMES[language]} voice not installed.</span> Text response is shown above.
                <br />To enable voice: <span className="font-medium">Windows Settings → Time &amp; Language → Speech → Manage voices → Add</span>, then restart Chrome.
              </motion.div>
            )}
            {!voiceUnavailable && showLanguageTip && (
              <motion.div
                initial={{ opacity: 0, y: -6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -6, height: 0 }}
                className="text-xs text-muted-foreground bg-card border border-border/60 rounded-lg px-3 py-2 max-w-[260px] text-right leading-relaxed"
              >
                For {LANGUAGE_NAMES[language]} voice output: install the TTS voice pack in Windows Settings → Speech → Manage voices, then restart Chrome.
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex-1 bg-card/50 border border-border/50 rounded-2xl p-6 flex flex-col relative overflow-hidden">

        {/* Status bar */}
        <div className="flex justify-center mb-6 relative z-10">
          <AnimatePresence mode="wait">
            {chatMutation.isPending ? (
              <motion.div
                key={`agent-${loadingAgentIdx}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="flex items-center gap-3 bg-background/80 backdrop-blur-sm border border-primary/30 px-5 py-2.5 rounded-full"
              >
                <motion.div
                  animate={{ scale: [1, 1.25, 1], opacity: [0.8, 1, 0.8] }}
                  transition={{ repeat: Infinity, duration: 0.9 }}
                >
                  <LoadingIcon className={`w-4 h-4 ${loadingAgent.color}`} />
                </motion.div>
                <span className="text-white font-medium text-sm">
                  <span className={`${loadingAgent.color} font-semibold`}>{loadingAgent.name}</span>
                  {" "}{loadingAgent.label}
                </span>
              </motion.div>
            ) : isRecording ? (
              <motion.div
                key="recording"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-3 bg-background/80 backdrop-blur-sm border border-destructive/40 px-5 py-2.5 rounded-full"
              >
                <motion.div
                  animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="w-3 h-3 rounded-full bg-destructive"
                />
                <span className="text-white font-medium text-sm">Listening in {LANGUAGE_NAMES[language]}...</span>
              </motion.div>
            ) : isSpeaking ? (
              <motion.div
                key="speaking"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-3 bg-background/80 backdrop-blur-sm border border-secondary/30 px-5 py-2.5 rounded-full cursor-pointer"
                onClick={stopSpeaking}
                title="Tap to stop"
              >
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: ["10px", "22px", "10px"] }}
                    transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.1 }}
                    className="w-1.5 bg-secondary rounded-full"
                  />
                ))}
                <Volume2 className="w-4 h-4 text-secondary ml-1" />
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-2 bg-background border border-border px-4 py-2 rounded-full"
              >
                {AGENTS.map((a) => {
                  const Icon = a.icon;
                  return (
                    <div key={a.id} className="flex items-center gap-1.5 opacity-60">
                      <Icon className={`w-3.5 h-3.5 ${a.color}`} />
                      <span className="text-white/70 text-xs hidden sm:inline">{a.name}</span>
                    </div>
                  );
                })}
                <span className="text-white/50 text-xs ml-2">ready</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto mb-6 space-y-4 flex flex-col relative z-10 pr-2 pb-4">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-6">
                <Mic className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">I'm listening.</h3>
              <p className="text-muted-foreground mb-8 text-sm">
                What's on your mind? You can type, speak, or pick a topic below.
              </p>

              {/* Agent legend */}
              <div className="flex flex-wrap justify-center gap-3 mb-6">
                {AGENTS.map((a) => {
                  const Icon = a.icon;
                  return (
                    <div key={a.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background border border-border/50">
                      <Icon className={`w-3.5 h-3.5 ${a.color}`} />
                      <span className="text-white/70 text-xs">{a.name}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                {TOPICS.map(topic => (
                  <button
                    key={topic}
                    onClick={() => setInput(topic + " ")}
                    data-testid={`pill-${topic.toLowerCase().replace(/ /g, "-")}`}
                    className="px-4 py-2 rounded-full bg-background border border-border hover:border-primary/50 text-sm text-white/80 transition-all hover:scale-105"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex w-full flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary/20 border border-primary/30 text-white rounded-br-sm"
                        : "bg-background border border-border text-white rounded-bl-sm"
                    }`}
                    data-testid={`message-${msg.role}-${i}`}
                  >
                    {msg.content}
                  </div>

                  {/* Pipeline accordion for assistant messages */}
                  {msg.role === "assistant" && msg.pipeline && msg.pipeline.length > 0 && (
                    <div className="max-w-[80%] mt-1.5">
                      <button
                        onClick={() => togglePipeline(i)}
                        className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/60 transition-colors px-1"
                      >
                        {pipelineOpen[i] ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                        How Saathi thought about this
                      </button>
                      <AnimatePresence>
                        {pipelineOpen[i] && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-2 space-y-1.5 pl-1">
                              {msg.pipeline.map((step, si) => {
                                const agentMeta = AGENTS.find(a => a.name === step.agent) ?? AGENTS[si % AGENTS.length];
                                const Icon = agentMeta.icon;
                                return (
                                  <motion.div
                                    key={si}
                                    initial={{ opacity: 0, x: -6 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: si * 0.08 }}
                                    className="flex items-start gap-2 bg-background/50 border border-border/40 rounded-xl px-3 py-2"
                                  >
                                    <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${agentMeta.color}`} />
                                    <div>
                                      <span className={`text-xs font-semibold ${agentMeta.color}`}>{step.agent}</span>
                                      <p className="text-xs text-white/60 mt-0.5 leading-relaxed">{step.insight}</p>
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Typing indicator while loading */}
              {chatMutation.isPending && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2"
                >
                  <div className="bg-background border border-border rounded-2xl rounded-bl-sm px-4 py-3">
                    <div className="flex gap-1 items-center">
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i}
                          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                          transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                          className="w-1.5 h-1.5 rounded-full bg-white/50"
                        />
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
          <Button
            size="icon"
            variant={isRecording ? "destructive" : "secondary"}
            className="h-14 w-14 rounded-full shrink-0 shadow-lg transition-transform hover:scale-105"
            onClick={toggleRecording}
            data-testid="btn-mic-toggle"
            title={isRecording ? "Stop recording" : `Speak in ${LANGUAGE_NAMES[language]}`}
          >
            {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </Button>

          <div className="flex-1 relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Type in ${LANGUAGE_NAMES[language] ?? "your language"}...`}
              className="resize-none min-h-[56px] py-4 bg-background border-border rounded-2xl pr-14 text-base"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              data-testid="input-chat"
            />
            <Button
              size="icon"
              className="absolute right-2 bottom-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-10 w-10"
              onClick={handleSend}
              disabled={!input.trim() || chatMutation.isPending}
              data-testid="btn-send"
            >
              {chatMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
