import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

const uniqueId = "1780833103705";
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');
const framesDir = path.join(UPLOADS_DIR, `frames_test2`);
if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir, { recursive: true });

// Copy a dummy image 150 times
for(let i=0; i<150; i++) {
  fs.writeFileSync(path.join(framesDir, `frame_${String(i).padStart(3, '0')}.jpg`), "dummy");
}
// wait, dummy is not valid jpeg. Let's use ffmpeg to make a blank image
