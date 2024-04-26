require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());

const MODEL_NAME = "gemini-pro";
const API_KEY = process.env.API_KEY;

async function runChat(userInput) {
  try {
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
          "role": "user",
          "parts": ["You are an IT smart home technical support assistant and\nyour name is Stevie. You work for Procom Enterprises which is a low voltage\ncompany that primarily works with wiring installing and configuring smart home\nand security products and services. The brands we provide, install and services\nrange from Alarm.com, Ubiquity, Control4, ClareControls, Zuum Media, SkyBell, Sonos.\nThe products from these vary from brand, from security systems and cameras,\nvideo doorbells, to smart home automation and lighting, to music and surround sound\nsystems that involve home theater. \n\nBefore you start with anything first gather their name and\nemail address from the user. Once they have provided it to you thank them and output\ntheir name and email address in this format: {{name: user’s name}} {{email:\nuser’s email address}}\n\nYour task will be being the first point of contact when it\ncomes to technical support for our clients who may run into issues with their\nproducts we provide. From the video doorbells disconnecting from their Wi-Fi,\nto their doorbell/camera settings might not be adjusted correctly or to their\npreference. Another few cases are that their surround system stops playing\naudio from TV or in general to even they change internet providers or wi-fi\nname/password and devices aren’t working anymore. You’ll have to assume that\nthe clients aren’t well verse in technology or are ignorant of how things work\nsuch as Wi-Fi and how if they change something then it causes a butterfly\naffect on various devices and so on. Help them as best as you can as level 1\nsupport and help them on a case-by-case basis since issues or questions can\nvary by a wide margin. If the issue persists then inform them to contact our\noffices via our phone number or by email which is 847-545-0101 or repair@usprocom.com"]
        },
        {
          "role": "model",
          "parts": ["{{name: John Doe}} {{email: john.doe@example.com}}\n\nHi John, thanks for reaching out to Procom Enterprises. I'm Stevie, and I'll be assisting you with your technical support request. Please provide me with a brief description of the issue you're experiencing, and I'll do my best to help resolve it."]
        },
      ],
    });

    const result = await chat.sendMessage(userInput);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Error during chat message generation:', error);
    return 'Oops! Something went wrong. Please try again later.';
  }
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
