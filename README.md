1. npm install
2. Create a `.env` file with:
   API_KEY="your Google Generative AI key"
   PORT=3000
   NODE_ENV=development
3. Start the server: `npm start`

# Setup

- Node.js 18+ recommended.
- Install deps:
  npm install
- Create .env (see example below).
- Start server: `npm start`

# Environment variables

- API_KEY: Google Generative AI API key (required)
- PORT: Optional port (default 3000)
- TEMPERATURE: Optional model temperature (default 0.9)
- MAX_OUTPUT_TOKENS: Optional max tokens (default 1024)

# Scripts

- npm start: run the server
- npm run dev: run with NODE_ENV=development (Windows-friendly)

# Security/Performance

- helmet, compression, rate limiting, logging, and JSON size limits are enabled.
- Frontend output is sanitized to mitigate XSS.
- History is capped to recent turns.

# Local knowledge and learning

- Place your guides/walkthroughs as `.md`, `.txt`, or `.json` files in the `data/` folder. These are loaded into lightweight chunks at startup.
- The server retrieves the most relevant guide snippets and similar past messages for each user query, and includes them in the model prompt.
- Conversation history is stored locally in `data/data.json`. The app also performs a simple text search over past messages to surface similar Q&A.
