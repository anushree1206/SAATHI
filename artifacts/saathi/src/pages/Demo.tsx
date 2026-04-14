import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, MicOff, Send, Heart, BookOpen, BrainCircuit, ShieldAlert, Loader2, Volume2 } from "lucide-react";
import { useSaathiChat } from "@workspace/api-client-react";

const TOPICS = [
  "Parent pressure",
  "Career confusion",
  "Burnout",
  "Friend betrayal",
  "Crush distraction"
];

const AGENTS = [
  { id: "empathy", name: "Empathy", icon: Heart, color: "text-rose-400" },
  { id: "study", name: "Study Advisor", icon: BookOpen, color: "text-blue-400" },
  { id: "mental", name: "Mental Health", icon: BrainCircuit, color: "text-secondary" },
  { id: "reality", name: "Reality Check", icon: ShieldAlert, color: "text-primary" }
];

const LANGUAGE_NAMES: Record<string, string> = {
  "en-IN": "English",
  "hi-IN": "Hindi",
  "kn-IN": "Kannada",
  "te-IN": "Telugu",
  "ta-IN": "Tamil",
};

export default function Demo() {
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState("en-IN");
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [activeAgent, setActiveAgent] = useState(AGENTS[0]);

  const chatMutation = useSaathiChat();
  const recognitionRef = useRef<any>(null);
  const languageRef = useRef(language);

  // Keep languageRef in sync so callbacks always see latest value
  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  // Preload voices as early as possible
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadVoices = () => { window.speechSynthesis.getVoices(); };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.cancel();
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, []);

  // Chunk-based speech that survives long text and non-English scripts
  const speakInChunks = (text: string, lang: string) => {
    window.speechSynthesis.cancel();
    setIsSpeaking(true);

    // Split on sentence endings including Devanagari danda (।) and other punctuation
    const sentences: string[] = text.match(/[^।.!?\n]+[।.!?\n]+/g) || [text];

    let index = 0;

    const speakNext = () => {
      if (index >= sentences.length) {
        setIsSpeaking(false);
        return;
      }

      const chunk = sentences[index].trim();
      if (!chunk) { index++; speakNext(); return; }

      const utterance = new SpeechSynthesisUtterance(chunk);
      utterance.lang = lang;
      utterance.rate = 0.85;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const exactMatch = voices.find(v => v.lang === lang);
      const partialMatch = voices.find(v => v.lang.startsWith(lang.split('-')[0]));
      if (exactMatch) utterance.voice = exactMatch;
      else if (partialMatch) utterance.voice = partialMatch;

      utterance.onend = () => { index++; speakNext(); };
      utterance.onerror = () => { index++; speakNext(); };

      window.speechSynthesis.speak(utterance);
    };

    // Small delay to ensure voices are loaded
    setTimeout(speakNext, 100);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  // Always recreate recognition with the current language right before starting
  const toggleRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Try Chrome on Android or desktop.");
      return;
    }

    if (isRecording) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }

    // Stop any ongoing speech
    stopSpeaking();
    setInput("");

    // Create a fresh recognition instance with the current language
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = languageRef.current;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsRecording(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const handleSend = () => {
    if (!input.trim() || chatMutation.isPending) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput("");
    stopSpeaking();

    setActiveAgent(AGENTS[Math.floor(Math.random() * AGENTS.length)]);

    chatMutation.mutate({ data: { message: userMessage, language } }, {
      onSuccess: (data) => {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        speakInChunks(data.response, language);
      }
    });
  };

  const showLanguageTip = language !== "en-IN";

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

          {/* Language tip for non-English */}
          <AnimatePresence>
            {showLanguageTip && (
              <motion.div
                initial={{ opacity: 0, y: -6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -6, height: 0 }}
                className="text-xs text-muted-foreground bg-card border border-border/60 rounded-lg px-3 py-2 max-w-[260px] text-right leading-relaxed"
                data-testid="language-tip"
              >
                For best {LANGUAGE_NAMES[language]} voice, open on Android Chrome or install the voice pack:
                Windows Settings → Time &amp; Language → Speech → Add voices → {LANGUAGE_NAMES[language]}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex-1 bg-card/50 border border-border/50 rounded-2xl p-6 flex flex-col relative overflow-hidden">

        {/* Agent status indicator */}
        <div className="flex justify-center mb-8 relative z-10">
          <AnimatePresence mode="wait">
            {chatMutation.isPending ? (
              <motion.div
                key="thinking"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-3 bg-background/80 backdrop-blur-sm border border-primary/30 px-6 py-3 rounded-full"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="w-3 h-3 rounded-full bg-primary"
                />
                <span className="text-white font-medium text-sm">Saathi is thinking...</span>
              </motion.div>
            ) : isRecording ? (
              <motion.div
                key="recording"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-3 bg-background/80 backdrop-blur-sm border border-destructive/40 px-6 py-3 rounded-full"
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
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-3 bg-background/80 backdrop-blur-sm border border-secondary/30 px-6 py-3 rounded-full cursor-pointer"
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
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-3 bg-background border border-border px-4 py-2 rounded-full"
              >
                <activeAgent.icon className={`w-5 h-5 ${activeAgent.color}`} />
                <span className="text-white font-medium text-sm">{activeAgent.name} mode</span>
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
              <div className="flex flex-wrap justify-center gap-2">
                {TOPICS.map(topic => (
                  <button
                    key={topic}
                    onClick={() => setInput(topic + " ")}
                    data-testid={`pill-${topic.toLowerCase().replace(/ /g, '-')}`}
                    className="px-4 py-2 rounded-full bg-background border border-border hover:border-primary/50 text-sm text-white/80 transition-all hover:scale-105"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                    ? 'bg-primary/20 border border-primary/30 text-white rounded-br-sm'
                    : 'bg-background border border-border text-white rounded-bl-sm'
                    }`}
                  data-testid={`message-${msg.role}-${i}`}
                >
                  {msg.content}
                </div>
              </motion.div>
            ))
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
                if (e.key === 'Enter' && !e.shiftKey) {
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
