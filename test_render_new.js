import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { exec } from 'child_process';

const uniqueId = Date.now();
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');
const framesDir = path.join(UPLOADS_DIR, `frames_${uniqueId}`);
if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir, { recursive: true });

const parsedLyrics = [{ time: 0, text: "HELLO WORLD" }, { time: 5, text: "TEST" }];
const trimmedPath = path.join(UPLOADS_DIR, "kitab_song_trimmed.mp3");

async function run() {
  console.log("Launching browser");
  const browser = await puppeteer.launch({ headless: true });
  console.log("New page");
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1920 });

  const htmlContent = `
    <html>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@700&display=swap" rel="stylesheet">
      </head>
      <body style="background: black; margin: 0; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: 'Caveat', cursive; overflow: hidden; text-transform: uppercase;">
        <div id="text" style="color: #ec4899; font-size: 110px; font-weight: bold; text-align: center; text-shadow: 0 0 30px #ec4899, 0 0 10px #ec4899; max-width: 900px; line-height: 1.4; letter-spacing: 2px;">
        </div>
        <script>
          const lyrics = ${JSON.stringify(parsedLyrics)};
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
  console.log("Setting content");
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  const fps = 10;
  const duration = 15;
  const totalFrames = fps * duration;

  console.log("Capturing frames");
  for (let f = 0; f < totalFrames; f++) {
    const t = f / fps;
    await page.evaluate((time) => updateTime(time), t);
    await page.screenshot({ 
      path: path.join(framesDir, `frame_${String(f).padStart(3, '0')}.jpg`),
      type: 'jpeg',
      quality: 80
    });
  }
  console.log("Closing browser");
  await browser.close();

  const videoPath = path.join(UPLOADS_DIR, `viral_reel_${uniqueId}.mp4`);
  const createVideoCmd = `ffmpeg -y -framerate ${fps} -i "${path.join(framesDir, 'frame_%03d.jpg')}" -i "${trimmedPath}" -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest "${videoPath}"`;
  
  console.log("Running ffmpeg");
  exec(createVideoCmd, (err, stdout, stderr) => {
    console.log("FFmpeg finished. Err:", err);
    console.log("Stderr:", stderr.slice(-500));
    fs.rmSync(framesDir, { recursive: true, force: true });
  });
}
run().catch(console.error);
