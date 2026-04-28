# Saathi Voice Hub 🎓

An AI-powered voice companion for Indian students aged 14-22, providing emotional support, academic guidance, and mental health assistance in 5 Indian languages.

## 🚀 Features

### 🧠 AI Intelligence
- **4-Agent Sequential Pipeline**: Empathy → Study Advisor → Mental Health → Reality Check
- **Smart Model Fallback**: Automatic switching between multiple Gemini models for maximum availability
- **Multi-Language Support**: English, Hindi, Kannada, Telugu, Tamil
- **Context-Aware Responses**: Language selection overrides auto-detection
- **Crisis Detection**: Automatic iCall helpline integration (9152987821)

### 🎤 Voice Capabilities
- **Speech Recognition**: Browser Web Speech API with 5 language support
- **Text-to-Speech**: Natural voice synthesis with chunking
- **Dynamic Voice Matching**: Automatic language-specific voice selection
- **Graceful Fallbacks**: Clear instructions for missing voice support

### 💬 Chat Interface
- **Real-time Messaging**: Instant AI responses with typing indicators
- **Pipeline Visualization**: See all 4 agent analyses in real-time
- **Agent Badges**: Animated cycling through analysis stages
- **Responsive Design**: Mobile-first, accessible UI

## 🏗️ Architecture

### Frontend (React + TypeScript)
```
artifacts/saathi/
├── src/
│   ├── pages/
│   │   ├── Demo.tsx          # Main chat interface
│   │   ├── Landing.tsx        # Landing page
│   │   └── About.tsx          # About page
│   ├── components/
│   │   ├── ui/               # shadcn/ui components
│   │   └── ...             # Custom components
│   └── lib/
│       └── utils.ts           # Helper functions
├── public/
└── package.json
```

**Tech Stack:**
- React 18 with TypeScript
- Vite (development & build)
- Wouter (client-side routing)
- Framer Motion (animations)
- Tailwind CSS + shadcn/ui
- Lucide React (icons)

### Backend (Node.js + Express)
```
artifacts/api-server/
├── src/
│   ├── routes/
│   │   └── saathi/
│   │       └── index.ts    # Main API endpoint
│   └── index.ts              # Server entry point
├── package.json
└── tsconfig.json
```

**Tech Stack:**
- Node.js + Express 5
- TypeScript (fully typed)
- Pino (structured logging)
- esbuild (fast bundling)

### AI Integration
```
lib/integrations-gemini-ai/
├── src/
│   ├── client.ts          # Gemini client wrapper
│   ├── index.ts           # Exports
│   └── image.ts           # Image generation
└── package.json
```

**Features:**
- Replit Gemini AI integration
- Smart fallback chain (4 models)
- Automatic retry logic
- Rate limit handling

### Database (PostgreSQL + Drizzle)
```
lib/db/
├── schema.ts           # Database schema
├── index.ts           # Database client
└── migrations/         # Schema migrations
```

## 🤖 AI Model System

### Smart Fallback Chain
The system automatically tries multiple Gemini models in order of preference:

1. **gemini-2.5-flash-lite** (20 RPM free tier)
2. **gemini-2.0-flash** (15 RPM free tier, separate quota)
3. **gemini-2.0-flash-lite** (30 RPM free tier, separate quota)
4. **gemini-1.5-flash** (15 RPM free tier, separate quota)

### Error Handling
- **Rate Limit (429)**: Instant fallback to next model
- **Overload (503)**: Quick retry (800ms) once
- **All Models Exhausted**: Friendly 429 response
- **Graceful Degradation**: No crashes, clear error messages

### 4-Agent Pipeline
Each message passes through a sequential analysis:

1. **Empathy Agent**: Analyzes emotional state and needs
2. **Study Advisor**: Identifies academic/career context  
3. **Mental Health**: Assesses stress levels and crisis signals
4. **Reality Check**: Synthesizes final response

**Optimization**: Single API call with combined prompt (3-4x faster than sequential)

## 🌐 Language Support

| Language | Code | Voice Support | Script Support |
|-----------|--------|---------------|----------------|
| English   | en-IN  | ✅           | ✅             |
| Hindi     | hi-IN  | ✅           | ✅             |
| Kannada   | kn-IN  | ✅           | ✅             |
| Telugu    | te-IN  | ✅           | ✅             |
| Tamil     | ta-IN  | ✅           | ✅             |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or pnpm
- PostgreSQL database (for production)

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd Saathi-Voice-Hub

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration
```

### Development
```bash
# Start API server (port 3000)
cd artifacts/api-server
pnpm dev

# Start frontend (port 5173)
cd artifacts/saathi  
pnpm dev

# Access the application
# Frontend: http://localhost:5173
# API: http://localhost:3000
```

### Environment Variables
```bash
# API Configuration
VITE_API_URL=http://localhost:3000

# Database (for production)
DATABASE_URL=postgresql://user:password@localhost:5432/saathi

