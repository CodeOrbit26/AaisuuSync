import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

const apiKey = 'AQ.Ab8RN6KPEdywRNCWjpYmscPUWyDSI2V7wG5o8eNzs4hucBqgzA'; 
const genAI = new GoogleGenerativeAI(apiKey);

async function run() {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: { responseMimeType: "application/json" } });
  try {
    const audioBytes = fs.readFileSync('public/uploads/kitab_song_trimmed.mp3');
    const audioBase64 = audioBytes.toString('base64');
    
    const prompt = `Listen to this 15-second audio clip. Tell me the name of the song, and transcribe the lyrics exactly as they are sung in the audio.
Return the lyrics in strict LRC format. Every single line MUST start with a timestamp [mm:ss.ms].
IMPORTANT TYPOGRAPHY RULE: Break the lyrics down into 10 to 13 short lines. Each line should have only 1 to 4 words. The very last line MUST just be 3 to 4 related emojis (e.g., [00:14.00] 👍😭✨🤍). 

Return JSON format exactly like this: { "songName": "string", "syncedLyrics": "string" }`;

    const res = await model.generateContent([
      prompt,
      { inlineData: { data: audioBase64, mimeType: "audio/mp3" } }
    ]);
    console.log(res.response.text());
  } catch (e) {
    console.error("Audio parsing failed:", e.message);
  }
}

run();
