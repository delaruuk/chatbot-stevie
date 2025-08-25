// server.js
require("dotenv").config();
const express = require("express");
const path = require("path");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { saveMessage, getUserHistory } = require("./db");

const app = express();

// --- Middleware ---
app.use(helmet());
app.use(compression());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
const limiter = rateLimit({ windowMs: 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false });
app.use(limiter);
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(express.static(path.join(__dirname)));

// --- Gemini setup ---
const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
  // Fail fast with a clear message in logs
  console.warn("Missing API_KEY (or GEMINI_API_KEY). Requests to /chat will fail.");
}
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-pro" }); // or "gemini-1.5-flash"

// --- Routes ---
// Handle sending a chat message (aligns with frontend contract)
app.post("/chat", async (req, res) => {
  const { userInput, history: clientHistory } = req.body || {};

  if (!userInput || typeof userInput !== "string") {
    return res.status(400).json({ error: "Missing 'userInput' string in body." });
  }

  const userId = req.ip || "anonymous";

  try {
    // Persist user message
    await saveMessage(userId, userInput, "user");

    // Server-side history for continuity (recent 5)
    const recent = await getUserHistory(userId, 5);

    // Combine client-provided short history (optional) with server history
    const combined = [];
    if (Array.isArray(clientHistory)) {
      for (const turn of clientHistory) {
        if (turn && typeof turn.content === "string" && typeof turn.role === "string") {
          combined.push({ role: turn.role, message: turn.content });
        }
      }
    }
    for (const m of recent) {
      combined.push({ role: m.role, message: m.message });
    }

    const context = combined
      .map(m => `${m.role.toUpperCase()}: ${m.message}`)
      .join("\n");

    const prompt = `${context}${context ? "\n" : ""}USER: ${userInput}\nASSISTANT:`;

    // Call Gemini
    const result = await model.generateContent(prompt);
    const reply = result.response.text();

    // Persist assistant reply
    await saveMessage(userId, reply, "assistant");

    res.json({ response: reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong." });
  }
});

// Get user chat history
app.get("/history/:user", async (req, res) => {
  const history = await getUserHistory(req.params.user, 20);
  res.json(history);
});

// --- Start server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
