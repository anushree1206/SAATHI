export const ICALL_HELPLINE = "9152987821";

export const CRISIS_KEYWORDS = [
  "suicide",
  "kill myself",
  "end it all",
  "want to die",
  "no reason to live",
  "end my life",
];

export function hasCrisisSignals(text: string): boolean {
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some((kw) => lower.includes(kw));
}

export const FALLBACK_RESPONSES: Record<string, string[]> = {
  "hi-IN": [
    "मैं तुम्हारे साथ हूँ। कभी-कभी AI व्यस्त हो जाता है, लेकिन मैं हमेशा तुम्हारे लिए यहाँ हूँ।",
    "हे! मैं तुम्हारे साथ हूँ। AI सहायक थोड़ी देर के लिए ब्रेक पर हैं, लेकिन मैं अभी भी तुम्हारे लिए यहाँ हूँ।",
    "मैं तुम्हारे साथ हूँ! AI टीम अभी थोड़ी व्यस्त है, लेकिन मैं हमेशा तुम्हारा समर्थन करने के लिए यहाँ हूँ।",
  ],
  "kn-IN": [
    "ನಾನು ನಿಮ್ಮ ಜೊತೆ ಇದ್ದೇನೆ. ಕೆಲವು ಸಮಯ AI ಕಾರ್ಯನಿರತವಾಗಿರುತ್ತದೆ, ಆದರೆ ನಾನು ಯಾವಾಗಲೂ ನಿಮ್ಮಾಗೆ ಇಲ್ಲಿರುತ್ತೇನೆ.",
    "ಹೇ! ನಾನು ನಿಮ್ಮ ಜೊತೆ ಇದ್ದೇನೆ. AI ಸಹಾಯಕರು ಸ್ವಲ್ಪ ವಿರಾಮದಲ್ಲಿದ್ದಾರೆ, ಆದರೆ ನಾನು ಇನ್ನೂ ನಿಮಗೆ ಇಲ್ಲಿರುತ್ತೇನೆ.",
    "ನಾನು ನಿಮ್ಮ ಜೊತೆ ಇದ್ದೇನೆ! AI ತಂಡ ಈಗ ಸ್ವಲ್ಪ ಕಾರ್ಯನಿರತವಾಗಿದೆ, ಆದರೆ ನಾನು ಯಾವಾಗಲೂ ನಿಮ್ಮ ಬೆಂಬಲಕ್ಕಾಗಿ ಇಲ್ಲುತ್ತೇನೆ.",
  ],
  "te-IN": [
    "నేను మీ వద్ద ఉన్నాను. కొన్నిసార్లు AI బిజీగా ఉంటుంది, కానీ నేను ఎప్పుడూ మీ కోసం ఇక్కడ ఉంటాను.",
    "హే! నేను మీ వద్ద ఉన్నాను. AI సహాయకులు కొంచెం విరామంలో ఉన్నారు, కానీ నేను ఇంకా మీ కోసం ఇక్కడ ఉన్నాను.",
    "నేను మీ దగ్గరనే ఉన్నాను! AI బృందం ఇప్పుడు కొంచెం బిజీగా ఉంది, కానీ నేను ఎప్పుడూ మీకు మద్దతుగా ఉంటాను.",
  ],
  "ta-IN": [
    "நான் உம்முடன் இருக்கிறேன். சில சமயங்களில் AI பிஸியாக இருக்கும், ஆனால் நான் எப்போதும் உம்மால் இங்கே இருப்பேன்.",
    "ஹே! நான் உம்முடன் இருக்கிறேன். AI உதவியாளர்கள் சிறிது ஓய்வில் இருக்கிறார்கள், ஆனால் நான் இன்னும் உம்மால் இங்கே இருப்பேன்.",
    "நான் உம்முடன் இருக்கிறேன்! AI குழு இப்போது சற்று பிஸியாக இருக்கிறது, ஆனால் நான் எப்போதும் உமக்கு ஆதரவாக இருப்பேன்.",
  ],
  "en-IN": [
    "I'm here for you right now. Sometimes the AI gets busy, but I'm always here to listen.",
    "Hey! I'm here with you. The AI helpers are taking a quick break, but I'm still here for you.",
    "I'm here for you! The AI team is a bit busy right now, but I'm always here to support you.",
    "I'm here with you! Sometimes the AI gets overwhelmed, but I'm always here to listen.",
    "I'm here for you! The AI is taking a quick rest, but I'm always here to help you through things.",
  ],
};
