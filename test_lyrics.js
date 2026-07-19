import { GoogleGenerativeAI } from '@google/generative-ai';
const apiKey = 'AQ.Ab8RN6I094JXuJczTE5XnV6mOpT2dMVc8xMwdKpATsi4Q1_d4g'; 
const genAI = new GoogleGenerativeAI(apiKey);
async function run() {
  const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite", generationConfig: { responseMimeType: "application/json" } });
  try {
    const prompt2 = `Listen to this 15-second audio clip. Transcribe the lyrics exactly as they are sung in the audio.
CRITICAL LANGUAGE RULE: You MUST write the lyrics in HINGLISH ONLY (Hindi/Haryanvi words written using the English alphabet). Do NOT use Devanagari script.
Return the lyrics in strict LRC format. Every single line MUST start with a timestamp [mm:ss.ms].
IMPORTANT TYPOGRAPHY RULE: Break the lyrics down into 10 to 13 short lines. Each line should have only 1 to 4 words. The very last line MUST just be 3 to 4 related emojis (e.g., [00:14.00] 👍😭✨🤍). 

Return JSON format exactly like this: { "syncedLyrics": "string" }`;
    const res = await model.generateContent(prompt2);
    console.log(res.response.text());
  } catch (e) {
    console.error("error:", e.message);
  }
}
run();
