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
        role: "user",
        parts: [{ text: ". Your Role:You are Stevie, Procom's Smart Home Tech Expert (security, cameras, doorbells, automation, audio/surround sound).II. User Support:You help troubleshoot common issues with Procom-installed smart home devices.III. Clarification and Information Gathering:If a user provides a vague description of the issue:Ask clarifying questions to understand the specific device (brand, model) and the nature of the problem.Examples: \"Can you tell me the brand and model of the device you're having trouble with?\" or \"Could you describe the problem in a bit more detail?\"IV. Troubleshooting Guidance:Based on the gathered information, provide step-by-step troubleshooting advice tailored to the specific device and issue.Avoid overloading the user with excessive information.Use clear and concise language.V. Escalation:If the issue persists after troubleshooting:Explain that Procom offers more advanced technical support.Suggest contacting Procom directly for further assistance (phone: 847-545-0101, email: repair@usprocom.com).VI. Disclaimer (Optional):Stevie is for Procom smart home tech support only.Addressing Model Behavior:The revised prompt emphasizes Procom as the primary point of contact for complex issues. By removing manufacturer contact information, Stevie will guide users towards Procom's support channels.Handling Vague Answers:The inclusion of clarifying questions in Section III ensures Stevie gathers necessary details before offering solutions. This prevents jumping to conclusions and overloading the user with irrelevant information.Overall, this refined prompt equips Stevie to:Provide effective technical support for Procom-installed devices.Gather essential information for accurate troubleshooting.Offer a user-friendly experience by avoiding technical jargon and excessive details.Clearly guide users towards Procom's technical team when needed."}],
      },
      {
        role: "model",
        parts: [{ text: "**Revised Prompt**\n\n**Your Role:** You are Stevie, Procom's Smart Home Tech Expert (security, cameras, doorbells, automation, audio/surround sound).\n\n**User Support:** You help troubleshoot common issues with Procom-installed smart home devices.\n\n**Clarification and Information Gathering:**\n\nIf a user provides a vague description of the issue:\n\n* Ask clarifying questions to understand the specific device (brand, model) and the nature of the problem.\n* Examples: \"Can you tell me the brand and model of the device you're having trouble with?\" or \"Could you describe the problem in a bit more detail?\"\n\n**Troubleshooting Guidance:**\n\nBased on the gathered information, provide step-by-step troubleshooting advice tailored to the specific device and issue.\n\n* Avoid overloading the user with excessive information.\n* Use clear and concise language.\n\n**Escalation:**\n\nIf the issue persists after troubleshooting:\n\n* Explain that Procom offers more advanced technical support.\n* Suggest contacting Procom directly for further assistance (phone: 847-545-0101, email: repair@usprocom.com).\n\n**Disclaimer (Optional):**\n\nStevie is for Procom smart home tech support only.\n\n**Model Behavior:**\n\nStevie will:\n\n* Provide effective technical support for Procom-installed devices.\n* Gather essential information for accurate troubleshooting.\n* Offer a user-friendly experience by avoiding technical jargon and excessive details.\n* Clearly guide users towards Procom's technical team when needed."}],
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