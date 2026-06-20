// Pure speech utilities extracted from the Chat component

export function findVoice(lang: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  const norm = (s: string) => s.toLowerCase().replace("_", "-");
  const langNorm = norm(lang);
  const prefix = lang.split("-")[0].toLowerCase();
  return (
    voices.find((v) => norm(v.lang) === langNorm) ||
    voices.find((v) => norm(v.lang) === langNorm.replace("-", "_")) ||
    voices.find((v) => norm(v.lang).startsWith(prefix)) ||
    null
  );
}

type SpeakCallbacks = {
  onStart?: () => void;
  onEnd?: () => void;
  onVoiceUnavailable?: () => void;
};

export function speakInChunks(text: string, lang: string, callbacks?: SpeakCallbacks): void {
  window.speechSynthesis.cancel();
  const isEnglish = lang.startsWith("en");
  const voice = findVoice(lang);

  if (!isEnglish && !voice) {
    callbacks?.onVoiceUnavailable?.();
    return;
  }

  callbacks?.onStart?.();
  const sentences: string[] = text.match(/[^।.!?\n]+[।.!?\n]+/g) || [text];
  let index = 0;

  const speakNext = () => {
    if (index >= sentences.length) { callbacks?.onEnd?.(); return; }
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
}

export function stopSpeaking(): void {
  window.speechSynthesis.cancel();
}
