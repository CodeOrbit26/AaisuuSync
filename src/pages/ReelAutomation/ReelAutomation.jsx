import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  HiOutlineFilm,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineColorSwatch,
  HiOutlineDatabase,
  HiOutlineChartBar,
  HiOutlineUpload,
  HiOutlineRefresh,
  HiOutlineLink,
  HiOutlineAdjustments,
  HiOutlineSparkles,
  HiOutlineDocumentDuplicate,
  HiOutlineMusicNote,
  HiOutlineTerminal,
  HiOutlineLockClosed,
  HiOutlineCheck,
  HiOutlineShieldCheck,
  HiOutlineLightningBolt,
  HiOutlinePlay,
  HiOutlinePause,
  HiOutlineTrash,
  HiOutlineInformationCircle,
  HiOutlineCalendar,
  HiOutlineHeart,
  HiOutlineShare,
  HiOutlineUserCircle,
  HiOutlineDownload,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineCamera
} from 'react-icons/hi';
import { createPortal } from 'react-dom';
import Tabs from '../../components/Tabs/Tabs';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import './ReelAutomation.css';
import WorkflowTab from '../Workflow/Workflow';

const mainTabs = [
  { id: 'pipeline', label: 'Pipeline Dashboard', icon: <HiOutlineChartBar /> },
  { id: 'matrix', label: 'Automation Matrix', icon: <HiOutlineColorSwatch /> },
  { id: 'agent-rules', label: 'Agent Rules', icon: <HiOutlineDatabase /> },
  { id: 'workflow', label: 'Workflow', icon: <HiOutlineTerminal /> },
];

export const AGENT_CAPTIONS = [
  "Some memories never leave 🤍✨",
  "Still thinking about you 🫣💕",
  "Late night thoughts 🍷💔✨",
  "I wish things were different 😭🤍💫"
];

const blueprintTypes = ['Lyrics', 'Sad', 'Split Meme', 'Classic Quote', 'Vibe'];

// The 21 properties the agent analyzes and learns
const LEARNING_PROPERTIES = [
  { key: 'editing_style', label: 'Editing Style', category: 'visual' },
  { key: 'pacing', label: 'Pacing', category: 'visual' },
  { key: 'transition_logic', label: 'Transition Logic', category: 'visual' },
  { key: 'lyric_sync', label: 'Lyric Sync Pattern', category: 'audio' },
  { key: 'camera_movement', label: 'Camera Movement', category: 'visual' },
  
  { key: 'effects_usage', label: 'Effects Usage', category: 'visual' },
  { key: 'color_grading', label: 'Color Grading', category: 'visual' },
  { key: 'text_placement', label: 'Text Placement', category: 'visual' },
  { key: 'emotional_timing', label: 'Emotional Timing', category: 'story' },
  { key: 'hook_pattern', label: 'Hook Pattern', category: 'story' },
  
  { key: 'viral_structure', label: 'Viral Structure', category: 'story' },
  { key: 'beat_cuts', label: 'Beat Cuts', category: 'audio' },
  { key: 'storytelling_flow', label: 'Storytelling Flow', category: 'story' },
  { key: 'duration_style', label: 'Duration Style', category: 'story' },
  { key: 'scene_density', label: 'Scene Density', category: 'visual' },
  { key: 'animation_rhythm', label: 'Animation Rhythm', category: 'visual' },
  
  { key: 'caption_aesthetics', label: 'Caption Aesthetics', category: 'visual' },
  { key: 'sound_design', label: 'Sound Design Behavior', category: 'audio' },
  { key: 'content_energy', label: 'Content Energy', category: 'story' },
  { key: 'audience_targeting', label: 'Audience Targeting', category: 'story' },
  { key: 'retention_strategy', label: 'Retention Strategy', category: 'story' },
];

