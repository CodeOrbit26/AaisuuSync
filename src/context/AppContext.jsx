import React, { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';

const AppContext = createContext(null);

const AI_MODELS = [
  { id: 'gemini', name: 'Gemini Pro', type: 'Cloud', color: '#4285f4' },
  { id: 'ollama', name: 'Ollama', type: 'Local', color: '#22c55e' },
  { id: 'gpt4', name: 'GPT-4', type: 'Cloud', color: '#a78bfa' },
  { id: 'claude', name: 'Claude 3.5', type: 'Cloud', color: '#ec4899' },
  { id: 'llama', name: 'Llama 3', type: 'Local', color: '#f97316' },
];

// Helper: get user-scoped localStorage key
function userKey(userId, key) {
  return userId ? `${userId}_${key}` : key;
}

function safeGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function AppProvider({ children }) {
  const { currentUser } = useAuth();
  const uid = currentUser?.id || null;

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeModel, setActiveModel] = useState('gemini');

  const [notifications, setNotifications] = useState({
    count: 3,
    items: [
      { id: 1, type: 'warning', message: 'Instagram API rate limit approaching', time: '5m ago' },
      { id: 2, type: 'info', message: 'New YouTube automation feature available', time: '1h ago' },
      { id: 3, type: 'success', message: 'Reel batch #42 published successfully', time: '2h ago' },
    ],
  });

  const addNotification = (type, message) => {
    setNotifications((prev) => {
      const newItems = [
        { id: Date.now(), type, message, time: 'Just now' },
        ...prev.items,
      ];
      return {
        count: prev.count + 1,
        items: newItems.slice(0, 15),
      };
    });
  };

  const clearNotifications = () => {
    setNotifications({ count: 0, items: [] });
  };

  const markNotificationsAsRead = () => {
    setNotifications((prev) => ({ ...prev, count: 0 }));
  };

  const [apiKeys, setApiKeys] = useState(() => {
    const defaultKeys = {
      gemini: '',
      pexels: '',
      ytStudioKey: '',
      chatgpt: '',
      claude: '',
      flowai: ''
    };
    if (!uid) return defaultKeys;
    const saved = safeGet(userKey(uid, 'aaisu_api_keys_v2'), null);
    return saved ? { ...defaultKeys, ...saved } : defaultKeys;
  });

  // Persistent connected accounts (per user)
  const [connectedAccounts, setConnectedAccounts] = useState(() => {
    const defaultAccounts = { instagram: [], linkedin: [], youtubeChannel: null, youtubeStudio: null };
    if (!uid) return defaultAccounts;
    const saved = safeGet(userKey(uid, 'aaisu_connected_accounts_v2'), null);
    if (saved) {
      if (!saved.linkedin) saved.linkedin = [];
      return saved;
    }
    return defaultAccounts;
  });

  // Persistent AI Agent Blueprints State (per user)
  const DEFAULT_LYRICS = 'TAINU\nMAIN LIKHU\nRAJA DIL KA TAINU ME\nMERE\nPYAAR\nLIKHUNGI\nJE LIKHNA ME BAITHI\nTENE\nTO PAKA\nMAIN KITAB\nLIKHUNGI\n🤙😭✨🤍';

  const [blueprints, setBlueprints] = useState(() => {
    const defaultBlueprints = {
      Lyrics: {
        progress: 0, references: [],
        instructions: 'Target short vertical videos (9:16) with handwritten lyrics overlays. Ensure fonts are aligned precisely on beat drop cuts. Apply soft retro grading and high contrast text shadows.',
        lyrics: DEFAULT_LYRICS, generated: []
      },
      Sad: {
        progress: 0, references: [],
        instructions: 'Focus on low-contrast, cool blue color grading. Transition using cross-dissolves on slow ambient beats. Emotional spacing between text overlays should be 1.5s minimum.',
        lyrics: '', generated: []
      },
      'Split Meme': {
        progress: 0, references: [],
        instructions: 'Top screen: high-quality looping video clip. Bottom screen: ASMR gameplay or kinetic sand slicing. Synchronize audio beat to top screen action. Captions must use modern bold sans-serif fonts in red/white.',
        lyrics: '', generated: []
      },
      'Classic Quote': {
        progress: 0, references: [],
        instructions: 'Use minimal black background or slow cinematic nature loops. Text fades in word-by-word. Pacing should feel spacious. Audio must be deep male voice or warm low-fidelity piano.',
        lyrics: '', generated: []
      },
      Vibe: {
        progress: 0, references: [],
        instructions: 'High energy cuts on every snare hit. Fast zoom transitions. Saturated warm tones. Retro VHS overlays active. Ideal for lifestyle and workspace showcase videos.',
        lyrics: '', generated: []
      }
    };

    if (!uid) return defaultBlueprints;

    const saved = safeGet(userKey(uid, 'aaisu_blueprints_v2'), null);
    if (saved) {
      // Migrate: ensure every blueprint has a `lyrics` field
      Object.keys(saved).forEach(key => {
        if (saved[key] && typeof saved[key].lyrics === 'undefined') {
          saved[key].lyrics = key === 'Lyrics' ? DEFAULT_LYRICS : '';
        }
      });
      if (saved.Lyrics && !saved.Lyrics.lyrics) {
        saved.Lyrics.lyrics = DEFAULT_LYRICS;
      }
      return saved;
    }
    return defaultBlueprints;
  });

  // Auto-persist blueprints on change (user-scoped)
  React.useEffect(() => {
    if (uid) {
      localStorage.setItem(userKey(uid, 'aaisu_blueprints_v2'), JSON.stringify(blueprints));
    }
  }, [blueprints, uid]);

  // Auto-persist connected accounts on change (user-scoped)
  React.useEffect(() => {
    if (uid) {
      localStorage.setItem(userKey(uid, 'aaisu_connected_accounts_v2'), JSON.stringify(connectedAccounts));
    }
  }, [connectedAccounts, uid]);

  // Helper functions
  const saveApiKeys = (keys) => {
    setApiKeys(keys);
    if (uid) {
      localStorage.setItem(userKey(uid, 'aaisu_api_keys_v2'), JSON.stringify(keys));
    }
  };

  const connectInstagram = (username, password, role, profileDetails) => {
    const cleanUsername = username.replace('@', '').toLowerCase();
    const newAcc = {
      id: `ig_${Date.now()}`,
      username: cleanUsername,
      status: 'healthy',
      role: role || 'Content Publishing',
      followers: profileDetails?.followers || '2.5K',
      posts: profileDetails?.posts || 12,
      avatar: profileDetails?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=60'
    };
    const updated = {
      ...connectedAccounts,
      instagram: [...connectedAccounts.instagram, newAcc]
    };
    setConnectedAccounts(updated);
  };

  const disconnectInstagram = async (id) => {
    const acc = connectedAccounts.instagram.find(a => a.id === id);
    if (acc) {
      try {
        await fetch('/api/instagram/delete-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: acc.username })
        });
      } catch (err) {
        console.error('Failed to delete chrome profile on backend:', err);
      }
    }
    const updated = {
      ...connectedAccounts,
      instagram: connectedAccounts.instagram.filter(a => a.id !== id)
    };
    setConnectedAccounts(updated);
  };

  const connectLinkedIn = (username, name, role) => {
    const cleanUsername = username.replace('@', '').toLowerCase();
    const newAcc = {
      id: `li_${Date.now()}`,
      username: cleanUsername,
      name: name || 'User',
      status: 'healthy',
      role: role || 'Content Publishing',
      followers: '5.4K',
      posts: 38,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=60'
    };
    const updated = {
      ...connectedAccounts,
      linkedin: [...(connectedAccounts.linkedin || []), newAcc]
    };
    setConnectedAccounts(updated);
  };

  const disconnectLinkedIn = (id) => {
    const updated = {
      ...connectedAccounts,
      linkedin: (connectedAccounts.linkedin || []).filter(acc => acc.id !== id)
    };
    setConnectedAccounts(updated);
  };

  const connectYouTubeChannel = (channelData) => {
    const updated = {
      ...connectedAccounts,
      youtubeChannel: {
        channelName: channelData?.channelName || 'PixelVibe AI',
        channelId: channelData?.channelId || '@pixelvibe_ai',
        status: 'active',
        subscribers: channelData?.subscribers || '1.1K',
        videos: channelData?.videos || 8,
        avatar: channelData?.avatar || 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=60'
      }
    };
    setConnectedAccounts(updated);
  };

  const disconnectYouTubeChannel = () => {
    const updated = { ...connectedAccounts, youtubeChannel: null };
    setConnectedAccounts(updated);
  };

  const connectYouTubeStudio = (key) => {
    const updated = {
      ...connectedAccounts,
      youtubeStudio: {
        status: 'connected',
        connectedAt: new Date().toISOString().split('T')[0],
        apiQuota: '0 / 10,000'
      }
    };
    setConnectedAccounts(updated);
    
    const keys = { ...apiKeys, ytStudioKey: key };
    setApiKeys(keys);
    if (uid) {
      localStorage.setItem(userKey(uid, 'aaisu_api_keys_v2'), JSON.stringify(keys));
    }
  };

  const disconnectYouTubeStudio = () => {
    const updated = { ...connectedAccounts, youtubeStudio: null };
    setConnectedAccounts(updated);
  };

  const updateAccountRole = (platform, id, role) => {
    const updated = { ...connectedAccounts };
    if (platform === 'instagram') {
      updated.instagram = (updated.instagram || []).map(acc => acc.id === id ? { ...acc, role } : acc);
    } else if (platform === 'linkedin') {
      updated.linkedin = (updated.linkedin || []).map(acc => acc.id === id ? { ...acc, role } : acc);
    } else if (platform === 'youtubeChannel') {
      if (updated.youtubeChannel) updated.youtubeChannel = { ...updated.youtubeChannel, role };
    } else if (platform === 'youtubeStudio') {
      if (updated.youtubeStudio) updated.youtubeStudio = { ...updated.youtubeStudio, role };
    }
    setConnectedAccounts(updated);
  };

  const updateAccountStatus = (platform, id, status) => {
    const updated = { ...connectedAccounts };
    if (platform === 'instagram') {
      updated.instagram = (updated.instagram || []).map(acc => acc.id === id ? { ...acc, status } : acc);
    } else if (platform === 'linkedin') {
      updated.linkedin = (updated.linkedin || []).map(acc => acc.id === id ? { ...acc, status } : acc);
    } else if (platform === 'youtubeChannel') {
      if (updated.youtubeChannel) updated.youtubeChannel = { ...updated.youtubeChannel, status };
    } else if (platform === 'youtubeStudio') {
      if (updated.youtubeStudio) updated.youtubeStudio = { ...updated.youtubeStudio, status };
    }
    setConnectedAccounts(updated);
  };

  // Dynamic system health computation
  const getSystemStatus = () => {
    const services = [
      {
        name: 'Instagram Engine',
        status: connectedAccounts.instagram.length > 0 ? 'healthy' : 'offline',
        label: connectedAccounts.instagram.length > 0 ? 'HEALTHY' : 'DISCONNECTED'
      },
      {
        name: 'LinkedIn Scheduler',
        status: (connectedAccounts.linkedin && connectedAccounts.linkedin.length > 0) ? 'healthy' : 'offline',
        label: (connectedAccounts.linkedin && connectedAccounts.linkedin.length > 0) ? 'ACTIVE' : 'DISCONNECTED'
      },
      {
        name: 'AI Inference (Gemini)',
        status: apiKeys.gemini ? 'online' : 'offline',
        label: apiKeys.gemini ? 'ONLINE' : 'NOT CONFIGURED'
      },
      {
        name: 'YouTube Studio',
        status: connectedAccounts.youtubeStudio ? 'configured' : 'offline',
        label: connectedAccounts.youtubeStudio ? 'CONNECTED' : 'DISCONNECTED'
      },
      {
        name: 'Pexels API',
        status: apiKeys.pexels ? 'configured' : 'offline',
        label: apiKeys.pexels ? 'CONFIGURED' : 'NOT CONFIGURED'
      },
      { name: 'Vector Database', status: 'ready', label: 'READY' },
    ];

    const online = services.some(s => s.status !== 'offline');
    return { online, services };
  };

  const systemStatus = getSystemStatus();

  // User info from AuthContext
  const user = currentUser ? {
    name: currentUser.name,
    email: currentUser.email,
    avatar: null,
    initials: currentUser.initials,
    plan: 'AaisuuSync Free',
  } : {
    name: 'Guest',
    email: '',
    avatar: null,
    initials: 'G',
    plan: 'AaisuuSync Free',
  };

  const currentModel = AI_MODELS.find((m) => m.id === activeModel) || AI_MODELS[0];
  const toggleSidebar = () => setSidebarCollapsed((prev) => !prev);

  const value = {
    sidebarCollapsed, setSidebarCollapsed, toggleSidebar,
    notifications, setNotifications, addNotification, clearNotifications, markNotificationsAsRead,
    systemStatus,
    user,
    activeModel, setActiveModel, currentModel, AI_MODELS,
    apiKeys, saveApiKeys,
    connectedAccounts,
    connectInstagram, disconnectInstagram,
    connectLinkedIn, disconnectLinkedIn,
    connectYouTubeChannel, disconnectYouTubeChannel,
    connectYouTubeStudio, disconnectYouTubeStudio,
    updateAccountRole,
    updateAccountStatus,
    blueprints,
    setBlueprints
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export default AppContext;
