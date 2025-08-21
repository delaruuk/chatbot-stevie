require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

const app = express();
const port = process.env.PORT || 3000;
app.use(helmet());
app.use(compression());
app.use(morgan('tiny'));
app.use(express.json({ limit: '2kb' }));

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

const MODEL_NAME = "gemini-pro";
const API_KEY = process.env.API_KEY;
const TEMPERATURE = Number(process.env.TEMPERATURE || 0.9);
const MAX_OUTPUT_TOKENS = Number(process.env.MAX_OUTPUT_TOKENS || 1024);

if (!API_KEY) {
  console.error('Missing API_KEY in environment. Please set API_KEY in your .env file.');
  process.exit(1);
}

async function runChat(userInput, priorHistory) {
  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const generationConfig = {
      temperature: TEMPERATURE,
      topK: 1,
      topP: 1,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    };

    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ];

    const initialInstruction = [
      {
        role: 'user',
        parts: ["You are Stevie, Procom's Smart Home Tech Support Assistant. Ask for the user's name, confirm details, troubleshoot Procom-installed devices (Wi‑Fi, device settings, provider/Wi‑Fi changes, A/V, Z‑Wave, security cameras). When needed, offer escalation: support page (https://www.usprocom.com/support/) or phone (847‑545‑0101). Ask clarifying questions, keep steps clear and concise."]
      },
      {
        role: 'model',
        parts: ["Hello there, my name is Stevie. I'm Procom's Smart Home Tech Support Assistant. May I please have your name?"]
      },
    ];

    const mappedHistory = Array.isArray(priorHistory)
      ? priorHistory.slice(-10).map((m) => ({ role: m.role, parts: [String(m.content || '')] }))
      : [];

    const chat = model.startChat({
      generationConfig,
      safetySettings,
      history: [...initialInstruction, ...mappedHistory],
    });

    const result = await chat.sendMessage(userInput);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Error during chat message generation:', error);
    return 'Oops! Incorrect input, try again.';
  }
}

app.use(express.static(path.join(__dirname)));

app.post('/chat', chatLimiter, async (req, res) => {
  try {
    const userInputRaw = req.body?.userInput;
    const history = req.body?.history || [];
    if (typeof userInputRaw !== 'string') {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const userInput = userInputRaw.trim().slice(0, 1000);

    const response = await runChat(userInput, history);
    res.json({ response });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
