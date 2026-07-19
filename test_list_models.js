import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = new GoogleGenerativeAI('AQ.Ab8RN6LVG1UBt0ARe0Iyvm0lwzkj4jFqIc2a8FuVDNZGkEJxOg');
async function run() {
  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models?key=AQ.Ab8RN6LVG1UBt0ARe0Iyvm0lwzkj4jFqIc2a8FuVDNZGkEJxOg");
    const data = await response.json();
    console.log(data);
  } catch (e) {
    console.error(e);
  }
}
run();
