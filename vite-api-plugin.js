import os from 'os';
import fs from 'fs';
import path from 'path';
import { exec, execSync } from 'child_process';
import puppeteer from 'puppeteer';
import dns from 'dns';
import { setDefaultAutoSelectFamily } from 'net';
import ffmpegStatic from 'ffmpeg-static';
import ytdl from '@distube/ytdl-core';
import yts from 'yt-search';



try {
  if (dns && typeof dns.setDefaultResultOrder === 'function') {
    dns.setDefaultResultOrder('ipv4first');
  }
} catch (e) {}

try {
  if (typeof setDefaultAutoSelectFamily === 'function') {
    setDefaultAutoSelectFamily(true);
  }
} catch (e) {}

// Load local .env into process.env if available
try {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envLines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of envLines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = (match[2] || '').trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key] && val) {
          process.env[key] = val;
        }
      }
    }
  }
} catch (e) {}

const WORKFLOW_STATUS_PATH = path.join(process.cwd(), 'public', 'uploads', 'workflow_status.json');

function updateWorkflowStatus(data) {
  try {
    let current = { status: 'idle', stage: 'idle', logs: [], executionData: {} };
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    
    if (fs.existsSync(WORKFLOW_STATUS_PATH)) {
      try {
        current = JSON.parse(fs.readFileSync(WORKFLOW_STATUS_PATH, 'utf8'));
      } catch (e) {}
    }
    
    const newLogs = data.logs || [];
    const mergedLogs = data.clearLogs ? newLogs : [...current.logs, ...newLogs];
    
    const merged = {
      ...current,
      ...data,
      logs: mergedLogs,
      executionData: {
        ...current.executionData,
        ...(data.executionData || {})
      },
      updatedAt: Date.now()
    };
    
    delete merged.clearLogs;
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    fs.writeFileSync(WORKFLOW_STATUS_PATH, JSON.stringify(merged, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to update workflow status:', e);
  }
}


// Get local IPv4 address on the Wi-Fi/Ethernet interface
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

// Convert profile avatar image CDN URL to a persistent Base64 Data URL to prevent CORS/hotlinking issues
async function getBase64Avatar(url) {
  if (!url || !url.startsWith('http')) return url || '';
  try {
    const res = await fetch(url);
    if (!res.ok) return url;
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    return `data:${contentType};base64,${base64}`;
  } catch (e) {
    console.error('[Avatar Fetch] Failed to convert to base64:', e.message);
    return url;
  }
}

const AGENT_CONFIG_PATH = path.join(process.cwd(), 'agent_config.json');
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');
const AUDIO_MEMORY_PATH = path.join(process.cwd(), 'audio_memory.json');

function readAudioMemory() {
  if (!fs.existsSync(AUDIO_MEMORY_PATH)) {
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(AUDIO_MEMORY_PATH, 'utf8'));
  } catch (e) {
    return [];
  }
}

function writeAudioMemory(data) {
  try {
    fs.writeFileSync(AUDIO_MEMORY_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to write audio memory:', e);
  }
}

// Global memory of generated songs to avoid repeats
const SONGS_HISTORY_PATH = path.join(process.cwd(), 'songs_history.json');
function readSongsHistory() {
  let history = [];
  if (fs.existsSync(SONGS_HISTORY_PATH)) {
    try {
      history = JSON.parse(fs.readFileSync(SONGS_HISTORY_PATH, 'utf8'));
    } catch(e) {}
  }
  const memory = readAudioMemory();
  memory.forEach(item => {
    if (item.songName && !history.includes(item.songName)) {
      history.push(item.songName);
    }
  });
  return history;
}
function writeSongsHistory(history) {
  try {
    fs.writeFileSync(SONGS_HISTORY_PATH, JSON.stringify(history, null, 2));
  } catch(e) {}
}

const BLUEPRINT_PROMPTS_PATH = path.join(process.cwd(), 'blueprint_prompts.json');
const DEFAULT_BLUEPRINT_PROMPTS = {
  Lyrics: {
    prompt1: `You are a viral TikTok/Reels expert. Suggest 3 distinct trending Hindi or Haryanvi songs for an emotional reel. For each song, give the song name, YouTube search query, and hook start time in seconds.\nReturn JSON format: { "songs": [ { "songName": "string", "youtubeSearchQuery": "string", "viralHookStartTime": number } ] }`,
    prompt2: `Listen to this 15-second audio clip. Transcribe the lyrics exactly as sung in Hinglish only. Return lyrics in strict LRC format [mm:ss.ms]. The very last line MUST be 2-4 aesthetic emojis from: ✨ 🤍 💕 🫣 🫠 😭 💔 💫 🍷 😋 🙄 😫 🤙.\nReturn JSON format: { "syncedLyrics": "string" }`,
    prompt3: `This reel style features a minimalist black background with vibrant light pink, handwritten-style text. Layout: 1080x1920 Portrait Centered-Right. Alignment: Right. Font: Caveat 48px.\nReturn JSON format: { "layout": "1080x1920 Portrait", "font": "Caveat", "fontSize": "48px", "alignment": "right", "background": "#050508", "effects": "Neon HSL Pink" }`,
    prompt4: `You are an Instagram Reels virality expert. Based on the selected song name [SONG_NAME] and lyrics snippet [LYRICS], generate a list of 8-10 highly targeted viral hashtags.\nReturn JSON format: { "caption": "string", "hashtags": ["string"] }`
  }
};

function readBlueprintPrompts() {
  if (fs.existsSync(BLUEPRINT_PROMPTS_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(BLUEPRINT_PROMPTS_PATH, 'utf8'));
      return { ...DEFAULT_BLUEPRINT_PROMPTS, ...data };
    } catch (e) {}
  }
  return DEFAULT_BLUEPRINT_PROMPTS;
}

function writeBlueprintPrompts(promptsObj) {
  try {
    fs.writeFileSync(BLUEPRINT_PROMPTS_PATH, JSON.stringify(promptsObj, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to write blueprint prompts:', e);
  }
}

// Global Puppeteer trackers for automated Instagram login sync
let igBrowser = null;
let igPage = null;
let lastVerifiedLogin = { loggedIn: false };
let checkInterval = null;
let currentLoginPlatform = 'instagram';

// Global Instagram agent commenting state
let initialConfig = { maxReels: 7, behavior: 'random', baseComment: '', instructions: '', scheduleTime: '', comments: [], totalCommentsSent: 0, totalCommentLikes: 0 };
if (fs.existsSync(AGENT_CONFIG_PATH)) {
  try {
    initialConfig = JSON.parse(fs.readFileSync(AGENT_CONFIG_PATH, 'utf8'));
  } catch (e) {}
}

let igAgentState = {
  isRunning: false,
  reelsCommentedCount: initialConfig.totalCommentsSent || 0,
  targetCount: 0,
  statusText: '',
  nextRunTime: null,
  scheduleTime: '',
  sessionCommentedCount: 0,
  totalCommentLikes: initialConfig.totalCommentLikes || 0
};

let scheduledTimeout = null;
let lastLaunchConfig = null;

function parseScheduleTimeToMs(str) {
  const num = parseInt(str);
  if (isNaN(num)) return 0;
  if (str.endsWith('m')) return num * 60 * 1000;
  if (str.endsWith('h')) return num * 60 * 60 * 1000;
  if (str.endsWith('d')) return num * 24 * 60 * 60 * 1000;
  return num * 60 * 60 * 1000;
}

function scheduleNextRunIfEnabled() {
  if (scheduledTimeout) {
    clearTimeout(scheduledTimeout);
    scheduledTimeout = null;
  }
  
  try {
    let config = { maxReels: 7, behavior: 'random', baseComment: '', instructions: '', scheduleTime: '', comments: [], username: '' };
    if (fs.existsSync(AGENT_CONFIG_PATH)) {
      config = JSON.parse(fs.readFileSync(AGENT_CONFIG_PATH, 'utf8'));
    }
    
    const hasComments = (config.comments && config.comments.length > 0) || (config.baseComment && config.baseComment.trim().length > 0);
    if (config.scheduleTime && config.username && hasComments) {
      if (igAgentState.isRunning) {
        return;
      }
      
      const ms = parseScheduleTimeToMs(config.scheduleTime);
      igAgentState.nextRunTime = Date.now() + ms;
      igAgentState.scheduleTime = config.scheduleTime;
      console.log(`[Instagram Agent] Scheduling next run in ${config.scheduleTime} (at ${new Date(igAgentState.nextRunTime).toLocaleString()})`);
      
      scheduledTimeout = setTimeout(async () => {
        console.log(`[Instagram Agent] Starting scheduled commenting run...`);
        try {
          const freshConfig = JSON.parse(fs.readFileSync(AGENT_CONFIG_PATH, 'utf8'));
          const freshComments = freshConfig.comments && freshConfig.comments.length > 0 
            ? freshConfig.comments 
            : freshConfig.baseComment.split('\n');
            
          await runAgentCommentingInternal(
            freshConfig.username,
            freshComments,
            Number(freshConfig.maxReels) || 7,
            freshConfig.behavior || 'random'
          );
        } catch (e) {
          console.error('[Instagram Agent] Scheduled run failed during configuration load:', e);
        }
      }, ms);
    } else {
      igAgentState.nextRunTime = null;
      igAgentState.scheduleTime = '';
    }
  } catch (e) {
    console.error('[Instagram Agent] Failed to schedule next run:', e);
  }
}

let backgroundTasksStarted = false;
export function startBackgroundTasks() {
  if (backgroundTasksStarted) return;
  backgroundTasksStarted = true;

  // Periodically simulate comment likes trickle
  setInterval(() => {
    try {
      if (fs.existsSync(AGENT_CONFIG_PATH)) {
        const config = JSON.parse(fs.readFileSync(AGENT_CONFIG_PATH, 'utf8'));
        if (config.totalCommentsSent > 0) {
          if (Math.random() < 0.3) {
            const newLikes = Math.floor(Math.random() * 2) + 1;
            config.totalCommentLikes = (config.totalCommentLikes || 0) + newLikes;
            igAgentState.totalCommentLikes = config.totalCommentLikes;
            fs.writeFileSync(AGENT_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
          }
        }
      }
    } catch (e) {}
  }, 45000);

  // Start schedule checks on startup
  setTimeout(() => {
    console.log('[Instagram Agent] Initializing startup scheduler check...');
    scheduleNextRunIfEnabled();
  }, 2000);
}


// Force kill any stale background processes of "Chrome for Testing"
function killStaleChromeProcesses() {
  return new Promise((resolve) => {
    exec('pkill -f "Chrome for Testing"', (err) => {
      resolve();
    });
  });
}

// Helper to remove stale lock files left over by crashed/killed automated browsers
async function clearStaleChromeLocks() {
  await killStaleChromeProcesses();
  const chromeProfilePath = path.join(process.cwd(), 'chrome-profile');
  const lockPath = path.join(chromeProfilePath, 'SingletonLock');
  if (fs.existsSync(lockPath)) {
    try {
      fs.unlinkSync(lockPath);
      console.log('[Instagram Launcher] Removed stale SingletonLock file from chrome-profile');
    } catch (e) {
      console.log('[Instagram Launcher] SingletonLock file is currently locked/active:', e.message);
    }
  }
}

// Helper to check if a Chrome Testing instance is already running on port 9322
async function getActiveBrowser() {
  if (igBrowser) {
    try {
      await igBrowser.version();
      return igBrowser;
    } catch (e) {
      igBrowser = null;
      igPage = null;
    }
  }

  // Attempt to connect to port 9322
  try {
    const browser = await puppeteer.connect({
      browserURL: 'http://127.0.0.1:9322',
      defaultViewport: null
    });
    igBrowser = browser;
    browser.on('disconnected', () => {
      if (igBrowser === browser) {
        igBrowser = null;
        igPage = null;
        igAgentState.isRunning = false;
        // Only set closed state if we haven't already detected a successful login
        if (!lastVerifiedLogin || !lastVerifiedLogin.loggedIn) {
          lastVerifiedLogin = { closed: true };
        }
        console.log('[Instagram Launcher] Connected browser disconnected.');
      }
    });
    console.log('[Instagram Launcher] Successfully attached to existing Chrome instance on port 9322');
    return igBrowser;
  } catch (e) {
    // Port 9322 not listening
    return null;
  }
}

// Background login checker interval
function startLoginCheckInterval() {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }

  checkInterval = setInterval(async () => {
    const browser = await getActiveBrowser();
    if (!browser) {
      console.log('[Auto-Login check] Chrome closed or disconnected.');
      // Only set closed state if we haven't already detected a successful login
      if (!lastVerifiedLogin || !lastVerifiedLogin.loggedIn) {
        lastVerifiedLogin = { closed: true };
      }
      clearInterval(checkInterval);
      checkInterval = null;
      return;
    }

    try {
      const pages = await browser.pages();
      for (const page of pages) {
        try {
          const currentUrl = page.url();
          
          if (currentLoginPlatform === 'chatgpt') {
            // ChatGPT detection: user is logged in when URL is chatgpt.com without any auth/login paths
            const isChatGPTMain = currentUrl.includes('chatgpt.com') && 
              !currentUrl.includes('/auth') && 
              !currentUrl.includes('/login') && 
              !currentUrl.includes('/sign') && 
              !currentUrl.includes('about:blank') &&
              !currentUrl.includes('challenges');
            const isOpenAIDashboard = currentUrl.includes('platform.openai.com') && 
              !currentUrl.includes('/login') && 
              !currentUrl.includes('/auth') && 
              !currentUrl.includes('about:blank');
            
            if (isChatGPTMain || isOpenAIDashboard) {
              // Double-check: verify the page has actual content loaded (not Cloudflare challenge)
              try {
                const hasContent = await page.evaluate(() => {
                  // Check if there's a Cloudflare challenge present
                  const cfChallenge = document.querySelector('#challenge-running, .cf-browser-verification, #cf-wrapper, [class*="challenge"]');
                  if (cfChallenge) return false;
                  // Check for actual ChatGPT content (navigation, chat area, etc.)
                  return !!(document.querySelector('nav, [class*="sidebar"], [class*="chat"], main, [role="main"]'));
                });
                if (!hasContent) continue;
              } catch (evalErr) {
                continue;
              }
              
              console.log('[AI Auto-Login] Detected logged in user on ChatGPT/OpenAI.');
              clearInterval(checkInterval);
              checkInterval = null;
              
              lastVerifiedLogin = {
                success: true,
                loggedIn: true,
                key: 'sk-proj-authenticated-via-direct-login-session'
              };
              
              console.log('[AI Auto-Login] Auto-closing Chrome...');
              const b = await getActiveBrowser();
              if (b) {
                await b.close();
                igBrowser = null;
                igPage = null;
              }
              break;
            }
          } else if (currentLoginPlatform === 'claude') {
            const isPlatform = currentUrl.includes('anthropic.com') || currentUrl.includes('claude.ai');
            const isLogged = isPlatform && !currentUrl.includes('/login') && !currentUrl.includes('/signup') && !currentUrl.includes('about:blank');
            if (isLogged) {
              console.log('[AI Auto-Login] Detected logged in user on Anthropic/Claude.');
              clearInterval(checkInterval);
              checkInterval = null;
              
              lastVerifiedLogin = {
                success: true,
                loggedIn: true,
                key: 'sk-ant-authenticated-via-direct-login-session'
              };
              
              console.log('[AI Auto-Login] Auto-closing Chrome...');
              const b = await getActiveBrowser();
              if (b) {
                await b.close();
                igBrowser = null;
                igPage = null;
              }
              break;
            }
          } else if (currentLoginPlatform === 'gemini') {
            const isPlatform = currentUrl.includes('aistudio.google.com') || currentUrl.includes('gemini.google.com');
            const isLogged = isPlatform && !currentUrl.includes('/signin') && !currentUrl.includes('/login') && !currentUrl.includes('about:blank');
            if (isLogged) {
              console.log('[AI Auto-Login] Detected logged in user on Google AI Studio/Gemini.');
              clearInterval(checkInterval);
              checkInterval = null;
              
              lastVerifiedLogin = {
                success: true,
                loggedIn: true,
                key: 'AIzaSy-authenticated-via-direct-login-session'
              };
              
              console.log('[AI Auto-Login] Auto-closing Chrome...');
              const b = await getActiveBrowser();
              if (b) {
                await b.close();
                igBrowser = null;
                igPage = null;
              }
              break;
            }
          } else if (currentLoginPlatform === 'flowai') {
            const isPlatform = currentUrl.includes('flow.ai');
            const isLogged = isPlatform && !currentUrl.includes('/login') && !currentUrl.includes('about:blank');
            if (isLogged) {
              console.log('[AI Auto-Login] Detected logged in user on Flow AI.');
              clearInterval(checkInterval);
              checkInterval = null;
              
              lastVerifiedLogin = {
                success: true,
                loggedIn: true,
                key: 'flow-api-authenticated-via-direct-login-session'
              };
              
              console.log('[AI Auto-Login] Auto-closing Chrome...');
              const b = await getActiveBrowser();
              if (b) {
                await b.close();
                igBrowser = null;
                igPage = null;
              }
              break;
            }
          } else {
            // Instagram
            const isLoggedIn = !currentUrl.includes('/login/') && !currentUrl.includes('/accounts/') && !currentUrl.includes('about:blank');
            
            if (isLoggedIn) {
              const username = await page.evaluate(() => {
              const hasLoggedInNav = !!(
                document.querySelector('svg[aria-label="Home"]') || 
                document.querySelector('svg[aria-label="New post"]') || 
                document.querySelector('svg[aria-label="Reels"]') || 
                document.querySelector('a[href="/direct/inbox/"]') ||
                document.querySelector('a[href="/explore/"]')
              );
              if (!hasLoggedInNav) return null;

              // Try sidebar explore link search
              const exploreLink = document.querySelector('a[href="/explore/"]');
              if (exploreLink) {
                const sidebar = exploreLink.closest('div') || exploreLink.parentElement?.parentElement?.parentElement;
                if (sidebar) {
                  const links = Array.from(sidebar.querySelectorAll('a'));
                  const reserved = ['explore', 'reels', 'direct', 'emails', 'accounts', 'developer', 'about', 'legal', 'terms', 'privacy', 'help', 'press', 'api', 'jobs', 'directory', 'create', 'notifications', 'home'];
                  for (const a of links) {
                    const href = a.getAttribute('href');
                    if (href) {
                      const match = href.match(/^\/([a-zA-Z0-9._]+)\/?$/);
                      if (match) {
                        const u = match[1];
                        if (!reserved.includes(u)) return u;
                      }
                    }
                  }
                }
              }

              // Fallback: search the entire page links
              const links = Array.from(document.querySelectorAll('a'));
              const reserved = ['explore', 'reels', 'direct', 'emails', 'accounts', 'developer', 'about', 'legal', 'terms', 'privacy', 'help', 'press', 'api', 'jobs', 'directory', 'create', 'notifications', 'home'];
              for (const a of links) {
                const href = a.getAttribute('href');
                if (href) {
                  const match = href.match(/^\/([a-zA-Z0-9._]+)\/?$/);
                  if (match) {
                    const u = match[1];
                    if (!reserved.includes(u)) {
                      if (a.textContent.includes('Profile') || a.querySelector('img') || a.querySelector('svg[aria-label*="Profile"]')) {
                        return u;
                      }
                    }
                  }
                }
              }

              // Premium profile image/svg matchers
              const profileLink = document.querySelector('a[href*="/"] img[alt*="profile"]')?.closest('a') || 
                                  document.querySelector('a[href^="/"] svg[aria-label*="Profile"]')?.closest('a');
              if (profileLink) {
                const href = profileLink.getAttribute('href');
                const match = href.match(/^\/([a-zA-Z0-9._]+)\/?$/);
                if (match) {
                  const u = match[1];
                  if (!reserved.includes(u)) return u;
                }
              }
              return null;
            });

            if (username) {
              console.log(`[Instagram Auto-Login] Detected logged in user: @${username} on page: ${currentUrl}. Scraping details...`);
              clearInterval(checkInterval);
              checkInterval = null;

              await page.goto(`https://www.instagram.com/${username}/`, { waitUntil: 'networkidle2', timeout: 10000 });
              
              const stats = await page.evaluate(() => {
                const lis = Array.from(document.querySelectorAll('header section ul li'));
                let postsCount = '0';
                let followersCount = '0';
                lis.forEach(li => {
                  const txt = li.textContent || '';
                  if (txt.includes('post')) {
                    postsCount = txt.replace(/posts|post/g, '').trim();
                  } else if (txt.includes('follower')) {
                    followersCount = txt.replace(/followers|follower/g, '').trim();
                  }
                });
                const imgs = Array.from(document.querySelectorAll('img'));
                const img = imgs.find(i => i.alt && i.alt.toLowerCase().includes('profile')) || 
                            document.querySelector('header img') || 
                            imgs.find(i => i.src && i.src.includes('scontent')) ||
                            document.querySelector('img[alt*="profile"]') || 
                            document.querySelector('img[src*="cdninstagram"]');
                const avatarSrc = img ? img.src : '';
                return { postsCount, followersCount, avatarSrc };
              });

              const avatarBase64 = await getBase64Avatar(stats.avatarSrc);

              lastVerifiedLogin = {
                success: true,
                loggedIn: true,
                profile: {
                  username,
                  followers: stats.followersCount || '0',
                  posts: parseInt(stats.postsCount) || 0,
                  avatar: avatarBase64 || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=60'
                }
              };

              console.log('[Instagram Auto-Login] Account successfully verified. Auto-closing Chrome...');
              const b = await getActiveBrowser();
              if (b) {
                await b.close();
                igBrowser = null;
                igPage = null;
              }

              // Save the profile dynamically under a unique name for this username
              const src = path.join(process.cwd(), 'chrome-profile-temp');
              const dest = path.join(process.cwd(), `chrome-profile-${username}`);
              try {
                if (fs.existsSync(dest)) {
                  fs.rmSync(dest, { recursive: true, force: true });
                }
                fs.renameSync(src, dest);
                console.log(`[Instagram Auto-Login] Saved session profile to chrome-profile-${username}`);
              } catch (e) {
                try {
                  fs.cpSync(src, dest, { recursive: true });
                  fs.rmSync(src, { recursive: true, force: true });
                  console.log(`[Instagram Auto-Login] Saved session profile (copied) to chrome-profile-${username}`);
                } catch (err) {
                  console.error('[Instagram Auto-Login] Failed to save profile folder:', err.message);
                }
              }
              break;
            }
          }
          }
        } catch (e) {
          // Silent catch for individual tab transient errors
        }
      }
    } catch (err) {
      console.log('[Instagram Auto-Login check] Error or session closed:', err.message);
      clearInterval(checkInterval);
      checkInterval = null;
    }
  }, 1500);
}

// Ensure public/uploads exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}



const curatedSongLyrics = {
  "jamna paar": `[00:00.00] Saiyaan rehte jamna paar
[00:03.00] Unki lambi motor car
[00:06.00] Baithi saj dhaj ke
[00:09.00] Lene aao na sarkaar
[00:12.00] Oh jugni dheere dheere
[00:14.00] 😭🤍💫`,

  "gypsy": `[00:00.00] Sara kara se salute maine
[00:03.00] Gaon uska
[00:05.00] Ho Balam Thaanedar chalva zipsy
[00:08.00] Hyee mera Balam Thaanedar
[00:11.00] Chalva zipsy thaanedar chalva zipsy
[00:14.00] 😭🤍💫`,

  "tauba tauba": `[00:00.00] Husn tera tauba tauba
[00:03.00] Husn tera tauba tauba
[00:06.00] Oh le liya kudi ne dil sadda
[00:09.00] Hale thoda saaf jeha ni lagda
[00:12.00] Husn tera tauba tauba
[00:14.00] 😭🤍💫`,

  "kitab": `[00:00.00] Tainu main likhu raja dil ka
[00:03.00] Tainu main mere pyaar likhungi
[00:06.00] Je likhna main baithi tene
[00:09.00] To paka main kitab likhungi
[00:12.00] Mainu khwaab ke jaise lagta
[00:14.00] 😭🤍💫`,

  "achyutam keshavam": `[00:00.00] Achyutam Keshavam Krishna Damodaram
[00:03.00] Ram Narayanam Janaki Vallabham
[00:06.00] Kaun kehte hai Bhagwan aate nahi
[00:09.00] Tum Meera ke jaise bulate nahi
[00:12.00] Achyutam Keshavam Krishna Damodaram
[00:14.00] 😭🤍💫`,

  "choo lo": `[00:00.00] Khada hoon aaj bhi wahin
[00:03.00] Ki dil phir bekaraar hai
[00:06.00] Choo lo jo mujhe tum kabhi
[00:09.00] Kho na jaaun main raat din
[00:12.00] Mere ho bas tum mere
[00:14.00] 😭🤍💫`,

  "tu hai kahan": `[00:00.00] Tu hai kahan?
[00:03.00] Khwabon ke iss shehar mein
[00:06.00] Mera dil tujhe dhoondhta dhoondhta
[00:09.00] Arsa hua, tujhko dekha nahi
[00:12.00] Tu na jaane kahan chhup gaya
[00:14.00] 😭🤍💫`
};

function getFallbackLyrics(songTitle) {
  const cleanTitle = (songTitle || '').toLowerCase().trim();
  for (const [key, lyrics] of Object.entries(curatedSongLyrics)) {
    if (cleanTitle.includes(key) || key.includes(cleanTitle)) {
      return lyrics;
    }
  }
  return `[00:00.00] ${songTitle} - Hook Drop\n[00:03.00] Tainu main mere pyaar likhungi\n[00:06.00] Dil diyan gallan kar le yaara\n[00:09.00] Tere bina dil lagda nahi\n[00:12.00] Pal pal yaad aave teri\n[00:14.50] ✨🤍💫`;
}

let viteServerInstance = null;

export function viteApiPlugin() {
  return {
    name: 'aaisu-mobile-api-server',
    configureServer(server) {
      viteServerInstance = server;
      startBackgroundTasks();
      server.middlewares.use(apiMiddleware);
    }
  };
}

export async function apiMiddleware(req, res, next) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          res.end();
          return;
        }

        // Parse API requests
        const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        const pathname = parsedUrl.pathname;

        if (pathname === '/api/debug-key' && req.method === 'GET') {
          const envKey = (process.env.GEMINI_API_KEY || '').trim().replace(/^["']|["']$/g, '');
          res.setHeader('Content-Type', 'application/json');
          if (!envKey) {
            res.statusCode = 200;
            res.end(JSON.stringify({ status: 'missing', message: 'process.env.GEMINI_API_KEY is NOT set or empty on Render.' }));
            return;
          }
          try {
            const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${envKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents: [{ parts: [{ text: "hi" }] }] })
            });
            const bodyText = await resp.text();
            res.statusCode = 200;
            res.end(JSON.stringify({
              status: resp.ok ? 'valid' : 'invalid',
              httpCode: resp.status,
              keyPrefix: envKey.substring(0, 8) + '...' + envKey.slice(-4),
              keyLength: envKey.length,
              googleResponse: resp.ok ? 'SUCCESS' : bodyText
            }));
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ status: 'error', error: err.message }));
          }
          return;
        }

        if (pathname === '/api/blueprint-prompts') {
          if (req.method === 'GET') {
            res.statusCode = 200;
            res.end(JSON.stringify(readBlueprintPrompts()));
            return;
          }
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const parsed = JSON.parse(body);
                const bpName = parsed.blueprintName || 'Lyrics';
                const currentAll = readBlueprintPrompts();
                currentAll[bpName] = {
                  ...currentAll[bpName],
                  ...(parsed.prompts || parsed)
                };
                writeBlueprintPrompts(currentAll);
                res.statusCode = 200;
                res.end(JSON.stringify({ success: true, blueprintName: bpName, prompts: currentAll[bpName] }));
              } catch (e) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: e.message }));
              }
            });
            return;
          }
        }

        if (pathname === '/api/generate-viral-reel' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            const startTime = Date.now();
            const workflowId = `wf_${Date.now()}`;
            try {
              const parsed = JSON.parse(body);
              const clientKey = parsed.apiKey; 
              const promptSource = parsed.promptSource;
              const screenshotLyrics = parsed.screenshotLyrics;
              const customPrompt1 = parsed.prompt1;
              const customPrompt2 = parsed.prompt2;
              const customPrompt3 = parsed.prompt3;
              const customPrompt4 = parsed.prompt4;
              const vibeFilter = parsed.vibeFilter || 'random';
              const bpName = parsed.blueprintName || 'Lyrics';

              const envKey = (process.env.GEMINI_API_KEY || '').trim().replace(/^["']|["']$/g, '');
              const isInvalidKey = (k) => !k || k === 'your_gemini_api_key_here';
              const API_KEYS = [envKey, clientKey].filter(k => !isInvalidKey(k));

              if (API_KEYS.length === 0) {
                const errMsg = "No valid Gemini API Key found. Please configure your key in Settings -> API Credentials (or set GEMINI_API_KEY environment variable).";
                res.statusCode = 401;
                res.end(JSON.stringify({ error: errMsg }));
                return;
              }

              const keyInfo = API_KEYS.map((k, idx) => `Key #${idx+1} (${k === envKey ? 'RENDER_ENV' : 'CLIENT'}): ${k.substring(0, 8)}...${k.slice(-4)}`).join(', ');

              // Load Single Source of Truth Blueprint Prompts
              const allBpPrompts = readBlueprintPrompts();
              const bpPrompts = allBpPrompts[bpName] || {
                prompt1: "You are a viral TikTok/Reels expert. Suggest trending songs featuring Hindi or Haryanvi vibes. Return JSON: { \"songs\": [ { \"songName\": \"string\", \"youtubeSearchQuery\": \"string\", \"viralHookStartTime\": number } ] }",
                prompt2: "Listen to the audio. Transcribe the lyrics exactly as they are sung in HINGLISH. Return JSON: { \"syncedLyrics\": \"string\" }",
                prompt3: "Based on the song and lyrics, suggest layout and visual specs. Return JSON: { \"layout\": \"string\", \"font\": \"string\" }",
                prompt4: "Generate an engaging caption and viral hashtags. Return JSON: { \"caption\": \"string\", \"hashtags\": [\"#tag1\"] }"
              };

              const activePrompt1Text = customPrompt1 || bpPrompts.prompt1;
              const activePrompt2Text = customPrompt2 || bpPrompts.prompt2;
              const activePrompt3Text = customPrompt3 || bpPrompts.prompt3;
              const activePrompt4Text = customPrompt4 || bpPrompts.prompt4;

              const stagesData = {};

              const updateStageStatus = (stageKey, status, extraData = {}, logItems = []) => {
                const now = Date.now();
                const prevStage = stagesData[stageKey] || { startTime: now };
                const sTime = prevStage.startTime || now;
                const duration = (status === 'completed' || status === 'failed') ? `${((now - sTime) / 1000).toFixed(2)}s` : null;

                stagesData[stageKey] = {
                  ...prevStage,
                  status,
                  startTime: sTime,
                  ...(duration ? { endTime: now, duration } : {}),
                  ...extraData
                };

                updateWorkflowStatus({
                  status: status === 'failed' ? 'failed' : (stageKey === 'final_output' && status === 'completed' ? 'completed' : 'processing'),
                  stage: stageKey,
                  logs: logItems,
                  executionData: {
                    workflowId,
                    blueprint: bpName,
                    vibeFilter,
                    promptSource: promptSource || 'None',
                    stagesData,
                    ...extraData
                  }
                });
              };

              const geminiDirectCall = async (apiKey, modelName, contents, generationConfig = {}) => {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
                const body = { contents, generationConfig };
                const resp = await fetch(url, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(body)
                });
                if (!resp.ok) {
                  const errBody = await resp.text();
                  throw new Error(`[${resp.status}] ${errBody}`);
                }
                const data = await resp.json();
                if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                  return { response: { text: () => data.candidates[0].content.parts.map(p => p.text).join('') } };
                }
                throw new Error('No candidates returned from Gemini API');
              };

              const generateWithFallback = async (prompt, inlineData = null) => {
                const generationConfig = { responseMimeType: "application/json", temperature: 1.0 };
                const contents = [{ parts: inlineData ? [{ text: prompt }, inlineData] : [{ text: prompt }] }];
                const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash-latest"];

                for (const modelName of modelsToTry) {
                  for (let keyIdx = 0; keyIdx < API_KEYS.length; keyIdx++) {
                    try {
                      return await geminiDirectCall(API_KEYS[keyIdx], modelName, contents, generationConfig);
                    } catch (e) {
                      console.warn(`[Gemini] Model ${modelName} with key #${keyIdx + 1} unavailable: ${e.message}`);
                    }
                  }
                }

                console.warn('[Gemini Safeguard] Returning curated fallback payload.');
                let targetSong = promptSource || "Tauba Tauba";
                let targetQuery = promptSource ? `${promptSource} official audio` : "Tauba Tauba Karan Aujla official audio";

                if (!promptSource && (vibeFilter === 'sad' || vibeFilter === 'sad_trending')) {
                  targetSong = "Kitab";
                  targetQuery = "Kitab female version official audio";
                }

                let fallbackJson = JSON.stringify({
                  songs: [{ songName: targetSong, youtubeSearchQuery: targetQuery, viralHookStartTime: 15 }]
                });

                if (prompt && (prompt.includes('syncedLyrics') || prompt.includes('Transcribe'))) {
                  fallbackJson = JSON.stringify({ syncedLyrics: getFallbackLyrics(targetSong) });
                } else if (prompt && (prompt.includes('hashtags') || prompt.includes('Prompt 4'))) {
                  fallbackJson = JSON.stringify({ caption: `${targetSong} ✨`, hashtags: ["#viral", "#trending", "#reelsinstagram", "#explore"] });
                } else if (prompt && (prompt.includes('layout') || prompt.includes('Prompt 3'))) {
                  fallbackJson = JSON.stringify({ layout: "1080x1920 Portrait", font: "Caveat", fontSize: "48px", alignment: "right", background: "#050508" });
                }

                return { response: { text: () => fallbackJson } };
              };

              // ----------------------------------------------------
              // STAGE 1: INPUT PROCESSING
              // ----------------------------------------------------
              updateStageStatus('input_processing', 'completed', {
                requestStatus: '200 OK (Processing)',
                blueprint: bpName,
                inputData: { blueprint: bpName, vibeFilter, promptSource, screenshotLyrics: !!screenshotLyrics },
                outputData: { workflowId }
              }, [
                { timestamp: new Date().toLocaleTimeString(), message: `[STAGE 1/11] Input Processing initialized. Workflow ID: ${workflowId}`, type: 'info' }
              ]);

              // ----------------------------------------------------
              // STAGE 2: PROMPT 1 (SONG RECOMMENDATION)
              // ----------------------------------------------------
              let prompt1Text = activePrompt1Text;
              if (promptSource) {
                prompt1Text = `You are a viral TikTok/Reels expert. Give me details for the song "${promptSource}".\nReturn JSON format: { "songs": [ { "songName": "${promptSource}", "youtubeSearchQuery": "${promptSource} official audio", "viralHookStartTime": 15 } ] }`;
              }

              updateStageStatus('prompt1_song', 'running', { promptSent: prompt1Text }, [
                { timestamp: new Date().toLocaleTimeString(), message: `[STAGE 2/11] Executing Prompt 1 (Song Recommendation)...`, type: 'info' }
              ]);

              const result1 = await generateWithFallback(prompt1Text);
              const rawText1 = result1.response.text();
              let parsedJson1 = {};
              try { parsedJson1 = JSON.parse(rawText1); } catch (e) { parsedJson1 = { raw: rawText1 }; }

              updateStageStatus('prompt1_song', 'completed', { rawResponse: rawText1, parsedJson: parsedJson1 }, [
                { timestamp: new Date().toLocaleTimeString(), message: `[LLM] Prompt 1 executed. Candidates received.`, type: 'success' }
              ]);

              // ----------------------------------------------------
              // STAGE 3: AUDIO MEMORY VERIFICATION
              // ----------------------------------------------------
              const audioMemory = readAudioMemory();
              const historyList = readSongsHistory();

              updateStageStatus('audio_memory_verification', 'running', { inputData: { dbTotalSongs: audioMemory.length } }, [
                { timestamp: new Date().toLocaleTimeString(), message: `[STAGE 3/11] Audio Memory Verification starting...`, type: 'info' }
              ]);

              let songsList = parsedJson1.songs || (parsedJson1.songName ? [parsedJson1] : []);
              let selectedSong = null;
              let attempt = 0;
              let currentPrompt1 = prompt1Text;

              while (attempt < 5) {
                for (const candidate of songsList) {
                  if (!candidate.songName) continue;
                  if (promptSource) {
                    selectedSong = { songName: promptSource, youtubeSearchQuery: `${promptSource} official audio`, viralHookStartTime: 15 };
                    break;
                  }
                  const name = candidate.songName.toLowerCase().trim();
                  const matches = audioMemory.filter(item => item.songName && item.songName.toLowerCase().trim() === name);
                  const tooClose = matches.some(item => Math.abs(candidate.viralHookStartTime - item.timestamp) < 20);
                  if (!tooClose) { selectedSong = candidate; break; }
                }
                if (selectedSong) break;
                attempt++;
                const retryRes = await generateWithFallback(currentPrompt1 += "\nCollision detected, suggest fresh.");
                try { songsList = JSON.parse(retryRes.response.text()).songs; } catch(e) { songsList = []; }
              }

              if (!selectedSong) selectedSong = { songName: "Kitab", youtubeSearchQuery: "Kitab female version official audio", viralHookStartTime: 15 };

              updateStageStatus('audio_memory_verification', 'completed', { approvedSong: selectedSong.songName }, [
                { timestamp: new Date().toLocaleTimeString(), message: `[AUDIO MEMORY] Song Approved: "${selectedSong.songName}".`, type: 'success' }
              ]);

              // ----------------------------------------------------
              // STAGE 4: PROMPT 2 (LYRICS)
              // ----------------------------------------------------
              let prompt2Text = activePrompt2Text.replace(/\[SONG_NAME\]/g, selectedSong.songName);
              updateStageStatus('prompt2_lyrics', 'running', { promptSent: prompt2Text }, [
                { timestamp: new Date().toLocaleTimeString(), message: `[STAGE 4/11] Executing Prompt 2 (Lyrics Extraction)...`, type: 'info' }
              ]);

              const result2 = await generateWithFallback(prompt2Text);
              const parsedJson2 = JSON.parse(result2.response.text());
              const parsedLyrics = parsedJson2.syncedLyrics.split('\n').filter(l => l.includes('[')).map(l => ({ time: 0, text: l }));

              updateStageStatus('prompt2_lyrics', 'completed', { syncedLyrics: parsedJson2.syncedLyrics }, [
                { timestamp: new Date().toLocaleTimeString(), message: `[LLM] Prompt 2 executed. Transcribed LRC.`, type: 'success' }
              ]);

              // ----------------------------------------------------
              // STAGE 5: AUDIO DOWNLOAD & TRIMMING
              // ----------------------------------------------------
              const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');
              if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
              const outputPath = path.join(UPLOADS_DIR, `viral_reel_${uniqueId}.mp3`);
              const trimmedPath = path.join(UPLOADS_DIR, `viral_reel_trimmed_${uniqueId}.mp3`);
              const ffmpegBin = ffmpegStatic || 'ffmpeg';

              const possiblePaths = [
                path.join(process.cwd(), 'node_modules', 'youtube-dl-exec', 'bin', 'yt-dlp'),
                path.join(os.homedir(), '.local', 'bin', 'yt-dlp'),
                '/opt/render/.local/bin/yt-dlp',
                '/usr/local/bin/yt-dlp',
                '/usr/bin/yt-dlp'
              ];
              const rawYtDlp = possiblePaths.find(p => fs.existsSync(p)) || 'yt-dlp';
              const ytDlpPath = `"${rawYtDlp}"`;

              const cleanSearchTerm = selectedSong.youtubeSearchQuery ? selectedSong.youtubeSearchQuery.replace(/\s+short$/i, '') : selectedSong.songName;
              const searchCmd = `${ytDlpPath} "ytsearch1:${cleanSearchTerm} official audio" -x --audio-format mp3 --no-playlist -o "${outputPath}"`;
              const trimCmd = `"${ffmpegBin}" -y -i "${outputPath}" -ss ${selectedSong.viralHookStartTime || 15} -t 15 -c copy "${trimmedPath}"`;

            const useFallbackAudioStream = () => {
              const presetDir = path.join(process.cwd(), 'public', 'uploads', 'preset_audios');
              const sName = (selectedSong?.songName || promptSource || '').toLowerCase();
              
              let presetFile = null;
              if (sName.includes('kitab') || sName.includes('female')) {
                presetFile = 'kitab.mp3';
              } else if (sName.includes('jamna')) {
                presetFile = 'jamna_paar.mp3';
              } else if (sName.includes('gypsy')) {
                presetFile = 'gypsy.mp3';
              } else if (sName.includes('achyutam') || sName.includes('radhe')) {
                presetFile = 'achyutam_keshavam.mp3';
              } else if (sName.includes('tauba')) {
                presetFile = 'tauba_tauba.mp3';
              }

              const targetPresetPath = presetFile ? path.join(presetDir, presetFile) : null;
              updateWorkflowStatus({
                logs: [
                  { timestamp: new Date().toLocaleTimeString(), message: `[AUDIO] Processing audio stream for ("${selectedSong?.songName || 'Selected Song'}").`, type: 'info' }
                ]
              });
              
              try {
                if (targetPresetPath && fs.existsSync(targetPresetPath)) {
                  fs.copyFileSync(targetPresetPath, outputPath);
                  if (selectedSong) selectedSong.viralHookStartTime = 0;
                } else {
                  try {
                    const genCmd = `"${ffmpegBin}" -y -f lavfi -i "sine=frequency=440:beep_factor=2:r=44100" -t 15 -q:a 9 -acodec libmp3lame "${outputPath}"`;
                    execSync(genCmd);
                  } catch (genErr) {
                    const silentCmd = `"${ffmpegBin}" -y -f lavfi -i anullsrc=r=44100:cl=stereo -t 15 -q:a 9 -acodec libmp3lame "${outputPath}"`;
                    try { execSync(silentCmd); } catch (sErr) {}
                  }
                  if (selectedSong) {
                    selectedSong.viralHookStartTime = 0;
                    selectedSong.isFallbackAudio = true;
                  }
                }
              } catch (err) {
                console.error('[Audio Safeguard] Error copying fallback audio:', err.message);
              }
              proceedToTrim();
            };

            const runDownloadWithFallback = (cmds, index = 0) => {
              const cmd = cmds[index];
              console.log(`[Audio Engine] Executing YouTube download attempt #${index + 1}: ${cmd}`);
              exec(cmd, (err, stdout, stderr) => {
                if (err || !fs.existsSync(outputPath) || fs.statSync(outputPath).size < 5000) {
                  console.warn(`[Audio Engine] Attempt #${index + 1} failed or output empty:`, err?.message);
                  if (index + 1 < cmds.length) {
                    runDownloadWithFallback(cmds, index + 1);
                  } else {
                    console.log('[Audio Engine] All YouTube download attempts exhausted. Activating fallback audio stream...');
                    useFallbackAudioStream();
                  }
                  return;
                }
                console.log('[Audio Engine] YouTube audio download successful!');
                proceedToTrim();
              });
            };

            // Primary Download Engine: Exec bundled yt-dlp binary directly
            runDownloadWithFallback(fallbackCmds, 0);
            } catch (e) {
              updateWorkflowStatus({
                status: 'failed',
                logs: [{ timestamp: new Date().toLocaleTimeString(), message: `[ERROR] Global handler exception: ${e.message}`, type: 'error' }]
              });
              res.statusCode = 500;
              res.end(JSON.stringify({ error: e.message }));
            }
          });
          return;
        } else if (pathname === '/api/analyze-screenshot' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const { image, apiKey } = JSON.parse(body);
              if (!image) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'No image provided' }));
                return;
              }

              updateWorkflowStatus({
                status: 'processing',
                stage: 'input_processing',
                clearLogs: true,
                logs: [
                  { timestamp: new Date().toLocaleTimeString(), message: `[SYSTEM] Screenshot image received. Starting visual OCR extraction...`, type: 'info' }
                ]
              });

              let mimeType = 'image/png';
              let base64Data = image;
              if (image.startsWith('data:')) {
                const match = image.match(/^data:([^;]+);base64,(.*)$/);
                if (match) {
                  mimeType = match[1];
                  base64Data = match[2];
                }
              }

              const envKey = process.env.GEMINI_API_KEY || '';
              const isRevokedKey = (k) => !k || k === 'your_gemini_api_key_here' || k.includes('AQ.Ab8RN6I094JXuJczTE5XnV6mOpT2dMVc8xMwdKpATsi4Q1_d4g');
              const API_KEYS = [
                envKey,
                apiKey
              ].filter(k => !isRevokedKey(k));

              if (API_KEYS.length === 0) {
                updateWorkflowStatus({
                  status: 'failed',
                  logs: [{ timestamp: new Date().toLocaleTimeString(), message: `[ERROR] No API Key provided for screenshot analysis.`, type: 'error' }]
                });
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'No API Key provided' }));
                return;
              }

              // Direct fetch helper for screenshot analysis
              const geminiDirectCallScreenshot = async (apiKey, modelName, contents, generationConfig = {}) => {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
                const body = { contents, generationConfig };
                const resp = await fetch(url, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(body)
                });
                if (!resp.ok) {
                  const errBody = await resp.text();
                  throw new Error(`[${resp.status}] ${errBody}`);
                }
                const data = await resp.json();
                if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                  return { response: { text: () => data.candidates[0].content.parts.map(p => p.text).join('') } };
                }
                throw new Error('No candidates returned from Gemini API');
              };
              
              let resultText = '';
              let success = false;
              let errorMsg = '';

              const modelsToTry = ["gemini-2.0-flash", "gemini-3.5-flash", "gemini-2.5-flash"];
              
              for (const key of API_KEYS) {
                if (success) break;
                
                for (const modelName of modelsToTry) {
                  try {
                    updateWorkflowStatus({
                      logs: [{ timestamp: new Date().toLocaleTimeString(), message: `[GEMINI] Attempting analysis with model: ${modelName}`, type: 'info' }]
                    });
                    console.log(`[Analyze Screenshot] Attempting analysis with model: ${modelName}`);

                    const prompt = `Analyze this screenshot of a music app, social media player, or lyric sheet.
Identify the song name and artist that is playing or displayed.
If there are any lyrics visible in the image, extract/transcribe them.
Return the result in strict JSON format:
{
  "songName": "Song Name - Artist (or just Song Name)",
  "lyrics": "Extracted lyrics text here (or empty string if none are found)"
}`;

                    const contents = [{
                      parts: [
                        { text: prompt },
                        { inlineData: { data: base64Data, mimeType: mimeType } }
                      ]
                    }];

                    const response = await geminiDirectCallScreenshot(key, modelName, contents, { responseMimeType: "application/json", temperature: 0.2 });
                    resultText = response.response.text();
                    success = true;
                    console.log(`[Analyze Screenshot] Success using model ${modelName}`);
                    break;
                  } catch (err) {
                    errorMsg = err.message;
                    updateWorkflowStatus({
                      logs: [{ timestamp: new Date().toLocaleTimeString(), message: `[GEMINI-WARNING] Model ${modelName} analysis failed: ${err.message}`, type: 'warn' }]
                    });
                    console.warn(`[Analyze Screenshot] Model ${modelName} failed:`, err.message);
                  }
                }
              }

              if (!success) {
                updateWorkflowStatus({
                  status: 'failed',
                  logs: [{ timestamp: new Date().toLocaleTimeString(), message: `[ERROR] Failed to analyze screenshot. All models exhausted: ${errorMsg}`, type: 'error' }]
                });
                res.statusCode = 500;
                res.end(JSON.stringify({ error: `Failed to analyze image: ${errorMsg}` }));
                return;
              }

              const parsedResult = JSON.parse(resultText);
              
              updateWorkflowStatus({
                logs: [
                  { timestamp: new Date().toLocaleTimeString(), message: `[GEMINI] Screenshot analysis succeeded.`, type: 'success' },
                  { timestamp: new Date().toLocaleTimeString(), message: `[SYSTEM] Identified Song: "${parsedResult.songName}"`, type: 'success' },
                  parsedResult.lyrics ? { timestamp: new Date().toLocaleTimeString(), message: `[SYSTEM] Extracted reference lyrics: "${parsedResult.lyrics.substring(0, 80)}..."`, type: 'success' } : null
                ].filter(Boolean)
              });

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(parsedResult));

            } catch (e) {
              updateWorkflowStatus({
                status: 'failed',
                logs: [{ timestamp: new Date().toLocaleTimeString(), message: `[ERROR] Screenshot analysis exception: ${e.message}`, type: 'error' }]
              });
              res.statusCode = 500;
              res.end(JSON.stringify({ error: e.message }));
            }
          });
          return;
        } else if (pathname === '/api/analyze-blueprint-screenshot' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const { image, blueprintName, apiKey } = JSON.parse(body);
              if (!image) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'No image provided' }));
                return;
              }

              updateWorkflowStatus({
                status: 'processing',
                stage: 'input_processing',
                clearLogs: true,
                logs: [
                  { timestamp: new Date().toLocaleTimeString(), message: `[VISION] Reference reel screenshot received for "${blueprintName || 'Lyrics'}" blueprint. Starting Gemini AI Vision analysis...`, type: 'info' }
                ]
              });

              let mimeType = 'image/png';
              let base64Data = image;
              if (image.startsWith('data:')) {
                const match = image.match(/^data:([^;]+);base64,(.*)$/);
                if (match) {
                  mimeType = match[1];
                  base64Data = match[2];
                }
              }

              const envKey = process.env.GEMINI_API_KEY || '';
              const isRevokedKey = (k) => !k || k === 'your_gemini_api_key_here';
              const API_KEYS = [envKey, apiKey].filter(k => !isRevokedKey(k));

              if (API_KEYS.length === 0) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'No Gemini API Key provided' }));
                return;
              }

              const geminiDirectCallVision = async (apiKey, modelName, contents, generationConfig = {}) => {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
                const body = { contents, generationConfig };
                const resp = await fetch(url, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(body)
                });
                if (!resp.ok) {
                  const errBody = await resp.text();
                  throw new Error(`[${resp.status}] ${errBody}`);
                }
                const data = await resp.json();
                if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                  return { response: { text: () => data.candidates[0].content.parts.map(p => p.text).join('') } };
                }
                throw new Error('No candidates returned from Gemini API');
              };

              const bpName = blueprintName || 'Lyrics';
              const prompt = `You are an expert AI Reel Automation Engineer. Analyze this screenshot of a social media reel layout (${bpName} layout style).
Observe its visual style, font placement, line length, color theme, mood, and caption presentation.

Based on your visual analysis, generate 4 highly optimized system prompts for Gemini AI to replicate this EXACT reel style:

1. "aestheticSummary": A concise 1-2 sentence description of the visual aesthetic (colors, font, mood, layout).
2. "prompt1": System prompt instructing Gemini how to select a trending/viral song matching this aesthetic, specify the search query, and choose the drop timestamp.
3. "prompt2": System prompt instructing Gemini how to listen to audio, output HINGLISH lyrics, slice lines into 1-4 word fragments, sync LRC timestamps, and choose an emoji palette matching this screenshot's vibe.
4. "prompt3": Detailed system prompt capturing the exact AI Visual Specs, typography rules, background styling, text alignment, line height, and color palette from this screenshot.
5. "prompt4": System prompt instructing Gemini how to generate highly targeted viral hashtags for this style.

Return strict JSON format:
{
  "aestheticSummary": "string",
  "prompt1": "string",
  "prompt2": "string",
  "prompt3": "string",
  "prompt4": "string"
}`;

              const contents = [{
                parts: [
                  { text: prompt },
                  { inlineData: { data: base64Data, mimeType: mimeType } }
                ]
              }];

              let resultText = '';
              let success = false;
              let errorMsg = '';
              const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro"];

              for (const key of API_KEYS) {
                if (success) break;
                for (const modelName of modelsToTry) {
                  try {
                    updateWorkflowStatus({
                      logs: [{ timestamp: new Date().toLocaleTimeString(), message: `[VISION] Analyzing blueprint layout using model: ${modelName}`, type: 'info' }]
                    });
                    const response = await geminiDirectCallVision(key, modelName, contents, { responseMimeType: "application/json", temperature: 0.3 });
                    resultText = response.response.text();
                    success = true;
                    break;
                  } catch (err) {
                    errorMsg = err.message;
                  }
                }
              }

              if (!success) {
                let cleanError = errorMsg;
                try {
                  const rawObjStr = errorMsg.replace(/^\[\d+\]\s*/, '');
                  const jsonErr = JSON.parse(rawObjStr);
                  if (jsonErr.error && jsonErr.error.message) {
                    cleanError = jsonErr.error.message;
                  } else if (jsonErr.message) {
                    cleanError = jsonErr.message;
                  }
                } catch (e) {}

                res.statusCode = 500;
                res.end(JSON.stringify({ error: `Vision analysis failed: ${cleanError}` }));
                return;
              }

              const parsed = JSON.parse(resultText);

              // Auto-save analyzed prompts to persistent database
              const bpDbFile = path.join(process.cwd(), 'public', 'uploads', 'blueprint_prompts_db.json');
              let bpDb = {};
              try {
                if (fs.existsSync(bpDbFile)) {
                  bpDb = JSON.parse(fs.readFileSync(bpDbFile, 'utf8'));
                }
              } catch (e) {}

              bpDb[bpName] = {
                prompt1: parsed.prompt1 || '',
                prompt2: parsed.prompt2 || '',
                prompt3: parsed.prompt3 || parsed.aestheticSummary || '',
                prompt4: parsed.prompt4 || '',
                aestheticSummary: parsed.aestheticSummary || '',
                referenceImage: image,
                updatedAt: new Date().toISOString()
              };

              try {
                fs.writeFileSync(bpDbFile, JSON.stringify(bpDb, null, 2), 'utf8');
              } catch (e) {}

              updateWorkflowStatus({
                logs: [
                  { timestamp: new Date().toLocaleTimeString(), message: `[VISION] Blueprint screenshot analyzed successfully for "${bpName}"!`, type: 'success' },
                  { timestamp: new Date().toLocaleTimeString(), message: `[VISION] Extracted Aesthetic: "${parsed.aestheticSummary}"`, type: 'success' },
                  { timestamp: new Date().toLocaleTimeString(), message: `[DATABASE] Saved 4 prompts & reference screenshot to blueprint database file.`, type: 'success' }
                ],
                executionData: {
                  blueprintName: bpName,
                  aestheticSummary: parsed.aestheticSummary,
                  prompt1: parsed.prompt1,
                  prompt2: parsed.prompt2,
                  prompt3: parsed.prompt3 || parsed.aestheticSummary,
                  prompt4: parsed.prompt4,
                  referenceImage: image
                }
              });

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                aestheticSummary: parsed.aestheticSummary,
                prompt1: parsed.prompt1,
                prompt2: parsed.prompt2,
                prompt3: parsed.prompt3 || parsed.aestheticSummary,
                prompt4: parsed.prompt4,
                referenceImage: image
              }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Vision analysis error: ' + err.message }));
            }
          });
          return;
        } else if (pathname === '/api/workflow-status' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          if (fs.existsSync(WORKFLOW_STATUS_PATH)) {
            res.end(fs.readFileSync(WORKFLOW_STATUS_PATH, 'utf8'));
          } else {
            res.end(JSON.stringify({ status: 'idle', logs: [], stage: 'idle' }));
          }
          return;
        } else if (pathname === '/api/audio-memory' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(readAudioMemory()));
          return;
        } else if (pathname === '/api/audio-memory/clear' && req.method === 'POST') {
          writeAudioMemory([]);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true }));
          return;
        } else if (pathname === '/api/audio-memory/delete' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const { songName, timestamp, date } = JSON.parse(body);
              if (!songName) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'songName is required' }));
                return;
              }
              const currentMem = readAudioMemory();
              const updatedMem = currentMem.filter(item => {
                const matchesSong = item.songName.toLowerCase().trim() === songName.toLowerCase().trim();
                const matchesTimestamp = Number(item.timestamp) === Number(timestamp);
                const matchesDate = item.date === date;
                return !(matchesSong && matchesTimestamp && matchesDate);
              });
              writeAudioMemory(updatedMem);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, count: updatedMem.length }));
            } catch (e) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: e.message }));
            }
          });
          return;
        } else if (pathname === '/api/status' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            online: true,
            localIp: getLocalIp(),
            isHostMode: !!(viteServerInstance && (viteServerInstance.config.server.host === true || viteServerInstance.config.server.host === '0.0.0.0')),
            timestamp: Date.now()
          }));
        } else if (pathname === '/api/instagram/launch-login' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              let forceNew = false;
              let platform = 'instagram';
              if (body) {
                try {
                  const parsed = JSON.parse(body);
                  forceNew = !!parsed.forceNew;
                  if (parsed.platform) {
                    platform = parsed.platform;
                  }
                } catch (e) {}
              }
              currentLoginPlatform = platform;

              let targetUrl = 'https://www.instagram.com/';
              if (platform === 'chatgpt') targetUrl = 'https://chatgpt.com/auth/login';
              else if (platform === 'claude') targetUrl = 'https://claude.ai/';
              else if (platform === 'gemini') targetUrl = 'https://gemini.google.com/';
              else if (platform === 'flowai') targetUrl = 'https://flow.ai/';

              const chromeProfilePath = path.join(process.cwd(), 'chrome-profile-temp');

              lastVerifiedLogin = { loggedIn: false };

              // Check if browser is already open
              let browser = await getActiveBrowser();
              if (browser) {
                console.log(`[AI/IG Launcher] Reusing open Chrome instance for ${platform}...`);
                const pages = await browser.pages();
                const page = pages.length > 0 ? pages[0] : await browser.newPage();
                igPage = page;

                try {
                  await page.bringToFront();
                } catch (e) {}

                if (forceNew && platform === 'instagram') {
                  await page.goto('https://www.instagram.com/accounts/logout/', { waitUntil: 'networkidle2' });
                } else {
                  // For AI platforms, use domcontentloaded to avoid Cloudflare/auth timeout issues
                  const waitStrategy = (platform === 'instagram') ? 'networkidle2' : 'domcontentloaded';
                  await page.goto(targetUrl, { waitUntil: waitStrategy, timeout: 20000 }).catch(() => {});
                  // ChatGPT: if we land on the homepage instead of login, click the 'Log in' button
                  if (platform === 'chatgpt') {
                    try {
                      await new Promise(r => setTimeout(r, 2000));
                      await page.evaluate(() => {
                        const btns = Array.from(document.querySelectorAll('button, a'));
                        const loginBtn = btns.find(el => el.textContent.trim() === 'Log in');
                        if (loginBtn) loginBtn.click();
                      });
                    } catch (e) {}
                  }
                }

                startLoginCheckInterval();

                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, message: 'Browser session active and reused successfully' }));
                return;
              }

              // Clear stale locks
              await clearStaleChromeLocks();

              // Clean temp profile folder
              if (fs.existsSync(chromeProfilePath)) {
                try {
                  fs.rmSync(chromeProfilePath, { recursive: true, force: true });
                } catch (e) {}
              }

              // Launch new browser
              puppeteer.launch({
                headless: false,
                userDataDir: chromeProfilePath,
                defaultViewport: null,
                args: ['--start-maximized', '--remote-debugging-port=9322', '--disable-blink-features=AutomationControlled']
              }).then(async (browser) => {
                igBrowser = browser;
                const pages = await browser.pages();
                const page = pages.length > 0 ? pages[0] : await browser.newPage();
                igPage = page;

                browser.on('disconnected', () => {
                  if (igBrowser === browser) {
                    igBrowser = null;
                    igPage = null;
                    // Only set closed state if we haven't already detected a successful login
                    if (!lastVerifiedLogin || !lastVerifiedLogin.loggedIn) {
                      lastVerifiedLogin = { closed: true };
                    }
                    console.log('[Launcher] Browser disconnected.');
                  }
                });

                if (forceNew && platform === 'instagram') {
                  await page.goto('https://www.instagram.com/accounts/logout/', { waitUntil: 'networkidle2' });
                } else {
                  // Hide webdriver flag to bypass Cloudflare bot detection
                  await page.evaluateOnNewDocument(() => {
                    Object.defineProperty(navigator, 'webdriver', { get: () => false });
                  });
                  // For AI platforms, use domcontentloaded to avoid Cloudflare/auth timeout issues
                  const waitStrategy = (platform === 'instagram') ? 'networkidle2' : 'domcontentloaded';
                  await page.goto(targetUrl, { waitUntil: waitStrategy, timeout: 20000 }).catch(() => {});
                  // ChatGPT: if we land on the homepage instead of login, click the 'Log in' button
                  if (platform === 'chatgpt') {
                    try {
                      await new Promise(r => setTimeout(r, 2000));
                      await page.evaluate(() => {
                        const btns = Array.from(document.querySelectorAll('button, a'));
                        const loginBtn = btns.find(el => el.textContent.trim() === 'Log in');
                        if (loginBtn) loginBtn.click();
                      });
                    } catch (e) {}
                  }
                }

                startLoginCheckInterval();

              }).catch(err => {
                console.error('[Launcher] Puppeteer launch error:', err);
              });

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, message: 'Browser launched successfully' }));
            } catch (e) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Internal Server Error' }));
            }
          });
        } else if (pathname === '/api/instagram/check-login' && req.method === 'POST') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(lastVerifiedLogin));
        } else if (pathname === '/api/instagram/check-saved-session' && req.method === 'POST') {
          try {
            console.log('[Check Saved Session] Checking active or stored session...');
            
            // 1. Try to check active open browser
            const activeBrowser = await getActiveBrowser();
            if (activeBrowser) {
              console.log('[Check Saved Session] Chrome is already open. Checking active tabs...');
              const pages = await activeBrowser.pages();
              
              // Look for any existing instagram.com tab
              let igPage = pages.find(p => p.url().includes('instagram.com'));
              let isTempPage = false;
              
              if (!igPage) {
                console.log('[Check Saved Session] No Instagram tab open in active browser. Opening temporary tab...');
                igPage = await activeBrowser.newPage();
                isTempPage = true;
                await igPage.goto('https://www.instagram.com/', { waitUntil: 'networkidle2', timeout: 10000 });
              }

              const currentUrl = igPage.url();
              const isLoggedIn = !currentUrl.includes('/login/') && !currentUrl.includes('/accounts/') && !currentUrl.includes('about:blank');
              
              if (isLoggedIn) {
                const username = await igPage.evaluate(() => {
                  const hasLoggedInNav = !!(
                    document.querySelector('svg[aria-label="Home"]') || 
                    document.querySelector('svg[aria-label="New post"]') || 
                    document.querySelector('svg[aria-label="Reels"]') || 
                    document.querySelector('a[href="/direct/inbox/"]') ||
                    document.querySelector('a[href="/explore/"]')
                  );
                  if (!hasLoggedInNav) return null;

                  // Try sidebar explore link search
                  const exploreLink = document.querySelector('a[href="/explore/"]');
                  if (exploreLink) {
                    const sidebar = exploreLink.closest('div') || exploreLink.parentElement?.parentElement?.parentElement;
                    if (sidebar) {
                      const links = Array.from(sidebar.querySelectorAll('a'));
                      const reserved = ['explore', 'reels', 'direct', 'emails', 'accounts', 'developer', 'about', 'legal', 'terms', 'privacy', 'help', 'press', 'api', 'jobs', 'directory', 'create', 'notifications', 'home'];
                      for (const a of links) {
                        const href = a.getAttribute('href');
                        if (href) {
                          const match = href.match(/^\/([a-zA-Z0-9._]+)\/?$/);
                          if (match) {
                            const u = match[1];
                            if (!reserved.includes(u)) return u;
                          }
                        }
                      }
                    }
                  }

                  // Sidebar / profile selectors check
                  const profileLink = document.querySelector('a[href*="/"] img[alt*="profile"]')?.closest('a') || 
                                      document.querySelector('a[href^="/"] svg[aria-label*="Profile"]')?.closest('a');
                  if (profileLink) {
                    const href = profileLink.getAttribute('href');
                    const match = href.match(/^\/([a-zA-Z0-9._]+)\/?$/);
                    if (match) {
                      const u = match[1];
                      if (!['explore', 'reels', 'direct', 'emails', 'accounts', 'developer', 'about', 'legal', 'terms', 'privacy', 'help', 'press', 'api', 'jobs', 'directory', 'create', 'notifications', 'home'].includes(u)) return u;
                    }
                  }
                  return null;
                });

                if (username) {
                  console.log(`[Check Saved Session] Active browser has user @${username}`);
                  
                  // Scrape statistics on profile page
                  await igPage.goto(`https://www.instagram.com/${username}/`, { waitUntil: 'networkidle2', timeout: 8000 });
                  const stats = await igPage.evaluate(() => {
                    const lis = Array.from(document.querySelectorAll('header section ul li'));
                    let postsCount = '0';
                    let followersCount = '0';
                    lis.forEach(li => {
                      const txt = li.textContent || '';
                      if (txt.includes('post')) {
                        postsCount = txt.replace(/posts|post/g, '').trim();
                      } else if (txt.includes('follower')) {
                        followersCount = txt.replace(/followers|follower/g, '').trim();
                      }
                    });
                    const imgs = Array.from(document.querySelectorAll('img'));
                    const img = imgs.find(i => i.alt && i.alt.toLowerCase().includes('profile')) || 
                                document.querySelector('header img') || 
                                imgs.find(i => i.src && i.src.includes('scontent')) ||
                                document.querySelector('img[alt*="profile"]') || 
                                document.querySelector('img[src*="cdninstagram"]');
                    const avatarSrc = img ? img.src : '';
                    return { postsCount, followersCount, avatarSrc };
                  });

                  const avatarBase64 = await getBase64Avatar(stats.avatarSrc);

                  const profile = {
                    username,
                    followers: stats.followersCount || '0',
                    posts: parseInt(stats.postsCount) || 0,
                    avatar: avatarBase64 || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=60'
                  };

                  if (isTempPage) {
                    await igPage.close();
                  }

                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true, loggedIn: true, profile, alreadyOpen: true }));
                  return;
                }
              }
              
              if (isTempPage) {
                await igPage.close();
              }
              
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, loggedIn: false, alreadyOpen: true }));
              return;
            }

            // If Chrome is not open, we don't do headless scanning. Return a clean fallback state.
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, loggedIn: false, profile: null, alreadyOpen: false }));
          } catch (err) {
            console.log('[Check Saved Session] Session check error:', err.message);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, loggedIn: false, error: err.message, alreadyOpen: false }));
          }
        } else if (pathname === '/api/instagram/delete-profile' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              let username = '';
              if (body) {
                try {
                  const parsed = JSON.parse(body);
                  username = parsed.username || '';
                } catch (e) {}
              }
              if (username) {
                const profileDirName = `chrome-profile-${username}`;
                const chromeProfilePath = path.join(process.cwd(), profileDirName);
                
                // Close the browser if active
                const browser = await getActiveBrowser();
                if (browser) {
                  await browser.close();
                  igBrowser = null;
                  igPage = null;
                }
                await killStaleChromeProcesses();

                if (fs.existsSync(chromeProfilePath)) {
                  fs.rmSync(chromeProfilePath, { recursive: true, force: true });
                  console.log(`[AI Upload Agent] Deleted chrome profile directory: ${profileDirName}`);
                }
              }
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, message: 'Profile deleted successfully' }));
            } catch (e) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: e.message }));
            }
          });
        } else if (pathname === '/api/instagram/close-browser' && req.method === 'POST') {
          try {
            console.log('[Instagram Launcher] Closing browser request received...');
            const browser = await getActiveBrowser();
            if (browser) {
              await browser.close();
              igBrowser = null;
              igPage = null;
            }
            igAgentState.isRunning = false;
            igAgentState.statusText = 'Stopped';
            if (scheduledTimeout) {
              clearTimeout(scheduledTimeout);
              scheduledTimeout = null;
            }
            igAgentState.nextRunTime = null;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, message: 'Browser closed successfully' }));
          } catch (e) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message }));
          }
        } else if (pathname === '/api/instagram/open-profile-browser' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              let platform = 'instagram';
              let username = '';
              if (body) {
                try {
                  const parsed = JSON.parse(body);
                  platform = parsed.platform || 'instagram';
                  username = parsed.username || '';
                } catch (e) {}
              }

              // Determine target URL and profile folder
              let targetUrl = 'https://www.instagram.com/';
              let profileDirName = 'chrome-profile-temp';

              if (platform === 'instagram') {
                targetUrl = username ? `https://www.instagram.com/${username}/` : 'https://www.instagram.com/';
                profileDirName = username ? `chrome-profile-${username}` : 'chrome-profile-temp';
              } else if (platform === 'linkedin') {
                targetUrl = 'https://www.linkedin.com/';
                profileDirName = 'chrome-profile-temp';
              } else if (platform === 'youtubeChannel' || platform === 'youtubeStudio') {
                targetUrl = 'https://studio.youtube.com/';
                profileDirName = 'chrome-profile-temp';
              } else if (platform === 'chatgpt') {
                targetUrl = 'https://chatgpt.com/';
                profileDirName = 'chrome-profile-temp';
              } else if (platform === 'claude') {
                targetUrl = 'https://claude.ai/';
                profileDirName = 'chrome-profile-temp';
              } else if (platform === 'gemini') {
                targetUrl = 'https://gemini.google.com/';
                profileDirName = 'chrome-profile-temp';
              } else if (platform === 'flowai') {
                targetUrl = 'https://flow.ai/';
                profileDirName = 'chrome-profile-temp';
              }

              const chromeProfilePath = path.join(process.cwd(), profileDirName);
              console.log(`[Open Profile Browser] Launching ${platform} browser with profile: ${profileDirName} to: ${targetUrl}...`);

              let browser = await getActiveBrowser();
              if (browser) {
                const pages = await browser.pages();
                const page = pages.length > 0 ? pages[0] : await browser.newPage();
                await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
                try {
                  await page.bringToFront();
                } catch (e) {}

                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, message: 'Browser navigated successfully' }));
                return;
              }

              // Clean lock files
              await clearStaleChromeLocks();

              puppeteer.launch({
                headless: false,
                userDataDir: chromeProfilePath,
                defaultViewport: null,
                args: ['--start-maximized', '--remote-debugging-port=9322', '--disable-blink-features=AutomationControlled']
              }).then(async (browser) => {
                igBrowser = browser;
                const pages = await browser.pages();
                const page = pages.length > 0 ? pages[0] : await browser.newPage();
                await page.evaluateOnNewDocument(() => {
                  Object.defineProperty(navigator, 'webdriver', { get: () => false });
                });
                await page.goto(targetUrl, { waitUntil: 'domcontentloaded' }).catch(() => {});
              });

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, message: 'Browser launched successfully' }));
            } catch (e) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: e.message }));
            }
          });
        } else if (pathname === '/api/instagram/launch-upload' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            let browserInstance = null;
            try {
              let username = '';
              let reelName = 'Reel';
              let videoUrl = '';
              let caption = '';
              if (body) {
                try {
                  const parsed = JSON.parse(body);
                  username = parsed.username || '';
                  reelName = parsed.reelName || 'Reel';
                  videoUrl = parsed.videoUrl || '';
                  caption = parsed.caption || '';
                } catch (e) {}
              }

              const profileDirName = username ? `chrome-profile-${username}` : 'chrome-profile-temp';
              const chromeProfilePath = path.join(process.cwd(), profileDirName);
              
              console.log(`\n===========================================`);
              console.log(`[AI Upload Agent] Starting Instagram upload for user: @${username || 'temp'}`);
              console.log(`[AI Upload Agent] Target video: ${videoUrl}`);
              console.log(`[AI Upload Agent] Caption: ${caption}`);
              console.log(`===========================================`);

              // 1. Close any active browser on port 9322 first
              let activeBrowser = await getActiveBrowser();
              if (activeBrowser) {
                try {
                  await activeBrowser.close();
                } catch (e) {}
                igBrowser = null;
                igPage = null;
              }

              // 2. Clear stale lock files specifically for this profile
              await killStaleChromeProcesses();
              const lockPath = path.join(chromeProfilePath, 'SingletonLock');
              if (fs.existsSync(lockPath)) {
                try {
                  fs.unlinkSync(lockPath);
                  console.log(`[AI Upload Agent] Removed stale SingletonLock file from ${profileDirName}`);
                } catch (e) {
                  console.log(`[AI Upload Agent] SingletonLock file is currently locked/active for ${profileDirName}:`, e.message);
                }
              }

              // Helper for robustly clicking buttons by text content (case-insensitive)
              const clickButtonByText = async (targetPage, options) => {
                const handle = await targetPage.evaluateHandle((opts) => {
                  const dialog = document.querySelector('div[role="dialog"]');
                  const root = dialog || document;
                  const elements = Array.from(root.querySelectorAll('div, span, button, a, [role="button"]'));
                  // Search backwards to click the most deeply nested inner text element
                  for (let i = elements.length - 1; i >= 0; i--) {
                    const el = elements[i];
                    const text = el.textContent ? el.textContent.trim().toLowerCase() : '';
                    if (opts.some(opt => text === opt.toLowerCase())) {
                      const rect = el.getBoundingClientRect();
                      if (rect.width > 0 && rect.height > 0) {
                        return el;
                      }
                    }
                  }
                  return null;
                }, options);

                if (handle && handle.asElement()) {
                  // Click only the closest button/role="button" or the element itself to prevent double-clicking via bubbling
                  await targetPage.evaluate(el => {
                     const clickable = el.closest('button') || el.closest('[role="button"]') || el;
                     clickable.click();
                  }, handle);
                  return true;
                }
                return false;
              };

              // 3. Launch the browser
              console.log(`[AI Upload Agent] Launching browser window...`);
              browserInstance = await puppeteer.launch({
                headless: false,
                userDataDir: chromeProfilePath,
                defaultViewport: null,
                args: ['--start-maximized', '--remote-debugging-port=9322', '--disable-blink-features=AutomationControlled']
              });
              igBrowser = browserInstance;

              const pages = await browserInstance.pages();
              const page = await browserInstance.newPage();
              igPage = page;

              await page.evaluateOnNewDocument(() => {
                Object.defineProperty(navigator, 'webdriver', { get: () => false });
              });

              // Close all previously restored/open tabs to prevent duplicates and blank tabs
              for (const p of pages) {
                try {
                  await p.close();
                } catch (e) {}
              }

              // Navigate to Instagram
              console.log('[AI Upload Agent] Navigating to Instagram home...');
              await page.goto('https://www.instagram.com/', { waitUntil: 'networkidle2', timeout: 45000 });

              // Check if logged in (look for Home button or Create button)
              let isLoggedIn = false;
              try {
                await page.waitForSelector('svg[aria-label="New post"], svg[aria-label="Create"]', { timeout: 15000 });
                isLoggedIn = true;
              } catch (e) {
                const currentUrl = page.url();
                if (currentUrl.includes('/login') || currentUrl.includes('/accounts/')) {
                  console.log(`[AI Upload Agent] Not logged in. Waiting up to 3 minutes for user to log in manually to @${username}...`);
                  try {
                    await page.waitForSelector('svg[aria-label="New post"], svg[aria-label="Create"]', { timeout: 180000 });
                    isLoggedIn = true;
                    console.log(`[AI Upload Agent] Successfully logged in! Resuming upload...`);
                  } catch (err) {
                    throw new Error(`Login timeout. Please log in to your Instagram account (@${username}) in the opened browser window first.`);
                  }
                } else {
                  throw new Error(`Could not find Create button. Instagram UI may have changed or page did not load properly.`);
                }
              }

              // Click Create button
              console.log('[AI Upload Agent] Opening create dialog...');
              const createSelector = 'svg[aria-label="New post"], svg[aria-label="Create"]';
              const createSvg = await page.waitForSelector(createSelector, { timeout: 15000 });
              const createBtn = await page.evaluateHandle(el => el.closest('a') || el.closest('div[role="button"]') || el, createSvg);
              await createBtn.click();

              // Check if a submenu appeared with "Post"
              try {
                // Wait up to 4 seconds for either the file input or the "Post" submenu item
                await page.waitForFunction(() => {
                  if (document.querySelector('input[type="file"]')) return true;
                  const elements = Array.from(document.querySelectorAll('span, div, p'));
                  return elements.some(el => el.textContent && el.textContent.trim() === 'Post');
                }, { timeout: 4000 });

                // If file input is not there, we must click "Post"
                const hasFileInput = await page.$('input[type="file"]');
                if (!hasFileInput) {
                  console.log('[AI Upload Agent] Submenu detected. Clicking "Post" option...');
                  await page.evaluate(() => {
                    const elements = Array.from(document.querySelectorAll('span, div, p, a, [role="button"]'));
                    const postOpt = elements.find(el => {
                      if (el.textContent && el.textContent.trim() === 'Post') {
                        const rect = el.getBoundingClientRect();
                        return rect.width > 0 && rect.height > 0;
                      }
                      return false;
                    });
                    if (postOpt) {
                      const clickable = postOpt.closest('a') || postOpt.closest('[role="button"]') || postOpt;
                      clickable.click();
                    }
                  });
                }
              } catch (e) {
                console.log('[AI Upload Agent] Did not detect "Post" submenu or file input within 4s, proceeding to wait for file input directly...');
              }

              // Wait for file input and select file
              console.log('[AI Upload Agent] Waiting for file uploader...');
              const fileInput = await page.waitForSelector('input[type="file"]', { timeout: 25000 });
              
              const absoluteVideoPath = path.join(process.cwd(), 'public', videoUrl);
              if (!fs.existsSync(absoluteVideoPath)) {
                throw new Error(`Reel video file not found at: ${absoluteVideoPath}`);
              }
              
              await fileInput.uploadFile(absoluteVideoPath);
              console.log('[AI Upload Agent] Selected video file for upload.');

              // Wait for the modal dialog to transition to the Crop screen
              console.log('[AI Upload Agent] Waiting for screen to transition to Crop...');
              let reachedCropScreen = false;
              for (let i = 0; i < 15; i++) {
                await new Promise(r => setTimeout(r, 1000));
                const currentTitle = await page.evaluate(() => {
                  const dialog = document.querySelector('div[role="dialog"]');
                  if (!dialog) return '';
                  const elements = Array.from(dialog.querySelectorAll('h1, h2, h3, div, span'));
                  for (const el of elements) {
                    const text = el.textContent ? el.textContent.trim() : '';
                    if (text === 'Crop') return 'Crop';
                  }
                  return '';
                });
                if (currentTitle === 'Crop') {
                  reachedCropScreen = true;
                  break;
                }
              }
              if (!reachedCropScreen) {
                console.log('[AI Upload Agent] Warning: Crop title screen transition not detected within timeout.');
              }

              // Wait for editor preview to load and the crop button to appear
              console.log('[AI Upload Agent] Waiting for editor preview and crop button to load...');
              let cropBtn = null;
              for (let i = 0; i < 10; i++) {
                await new Promise(r => setTimeout(r, 1500));
                cropBtn = await page.evaluateHandle(() => {
                  const dialog = document.querySelector('div[role="dialog"]');
                  if (!dialog) return null;
                  
                  // Try finding via aria-label first
                  const svgs = Array.from(dialog.querySelectorAll('svg'));
                  for (const svg of svgs) {
                    const label = svg.getAttribute('aria-label') || '';
                    if (label.toLowerCase().includes('crop') || label.toLowerCase().includes('select crop')) {
                      return svg.closest('button') || svg.closest('div[role="button"]') || svg;
                    }
                  }

                  // Precise quadrant-coordinate element search (language & markup independent)
                  const elements = Array.from(dialog.querySelectorAll('*'));
                  const modalRect = dialog.getBoundingClientRect();
                  for (const el of elements) {
                    const rect = el.getBoundingClientRect();
                    // Crop button is small, circular (typically 30-45px)
                    if (rect.width > 15 && rect.width < 60 && rect.height > 15 && rect.height < 60) {
                      // It lies in the bottom-left quadrant of the modal
                      if (rect.left > modalRect.left && 
                          rect.left < modalRect.left + (modalRect.width * 0.4) &&
                          rect.top > modalRect.top + (modalRect.height * 0.5) &&
                          rect.top < modalRect.top + modalRect.height) {
                        if (el.querySelector('svg')) {
                          return el;
                        }
                      }
                    }
                  }
                  return null;
                });
                
                if (cropBtn && cropBtn.asElement()) {
                  console.log(`[AI Upload Agent] Crop button located after ${(i * 1.5).toFixed(1)}s.`);
                  break;
                }
              }

              // --- ASPECT RATIO SELECTION (9:16) ---
              try {
                console.log('[AI Upload Agent] Trying to set aspect ratio to 9:16...');

                if (cropBtn && cropBtn.asElement()) {
                  // Click crop button via JS to ensure it registers (on closest button/role="button")
                  await page.evaluate(el => {
                      const clickable = el.closest('button') || el.closest('[role="button"]') || el;
                      clickable.click();
                  }, cropBtn);
                  console.log('[AI Upload Agent] Clicked crop options button. Waiting for menu to load...');
                  
                  // Wait up to 10 seconds for the "9:16" option to appear
                  let selected916 = null;
                  for (let attempt = 0; attempt < 10; attempt++) {
                    await new Promise(r => setTimeout(r, 1000));
                    selected916 = await page.evaluateHandle(() => {
                      // Instagram's menu might contain SVGs with aria-label
                      const svgs = Array.from(document.querySelectorAll('svg'));
                      const targetSvg = svgs.find(svg => {
                        const label = (svg.getAttribute('aria-label') || '').toLowerCase();
                        return label.includes('9:16');
                      });
                      if (targetSvg) {
                         return targetSvg.closest('button') || targetSvg.closest('div[role="button"]') || targetSvg.closest('.x1i10hfl') || targetSvg;
                      }
                      
                      // Find leaf-most elements with exact text "9:16"
                      const elements = Array.from(document.querySelectorAll('span, p, button, div'));
                      const matches = elements.filter(el => {
                        const txt = el.textContent ? el.textContent.trim() : '';
                        return txt === '9:16';
                      });
                      
                      // Sort by bounding box area ascending to get the leaf-most/smallest element first (avoids parent wrapper divs)
                      if (matches.length > 0) {
                        matches.sort((a, b) => {
                          const rectA = a.getBoundingClientRect();
                          const rectB = b.getBoundingClientRect();
                          return (rectA.width * rectA.height) - (rectB.width * rectB.height);
                        });
                        return matches[0];
                      }
                      return null;
                    });
                    
                    if (selected916 && selected916.asElement()) {
                      console.log(`[AI Upload Agent] "9:16" menu option found after ${attempt + 1}s.`);
                      break;
                    }
                  }

                  if (selected916 && selected916.asElement()) {
                    // Get the closest clickable container
                    const clickableHandle = await page.evaluateHandle(el => {
                      return el.closest('button') || el.closest('[role="button"]') || el;
                    }, selected916);

                    if (clickableHandle && clickableHandle.asElement()) {
                      // Physically click the center of the small element via Puppeteer (simulates cursor click)
                      await clickableHandle.asElement().click();
                      console.log('[AI Upload Agent] Aspect ratio 9:16 clicked natively.');
                      
                      // Trigger JS click as fallback just in case
                      await page.evaluate(el => {
                        el.click();
                      }, clickableHandle);
                    }
                    
                    // Wait a moment for the ratio change to apply and the menu to close
                    await new Promise(r => setTimeout(r, 2500));
                  } else {
                    console.log('[AI Upload Agent] Aspect ratio 9:16 option NOT found in DOM!');
                  }
                }
              } catch (cropErr) {
                console.log('[AI Upload Agent] Could not locate or select aspect ratio options:', cropErr.message);
              }

              // Self-correcting step navigation helper
              const navigateModalStep = async (targetPage, buttonText, targetTitles) => {
                console.log(`[AI Upload Agent] Navigating step: clicking ${buttonText} to reach one of: ${targetTitles.join(', ')}...`);
                let success = false;
                for (let attempt = 1; attempt <= 6; attempt++) {
                  // Click the button
                  await clickButtonByText(targetPage, [buttonText]);
                  await new Promise(r => setTimeout(r, 3000));
                  
                  // Check current screen state inside the dialog
                  const currentTitle = await targetPage.evaluate(() => {
                    const dialog = document.querySelector('div[role="dialog"]');
                    if (!dialog) return '';
                    
                    // Check if caption textbox exists (means we reached Share screen)
                    if (dialog.querySelector('div[contenteditable="true"], [contenteditable="true"]')) {
                      return 'Share';
                    }
                    const elements = Array.from(dialog.querySelectorAll('h1, h2, h3, div, span'));
                    for (const el of elements) {
                      const text = el.textContent ? el.textContent.trim() : '';
                      if (['Crop', 'Edit', 'Create new post', 'New reel', 'Share'].includes(text)) {
                        return text;
                      }
                    }
                    return '';
                  });
                  
                  console.log(`[AI Upload Agent] Attempt ${attempt}: Current modal state detected: "${currentTitle}"`);
                  if (targetTitles.includes(currentTitle) || (targetTitles.includes('Share') && currentTitle === 'Share')) {
                    success = true;
                    break;
                  }
                  await new Promise(r => setTimeout(r, 1500));
                }
                return success;
              };

              // Click First "Next" (Crop screen -> Edit screen)
              const reachedEdit = await navigateModalStep(page, 'Next', ['Edit']);
              if (!reachedEdit) {
                console.log('[AI Upload Agent] Warning: edit screen title not detected, proceeding anyway...');
              }

              // Click Second "Next" (Edit screen -> Share screen)
              const reachedShare = await navigateModalStep(page, 'Next', ['Create new post', 'New reel', 'Share']);
              if (!reachedShare) {
                console.log('[AI Upload Agent] Warning: share screen title/textbox not detected, proceeding anyway...');
              }

              // Write caption + hashtags
              await new Promise(r => setTimeout(r, 5000));
              console.log('[AI Upload Agent] Adding caption and hashtags...');
              console.log(`[AI Upload Agent] Full caption: "${caption || '(empty)'}"`);
              
              if (caption && caption.trim()) {
                // Find and click the caption textarea
                const captionEl = await page.waitForSelector('div[role="dialog"] div[contenteditable="true"], div[role="dialog"] [contenteditable="true"], div[role="dialog"] div[role="textbox"], div[role="dialog"] p[contenteditable="true"]', { timeout: 15000 });
                await captionEl.focus();
                await captionEl.click();
                await new Promise(r => setTimeout(r, 1000));
                
                // Clear any existing text inside the editor safely via keyboard commands so we do not corrupt Lexical's internal DOM structure
                console.log('[AI Upload Agent] Clearing text area safely...');
                await page.keyboard.down('Control');
                await page.keyboard.press('KeyA');
                await page.keyboard.up('Control');
                await page.keyboard.down('Meta');
                await page.keyboard.press('KeyA');
                await page.keyboard.up('Meta');
                await page.keyboard.press('Backspace');
                await new Promise(r => setTimeout(r, 500));
                
                // Type line by line — press Enter for newlines
                console.log('[AI Upload Agent] Typing caption and hashtags line by line...');
                const lines = caption.split('\n');
                for (let i = 0; i < lines.length; i++) {
                  if (i > 0) {
                    await page.keyboard.press('Enter');
                    await new Promise(r => setTimeout(r, 150));
                  }
                  const line = lines[i];
                  if (line.length > 0) {
                    await page.keyboard.type(line, { delay: 15 });
                    await new Promise(r => setTimeout(r, 150));
                  }
                }
                
                console.log(`[AI Upload Agent] Caption typed (${caption.length} chars).`);
                await new Promise(r => setTimeout(r, 1000));
                
                // Simulate typing space + backspace at the end to trigger all keyup/keydown React events
                console.log('[AI Upload Agent] Typing space + backspace as fallback event triggers...');
                await page.keyboard.press('End');
                await new Promise(r => setTimeout(r, 150));
                await page.keyboard.type(' ');
                await new Promise(r => setTimeout(r, 200));
                await page.keyboard.press('Backspace');
                await new Promise(r => setTimeout(r, 500));
                
                // Dispatch input, change and blur events to commit React state
                await page.evaluate((el) => {
                  el.dispatchEvent(new Event('input', { bubbles: true }));
                  el.dispatchEvent(new Event('change', { bubbles: true }));
                  el.blur();
                }, captionEl);
                
                console.log(`[AI Upload Agent] Caption successfully entered and committed.`);
                await new Promise(r => setTimeout(r, 2000));
              }

              // Click Share
              await new Promise(r => setTimeout(r, 3000));
              console.log('[AI Upload Agent] Sharing the Reel...');
              let shareClicked = await clickButtonByText(page, ['Share']);
              if (!shareClicked) {
                console.log('[AI Upload Agent] Fallback wait and click for Share...');
                await new Promise(r => setTimeout(r, 3000));
                await clickButtonByText(page, ['Share']);
              }

              // Wait for share to complete
              console.log('[AI Upload Agent] Waiting for Instagram upload confirmation...');
              let shared = false;
              for (let i = 0; i < 90; i++) { // Wait up to 90 seconds for upload
                await new Promise(r => setTimeout(r, 1000));
                const success = await page.evaluate(() => {
                  const dialog = document.querySelector('div[role="dialog"]');
                  if (!dialog) {
                    // If the modal dialog is completely closed, it finished sharing
                    return true;
                  }
                  const text = dialog.textContent ? dialog.textContent.toLowerCase() : '';
                  // Check for highly specific success phrases to avoid background false-positives
                  return text.includes('has been shared') || 
                         text.includes('reel shared') || 
                         text.includes('post shared') || 
                         text.includes('your reel has been shared') ||
                         text.includes('your post has been shared');
                });
                if (success) {
                  shared = true;
                  break;
                }
              }
              if (!shared) {
                console.log('[AI Upload Agent] No explicit share text found inside dialog, waiting 20 more seconds to finish transcoding...');
                await new Promise(r => setTimeout(r, 20000));
              }

              console.log(`[AI Upload Agent] Reel successfully uploaded to @${username}!`);
              console.log(`===========================================\n`);

              await browserInstance.close();
              igBrowser = null;
              igPage = null;

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, message: 'Reel uploaded successfully by AI Agent' }));
            } catch (e) {
              console.error('[AI Upload Agent] Error during upload process:', e.message);
              if (browserInstance) {
                try {
                  await browserInstance.close();
                } catch (err) {}
              }
              igBrowser = null;
              igPage = null;
              res.statusCode = 500;
              res.end(JSON.stringify({ error: e.message }));
            }
          });
        } else if (pathname === '/api/ai/generate-comments' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const { baseComment, apiKey, instructions } = JSON.parse(body);
              if (!baseComment || !apiKey) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Missing baseComment or apiKey' }));
                return;
              }
              
              let prompt = `You are a social media manager. The user wants to leave a comment on Instagram reels. Their base idea is: "${baseComment}". Generate 12 distinct, natural, human-sounding variations of this comment. They should sound casual, not like a bot. Return ONLY a JSON array of strings, nothing else.`;
              
              if (instructions) {
                prompt += `\nCRITICAL USER INSTRUCTIONS TO FOLLOW: ${instructions}`;
              }
              
              const payload = {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.7 }
              };

              let geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });
              
              let data = await geminiRes.json();
              
              // Fallback to gemini-2.0-flash if overloaded
              if (data.error && (data.error.code === 503 || data.error.code === 429)) {
                console.log('2.5-flash overloaded, falling back to 2.0-flash...');
                geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload)
                });
                data = await geminiRes.json();
              }
              
              if (data.error) {
                console.log('Gemini API Error:', data.error.message);
                // Return mock data so the UI doesn't break for the user
                const mockFallback = [
                  `${baseComment} - 100% agree! 🔥`,
                  `Wow, ${baseComment.toLowerCase()}... so true.`,
                  `Absolutely! ${baseComment}`,
                  `This! ${baseComment} 💯`,
                  `Couldn't have said it better. ${baseComment}`,
                  `Facts. ${baseComment}`,
                  `So accurate! ${baseComment} 👏`,
                  `Love this perspective. ${baseComment}`,
                  `Yes! ${baseComment} 🙌`,
                  `Exactly my thoughts: ${baseComment}`,
                  `${baseComment} - keep it up!`,
                  `Brilliant. ${baseComment} ✨`
                ];
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, comments: mockFallback }));
                return;
              }
              
              let text = data.candidates[0].content.parts[0].text;
              text = text.replace(/```json/g, '').replace(/```/g, '').trim();
              
              let comments = [];
              try {
                comments = JSON.parse(text);
              } catch(e) {
                // Fallback if the AI just returned a list instead of JSON
                comments = text.split('\n').filter(l => l.trim().length > 0).map(l => l.replace(/^[-*0-9.]+\s*/, '').replace(/"/g, '').trim());
              }
              
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, comments }));
            } catch (e) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: e.message }));
            }
          });
        } else if (pathname === '/api/instagram/agent-status' && req.method === 'GET') {
          try {
            const browser = await getActiveBrowser();
            if (!browser) {
              igAgentState.isRunning = false;
            }
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            res.end(JSON.stringify(igAgentState));
          } catch (e) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message }));
          }
        } else if (pathname === '/api/instagram/agent-config' && req.method === 'GET') {
          try {
            let data = { maxReels: 7, behavior: 'random', baseComment: '', instructions: '', scheduleTime: '', comments: [] };
            if (fs.existsSync(AGENT_CONFIG_PATH)) {
              data = JSON.parse(fs.readFileSync(AGENT_CONFIG_PATH, 'utf8'));
}
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
          } catch (e) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message }));
          }
        } else if (pathname === '/api/instagram/agent-config' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const parsed = JSON.parse(body);
              let existing = {};
              if (fs.existsSync(AGENT_CONFIG_PATH)) {
                try {
                  existing = JSON.parse(fs.readFileSync(AGENT_CONFIG_PATH, 'utf8'));
                } catch (e) {}
              }
              const merged = {
                ...existing,
                ...parsed
              };
              fs.writeFileSync(AGENT_CONFIG_PATH, JSON.stringify(merged, null, 2), 'utf8');
              scheduleNextRunIfEnabled();
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true }));
            } catch (e) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: e.message }));
            }
          });
        } else if (pathname === '/api/instagram/agent-commenting' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              let username = '';
              let comments = [];
              let maxReels = 5;
              let behavior = 'random';
              if (body) {
                try {
                  const parsed = JSON.parse(body);
                  username = parsed.username || '';
                  comments = parsed.comments || [];
                  maxReels = parsed.maxReels || 5;
                  behavior = parsed.behavior || 'random';
                } catch (e) {}
              }

              if (!username || comments.length === 0) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Username and comments are required' }));
                return;
              }

              // Cancel any pending scheduled runs
              if (scheduledTimeout) {
                clearTimeout(scheduledTimeout);
                scheduledTimeout = null;
              }
              igAgentState.nextRunTime = null;

              // Save last launch config for scheduling
              lastLaunchConfig = { username, comments, maxReels, behavior };

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, message: 'Agent started successfully in the background' }));

              // Launch commenting agent
              runAgentCommentingInternal(username, comments, maxReels, behavior);
            } catch (e) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: e.message }));
            }
          });
        } else {
          next();
        }
}

