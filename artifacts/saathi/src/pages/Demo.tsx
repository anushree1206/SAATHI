import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, MicOff, Send, Heart, BookOpen, BrainCircuit, ShieldAlert, Loader2 } from "lucide-react";
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

export default function Demo() {
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState("en-IN");
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [activeAgent, setActiveAgent] = useState(AGENTS[0]);
  
  const chatMutation = useSaathiChat();
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    // Initialize Web Speech API
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        
        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          setIsRecording(false);
        };

        recognitionRef.current.onerror = () => {
          setIsRecording(false);
        };
        
        recognitionRef.current.onend = () => {
          setIsRecording(false);
        };
      }
      
      synthRef.current = window.speechSynthesis;
    }
    
    return () => {
      if (synthRef.current) synthRef.current.cancel();
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, []);

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language;
    }
  }, [language]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      if (synthRef.current) synthRef.current.cancel();
      setIsSpeaking(false);
      setInput("");
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const speakText = (text: string) => {
    if (!synthRef.current) return;
    
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    
    // Pick an appropriate voice based on lang
    const voices = synthRef.current.getVoices();
    const langVoices = voices.filter(v => v.lang.includes(language.split('-')[0]));
    if (langVoices.length > 0) utterance.voice = langVoices[0];
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synthRef.current.speak(utterance);
  };

  const handleSend = () => {
    if (!input.trim() || chatMutation.isPending) return;
    
    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput("");
    if (synthRef.current) synthRef.current.cancel();
    setIsSpeaking(false);
    
    // Cycle active agent for visual flair
    setActiveAgent(AGENTS[Math.floor(Math.random() * AGENTS.length)]);
    
    chatMutation.mutate({ data: { message: userMessage, language } }, {
      onSuccess: (data) => {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        speakText(data.response);
      }
    });
  };

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto p-4 md:p-8 flex flex-col h-[calc(100vh-4rem)]">
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Talk to Saathi</h1>
          <p className="text-muted-foreground">Your safe space is ready.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-[140px] bg-card border-border text-white">
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
        </div>
      </div>

      <div className="flex-1 bg-card/50 border border-border/50 rounded-2xl p-6 flex flex-col relative overflow-hidden">
        {/* Agent Badges / Status */}
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
                  className={`w-3 h-3 rounded-full bg-primary`} 
                />
                <span className="text-white font-medium">Saathi is thinking...</span>
              </motion.div>
            ) : isSpeaking ? (
              <motion.div 
                key="speaking"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2 bg-background/80 backdrop-blur-sm border border-secondary/30 px-6 py-3 rounded-full"
              >
                {[...Array(5)].map((_, i) => (
                  <motion.div 
                    key={i}
                    animate={{ height: ["12px", "24px", "12px"] }} 
                    transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.1 }}
                    className="w-1.5 bg-secondary rounded-full" 
                  />
                ))}
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

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto mb-6 space-y-6 flex flex-col relative z-10 pr-2 pb-4">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-6">
                <Mic className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">I'm listening.</h3>
              <p className="text-muted-foreground mb-8">What's on your mind today? You can type or use your voice.</p>
              
              <div className="flex flex-wrap justify-center gap-2">
                {TOPICS.map(topic => (
                  <button
                    key={topic}
                    onClick={() => setInput(topic + " ")}
                    className="px-4 py-2 rounded-full bg-background border border-border hover:border-primary/50 text-sm text-white/80 transition-colors"
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
                <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-primary/20 border border-primary/30 text-white rounded-br-sm' : 'bg-background border border-border text-white rounded-bl-sm'}`}>
                  {msg.content}
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Input Area */}
        <div className="relative z-10 flex items-end gap-2">
          <Button 
            size="icon" 
            variant={isRecording ? "destructive" : "secondary"}
            className="h-14 w-14 rounded-full shrink-0 shadow-lg"
            onClick={toggleRecording}
            data-testid="btn-mic-toggle"
          >
            {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </Button>
          
          <div className="flex-1 relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your thoughts here..."
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