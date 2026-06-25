import { GoogleGenerativeAI } from '@google/generative-ai';
const apiKey = 'AQ.Ab8RN6KPEdywRNCWjpYmscPUWyDSI2V7wG5o8eNzs4hucBqgzA'; 
const genAI = new GoogleGenerativeAI(apiKey);
async function run() {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  try {
    const res = await model.generateContent("hello");
    console.log(res.response.text());
  } catch (e) {
    console.error("error:", e.message);
  }
}
run();
