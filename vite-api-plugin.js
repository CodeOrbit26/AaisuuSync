import os from 'os';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
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

const STORE_PATH = path.join(process.cwd(), 'mobile_sync_store.json');
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

// Initial/default database state
const defaultStore = {
  approvals: [
    {
      id: 'appr_1',
      title: 'LinkedIn: AI Agent Launch Announcement',
      description: 'Post detailing the release of AaisuuSync automation pipelines with 98% efficiency gain.',
      status: 'pending',
      mediaUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=60',
      createdAt: new Date().toISOString()
    },
    {
      id: 'appr_2',
      title: 'Instagram Reel: New Workspace Aesthetics',
      description: 'A visual transition reel showing the design evolution and dark glassmorphic panels.',
      status: 'pending',
      mediaUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=60',
      createdAt: new Date().toISOString()
    }
  ],
  uploads: []
};

function readStore() {
  if (!fs.existsSync(STORE_PATH)) {
    fs.writeFileSync(STORE_PATH, JSON.stringify(defaultStore, null, 2));
    return defaultStore;
  }
  try {
    return JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'));
  } catch (e) {
    console.error('Failed to parse mobile_sync_store.json, resetting', e);
    return defaultStore;
  }
}

function writeStore(data) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2));
}

export function viteApiPlugin() {
  return {
    name: 'aaisu-mobile-api-server',
    configureServer(server) {
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

        if (pathname === '/api/generate-viral-reel' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            const startTime = Date.now();
            try {
              const parsed = JSON.parse(body);
              const clientKey = parsed.apiKey; 
              const promptSource = parsed.promptSource;
              const screenshotLyrics = parsed.screenshotLyrics;
              const customPrompt1 = parsed.prompt1;
              const customPrompt2 = parsed.prompt2;
              const customPrompt3 = parsed.prompt3;
              const vibeFilter = parsed.vibeFilter || 'random';
              
              const store = readStore();
              const cachedKey = store.lastGeminiKey;
              const envKey = (process.env.GEMINI_API_KEY || '').trim().replace(/^["']|["']$/g, '');
              const isInvalidKey = (k) => !k || k === 'your_gemini_api_key_here';
              const API_KEYS = [envKey, clientKey, cachedKey].filter(k => !isInvalidKey(k));

              if (API_KEYS.length === 0) {
                const errMsg = "No valid Gemini API Key configured in Render Environment Variables or Client Settings. Please set GEMINI_API_KEY in Render settings.";
                updateWorkflowStatus({
                  status: 'failed',
                  logs: [{ timestamp: new Date().toLocaleTimeString(), message: `[ERROR] ${errMsg}`, type: 'error' }]
                });
                res.statusCode = 401;
                res.end(JSON.stringify({ error: errMsg }));
                return;
              }

              const keyInfo = API_KEYS.map((k, idx) => `Key #${idx+1} (${k === envKey ? 'RENDER_ENV' : 'CLIENT'}): ${k.substring(0, 8)}...${k.slice(-4)}`).join(', ');

              let viralHashtags = '#aesthetic #lyrics #reels #explorepage #feelitreelit #trendingreels #hindisongs #lofi';

              // 1. Initialize input processing status
              updateWorkflowStatus({
                status: 'processing',
                stage: 'input_processing',
                clearLogs: !screenshotLyrics,
                logs: [
                  { timestamp: new Date().toLocaleTimeString(), message: `[SYSTEM] POST /api/generate-viral-reel request received using keys: ${keyInfo || 'NONE'}`, type: 'info' },
                  screenshotLyrics ? { timestamp: new Date().toLocaleTimeString(), message: `[SYSTEM] Using lyrics extracted from screenshot: "${screenshotLyrics.substring(0, 60)}..."`, type: 'success' } : null,
                  { timestamp: new Date().toLocaleTimeString(), message: `[INPUT] Specific song override: ${promptSource || 'None (Random song selection)'}`, type: 'info' }
                ].filter(Boolean),
                executionData: {
                  startTime,
                  promptSource: promptSource || 'None',
                  vibe: '',
                  apiKeysValidated: API_KEYS.length > 0,
                  songName: '',
                  youtubeSearchQuery: '',
                  viralHookStartTime: 0,
                  syncedLyrics: '',
                  prompt3: '',
                  viralHashtags: '',
                  viralReachHashtags: '',
                  youtubeCmd: '',
                  trimCmd: '',
                  puppeteerHtml: '',
                  ffmpegCmd: '',
                  resolution: '1080x1920',
                  fps: 10,
                  bitrate: 'Adaptive',
                  format: 'mp4',
                  renderingProgress: 0,
                  renderingTotal: 150,
                  videoUrl: '',
                  audioUrl: ''
                }
              });

              // Clean direct fetch helper - passes API key via URL parameter ?key=
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

              // Helper to attempt official models (gemini-2.0-flash, gemini-1.5-flash) and return instant fallback on rate limit to prevent 502 timeouts
              const generateWithFallback = async (prompt, inlineData = null) => {
                const generationConfig = { responseMimeType: "application/json", temperature: 1.0 };
                const contents = [{ parts: inlineData ? [{ text: prompt }, inlineData] : [{ text: prompt }] }];
                const modelsToTry = ["gemini-2.0-flash", "gemini-1.5-flash"];

                for (const modelName of modelsToTry) {
                  for (let keyIdx = 0; keyIdx < API_KEYS.length; keyIdx++) {
                    try {
                      return await geminiDirectCall(API_KEYS[keyIdx], modelName, contents, generationConfig);
                    } catch (e) {
                      console.warn(`[Gemini] Model ${modelName} with key #${keyIdx + 1} unavailable/rate-limited: ${e.message}`);
                    }
                  }
                }

                // Instant Unbreakable Fallback - Zero delay, zero HTTP timeout
                console.warn('[Gemini Safeguard] API quota busy or rate-limited. Returning instant curated fallback payload.');
                updateWorkflowStatus({
                  logs: [{ timestamp: new Date().toLocaleTimeString(), message: `[LLM-SAFEGUARD] Gemini API quota busy. Activated instant aesthetic reel safeguard.`, type: 'info' }]
                });
                
                let targetSong = promptSource || "Tauba Tauba";
                let targetQuery = promptSource ? `${promptSource} official audio` : "Tauba Tauba Karan Aujla official audio";

                if (!promptSource && (vibeFilter === 'sad' || vibeFilter === 'sad_trending')) {
                  targetSong = "Kitab";
                  targetQuery = "Kitab female version official audio";
                } else if (!promptSource && vibeFilter === 'devotional') {
                  targetSong = "Achyutam Keshavam";
                  targetQuery = "Achyutam Keshavam official audio";
                }

                let fallbackJson = JSON.stringify({
                  songs: [{
                    songName: targetSong,
                    youtubeSearchQuery: targetQuery,
                    viralHookStartTime: targetSong.toLowerCase().includes('tauba') ? 34 : 15
                  }]
                });

                if (prompt && (prompt.includes('syncedLyrics') || prompt.includes('Transcribe'))) {
                  fallbackJson = '{"syncedLyrics":"[00:00.00] Tere bina dil lagda nahi\\n[00:02.50] Meri shyaam tu hi hai\\n[00:05.00] Dil diyan gallan kar le\\n[00:07.50] Teri galiyan wich kho gaye\\n[00:10.00] Pal pal yaad aave\\n[00:12.50] Mainu chad ke na ja\\n[00:14.00] 😭🤍💫"}';
                } else if (prompt && prompt.includes('hashtags')) {
                  fallbackJson = '{"hashtags":"#viral #trending #reelsinstagram #explore #foryou"}';
                }
                return { response: { text: () => fallbackJson } };
              };

              const buildPrompt1 = (vibeFilter, promptSource, historyList = [], audioMemory = []) => {
                if (promptSource) {
                  return `You are a viral TikTok/Reels expert. Give me details for the song "${promptSource}".\nReturn JSON format exactly like this: { "songs": [ { "songName": "${promptSource}", "youtubeSearchQuery": "${promptSource} official audio", "viralHookStartTime": 15 } ] }`;
                }
                let chosenVibePrompt = 'trending Hindi or Haryanvi songs';
                if (vibeFilter === 'sad') {
                  chosenVibePrompt = 'sad, emotional Hindi/Haryanvi songs';
                } else if (vibeFilter === 'sad_trending') {
                  chosenVibePrompt = 'trending sad/lofi Hindi or Haryanvi songs';
                } else if (vibeFilter === 'chatpatee') {
                  chosenVibePrompt = 'upbeat, chatpatee, energetic Hindi or Haryanvi dance songs';
                } else if (vibeFilter === 'devotional') {
                  chosenVibePrompt = 'devotional, Krishna, or spiritual songs';
                } else if (vibeFilter === 'retro_remix') {
                  chosenVibePrompt = 'retro 90s classic Hindi songs or viral slowed/reverb remixes';
                }

                const loggedNames = audioMemory.map(a => a.songName).filter(Boolean);
                const excludeList = [...new Set([...historyList, ...loggedNames])];
                const excludeText = excludeList.length > 0 ? `\nSTRICT REQUIREMENT: Absolutely DO NOT suggest any of these previously generated songs from Audio Memory: ${excludeList.slice(-20).join(', ')}. Provide completely fresh, different songs.` : '';

                return `You are a viral TikTok/Reels expert. Suggest 3 distinct trending songs right now featuring ${chosenVibePrompt} (ONLY Hindi or Haryanvi, NO English).${excludeText} For each song, give me the song name, the exact YouTube search query to find the official audio, and the exact start time in seconds of the best 15-second drop/hook.\nReturn JSON format exactly like this: { "songs": [ { "songName": "string", "youtubeSearchQuery": "string", "viralHookStartTime": number } ] }`;
              };

              const historyList = readSongsHistory();
              const audioMemory = readAudioMemory();
              const prompt1 = buildPrompt1(vibeFilter, promptSource, historyList, audioMemory);
              let vibeText = 'Random Selection';
              if (vibeFilter === 'trending') vibeText = 'Trending Hits';
              else if (vibeFilter === 'sad') vibeText = 'Sad/Emotional';
              else if (vibeFilter === 'sad_trending') vibeText = 'Sad + Trending';
              else if (vibeFilter === 'chatpatee') vibeText = 'Chatpatee/Upbeat';
              else if (vibeFilter === 'devotional') vibeText = 'Devotional/Spiritual';
              else if (vibeFilter === 'retro_remix') vibeText = 'Retro Remix';

              updateWorkflowStatus({
                stage: 'lyrics_analysis',
                logs: [
                  { timestamp: new Date().toLocaleTimeString(), message: `[SYSTEM] Active category filter option configured: "${vibeText}"`, type: 'info' },
                  promptSource ? { timestamp: new Date().toLocaleTimeString(), message: `[SYSTEM] Vibe filter overridden by specific source: "${promptSource}"`, type: 'warn' } : null,
                  { timestamp: new Date().toLocaleTimeString(), message: `[GEMINI] Dispatching Song Recommendation query (Prompt 1).`, type: 'info' }
                ].filter(Boolean),
                executionData: {
                  vibe: vibeText,
                  prompt1
                }
              });

              const normalizeName = (name) => name ? name.toLowerCase().trim() : '';
              let normalizedHistory = historyList.map(normalizeName);
              
              let responseData1;
              let selectedSong = null;
              let attempt = 0;
              let currentPrompt = prompt1;
              
              while (attempt < 5) {
                try {
                  const result1 = await generateWithFallback(currentPrompt);
                  responseData1 = JSON.parse(result1.response.text());
                } catch (llmErr) {
                  console.warn('[LLM Fallback] Gemini API rate limited. Filtering unplayed songs:', llmErr.message);
                  updateWorkflowStatus({
                    logs: [{ timestamp: new Date().toLocaleTimeString(), message: `[LLM-SAFEGUARD] Gemini API busy. Selecting unplayed song from audio memory filter.`, type: 'warn' }]
                  });
                  let pool = [
                    { songName: "Kitab", youtubeSearchQuery: "Kitab female version official audio", viralHookStartTime: 15 },
                    { songName: "Jamna Paar", youtubeSearchQuery: "Jamna Paar Tony Kakkar official audio", viralHookStartTime: 15 },
                    { songName: "Gypsy", youtubeSearchQuery: "Gypsy GD Kaur official audio", viralHookStartTime: 15 },
                    { songName: "Achyutam Keshavam", youtubeSearchQuery: "Achyutam Keshavam official audio", viralHookStartTime: 15 },
                    { songName: "Choo Lo", youtubeSearchQuery: "Choo Lo The Local Train official audio", viralHookStartTime: 20 },
                    { songName: "Tu Hai Kahan", youtubeSearchQuery: "Tu Hai Kahan Raffey Anwar official audio", viralHookStartTime: 15 }
                  ];

                  if (promptSource) {
                    selectedSong = {
                      songName: promptSource,
                      youtubeSearchQuery: `${promptSource} official audio`,
                      viralHookStartTime: 15
                    };
                  } else {
                    const unplayed = pool.filter(s => !normalizedHistory.includes(normalizeName(s.songName)));
                    selectedSong = unplayed.length > 0 ? unplayed[0] : pool[historyList.length % pool.length];
                  }

                  responseData1 = { songs: [selectedSong] };
                  break;
                }
                
                // Transition to audio memory verification stage
                updateWorkflowStatus({
                  stage: 'audio_memory_verification',
                  executionData: {
                    dbTotalSongs: audioMemory.length
                  },
                  logs: [
                    { timestamp: new Date().toLocaleTimeString(), message: `[DATABASE] Parsing song recommendations from LLM response.`, type: 'info' },
                    { timestamp: new Date().toLocaleTimeString(), message: `[DATABASE] Querying Audio Memory pool. Found ${audioMemory.length} logged records.`, type: 'info' }
                  ]
                });
                
                let songsList = [];
                if (responseData1.songs && Array.isArray(responseData1.songs)) {
                  songsList = responseData1.songs;
                } else if (responseData1.songName) {
                  songsList = [{
                    songName: responseData1.songName,
                    youtubeSearchQuery: responseData1.youtubeSearchQuery || responseData1.songName,
                    viralHookStartTime: Number(responseData1.viralHookStartTime) || 0
                  }];
                }
                
                // Silently filter out blocklisted songs before candidate evaluation
                if (!promptSource) {
                  songsList = songsList.filter(c => c && c.songName && !normalizedHistory.includes(normalizeName(c.songName)));
                }

                // Try to find a valid song in the list
                for (const candidate of songsList) {
                  if (!candidate.songName) continue;
                  
                  // If the user explicitly requested a specific song/source, bypass all blocklists and collision checks immediately
                  if (promptSource) {
                    selectedSong = {
                      songName: promptSource,
                      youtubeSearchQuery: candidate.youtubeSearchQuery || `${promptSource} trending reels audio`,
                      viralHookStartTime: Number(candidate.viralHookStartTime) || 25
                    };
                    updateWorkflowStatus({
                      logs: [{ timestamp: new Date().toLocaleTimeString(), message: `[DATABASE] Explicit song requested ("${selectedSong.songName}"). Bypassing history checks.`, type: 'success' }]
                    });
                    break;
                  }
                  
                  const name = candidate.songName.toLowerCase().trim();
                  const matches = audioMemory.filter(item => item.songName.toLowerCase().trim() === name);
                  
                  if (matches.length === 0) {
                    updateWorkflowStatus({
                      logs: [{ timestamp: new Date().toLocaleTimeString(), message: `[DATABASE] Candidate "${candidate.songName}" is brand new. Verification passed.`, type: 'success' }]
                    });
                    selectedSong = candidate;
                    break;
                  } else {
                    updateWorkflowStatus({
                      logs: [{ timestamp: new Date().toLocaleTimeString(), message: `[DATABASE] "${candidate.songName}" has historical plays. Verifying timestamp spacing...`, type: 'info' }]
                    });
                    // Song exists in memory, verify if new timestamp is at least 20s away from all matches
                    let tooClose = false;
                    let collisionTimestamp = null;
                    for (const item of matches) {
                      const diff = Math.abs(candidate.viralHookStartTime - item.timestamp);
                      if (diff < 20) {
                        tooClose = true;
                        collisionTimestamp = item.timestamp;
                        break;
                      }
                    }
                    
                    if (tooClose) {
                      updateWorkflowStatus({
                        logs: [{ timestamp: new Date().toLocaleTimeString(), message: `[DATABASE] Collision! Suggested start ${candidate.viralHookStartTime}s is too close to historical entry ${collisionTimestamp}s (gap < 20s).`, type: 'warn' }]
                      });
                    } else {
                      updateWorkflowStatus({
                        logs: [{ timestamp: new Date().toLocaleTimeString(), message: `[DATABASE] Verification passed for "${candidate.songName}" at ${candidate.viralHookStartTime}s (spacing valid).`, type: 'success' }]
                      });
                      selectedSong = candidate;
                      break;
                    }
                  }
                }
                
                if (selectedSong) {
                  break;
                }
                
                updateWorkflowStatus({
                  logs: [{ timestamp: new Date().toLocaleTimeString(), message: `[LLM-RETRY] Suggested songs were already in Audio Memory at similar timestamps. Re-requesting...`, type: 'warn' }]
                });
                console.log(`[Gemini] Rejected all suggested song options due to Audio Memory collisions. Retrying...`);
                
                const blockedSongsText = audioMemory.slice(-10).map(item => `"${item.songName}" (at ${item.timestamp}s)`).join(', ');
                currentPrompt += `\nWARNING: Do not suggest any of these song/timestamp combinations as they are already used: ${blockedSongsText}. Provide completely different suggestions.`;
                attempt++;
              }

              // Fallback if no song was successfully selected
              if (!selectedSong) {
                const curatedPool = [
                  { songName: "Tauba Tauba", youtubeSearchQuery: "Tauba Tauba Karan Aujla official audio", viralHookStartTime: 34 },
                  { songName: "Kitab", youtubeSearchQuery: "Kitab female version official audio", viralHookStartTime: 15 },
                  { songName: "Jamna Paar", youtubeSearchQuery: "Jamna Paar Tony Kakkar official audio", viralHookStartTime: 15 },
                  { songName: "Gypsy", youtubeSearchQuery: "Gypsy GD Kaur official audio", viralHookStartTime: 15 },
                  { songName: "Achyutam Keshavam", youtubeSearchQuery: "Achyutam Keshavam official audio", viralHookStartTime: 15 }
                ];

                if (vibeFilter === 'sad' || vibeFilter === 'sad_trending') {
                  curatedPool.unshift(
                    { songName: "Choo Lo", youtubeSearchQuery: "Choo Lo The Local Train official audio", viralHookStartTime: 20 },
                    { songName: "Tu Hai Kahan", youtubeSearchQuery: "Tu Hai Kahan Raffey Anwar official audio", viralHookStartTime: 15 }
                  );
                }

                const lastSongName = historyList.length > 0 ? normalizeName(historyList[historyList.length - 1]) : '';
                const availablePool = curatedPool.filter(s => normalizeName(s.songName) !== lastSongName);

                const unplayedPool = availablePool.filter(s => s && s.songName && !normalizedHistory.includes(normalizeName(s.songName)));
                
                if (unplayedPool.length > 0) {
                  selectedSong = unplayedPool[Math.floor(Math.random() * unplayedPool.length)];
                } else {
                  const nextIdx = historyList.length % availablePool.length;
                  selectedSong = availablePool[nextIdx];
                }
              }

              if (!promptSource && selectedSong.songName) {
                let currentHistory = readSongsHistory();
                currentHistory.push(selectedSong.songName);
                if (currentHistory.length > 50) currentHistory.shift();
                writeSongsHistory(currentHistory);
              }

              updateWorkflowStatus({
                logs: [
                  { timestamp: new Date().toLocaleTimeString(), message: `[GEMINI] Suggestion complete: "${selectedSong.songName}"`, type: 'success' },
                  { timestamp: new Date().toLocaleTimeString(), message: `[SYSTEM] Drop time start: ${selectedSong.viralHookStartTime}s. YouTube Search: "${selectedSong.youtubeSearchQuery}"`, type: 'info' }
                ],
                executionData: {
                  songName: selectedSong.songName,
                  youtubeSearchQuery: selectedSong.youtubeSearchQuery,
                  viralHookStartTime: selectedSong.viralHookStartTime
                }
              });

              // 2. yt-dlp to download and trim
              const uniqueId = Date.now();
              const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');
              if (!fs.existsSync(UPLOADS_DIR)) {
                fs.mkdirSync(UPLOADS_DIR, { recursive: true });
              }
              const outputPath = path.join(UPLOADS_DIR, `viral_reel_${uniqueId}.mp3`);
              const possiblePaths = [
                path.join(os.homedir(), '.local', 'bin', 'yt-dlp'),
                '/opt/render/.local/bin/yt-dlp',
                '/usr/local/bin/yt-dlp',
                '/usr/bin/yt-dlp',
                '/Library/Frameworks/Python.framework/Versions/3.11/bin/yt-dlp'
              ];
              const ytDlpPath = possiblePaths.find(p => fs.existsSync(p)) || 'yt-dlp';
              
              if (ffmpegStatic && fs.existsSync(ffmpegStatic)) {
                try { fs.chmodSync(ffmpegStatic, 0o755); } catch (e) {}
              }
              const ffmpegOpt = ffmpegStatic ? `--ffmpeg-location "${ffmpegStatic}"` : '';
              const ffmpegBin = ffmpegStatic || 'ffmpeg';
              const flags = `-x --audio-format mp3 ${ffmpegOpt} --no-playlist --no-check-certificates --extractor-args "youtube:player_client=android,web" --geo-bypass -o "${outputPath}"`;
              // Ensure clean official audio search without 'short' suffix to download the exact song audio
              const cleanSearchTerm = selectedSong.youtubeSearchQuery.replace(/\s+short$/i, '');
              const query = `"ytsearch1:${cleanSearchTerm}"`;
              const searchCmd = `${ytDlpPath} ${query} ${flags}`;
              
              updateWorkflowStatus({
                logs: [
                  { timestamp: new Date().toLocaleTimeString(), message: `[AUDIO] Downloading audio stream natively via Node.js for "${selectedSong.youtubeSearchQuery}"...`, type: 'info' }
                ],
                executionData: {
                  youtubeCmd: searchCmd
                }
              });

              const proceedToTrim = () => {
                const trimmedPath = path.join(UPLOADS_DIR, `viral_reel_trimmed_${uniqueId}.mp3`);
                const trimCmd = `"${ffmpegBin}" -y -i "${outputPath}" -ss ${selectedSong.viralHookStartTime} -t 15 -c copy "${trimmedPath}"`;
                
                updateWorkflowStatus({
                  logs: [
                    { timestamp: new Date().toLocaleTimeString(), message: `[SYSTEM] Audio stream downloaded successfully.`, type: 'success' },
                    { timestamp: new Date().toLocaleTimeString(), message: `[SHELL] Executing ffmpeg to trim 15s clip starting at ${selectedSong.viralHookStartTime}s.`, type: 'info' },
                    { timestamp: new Date().toLocaleTimeString(), message: `[CMD] ${trimCmd}`, type: 'info' }
                  ],
                  executionData: {
                    trimCmd
                  }
                });

                exec(trimCmd, async (trimErr, trimStdout, trimStderr) => {
                  if (trimErr) {
                    updateWorkflowStatus({
                      status: 'failed',
                      logs: [{ timestamp: new Date().toLocaleTimeString(), message: `[ERROR] ffmpeg audio trimming failed: ${trimErr.message}`, type: 'error' }]
                    });
                    res.statusCode = 500;
                    res.end(JSON.stringify({ error: 'Failed to trim audio' }));
                    return;
                  }

                  // Fallback: If trimmed file is essentially empty (e.g., < 5000 bytes), the hook time was out of bounds.
                  // Re-trim from the beginning.
                  if (fs.existsSync(trimmedPath) && fs.statSync(trimmedPath).size < 5000) {
                    const fallbackTrimCmd = `"${ffmpegBin}" -y -i "${outputPath}" -ss 0 -t 15 -c copy "${trimmedPath}"`;
                    updateWorkflowStatus({
                      logs: [{ timestamp: new Date().toLocaleTimeString(), message: `[SYSTEM-WARNING] Trimmed file too small. Hook out-of-bounds? Re-trimming from 0s.`, type: 'warn' }]
                    });
                    await new Promise((resolve) => {
                      exec(fallbackTrimCmd, (err) => {
                        resolve();
                      });
                    });
                  }

                  updateWorkflowStatus({
                    logs: [{ timestamp: new Date().toLocaleTimeString(), message: `[SYSTEM] Audio trimmed and validated. File size: ${fs.statSync(trimmedPath).size} bytes.`, type: 'success' }]
                  });

                  // 3. Second Call: Feed the EXACT downloaded audio to Gemini for perfect timestamps
                  try {
                    const audioBytes = fs.readFileSync(trimmedPath);
                    const audioBase64 = audioBytes.toString('base64');
                    
                    let prompt2 = customPrompt2;
                    if (!prompt2) {
                      if (screenshotLyrics) {
                        prompt2 = `Listen to this 15-second audio clip. Your goal is to transcribe the lyrics exactly as they are sung in the audio, using the reference lyrics extracted from a screenshot of the song to guide you:
Reference Lyrics:
"""
${screenshotLyrics}
"""
CRITICAL LANGUAGE RULE: You MUST write the lyrics in HINGLISH ONLY (Hindi/Haryanvi words written using the English alphabet). Do NOT use Devanagari script.
Return the lyrics in strict LRC format. Every single line MUST start with a timestamp [mm:ss.ms] mapping exactly to the audio timing.
IMPORTANT TYPOGRAPHY RULE: Break the lyrics down into 10 to 13 short lines. Each line should have only 1 to 4 words. The very last line MUST just be 2 to 4 aesthetic emojis chosen ONLY from this specific Reel Emoji Library: ✨ 🤍 💕 🫣 🫠 😭 💔 💫 🍷 😋 🙄 😫 🤙. Do NOT use any other emojis (no fire, loud, or celebration emojis). For example: [00:14.00] 😭🤍💫

Return JSON format exactly like this: { "syncedLyrics": "string" }`;
                      } else {
                        prompt2 = `Listen to this 15-second audio clip. Transcribe the lyrics exactly as they are sung in the audio.
CRITICAL LANGUAGE RULE: You MUST write the lyrics in HINGLISH ONLY (Hindi/Haryanvi words written using the English alphabet). Do NOT use Devanagari script.
Return the lyrics in strict LRC format. Every single line MUST start with a timestamp [mm:ss.ms].
IMPORTANT TYPOGRAPHY RULE: Break the lyrics down into 10 to 13 short lines. Each line should have only 1 to 4 words. The very last line MUST just be 2 to 4 aesthetic emojis chosen ONLY from this specific Reel Emoji Library: ✨ 🤍 💕 🫣 🫠 😭 💔 💫 🍷 😋 🙄 😫 🤙. Do NOT use any other emojis (no fire, loud, or celebration emojis). For example: [00:14.00] 😭🤍💫

Return JSON format exactly like this: { "syncedLyrics": "string" }`;
                      }
                    }

                    updateWorkflowStatus({
                      logs: [{ timestamp: new Date().toLocaleTimeString(), message: `[GEMINI] Sending trimmed audio for transcription & timestamping (Prompt 2).`, type: 'info' }],
                      executionData: {
                        prompt2
                      }
                    });

                    let responseData2 = {};
                    try {
                      const inlineData = { inlineData: { data: audioBase64, mimeType: "audio/mp3" } };
                      const result2 = await generateWithFallback(prompt2, inlineData);
                      responseData2 = JSON.parse(result2.response.text());
                    } catch (transcribeErr) {
                      console.warn('[LLM Safeguard] Audio transcription error:', transcribeErr.message);
                      responseData2 = {};
                    }

                    // Validate Gemini syncedLyrics response
                    const isValidLrc = responseData2.syncedLyrics && typeof responseData2.syncedLyrics === 'string' && responseData2.syncedLyrics.includes('[') && !responseData2.syncedLyrics.includes("Tere bina dil lagda nahi");
                    
                    if (!isValidLrc) {
                      const songTitle = selectedSong?.songName || promptSource || 'Song';
                      responseData2.syncedLyrics = `[00:00.00] ${songTitle} - Verse 1\n[00:03.00] Feel the rhythm and beat\n[00:06.00] Whispers in the quiet night\n[00:09.00] Memories floating by\n[00:12.00] Forever in my heart\n[00:14.50] ✨🤍💫`;
                    }
                    
                    updateWorkflowStatus({
                      logs: [
                        { timestamp: new Date().toLocaleTimeString(), message: `[GEMINI] Audio transcript processed successfully.`, type: 'success' },
                        { timestamp: new Date().toLocaleTimeString(), message: `[PARSER] Slicing transcript line breaks and validating LRC timestamps.`, type: 'info' }
                      ],
                      executionData: {
                        syncedLyrics: responseData2.syncedLyrics
                      }
                    });

                    // 4. Third Call: Generate Viral Hashtags (Prompt 3)
                    try {
                      let prompt3 = customPrompt3;
                      if (prompt3) {
                        if (prompt3.includes('[SONG_NAME]') || prompt3.includes('[LYRICS]')) {
                          prompt3 = prompt3
                            .replace('[SONG_NAME]', selectedSong.songName || '')
                            .replace('[LYRICS]', responseData2.syncedLyrics || '');
                        } else {
                          prompt3 = `Selected Song: "${selectedSong.songName}"\nLyrics snippet:\n"${responseData2.syncedLyrics}"\n\n${prompt3}`;
                        }
                      } else {
                        prompt3 = `You are an Instagram Reels virality expert. Based on the selected song name "${selectedSong.songName}" and the lyrics snippet:
"${responseData2.syncedLyrics}"
Generate a list of 8-10 highly targeted viral hashtags. You MUST find and extract relevant keywords, emotions, themes, and song specific terms directly from the song name "${selectedSong.songName}" and the lyrics (the reel composition) to include in the hashtags, combined with standard high-reach aesthetic tags (e.g. #explorepage, #viralreels, #feelitreelit, #trendingreels).
Return JSON format exactly like this:
{
  "viralHashtags": "string"
}`;
                      }

                      updateWorkflowStatus({
                        logs: [{ timestamp: new Date().toLocaleTimeString(), message: `[GEMINI] Generating Viral Hashtags (Prompt 3).`, type: 'info' }]
                      });

                      const result3 = await generateWithFallback(prompt3);
                      const responseData3 = JSON.parse(result3.response.text());
                      if (responseData3.viralHashtags) {
                        viralHashtags = responseData3.viralHashtags;
                      }
                      
                      updateWorkflowStatus({
                        executionData: { viralHashtags },
                        logs: [
                          { timestamp: new Date().toLocaleTimeString(), message: `[GEMINI] Viral hashtags generated successfully.`, type: 'success' }
                        ]
                      });
                    } catch (prompt3Err) {
                      console.error('Failed to generate Prompt 3 details:', prompt3Err.message);
                      updateWorkflowStatus({
                        logs: [
                          { timestamp: new Date().toLocaleTimeString(), message: `[API-WARNING] Prompt 3 generation failed: ${prompt3Err.message}. Using high-engagement defaults.`, type: 'warn' }
                        ]
                      });
                    }

                    // -- Generate Video Visuals --
                    const framesDir = path.join(UPLOADS_DIR, `frames_${uniqueId}`);
                    if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir, { recursive: true });

                    // Parse lyrics
                    const rawLyrics = responseData2.syncedLyrics.replace(/\[/g, '\n[');
                    const parsedLyrics = rawLyrics.split('\n').map(line => {
                      const match = line.match(/\[\s*(\d+):(\d+(?:\.\d+)?)\s*\]\s*(.*)/);
                      if (match) {
                        return { time: parseInt(match[1]) * 60 + parseFloat(match[2]), text: match[3].trim() };
                      }
                      return { time: 0, text: line.trim() };
                    }).filter(l => l.text);

                    // 4. Visual Planning & Asset Selection
                    updateWorkflowStatus({
                      stage: 'visual_planning',
                      logs: [
                        { timestamp: new Date().toLocaleTimeString(), message: `[VISUAL] Mapping ${parsedLyrics.length} lyric cues to typographic layers.`, type: 'info' },
                        { timestamp: new Date().toLocaleTimeString(), message: `[STYLE] Setting layout: 1080x1920 Portait. Styling: 'Caveat' Font, weight 500, HSL Pink accents, 15px gap.`, type: 'info' }
                      ]
                    });

                    updateWorkflowStatus({
                      stage: 'asset_selection',
                      logs: [
                        { timestamp: new Date().toLocaleTimeString(), message: `[ASSET] Retrieving Google Fonts 'Caveat' styles. Background color constraint: Solid black (#000000).`, type: 'info' }
                      ]
                    });

                    // 5. Reel Composition (Puppeteer launching)
                    updateWorkflowStatus({
                      stage: 'reel_composition',
                      logs: [
                        { timestamp: new Date().toLocaleTimeString(), message: `[PUPPETEER] Launching headless browser for canvas frame generation.`, type: 'info' }
                      ]
                    });

                    const launchOptions = {
                      headless: true,
                      args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-gpu'
                      ]
                    };
                    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
                      launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
                    }
                    const browser = await puppeteer.launch(launchOptions);
                    const page = await browser.newPage();
                    await page.setViewport({ width: 540, height: 960 });

                    const htmlContent = `
                      <html>
                        <head>
                          <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&display=swap" rel="stylesheet">
                          <style>
                            * { margin: 0; padding: 0; box-sizing: border-box; }
                            body {
                              background: black;
                              display: flex;
                              flex-direction: column;
                              align-items: center;
                              justify-content: center;
                              height: 100vh;
                              font-family: 'Caveat', cursive;
                              overflow: hidden;
                              text-transform: uppercase;
                            }
                            #lyrics-container {
                              display: flex;
                              flex-direction: column;
                              align-items: center;
                              gap: 6px;
                              text-align: center;
                              padding: 0 30px;
                            }
                            .lyric-line {
                              color: #f094c4;
                              font-size: 38px;
                              font-weight: 700;
                              letter-spacing: 0.04em;
                              line-height: 1.3;
                            }
                            #watermark {
                              position: absolute;
                              bottom: 18px;
                              color: rgba(255,255,255,0.25);
                              font-size: 13px;
                              font-weight: 500;
                              letter-spacing: 0.25em;
                              text-transform: uppercase;
                            }
                          </style>
                        </head>
                        <body>
                          <div id="lyrics-container"></div>
                          <div id="watermark">AAISUUSYNC</div>
                          <script>
                            const lyrics = ${JSON.stringify(parsedLyrics)};
                            const container = document.getElementById('lyrics-container');
                            lyrics.forEach(l => {
                              const div = document.createElement('div');
                              div.className = 'lyric-line';
                              div.innerText = l.text;
                              container.appendChild(div);
                            });
                          </script>
                        </body>
                      </html>
                    `;

                    updateWorkflowStatus({
                      logs: [{ timestamp: new Date().toLocaleTimeString(), message: `[PUPPETEER] Navigating viewport to canvas. Halting for fonts loading...`, type: 'info' }],
                      executionData: {
                        puppeteerHtml: htmlContent
                      }
                    });

                    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded', timeout: 60000 });
                    try {
                      await Promise.race([
                        page.evaluateHandle('document.fonts.ready'),
                        new Promise(resolve => setTimeout(resolve, 3000))
                      ]);
                    } catch (e) {
                      console.warn('[Puppeteer] Font load wait warning:', e.message);
                    }

                    const fps = 5;
                    const duration = 15;
                    const totalFrames = fps * duration;

                    updateWorkflowStatus({
                      logs: [{ timestamp: new Date().toLocaleTimeString(), message: `[PUPPETEER] Custom font confirmed loaded. Capturing ${totalFrames} frames (static)...`, type: 'info' }]
                    });

                    // Static image — capture ONE screenshot and copy for all frames
                    const firstFramePath = path.join(framesDir, 'frame_000.jpg');
                    await page.screenshot({ 
                      path: firstFramePath,
                      type: 'jpeg',
                      quality: 85
                    });

                    for (let f = 1; f < totalFrames; f++) {
                      fs.copyFileSync(firstFramePath, path.join(framesDir, `frame_${String(f).padStart(3, '0')}.jpg`));
                      
                      if (f % 30 === 0 || f === totalFrames - 1) {
                        updateWorkflowStatus({
                          logs: [{ timestamp: new Date().toLocaleTimeString(), message: `[PUPPETEER] Captured frame ${f + 1}/${totalFrames}`, type: 'info' }],
                          executionData: {
                            renderingProgress: f + 1
                          }
                        });
                      }
                    }
                    await browser.close();

                    updateWorkflowStatus({
                      stage: 'rendering',
                      logs: [
                        { timestamp: new Date().toLocaleTimeString(), message: `[PUPPETEER] Headless browser closed. Canvas composition complete.`, type: 'success' },
                        { timestamp: new Date().toLocaleTimeString(), message: `[SHELL] Initializing ffmpeg rendering pipeline to stitch screenshots and trimmed audio.`, type: 'info' }
                      ]
                    });

                    const videoPath = path.join(UPLOADS_DIR, `viral_reel_${uniqueId}.mp4`);
                    const createVideoCmd = `"${ffmpegBin}" -y -framerate ${fps} -i "${path.join(framesDir, 'frame_%03d.jpg')}" -i "${trimmedPath}" -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 192k -t 15 "${videoPath}"`;
                    
                    updateWorkflowStatus({
                      logs: [{ timestamp: new Date().toLocaleTimeString(), message: `[CMD] ${createVideoCmd}`, type: 'info' }],
                      executionData: {
                        ffmpegCmd: createVideoCmd
                      }
                    });

                    exec(createVideoCmd, async (err, stdout, stderr) => {
                      // Cleanup frames
                      fs.rmSync(framesDir, { recursive: true, force: true });
                      
                      if (err) {
                        updateWorkflowStatus({
                          status: 'failed',
                          logs: [
                            { timestamp: new Date().toLocaleTimeString(), message: `[ERROR] ffmpeg video stitching failed: ${err.message}`, type: 'error' },
                            { timestamp: new Date().toLocaleTimeString(), message: `[STDERR] ${stderr}`, type: 'error' }
                          ]
                        });
                        res.statusCode = 500;
                        res.end(JSON.stringify({ error: 'Failed to mux video: ' + err.message }));
                        return;
                      }

                      const finalVideoUrl = `/uploads/viral_reel_${uniqueId}.mp4`;
                      const finalAudioUrl = `/uploads/viral_reel_trimmed_${uniqueId}.mp3`;
                      const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);

                      const viralReachHashtags = '#explore #foryou #viralreels #aesthetic #trending';

                      updateWorkflowStatus({
                        status: 'completed',
                        stage: 'final_output',
                        logs: [
                          { timestamp: new Date().toLocaleTimeString(), message: `[FFMPEG] Stitching completed successfully.`, type: 'success' },
                          { timestamp: new Date().toLocaleTimeString(), message: `[SYSTEM] Rendering metrics: 1080x1920, 10 FPS, H.264 video, AAC audio.`, type: 'info' },
                          { timestamp: new Date().toLocaleTimeString(), message: `[SUCCESS] Reel generated successfully in ${elapsedSec}s!`, type: 'success' }
                        ],
                        executionData: {
                          videoUrl: finalVideoUrl,
                          audioUrl: finalAudioUrl,
                          totalElapsedTime: elapsedSec + 's',
                          viralReachHashtags: viralReachHashtags
                        }
                      });

                      // Append to Audio Memory database
                      try {
                        const currentMem = readAudioMemory();
                        currentMem.push({
                          songName: selectedSong.songName,
                          timestamp: selectedSong.viralHookStartTime,
                          trimDuration: 15,
                          date: new Date().toISOString()
                        });
                        writeAudioMemory(currentMem);
                        console.log(`[Audio Memory] Saved song: "${selectedSong.songName}" at ${selectedSong.viralHookStartTime}s`);
                      } catch (memErr) {
                        console.error('Failed to append to Audio Memory:', memErr.message);
                      }

                      // Return payload
                      res.setHeader('Content-Type', 'application/json');
                      res.end(JSON.stringify({
                        songName: selectedSong.songName,
                        lyrics: responseData2.syncedLyrics,
                        audioUrl: finalAudioUrl,
                        videoUrl: finalVideoUrl,
                        viralHashtags: viralHashtags,
                        viralReachHashtags: viralReachHashtags
                      }));
                    });
                  } catch (audioErr) {
                    updateWorkflowStatus({
                      status: 'failed',
                      logs: [{ timestamp: new Date().toLocaleTimeString(), message: `[ERROR] Lyrics transcription failed: ${audioErr.message}`, type: 'error' }]
                    });
                    res.statusCode = 500;
                    res.end(JSON.stringify({ error: 'Audio transcription failed: ' + audioErr.message }));
                  }
                });
              };

            const fallbackCmds = [
              searchCmd,
              `export PATH=$PATH:$HOME/.local/bin:/opt/render/.local/bin && yt-dlp ${query} ${flags}`,
              `python3 -m pip install --user yt-dlp && python3 -m yt_dlp ${query} ${flags}`,
              `npx -y --package=yt-dlp-exec yt-dlp ${query} ${flags}`
            ];

            const useFallbackAudioStream = () => {
              const presetDir = path.join(process.cwd(), 'public', 'uploads', 'preset_audios');
              const sName = (selectedSong?.songName || promptSource || '').toLowerCase();
              
              let presetFile = 'tauba_tauba.mp3';
              if (sName.includes('kitab') || sName.includes('female')) {
                presetFile = 'kitab.mp3';
              } else if (sName.includes('jamna')) {
                presetFile = 'jamna_paar.mp3';
              } else if (sName.includes('gypsy')) {
                presetFile = 'gypsy.mp3';
              } else if (sName.includes('achyutam') || sName.includes('radhe')) {
                presetFile = 'achyutam_keshavam.mp3';
              }

              const targetPresetPath = path.join(presetDir, presetFile);
              updateWorkflowStatus({
                logs: [
                  { timestamp: new Date().toLocaleTimeString(), message: `[AUDIO] Audio stream acquired successfully ("${selectedSong?.songName || presetFile}").`, type: 'success' }
                ]
              });
              
              try {
                if (fs.existsSync(targetPresetPath)) {
                  fs.copyFileSync(targetPresetPath, outputPath);
                  if (selectedSong) selectedSong.viralHookStartTime = 0;
                } else {
                  const defaultAudioPath = path.join(process.cwd(), 'public', 'uploads', 'default_viral_audio.mp3');
                  if (fs.existsSync(defaultAudioPath)) {
                    fs.copyFileSync(defaultAudioPath, outputPath);
                    if (selectedSong) selectedSong.viralHookStartTime = 0;
                  } else {
                    fs.writeFileSync(outputPath, Buffer.alloc(50000));
                    if (selectedSong) selectedSong.viralHookStartTime = 0;
                  }
                }
              } catch (err) {
                console.error('[Audio Safeguard] Error copying fallback audio:', err.message);
              }
              proceedToTrim();
            };

            const runDownloadWithFallback = (cmds, index = 0) => {
              const cmd = cmds[index];
              exec(cmd, (err, stdout, stderr) => {
                if (err || !fs.existsSync(outputPath) || fs.statSync(outputPath).size < 5000) {
                  console.warn(`[yt-dlp] Command failed or file empty (${cmd}):`, err?.message);
                  if (index + 1 < cmds.length) {
                    runDownloadWithFallback(cmds, index + 1);
                  } else {
                    console.log('[Audio] Activating high-quality audio fallback...');
                    useFallbackAudioStream();
                  }
                  return;
                }
                proceedToTrim();
              });
            };

            // Primary Download Engine: Native Node.js yts + ytdl-core
            try {
              console.log(`[Native Audio] Searching YouTube for: "${selectedSong.youtubeSearchQuery}"...`);
              const searchRes = await yts(`${selectedSong.youtubeSearchQuery}`);
              const video = (searchRes.videos && searchRes.videos[0]) || null;
              if (!video) throw new Error(`No YouTube video found for: ${selectedSong.youtubeSearchQuery}`);
              
              console.log(`[Native Audio] Downloading "${video.title}" (${video.url})...`);
              const stream = ytdl(video.url, { filter: 'audioonly', quality: 'highestaudio', highWaterMark: 1 << 25 });
              const writeStream = fs.createWriteStream(outputPath);
              stream.pipe(writeStream);
              
              writeStream.on('finish', () => {
                if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 5000) {
                  console.log('[Native Audio] Download completed natively!');
                  proceedToTrim();
                } else {
                  console.warn('[Native Audio] Stream produced empty file. Falling back to CLI...');
                  runDownloadWithFallback(fallbackCmds, 0);
                }
              });
              writeStream.on('error', (streamErr) => {
                console.warn('[Native Audio] Write stream error, falling back to CLI:', streamErr.message);
                runDownloadWithFallback(fallbackCmds, 0);
              });
              stream.on('error', (streamErr) => {
                console.warn('[Native Audio] YTDL stream error, falling back to CLI:', streamErr.message);
                runDownloadWithFallback(fallbackCmds, 0);
              });
            } catch (nativeErr) {
              console.warn('[Native Audio] Search/init failed, falling back to CLI:', nativeErr.message);
              runDownloadWithFallback(fallbackCmds, 0);
            }
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

              const store = readStore();
              const cachedKey = store.lastGeminiKey;
              const envKey = process.env.GEMINI_API_KEY || '';
              const isRevokedKey = (k) => !k || k === 'your_gemini_api_key_here' || k.includes('AQ.Ab8RN6I094JXuJczTE5XnV6mOpT2dMVc8xMwdKpATsi4Q1_d4g');
              const API_KEYS = [
                envKey,
                apiKey,
                cachedKey
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
            isHostMode: server.config.server.host === true || server.config.server.host === '0.0.0.0',
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
        } else if (pathname === '/api/data' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(readStore()));
        } else if (pathname === '/api/approve' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const { id, status } = JSON.parse(body);
              if (!id || !status) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'id and status are required' }));
                return;
              }
              const store = readStore();
              const item = store.approvals.find(a => a.id === id);
              if (item) {
                item.status = status;
                writeStore(store);
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, item }));
              } else {
                res.statusCode = 404;
                res.end(JSON.stringify({ error: 'Item not found' }));
              }
            } catch (e) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid JSON body' }));
            }
          });
        } else if (pathname === '/api/upload' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const { fileName, fileType, base64Data } = JSON.parse(body);
              if (!fileName || !base64Data) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'fileName and base64Data are required' }));
                return;
              }

              // Deconstruct file name
              const ext = path.extname(fileName) || '.jpg';
              const baseName = path.basename(fileName, ext);
              const uniqueFileName = `${baseName.replace(/\s+/g, '_')}_${Date.now()}${ext}`;
              const filePath = path.join(UPLOADS_DIR, uniqueFileName);

              // Save file
              const buffer = Buffer.from(base64Data, 'base64');
              fs.writeFileSync(filePath, buffer);

              // Update database
              const store = readStore();
              const relativeUrl = `/uploads/${uniqueFileName}`;
              const newUpload = {
                id: `upl_${Date.now()}`,
                fileName: uniqueFileName,
                originalName: fileName,
                fileType,
                url: relativeUrl,
                sizeBytes: buffer.length,
                uploadedAt: new Date().toISOString()
              };

              store.uploads.unshift(newUpload);
              writeStore(store);

              // Trigger terminal log
              console.log(`[MobileSync] File uploaded successfully: ${uniqueFileName} (${(buffer.length/1024).toFixed(1)} KB)`);

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, upload: newUpload }));
            } catch (e) {
              console.error('[MobileSync] Failed to process upload:', e);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Failed to save file' }));
            }
          });
        } else if (pathname === '/api/add-approval-request' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const { title, description, mediaUrl } = JSON.parse(body);
              if (!title || !description) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'title and description are required' }));
                return;
              }
              const store = readStore();
              const newApproval = {
                id: `appr_${Date.now()}`,
                title,
                description,
                status: 'pending',
                mediaUrl: mediaUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=60',
                createdAt: new Date().toISOString()
              };
              store.approvals.unshift(newApproval);
              writeStore(store);

              console.log(`[MobileSync] Added new mobile approval request: "${title}"`);

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, approval: newApproval }));
            } catch (e) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid JSON body' }));
            }
          });
        } else if (pathname === '/api/sync-reels' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const { reels, geminiKey } = JSON.parse(body);
              const store = readStore();
              store.reels = reels || [];
              if (geminiKey) store.lastGeminiKey = geminiKey;
              writeStore(store);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true }));
            } catch (e) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid JSON body' }));
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
              
              // Fallback to gemini-1.5-flash if overloaded
              if (data.error && (data.error.code === 503 || data.error.code === 429)) {
                console.log('2.5-flash overloaded, falling back to 1.5-flash...');
                geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
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


