import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { exec } from 'child_process';

const uniqueId = "test1234";
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');
const framesDir = path.join(UPLOADS_DIR, `frames_${uniqueId}`);
if (!fs.existsSync(framesDir)) {
  fs.mkdirSync(framesDir, { recursive: true });
}

const parsed = [{time: 0, text: "Hello"}, {time: 5, text: "World"}];

async function run() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1920 });

  const htmlContent = `
    <html>
      <body style="background: black; margin: 0; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: 'Helvetica Neue', Arial, sans-serif; overflow: hidden;">
        <div id="text" style="color: #ec4899; font-size: 80px; font-weight: bold; text-align: center; text-shadow: 0 0 30px #ec4899, 0 0 10px #ec4899; max-width: 900px; line-height: 1.4;">
        </div>
        <script>
          const lyrics = ${JSON.stringify(parsed)};
          function updateTime(t) {
            let currentText = '';
            for (let i = lyrics.length - 1; i >= 0; i--) {
              if (t >= lyrics[i].time) {
                currentText = lyrics[i].text;
                break;
              }
            }
            document.getElementById('text').innerText = currentText;
          }
        </script>
      </body>
    </html>
  `;
  await page.setContent(htmlContent);

  for (let f = 0; f < 10; f++) {
    const t = f / 10;
    await page.evaluate((time) => updateTime(time), t);
    await page.screenshot({ 
      path: path.join(framesDir, `frame_${String(f).padStart(3, '0')}.jpg`),
      type: 'jpeg',
      quality: 80
    });
  }
  await browser.close();

  const trimmedPath = "none"; // we will just test ffmpeg video render
  const videoPath = path.join(UPLOADS_DIR, `viral_reel_${uniqueId}.mp4`);
  const createVideoCmd = `ffmpeg -y -framerate 10 -i "${path.join(framesDir, 'frame_%03d.jpg')}" -c:v libx264 -pix_fmt yuv420p "${videoPath}"`;
  
  exec(createVideoCmd, (err, stdout, stderr) => {
    console.log("ERR:", err);
    console.log("STDERR:", stderr);
    fs.rmSync(framesDir, { recursive: true, force: true });
  });
}
run();