export default function ReelAutomation() {
  const { currentUser } = useAuth();
  const uid = currentUser?.id || '';
  const uk = (key) => uid ? `${uid}_${key}` : key;

  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem(uk('aaisuu_active_tab_reels')) || 'pipeline';
  });

  useEffect(() => {
    localStorage.setItem(uk('aaisuu_active_tab_reels'), activeTab);
  }, [activeTab, uid]);

  const [pipelineFilter, setPipelineFilter] = useState('upcoming');
  const [activeBlueprint, setActiveBlueprint] = useState('Lyrics');
  const [systemOn, setSystemOn] = useState(() => {
    return localStorage.getItem(uk('aaisuu_system_on')) === 'true';
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [autoPostStatus, setAutoPostStatus] = useState({ lastPosted: null, nextPostTime: null, isPosting: false });
  const autoPostIntervalRef = useRef(null);
  const autoPostTimeoutRef = useRef(null);
  const [toastMessage, setToastMessage] = useState('');

  const [captions, setCaptions] = useState(() => {
    const saved = localStorage.getItem(uk('aaisuu_agent_captions'));
    return saved ? JSON.parse(saved) : [
      "Some memories never leave 🤍✨",
      "Still thinking about you 🫣💕",
      "Late night thoughts 🍷💔✨",
      "I wish things were different 😭🤍💫"
    ];
  });

  const [rules, setRules] = useState(() => {
    const saved = localStorage.getItem(uk('aaisuu_agent_rules'));
    return saved ? JSON.parse(saved) : [
      { id: 'rule_1', title: 'Caption Emojis constraints', priority: 'HIGH', category: 'Caption & Emojis', status: 'Valid', enabled: true, description: 'Ensures the generated captions contain at most 3 contextual emojis and avoid excessive emoji spamming.' },
      { id: 'rule_2', title: 'Typographic Font Face constraints', priority: 'HIGH', category: 'Visual Aesthetics', status: 'Valid', enabled: true, description: 'Filters out fonts that do not fit the aesthetics. Prioritizes clean serif and retro sans-serif faces.' },
      { id: 'rule_3', title: 'Trimming Duration limits', priority: 'MEDIUM', category: 'Audio Processing', status: 'Valid', enabled: true, description: 'Forces final video outputs to trim to a maximum of 15 seconds to fit within standard attention spans.' },
      { id: 'rule_4', title: 'Auto-publish Draft validation', priority: 'LOW', category: 'Scheduling & Publishing', status: 'Valid', enabled: true, description: 'Performs verification checks on scheduled dates to ensure posting windows fall between high-engagement hours.' }
    ];
  });

  useEffect(() => {
    localStorage.setItem(uk('aaisuu_agent_captions'), JSON.stringify(captions));
  }, [captions]);

  const [blueprintPrompts, setBlueprintPrompts] = useState(() => {
    const defaultPrompts = {
      Lyrics: {
        prompt1: `You are a viral TikTok/Reels expert. Suggest 3 distinct trending songs right now with a **chatpati / upbeat** vibe (ONLY Hindi or Haryanvi, NO English). For each song, give me the song name, the exact YouTube search query to find the best short/audio, and the exact start time in seconds of the best 15-second drop/hook.\nReturn JSON format exactly like this: { "songs": [ { "songName": "string", "youtubeSearchQuery": "string", "viralHookStartTime": number } ] }`,
        prompt2: `Listen to this 15-second audio clip. Transcribe the lyrics exactly as they are sung in the audio.\nCRITICAL LANGUAGE RULE: You MUST write the lyrics in HINGLISH ONLY (Hindi/Haryanvi words written using the English alphabet). Do NOT use Devanagari script.\nReturn the lyrics in strict LRC format. Every single line MUST start with a timestamp [mm:ss.ms].\nIMPORTANT TYPOGRAPHY RULE: Break the lyrics down into 10 to 13 short lines. Each line should have only 1 to 4 words. The very last line MUST just be 2 to 4 aesthetic emojis chosen ONLY from this specific Reel Emoji Library: ✨ 🤍 💕 🫣 🫠 😭 💔 💫 🍷 😋 🙄 😫 🤙. Do NOT use any other emojis (no fire, loud, or celebration emojis). For example: [00:14.00] 😭🤍💫\n\nReturn JSON format exactly like this: { "syncedLyrics": "string" }`,
        prompt3: `You are an Instagram Reels virality expert. Based on the selected song name "[SONG_NAME]" and the lyrics snippet:
"[LYRICS]"
Generate a list of 8-10 highly targeted viral hashtags. You MUST find and extract relevant keywords, emotions, themes, and song specific terms directly from the song name "[SONG_NAME]" and the lyrics "[LYRICS]" (the reel composition) to include in the hashtags, combined with standard high-reach aesthetic tags (e.g. #explorepage, #viralreels, #feelitreelit, #trendingreels).
Return JSON format exactly like this:
{
  "viralHashtags": "string"
}`
      },
      Sad: {
        prompt1: `You are a viral TikTok/Reels expert. Suggest 3 distinct trending songs right now with a **sad / emotional** vibe (ONLY Hindi or Haryanvi, NO English). For each song, give me the song name, the exact YouTube search query to find the best short/audio, and the exact start time in seconds of the best 15-second drop/hook.\nReturn JSON format exactly like this: { "songs": [ { "songName": "string", "youtubeSearchQuery": "string", "viralHookStartTime": number } ] }`,
        prompt2: `Listen to this 15-second audio clip. Transcribe the lyrics exactly as they are sung in the audio.\nCRITICAL LANGUAGE RULE: You MUST write the lyrics in HINGLISH ONLY (Hindi/Haryanvi words written using the English alphabet). Do NOT use Devanagari script.\nReturn the lyrics in strict LRC format. Every single line MUST start with a timestamp [mm:ss.ms].\nIMPORTANT TYPOGRAPHY RULE: Break the lyrics down into 10 to 13 short lines. Each line should have only 1 to 4 words. The very last line MUST just be 2 to 4 aesthetic emojis chosen ONLY from this specific Reel Emoji Library: 😭 💔 🍷 🫠 😭 💔 🍷 🫠. Do NOT use any other emojis. For example: [00:14.00] 😭💔🍷\n\nReturn JSON format exactly like this: { "syncedLyrics": "string" }`,
        prompt3: `You are an Instagram Reels virality expert. Based on the selected song name "[SONG_NAME]" and the lyrics snippet:
"[LYRICS]"
Generate a list of 8-10 highly targeted viral hashtags. You MUST find and extract relevant keywords, emotions, themes, and song specific terms directly from the song name "[SONG_NAME]" and the lyrics "[LYRICS]" (the reel composition) to include in the hashtags, combined with standard high-reach aesthetic tags (e.g. #sadreels, #brokenheart, #explorepage, #feelitreelit).
Return JSON format exactly like this:
{
  "viralHashtags": "string"
}`
      },
      'Split Meme': {
        prompt1: `You are a viral TikTok/Reels expert. Suggest 3 distinct trending songs right now with a **party / club** vibe (ONLY Hindi or Haryanvi, NO English). For each song, give me the song name, the exact YouTube search query to find the best short/audio, and the exact start time in seconds of the best 15-second drop/hook.\nReturn JSON format exactly like this: { "songs": [ { "songName": "string", "youtubeSearchQuery": "string", "viralHookStartTime": number } ] }`,
        prompt2: `Listen to this 15-second audio clip. Transcribe the lyrics exactly as they are sung in the audio.\nCRITICAL LANGUAGE RULE: You MUST write the lyrics in HINGLISH ONLY (Hindi/Haryanvi words written using the English alphabet). Do NOT use Devanagari script.\nReturn the lyrics in strict LRC format. Every single line MUST start with a timestamp [mm:ss.ms].\nIMPORTANT TYPOGRAPHY RULE: Break the lyrics down into 10 to 13 short lines. Each line should have only 1 to 4 words. The very last line MUST just be 2 to 4 aesthetic emojis chosen ONLY from this specific Reel Emoji Library: 🫠 😋 🫣 🤙 🫠 😋 🫣 🤙. Do NOT use any other emojis. For example: [00:14.00] 🫠😋🫣\n\nReturn JSON format exactly like this: { "syncedLyrics": "string" }`,
        prompt3: `You are an Instagram Reels virality expert. Based on the selected song name "[SONG_NAME]" and the lyrics snippet:
"[LYRICS]"
Generate a list of 8-10 highly targeted viral hashtags. You MUST find and extract relevant keywords, emotions, themes, and song specific terms directly from the song name "[SONG_NAME]" and the lyrics "[LYRICS]" (the reel composition) to include in the hashtags, combined with standard high-reach aesthetic tags (e.g. #memesdaily, #explorepage, #funnyreels, #trendingreels).
Return JSON format exactly like this:
{
  "viralHashtags": "string"
}`
      },
      'Classic Quote': {
        prompt1: `You are a viral TikTok/Reels expert. Suggest 3 distinct trending songs right now with a **lofi / chill** vibe (ONLY Hindi or Haryanvi, NO English). For each song, give me the song name, the exact YouTube search query to find the best short/audio, and the exact start time in seconds of the best 15-second drop/hook.\nReturn JSON format exactly like this: { "songs": [ { "songName": "string", "youtubeSearchQuery": "string", "viralHookStartTime": number } ] }`,
        prompt2: `Listen to this 15-second audio clip. Transcribe the lyrics exactly as they are sung in the audio.\nCRITICAL LANGUAGE RULE: You MUST write the lyrics in HINGLISH ONLY (Hindi/Haryanvi words written using the English alphabet). Do NOT use Devanagari script.\nReturn the lyrics in strict LRC format. Every single line MUST start with a timestamp [mm:ss.ms].\nIMPORTANT TYPOGRAPHY RULE: Break the lyrics down into 10 to 13 short lines. Each line should have only 1 to 4 words. The very last line MUST just be 2 to 4 aesthetic emojis chosen ONLY from this specific Reel Emoji Library: ✨ 🤍 💕 💫 ✨ 🤍 💕 💫. Do NOT use any other emojis. For example: [00:14.00] ✨🤍💫\n\nReturn JSON format exactly like this: { "syncedLyrics": "string" }`,
        prompt3: `You are an Instagram Reels virality expert. Based on the selected song name "[SONG_NAME]" and the lyrics snippet:
"[LYRICS]"
Generate a list of 8-10 highly targeted viral hashtags. You MUST find and extract relevant keywords, emotions, themes, and song specific terms directly from the song name "[SONG_NAME]" and the lyrics "[LYRICS]" (the reel composition) to include in the hashtags, combined with standard high-reach aesthetic tags (e.g. #lofireels, #chillvibes, #explorepage, #aestheticreels).
Return JSON format exactly like this:
{
  "viralHashtags": "string"
}`
      },
      Vibe: {
        prompt1: `You are a viral TikTok/Reels expert. Suggest 3 distinct trending songs right now with a **retro remix** vibe (ONLY Hindi or Haryanvi, NO English). For each song, give me the song name, the exact YouTube search query to find the best short/audio, and the exact start time in seconds of the best 15-second drop/hook.\nReturn JSON format exactly like this: { "songs": [ { "songName": "string", "youtubeSearchQuery": "string", "viralHookStartTime": number } ] }`,
        prompt2: `Listen to this 15-second audio clip. Transcribe the lyrics exactly as they are sung in the audio.\nCRITICAL LANGUAGE RULE: You MUST write the lyrics in HINGLISH ONLY (Hindi/Haryanvi words written using the English alphabet). Do NOT use Devanagari script.\nReturn the lyrics in strict LRC format. Every single line MUST start with a timestamp [mm:ss.ms].\nIMPORTANT TYPOGRAPHY RULE: Break the lyrics down into 10 to 13 short lines. Each line should have only 1 to 4 words. The very last line MUST just be 2 to 4 aesthetic emojis chosen ONLY from this specific Reel Emoji Library: ✨ 🤍 💕 🫣 🫠 😭 💔 💫 🍷 😋 🙄 😫 🤙. Do NOT use any other emojis (no fire, loud, or celebration emojis). For example: [00:14.00] ✨🤍💫\n\nReturn JSON format exactly like this: { "syncedLyrics": "string" }`,
        prompt3: `You are an Instagram Reels virality expert. Based on the selected song name "[SONG_NAME]" and the lyrics snippet:
"[LYRICS]"
Generate a list of 8-10 highly targeted viral hashtags. You MUST find and extract relevant keywords, emotions, themes, and song specific terms directly from the song name "[SONG_NAME]" and the lyrics "[LYRICS]" (the reel composition) to include in the hashtags, combined with standard high-reach aesthetic tags (e.g. #explorepage, #aestheticreels, #feelitreelit, #viralreels).
Return JSON format exactly like this:
{
  "viralHashtags": "string"
}`
      }
    };

    const saved = localStorage.getItem(uk('aaisuu_blueprint_prompts'));
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const prompt3IsStale = parsed.Lyrics && parsed.Lyrics.prompt3 && (parsed.Lyrics.prompt3.includes('thumbnail') || !parsed.Lyrics.prompt3.includes('the reel composition'));
        // Force a reset if the saved prompt1 still expects a single songName JSON return or prompt3 is stale
        if ((parsed.Lyrics && parsed.Lyrics.prompt1 && parsed.Lyrics.prompt1.includes('"songName":')) || prompt3IsStale) {
          localStorage.removeItem(uk('aaisuu_blueprint_prompts'));
        } else {
          // Merge default prompt3 if missing
          Object.keys(defaultPrompts).forEach(key => {
            if (parsed[key]) {
              if (!parsed[key].prompt3) {
                parsed[key].prompt3 = defaultPrompts[key].prompt3;
              }
            } else {
              parsed[key] = defaultPrompts[key];
            }
          });
          return parsed;
        }
      } catch (e) {}
    }
    return defaultPrompts;
  });

  useEffect(() => {
    localStorage.setItem(uk('aaisuu_blueprint_prompts'), JSON.stringify(blueprintPrompts));
  }, [blueprintPrompts]);

  useEffect(() => {
    localStorage.setItem(uk('aaisuu_system_on'), systemOn ? 'true' : 'false');
  }, [systemOn]);

  useEffect(() => {
    localStorage.setItem(uk('aaisuu_agent_rules'), JSON.stringify(rules));
  }, [rules]);

  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(() => {
    return localStorage.getItem(uk('aaisuu_selected_account')) || 'all';
  });
  
  useEffect(() => {
    localStorage.setItem(uk('aaisuu_selected_account'), selectedAccount);
  }, [selectedAccount]);

  const dropdownRef = useRef(null);

  const { blueprints, setBlueprints, connectedAccounts, apiKeys, saveApiKeys } = useApp();

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowAccountDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Sync selectedAccount with connected accounts to handle deletions/disconnects
  useEffect(() => {
    if (selectedAccount !== 'all' && selectedAccount !== '') {
      const activeInstagrams = connectedAccounts?.instagram || [];
      const activeLinkedins = connectedAccounts?.linkedin || [];
      const activeYoutube = connectedAccounts?.youtubeChannel;
      
      const isInstagramConnected = activeInstagrams.some(acc => `@${acc.username}` === selectedAccount);
      const isLinkedinConnected = activeLinkedins.some(acc => acc.name === selectedAccount);
      const isYoutubeConnected = activeYoutube && activeYoutube.channelName === selectedAccount;
      
      if (!isInstagramConnected && !isLinkedinConnected && !isYoutubeConnected) {
        setSelectedAccount('');
      }
    }
  }, [connectedAccounts, selectedAccount]);

  const publishAccounts = [];
  if (connectedAccounts?.instagram) {
    connectedAccounts.instagram.forEach(acc => {
      publishAccounts.push({ id: acc.id, username: acc.username, name: `@${acc.username}`, platform: 'Instagram', avatar: acc.avatar });
    });
  }
  if (connectedAccounts?.linkedin) {
    connectedAccounts.linkedin.forEach(acc => {
      publishAccounts.push({ id: acc.id, username: acc.username, name: acc.name, platform: 'LinkedIn', avatar: acc.avatar });
    });
  }
  if (connectedAccounts?.youtubeChannel) {
    const yt = connectedAccounts.youtubeChannel;
    publishAccounts.push({ id: 'youtube', username: yt.channelId, name: yt.channelName, platform: 'YouTube', avatar: yt.avatar });
  }

  // ─── Auto-Post Logic (every 4 hours when system is ON) ───
  const AUTO_POST_INTERVAL_MS = 4 * 60 * 60 * 1000; // 4 hours

  const autoPostOneReel = useCallback(async () => {
    // Find the first 'upcoming' reel with a videoUrl across all blueprints
    let targetReel = null;
    let targetBlueprintName = null;
    for (const bpName of Object.keys(blueprints)) {
      const bp = blueprints[bpName];
      if (bp && bp.generated) {
        const candidate = bp.generated.find(r => r.status === 'upcoming' && r.videoUrl);
        if (candidate) {
          targetReel = candidate;
          targetBlueprintName = bpName;
          break;
        }
      }
    }

    if (!targetReel) {
      console.log('[Auto-Post] No upcoming reels with video found. Skipping cycle.');
      setToastMessage('Auto-Post: No upcoming reels to post. Generate more reels!');
      return;
    }

    // Determine target account (prefer selectedAccount, fallback to first Instagram)
    let targetAcc = selectedAccount;
    if (!targetAcc || targetAcc === 'all') {
      const firstIg = publishAccounts.find(a => a.platform === 'Instagram');
      if (firstIg) {
        targetAcc = firstIg.name;
      } else {
        console.log('[Auto-Post] No Instagram account connected. Skipping.');
        setToastMessage('Auto-Post: No Instagram account selected. Please connect one.');
        return;
      }
    }

    const username = targetAcc.startsWith('@') ? targetAcc.substring(1) : targetAcc;

    // Compose full caption with hashtags
    let fullCaption = (targetReel.caption || '').trim();
    const hashtagParts = [];
    if (targetReel.viralHashtags) hashtagParts.push(targetReel.viralHashtags.trim());
    if (targetReel.viralReachHashtags) hashtagParts.push(targetReel.viralReachHashtags.trim());
    if (hashtagParts.length > 0) {
      fullCaption += '\n\n' + hashtagParts.join(' ');
    }

    console.log(`[Auto-Post] Uploading "${targetReel.name}" to ${targetAcc}...`);
    setAutoPostStatus(prev => ({ ...prev, isPosting: true }));
    setToastMessage(`Auto-Post: Uploading "${targetReel.name}" to ${targetAcc}...`);

    try {
      const response = await fetch('/api/instagram/launch-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          reelName: targetReel.name,
          videoUrl: targetReel.videoUrl,
          caption: fullCaption
        })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Upload failed');
      }

      // Mark as posted
      const bp = blueprints[targetBlueprintName];
      if (bp) {
        const updatedGenerated = bp.generated.map(r => r.id === targetReel.id ? { ...r, status: 'ready', uploadedTo: targetAcc } : r);
        setBlueprints({
          ...blueprints,
          [targetBlueprintName]: { ...bp, generated: updatedGenerated }
        });
      }

      const now = new Date();
      setAutoPostStatus(prev => ({
        ...prev,
        isPosting: false,
        lastPosted: { name: targetReel.name, time: now.toLocaleTimeString(), account: targetAcc },
        nextPostTime: new Date(now.getTime() + AUTO_POST_INTERVAL_MS)
      }));
      setToastMessage(`Auto-Post: "${targetReel.name}" uploaded to ${targetAcc}! Next post in 4 hours.`);
      console.log(`[Auto-Post] Successfully posted "${targetReel.name}" to ${targetAcc}.`);
    } catch (e) {
      console.error('[Auto-Post] Upload failed:', e.message);
      setAutoPostStatus(prev => ({ ...prev, isPosting: false }));
      setToastMessage(`Auto-Post failed: ${e.message}`);
    }
  }, [blueprints, setBlueprints, selectedAccount, publishAccounts, setToastMessage]);

  useEffect(() => {
    if (systemOn) {
      console.log('[Auto-Post] System ON — starting auto-poster (every 4 hours).');
      setToastMessage('Auto-Post daemon activated! First post in 4 hours.');

      const now = new Date();
      setAutoPostStatus(prev => ({
        ...prev,
        nextPostTime: new Date(now.getTime() + AUTO_POST_INTERVAL_MS)
      }));

      // Clear any existing interval
      if (autoPostIntervalRef.current) clearInterval(autoPostIntervalRef.current);

      autoPostIntervalRef.current = setInterval(() => {
        autoPostOneReel();
      }, AUTO_POST_INTERVAL_MS);

      return () => {
        if (autoPostIntervalRef.current) {
          clearInterval(autoPostIntervalRef.current);
          autoPostIntervalRef.current = null;
        }
      };
    } else {
      // System OFF — stop auto-poster
      if (autoPostIntervalRef.current) {
        clearInterval(autoPostIntervalRef.current);
        autoPostIntervalRef.current = null;
      }
      setAutoPostStatus({ lastPosted: null, nextPostTime: null, isPosting: false });
    }
  }, [systemOn]);

  // Countdown ticker for next post time
  const [autoPostCountdown, setAutoPostCountdown] = useState('');
  useEffect(() => {
    if (!systemOn || !autoPostStatus.nextPostTime) {
      setAutoPostCountdown('');
      return;
    }
    const tick = () => {
      const diff = autoPostStatus.nextPostTime.getTime() - Date.now();
      if (diff <= 0) {
        setAutoPostCountdown('Posting now...');
        return;
      }
      const hrs = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      setAutoPostCountdown(`${hrs}h ${mins}m ${secs}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [systemOn, autoPostStatus.nextPostTime]);

  return (
    <div className="reel-page page-container">
      {/* Header */}
      <div className="reel-header">
        <div className="reel-header-left">
          <h2>
            <HiOutlineFilm className="icon" />
            AI Reel Agent Hub
          </h2>
          <p>
            Design visual templates, manage content streams, and control the global publishing pipeline.
          </p>
        </div>
        <div className="reel-header-right">
          <div className="reel-master-switch">
            <span>SYSTEM {systemOn ? 'ON' : 'OFF'}</span>
            <div
              className={`switch-toggle ${systemOn ? 'on' : ''}`}
              onClick={() => setSystemOn(!systemOn)}
              role="button"
              tabIndex={0}
              id="system-toggle"
            />
          </div>
          {systemOn && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: '8px', borderLeft: '1px solid rgba(255,255,255,0.06)', paddingLeft: '8px' }}>
              <span style={{ color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: autoPostStatus.isPosting ? '#f59e0b' : '#10b981', display: 'inline-block', animation: autoPostStatus.isPosting ? 'pulse 1s infinite' : 'none' }} />
                {autoPostStatus.isPosting ? 'POSTING...' : 'AUTO-POST ACTIVE'}
              </span>
              {autoPostCountdown && <span>Next: {autoPostCountdown}</span>}
              {autoPostStatus.lastPosted && (
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>Last: {autoPostStatus.lastPosted.name} @ {autoPostStatus.lastPosted.time}</span>
              )}
            </div>
          )}
          <div className="reel-account-dropdown-wrapper" ref={dropdownRef}>
            <button className="reel-scope-btn" onClick={() => setShowAccountDropdown(!showAccountDropdown)}>
              <HiOutlineAdjustments />
              {publishAccounts.length === 0 ? 'No Accounts' : (!selectedAccount ? 'No Account Selected' : (selectedAccount === 'all' ? 'Global (All)' : selectedAccount))}
            </button>
            
            {showAccountDropdown && (
              <div className="reel-account-dropdown">
                <button 
                  className={`reel-account-item ${selectedAccount === 'all' ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedAccount('all');
                    setShowAccountDropdown(false);
                  }}
                >
                  <HiOutlineUserCircle />
                  <span>Global (All)</span>
                </button>
                
                {connectedAccounts?.instagram?.length > 0 && (
                  <>
                    <div className="reel-account-group-header">Instagram</div>
                    {connectedAccounts.instagram.map(acc => (
                      <button 
                        key={acc.id} 
                        className={`reel-account-item ${selectedAccount === `@${acc.username}` ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedAccount(`@${acc.username}`);
                          setShowAccountDropdown(false);
                        }}
                      >
                        <img src={acc.avatar} alt="" style={{ width: '16px', height: '16px', borderRadius: '50%', objectFit: 'cover' }} />
                        <span>@{acc.username}</span>
                      </button>
                    ))}
                  </>
                )}

                {connectedAccounts?.linkedin?.length > 0 && (
                  <>
                    <div className="reel-account-group-header">LinkedIn</div>
                    {connectedAccounts.linkedin.map(acc => (
                      <button 
                        key={acc.id} 
                        className={`reel-account-item ${selectedAccount === acc.name ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedAccount(acc.name);
                          setShowAccountDropdown(false);
                        }}
                      >
                        <img src={acc.avatar} alt="" style={{ width: '16px', height: '16px', borderRadius: '50%', objectFit: 'cover' }} />
                        <span>{acc.name}</span>
                      </button>
                    ))}
                  </>
                )}

                {connectedAccounts?.youtubeChannel && (
                  <>
                    <div className="reel-account-group-header">YouTube</div>
                    <button 
                      className={`reel-account-item ${selectedAccount === connectedAccounts.youtubeChannel.channelName ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedAccount(connectedAccounts.youtubeChannel.channelName);
                        setShowAccountDropdown(false);
                      }}
                    >
                      <img src={connectedAccounts.youtubeChannel.avatar} alt="" style={{ width: '16px', height: '16px', borderRadius: '50%', objectFit: 'cover' }} />
                      <span>{connectedAccounts.youtubeChannel.channelName}</span>
                    </button>
                  </>
                )}
                
                {publishAccounts.length === 0 && (
                  <div style={{ padding: '8px 12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    No accounts connected.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="reel-tabs">
        <Tabs tabs={mainTabs} activeTab={activeTab} onTabChange={setActiveTab} variant="minimal" />
      </div>

      {/* Tab Content */}
      {activeTab === 'pipeline' && (
        <PipelineTab 
          filter={pipelineFilter} 
          setFilter={setPipelineFilter} 
          blueprints={blueprints} 
          setBlueprints={setBlueprints} 
          setToastMessage={setToastMessage}
          selectedAccount={selectedAccount}
          isGenerating={isGenerating}
          activeBlueprint={activeBlueprint}
        />
      )}
      {activeTab === 'matrix' && <MatrixTab activeBlueprint={activeBlueprint} setActiveBlueprint={setActiveBlueprint} blueprints={blueprints} setBlueprints={setBlueprints} setActiveTab={setActiveTab} setPipelineFilter={setPipelineFilter} apiKeys={apiKeys} saveApiKeys={saveApiKeys} isGenerating={isGenerating} setIsGenerating={setIsGenerating} setToastMessage={setToastMessage} captions={captions} blueprintPrompts={blueprintPrompts} />}
      {activeTab === 'agent-rules' && <AgentRulesTab rules={rules} setRules={setRules} captions={captions} setCaptions={setCaptions} setToastMessage={setToastMessage} blueprintPrompts={blueprintPrompts} setBlueprintPrompts={setBlueprintPrompts} />}
      {activeTab === 'workflow' && <WorkflowTab isGenerating={isGenerating} />}

      {/* Persistant Generation Toast Notification */}
      {isGenerating && createPortal(
        <div style={{ position: 'fixed', top: '24px', right: '24px', background: 'rgba(20, 20, 30, 0.95)', border: '1px solid rgba(245, 158, 11, 0.3)', color: 'white', padding: '1.25rem', borderRadius: '12px', zIndex: 100000, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', animation: 'slideInRight 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', transition: 'all 0.3s', backdropFilter: 'blur(10px)', minWidth: '320px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="spinner-loader" style={{ width: '20px', height: '20px', borderTopColor: '#fbbf24', borderWidth: '3px', margin: 0 }} />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '1.02rem', fontWeight: 700, color: '#fbbf24' }}>Reel Synthesis Engine</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#92949c', lineHeight: '1.4' }}>Compiling Pexels HD video background loops, syncs LRC song lyrics, and rendering vertical 1080x1920 reel...</p>
          </div>
        </div>,
        document.body
      )}

      {/* Toast Notification */}
      {toastMessage && createPortal(
        <div style={{ position: 'fixed', top: '24px', right: '24px', background: 'rgba(20, 20, 30, 0.95)', border: '1px solid rgba(236, 72, 153, 0.3)', color: 'white', padding: '1.25rem', borderRadius: '12px', zIndex: 100000, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', animation: 'slideInRight 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', transition: 'all 0.3s', backdropFilter: 'blur(10px)', minWidth: '320px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div style={{ background: 'rgba(236, 72, 153, 0.2)', color: '#ec4899', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HiOutlineCheckCircle style={{ fontSize: '1.5rem' }} />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 600, color: '#f3f4f6' }}>Success</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#9ca3af', lineHeight: '1.4' }}>{toastMessage}</p>
          </div>
          <button style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 0, marginTop: '2px' }} onClick={() => setToastMessage('')}>
            <HiOutlineXCircle style={{ fontSize: '1.2rem' }} />
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}

/* --- Pipeline Tab --- */
function PipelineTab({ filter, setFilter, blueprints, setBlueprints, setToastMessage, selectedAccount, isGenerating, activeBlueprint }) {
  const [playingReel, setPlayingReel] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const mediaRef = React.useRef(null);
  const [showingInfo, setShowingInfo] = useState(false);
  const [schedulingReel, setSchedulingReel] = useState(null);
  const [uploadingReels, setUploadingReels] = useState({});
  const [videoError, setVideoError] = useState(false);

  const { connectedAccounts } = useApp();

  useEffect(() => {
    if (mediaRef.current) {
      if (isPlaying) {
        mediaRef.current.play().catch(e => console.log('Media play error:', e));
      } else {
        mediaRef.current.pause();
      }
    }
  }, [isPlaying, playingReel]);

  const publishAccounts = [];
  if (connectedAccounts?.instagram) {
    connectedAccounts.instagram.forEach(acc => {
      publishAccounts.push({ id: acc.id, username: acc.username, name: `@${acc.username}`, platform: 'Instagram', avatar: acc.avatar });
    });
  }
  if (connectedAccounts?.linkedin) {
    connectedAccounts.linkedin.forEach(acc => {
      publishAccounts.push({ id: acc.id, username: acc.username, name: acc.name, platform: 'LinkedIn', avatar: acc.avatar });
    });
  }
  if (connectedAccounts?.youtubeChannel) {
    const yt = connectedAccounts.youtubeChannel;
    publishAccounts.push({ id: 'youtube', username: yt.channelId, name: yt.channelName, platform: 'YouTube', avatar: yt.avatar });
  }

  // Collect all generated reels from all blueprints
  const allReels = [];

  if (isGenerating) {
    allReels.push({
      id: 'generating_temp',
      name: 'Generating viral video package...',
      duration: '15s',
      hook: '--',
      date: new Date().toISOString().split('T')[0],
      status: 'generating',
      blueprint: activeBlueprint || 'Lyrics',
      lyrics: 'Compiling Pexels HD video background loops, syncs LRC song lyrics, and rendering vertical 1080x1920 reel...',
      viralHashtags: '#processing #reels #ai',
      viralReachHashtags: ''
    });
  }

  Object.keys(blueprints).forEach(bpName => {
    const bp = blueprints[bpName];
    if (bp && bp.generated) {
      bp.generated.forEach(reel => {
        allReels.push({ ...reel, blueprint: bpName, lyrics: reel.lyricsSnapshot || bp.lyrics || '' });
      });
    }
  });

  // Filter reels by status
  const filteredReels = filter === 'published'
    ? allReels.filter(r => r.status === 'ready')
    : filter === 'failed'
    ? allReels.filter(r => r.status === 'failed')
    : filter === 'verified'
    ? allReels.filter(r => r.status === 'verified')
    : allReels.filter(r => r.status === 'upcoming' || r.status === 'scheduled' || r.status === 'generating');

  const handleDelete = (reelId, blueprintName) => {
    const bp = blueprints[blueprintName];
    if (!bp) return;
    const updatedGenerated = bp.generated.filter(r => r.id !== reelId);
    setBlueprints({
      ...blueprints,
      [blueprintName]: {
        ...bp,
        generated: updatedGenerated
      }
    });
  };

  const filterTabs = [
    { id: 'upcoming', label: 'Upcoming', icon: <HiOutlineClock />, count: allReels.filter(r => r.status === 'upcoming' || r.status === 'scheduled' || r.status === 'generating').length },
    { id: 'verified', label: 'Verified', icon: <HiOutlineShieldCheck />, count: allReels.filter(r => r.status === 'verified').length },
    { id: 'published', label: 'Published', icon: <HiOutlineCheckCircle />, count: allReels.filter(r => r.status === 'ready').length },
    { id: 'failed', label: 'Failed', icon: <HiOutlineXCircle />, count: allReels.filter(r => r.status === 'failed').length },
  ];

  const handleVerify = (reelId, blueprintName) => {
    const bp = blueprints[blueprintName];
    if (!bp) return;
    const updatedGenerated = bp.generated.map(r => r.id === reelId ? { ...r, status: 'verified' } : r);
    setBlueprints({
      ...blueprints,
      [blueprintName]: { ...bp, generated: updatedGenerated }
    });
  };

  const handleDownload = (reel) => {
    const url = reel.videoUrl || reel.audioUrl;
    if (!url) {
      setToastMessage('Media not generated yet.');
      return;
    }
    const link = document.createElement('a');
    link.href = url;
    const ext = url.split('.').pop() || 'mp4';
    link.download = `${reel.name}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToastMessage(`Downloading ${reel.name}...`);
  };

  const handleUpload = async (reelId, blueprintName) => {
    const bp = blueprints[blueprintName];
    if (!bp) return;
    const reelObj = bp.generated.find(r => r.id === reelId);
    const targetAcc = selectedAccount;
    
    if (targetAcc === 'all' || !targetAcc) {
      if (setToastMessage) setToastMessage('Please select a specific Instagram account from the top right dropdown first.');
      return;
    }

    if (setToastMessage) setToastMessage(`Uploading Reel to ${targetAcc}...`);
    setUploadingReels(prev => ({ ...prev, [reelId]: true }));
      
    // Trigger backend agent to open Chrome testing for this account
    const username = targetAcc.startsWith('@') ? targetAcc.substring(1) : targetAcc;

    // Compose full caption: caption text + hashtags (viral + high-reach)
    let fullCaption = (reelObj.caption || '').trim();
    const hashtagParts = [];
    if (reelObj.viralHashtags) hashtagParts.push(reelObj.viralHashtags.trim());
    if (reelObj.viralReachHashtags) hashtagParts.push(reelObj.viralReachHashtags.trim());
    if (hashtagParts.length > 0) {
      fullCaption += '\n\n' + hashtagParts.join(' ');
    }

    try {
      const response = await fetch('/api/instagram/launch-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username, 
          reelName: reelObj.name, 
          videoUrl: reelObj.videoUrl, 
          caption: fullCaption 
        })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to upload reel');
      }
      
      const updatedGenerated = bp.generated.map(r => r.id === reelId ? { ...r, status: 'ready', uploadedTo: targetAcc } : r);
      setBlueprints({
        ...blueprints,
        [blueprintName]: { ...bp, generated: updatedGenerated }
      });
      setUploadingReels(prev => ({ ...prev, [reelId]: false }));
      if (setToastMessage) {
        setToastMessage(`Reel successfully uploaded to ${targetAcc}!`);
      }
    } catch (e) {
      console.error('Failed to launch upload browser:', e);
      setUploadingReels(prev => ({ ...prev, [reelId]: false }));
      if (setToastMessage) setToastMessage(`Failed to upload: ${e.message}`);
    }
  };

  const handleScheduleConfirm = (date) => {
    if (!schedulingReel) return;
    const bp = blueprints[schedulingReel.blueprint];
    if (!bp) return;
    const updatedGenerated = bp.generated.map(r => r.id === schedulingReel.id ? { ...r, status: 'scheduled', scheduledDate: date } : r);
    setBlueprints({
      ...blueprints,
      [schedulingReel.blueprint]: { ...bp, generated: updatedGenerated }
    });
    setPlayingReel(prev => prev && prev.id === schedulingReel.id ? { ...prev, status: 'scheduled', scheduledDate: date } : prev);
    setSchedulingReel(null);
  };

  // Lyrics Parsing for Sync
  const parsedLyrics = playingReel ? playingReel.lyrics.split('\n').map(line => {
    const match = line.match(/\[(\d+):(\d+\.\d+)\]\s*(.*)/);
    if (match) {
      const min = parseInt(match[1]);
      const sec = parseFloat(match[2]);
      return { time: min * 60 + sec, text: match[3].trim() };
    }
    return { time: 0, text: line.trim() };
  }).filter(l => l.text) : [];

  const handleTimeUpdate = (e) => {
    setCurrentTime(e.target.currentTime);
  };

  const handleLoadedMetadata = (e) => {
    setDuration(e.target.duration);
  };

  const togglePlay = () => {
    if (mediaRef.current) {
      if (isPlaying) {
        mediaRef.current.pause();
      } else {
        mediaRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (mediaRef.current) {
      mediaRef.current.currentTime = time;
    }
  };

  const getActiveIndex = () => {
    let activeIdx = -1;
    for (let i = 0; i < parsedLyrics.length; i++) {
      if (currentTime >= parsedLyrics[i].time) {
        activeIdx = i;
      }
    }
    return activeIdx;
  };
  const activeIndex = getActiveIndex();

  return (
    <div className="pipeline-section animate-fade-in">
      <div className="pipeline-split-layout">
        {/* Left Side: List & Grid */}
        <div className="pipeline-split-left">
          <div className="pipeline-header-row">
            <div>
              <h3>Pipeline Dashboard</h3>
              <p>Manage your drafts, scheduled posts, and view published analytics.</p>
            </div>
          </div>

          <div className="pipeline-filters">
            <Tabs tabs={filterTabs} activeTab={filter} onTabChange={setFilter} />
          </div>

          {filteredReels.length === 0 ? (
        <div className="glass-card">
          <div className="pipeline-empty">
            <div className="pipeline-empty-icon"><HiOutlineClock /></div>
            <p>No {filter} items found</p>
          </div>
        </div>
      ) : (
        <div className="pipeline-reel-grid">
          {filteredReels.map(reel => (
            <div key={reel.id} className="pipeline-reel-card glass-card">
              {/* Interactive phone-frame preview */}
              <div 
                className={`pipeline-phone-frame ${reel.status === 'generating' ? '' : 'interactive'}`}
                onClick={() => {
                  if (reel.status === 'generating') return;
                  const isSame = playingReel?.id === reel.id;
                  if (isSame) {
                    setIsPlaying(!isPlaying);
                    if (showingInfo) {
                      setShowingInfo(false);
                    }
                  } else {
                    setPlayingReel(reel);
                    setVideoError(false);
                    setCurrentTime(0);
                    setIsPlaying(true);
                    setShowingInfo(false);
                  }
                }}
              >
                {reel.status !== 'generating' && (
                  <div className="pipeline-phone-overlay">
                    {playingReel?.id === reel.id && isPlaying ? <HiOutlinePause className="play-icon" /> : <HiOutlinePlay className="play-icon" />}
                  </div>
                )}
                <div className="pipeline-phone-screen">
                  {reel.status === 'generating' ? (
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(20,20,30,0.85)', gap: '12px', zIndex: 5, padding: '10px' }}>
                      <span className="spinner-loader" style={{ width: '24px', height: '24px', borderTopColor: '#fbbf24', borderWidth: '3px' }} />
                      <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#fbbf24', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rendering Video...</span>
                    </div>
                  ) : reel.videoUrl ? (
                    <video
                      className="pipeline-background-video"
                      src={window.resolveUrl(reel.videoUrl)}
                      autoPlay
                      loop
                      muted
                      playsInline
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        zIndex: 1,
                        opacity: 0.6
                      }}
                    />
                  ) : null}
                  <div className="pipeline-lyrics-static">
                    {reel.lyrics.split('\n')
                      .filter(line => line.trim())
                      .slice(0, 3)
                      .map((line, i) => (
                        <div key={i} className="pipeline-lyric-line">
                          {line.replace(/\[\d+:\d+\.\d+\]\s*/, '').trim()}
                        </div>
                      ))
                    }
                    {reel.lyrics.split('\n').filter(line => line.trim()).length > 3 && (
                      <div className="pipeline-lyric-line" style={{ opacity: 0.5, fontSize: '0.45rem' }}>...</div>
                    )}
                  </div>
                  <div className="pipeline-phone-watermark">AaisuuSync</div>
                </div>
              </div>
              {/* Reel info */}
              <div className="pipeline-reel-info">
                {/* Badges Row */}
                <div className="pipeline-reel-badges">
                  <span className="pipeline-badge-pill outline">{reel.blueprint.toUpperCase()}</span>
                  {reel.status === 'generating' ? (
                    <span className="pipeline-badge-pill status-generating" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 8px' }}>
                      <span className="spinner-loader" style={{ width: '10px', height: '10px', borderTopColor: '#fbbf24', borderWidth: '1.5px', margin: 0 }} />
                      GENERATING...
                    </span>
                  ) : reel.status === 'upcoming' ? (
                    <span className="pipeline-badge-pill upload-icon-only" style={{ padding: '4px 8px', cursor: 'pointer', background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)' }} onClick={() => handleUpload(reel.id, reel.blueprint)}>
                      <HiOutlineUpload size={16} />
                    </span>
                  ) : (
                    <span className={`pipeline-badge-pill status-${reel.status}`}>
                      {reel.status === 'ready' ? <HiOutlineCheckCircle /> : reel.status === 'verified' ? <HiOutlineShieldCheck /> : <HiOutlineClock />} 
                      {reel.status.toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h5 className="pipeline-reel-title">{reel.name.replace('Lyrics Typography Reel', 'Kitab - Female Version')}</h5>

                {/* Stats Grid */}
                <div className="pipeline-reel-stats">
                  <div className="pipeline-stat-box full-width"><HiOutlineClock /> {reel.duration}</div>
                  {reel.status === 'ready' && (
                    <div className="pipeline-stat-box full-width" style={{ color: 'var(--success)' }}>
                      Uploaded to {reel.uploadedTo || 'Global (All)'}
                    </div>
                  )}
                </div>

                {/* Actions Grid */}
                <div className="pipeline-reel-actions-grid">
                  {reel.status === 'generating' ? (
                    <button className="grid-action-btn info disabled" style={{ gridColumn: 'span 4', cursor: 'not-allowed', opacity: 0.6, background: '#1c1d24', border: '1px solid rgba(255,255,255,0.05)', color: '#5f616b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} disabled>
                      <span className="spinner-loader" style={{ width: '12px', height: '12px', borderTopColor: '#fbbf24', borderWidth: '2px' }} />
                      Synthesis Queue Active...
                    </button>
                  ) : (
                    <>
                      <button className={`grid-action-btn info ${showingInfo && playingReel?.id === reel.id ? 'active' : ''}`} onClick={() => {
                        const isNew = playingReel?.id !== reel.id;
                        if (isNew) {
                          setPlayingReel(reel);
                          setVideoError(false);
                          setCurrentTime(0);
                        }
                        setIsPlaying(false);
                        setShowingInfo(isNew ? true : !showingInfo);
                      }}>
                        <HiOutlineInformationCircle /> Info
                      </button>
                      
                      {/* Primary Action */}
                      {reel.status === 'verified' || reel.status === 'scheduled' || reel.status === 'ready' ? (
                        <button className="grid-action-btn upload" onClick={() => handleUpload(reel.id, reel.blueprint)} disabled={uploadingReels[reel.id] || publishAccounts.length === 0}>
                          <HiOutlineUpload /> Upload
                        </button>
                      ) : (
                        <button className="grid-action-btn check" onClick={() => handleVerify(reel.id, reel.blueprint)}>
                          <HiOutlineCheck /> Verify
                        </button>
                      )}

                      {/* Download */}
                      <button className="grid-action-btn download" onClick={() => handleDownload(reel)}>
                        <HiOutlineDownload /> Download
                      </button>

                      {/* Delete */}
                      <button className="grid-action-btn delete" onClick={() => handleDelete(reel.id, reel.blueprint)}>
                        <HiOutlineTrash /> Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
        </div>

        {/* Right Side: Fixed Player Panel */}
        <div className="pipeline-split-right">
          <div className="pipeline-fixed-player-panel glass-card">
            {playingReel ? (
              showingInfo ? (
                <div className="pipeline-info-details-panel">
                  <div className="info-panel-header">
                    <h3><HiOutlineInformationCircle style={{ color: 'var(--pink)', fontSize: '1.2rem' }} /> Reel Details</h3>
                    <button className="info-panel-close" onClick={() => setShowingInfo(false)}>
                      <HiOutlineXCircle />
                    </button>
                  </div>
                  
                  <div className="info-panel-content">
                    {/* Song Details */}
                    <div className="info-detail-section">
                      <div className="info-label">Song Name</div>
                      <div className="info-value song-name"><HiOutlineMusicNote /> {playingReel.name}</div>
                    </div>

                    {/* Blueprint & Created Date */}
                    <div className="info-details-row">
                      <div className="info-detail-section">
                        <div className="info-label">Blueprint</div>
                        <div className="info-value blueprint-badge">{playingReel.blueprint.toUpperCase()}</div>
                      </div>
                      <div className="info-detail-section">
                        <div className="info-label">Created Date</div>
                        <div className="info-value">{playingReel.date}</div>
                      </div>
                    </div>

                    {/* Schedule */}
                    <div className="info-detail-section">
                      <div className="info-label">Schedule Info</div>
                      <div 
                        className="info-value schedule-info" 
                        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} 
                        onClick={() => setSchedulingReel(playingReel)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <HiOutlineCalendar /> 
                          <span>{playingReel.scheduledDate ? `Scheduled: ${playingReel.scheduledDate}` : 'Not scheduled yet (Click to schedule)'}</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: '600' }}>Edit</span>
                      </div>
                    </div>

                    {/* Caption & Hashtags */}
                    <div className="info-detail-section">
                      <div className="info-label">Caption & Hashtags</div>
                      <textarea
                        className="info-caption-textarea"
                        value={playingReel.caption || ''}
                        onChange={(e) => {
                          const newCaption = e.target.value;
                          setPlayingReel(prev => ({ ...prev, caption: newCaption }));
                          const bp = blueprints[playingReel.blueprint];
                          if (bp) {
                            const updatedGenerated = bp.generated.map(r => r.id === playingReel.id ? { ...r, caption: newCaption } : r);
                            setBlueprints({
                              ...blueprints,
                              [playingReel.blueprint]: { ...bp, generated: updatedGenerated }
                            });
                          }
                        }}
                        style={{
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          borderRadius: 'var(--radius-md)',
                          padding: '10px 14px',
                          fontSize: '0.825rem',
                          color: '#e5e7eb',
                          lineHeight: '1.5',
                          minHeight: '80px',
                          resize: 'vertical',
                          outline: 'none',
                          fontFamily: 'inherit'
                        }}
                      />
                    </div>

                    {/* Thumbnail & Virality Plan Card */}
                    <div className="info-detail-section virality-plan-card">
                      <div className="info-label">Virality Plan</div>
                      <div className="virality-card-body">
                        <div className="hashtags-box" style={{ marginTop: 0 }}>
                          <span className="virality-icon-label">🔥 Viral Hashtags:</span>
                          <div className="hashtag-badges">
                            {(playingReel.viralHashtags || '#aesthetic #lyrics #reels #explorepage #feelitreelit #trendingreels #hindisongs #lofi')
                              .split(/\s+/)
                              .filter(tag => tag.startsWith('#'))
                              .map((tag, idx) => (
                                <span key={idx} className="hashtag-badge">{tag}</span>
                              ))
                            }
                          </div>
                        </div>
                        {playingReel.viralReachHashtags && (
                          <div className="hashtags-box" style={{ marginTop: '12px' }}>
                            <span className="virality-icon-label" style={{ color: '#f472b6' }}>📈 High-Reach Hashtags:</span>
                            <div className="hashtag-badges">
                              {playingReel.viralReachHashtags
                                .split(/\s+/)
                                .filter(tag => tag.startsWith('#'))
                                .map((tag, idx) => (
                                  <span key={idx} className="hashtag-badge" style={{ background: 'rgba(236, 72, 153, 0.12)', color: '#f472b6', border: '1px solid rgba(236, 72, 153, 0.25)' }}>{tag}</span>
                                ))
                              }
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Lyrics */}
                    <div className="info-detail-section">
                      <div className="info-label">Lyrics</div>
                      <div className="info-lyrics-container">
                        {playingReel.lyrics.split('\n').map((line, i) => (
                          <div key={i} className="info-lyric-line">{line}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pipeline-play-container inline">
                  <div className="pipeline-play-canvas" style={{ background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {playingReel.videoUrl && !videoError ? (
                      <video
                        key={playingReel.id || playingReel.videoUrl}
                        ref={mediaRef}
                        src={window.resolveUrl(playingReel.videoUrl)}
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onEnded={() => setIsPlaying(false)}
                        onClick={togglePlay}
                        onError={() => {
                          console.log('Video error, falling back to audio/lyrics preview');
                          setVideoError(true);
                        }}
                        autoPlay
                        loop
                        playsInline
                        style={{ width: '100%', height: '100%', borderRadius: '16px', objectFit: 'contain', background: '#000', cursor: 'pointer' }}
                      />
                    ) : (
                      <div className="pipeline-play-screen">
                        <audio 
                          ref={mediaRef}
                          src={window.resolveUrl(playingReel.audioUrl || "/uploads/kitab_song_trimmed.mp3")}
                          onTimeUpdate={handleTimeUpdate}
                          onLoadedMetadata={handleLoadedMetadata}
                          onPlay={() => setIsPlaying(true)}
                          onPause={() => setIsPlaying(false)}
                          onEnded={() => setIsPlaying(false)}
                          onError={(e) => {
                            if (e.target.src !== window.resolveUrl("/uploads/kitab_song_trimmed.mp3")) {
                              e.target.src = window.resolveUrl("/uploads/kitab_song_trimmed.mp3");
                            }
                          }}
                        />
                        <div className="pipeline-lyrics-overlay">
                          <div className="pipeline-lyrics-static expanded">
                            {parsedLyrics.map((line, i) => (
                              <div 
                                key={i} 
                                className={`pipeline-lyric-line ${i === activeIndex ? 'active' : ''}`}
                              >
                                {line.text}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="pipeline-phone-watermark">AaisuuSync</div>
                      </div>
                    )}
                  </div>
                  <div className="pipeline-play-controls">
                    <button className="pipeline-play-toggle" onClick={togglePlay}>
                      {isPlaying ? <HiOutlinePause /> : <HiOutlinePlay />}
                    </button>
                    <input 
                      type="range" 
                      className="pipeline-scrubber" 
                      min="0" 
                      max={duration || 100} 
                      step="0.1"
                      value={currentTime} 
                      onChange={handleSeek} 
                      style={{ backgroundSize: `${(currentTime / (duration || 1)) * 100}% 100%` }}
                    />
                    <span className="pipeline-time-display">
                      {Math.floor(currentTime)}s / {Math.floor(duration)}s
                    </span>
                  </div>
                </div>
              )
            ) : (
              <div className="pipeline-player-placeholder">
                <HiOutlinePlay />
                <p>Select a reel to preview</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Schedule Modal */}
      {schedulingReel && createPortal(
        <div className="schedule-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000, backdropFilter: 'blur(4px)' }}>
          <div className="glass-card" style={{ padding: '2rem', width: '400px', maxWidth: '90%' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
              <HiOutlineCalendar style={{ color: '#ec4899' }} />
              Schedule Upload
            </h3>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Reel Details:</p>
              <p style={{ fontSize: '0.9rem', marginBottom: '8px' }}>{schedulingReel.caption}</p>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                <span>🎵 {schedulingReel.name}</span>
                <span>⏱ {schedulingReel.duration}</span>
              </div>
            </div>
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Select Date & Time</label>
              <input type="datetime-local" id="schedule-date" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff' }} />
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="agent-action-btn disabled" onClick={() => setSchedulingReel(null)} style={{ padding: '0.5rem 1rem' }}>Cancel</button>
              <button className="agent-action-btn active" onClick={() => handleScheduleConfirm(document.getElementById('schedule-date').value || new Date().toISOString())} style={{ padding: '0.5rem 1rem' }}>Confirm Schedule</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

/* --- Matrix Tab --- */
function MatrixTab({ activeBlueprint, setActiveBlueprint, blueprints, setBlueprints, setActiveTab, setPipelineFilter, apiKeys, saveApiKeys, isGenerating, setIsGenerating, setToastMessage, captions, blueprintPrompts }) {
  const [errorModal, setErrorModal] = useState({ show: false, message: '' });
  const currentBp = blueprints[activeBlueprint] || {};
  const hasLyrics = (currentBp.lyrics || '').trim().length > 0;
  
  const [screenshotLyrics, setScreenshotLyrics] = useState('');
  const [isAnalyzingScreenshot, setIsAnalyzingScreenshot] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const analyzeImageFile = async (file) => {
    setIsAnalyzingScreenshot(true);
    setToastMessage('Analyzing screenshot...');

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Image = reader.result;
        
        const res = await fetch('/api/analyze-screenshot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: base64Image,
            apiKey: apiKeys?.gemini
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to analyze screenshot');

        if (data.songName) {
          const inputEl = document.getElementById('promptSourceInput');
          if (inputEl) {
            inputEl.value = data.songName;
          }
          setToastMessage(`Detected Song: "${data.songName}"`);
        }

        if (data.lyrics) {
          setScreenshotLyrics(data.lyrics);
          // Update active blueprint lyrics
          const current = blueprints[activeBlueprint] || {};
          setBlueprints({
            ...blueprints,
            [activeBlueprint]: {
              ...current,
              lyrics: data.lyrics
            }
          });
          setToastMessage(data.songName ? `Detected Song: "${data.songName}" and reference lyrics` : 'Reference lyrics extracted');
        }
      } catch (err) {
        console.error('Screenshot analysis failed:', err);
        setToastMessage(`Analysis failed: ${err.message}`);
      } finally {
        setIsAnalyzingScreenshot(false);
      }
    };
    reader.onerror = () => {
      setToastMessage('Failed to read file');
      setIsAnalyzingScreenshot(false);
    };
    reader.readAsDataURL(file);
  };

  const handleScreenshotUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await analyzeImageFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setToastMessage('Please drop an image file.');
      return;
    }
    await analyzeImageFile(file);
  };

  const generateRef = React.useRef();

  const handleGenerateClick = async (overrideKey = null, customPromptSource = null, vibeFilter = null) => {
    if (hasLyrics) {
      if (isGenerating) return;
      setIsGenerating(true);
      setErrorModal({ show: false, message: '' });
      
      const bpPrompts = (blueprintPrompts && blueprintPrompts[activeBlueprint]) || {};
      
      try {
        const res = await fetch('/api/generate-viral-reel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            apiKey: typeof overrideKey === 'string' ? overrideKey : apiKeys?.gemini,
            promptSource: customPromptSource || null,
            screenshotLyrics: screenshotLyrics || null,
            prompt1: bpPrompts.prompt1 || null,
            prompt2: bpPrompts.prompt2 || null,
            prompt3: bpPrompts.prompt3 || null,
            vibeFilter: vibeFilter || null
          })
        });
        
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || 'Failed to generate');
        
        const current = blueprints[activeBlueprint] || { generated: [], lyrics: '' };
        const nextOutputNum = (current.generated || []).length + 1;
        
        const newOutput = {
          id: `g_${Date.now()}`,
          name: data.songName || (activeBlueprint === 'Lyrics' ? `Kitab - Female Version #${nextOutputNum}` : `${activeBlueprint} Typography Reel #${nextOutputNum}`),
          duration: `15s`,
          hook: `${Math.floor(Math.random() * 10 + 90)}%`,
          date: new Date().toISOString().split('T')[0],
          status: 'upcoming',
          type: 'lyrics-typography',
          lyricsSnapshot: data.lyrics || current.lyrics,
          audioUrl: data.audioUrl,
          videoUrl: data.videoUrl,
          viralHashtags: data.viralHashtags || '#aesthetic #lyrics #reels #explorepage #feelitreelit #trendingreels #hindisongs #lofi',
          viralReachHashtags: data.viralReachHashtags || '',
          caption: (captions && captions.length > 0) ? captions[Math.floor(Math.random() * captions.length)] : "Some memories never leave 🤍✨"
        };
        
        setBlueprints({
          ...blueprints,
          [activeBlueprint]: {
            ...current,
            generated: [newOutput, ...(current.generated || [])]
          }
        });
        
        setToastMessage('Reel successfully generated!');
        setScreenshotLyrics('');
      } catch (err) {
        setErrorModal({ show: true, message: err.message });
      } finally {
        setIsGenerating(false);
      }
    }
  };

  generateRef.current = handleGenerateClick;

  useEffect(() => {
    // 3 hours in milliseconds
    const THREE_HOURS = 3 * 60 * 60 * 1000;
    const intervalId = setInterval(() => {
      console.log('[Daemon] 3 Hour Auto-generation triggered.');
      if (generateRef.current) generateRef.current();
    }, THREE_HOURS);
    
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="matrix-grid animate-fade-in">
      {/* Layout Preview */}
      <div className="glass-card matrix-preview">
        <div className="matrix-preview-label">
          <HiOutlineColorSwatch /> Layout Preview
        </div>
        <div className="matrix-canvas" style={{ position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Background */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(135deg, rgba(15,15,20,0.8), rgba(10,10,15,0.9))' }}></div>
          
          {/* Pink Line Typography Layout */}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '100%' }}>
            <div style={{ width: '40%', height: '12px', background: 'rgba(236, 72, 153, 0.7)', borderRadius: '6px', boxShadow: '0 0 15px rgba(236, 72, 153, 0.3)' }}></div>
            <div style={{ width: '70%', height: '14px', background: '#ec4899', borderRadius: '7px', boxShadow: '0 0 20px rgba(236, 72, 153, 0.6)' }}></div>
            <div style={{ width: '50%', height: '12px', background: 'rgba(236, 72, 153, 0.7)', borderRadius: '6px', boxShadow: '0 0 15px rgba(236, 72, 153, 0.3)' }}></div>
          </div>
        </div>
        <div className="matrix-canvas-meta">
          {activeBlueprint.toUpperCase()} LAYOUT<br />
          <span style={{ fontSize: '0.65rem' }}>1080×1920 · Render-Ready 9:16 Canvas</span>
        </div>
      </div>

      {/* Right Side */}
      <div className="matrix-right">
        {/* Blueprint Config */}
        <div className="glass-card matrix-config">
          <h3><HiOutlineDocumentDuplicate /> Active Blueprint Configuration</h3>
          <p>This module represents the active variables the generator listens to.</p>

          <div className="matrix-chips">
            {blueprintTypes.map((bp) => (
              <button
                key={bp}
                className={`matrix-chip ${activeBlueprint === bp ? 'active' : ''}`}
                onClick={() => setActiveBlueprint(bp)}
              >
                {bp}
              </button>
            ))}
          </div>

          {/* Dynamic Asset Synthesizer */}
          <div className="synth-section">
            <h4>Dynamic Asset Synthesizer</h4>
            <div className="synth-grid">
              <div className="synth-item">
                <div className="synth-item-icon"><HiOutlineMusicNote /></div>
                <div className="synth-item-text">
                  <div className="synth-item-label">Style Mode</div>
                  <div className="synth-item-value">{activeBlueprint} Blueprint</div>
                </div>
              </div>
              <div className="synth-item">
                <div className="synth-item-icon"><HiOutlineLink /></div>
                <div className="synth-item-text">
                  <div className="synth-item-label">Watermark Config</div>
                  <div className="synth-item-value">AaisuuSync</div>
                </div>
              </div>
            </div>
            <div className="synth-poll" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div 
                style={{ 
                  display: 'flex', 
                  gap: '12px', 
                  alignItems: 'center', 
                  width: '100%',
                  padding: isDragging ? '8px' : '0px',
                  border: isDragging ? '2px dashed #ec4899' : '2px dashed transparent',
                  borderRadius: '12px',
                  background: isDragging ? 'rgba(236, 72, 153, 0.08)' : 'transparent',
                  boxShadow: isDragging ? '0 0 20px rgba(236, 72, 153, 0.15)' : 'none',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <button
                  type="button"
                  onClick={() => document.getElementById('screenshotUploadInput').click()}
                  title="Upload Spotify/Player Screenshot to identify song & lyrics (or drag and drop onto this area)"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '12px',
                    borderRadius: '8px',
                    background: isDragging ? 'rgba(236, 72, 153, 0.25)' : 'rgba(236, 72, 153, 0.1)',
                    border: '1px solid rgba(236, 72, 153, 0.2)',
                    color: '#ec4899',
                    cursor: 'pointer',
                    height: '45px',
                    width: '45px',
                    transition: 'all 0.2s ease',
                    flexShrink: 0,
                    transform: isDragging ? 'scale(1.08)' : 'scale(1)'
                  }}
                  onMouseOver={(e) => {
                    if (!isDragging) {
                      e.currentTarget.style.background = 'rgba(236, 72, 153, 0.2)';
                      e.currentTarget.style.borderColor = 'rgba(236, 72, 153, 0.4)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isDragging) {
                      e.currentTarget.style.background = 'rgba(236, 72, 153, 0.1)';
                      e.currentTarget.style.borderColor = 'rgba(236, 72, 153, 0.2)';
                    }
                  }}
                  disabled={isAnalyzingScreenshot}
                >
                  {isAnalyzingScreenshot ? (
                    <span className="spinner-loader" style={{ borderTopColor: '#ec4899', width: '14px', height: '14px' }} />
                  ) : (
                    <HiOutlineCamera style={{ fontSize: '1.25rem' }} />
                  )}
                </button>
                <input
                  type="file"
                  id="screenshotUploadInput"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleScreenshotUpload}
                />
                <select
                  id="vibeFilterSelect"
                  style={{
                    background: '#14151a',
                    color: '#e4e5eb',
                    border: '1px solid rgba(255,255,255,0.08)',
                    padding: '0 16px',
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    outline: 'none',
                    minWidth: '160px',
                    height: '45px',
                    boxSizing: 'border-box',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                    e.currentTarget.style.background = '#1a1b22';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.background = '#14151a';
                  }}
                >
                  <option value="random">Random Selection</option>
                  <option value="trending">Trending Hits</option>
                  <option value="sad">Sad & Emotional</option>
                  <option value="sad_trending">Sad & Trending</option>
                  <option value="chatpatee">Upbeat & Energetic</option>
                  <option value="old">Retro Classics</option>
                </select>
                <input 
                  type="text" 
                  id="promptSourceInput" 
                  placeholder="Optional: Enter a specific song name (e.g. 'Tauba Tauba')" 
                  style={{ 
                    flex: 1, 
                    background: '#14151a', 
                    color: '#fff', 
                    border: '1px solid rgba(255,255,255,0.08)', 
                    padding: '0 16px', 
                    borderRadius: '12px', 
                    fontSize: '0.9rem', 
                    height: '45px', 
                    boxSizing: 'border-box',
                    outline: 'none',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                  }} 
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)';
                    e.currentTarget.style.boxShadow = '0 0 10px rgba(16, 185, 129, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <button 
                  className={`generating-btn ${isGenerating ? 'generating' : ''}`} 
                  onClick={() => handleGenerateClick(
                    null, 
                    document.getElementById('promptSourceInput')?.value,
                    document.getElementById('vibeFilterSelect')?.value
                  )}
                  disabled={!hasLyrics || isGenerating}
                  style={{
                    height: '45px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '12px',
                    margin: 0
                  }}
                >
                  {isGenerating ? (
                    <>
                      <span className="spinner-loader" style={{ width: '12px', height: '12px', borderTopColor: 'white', borderWidth: '2px', margin: 0 }} />
                      AI Generating...
                    </>
                  ) : hasLyrics ? (
                    <>
                      <HiOutlineSparkles style={{ fontSize: '1rem' }} />
                      Generate Reel
                    </>
                  ) : (
                    <>Need Lyrics</>
                  )}
                </button>
              </div>
              <div className="synth-poll-left" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                <div className="synth-poll-icon"><HiOutlineRefresh /></div>
                <div className="synth-item-text">
                  <div className="synth-item-label">Daemon Polling Speed</div>
                  <div className="synth-item-value">Checking Every 3 Hours</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Error Modal */}
      {errorModal.show && createPortal(
        <div className="schedule-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000, backdropFilter: 'blur(4px)' }}>
          <div className="glass-card" style={{ padding: '2rem', width: '400px', maxWidth: '90%', border: '1px solid #ef4444' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', color: '#ef4444' }}>
              <HiOutlineXCircle />
              Generation Failed
            </h3>
            <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>
              {errorModal.message}
            </p>
            
            {errorModal.message.includes('exhausted') && (
              <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#fca5a5' }}>
                  All default keys are empty. Please use the dedicated fallback key.
                </p>
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="agent-action-btn disabled" onClick={() => setErrorModal({ show: false, message: '' })} style={{ padding: '0.5rem 1rem' }}>Dismiss</button>
              {errorModal.message.includes('exhausted') && (
                <button className="agent-action-btn active" onClick={() => {
                  const newKey = window.prompt("Please enter your new Google Gemini API key:");
                  if (newKey && newKey.trim() !== '') {
                    saveApiKeys({ ...apiKeys, gemini: newKey.trim() });
                    setErrorModal({ show: false, message: '' });
                    handleGenerateClick(newKey.trim());
                  }
                }} style={{ padding: '0.5rem 1rem', background: '#ec4899', borderColor: '#ec4899', color: 'white' }}>Fix & Retry</button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

/* --- Agent Rules Tab --- */
function AgentRulesTab({ rules, setRules, captions, setCaptions, setToastMessage, blueprintPrompts, setBlueprintPrompts }) {
  const [subTab, setSubTab] = useState('rules'); // 'rules' | 'captions' | 'prompts'
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [expandedRules, setExpandedRules] = useState(new Set());
  
  // Rule Modals State
  const [showAddRuleModal, setShowAddRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [ruleForm, setRuleForm] = useState({ title: '', priority: 'HIGH', category: 'Caption & Emojis', description: '' });

  // Caption State
  const [newCaptionText, setNewCaptionText] = useState('');
  const [editingCaptionIndex, setEditingCaptionIndex] = useState(-1);
  const [editingCaptionText, setEditingCaptionText] = useState('');

  // Prompts State
  const [selectedPromptBp, setSelectedPromptBp] = useState('Lyrics');
  const [prompt1Text, setPrompt1Text] = useState('');
  const [prompt2Text, setPrompt2Text] = useState('');
  const [prompt3Text, setPrompt3Text] = useState('');

  // Audio Memory State
  const [audioMemory, setAudioMemory] = useState([]);

  const fetchAudioMemory = async () => {
    try {
      const res = await fetch('/api/audio-memory');
      if (res.ok) {
        const data = await res.json();
        setAudioMemory(data || []);
      }
    } catch (e) {
      console.error('Failed to fetch audio memory:', e);
    }
  };

  useEffect(() => {
    if (subTab === 'audio-memory') {
      fetchAudioMemory();
    }
  }, [subTab]);

  const handleClearAudioMemory = async () => {
    if (window.confirm('Are you sure you want to clear all Audio Memory history? This will reset the song recommendation selection pool.')) {
      try {
        const res = await fetch('/api/audio-memory/clear', { method: 'POST' });
        if (res.ok) {
          setAudioMemory([]);
          setToastMessage('Audio Memory history successfully cleared.');
        }
      } catch (e) {
        console.error('Failed to clear audio memory:', e);
      }
    }
  };

  const handleDeleteAudioMemoryItem = async (item) => {
    if (window.confirm(`Are you sure you want to delete "${item.songName}" from Audio Memory?`)) {
      try {
        const res = await fetch('/api/audio-memory/delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            songName: item.songName,
            timestamp: item.timestamp,
            date: item.date
          })
        });
        if (res.ok) {
          setAudioMemory(prev => prev.filter(m => !(
            m.songName.toLowerCase().trim() === item.songName.toLowerCase().trim() &&
            Number(m.timestamp) === Number(item.timestamp) &&
            m.date === item.date
          )));
          setToastMessage(`"${item.songName}" removed from Audio Memory.`);
        }
      } catch (e) {
        console.error('Failed to delete audio memory item:', e);
      }
    }
  };

  // Sync prompts text when active blueprint changes
  useEffect(() => {
    if (blueprintPrompts && blueprintPrompts[selectedPromptBp]) {
      setPrompt1Text(blueprintPrompts[selectedPromptBp].prompt1 || '');
      setPrompt2Text(blueprintPrompts[selectedPromptBp].prompt2 || '');
      setPrompt3Text(blueprintPrompts[selectedPromptBp].prompt3 || '');
    }
  }, [selectedPromptBp, blueprintPrompts]);

  const hasChanges = prompt1Text !== (blueprintPrompts[selectedPromptBp]?.prompt1 || '') ||
                     prompt2Text !== (blueprintPrompts[selectedPromptBp]?.prompt2 || '') ||
                     prompt3Text !== (blueprintPrompts[selectedPromptBp]?.prompt3 || '');

  const handleSavePrompts = (e) => {
    e.preventDefault();
    setBlueprintPrompts(prev => ({
      ...prev,
      [selectedPromptBp]: {
        prompt1: prompt1Text.trim(),
        prompt2: prompt2Text.trim(),
        prompt3: prompt3Text.trim()
      }
    }));
    setToastMessage(`Prompts for ${selectedPromptBp} blueprint updated!`);
  };

  // Categories
  const categories = ['All', 'Caption & Emojis', 'Visual Aesthetics', 'Audio Processing', 'Scheduling & Publishing'];

  const toggleRuleExpand = (id) => {
    const next = new Set(expandedRules);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedRules(next);
  };

  const handleToggleRuleEnabled = (id) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
    setToastMessage('Rule status updated.');
  };

  const handleAddRuleSubmit = (e) => {
    e.preventDefault();
    if (!ruleForm.title.trim() || !ruleForm.description.trim()) {
      alert('Please fill out all fields.');
      return;
    }
    const newRuleObj = {
      id: `rule_${Date.now()}`,
      title: ruleForm.title.trim(),
      priority: ruleForm.priority,
      category: ruleForm.category,
      status: 'Valid',
      enabled: true,
      description: ruleForm.description.trim()
    };
    setRules(prev => [...prev, newRuleObj]);
    setRuleForm({ title: '', priority: 'HIGH', category: 'Caption & Emojis', description: '' });
    setShowAddRuleModal(false);
    setToastMessage('Custom rule added successfully!');
  };

  const handleEditRuleClick = (rule) => {
    setEditingRule(rule);
    setRuleForm({
      title: rule.title,
      priority: rule.priority,
      category: rule.category,
      description: rule.description
    });
  };

  const handleEditRuleSubmit = (e) => {
    e.preventDefault();
    if (!ruleForm.title.trim() || !ruleForm.description.trim()) {
      alert('Please fill out all fields.');
      return;
    }
    setRules(prev => prev.map(r => r.id === editingRule.id ? { 
      ...r, 
      title: ruleForm.title.trim(),
      priority: ruleForm.priority,
      category: ruleForm.category,
      description: ruleForm.description.trim()
    } : r));
    setEditingRule(null);
    setRuleForm({ title: '', priority: 'HIGH', category: 'Caption & Emojis', description: '' });
    setToastMessage('Rule updated successfully!');
  };

  const handleDeleteRule = (id) => {
    if (window.confirm('Are you sure you want to delete this custom rule?')) {
      setRules(prev => prev.filter(r => r.id !== id));
      setToastMessage('Rule deleted.');
    }
  };

  // Caption Pool Handlers
  const handleAddCaption = (e) => {
    e.preventDefault();
    if (!newCaptionText.trim()) return;
    setCaptions(prev => [...prev, newCaptionText.trim()]);
    setNewCaptionText('');
    setToastMessage('New caption added to the pool!');
  };

  const handleStartEditCaption = (index, text) => {
    setEditingCaptionIndex(index);
    setEditingCaptionText(text);
  };

  const handleSaveEditCaption = (index) => {
    if (!editingCaptionText.trim()) return;
    setCaptions(prev => prev.map((c, i) => i === index ? editingCaptionText.trim() : c));
    setEditingCaptionIndex(-1);
    setEditingCaptionText('');
    setToastMessage('Caption updated.');
  };

  const handleDeleteCaption = (index) => {
    if (window.confirm('Delete this caption from the pool?')) {
      setCaptions(prev => prev.filter((_, i) => i !== index));
      setToastMessage('Caption removed.');
    }
  };

  // Filters
  const filteredRules = rules.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || r.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredCaptions = captions.filter(c => 
    c.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="agent-rules-container animate-fade-in">
      {/* Subtab selection row */}
      <div className="rules-subtabs-row">
        <button 
          className={`rules-subtab-btn ${subTab === 'rules' ? 'active' : ''}`}
          onClick={() => { setSubTab('rules'); setSearchQuery(''); }}
        >
          <HiOutlineDatabase /> Rules Config Directory
        </button>
        <button 
          className={`rules-subtab-btn ${subTab === 'captions' ? 'active' : ''}`}
          onClick={() => { setSubTab('captions'); setSearchQuery(''); }}
        >
          <HiOutlineSparkles /> Aesthetic Captions Pool
        </button>
        <button 
          className={`rules-subtab-btn ${subTab === 'prompts' ? 'active' : ''}`}
          onClick={() => { setSubTab('prompts'); setSearchQuery(''); }}
        >
          <HiOutlineTerminal /> Blueprint Prompts
        </button>
        <button 
          className={`rules-subtab-btn ${subTab === 'audio-memory' ? 'active' : ''}`}
          onClick={() => { setSubTab('audio-memory'); setSearchQuery(''); }}
        >
          <HiOutlineMusicNote /> Audio Memory
        </button>
      </div>

      {subTab === 'rules' && (
        <div className="rules-view">
          {/* Search & Actions */}
          <div className="rules-search-row">
            <div className="rules-search-input-wrapper">
              <input 
                type="text" 
                placeholder="Search agent rules..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="add-rule-btn" onClick={() => {
              setRuleForm({ title: '', priority: 'HIGH', category: 'Caption & Emojis', description: '' });
              setShowAddRuleModal(true);
            }}>
              <HiOutlinePlus /> Add Custom Rule
            </button>
          </div>

          {/* Category Filters */}
          <div className="rules-chips-row">
            {categories.map(cat => (
              <button 
                key={cat} 
                className={`rules-chip ${categoryFilter === cat ? 'active' : ''}`}
                onClick={() => setCategoryFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Rules List */}
          <div className="rules-list-wrapper">
            {filteredRules.length === 0 ? (
              <div className="glass-card empty-state">
                <p>No rules found matching filters.</p>
              </div>
            ) : (
              filteredRules.map(rule => {
                const isExpanded = expandedRules.has(rule.id);
                return (
                  <div key={rule.id} className={`rule-card glass-card ${rule.priority.toLowerCase()} ${isExpanded ? 'expanded' : ''}`}>
                    <div className="rule-card-header" onClick={() => toggleRuleExpand(rule.id)}>
                      <div className="rule-card-left">
                        <span className={`priority-badge ${rule.priority.toLowerCase()}`}>{rule.priority}</span>
                        <div>
                          <h4>{rule.title}</h4>
                          <span className="rule-category-tag">{rule.category}</span>
                        </div>
                      </div>
                      
                      <div className="rule-card-right" onClick={(e) => e.stopPropagation()}>
                        <span className="rule-status-badge">
                          <span className="dot"></span> {rule.status}
                        </span>
                        
                        <div className="rule-enabled-toggle">
                          <span>Enabled</span>
                          <div 
                            className={`switch-toggle ${rule.enabled ? 'on' : ''}`}
                            onClick={() => handleToggleRuleEnabled(rule.id)}
                            role="button"
                          />
                        </div>
                        
                        <button className="expand-chevron-btn" onClick={() => toggleRuleExpand(rule.id)}>
                          {isExpanded ? <HiOutlineChevronUp /> : <HiOutlineChevronDown />}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="rule-card-expanded">
                        <div className="rule-description-box">
                          <p>{rule.description}</p>
                        </div>
                        <div className="rule-actions-footer">
                          <button className="edit-rule-sub-btn" onClick={() => handleEditRuleClick(rule)}>
                            <HiOutlinePencil /> Edit Rule
                          </button>
                          {rule.id.startsWith('rule_1') || rule.id.startsWith('rule_2') || rule.id.startsWith('rule_3') || rule.id.startsWith('rule_4') ? null : (
                            <button className="delete-rule-sub-btn" onClick={() => handleDeleteRule(rule.id)}>
                              <HiOutlineTrash /> Delete Rule
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {subTab === 'captions' && (
        <div className="captions-view">
          {/* Captions Pool Info Card */}
          <div className="glass-card captions-info-card">
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--accent-primary)' }}>
              <HiOutlineSparkles /> Dynamic Caption Pool
            </h4>
            <p>
              The autonomous agent will intelligently pick from this predefined pool of captions when compiling new reels for upload.
            </p>
          </div>

          {/* Add Caption Form */}
          <form className="add-caption-form glass-card" onSubmit={handleAddCaption}>
            <input 
              type="text" 
              placeholder="Type a beautiful caption (e.g. 'Enjoy the journey 🥂✨')" 
              value={newCaptionText}
              onChange={(e) => setNewCaptionText(e.target.value)}
            />
            <button type="submit" className="add-caption-btn-submit">
              <HiOutlinePlus /> Add Caption
            </button>
          </form>

          {/* Search bar for captions */}
          <div className="captions-search-row">
            <input 
              type="text" 
              placeholder="Search captions..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="caption-search-input"
            />
          </div>

          {/* Captions List */}
          <div className="captions-list">
            {filteredCaptions.length === 0 ? (
              <div className="glass-card empty-state">
                <p>No captions in the pool matching your search query.</p>
              </div>
            ) : (
              filteredCaptions.map((caption, idx) => {
                const isEditing = editingCaptionIndex === idx;
                return (
                  <div key={idx} className="caption-card glass-card">
                    {isEditing ? (
                      <div className="caption-edit-mode">
                        <input 
                          type="text" 
                          value={editingCaptionText} 
                          onChange={(e) => setEditingCaptionText(e.target.value)}
                          className="caption-edit-input"
                        />
                        <div className="caption-edit-actions">
                          <button className="caption-save-btn" onClick={() => handleSaveEditCaption(idx)}>Save</button>
                          <button className="caption-cancel-btn" onClick={() => setEditingCaptionIndex(-1)}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="caption-display-mode">
                        <span className="caption-num">#{idx + 1}</span>
                        <p className="caption-text">{caption}</p>
                        <div className="caption-actions">
                          <button className="caption-action-icon-btn edit" onClick={() => handleStartEditCaption(idx, caption)} title="Edit Caption">
                            <HiOutlinePencil size={15} />
                          </button>
                          <button className="caption-action-icon-btn delete" onClick={() => handleDeleteCaption(idx)} title="Delete Caption">
                            <HiOutlineTrash size={15} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {subTab === 'prompts' && (
        <div className="prompts-view animate-fade-in">
          {/* Prompts Pool Info Card */}
          <div className="glass-card prompts-info-card">
            <h4>
              <HiOutlineTerminal className="prompts-info-icon" /> Blueprint Prompts Manager
            </h4>
            <p>
              Configure the exact instructions the Gemini AI agent uses for song recommendations (Prompt 1) and lyrics transcription/formatting (Prompt 2) for each layout style.
            </p>
          </div>

          <div className="prompts-layout">
            {/* Left Side: Blueprint Selector Tabs */}
            <div className="prompts-sidebar glass-card">
              <div className="prompts-sidebar-header">Select Blueprint</div>
              <div className="prompts-sidebar-list">
                {['Lyrics', 'Sad', 'Split Meme', 'Classic Quote', 'Vibe'].map(bp => (
                  <button
                    key={bp}
                    type="button"
                    className={`prompts-sidebar-item ${selectedPromptBp === bp ? 'active' : ''}`}
                    onClick={() => setSelectedPromptBp(bp)}
                  >
                    <span>{bp}</span>
                    <HiOutlineChevronDown className="sidebar-chevron" />
                  </button>
                ))}
              </div>
            </div>

            {/* Right Side: Edit Form */}
            <form className="prompts-editor-form glass-card" onSubmit={handleSavePrompts}>
              <div className="prompts-editor-header">
                <h3>Editing {selectedPromptBp} Prompts</h3>
                <span>These prompts will be sent to the Gemini AI during generation</span>
              </div>

              <div className="form-group">
                <label>Prompt 1: Song Recommendation & Drop Detection</label>
                <span className="field-hint">Instructs the AI on how to select a trending song, format the search query, and pick the timestamp.</span>
                <textarea
                  rows={6}
                  value={prompt1Text}
                  onChange={(e) => setPrompt1Text(e.target.value)}
                  placeholder="Enter prompt 1..."
                />
              </div>

              <div className="form-group">
                <label>Prompt 2: Lyrics Transcription & LRC Sync</label>
                <span className="field-hint">Instructs the AI on how to listen to the audio, output HINGLISH lyrics, slice them, and select emojis.</span>
                <textarea
                  rows={6}
                  value={prompt2Text}
                  onChange={(e) => setPrompt2Text(e.target.value)}
                  placeholder="Enter prompt 2..."
                />
              </div>

              <div className="form-group">
                <label>Prompt 3: Viral Hashtags</label>
                <span className="field-hint">Instructs the AI on how to generate highly targeted viral hashtags based on the song's theme. Use [SONG_NAME] and [LYRICS] as placeholders.</span>
                <textarea
                  rows={6}
                  value={prompt3Text}
                  onChange={(e) => setPrompt3Text(e.target.value)}
                  placeholder="Enter prompt 3..."
                />
              </div>

              <button 
                type="submit" 
                className={`save-prompts-btn ${hasChanges ? 'unsaved' : 'saved'}`}
                disabled={!hasChanges}
              >
                {hasChanges ? (
                  <>
                    <HiOutlineCheck className="btn-icon" />
                    <span>Save Changes</span>
                  </>
                ) : (
                  <>
                    <HiOutlineShieldCheck className="btn-icon check" />
                    <span>Saved</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {subTab === 'audio-memory' && (
        <div className="audio-memory-view animate-fade-in">
          {/* Audio Memory Info Card */}
          <div className="glass-card audio-memory-info-card">
            <div className="audio-memory-info-header">
              <h4>
                <HiOutlineMusicNote className="audio-memory-info-icon" /> Audio Memory Pool
              </h4>
              {audioMemory.length > 0 && (
                <button className="clear-memory-btn" onClick={handleClearAudioMemory}>
                  <HiOutlineTrash /> Clear Memory Pool
                </button>
              )}
            </div>
            <p>
              The AI agent logs every song recommendation and timestamp here. When generating new reels, it cross-references this database to ensure we do not reuse the exact same song sections.
            </p>
          </div>

          {/* Search bar for Audio Memory */}
          <div className="audio-memory-search-row">
            <input 
              type="text" 
              placeholder="Search used songs..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="audio-memory-search-input"
            />
          </div>

          {/* Audio Memory List Grid/Table */}
          <div className="audio-memory-list-wrapper glass-card">
            {audioMemory.length === 0 ? (
              <div className="empty-state">
                <p>No songs recorded in Audio Memory yet. Run a generation to populate the pool!</p>
              </div>
            ) : (
              <table className="audio-memory-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Song Name</th>
                    <th>Trim Range</th>
                    <th>Date Logged</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {audioMemory
                    .filter(item => item.songName.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((item, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td className="song-name-cell">
                          <HiOutlineMusicNote /> {item.songName}
                        </td>
                        <td>
                          <span className="timestamp-badge">{item.timestamp}s</span>
                          <span style={{ margin: '0 4px', color: 'var(--text-muted)', fontSize: '0.7rem' }}>→</span>
                          <span className="timestamp-badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>{Number(item.timestamp) + (item.trimDuration || 15)}s</span>
                        </td>
                        <td>{new Date(item.date).toLocaleString()}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            className="delete-song-btn" 
                            onClick={() => handleDeleteAudioMemoryItem(item)}
                            title="Delete song memory"
                          >
                            <HiOutlineTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Add Custom Rule Modal */}
      {showAddRuleModal && createPortal(
        <div className="schedule-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000, backdropFilter: 'blur(6px)' }}>
          <form className="glass-card modal-form-container" onSubmit={handleAddRuleSubmit} style={{ padding: '2rem', width: '500px', maxWidth: '90%', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)' }}>
              <HiOutlinePlus /> Add Custom Rule
            </h3>
            
            <div className="form-group">
              <label>Rule Title</label>
              <input 
                type="text" 
                required 
                placeholder="e.g., Audio Normalization checks"
                value={ruleForm.title}
                onChange={(e) => setRuleForm({ ...ruleForm, title: e.target.value })}
              />
            </div>

            <div className="form-group-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Priority</label>
                <select 
                  value={ruleForm.priority}
                  onChange={(e) => setRuleForm({ ...ruleForm, priority: e.target.value })}
                >
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>

              <div className="form-group">
                <label>Category</label>
                <select 
                  value={ruleForm.category}
                  onChange={(e) => setRuleForm({ ...ruleForm, category: e.target.value })}
                >
                  {categories.filter(c => c !== 'All').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea 
                required 
                rows={3}
                placeholder="Explain what the rule checks..."
                value={ruleForm.description}
                onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
              />
            </div>

            <div className="modal-actions-row" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button type="button" className="agent-action-btn disabled" onClick={() => setShowAddRuleModal(false)}>Cancel</button>
              <button type="submit" className="agent-action-btn active" style={{ background: 'var(--accent-primary)', borderColor: 'var(--accent-primary)', color: '#fff' }}>Add Rule</button>
            </div>
          </form>
        </div>,
        document.body
      )}

      {/* Edit Rule Modal */}
      {editingRule && createPortal(
        <div className="schedule-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000, backdropFilter: 'blur(6px)' }}>
          <form className="glass-card modal-form-container" onSubmit={handleEditRuleSubmit} style={{ padding: '2rem', width: '500px', maxWidth: '90%', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)' }}>
              <HiOutlinePencil /> Edit Rule Configuration
            </h3>
            
            <div className="form-group">
              <label>Rule Title</label>
              <input 
                type="text" 
                required 
                value={ruleForm.title}
                onChange={(e) => setRuleForm({ ...ruleForm, title: e.target.value })}
              />
            </div>

            <div className="form-group-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Priority</label>
                <select 
                  value={ruleForm.priority}
                  onChange={(e) => setRuleForm({ ...ruleForm, priority: e.target.value })}
                >
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>

              <div className="form-group">
                <label>Category</label>
                <select 
                  value={ruleForm.category}
                  onChange={(e) => setRuleForm({ ...ruleForm, category: e.target.value })}
                >
                  {categories.filter(c => c !== 'All').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea 
                required 
                rows={3}
                value={ruleForm.description}
                onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
              />
            </div>

            <div className="modal-actions-row" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button type="button" className="agent-action-btn disabled" onClick={() => setEditingRule(null)}>Cancel</button>
              <button type="submit" className="agent-action-btn active" style={{ background: 'var(--accent-primary)', borderColor: 'var(--accent-primary)', color: '#fff' }}>Save Changes</button>
            </div>
          </form>
        </div>,
        document.body
      )}
    </div>
  );
}