# Gemini AI (handled by Replit integration)
GEMINI_API_KEY=your_api_key_here
```

## 📱 API Endpoints

### POST /api/saathi/chat
Main chat endpoint for AI responses.

**Request:**
```json
{
  "message": "Hi, I'm feeling stressed about exams",
  "language": "en-IN"
}
```

**Response:**
```json
{
  "response": "I understand exam stress can be overwhelming. Take deep breaths and break study into smaller chunks.",
  "pipeline": [
    {
      "agent": "Empathy",
      "insight": "Student experiencing exam-related anxiety and needs reassurance."
    },
    {
      "agent": "Study Advisor", 
      "insight": "Concern about exam preparation and study habits."
    },
    {
      "agent": "Mental Health",
      "insight": "Moderate stress levels, no crisis detected. Recommend calming techniques."
    },
    {
      "agent": "Reality Check",
      "insight": "Final response crafted from all insights above."
    }
  ]
}
```

**Error Responses:**
```json
// Rate limit (all models busy)
{
  "error": "All AI models are currently busy. Please wait a minute and try again."
}

// Generic errors
{
  "error": "Failed to get response from Saathi"
}
```

## 🛠️ Development

### Project Structure
This is a monorepo using pnpm workspaces:

```
Saathi-Voice-Hub/
├── artifacts/
│   ├── saathi/           # React frontend
│   └── api-server/       # Express backend
├── lib/
│   ├── api-spec/          # OpenAPI specification
│   ├── api-client-react/  # Generated React hooks
│   ├── api-zod/           # Generated validation
│   ├── db/                # Database schema & client
│   └── integrations-gemini-ai/  # AI integration
├── .env                  # Environment variables
└── package.json            # Root workspace config
```

### Code Generation
```bash
# Generate API client from OpenAPI spec
pnpm run generate:client

# Database migrations
pnpm run db:migrate

# Type checking
pnpm run type-check
```

### Build & Deploy
```bash
# Build frontend
cd artifacts/saathi
pnpm build

# Build backend
cd artifacts/api-server
pnpm build

# Production deployment
# Configure environment variables
# Set DATABASE_URL for production
# Deploy to your preferred platform
```

## 🔧 Configuration

### Frontend Configuration
- **Vite**: Development server with HMR
- **TypeScript**: Strict type checking
- **ESLint**: Code quality enforcement
- **Prettier**: Code formatting

### Backend Configuration  
- **Express**: RESTful API server
- **Pino**: Structured JSON logging
- **TypeScript**: End-to-end type safety
- **CORS**: Cross-origin resource sharing

### AI Configuration
- **Models**: Smart fallback chain for maximum uptime
- **Retries**: Exponential backoff with intelligent error detection
- **Rate Limits**: Automatic handling per model
- **Response Format**: Structured JSON with pipeline visualization

## 🎯 Key Features Explained

### Voice Recognition
- Uses browser's native Web Speech API
- Supports 5 Indian languages with proper language codes
- Automatic language detection from user selection
- Graceful fallback when voice recognition unavailable

### Text-to-Speech
- Chunked processing to prevent mid-sentence cutoffs
- Language-specific voice selection
- Natural speech synthesis with appropriate pacing
- Visual feedback for speaking status

### Crisis Detection
- Automated monitoring for distress keywords
- Seamless iCall helpline integration (9152987821)
- Context-aware crisis response weaving
- Mental health professional escalation paths

### Pipeline Visualization
- Real-time display of all 4 agent analyses
- Animated transitions between agent states
- Expandable/collapsible pipeline details
- Color-coded agent insights

## 🌟 Production Considerations

### Performance
- **Single API Call**: Optimized from 4 sequential calls to 1 combined call
- **Smart Caching**: Model response caching for repeated queries
- **Connection Pooling**: Efficient API resource management
- **Error Boundaries**: Graceful degradation handling

### Security
- **Input Validation**: Zod schema validation on all endpoints
- **Rate Limiting**: Built-in protection against abuse
- **CORS Configuration**: Secure cross-origin requests
- **Environment Variables**: Sensitive data protection

### Monitoring
- **Structured Logging**: Pino JSON logs for production debugging
- **Error Tracking**: Comprehensive error categorization
- **Performance Metrics**: Response time and success rate monitoring
- **Health Checks**: Automated system status verification

## 🤝 Contributing

We welcome contributions to make Saathi better for Indian students!

### Development Setup
```bash
# Fork the repository
git clone <your-fork-url>
cd Saathi-Voice-Hub
pnpm install

# Create feature branch
git checkout -b feature/your-feature-name

# Make your changes
# Follow existing code patterns and conventions

# Run tests
pnpm test

# Submit pull request
# Ensure all tests pass and code is properly formatted
```

### Code Standards
- **TypeScript**: Strict typing for all new code
- **React**: Functional components with hooks
- **CSS**: Tailwind utility classes, custom CSS variables
- **API**: RESTful design with proper error handling
- **Testing**: Unit tests for new features

### Issue Reporting
- **Bug Reports**: Use GitHub Issues with detailed reproduction steps
- **Feature Requests**: Open an issue with the "enhancement" label
- **Security**: Report security concerns privately

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- **Gemini AI**: Google's powerful language model for intelligent responses
- **Web Speech API**: Browser-native voice recognition and synthesis
- **React Community**: For the amazing ecosystem of components and tools
- **OpenAPI**: For standardized API specification generation
- **Indian Student Community**: For inspiration and feedback in building this tool

---

**Built with ❤️ for Indian students everywhere** 🇮🇳
