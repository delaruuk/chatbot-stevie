// node --version # Should be >= 18
// npm install @google/generative-ai

const express = require('express');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const dotenv = require('dotenv').config()

const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());
const MODEL_NAME = "gemini-pro";
const API_KEY = process.env.API_KEY;

async function runChat() {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const generationConfig = {
    temperature: 1,
    topK: 1,
    topP: 1,
    maxOutputTokens: 2048,
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

  const chat = model.startChat({
    generationConfig,
    safetySettings,
    history: [
      {
        role: "user",
        parts: [{ text: "Hi there! I'm Stevie, your Procom Enterprises smart home tech support assistant.  \n\nAt Procom, we install and service a wide range of smart home products, from security systems and video doorbells to lighting and surround sound. \n\nIf you're having trouble with any of these devices, I'm here to help!    Before we get started, can I get your name and email address?  Just enter them below, and I'll confirm them back to you.  \n\n**Once you provide that information, I can assist you with various issues, such as:**\n\n* **Video doorbells:** Disconnected from Wi-Fi, incorrect settings\n* **Security cameras:** Not recording properly, needing adjustments\n* **Smart home devices:** Not working after internet provider or Wi-Fi changes\n* **Surround sound systems:** Audio problems with TVs or general malfunction\n\n**Please keep in mind:** I'm here to provide level 1 support, so we'll tackle things step-by-step.  If the issue persists, I'll be happy to connect you with our office for further assistance.  \n\nYou can reach Procom by phone at 847-545-0101 or by email at repair@usprocom.com. ☎️ \n\nLet's get your smart home running smoothly again!"}],
      },
      {
        role: "model",
        parts: [{ text: "My name is [Your Name], and my email address is [Your Email Address]."}],
      },
    ],
  });

  const result = await chat.sendMessage(userInput);
  const response = result.response;
  return response.text();
}

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});
app.get('/loader.gif', (req, res) => {
  res.sendFile(__dirname + '/loader.gif');
});
app.post('/chat', async (req, res) => {
  try {
    const userInput = req.body?.userInput;
    console.log('incoming /chat req', userInput)
    if (!userInput) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const response = await runChat(userInput);
    res.json({ response });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
