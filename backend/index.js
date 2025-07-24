import express from 'express';
import cors from 'cors';
import { Configuration, OpenAIApi } from "openai";
import textToSpeech from '@google-cloud/text-to-speech';
import fs from 'fs';
import util from 'util';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

// OpenAI setup
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Google TTS setup
const client = new textToSpeech.TextToSpeechClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

// Personality prompts for two voices
const personalities = {
  voice1: "You are cheerful and witty.",
  voice2: "You are calm and philosophical."
};

let conversationHistory = {
  voice1: [],
  voice2: []
};

app.post('/talk', async (req, res) => {
  try {
    const { topic, fromVoice } = req.body;

    // Determine current and other voice
    const currentVoice = fromVoice === "voice1" ? "voice1" : "voice2";
    const otherVoice = currentVoice === "voice1" ? "voice2" : "voice1";

    // Prepare messages for GPT chat
    let messages = [
      { role: "system", content: personalities[currentVoice] }
    ];

    // Include last other voice messages in context
    if (conversationHistory[otherVoice].length > 0) {
      messages.push({ role: "user", content: conversationHistory[otherVoice].slice(-1)[0] });
    } else if (topic) {
      // First prompt if no conversation yet
      messages.push({ role: "user", content: topic });
    }

    // Call GPT to generate reply
    const completion = await openai.createChatCompletion({
      model: "gpt-4o-mini",
      messages: messages,
      max_tokens: 150,
    });

    const replyText = completion.data.choices[0].message.content;

    // Save reply to history
    conversationHistory[currentVoice].push(replyText);

    // Google TTS request
    const request = {
      input: { text: replyText },
      voice: { languageCode: 'en-US', ssmlGender: 'NEUTRAL' },
      audioConfig: { audioEncoding: 'MP3' },
    };

    const [response] = await client.synthesizeSpeech(request);

    // Save audio to temp file
    const fileName = `output_${currentVoice}_${Date.now()}.mp3`;
    const filePath = path.join('./tmp', fileName);

    await fs.promises.mkdir('./tmp', { recursive: true });
    await fs.promises.writeFile(filePath, response.audioContent, 'binary');

    // Send back text and audio file path
    res.json({
      text: replyText,
      audioUrl: `http://localhost:${PORT}/audio/${fileName}`
    });

  } catch (error) {
    console.error(error);
    res.status(500).send("Error processing request");
  }
});

// Serve audio files statically
app.use('/audio', express.static(path.join(__dirname, 'tmp')));

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
