import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = 'AQ.Ab8RN6KPEdywRNCWjpYmscPUWyDSI2V7wG5o8eNzs4hucBqgzA'; // The default API key in AppContext.jsx
const genAI = new GoogleGenerativeAI(apiKey);

async function run() {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  try {
    const res = await model.generateContent("hello");
    console.log(res.response.text());
  } catch (e) {
    console.error("1.5-flash failed:", e.message);
    try {
      const model2 = genAI.getGenerativeModel({ model: "gemini-pro" });
      const res2 = await model2.generateContent("hello");
      console.log(res2.response.text());
    } catch (e2) {
      console.error("gemini-pro failed:", e2.message);
    }
  }
}

run();
