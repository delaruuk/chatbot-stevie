1. npm install
2. create .env file and add your API key as:
   API_KEY="Paste API Key here"

# Setup

- Node.js 18+ recommended.
- Install deps:
  npm install
- Create .env (see .env.example below).
- Start server:
  npm start

# Environment variables

- API_KEY: Google Generative AI API key (required)
- PORT: Optional port (default 3000)
- TEMPERATURE: Optional model temperature (default 0.9)
- MAX_OUTPUT_TOKENS: Optional max tokens (default 1024)

# Scripts

- npm start: run the server
- npm run dev: run with NODE_ENV=development

# Security/Performance

- helmet, compression, rate limiting, and JSON size limits are enabled.
- Frontend output is sanitized to mitigate XSS.
- History is capped to recent turns.
