import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = new GoogleGenerativeAI('AQ.Ab8RN6KPEdywRNCWjpYmscPUWyDSI2V7wG5o8eNzs4hucBqgzA');
async function run() {
  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models?key=AQ.Ab8RN6KPEdywRNCWjpYmscPUWyDSI2V7wG5o8eNzs4hucBqgzA");
    const data = await response.json();
    console.log(data);
  } catch (e) {
    console.error(e);
  }
}
run();
