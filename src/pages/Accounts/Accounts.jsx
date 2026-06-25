import React, { useState, useEffect, useRef } from 'react';
import {
  HiOutlineKey,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineLockClosed,
  HiOutlineCheck,
  HiOutlinePlus,
  HiOutlineServer,
  HiOutlineGlobe,
  HiOutlineUser,
  HiOutlineSparkles,
  HiOutlineTerminal,
  HiOutlineLightningBolt
} from 'react-icons/hi';
import { useApp } from '../../context/AppContext';
import Modal from '../../components/Modal/Modal';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import './Accounts.css';

export default function Accounts() {
  const {
    apiKeys,
    saveApiKeys,
    connectedAccounts,
    connectInstagram,
    disconnectInstagram,
    connectLinkedIn,
    disconnectLinkedIn,
    connectYouTubeChannel,
    disconnectYouTubeChannel,
    connectYouTubeStudio,
    disconnectYouTubeStudio,
    updateAccountRole,
    updateAccountStatus
  } = useApp();

  const [loggingInId, setLoggingInId] = useState(null);

  const handleTableAccountLogin = (platform, id) => {
    setLoggingInId(id);
    setTimeout(() => {
      setLoggingInId(null);
      updateAccountStatus(platform, id, 'healthy');
    }, 1500);
  };

  const handleDisconnect = (platform, id) => {
    if (platform === 'instagram') disconnectInstagram(id);
    else if (platform === 'linkedin') disconnectLinkedIn(id);
    else if (platform === 'youtubeChannel') disconnectYouTubeChannel();
    else if (platform === 'youtubeStudio') disconnectYouTubeStudio();
    else if (platform === 'chatgpt') {
      saveApiKeys({ ...apiKeys, chatgpt: '' });
      setChatgptKey(''); setChatgptValidated(false);
    } else if (platform === 'claude') {
      saveApiKeys({ ...apiKeys, claude: '' });
      setClaudeKey(''); setClaudeValidated(false);
    } else if (platform === 'gemini') {
      saveApiKeys({ ...apiKeys, gemini: '' });
      setGeminiKey(''); setGeminiValidated(false);
    } else if (platform === 'flowai') {
      saveApiKeys({ ...apiKeys, flowai: '' });
      setFlowaiKey(''); setFlowaiValidated(false);
    }
  };

  const handleOpenInBrowser = async (platform, username = '') => {
    try {
      await fetch('/api/instagram/open-profile-browser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, username })
      });
    } catch (e) {
      console.error('Failed to open browser:', e);
    }
  };

  // Local Form states
  const [geminiKey, setGeminiKey] = useState(apiKeys.gemini || '');
  const [pexelsKey, setPexelsKey] = useState(apiKeys.pexels || '');
  const [ytStudioKey, setYtStudioKey] = useState(apiKeys.ytStudioKey || '');
  const [chatgptKey, setChatgptKey] = useState(apiKeys.chatgpt || '');
  const [claudeKey, setClaudeKey] = useState(apiKeys.claude || '');
  const [flowaiKey, setFlowaiKey] = useState(apiKeys.flowai || '');

  // Reveal password togglers
  const [showGemini, setShowGemini] = useState(false);
  const [showPexels, setShowPexels] = useState(false);
  const [showYtStudio, setShowYtStudio] = useState(false);
  const [showChatgpt, setShowChatgpt] = useState(false);
  const [showClaude, setShowClaude] = useState(false);
  const [showFlowai, setShowFlowai] = useState(false);

  // Validation States
  const [isValidatingGemini, setIsValidatingGemini] = useState(false);
  const [isValidatingPexels, setIsValidatingPexels] = useState(false);
  const [isValidatingChatgpt, setIsValidatingChatgpt] = useState(false);
  const [isValidatingClaude, setIsValidatingClaude] = useState(false);
  const [isValidatingFlowai, setIsValidatingFlowai] = useState(false);
  const [geminiValidated, setGeminiValidated] = useState(!!apiKeys.gemini);
  const [pexelsValidated, setPexelsValidated] = useState(!!apiKeys.pexels);
  const [chatgptValidated, setChatgptValidated] = useState(!!apiKeys.chatgpt);
  const [claudeValidated, setClaudeValidated] = useState(!!apiKeys.claude);
  const [flowaiValidated, setFlowaiValidated] = useState(!!apiKeys.flowai);

  // Instagram Modal state
  const [showIgModal, setShowIgModal] = useState(false);
  const [igUsername, setIgUsername] = useState('');
  const [igRole, setIgRole] = useState('Content Publishing');
  const [igConnectSteps, setIgConnectSteps] = useState([]);
  const [isIgConnecting, setIsIgConnecting] = useState(false);
  const [isBrowserLaunched, setIsBrowserLaunched] = useState(false);
  const [checkLoginStatusText, setCheckLoginStatusText] = useState('');
  const [detectedSession, setDetectedSession] = useState(null);
  const [isScanningSession, setIsScanningSession] = useState(false);
  const [isChromeAlreadyOpen, setIsChromeAlreadyOpen] = useState(false);

  // LinkedIn Modal state
  const [showLiModal, setShowLiModal] = useState(false);
  const [liUsername, setLiUsername] = useState('');
  const [liName, setLiName] = useState('');
  const [liRole, setLiRole] = useState('Content Publishing');
  const [liConnectSteps, setLiConnectSteps] = useState([]);
  const [isLiConnecting, setIsLiConnecting] = useState(false);

  // YouTube OAuth Modal state
  const [showYtModal, setShowYtModal] = useState(false);
  const [showYtStudioModal, setShowYtStudioModal] = useState(false);
  const [ytStudioInput, setYtStudioInput] = useState(apiKeys.ytStudioKey || '');
  const [isYtConnecting, setIsYtConnecting] = useState(false);
  const [ytConnectSteps, setYtConnectSteps] = useState([]);

  // API Keys modal state
  const [showApiKeysModal, setShowApiKeysModal] = useState(false);

  // AI Direct Browser Login Tracker state
  const [isAiDirectConnecting, setIsAiDirectConnecting] = useState(false);
  const [aiConnectPlatform, setAiConnectPlatform] = useState('');
  const [aiConnectSteps, setAiConnectSteps] = useState([]);
  const [isValidatingAiDirect, setIsValidatingAiDirect] = useState(false);

  // Connect dropdown visibility state
  const [showConnectDropdown, setShowConnectDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowConnectDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Auto-polling for Instagram browser login detection
  useEffect(() => {
    let pollInterval = null;
    if (isBrowserLaunched) {
      pollInterval = setInterval(async () => {
        try {
          const res = await fetch('/api/instagram/check-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          const data = await res.json();
          if (data.success && data.loggedIn) {
            clearInterval(pollInterval);
            
            // Highlight successful login
            setIgConnectSteps(prev => {
              const filtered = prev.filter(s => !s.includes('Watching'));
              return [...filtered, 'Successful login detected! Closing browser and syncing...'];
            });

            setTimeout(() => {
              const profile = data.profile;
              connectInstagram(profile.username, null, igRole, profile);
              
              // Auto close modal & clean up
              setShowIgModal(false);
              setIgUsername('');
              setIsBrowserLaunched(false);
              setCheckLoginStatusText('');
              setIsIgConnecting(false);
              setIsChromeAlreadyOpen(false);
            }, 1200);
          } else if (data.closed) {
            clearInterval(pollInterval);

            // Highlight failed closure
            setIgConnectSteps(prev => {
              const filtered = prev.filter(s => !s.includes('Watching'));
              return [...filtered, 'Connection failed: Chrome window was closed without logging in.'];
            });

            setTimeout(() => {
              setShowIgModal(false);
              setIgUsername('');
              setIsBrowserLaunched(false);
              setCheckLoginStatusText('');
              setIsIgConnecting(false);
              setIsChromeAlreadyOpen(false);
            }, 1800);
          }
        } catch (err) {
          console.error('[Accounts] Error polling Instagram status:', err);
        }
      }, 1500);
    }
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [isBrowserLaunched, igRole, connectInstagram, setIsChromeAlreadyOpen]);

  // Trigger active session check on modal open
  useEffect(() => {
    if (showIgModal) {
      setIsScanningSession(true);
      setDetectedSession(null);
      setIsChromeAlreadyOpen(false);
      
      const scanSession = async () => {
        try {
          const res = await fetch('/api/instagram/check-saved-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          const data = await res.json();
          if (data.success && data.loggedIn && data.profile) {
            setDetectedSession(data.profile);
            setIsChromeAlreadyOpen(!!data.alreadyOpen);
          } else if (data.success && data.alreadyOpen) {
            // Chrome is open, but no session is authenticated.
            // Automatically transition to watching state!
            setIsChromeAlreadyOpen(true);
            setIsBrowserLaunched(true);
            setIgConnectSteps([
              'Active Chrome Testing window detected as already open!',
              'Watching for successful authentication...'
            ]);
          }
        } catch (err) {
          console.error('[Accounts] Failed to check saved session:', err);
        } finally {
          setIsScanningSession(false);
        }
      };
      
      scanSession();
    }
  }, [showIgModal]);

  // Sync inputs with global state if it changes externally
  useEffect(() => {
    setGeminiKey(apiKeys.gemini || '');
    setPexelsKey(apiKeys.pexels || '');
    setYtStudioKey(apiKeys.ytStudioKey || '');
    setChatgptKey(apiKeys.chatgpt || '');
    setClaudeKey(apiKeys.claude || '');
    setFlowaiKey(apiKeys.flowai || '');
    setGeminiValidated(!!apiKeys.gemini);
    setPexelsValidated(!!apiKeys.pexels);
    setChatgptValidated(!!apiKeys.chatgpt);
    setClaudeValidated(!!apiKeys.claude);
    setFlowaiValidated(!!apiKeys.flowai);
  }, [apiKeys]);

  // Logs removed for clean automation workspace

  // Validate API Keys simulated action
  const handleValidateGemini = () => {
    if (!geminiKey) return;
    setIsValidatingGemini(true);
    
    setTimeout(() => {
      setIsValidatingGemini(false);
      setGeminiValidated(true);
      saveApiKeys({ ...apiKeys, gemini: geminiKey });
    }, 1800);
  };

  const handleValidatePexels = () => {
    if (!pexelsKey) return;
    setIsValidatingPexels(true);

    setTimeout(() => {
      setIsValidatingPexels(false);
      setPexelsValidated(true);
      saveApiKeys({ ...apiKeys, pexels: pexelsKey });
    }, 1500);
  };

  const handleValidateChatgpt = () => {
    if (!chatgptKey) return;
    setIsValidatingChatgpt(true);

    setTimeout(() => {
      setIsValidatingChatgpt(false);
      setChatgptValidated(true);
      saveApiKeys({ ...apiKeys, chatgpt: chatgptKey });
    }, 1600);
  };

  const handleValidateClaude = () => {
    if (!claudeKey) return;
    setIsValidatingClaude(true);

    setTimeout(() => {
      setIsValidatingClaude(false);
      setClaudeValidated(true);
      saveApiKeys({ ...apiKeys, claude: claudeKey });
    }, 1700);
  };

  const handleValidateFlowai = () => {
    if (!flowaiKey) return;
    setIsValidatingFlowai(true);

    setTimeout(() => {
      setIsValidatingFlowai(false);
      setFlowaiValidated(true);
      saveApiKeys({ ...apiKeys, flowai: flowaiKey });
    }, 1500);
  };

  const handleAiDirectLogin = async (platformKey) => {
    const names = {
      gemini: 'Gemini AI',
      chatgpt: 'ChatGPT',
      claude: 'Claude',
      flowai: 'Flow AI'
    };
    
    setAiConnectPlatform(names[platformKey] || 'AI Platform');
    setIsAiDirectConnecting(true);
    setAiConnectSteps(['Querying AI local puppet service...', 'Launching secure automated browser window...']);
    
    try {
      const res = await fetch('/api/instagram/launch-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: platformKey })
      });
      const data = await res.json();
      if (data.success) {
        setAiConnectSteps(prev => [
          ...prev, 
          'Chrome opened! Please complete your login directly on the platform.',
          'Watching for successful authentication...'
        ]);
        
        let pollInterval = setInterval(async () => {
          try {
            const pollRes = await fetch('/api/instagram/check-login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            });
            const pollData = await pollRes.json();
            if (pollData.success && pollData.loggedIn) {
              clearInterval(pollInterval);
              
              setAiConnectSteps(prev => {
                const filtered = prev.filter(s => !s.includes('Watching'));
                return [...filtered, 'Successful login detected! Closing browser and syncing key...'];
              });
              
              setTimeout(() => {
                const valKey = pollData.key || `${platformKey}-auth-session`;
                saveApiKeys({ ...apiKeys, [platformKey]: valKey });
                
                if (platformKey === 'gemini') { setGeminiKey(valKey); setGeminiValidated(true); }
                else if (platformKey === 'chatgpt') { setChatgptKey(valKey); setChatgptValidated(true); }
                else if (platformKey === 'claude') { setClaudeKey(valKey); setClaudeValidated(true); }
                else if (platformKey === 'flowai') { setFlowaiKey(valKey); setFlowaiValidated(true); }
                
                setIsAiDirectConnecting(false);
              }, 1200);
            } else if (pollData.closed) {
              clearInterval(pollInterval);
              
              setAiConnectSteps(prev => {
                const filtered = prev.filter(s => !s.includes('Watching'));
                return [...filtered, 'Connection failed: Chrome window was closed without logging in.'];
              });
              
              setTimeout(() => {
                setIsAiDirectConnecting(false);
              }, 1800);
            }
          } catch (err) {
            console.error('Error polling AI login status:', err);
          }
        }, 1500);
      } else {
        setAiConnectSteps(prev => [...prev, 'Failed to launch browser. Make sure node/puppeteer is working.']);
      }
    } catch (err) {
      setAiConnectSteps(prev => [...prev, 'Error connecting to daemon server.']);
    }
  };

  // Instagram connection steps using Puppeteer browser launch and auto-detection
  const handleLaunchIgBrowser = async (options = {}) => {
    setIsIgConnecting(true);
    setIgConnectSteps(['Querying Instagram local puppet service...', 'Launching secure automated browser window...']);
    
    try {
      const res = await fetch('/api/instagram/launch-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceNew: !!options.forceNew })
      });
      const data = await res.json();
      if (data.success) {
        setIgConnectSteps(prev => [
          ...prev, 
          'Chrome opened! Please complete your login directly on Instagram.',
          'Watching for successful authentication...'
        ]);
        setIsBrowserLaunched(true);
      } else {
        setIgConnectSteps(prev => [...prev, 'Failed to launch browser. Make sure node/puppeteer is working.']);
      }
    } catch (err) {
      setIgConnectSteps(prev => [...prev, 'Error connecting to daemon server.']);
    } finally {
      setIsIgConnecting(false);
    }
  };

  // LinkedIn connection steps simulator
  const handleConnectLinkedIn = (e) => {
    e.preventDefault();
    if (!liUsername || !liName) return;

    setIsLiConnecting(true);
    setLiConnectSteps([]);
    const steps = [
      'Authenticating with LinkedIn OAuth gateway...',
      'Retrieving Member Profile permissions...',
      'Establishing publication scopes (w_member_social)...',
      'Configuring dynamic posting triggers...',
      'Encrypting and storing session access tokens...'
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setLiConnectSteps(prev => [...prev, step]);
        if (idx === steps.length - 1) {
          setIsLiConnecting(false);
          connectLinkedIn(liUsername, liName, liRole);
          setShowLiModal(false);
          setLiUsername('');
          setLiName('');
        }
      }, (idx + 1) * 800);
    });
  };

  // YouTube OAuth flow simulator
  const triggerYouTubeOAuth = () => {
    setShowYtModal(true);
  };

  const selectGoogleAccount = (channelName, channelId, subs, videos, avatar) => {
    setIsYtConnecting(true);
    setYtConnectSteps([]);
    
    const steps = [
      'Establishing Google OAuth 2.0 connection parameters...',
      'Accessing requested YouTube Read-Write metadata permissions...',
      `Validating channel: ${channelName} (${channelId})...`,
      'Configuring automation pipeline handlers...'
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setYtConnectSteps(prev => [...prev, step]);
        if (idx === steps.length - 1) {
          setIsYtConnecting(false);
          connectYouTubeChannel({ channelName, channelId, subscribers: subs, videos, avatar });
          setShowYtModal(false);
        }
      }, (idx + 1) * 700);
    });
  };

  // YouTube Studio API simulator
  const handleConnectYtStudio = (e) => {
    e.preventDefault();
    if (!ytStudioInput) return;
    
    connectYouTubeStudio(ytStudioInput);
    setShowYtStudioModal(false);
  };

  // Status mapping to icons/lines
  const isGeminiConnected = !!apiKeys.gemini;
  const isPexelsConnected = !!apiKeys.pexels;
  const isChatgptConnected = !!apiKeys.chatgpt;
  const isClaudeConnected = !!apiKeys.claude;
  const isFlowaiConnected = !!apiKeys.flowai;
  const isInstagramConnected = connectedAccounts.instagram.length > 0;
  const isLinkedInConnected = connectedAccounts.linkedin && connectedAccounts.linkedin.length > 0;
  const isYtStudioConnected = !!connectedAccounts.youtubeStudio;
  const isYtChannelConnected = !!connectedAccounts.youtubeChannel;

  // Active inputs column nodes
  const activeInputs = [];
  if (isGeminiConnected) {
    activeInputs.push({
      id: 'gemini',
      name: 'Gemini AI',
      status: 'ONLINE',
      icon: <HiOutlineKey />,
      bgClass: 'bg-indigo',
      borderClass: 'border-indigo',
      sectionId: 'api-keys-section'
    });
  }
  if (isClaudeConnected) {
    activeInputs.push({
      id: 'claude',
      name: 'Claude AI',
      status: 'ONLINE',
      icon: <HiOutlineTerminal />,
      bgClass: 'bg-purple',
      borderClass: 'border-purple',
      sectionId: 'api-keys-section'
    });
  }
  if (isFlowaiConnected) {
    activeInputs.push({
      id: 'flowai',
      name: 'Flow AI',
      status: 'ONLINE',
      icon: <HiOutlineLightningBolt />,
      bgClass: 'bg-amber',
      borderClass: 'border-amber',
      sectionId: 'api-keys-section'
    });
  }
  if (isPexelsConnected) {
    activeInputs.push({
      id: 'pexels',
      name: 'Pexels Assets',
      status: 'CONFIGURED',
      icon: <HiOutlineGlobe />,
      bgClass: 'bg-pink',
      borderClass: 'border-pink',
      sectionId: 'api-keys-section'
    });
  }

  // Active outputs column nodes
  const activeOutputs = [];
  if (isChatgptConnected) {
    activeOutputs.push({
      id: 'chatgpt',
      name: 'ChatGPT',
      status: 'ONLINE',
      icon: <HiOutlineSparkles />,
      bgClass: 'bg-emerald',
      borderClass: 'border-emerald',
      lineClass: 'active-line-emerald',
      sectionId: 'api-keys-section'
    });
  }
  if (isInstagramConnected) {
    activeOutputs.push({
      id: 'instagram',
      name: 'Instagram',
      status: `${connectedAccounts.instagram.length} ACTIVE`,
      icon: (
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
      ),
      bgClass: 'bg-orange',
      borderClass: 'border-orange',
      lineClass: 'active-line-orange',
      sectionId: 'instagram-section'
    });
  }
  if (isLinkedInConnected) {
    activeOutputs.push({
      id: 'linkedin',
      name: 'LinkedIn',
      status: `${connectedAccounts.linkedin.length} ACTIVE`,
      icon: (
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764 0-.973.784-1.763 1.75-1.763s1.75.79 1.75 1.763c0 .974-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
        </svg>
      ),
      bgClass: 'bg-linkedin',
      borderClass: 'border-linkedin',
      lineClass: 'active-line-linkedin',
      sectionId: 'linkedin-section'
    });
  }
  if (isYtStudioConnected) {
    activeOutputs.push({
      id: 'youtube-studio',
      name: 'YouTube Studio API',
      status: 'CONNECTED',
      icon: (
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.163a3.003 3.003 0 00-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 00-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 002.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.002 3.002 0 002.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
      bgClass: 'bg-red',
      borderClass: 'border-red',
      lineClass: 'active-line-red',
      sectionId: 'youtube-section'
    });
  }
  if (isYtChannelConnected) {
    activeOutputs.push({
      id: 'youtube-channel',
      name: 'YouTube Channel',
      status: connectedAccounts.youtubeChannel.channelName,
      icon: (
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.163a3.003 3.003 0 00-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 00-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 002.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.002 3.002 0 002.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
      bgClass: 'bg-red-hollow',
      borderClass: 'border-red',
      lineClass: 'active-line-red',
      sectionId: 'youtube-section'
    });
  }

  const getYCoordinate = (index, totalCount) => {
    if (totalCount <= 1) return 100;
    const padding = totalCount >= 4 ? 30 : 40;
    const heightRange = 200 - 2 * padding;
    return padding + (index * heightRange) / (totalCount - 1);
  };

  const hasConnectedAccounts = 
    connectedAccounts.instagram.length > 0 ||
    (connectedAccounts.linkedin && connectedAccounts.linkedin.length > 0) ||
    !!connectedAccounts.youtubeChannel ||
    !!connectedAccounts.youtubeStudio ||
    !!apiKeys.gemini ||
    !!apiKeys.chatgpt ||
    !!apiKeys.claude ||
    !!apiKeys.flowai;

  return (
    <div className="accounts-page page-container">
      {/* Page Header */}
      <div className="accounts-header-block">
        <div className="accounts-title-desc">
          <h2>Account Pipelines & Integrations</h2>
          <p>
            Connect and configure key AI credentials, social network nodes, and publishing channels to fuel your content pipeline.
          </p>
        </div>
        
        {/* Dropdown for Connecting Accounts */}
        <div className="connect-dropdown-wrapper" ref={dropdownRef}>
          <button 
            className="gradient-btn connect-trigger-btn" 
            onClick={() => setShowConnectDropdown(!showConnectDropdown)}
          >
            <HiOutlinePlus /> Connect New Account
          </button>
          
          {showConnectDropdown && (
            <div className="connect-dropdown-menu">
              <button 
                className="dropdown-item" 
                onClick={() => {
                  setShowIgModal(true);
                  setShowConnectDropdown(false);
                }}
              >
                <span className="dropdown-item-icon text-orange">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </span>
                <span>Instagram Account</span>
              </button>
              <button 
                className="dropdown-item" 
                onClick={() => {
                  setShowLiModal(true);
                  setShowConnectDropdown(false);
                }}
              >
                <span className="dropdown-item-icon text-linkedin">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764 0-.973.784-1.763 1.75-1.763s1.75.79 1.75 1.763c0 .974-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </span>
                <span>LinkedIn Account</span>
              </button>
              <button 
                className="dropdown-item" 
                onClick={() => {
                  handleAiDirectLogin('chatgpt');
                  setShowConnectDropdown(false);
                }}
              >
                <span className="dropdown-item-icon text-emerald">
                  <HiOutlineSparkles />
                </span>
                <span>ChatGPT Account</span>
              </button>
              <button 
                className="dropdown-item" 
                onClick={() => {
                  handleAiDirectLogin('claude');
                  setShowConnectDropdown(false);
                }}
              >
                <span className="dropdown-item-icon text-purple">
                  <HiOutlineTerminal />
                </span>
                <span>Claude Account</span>
              </button>
              <button 
                className="dropdown-item" 
                onClick={() => {
                  handleAiDirectLogin('gemini');
                  setShowConnectDropdown(false);
                }}
              >
                <span className="dropdown-item-icon text-indigo">
                  <HiOutlineKey />
                </span>
                <span>Gemini Account</span>
              </button>
              <button 
                className="dropdown-item" 
                onClick={() => {
                  handleAiDirectLogin('flowai');
                  setShowConnectDropdown(false);
                }}
              >
                <span className="dropdown-item-icon text-amber">
                  <HiOutlineLightningBolt />
                </span>
                <span>Flow AI Account</span>
              </button>
              <button 
                className="dropdown-item" 
                onClick={() => {
                  triggerYouTubeOAuth();
                  setShowConnectDropdown(false);
                }}
              >
                <span className="dropdown-item-icon text-red">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.163a3.003 3.003 0 00-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 00-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 002.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.002 3.002 0 002.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </span>
                <span>YouTube Channel</span>
              </button>
              <button 
                className="dropdown-item" 
                onClick={() => {
                  setShowYtStudioModal(true);
                  setShowConnectDropdown(false);
                }}
              >
                <span className="dropdown-item-icon text-red">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.163a3.003 3.003 0 00-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 00-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 002.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.002 3.002 0 002.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </span>
                <span>YouTube Studio API Key</span>
              </button>
              <button 
                className="dropdown-item" 
                onClick={() => {
                  setShowApiKeysModal(true);
                  setShowConnectDropdown(false);
                }}
              >
                <span className="dropdown-item-icon text-indigo">
                  <HiOutlineKey />
                </span>
                <span>AI & Asset API Keys</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Visual Pipeline Node Map */}
      {hasConnectedAccounts && (
        <div className="glass-card pipeline-visualizer-card">
          <div className="card-header-label">ACTIVE INTEGRATION PIPELINES</div>
          {activeInputs.length === 0 && activeOutputs.length === 0 ? (
            <div className="pipelines-empty-state">
              <p>No active pipelines configured. Connect keys or social accounts below to activate the integration mapping.</p>
            </div>
          ) : (
            <div className="pipeline-container">
              
              {/* Left Column (Inputs) */}
              <div className="pipeline-column">
                {activeInputs.map((node) => (
                  <div 
                    key={node.id}
                    className={`pipeline-node active ${node.borderClass}`}
                    onClick={() => document.getElementById(node.sectionId)?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    <div className={`node-icon ${node.bgClass}`}>{node.icon}</div>
                    <div className="node-details">
                      <span className="node-name">{node.name}</span>
                      <span className="node-status">{node.status}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* SVG Connector Lines - Left to Center */}
              <div className="pipeline-svg-wrapper">
                <svg width="100%" height="100%" viewBox="0 0 160 200" preserveAspectRatio="none">
                  {activeInputs.map((node, index) => {
                    const y = getYCoordinate(index, activeInputs.length);
                    const lineClass = 
                      node.id === 'gemini' ? 'active-line-indigo' : 
                      node.id === 'chatgpt' ? 'active-line-emerald' : 
                      node.id === 'claude' ? 'active-line-purple' : 
                      node.id === 'flowai' ? 'active-line-amber' : 
                      'active-line-pink';
                    return (
                      <path 
                        key={node.id}
                        d={`M 10 ${y} C 80 ${y}, 80 100, 150 100`} 
                        className={`connection-line ${lineClass}`}
                      />
                    );
                  })}
                </svg>
              </div>

              {/* Center Engine Node */}
              <div className="pipeline-center-column">
                <div className="pipeline-core-node">
                  <div className="core-orb-ring"></div>
                  <div className="core-orb">
                    <HiOutlineServer />
                  </div>
                  <div className="core-details">
                    <span className="core-name">AaisuuSync</span>
                    <span className="core-desc">Central Engine</span>
                  </div>
                </div>
              </div>

              {/* SVG Connector Lines - Center to Right */}
              <div className="pipeline-svg-wrapper">
                <svg width="100%" height="100%" viewBox="0 0 160 200" preserveAspectRatio="none">
                  {activeOutputs.map((node, index) => {
                    const y = getYCoordinate(index, activeOutputs.length);
                    const lineClass = node.lineClass || 'active-line-orange';
                    return (
                      <path 
                        key={node.id}
                        d={`M 10 100 C 80 100, 80 ${y}, 150 ${y}`} 
                        className={`connection-line ${lineClass}`}
                      />
                    );
                  })}
                </svg>
              </div>

              {/* Right Column (Outputs) */}
              <div className="pipeline-column">
                {activeOutputs.map((node) => (
                  <div 
                    key={node.id}
                    className={`pipeline-node active ${node.borderClass}`}
                    onClick={() => document.getElementById(node.sectionId)?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    <div className={`node-icon ${node.bgClass}`}>{node.icon}</div>
                    <div className="node-details">
                      <span className="node-name">{node.name}</span>
                      <span className="node-status">{node.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Connected Account Details Panel */}
      {hasConnectedAccounts && (
        <div className="glass-card connected-accounts-summary-card">
          <div className="card-header-label">CONNECTED ACCOUNT DETAILS</div>
          <div className="summary-table-container">
            {hasConnectedAccounts ? (
              <table className="summary-table">
                <thead>
                  <tr>
                    <th className="th-account">ACCOUNT</th>
                    <th className="th-platform">PLATFORM</th>
                    <th className="th-status">STATUS</th>
                    <th className="th-role">AUTOMATION ROLE</th>
                    <th className="th-actions">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Instagram Accounts */}
                  {connectedAccounts.instagram.map((acc) => (
                    <tr key={acc.id} className="table-tr">
                      <td className="td-account">
                        <div 
                          className="table-acc-user-link" 
                          onClick={() => handleOpenInBrowser('instagram', acc.username)}
                          title="Open Profile in Chrome"
                        >
                          <div className="avatar-wrapper purple-glow">
                            <img src={acc.avatar} alt={acc.username} className="table-acc-avatar" />
                          </div>
                          <span className="table-acc-handle">@{acc.username}</span>
                        </div>
                      </td>
                      <td className="td-platform">
                        <div className="table-platform-cell">
                          <span className="table-platform-icon text-orange">
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                            </svg>
                          </span>
                          <span className="table-platform-text font-platform-sub font-bold text-orange">INSTAGRAM</span>
                        </div>
                      </td>
                      <td className="td-status">
                        <div className="table-status-cell">
                          <span className={`status-dot-indicator ${acc.status === 'unlinked' ? 'unlinked' : 'healthy'}`}></span>
                          <span className={`status-text-label ${acc.status === 'unlinked' ? 'unlinked' : 'healthy'}`}>
                            {acc.status === 'unlinked' ? 'Unlinked' : 'Healthy'}
                          </span>
                        </div>
                      </td>
                      <td className="td-role">
                        <select 
                          className="table-role-select" 
                          value={acc.role} 
                          onChange={(e) => updateAccountRole('instagram', acc.id, e.target.value)}
                        >
                          <option value="Content Publishing">Content Publishing</option>
                          <option value="DM Automation">DM Automation</option>
                          <option value="Engagement Bot">Engagement Bot</option>
                          <option value="Full Pipeline Agent">Full Pipeline Agent</option>
                        </select>
                      </td>
                      <td className="td-actions">
                        <div className="table-actions-cell">
                          {acc.status === 'unlinked' && (
                            <button 
                              className="table-login-btn"
                              disabled={loggingInId === acc.id}
                              onClick={() => handleTableAccountLogin('instagram', acc.id)}
                            >
                              {loggingInId === acc.id ? (
                                <span className="spinner-loader"></span>
                              ) : (
                                <>
                                  <span className="login-btn-icon">→]</span> Login
                                </>
                              )}
                            </button>
                          )}
                          <button 
                            className="table-trash-btn"
                            onClick={() => handleOpenInBrowser('instagram', acc.username)}
                            title="Open in Chrome Browser"
                            style={{ marginRight: '8px' }}
                          >
                            <HiOutlineGlobe />
                          </button>
                          <button 
                            className="table-trash-btn"
                            onClick={() => handleDisconnect('instagram', acc.id)}
                            title="Disconnect Account"
                          >
                            <HiOutlineTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {/* LinkedIn Accounts */}
                  {connectedAccounts.linkedin && connectedAccounts.linkedin.map((acc) => (
                    <tr key={acc.id} className="table-tr">
                      <td className="td-account">
                        <div 
                          className="table-acc-user-link" 
                          onClick={() => handleOpenInBrowser('linkedin')}
                          title="Open LinkedIn in Chrome"
                        >
                          <div className="avatar-wrapper blue-glow">
                            <img src={acc.avatar} alt={acc.name} className="table-acc-avatar" />
                          </div>
                          <span className="table-acc-handle">@{acc.username}</span>
                        </div>
                      </td>
                      <td className="td-platform">
                        <div className="table-platform-cell">
                          <span className="table-platform-icon text-linkedin">
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764 0-.973.784-1.763 1.75-1.763s1.75.79 1.75 1.763c0 .974-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                            </svg>
                          </span>
                          <span className="table-platform-text font-platform-sub font-bold text-linkedin">LINKEDIN</span>
                        </div>
                      </td>
                      <td className="td-status">
                        <div className="table-status-cell">
                          <span className={`status-dot-indicator ${acc.status === 'unlinked' ? 'unlinked' : 'healthy'}`}></span>
                          <span className={`status-text-label ${acc.status === 'unlinked' ? 'unlinked' : 'healthy'}`}>
                            {acc.status === 'unlinked' ? 'Unlinked' : 'Healthy'}
                          </span>
                        </div>
                      </td>
                      <td className="td-role">
                        <select 
                          className="table-role-select" 
                          value={acc.role} 
                          onChange={(e) => updateAccountRole('linkedin', acc.id, e.target.value)}
                        >
                          <option value="Content Publishing">Content Publishing</option>
                          <option value="B2B Influencer">B2B Influencer</option>
                          <option value="Lead Gen Agent">Lead Gen Agent</option>
                          <option value="Full Pipeline Agent">Full Pipeline Agent</option>
                        </select>
                      </td>
                      <td className="td-actions">
                        <div className="table-actions-cell">
                          {acc.status === 'unlinked' && (
                            <button 
                              className="table-login-btn"
                              disabled={loggingInId === acc.id}
                              onClick={() => handleTableAccountLogin('linkedin', acc.id)}
                            >
                              {loggingInId === acc.id ? (
                                <span className="spinner-loader"></span>
                              ) : (
                                <>
                                  <span className="login-btn-icon">→]</span> Login
                                </>
                              )}
                            </button>
                          )}
                          <button 
                            className="table-trash-btn"
                            onClick={() => handleOpenInBrowser('linkedin')}
                            title="Open in Chrome Browser"
                            style={{ marginRight: '8px' }}
                          >
                            <HiOutlineGlobe />
                          </button>
                          <button 
                            className="table-trash-btn"
                            onClick={() => handleDisconnect('linkedin', acc.id)}
                            title="Disconnect Account"
                          >
                            <HiOutlineTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {/* YouTube Channel */}
                  {connectedAccounts.youtubeChannel && (
                    <tr className="table-tr">
                      <td className="td-account">
                        <div 
                          className="table-acc-user-link" 
                          onClick={() => handleOpenInBrowser('youtubeChannel')}
                          title="Open YouTube Studio in Chrome"
                        >
                          <div className="avatar-wrapper red-glow">
                            <img src={connectedAccounts.youtubeChannel.avatar} alt={connectedAccounts.youtubeChannel.channelName} className="table-acc-avatar" />
                          </div>
                          <span className="table-acc-handle">{connectedAccounts.youtubeChannel.channelName}</span>
                        </div>
                      </td>
                      <td className="td-platform">
                        <div className="table-platform-cell">
                          <span className="table-platform-icon text-red">
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M23.498 6.163a3.003 3.003 0 00-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 00-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 002.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.002 3.002 0 002.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                            </svg>
                          </span>
                          <span className="table-platform-text font-platform-sub font-bold text-red">YOUTUBE</span>
                        </div>
                      </td>
                      <td className="td-status">
                        <div className="table-status-cell">
                          <span className="status-dot-indicator healthy"></span>
                          <span className="status-text-label healthy">Active</span>
                        </div>
                      </td>
                      <td className="td-role">
                        <select 
                          className="table-role-select" 
                          value={connectedAccounts.youtubeChannel.role || 'OAuth Channel'} 
                          onChange={(e) => updateAccountRole('youtubeChannel', null, e.target.value)}
                        >
                          <option value="OAuth Channel">OAuth Channel</option>
                          <option value="Shorts Publisher">Shorts Publisher</option>
                          <option value="Analytics Watcher">Analytics Watcher</option>
                        </select>
                      </td>
                      <td className="td-actions">
                        <div className="table-actions-cell">
                          {connectedAccounts.youtubeChannel.status === 'unlinked' && (
                            <button 
                              className="table-login-btn"
                              disabled={loggingInId === 'youtubeChannel'}
                              onClick={() => handleTableAccountLogin('youtubeChannel', 'youtubeChannel')}
                            >
                              {loggingInId === 'youtubeChannel' ? (
                                <span className="spinner-loader"></span>
                              ) : (
                                <>
                                  <span className="login-btn-icon">→]</span> Login
                                </>
                              )}
                            </button>
                          )}
                          <button 
                            className="table-trash-btn"
                            onClick={() => handleOpenInBrowser('youtubeChannel')}
                            title="Open in Chrome Browser"
                            style={{ marginRight: '8px' }}
                          >
                            <HiOutlineGlobe />
                          </button>
                          <button 
                            className="table-trash-btn"
                            onClick={() => handleDisconnect('youtubeChannel', null)}
                            title="Disconnect Channel"
                          >
                            <HiOutlineTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* YouTube Studio API Key */}
                  {connectedAccounts.youtubeStudio && (
                    <tr className="table-tr">
                      <td className="td-account">
                        <div 
                          className="table-acc-user-link" 
                          onClick={() => handleOpenInBrowser('youtubeStudio')}
                          title="Open YouTube Studio in Chrome"
                        >
                          <div className="avatar-wrapper red-glow-hollow">
                            <span className="table-key-icon"><HiOutlineKey /></span>
                          </div>
                          <span className="table-acc-handle">Studio Credentials</span>
                        </div>
                      </td>
                      <td className="td-platform">
                        <div className="table-platform-cell">
                          <span className="table-platform-icon text-red">
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M23.498 6.163a3.003 3.003 0 00-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 00-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 002.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.002 3.002 0 002.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                            </svg>
                          </span>
                          <span className="table-platform-text font-platform-sub font-bold text-red">YT STUDIO</span>
                        </div>
                      </td>
                      <td className="td-status">
                        <div className="table-status-cell">
                          <span className="status-dot-indicator healthy"></span>
                          <span className="status-text-label healthy">Connected</span>
                        </div>
                      </td>
                      <td className="td-role">
                        <select 
                          className="table-role-select" 
                          value={connectedAccounts.youtubeStudio.role || 'API Key'} 
                          onChange={(e) => updateAccountRole('youtubeStudio', null, e.target.value)}
                        >
                          <option value="API Key">API Key</option>
                          <option value="Heavy Upload Manager">Heavy Upload Manager</option>
                          <option value="Metadata Engine">Metadata Engine</option>
                        </select>
                      </td>
                      <td className="td-actions">
                        <div className="table-actions-cell">
                          {connectedAccounts.youtubeStudio.status === 'unlinked' && (
                            <button 
                              className="table-login-btn"
                              disabled={loggingInId === 'youtubeStudio'}
                              onClick={() => handleTableAccountLogin('youtubeStudio', 'youtubeStudio')}
                            >
                              {loggingInId === 'youtubeStudio' ? (
                                <span className="spinner-loader"></span>
                              ) : (
                                <>
                                  <span className="login-btn-icon">→]</span> Login
                                </>
                              )}
                            </button>
                          )}
                          <button 
                            className="table-trash-btn"
                            onClick={() => handleOpenInBrowser('youtubeStudio')}
                            title="Open in Chrome Browser"
                            style={{ marginRight: '8px' }}
                          >
                            <HiOutlineGlobe />
                          </button>
                          <button 
                            className="table-trash-btn"
                            onClick={() => handleDisconnect('youtubeStudio', null)}
                            title="Disconnect Studio API"
                          >
                            <HiOutlineTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* ChatGPT API */}
                  {isChatgptConnected && (
                    <tr className="table-tr">
                      <td className="td-account">
                        <div 
                          className="table-acc-user-link" 
                          onClick={() => handleOpenInBrowser('chatgpt')}
                          title="Open ChatGPT in Chrome"
                        >
                          <div className="avatar-wrapper emerald-glow-hollow">
                            <span className="table-key-icon" style={{ color: '#10b981' }}><HiOutlineSparkles /></span>
                          </div>
                          <span className="table-acc-handle">ChatGPT</span>
                        </div>
                      </td>
                      <td className="td-platform">
                        <div className="table-platform-cell">
                          <span className="table-platform-icon" style={{ color: '#10b981' }}>
                            <HiOutlineSparkles size={16} />
                          </span>
                          <span className="table-platform-text font-platform-sub font-bold" style={{ color: '#10b981' }}>CHATGPT</span>
                        </div>
                      </td>
                      <td className="td-status">
                        <div className="table-status-cell">
                          <span className="status-dot-indicator healthy"></span>
                          <span className="status-text-label healthy">Active</span>
                        </div>
                      </td>
                      <td className="td-role">
                        <select className="table-role-select" defaultValue="AI Text Engine">
                          <option value="AI Text Engine">AI Text Engine</option>
                          <option value="Content Generator">Content Generator</option>
                          <option value="Caption Writer">Caption Writer</option>
                          <option value="Full Pipeline Agent">Full Pipeline Agent</option>
                        </select>
                      </td>
                      <td className="td-actions">
                        <div className="table-actions-cell">
                          <button 
                            className="table-trash-btn"
                            onClick={() => handleOpenInBrowser('chatgpt')}
                            title="Open in Chrome Browser"
                            style={{ marginRight: '8px' }}
                          >
                            <HiOutlineGlobe />
                          </button>
                          <button className="table-trash-btn" onClick={() => handleDisconnect('chatgpt', null)} title="Disconnect ChatGPT">
                            <HiOutlineTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Claude AI */}
                  {isClaudeConnected && (
                    <tr className="table-tr">
                      <td className="td-account">
                        <div 
                          className="table-acc-user-link" 
                          onClick={() => handleOpenInBrowser('claude')}
                          title="Open Claude in Chrome"
                        >
                          <div className="avatar-wrapper purple-glow-hollow">
                            <span className="table-key-icon" style={{ color: '#8b5cf6' }}><HiOutlineTerminal /></span>
                          </div>
                          <span className="table-acc-handle">Claude AI</span>
                        </div>
                      </td>
                      <td className="td-platform">
                        <div className="table-platform-cell">
                          <span className="table-platform-icon" style={{ color: '#8b5cf6' }}>
                            <HiOutlineTerminal size={16} />
                          </span>
                          <span className="table-platform-text font-platform-sub font-bold" style={{ color: '#8b5cf6' }}>CLAUDE</span>
                        </div>
                      </td>
                      <td className="td-status">
                        <div className="table-status-cell">
                          <span className="status-dot-indicator healthy"></span>
                          <span className="status-text-label healthy">Active</span>
                        </div>
                      </td>
                      <td className="td-role">
                        <select className="table-role-select" defaultValue="AI Reasoning">
                          <option value="AI Reasoning">AI Reasoning</option>
                          <option value="Research Agent">Research Agent</option>
                          <option value="Script Writer">Script Writer</option>
                          <option value="Full Pipeline Agent">Full Pipeline Agent</option>
                        </select>
                      </td>
                      <td className="td-actions">
                        <div className="table-actions-cell">
                          <button 
                            className="table-trash-btn"
                            onClick={() => handleOpenInBrowser('claude')}
                            title="Open in Chrome Browser"
                            style={{ marginRight: '8px' }}
                          >
                            <HiOutlineGlobe />
                          </button>
                          <button className="table-trash-btn" onClick={() => handleDisconnect('claude', null)} title="Disconnect Claude">
                            <HiOutlineTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Gemini AI */}
                  {isGeminiConnected && (
                    <tr className="table-tr">
                      <td className="td-account">
                        <div 
                          className="table-acc-user-link" 
                          onClick={() => handleOpenInBrowser('gemini')}
                          title="Open Gemini in Chrome"
                        >
                          <div className="avatar-wrapper indigo-glow-hollow">
                            <span className="table-key-icon" style={{ color: 'var(--accent-primary)' }}><HiOutlineKey /></span>
                          </div>
                          <span className="table-acc-handle">Gemini AI</span>
                        </div>
                      </td>
                      <td className="td-platform">
                        <div className="table-platform-cell">
                          <span className="table-platform-icon" style={{ color: 'var(--accent-primary)' }}>
                            <HiOutlineKey size={16} />
                          </span>
                          <span className="table-platform-text font-platform-sub font-bold" style={{ color: 'var(--accent-primary)' }}>GEMINI</span>
                        </div>
                      </td>
                      <td className="td-status">
                        <div className="table-status-cell">
                          <span className="status-dot-indicator healthy"></span>
                          <span className="status-text-label healthy">Active</span>
                        </div>
                      </td>
                      <td className="td-role">
                        <select className="table-role-select" defaultValue="AI Text Engine">
                          <option value="AI Text Engine">AI Text Engine</option>
                          <option value="Vision Analyzer">Vision Analyzer</option>
                          <option value="Multimodal Agent">Multimodal Agent</option>
                          <option value="Full Pipeline Agent">Full Pipeline Agent</option>
                        </select>
                      </td>
                      <td className="td-actions">
                        <div className="table-actions-cell">
                          <button 
                            className="table-trash-btn"
                            onClick={() => handleOpenInBrowser('gemini')}
                            title="Open in Chrome Browser"
                            style={{ marginRight: '8px' }}
                          >
                            <HiOutlineGlobe />
                          </button>
                          <button className="table-trash-btn" onClick={() => handleDisconnect('gemini', null)} title="Disconnect Gemini">
                            <HiOutlineTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Flow AI */}
                  {isFlowaiConnected && (
                    <tr className="table-tr">
                      <td className="td-account">
                        <div 
                          className="table-acc-user-link" 
                          onClick={() => handleOpenInBrowser('flowai')}
                          title="Open Flow AI in Chrome"
                        >
                          <div className="avatar-wrapper amber-glow-hollow">
                            <span className="table-key-icon" style={{ color: '#f59e0b' }}><HiOutlineLightningBolt /></span>
                          </div>
                          <span className="table-acc-handle">Flow AI</span>
                        </div>
                      </td>
                      <td className="td-platform">
                        <div className="table-platform-cell">
                          <span className="table-platform-icon" style={{ color: '#f59e0b' }}>
                            <HiOutlineLightningBolt size={16} />
                          </span>
                          <span className="table-platform-text font-platform-sub font-bold" style={{ color: '#f59e0b' }}>FLOW AI</span>
                        </div>
                      </td>
                      <td className="td-status">
                        <div className="table-status-cell">
                          <span className="status-dot-indicator healthy"></span>
                          <span className="status-text-label healthy">Active</span>
                        </div>
                      </td>
                      <td className="td-role">
                        <select className="table-role-select" defaultValue="Workflow Engine">
                          <option value="Workflow Engine">Workflow Engine</option>
                          <option value="Automation Bot">Automation Bot</option>
                          <option value="Task Scheduler">Task Scheduler</option>
                          <option value="Full Pipeline Agent">Full Pipeline Agent</option>
                        </select>
                      </td>
                      <td className="td-actions">
                        <div className="table-actions-cell">
                          <button 
                            className="table-trash-btn"
                            onClick={() => handleOpenInBrowser('flowai')}
                            title="Open in Chrome Browser"
                            style={{ marginRight: '8px' }}
                          >
                            <HiOutlineGlobe />
                          </button>
                          <button className="table-trash-btn" onClick={() => handleDisconnect('flowai', null)} title="Disconnect Flow AI">
                            <HiOutlineTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <div className="accounts-summary-empty">
                <p>No active accounts connected yet. Link Instagram, LinkedIn, or YouTube using the "Connect New Account" button above.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Dashboard Grid layout */}
      <div className="accounts-split-grid">
        
        {/* Left Side: API Keys & YouTube Integrations */}
        <div className="accounts-grid-column">
          
          {/* Section: API Integrations */}
          {(isGeminiConnected || isPexelsConnected) && (
            <div className="glass-card config-card accent-border-indigo" id="api-keys-section">
              <div className="config-card-header">
                <HiOutlineKey className="header-icon text-indigo" />
                <div>
                  <h3>API Key Configuration</h3>
                  <p>Verify keys to validate text & visual generation agents.</p>
                </div>
              </div>
              
              <div className="form-group-stack">
                {/* Gemini Form */}
                <div className="form-element-container">
                  <div className="form-label-row">
                    <label>Google Gemini Pro API Key</label>
                    {geminiValidated ? (
                      <span className="badge-validated"><HiOutlineCheck /> Validated</span>
                    ) : (
                      <span className="badge-unconfigured">Unsaved</span>
                    )}
                  </div>
                  <div className="input-group">
                    <input
                      type={showGemini ? 'text' : 'password'}
                      value={geminiKey}
                      onChange={(e) => {
                        setGeminiKey(e.target.value);
                        setGeminiValidated(false);
                      }}
                      placeholder="AIzaSy..."
                    />
                    <button 
                      className="icon-only-btn" 
                      onClick={() => setShowGemini(!showGemini)}
                      title={showGemini ? 'Hide Key' : 'Reveal Key'}
                    >
                      {showGemini ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                    </button>
                    <button 
                      className="gradient-btn validate-btn"
                      onClick={handleValidateGemini}
                      disabled={isValidatingGemini || !geminiKey}
                    >
                      {isValidatingGemini ? 'Testing...' : 'Verify'}
                    </button>
                  </div>
                </div>

                {/* Pexels Form */}
                <div className="form-element-container">
                  <div className="form-label-row">
                    <label>Pexels Stock API Key</label>
                    {pexelsValidated ? (
                      <span className="badge-validated"><HiOutlineCheck /> Validated</span>
                    ) : (
                      <span className="badge-unconfigured">Unsaved</span>
                    )}
                  </div>
                  <div className="input-group">
                    <input
                      type={showPexels ? 'text' : 'password'}
                      value={pexelsKey}
                      onChange={(e) => {
                        setPexelsKey(e.target.value);
                        setPexelsValidated(false);
                      }}
                      placeholder="Pexels authorization token..."
                    />
                    <button 
                      className="icon-only-btn" 
                      onClick={() => setShowPexels(!showPexels)}
                    >
                      {showPexels ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                    </button>
                    <button 
                      className="gradient-btn validate-btn"
                      onClick={handleValidatePexels}
                      disabled={isValidatingPexels || !pexelsKey}
                    >
                      {isValidatingPexels ? 'Testing...' : 'Verify'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section: YouTube & Studio API */}
          {(isYtStudioConnected || isYtChannelConnected) && (
            <div className="glass-card config-card accent-border-rose" id="youtube-section">
              <div className="config-card-header">
                <svg width="20" height="20" fill="#ff0033" viewBox="0 0 24 24" className="header-icon">
                  <path d="M23.498 6.163a3.003 3.003 0 00-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 00-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 002.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.002 3.002 0 002.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                <div>
                  <h3>YouTube Channel & Studio</h3>
                  <p>Authorize publishing shortcuts and upload analytics feeds.</p>
                </div>
              </div>

              <div className="youtube-panels-split">
                {/* Studio Key */}
                <div className="youtube-panel-card">
                  <div className="panel-title-row">
                    <h5>YouTube Studio API</h5>
                    <StatusBadge 
                      status={isYtStudioConnected ? 'configured' : 'offline'} 
                      label={isYtStudioConnected ? 'CONNECTED' : 'DISCONNECTED'} 
                    />
                  </div>
                  {isYtStudioConnected ? (
                    <div className="youtube-active-status">
                      <div className="stat-row">
                        <span>Quota Usage</span>
                        <span className="text-white font-medium">{connectedAccounts.youtubeStudio.apiQuota}</span>
                      </div>
                      <div className="stat-row">
                        <span>Sync Date</span>
                        <span>{connectedAccounts.youtubeStudio.connectedAt}</span>
                      </div>
                      <button 
                        className="outline-btn disconnect-btn" 
                        onClick={() => {
                          disconnectYouTubeStudio();
                        }}
                      >
                        Disconnect Studio Key
                      </button>
                    </div>
                  ) : (
                    <div className="youtube-unconnected">
                      <p className="description-text">Needs YouTube Studio Developer API key to push high-definition uploads and manage thumbnails.</p>
                      <button className="gradient-btn font-sm" onClick={() => setShowYtStudioModal(true)}>
                        Connect Studio Key
                      </button>
                    </div>
                  )}
                </div>

                {/* YouTube Channel OAuth */}
                <div className="youtube-panel-card">
                  <div className="panel-title-row">
                    <h5>YouTube Channel OAuth</h5>
                    <StatusBadge 
                      status={isYtChannelConnected ? 'active' : 'offline'} 
                      label={isYtChannelConnected ? 'LINKED' : 'UNCONNECTED'} 
                    />
                  </div>
                  {isYtChannelConnected ? (
                    <div className="youtube-channel-linked-info">
                      <div className="channel-avatar-details">
                        <img 
                          src={connectedAccounts.youtubeChannel.avatar} 
                          alt="Channel Avatar" 
                          className="channel-pic"
                        />
                        <div>
                          <h6>{connectedAccounts.youtubeChannel.channelName}</h6>
                          <span>{connectedAccounts.youtubeChannel.channelId}</span>
                        </div>
                      </div>
                      <div className="channel-statistics">
                        <div className="stat-pill">
                          <span>Subs</span>
                          <strong>{connectedAccounts.youtubeChannel.subscribers}</strong>
                        </div>
                        <div className="stat-pill">
                          <span>Videos</span>
                          <strong>{connectedAccounts.youtubeChannel.videos}</strong>
                        </div>
                      </div>
                      <button 
                        className="outline-btn disconnect-btn" 
                        onClick={() => {
                          disconnectYouTubeChannel();
                        }}
                      >
                        Unlink Google Account
                      </button>
                    </div>
                  ) : (
                    <div className="youtube-unconnected">
                      <p className="description-text">Link your Google Account via secure OAuth to retrieve channel statistics and schedule shorts.</p>
                      <button className="gradient-btn font-sm" onClick={triggerYouTubeOAuth}>
                        Link YouTube Channel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Instagram Account Manager */}
        {isInstagramConnected && (
          <div className="accounts-grid-column" id="instagram-section">
            
            <div className="glass-card config-card accent-border-orange">
              <div className="config-card-header-with-action">
                <div className="header-meta">
                  <svg width="20" height="20" fill="#f97316" viewBox="0 0 24 24" className="header-icon">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                  <div>
                    <h3>Instagram Automation Hub</h3>
                    <p>Deploy agent bots to control DMs, publish reels, and scan engagement profiles.</p>
                  </div>
                </div>
                <button className="gradient-btn font-sm" onClick={() => setShowIgModal(true)}>
                  <HiOutlinePlus /> Connect Account
                </button>
              </div>

              {/* List of accounts */}
              <div className="instagram-accounts-list">
                {connectedAccounts.instagram.length > 0 ? (
                  connectedAccounts.instagram.map((acc) => (
                    <div key={acc.id} className="instagram-account-row glass-card">
                      <div className="acc-info-block">
                        <img src={acc.avatar} alt={acc.username} className="acc-profile-pic" />
                        <div className="acc-details">
                          <div className="acc-name-handle">
                            <h5>@{acc.username}</h5>
                            <span className="role-tag">{acc.role}</span>
                          </div>
                          <div className="acc-stats">
                            <span>Followers: <strong>{acc.followers}</strong></span>
                            <span>•</span>
                            <span>Posts: <strong>{acc.posts}</strong></span>
                          </div>
                        </div>
                      </div>
                      <div className="acc-actions-block">
                        <StatusBadge status={acc.status} label="HEALTHY" />
                        <button 
                          className="delete-icon-btn" 
                          onClick={() => {
                            disconnectInstagram(acc.id);
                          }}
                          title="Disconnect Account"
                        >
                          <HiOutlineTrash />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-accounts-placeholder">
                    <div className="placeholder-icon">
                      <svg width="40" height="40" fill="var(--text-muted)" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                      </svg>
                    </div>
                    <h5>No Instagram Accounts</h5>
                    <p>Connect an account to let the AaisuuSync automation daemon start publishing content batches.</p>
                    <button className="gradient-btn font-sm mt-3" onClick={() => setShowIgModal(true)}>
                      Connect Account
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>


      {/* MODAL: Connect Instagram */}
      <Modal
        isOpen={showIgModal}
        onClose={() => {
          if (!isIgConnecting) {
            setShowIgModal(false);
            setIsBrowserLaunched(false);
            setIsChromeAlreadyOpen(false);
            setCheckLoginStatusText('');
            setDetectedSession(null);
          }
        }}
        title="Connect Instagram Account"
        footer={
          <>
            <button 
              className="outline-btn" 
              onClick={() => {
                setShowIgModal(false);
                setIsBrowserLaunched(false);
                setIsChromeAlreadyOpen(false);
                setCheckLoginStatusText('');
                setDetectedSession(null);
              }}
              disabled={isIgConnecting || isScanningSession}
            >
              Cancel
            </button>
            {!isBrowserLaunched && !isScanningSession && !detectedSession && (
              <button 
                className="gradient-btn" 
                onClick={() => handleLaunchIgBrowser()}
                disabled={isIgConnecting}
              >
                {isIgConnecting ? 'Launching...' : 'Launch Login Browser'}
              </button>
            )}
            {detectedSession && (
              <>
                <button
                  className="outline-btn"
                  onClick={() => {
                    handleLaunchIgBrowser({ forceNew: true });
                    setDetectedSession(null);
                  }}
                  style={{ border: '1px dashed rgba(239,68,68,0.4)', color: 'var(--danger)' }}
                >
                  Connect Different Account
                </button>
                <button
                  className="gradient-btn"
                  onClick={async () => {
                    try {
                      await fetch('/api/instagram/close-browser', { method: 'POST' });
                    } catch (e) {
                      console.error('Failed to close browser:', e);
                    }
                    connectInstagram(detectedSession.username, null, igRole, detectedSession);
                    setShowIgModal(false);
                    setDetectedSession(null);
                  }}
                >
                  Connect @{detectedSession.username}
                </button>
              </>
            )}
          </>
        }
      >
        {isScanningSession ? (
          <div className="connector-loading-screen" style={{ padding: '30px 0' }}>
            <div className="spinner-loader" style={{ width: '36px', height: '36px', borderWidth: '3px' }}></div>
            <h4 style={{ marginTop: '16px' }}>Scanning Saved Sessions...</h4>
            <p className="form-info-p" style={{ textAlign: 'center' }}>Checking if there is already an authenticated Instagram session inside the local Chrome workspace.</p>
          </div>
        ) : detectedSession ? (
          <div className="modal-form-stack">
            <p className="form-info-p">We found an active, already authenticated Instagram session inside the local browser. You can link this profile immediately or launch a new login window.</p>
            
            {/* Detected Account Card */}
            <div className="glass-card instagram-account-row" style={{ background: 'rgba(255,255,255,0.03)', border: '1.5px solid var(--accent-primary)', boxShadow: '0 0 16px var(--accent-glow)', padding: '18px' }}>
              <div className="acc-info-block">
                <img src={detectedSession.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=60'} alt={detectedSession.username} className="acc-profile-pic" style={{ width: '54px', height: '54px', border: '2px solid var(--accent-primary)' }} />
                <div className="acc-details">
                  <div className="acc-name-handle">
                    <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#fff' }}>@{detectedSession.username}</h4>
                    <span className="role-tag" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>ACTIVE SESSION</span>
                  </div>
                  <div className="acc-stats" style={{ marginTop: '4px' }}>
                    <span>Followers: <strong>{detectedSession.followers || '0'}</strong></span>
                    <span>•</span>
                    <span>Posts: <strong>{detectedSession.posts || '0'}</strong></span>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-element" style={{ marginTop: '8px' }}>
              <label>Assign Automation Role for @{detectedSession.username}</label>
              <select value={igRole} onChange={(e) => setIgRole(e.target.value)} style={{ width: '100%' }}>
                <option>Content Publishing</option>
                <option>DM Automation</option>
                <option>Engagement Bot</option>
                <option>Full Pipeline Agent</option>
              </select>
            </div>
          </div>
        ) : isBrowserLaunched ? (
          <div className="connector-loading-screen">
            <div className="loading-orbit">
              <div className="orbit-ball" style={{ animation: 'spin 1.5s linear infinite' }}></div>
              <div className="orbit-logo">
                <svg width="24" height="24" fill="#f97316" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </div>
            </div>
            <h4>Browser Login Mode Active</h4>
            <p className="form-info-p" style={{ textAlign: 'center', margin: '8px 0 16px' }}>
              {isChromeAlreadyOpen ? 
                'We detected that your Chrome Testing window is already open! Please complete your login directly on Instagram in the open window.' : 
                'We opened a secure Chrome window. Please complete your login directly on Instagram inside the browser.'
              }
            </p>
            <div className="connection-steps-list" style={{ width: '100%' }}>
              {igConnectSteps.map((step, idx) => {
                const isWatching = step.includes('Watching');
                const isFailed = step.toLowerCase().includes('failed') || step.toLowerCase().includes('closed') || step.toLowerCase().includes('error');
                return (
                  <div key={idx} className="step-row animated-step">
                    {isWatching ? (
                      <div className="blinking-dot" />
                    ) : isFailed ? (
                      <div className="error-dot" />
                    ) : (
                      <HiOutlineCheck className="check-success" />
                    )}
                    <span className={isWatching ? 'pulse-text' : ''}>{step}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <form className="modal-form-stack" onSubmit={(e) => { e.preventDefault(); handleLaunchIgBrowser(); }}>
            <p className="form-info-p">Instagram authentication is handled directly in a secure local browser window to allow the agent to publish reels and check DMs.</p>
            
            <div className="form-element">
              <label>Automation Agent Role</label>
              <select value={igRole} onChange={(e) => setIgRole(e.target.value)}>
                <option>Content Publishing</option>
                <option>DM Automation</option>
                <option>Engagement Bot</option>
                <option>Full Pipeline Agent</option>
              </select>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL: Connect YouTube OAuth */}
      <Modal
        isOpen={showYtModal}
        onClose={() => {
          if (!isYtConnecting) setShowYtModal(false);
        }}
        title="Link Google Account / YouTube Channel"
        footer={
          <button 
            className="outline-btn" 
            onClick={() => setShowYtModal(false)}
            disabled={isYtConnecting}
          >
            Cancel
          </button>
        }
      >
        {isYtConnecting ? (
          <div className="connector-loading-screen">
            <div className="loading-orbit">
              <div className="orbit-ball" style={{ animation: 'spin 1.5s linear infinite' }}></div>
              <div className="orbit-logo">
                <svg width="24" height="24" fill="#ff0033" viewBox="0 0 24 24">
                  <path d="M23.498 6.163a3.003 3.003 0 00-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 00-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 002.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.002 3.002 0 002.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </div>
            </div>
            <h4>Verifying OAuth Permission Tokens</h4>
            <div className="connection-steps-list" style={{ width: '100%' }}>
              {ytConnectSteps.map((step, idx) => {
                const isActive = idx === ytConnectSteps.length - 1 && isYtConnecting;
                const isFailed = step.toLowerCase().includes('failed') || step.toLowerCase().includes('closed') || step.toLowerCase().includes('error');
                return (
                  <div key={idx} className="step-row animated-step">
                    {isActive ? (
                      <div className="blinking-dot" />
                    ) : isFailed ? (
                      <div className="error-dot" />
                    ) : (
                      <HiOutlineCheck className="check-success" />
                    )}
                    <span className={isActive ? 'pulse-text' : ''}>{step}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="oauth-account-picker">
            <p className="oauth-info">Choose a Google Account to authorize AaisuuSync to post to your YouTube channel:</p>
            
            <div className="google-accounts-stack">
              <div 
                className="google-account-item"
                onClick={() => selectGoogleAccount('Abhay Gupta Tech', '@abhay_tech', '10.5K', 42, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=60')}
              >
                <div className="account-meta">
                  <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=60" alt="Profile" className="user-icon" />
                  <div>
                    <h6>Abhay Gupta</h6>
                    <span>abhay@gmail.com</span>
                  </div>
                </div>
                <div className="channel-tag">Channel: Abhay Gupta Tech</div>
              </div>

              <div 
                className="google-account-item"
                onClick={() => selectGoogleAccount('VibeSync Shorts', '@vibesync_shorts', '98.1K', 312, 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=60')}
              >
                <div className="account-meta">
                  <img src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=60" alt="Profile" className="user-icon" />
                  <div>
                    <h6>AaisuuSync Brands</h6>
                    <span>brands@aaisuusync.pro</span>
                  </div>
                </div>
                <div className="channel-tag">Channel: VibeSync Shorts</div>
              </div>

              <div 
                className="google-account-item"
                onClick={() => selectGoogleAccount('PixelVibe AI', '@pixelvibe_ai', '1.1K', 8, 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=60')}
              >
                <div className="account-meta">
                  <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=60" alt="Profile" className="user-icon" />
                  <div>
                    <h6>Personal Projects</h6>
                    <span>dev@abhay.me</span>
                  </div>
                </div>
                <div className="channel-tag">Channel: PixelVibe AI</div>
              </div>
            </div>

            <div className="oauth-security-note">
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.9L10 1.154l7.834 3.746v6.23c0 4.887-3.35 9.47-7.834 10.37-4.484-.9-7.834-5.483-7.834-10.37V4.9zM10 3.037L3.666 6.077v5.053c0 3.864 2.553 7.544 6.334 8.358 3.781-.814 6.334-4.494 6.334-8.358V6.077L10 3.037zM9 13a1 1 0 112 0v2a1 1 0 11-2 0v-2zm1-8a1 1 0 00-1 1v5a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>Connections are secured via Google Identity Services and encrypted with AES-256 tokens locally.</span>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL: Connect YouTube Studio Key */}
      <Modal
        isOpen={showYtStudioModal}
        onClose={() => setShowYtStudioModal(false)}
        title="Connect YouTube Studio API Key"
        footer={
          <>
            <button className="outline-btn" onClick={() => setShowYtStudioModal(false)}>Cancel</button>
            <button className="gradient-btn" onClick={handleConnectYtStudio} disabled={!ytStudioInput}>Save API Key</button>
          </>
        }
      >
        <form className="modal-form-stack" onSubmit={handleConnectYtStudio}>
          <p className="form-info-p">Enter your YouTube Studio Developers Data API key. You can find or create this key inside Google Cloud Console.</p>
          
          <div className="form-element">
            <label>YouTube Data API v3 Key</label>
            <div className="input-with-icon-wrapper">
              <HiOutlineKey className="input-icon" />
              <input 
                type={showYtStudio ? 'text' : 'password'} 
                value={ytStudioInput} 
                onChange={(e) => setYtStudioInput(e.target.value)} 
                placeholder="AIzaSy..." 
                required
              />
              <button 
                type="button"
                className="inside-input-reveal"
                onClick={() => setShowYtStudio(!showYtStudio)}
              >
                {showYtStudio ? <HiOutlineEyeOff /> : <HiOutlineEye />}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* MODAL: Connect LinkedIn */}
      <Modal
        isOpen={showLiModal}
        onClose={() => {
          if (!isLiConnecting) setShowLiModal(false);
        }}
        title="Connect LinkedIn Account"
        footer={
          <>
            <button 
              className="outline-btn" 
              onClick={() => setShowLiModal(false)}
              disabled={isLiConnecting}
            >
              Cancel
            </button>
            <button 
              className="gradient-btn" 
              onClick={handleConnectLinkedIn}
              disabled={isLiConnecting || !liUsername || !liName}
            >
              {isLiConnecting ? 'Connecting...' : 'Authorize Agent'}
            </button>
          </>
        }
      >
        {isLiConnecting ? (
          <div className="connector-loading-screen">
            <div className="loading-orbit">
              <div className="orbit-ball" style={{ animation: 'spin 1.5s linear infinite' }}></div>
              <div className="orbit-logo">
                <svg width="24" height="24" fill="#0a66c2" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764 0-.973.784-1.763 1.75-1.763s1.75.79 1.75 1.763c0 .974-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </div>
            </div>
            <h4>Linking LinkedIn Profile</h4>
            <div className="connection-steps-list" style={{ width: '100%' }}>
              {liConnectSteps.map((step, idx) => {
                const isActive = idx === liConnectSteps.length - 1 && isLiConnecting;
                const isFailed = step.toLowerCase().includes('failed') || step.toLowerCase().includes('closed') || step.toLowerCase().includes('error');
                return (
                  <div key={idx} className="step-row animated-step">
                    {isActive ? (
                      <div className="blinking-dot" />
                    ) : isFailed ? (
                      <div className="error-dot" />
                    ) : (
                      <HiOutlineCheck className="check-success" />
                    )}
                    <span className={isActive ? 'pulse-text' : ''}>{step}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <form className="modal-form-stack" onSubmit={handleConnectLinkedIn}>
            <p className="form-info-p">Enter LinkedIn profile credentials. AaisuuSync registers an automation agent using these details to publish corporate posts.</p>
            
            <div className="form-element">
              <label>LinkedIn Username / Handle</label>
              <div className="input-with-icon-wrapper">
                <HiOutlineUser className="input-icon" />
                <input 
                  type="text" 
                  value={liUsername} 
                  onChange={(e) => setLiUsername(e.target.value)} 
                  placeholder="e.g. abhaygupta"
                  required
                />
              </div>
            </div>

            <div className="form-element">
              <label>Full Display Name</label>
              <div className="input-with-icon-wrapper">
                <HiOutlineUser className="input-icon" />
                <input 
                  type="text" 
                  value={liName} 
                  onChange={(e) => setLiName(e.target.value)} 
                  placeholder="e.g. Abhay Gupta"
                  required
                />
              </div>
            </div>

            <div className="form-element">
              <label>Automation Puppet Role</label>
              <select value={liRole} onChange={(e) => setLiRole(e.target.value)}>
                <option>Content Publishing</option>
                <option>B2B Influencer</option>
                <option>Lead Gen Agent</option>
                <option>Full Pipeline Agent</option>
              </select>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL: Configure API Keys */}
      <Modal
        isOpen={showApiKeysModal}
        onClose={() => setShowApiKeysModal(false)}
        title="Configure AI & Asset API Keys"
        footer={
          <button 
            className="outline-btn" 
            onClick={() => setShowApiKeysModal(false)}
          >
            Close
          </button>
        }
      >
        <div className="modal-form-stack">
          <p className="form-info-p">Provide API keys to enable core agent generation features. Keys are verified and stored locally in your browser context.</p>
          
          {/* Gemini Form */}
          <div className="form-element">
            <div className="form-label-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label>Google Gemini Pro API Key</label>
              {geminiValidated ? (
                <span className="badge-validated"><HiOutlineCheck /> Validated</span>
              ) : (
                <span className="badge-unconfigured">Unsaved</span>
              )}
            </div>
            <div className="input-group">
              <input
                type={showGemini ? 'text' : 'password'}
                value={geminiKey}
                onChange={(e) => {
                  setGeminiKey(e.target.value);
                  setGeminiValidated(false);
                }}
                placeholder="AIzaSy..."
              />
              <button 
                className="icon-only-btn" 
                onClick={() => setShowGemini(!showGemini)}
                title={showGemini ? 'Hide Key' : 'Reveal Key'}
              >
                {showGemini ? <HiOutlineEyeOff /> : <HiOutlineEye />}
              </button>
              <button 
                className="gradient-btn validate-btn"
                onClick={handleValidateGemini}
                disabled={isValidatingGemini || !geminiKey}
              >
                {isValidatingGemini ? 'Testing...' : 'Verify'}
              </button>
            </div>
            <div className="direct-login-row" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button 
                className="direct-login-text-btn" 
                onClick={() => handleAiDirectLogin('gemini')}
                style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 0', textDecoration: 'underline' }}
              >
                <HiOutlineGlobe /> Or Direct Browser Login
              </button>
            </div>
          </div>

          {/* ChatGPT Form */}
          <div className="form-element" style={{ marginTop: '16px' }}>
            <div className="form-label-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label>ChatGPT (OpenAI) API Key</label>
              {chatgptValidated ? (
                <span className="badge-validated"><HiOutlineCheck /> Validated</span>
              ) : (
                <span className="badge-unconfigured">Unsaved</span>
              )}
            </div>
            <div className="input-group">
              <input
                type={showChatgpt ? 'text' : 'password'}
                value={chatgptKey}
                onChange={(e) => {
                  setChatgptKey(e.target.value);
                  setChatgptValidated(false);
                }}
                placeholder="sk-proj-..."
              />
              <button 
                className="icon-only-btn" 
                onClick={() => setShowChatgpt(!showChatgpt)}
                title={showChatgpt ? 'Hide Key' : 'Reveal Key'}
              >
                {showChatgpt ? <HiOutlineEyeOff /> : <HiOutlineEye />}
              </button>
              <button 
                className="gradient-btn validate-btn"
                onClick={handleValidateChatgpt}
                disabled={isValidatingChatgpt || !chatgptKey}
              >
                {isValidatingChatgpt ? 'Testing...' : 'Verify'}
              </button>
            </div>
            <div className="direct-login-row" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button 
                className="direct-login-text-btn" 
                onClick={() => handleAiDirectLogin('chatgpt')}
                style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 0', textDecoration: 'underline' }}
              >
                <HiOutlineGlobe /> Or Direct Browser Login
              </button>
            </div>
          </div>

          {/* Claude Form */}
          <div className="form-element" style={{ marginTop: '16px' }}>
            <div className="form-label-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label>Anthropic Claude API Key</label>
              {claudeValidated ? (
                <span className="badge-validated"><HiOutlineCheck /> Validated</span>
              ) : (
                <span className="badge-unconfigured">Unsaved</span>
              )}
            </div>
            <div className="input-group">
              <input
                type={showClaude ? 'text' : 'password'}
                value={claudeKey}
                onChange={(e) => {
                  setClaudeKey(e.target.value);
                  setClaudeValidated(false);
                }}
                placeholder="sk-ant-..."
              />
              <button 
                className="icon-only-btn" 
                onClick={() => setShowClaude(!showClaude)}
                title={showClaude ? 'Hide Key' : 'Reveal Key'}
              >
                {showClaude ? <HiOutlineEyeOff /> : <HiOutlineEye />}
              </button>
              <button 
                className="gradient-btn validate-btn"
                onClick={handleValidateClaude}
                disabled={isValidatingClaude || !claudeKey}
              >
                {isValidatingClaude ? 'Testing...' : 'Verify'}
              </button>
            </div>
            <div className="direct-login-row" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button 
                className="direct-login-text-btn" 
                onClick={() => handleAiDirectLogin('claude')}
                style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 0', textDecoration: 'underline' }}
              >
                <HiOutlineGlobe /> Or Direct Browser Login
              </button>
            </div>
          </div>

          {/* Flow AI Form */}
          <div className="form-element" style={{ marginTop: '16px' }}>
            <div className="form-label-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label>Flow AI API Key</label>
              {flowaiValidated ? (
                <span className="badge-validated"><HiOutlineCheck /> Validated</span>
              ) : (
                <span className="badge-unconfigured">Unsaved</span>
              )}
            </div>
            <div className="input-group">
              <input
                type={showFlowai ? 'text' : 'password'}
                value={flowaiKey}
                onChange={(e) => {
                  setFlowaiKey(e.target.value);
                  setFlowaiValidated(false);
                }}
                placeholder="flow-api-..."
              />
              <button 
                className="icon-only-btn" 
                onClick={() => setShowFlowai(!showFlowai)}
                title={showFlowai ? 'Hide Key' : 'Reveal Key'}
              >
                {showFlowai ? <HiOutlineEyeOff /> : <HiOutlineEye />}
              </button>
              <button 
                className="gradient-btn validate-btn"
                onClick={handleValidateFlowai}
                disabled={isValidatingFlowai || !flowaiKey}
              >
                {isValidatingFlowai ? 'Testing...' : 'Verify'}
              </button>
            </div>
            <div className="direct-login-row" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button 
                className="direct-login-text-btn" 
                onClick={() => handleAiDirectLogin('flowai')}
                style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 0', textDecoration: 'underline' }}
              >
                <HiOutlineGlobe /> Or Direct Browser Login
              </button>
            </div>
          </div>

          {/* Pexels Form */}
          <div className="form-element" style={{ marginTop: '16px' }}>
            <div className="form-label-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label>Pexels Stock API Key</label>
              {pexelsValidated ? (
                <span className="badge-validated"><HiOutlineCheck /> Validated</span>
              ) : (
                <span className="badge-unconfigured">Unsaved</span>
              )}
            </div>
            <div className="input-group">
              <input
                type={showPexels ? 'text' : 'password'}
                value={pexelsKey}
                onChange={(e) => {
                  setPexelsKey(e.target.value);
                  setPexelsValidated(false);
                }}
                placeholder="Pexels authorization token..."
              />
              <button 
                className="icon-only-btn" 
                onClick={() => setShowPexels(!showPexels)}
              >
                {showPexels ? <HiOutlineEyeOff /> : <HiOutlineEye />}
              </button>
              <button 
                className="gradient-btn validate-btn"
                onClick={handleValidatePexels}
                disabled={isValidatingPexels || !pexelsKey}
              >
                {isValidatingPexels ? 'Testing...' : 'Verify'}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* MODAL: AI Direct Browser Login Connector */}
      <Modal
        isOpen={isAiDirectConnecting}
        onClose={() => {
          if (!isValidatingAiDirect) setIsAiDirectConnecting(false);
        }}
        title={`Authorize ${aiConnectPlatform} Agent`}
      >
        <div className="connector-loading-screen">
          <div className="loading-orbit">
            <div className="orbit-ball" style={{ animation: 'spin 1.5s linear infinite' }}></div>
            <div className="orbit-logo">
              {aiConnectPlatform === 'ChatGPT' ? (
                <HiOutlineSparkles style={{ fontSize: '24px', color: '#10b981' }} />
              ) : aiConnectPlatform === 'Claude' ? (
                <HiOutlineTerminal style={{ fontSize: '24px', color: '#8b5cf6' }} />
              ) : aiConnectPlatform === 'Flow AI' ? (
                <HiOutlineLightningBolt style={{ fontSize: '24px', color: '#f59e0b' }} />
              ) : (
                <HiOutlineKey style={{ fontSize: '24px', color: 'var(--accent-primary)' }} />
              )}
            </div>
          </div>
          <h4>Browser Auth Active</h4>
          <p className="form-info-p" style={{ textAlign: 'center', margin: '8px 0 16px' }}>
            We opened a secure Chrome window. Please complete your login directly on the platform inside the browser. Once logged in, this modal will automatically authorize.
          </p>
          <div className="connection-steps-list" style={{ width: '100%' }}>
            {aiConnectSteps.map((step, idx) => {
              const isActive = idx === aiConnectSteps.length - 1 && isAiDirectConnecting;
              const isFailed = step.toLowerCase().includes('failed') || step.toLowerCase().includes('closed') || step.toLowerCase().includes('error');
              return (
                <div key={idx} className="step-row animated-step">
                  {isActive ? (
                    <div className="blinking-dot" />
                  ) : isFailed ? (
                    <div className="error-dot" />
                  ) : (
                    <HiOutlineCheck className="check-success" />
                  )}
                  <span className={isActive ? 'pulse-text' : ''}>{step}</span>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>
    </div>
  );
}
