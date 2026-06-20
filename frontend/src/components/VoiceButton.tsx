import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";

const LANGUAGE_NAMES: Record<string, string> = {
  "en-IN": "English",
  "hi-IN": "Hindi",
  "kn-IN": "Kannada",
  "te-IN": "Telugu",
  "ta-IN": "Tamil",
};

type VoiceButtonProps = {
  isRecording: boolean;
  isDisabled: boolean;
  language: string;
  onToggle: () => void;
};

export default function VoiceButton({ isRecording, isDisabled, language, onToggle }: VoiceButtonProps) {
  return (
    <Button
      size="icon"
      variant={isRecording ? "destructive" : "secondary"}
      className="h-14 w-14 rounded-full shrink-0 shadow-lg transition-transform hover:scale-105"
      onClick={onToggle}
      disabled={isDisabled}
      data-testid="btn-mic-toggle"
      title={isRecording ? "Stop recording" : `Speak in ${LANGUAGE_NAMES[language] ?? language}`}
    >
      {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
    </Button>
  );
}
