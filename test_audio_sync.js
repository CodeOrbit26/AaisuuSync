import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

const apiKey = 'AQ.Ab8RN6KPEdywRNCWjpYmscPUWyDSI2V7wG5o8eNzs4hucBqgzA'; 
const genAI = new GoogleGenerativeAI(apiKey);

async function runTest(modelName) {
  const model = genAI.getGenerativeModel({ model: modelName, generationConfig: { responseMimeType: "application/json" } });
  try {
    const audioBytes = fs.readFileSync("/tmp/test.mp3");
    const audioBase64 = audioBytes.toString('base64');
    
    const prompt2 = `Listen to this 15-second audio clip. Transcribe the lyrics exactly as they are sung in the audio.
CRITICAL LANGUAGE RULE: You MUST write the lyrics in HINGLISH ONLY (Hindi/Haryanvi words written using the English alphabet). Do NOT use Devanagari script.
Return the lyrics in strict LRC format. Every single line MUST start with a timestamp [mm:ss.ms].
IMPORTANT TYPOGRAPHY RULE: Break the lyrics down into 10 to 13 short lines. Each line should have only 1 to 4 words. The very last line MUST just be 3 to 4 related emojis (e.g., [00:14.00] 👍😭✨🤍). 

Return JSON format exactly like this: { "syncedLyrics": "string" }`;

    const inlineData = { inlineData: { data: audioBase64, mimeType: "audio/mp3" } };
    const res = await model.generateContent([prompt2, inlineData]);
    console.log(`--- ${modelName} ---`);
    console.log(res.response.text());
  } catch (e) {
    console.error(`--- ${modelName} ERROR ---`, e.message);
  }
}

async function main() {
  await runTest("gemini-3.1-flash-lite");
  await runTest("gemini-2.5-flash-lite");
}
main();
