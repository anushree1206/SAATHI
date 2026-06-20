import { motion, AnimatePresence } from "framer-motion";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const LANGUAGE_NAMES: Record<string, string> = {
  "en-IN": "English",
  "hi-IN": "Hindi",
  "kn-IN": "Kannada",
  "te-IN": "Telugu",
  "ta-IN": "Tamil",
};

type LanguageSelectProps = {
  value: string;
  onChange: (value: string) => void;
  voiceUnavailable: boolean;
};

export default function LanguageSelect({ value, onChange, voiceUnavailable }: LanguageSelectProps) {
  const showLanguageTip = value !== "en-IN" && !voiceUnavailable;

  return (
    <div className="flex flex-col items-end gap-2">
      <Select value={value} onValueChange={onChange}>
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
            <span className="font-semibold">{LANGUAGE_NAMES[value]} voice not installed.</span> Text response is shown above.
            <br />To enable voice: <span className="font-medium">Windows Settings → Time &amp; Language → Speech → Manage voices → Add</span>, then restart Chrome.
          </motion.div>
        )}
        {showLanguageTip && (
          <motion.div
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            className="text-xs text-muted-foreground bg-card border border-border/60 rounded-lg px-3 py-2 max-w-[260px] text-right leading-relaxed"
          >
            For {LANGUAGE_NAMES[value]} voice output: install the TTS voice pack in Windows Settings → Speech → Manage voices, then restart Chrome.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