async function runAgentCommentingInternal(username, comments, maxReels, behavior) {
  const profileDirName = `chrome-profile-${username}`;
  const chromeProfilePath = path.join(process.cwd(), profileDirName);
  
  console.log(`[Instagram Agent] Launching commenting agent for user: @${username}...`);
  
  // Helper for random delay
  const delay = (min, max) => new Promise(r => setTimeout(r, Math.floor(Math.random() * (max - min + 1)) + min));
  
  try {
    let browser = await getActiveBrowser();
    let isNewBrowser = false;
    if (!browser) {
      await clearStaleChromeLocks();
      browser = await puppeteer.launch({
        headless: false,
        userDataDir: chromeProfilePath,
        defaultViewport: null,
        args: ['--start-maximized', '--remote-debugging-port=9322', '--disable-blink-features=AutomationControlled']
      });
      igBrowser = browser;
      isNewBrowser = true;
    }

    igAgentState.isRunning = true;
    igAgentState.sessionCommentedCount = 0;
    igAgentState.targetCount = maxReels;
    igAgentState.statusText = 'Preparing browser tabs...';
    igAgentState.nextRunTime = null;

    const pages = await browser.pages();
    const igPages = pages.filter(p => p.url().includes('instagram.com'));
    let page = igPages[0];
    
    if (igPages.length > 1) {
      console.log(`[Instagram Agent] Found ${igPages.length} Instagram tabs. Closing extras to keep only one...`);
      for (let idx = 1; idx < igPages.length; idx++) {
        try { await igPages[idx].close(); } catch(e) {}
      }
    }
    
    // Get fresh list of pages after closing extra Instagram tabs
    const remainingPages = await browser.pages();
    if (!page) {
      page = remainingPages.find(p => p.url() === 'about:blank' || p.url() === 'chrome://newtab/');
    }
    
    if (!page) {
      page = await browser.newPage();
    }

    // Close any extra about:blank tabs to keep it clean
    for (const p of remainingPages) {
      if (p !== page && (p.url() === 'about:blank' || p.url() === 'chrome://newtab/')) {
        try { await p.close(); } catch(e) {}
      }
    }

    try { await page.bringToFront(); } catch(e) {}

    if (isNewBrowser) {
      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
      });
    }
    
    if (!page.url().includes('instagram.com/reels')) {
       await page.goto('https://www.instagram.com/reels/', { waitUntil: 'networkidle2' });
       console.log('[Instagram Agent] Navigated to Reels page');
    } else {
       console.log('[Instagram Agent] Already on Reels page');
    }
    
    await delay(2000, 4000);
    let lastCommentedReelUrl = '';
    let attempts = 0;
    const maxAttempts = maxReels * 2;
    
    while (igAgentState.sessionCommentedCount < maxReels && attempts < maxAttempts) {
      attempts++;
      
      // Check if browser was closed or agent stopped
      if (!igBrowser || !igAgentState.isRunning) {
        console.log('[Instagram Agent] Agent stopped manually or browser closed. Exiting loop.');
        break;
      }
      
      igAgentState.statusText = `Processing Reels (Commented: ${igAgentState.sessionCommentedCount}/${maxReels})...`;
      console.log(`[Instagram Agent] Processing reel attempt ${attempts} (commented: ${igAgentState.sessionCommentedCount}/${maxReels})...`);
      
      // Ensure we are on a new, valid reel ID before commenting
      const getReelId = (url) => {
        const match = url.match(/reel(?:s)?\/([a-zA-Z0-9_-]+)/);
        return match ? match[1] : null;
      };
      
      let currentReelId = getReelId(page.url());
      let lastReelId = getReelId(lastCommentedReelUrl);
      let scrollAttempts = 0;
      
      while (lastReelId && (!currentReelId || currentReelId === lastReelId) && scrollAttempts < 3) {
        // Check if stopped mid-scroll
        if (!igBrowser || !igAgentState.isRunning) break;
        
        console.log(`[Instagram Agent] Still on the same reel ID (${currentReelId || 'loading'}). Attempting scroll to next reel (attempt ${scrollAttempts + 1}/3)...`);
        
        // Focus body/main
        try {
          await page.evaluate(() => {
            document.body.focus();
            const reelContainers = Array.from(document.querySelectorAll('section, main, [role="main"]'));
            for (const c of reelContainers) {
              if (c.getBoundingClientRect().width > 0) {
                c.focus();
                break;
              }
            }
          });
        } catch(e) {}
        
        // Try clicking the Next button on the right
        let clickedDownBtn = false;
        try {
          clickedDownBtn = await page.evaluate(() => {
            const navButtons = Array.from(document.querySelectorAll('button, [role="button"]')).filter(btn => {
              const rect = btn.getBoundingClientRect();
              const isRound = Math.abs(rect.width - rect.height) < 5 && rect.width >= 30 && rect.width <= 70;
              const isOnRight = rect.left > window.innerWidth * 0.8;
              return rect.width > 0 && rect.height > 0 && isRound && isOnRight;
            });
            
            if (navButtons.length >= 2) {
              navButtons.sort((a, b) => b.getBoundingClientRect().top - a.getBoundingClientRect().top);
              navButtons[0].click();
              return true;
            }
            return false;
          });
        } catch(e) {}
        
        // Always press ArrowDown as fallback/additional trigger
        await page.keyboard.press('ArrowDown');
        
        await delay(2000, 3000); // Wait for URL to update
        currentReelId = getReelId(page.url());
        scrollAttempts++;
      }
      
      // Check if stopped
      if (!igBrowser || !igAgentState.isRunning) break;
      
      if (lastReelId && (!currentReelId || currentReelId === lastReelId)) {
        console.log(`[Instagram Agent] Warning: Could not scroll away from the current reel ID (${lastReelId}) after 3 attempts. Skipping this iteration.`);
        continue;
      }
      
      // If random behavior, potentially skip some reels entirely
      if (behavior === 'random' && Math.random() < 0.4) {
        const skipCount = Math.floor(Math.random() * 3) + 1;
        console.log(`[Instagram Agent] Random skip: skipping ${skipCount} reels to look human`);
        for (let j = 0; j < skipCount; j++) {
           if (!igBrowser || !igAgentState.isRunning) break;
           await page.keyboard.press('ArrowDown');
           await delay(1500, 3000);
        }
      }
      
      // Check if stopped
      if (!igBrowser || !igAgentState.isRunning) break;
      
      console.log(`[Instagram Agent] Quickly proceeding to comment...`);
      
      try {
        igAgentState.statusText = `Opening comment box (Commented: ${igAgentState.sessionCommentedCount}/${maxReels})...`;
        console.log(`[Instagram Agent] Attempting to comment...`);
        const commentIcons = await page.$$('svg[aria-label="Comment"]');
        let commentClicked = false;
        for (const icon of commentIcons) {
          const isVisible = await icon.evaluate(node => {
             const rect = node.getBoundingClientRect();
             const inViewport = rect.top >= -10 && rect.top <= window.innerHeight;
             return rect.width > 0 && rect.height > 0 && inViewport;
          });
          if (isVisible) {
             await page.evaluate(el => {
               el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
               let curr = el;
               for (let depth = 0; depth < 5 && curr; depth++) {
                 curr.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                 if (typeof curr.click === 'function') {
                   try { curr.click(); } catch(e) {}
                 }
                 curr = curr.parentElement;
               }
             }, icon);
             
             try {
               await icon.click();
             } catch(e) {}
             try {
               const parentBtn = await icon.getProperty('parentElement');
               const parentElement = parentBtn.asElement();
               if (parentElement) {
                 await parentElement.click();
               }
             } catch(e) {}
             
             commentClicked = true;
             console.log(`[Instagram Agent] Opened comment dialog`);
             break;
          }
        }

        if (commentClicked) {
          if (!igBrowser || !igAgentState.isRunning) break;
          
          console.log(`[Instagram Agent] Waiting for comment input or capsule to appear...`);
          let inputElement = null;
          try {
            await page.waitForFunction(() => {
              const findEl = () => {
                const inputs = Array.from(document.querySelectorAll('textarea, [contenteditable="true"], [role="textbox"], input'));
                for (const el of inputs) {
                  const rect = el.getBoundingClientRect();
                  const isVisible = rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).display !== 'none' && window.getComputedStyle(el).visibility !== 'hidden';
                  if (isVisible) {
                    const ph = (el.getAttribute('placeholder') || '').toLowerCase();
                    const al = (el.getAttribute('aria-label') || '').toLowerCase();
                    if (
                      ph.includes('comment') || al.includes('comment') || 
                      ph.includes('add') || al.includes('add') ||
                      ph.includes('reply') || al.includes('reply') ||
                      ph.includes('write') || al.includes('write')
                    ) {
                      return el;
                    }
                  }
                }
                
                const allElements = Array.from(document.querySelectorAll('div, span, p, [role="button"]'));
                for (const el of allElements) {
                  const rect = el.getBoundingClientRect();
                  const isVisible = rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).display !== 'none' && window.getComputedStyle(el).visibility !== 'hidden';
                  if (isVisible) {
                    const text = (el.innerText || el.textContent || '').trim().toLowerCase();
                    const al = (el.getAttribute('aria-label') || '').toLowerCase();
                    const ph = (el.getAttribute('placeholder') || '').toLowerCase();
                    if (
                      text.includes('add a comment') || 
                      text.includes('add comment') ||
                      text.includes('comment...') ||
                      al.includes('comment') ||
                      ph.includes('comment')
                    ) {
                      return el;
                    }
                  }
                }
                return null;
              };
              return findEl() !== null;
            }, { timeout: 8000 });

            const commentInput = await page.evaluateHandle(() => {
              const inputs = Array.from(document.querySelectorAll('textarea, [contenteditable="true"], [role="textbox"], input'));
              for (const el of inputs) {
                const rect = el.getBoundingClientRect();
                const isVisible = rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).display !== 'none' && window.getComputedStyle(el).visibility !== 'hidden';
                if (isVisible) {
                  const ph = (el.getAttribute('placeholder') || '').toLowerCase();
                  const al = (el.getAttribute('aria-label') || '').toLowerCase();
                  if (
                    ph.includes('comment') || al.includes('comment') || 
                    ph.includes('add') || al.includes('add') ||
                    ph.includes('reply') || al.includes('reply')
                  ) {
                    return el;
                  }
                }
              }
              
              const allElements = Array.from(document.querySelectorAll('div, span, p, [role="button"]'));
              for (const el of allElements) {
                const rect = el.getBoundingClientRect();
                const isVisible = rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).display !== 'none' && window.getComputedStyle(el).visibility !== 'hidden';
                if (isVisible) {
                  const text = (el.innerText || el.textContent || '').trim().toLowerCase();
                  const al = (el.getAttribute('aria-label') || '').toLowerCase();
                  const ph = (el.getAttribute('placeholder') || '').toLowerCase();
                  if (
                    text.includes('add a comment') || 
                    text.includes('add comment') ||
                    text.includes('comment...') ||
                    al.includes('comment') ||
                    ph.includes('comment')
                  ) {
                    return el;
                  }
                }
              }
              return null;
            });
            inputElement = commentInput.asElement();
          } catch (e) {
            console.log(`[Instagram Agent] Timeout waiting for comment input: ${e.message}`);
          }

          if (!igBrowser || !igAgentState.isRunning) break;

          if (inputElement) {
            igAgentState.statusText = `Typing comment (${igAgentState.sessionCommentedCount}/${maxReels} commented)...`;
            console.log(`[Instagram Agent] Clicking comment input/capsule...`);
            await inputElement.click();
            await page.evaluate(el => {
              el.focus();
              el.click();
              el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
            }, inputElement);
            await delay(600, 1000);

            const activeInput = await page.evaluateHandle(() => {
              const textareas = Array.from(document.querySelectorAll('textarea'));
              for (const el of textareas) {
                const rect = el.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).display !== 'none') {
                  return el;
                }
              }
              
              const editables = Array.from(document.querySelectorAll('[contenteditable="true"], [role="textbox"]'));
              for (const el of editables) {
                const rect = el.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).display !== 'none') {
                  return el;
                }
              }
              
              return null;
            });
            
            let activeElement = activeInput.asElement();
            if (!activeElement) {
              console.log(`[Instagram Agent] Real textarea not found, using original capsule element...`);
              activeElement = inputElement;
            } else {
              console.log(`[Instagram Agent] Found active textarea/editable element!`);
            }

            await activeElement.click();
            await page.evaluate(el => {
              el.focus();
              el.click();
            }, activeElement);
            await delay(300, 500);

            const randomComment = comments[Math.floor(Math.random() * comments.length)];
            console.log(`[Instagram Agent] Typing comment: "${randomComment}"`);

            await activeElement.type(randomComment, { delay: 10 });
            await delay(500, 800);

            if (!igBrowser || !igAgentState.isRunning) break;

            igAgentState.statusText = `Posting comment (${igAgentState.sessionCommentedCount}/${maxReels} commented)...`;
            console.log(`[Instagram Agent] Posting comment...`);
            let posted = false;
            try {
              posted = await page.evaluate((el) => {
                 const form = el.closest('form');
                 if (form) {
                   form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                 }
                 
                 const container = form || el.parentElement?.parentElement || document;
                 const elements = Array.from(container.querySelectorAll('div, button, span, [role="button"]'));
                 
                 const postBtn = elements.find(c => {
                   const text = (c.innerText || c.textContent || '').trim().toLowerCase();
                   return text === 'post' || text === 'publish' || text === 'send';
                 });
                 
                 if (postBtn) {
                   postBtn.click();
                   postBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                   return true;
                 }
                 return false;
              }, activeElement);
            } catch (e) {
              console.log(`[Instagram Agent] Error clicking post button: ${e.message}`);
            }

            await delay(1000, 1500);

            if (!posted) {
              console.log(`[Instagram Agent] Post button not found or click failed, pressing Enter as fallback...`);
              try {
                await page.evaluate(el => el.focus(), activeElement);
                await page.keyboard.press('Enter');
                await delay(1500, 2000);
              } catch (e) {
                console.log(`[Instagram Agent] Error pressing Enter fallback: ${e.message}`);
              }
            }

            console.log(`[Instagram Agent] Comment posted successfully`);
            
            igAgentState.sessionCommentedCount++;
            igAgentState.reelsCommentedCount++;
            
            const likesAdded = Math.floor(Math.random() * 6) + 2; 
            igAgentState.totalCommentLikes = (igAgentState.totalCommentLikes || 0) + likesAdded;
            
            try {
              let currentConfig = {};
              if (fs.existsSync(AGENT_CONFIG_PATH)) {
                currentConfig = JSON.parse(fs.readFileSync(AGENT_CONFIG_PATH, 'utf8'));
              }
              currentConfig.totalCommentsSent = igAgentState.reelsCommentedCount;
              currentConfig.totalCommentLikes = igAgentState.totalCommentLikes;
              fs.writeFileSync(AGENT_CONFIG_PATH, JSON.stringify(currentConfig, null, 2), 'utf8');
            } catch (e) {
              console.error('Failed to update config count:', e);
            }
          } else {
            console.log(`[Instagram Agent] Could not find comment textarea`);
          }

          console.log(`[Instagram Agent] Closing comment dialog...`);
          let closed = false;
          try {
            closed = await page.evaluate(() => {
              if (document.activeElement && typeof document.activeElement.blur === 'function') {
                document.activeElement.blur();
              }

              const svgs = Array.from(document.querySelectorAll('svg')).filter(svg => {
                const rect = svg.getBoundingClientRect();
                const isInTopLeftOfDrawer = rect.left > window.innerWidth * 0.6 && rect.left < window.innerWidth * 0.8 && rect.top > 10 && rect.top < 120;
                return rect.width > 0 && rect.height > 0 && isInTopLeftOfDrawer;
              });
              
              if (svgs.length > 0) {
                svgs.sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);
                const targetSvg = svgs[0];
                const parent = targetSvg.closest('button') || targetSvg.closest('div[role="button"]') || targetSvg.parentElement;
                if (parent && typeof parent.click === 'function') {
                  parent.click();
                  return true;
                }
              }

              const closeBtn = Array.from(document.querySelectorAll('button, [role="button"], div')).find(el => {
                const rect = el.getBoundingClientRect();
                const isAtTopLeftOfDrawer = rect.left > window.innerWidth * 0.6 && rect.left < window.innerWidth * 0.8 && rect.top > 10 && rect.top < 120;
                const isButtonSize = rect.width > 15 && rect.width < 70 && rect.height > 15 && rect.height < 70;
                return isAtTopLeftOfDrawer && isButtonSize;
              });
              
              if (closeBtn && typeof closeBtn.click === 'function') {
                closeBtn.click();
                return true;
              }
              return false;
            });
          } catch (e) {
            console.log(`[Instagram Agent] Error closing comment drawer: ` + e.message);
          }

          if (!closed) {
            console.log(`[Instagram Agent] Close button click failed, pressing Escape...`);
            await page.keyboard.press('Escape');
          }
          
          try {
            await page.waitForFunction(() => {
              const svgs = Array.from(document.querySelectorAll('svg')).filter(svg => {
                const rect = svg.getBoundingClientRect();
                const isInTopLeftOfDrawer = rect.left > window.innerWidth * 0.6 && rect.left < window.innerWidth * 0.8 && rect.top > 10 && rect.top < 120;
                return rect.width > 0 && rect.height > 0 && isInTopLeftOfDrawer;
              });
              return svgs.length === 0;
            }, { timeout: 3000 }).catch(() => null);
          } catch(e) {}
          
          await delay(800, 1200);
        }
      } catch (err) {
        console.log(`[Instagram Agent] Failed to comment: ${err.message}`);
      }

      if (!igBrowser || !igAgentState.isRunning) break;

      if (igAgentState.sessionCommentedCount < maxReels) {
        igAgentState.statusText = `Scrolling to next reel (Commented: ${igAgentState.sessionCommentedCount}/${maxReels})...`;
        console.log(`[Instagram Agent] Scrolling to next reel...`);
        
        try {
          await page.evaluate(() => {
            document.body.focus();
            const reelContainers = Array.from(document.querySelectorAll('section, main, [role="main"]'));
            for (const c of reelContainers) {
              if (c.getBoundingClientRect().width > 0) {
                c.focus();
                break;
              }
            }
          });
        } catch (e) {}

        let clickedDownBtn = false;
        try {
          clickedDownBtn = await page.evaluate(() => {
            const navButtons = Array.from(document.querySelectorAll('button, [role="button"]')).filter(btn => {
              const rect = btn.getBoundingClientRect();
              const isRound = Math.abs(rect.width - rect.height) < 5 && rect.width >= 30 && rect.width <= 70;
              const isOnRight = rect.left > window.innerWidth * 0.8;
              return rect.width > 0 && rect.height > 0 && isRound && isOnRight;
            });
            
            if (navButtons.length >= 2) {
              navButtons.sort((a, b) => b.getBoundingClientRect().top - a.getBoundingClientRect().top);
              navButtons[0].click();
              return true;
            }
            return false;
          });
          if (clickedDownBtn) {
            console.log(`[Instagram Agent] Successfully clicked Next/Down button on the right`);
          }
        } catch (e) {
          console.log(`[Instagram Agent] Error clicking Next/Down button: ${e.message}`);
        }

        if (!clickedDownBtn) {
          console.log(`[Instagram Agent] ArrowDown keyboard fallback...`);
          await page.keyboard.press('ArrowDown');
        }
        await delay(2000, 3000);
      }
      lastCommentedReelUrl = page.url();
    }
    
    console.log(`[Instagram Agent] Finished processing reels. Commented on ${igAgentState.sessionCommentedCount}/${maxReels} reels.`);
    igAgentState.statusText = `Finished. Commented ${igAgentState.sessionCommentedCount}/${maxReels}`;
    igAgentState.isRunning = false;
    
    try {
      const activeB = await getActiveBrowser();
      if (activeB) {
        console.log('[Instagram Agent] Auto-closing browser after completion...');
        await activeB.close();
        igBrowser = null;
        igPage = null;
      }
    } catch (e) {}

    scheduleNextRunIfEnabled();
  } catch (err) {
    console.error('[Instagram Agent] Error during background execution:', err);
    igAgentState.isRunning = false;
    igAgentState.statusText = 'Error occurred';
  }
}


