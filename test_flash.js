import { GoogleGenerativeAI } from '@google/generative-ai';
const apiKey = 'AQ.Ab8RN6I094JXuJczTE5XnV6mOpT2dMVc8xMwdKpATsi4Q1_d4g'; 
const genAI = new GoogleGenerativeAI(apiKey);
async function run() {
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
  try {
    const res = await model.generateContent("hello");
    console.log(res.response.text());
  } catch (e) {
    console.error("error:", e.message);
  }
}
run();
