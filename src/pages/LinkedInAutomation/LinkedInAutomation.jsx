import React, { useState, useEffect, useRef } from 'react';
import {
  HiOutlineLink,
  HiOutlinePencilAlt,
  HiOutlineUserAdd,
  HiOutlineChartSquareBar,
  HiOutlineCalendar,
  HiOutlineSparkles,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineAdjustments,
  HiOutlineRefresh,
  HiOutlinePaperAirplane,
  HiOutlineTrendingUp,
  HiOutlineUserGroup,
  HiOutlineEye,
  HiOutlineTrash,
  HiOutlineCheck,
  HiOutlineChatAlt2,
  HiOutlineChevronRight,
  HiOutlinePlay,
  HiOutlineFire,
  HiOutlineClipboardList,
  HiOutlineUpload,
  HiOutlinePhotograph,
  HiOutlineDocumentText,
  HiOutlinePlus,
} from 'react-icons/hi';
import Tabs from '../../components/Tabs/Tabs';
import Modal from '../../components/Modal/Modal';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import './LinkedInAutomation.css';

const mainTabs = [
  { id: 'pipeline', label: 'Pipeline Dashboard', icon: <HiOutlineChartSquareBar /> },
  { id: 'writer', label: 'AI Post Writer', icon: <HiOutlinePencilAlt /> },
  { id: 'outreach', label: 'Outreach & Connections', icon: <HiOutlineUserAdd /> },
  { id: 'analytics', label: 'LinkedIn Analytics', icon: <HiOutlineTrendingUp /> },
];

const initialScheduled = [];
const initialPublished = [];
const initialLeads = [];

const mockAnalytics = {
  viewsData: [
    { day: 'Mon', count: 240 },
    { day: 'Tue', count: 310 },
    { day: 'Wed', count: 180 },
    { day: 'Thu', count: 420 },
    { day: 'Fri', count: 530 },
    { day: 'Sat', count: 290 },
    { day: 'Sun', count: 380 },
  ]
};

const generationSteps = [
  'Reading LinkedIn B2B trending hashtags...',
  'Analyzing audience engagement hook structures...',
  'Structuring message paragraphs with markdown formatting...',
  'Polishing body narrative & embedding emojis...',
  'Optimizing CTA text for social CTR...'
];

export default function LinkedInAutomation() {
  const { currentUser } = useAuth();
  const uid = currentUser?.id || '';
  const uk = (key) => uid ? `${uid}_${key}` : key;
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem(uk('aaisuu_active_tab_linkedin')) || 'pipeline';
  });

  useEffect(() => {
    localStorage.setItem(uk('aaisuu_active_tab_linkedin'), activeTab);
  }, [activeTab, uid]);

  const [systemOn, setSystemOn] = useState(false);
  const { connectedAccounts, connectLinkedIn, disconnectLinkedIn, currentModel } = useApp();

  // LinkedIn Connect Modal states
  const [showLiModal, setShowLiModal] = useState(false);
  const [liUsername, setLiUsername] = useState('');
  const [liName, setLiName] = useState('');
  const [liRole, setLiRole] = useState('B2B Influencer');
  const [isLiConnecting, setIsLiConnecting] = useState(false);
  const [liConnectSteps, setLiConnectSteps] = useState([]);

  // New Writer modes & Uploaded files states
  const [writerMode, setWriterMode] = useState('manual'); // 'manual' | 'autopilot' | 'media'
  const [attachedFile, setAttachedFile] = useState(null); // { name, size, type, previewUrl }
  const [autoSchedule, setAutoSchedule] = useState(false);
  const [scheduledTimeSelect, setScheduledTimeSelect] = useState('Tomorrow 10:00 AM');
  
  const [isAnalyzingFile, setIsAnalyzingFile] = useState(false);
  const [fileAnalysisStepIndex, setFileAnalysisStepIndex] = useState(0);
  
  const [isAutopilotGenerating, setIsAutopilotGenerating] = useState(false);
  const [autopilotStepIndex, setAutopilotStepIndex] = useState(0);

  const autopilotSteps = [
    'Scanning LinkedIn profile details...',
    'Extracting career highlights & headline metadata...',
    'Analyzing niche positioning & target audience B2B markers...',
    'Synthesizing thought-leadership content strategy...',
    'Drafting industry-aligned micro-blog update...'
  ];

  const imageAnalysisSteps = [
    'Reading image file dimensions & color profiles...',
    'Running Gemini Vision optical character recognition (OCR)...',
    'Extracting key visual subjects & layout labels...',
    'Drafting media-oriented post caption & hashtags...',
    'Preparing local attachment bundle for publication...'
  ];

  const documentAnalysisSteps = [
    'Uploading document structure to parsing buffer...',
    'Analyzing document pages & extracting core titles...',
    'Synthesizing main takeaways & executive summary...',
    'Drafting post caption with document attachment reference...',
    'Preparing local attachment bundle for publication...'
  ];

  const activeAnalysisSteps = attachedFile && attachedFile.type.startsWith('image/') 
    ? imageAnalysisSteps 
    : documentAnalysisSteps;

  const handleConnectLinkedInSubmit = (e) => {
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

  const handleDisconnectLinkedIn = (id) => {
    disconnectLinkedIn(id);
  };

  // Load scheduled posts from localStorage or initial
  const [scheduledPosts, setScheduledPosts] = useState(() => {
    const saved = localStorage.getItem(uk('aaisu_linkedin_scheduled'));
    return saved ? JSON.parse(saved) : initialScheduled;
  });

  // Load published posts from localStorage or initial
  const [publishedPosts, setPublishedPosts] = useState(() => {
    const saved = localStorage.getItem(uk('aaisu_linkedin_published'));
    return saved ? JSON.parse(saved) : initialPublished;
  });

  // Save to localStorage whenever states change
  useEffect(() => {
    localStorage.setItem(uk('aaisu_linkedin_scheduled'), JSON.stringify(scheduledPosts));
  }, [scheduledPosts]);

  useEffect(() => {
    localStorage.setItem(uk('aaisu_linkedin_published'), JSON.stringify(publishedPosts));
  }, [publishedPosts]);

  // AI Post Writer Form States
  const [topicInput, setTopicInput] = useState('');
  const [toneSelect, setToneSelect] = useState('Thought Leader');
  const [lengthSelect, setLengthSelect] = useState('Medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [generatedPostText, setGeneratedPostText] = useState('');
  const [editorText, setEditorText] = useState('');

  // Simulation steps interval (Manual Writer)
  useEffect(() => {
    let interval;
    if (isGenerating) {
      interval = setInterval(() => {
        setStepIndex((prev) => {
          if (prev >= generationSteps.length - 1) {
            clearInterval(interval);
            // Complete generation
            const finalPost = getGeneratedPostText(topicInput, toneSelect, lengthSelect);
            setGeneratedPostText(finalPost);
            setEditorText(finalPost);
            setIsGenerating(false);
            return 0;
          }
          return prev + 1;
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Simulation steps interval (Autopilot Creator)
  useEffect(() => {
    let interval;
    if (isAutopilotGenerating) {
      interval = setInterval(() => {
        setAutopilotStepIndex((prev) => {
          if (prev >= autopilotSteps.length - 1) {
            clearInterval(interval);
            const activeAccount = connectedAccounts.linkedin && connectedAccounts.linkedin[0];
            const name = activeAccount ? activeAccount.name : 'Abhay Gupta';
            const role = activeAccount ? activeAccount.role : 'B2B Influencer';
            
            let finalPost = '';
            const lowerRole = role.toLowerCase();
            if (lowerRole.includes('cto') || lowerRole.includes('tech') || lowerRole.includes('developer') || lowerRole.includes('engineer')) {
              finalPost = `As a developer & tech builder, one of the biggest challenges in 2026 is scaling agentic systems without hitting massive API bottlenecks.\n\nHere is how we leverage local models like Ollama for high-frequency workflows while maintaining 100% data privacy:\n\n1. Offload low-risk parsing to local Llama 3 instances.\n2. Keep cloud reasoning (Gemini Pro) for final semantic synthesis.\n3. Implement structured JSON schema outputs.\n\nThe cost savings are upwards of 82% at scale. What's your setup look like?\n\n#SoftwareEngineering #TechStack #Ollama #AgenticAI`;
            } else if (lowerRole.includes('founder') || lowerRole.includes('ceo') || lowerRole.includes('entrepreneur')) {
              finalPost = `Building in public in 2026 is a completely different game.\n\nYesterday we realized a hard truth: scaling SaaS products is no longer just about hiring developers. It's about orchestrating agents.\n\nAt AaisuuSync, we're building pipelines that link Youtube, Reels, and LinkedIn outreach automatically. It's not about cutting jobs—it's about maximizing output per founder.\n\nOur team efficiency is up 5x, and we can iterate in real-time.\n\nIf you're building a SaaS, are you automating your marketing pipelines yet?\n\n#FounderJourney #Startups #B2BGrowth #Productivity`;
            } else {
              finalPost = `Personal brand is the ultimate B2B currency in 2026.\n\nIf you're still copy-pasting ChatGPT prompts for LinkedIn, you're missing the point. Your network wants authentic, contextual insights, not AI-generated noise.\n\nHere is the B2B outreach strategy we use:\n\n- Connect only with high-fit profiles (VP & Founder levels).\n- Automate introductory messages but keep them contextual.\n- Publish data-driven content daily to build organic authority.\n\nAutomation is your engine, but your unique context is the fuel.\n\nHow are you scaling your outreach this quarter? Let's discuss. 👇\n\n#B2BMarketing #OutreachAutomation #Networking #BrandStrategy`;
            }
            
            setGeneratedPostText(finalPost);
            setEditorText(finalPost);
            setIsAutopilotGenerating(false);
            return 0;
          }
          return prev + 1;
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isAutopilotGenerating]);

  // Simulation steps interval (Media/Doc Uploader)
  useEffect(() => {
    let interval;
    if (isAnalyzingFile && attachedFile) {
      const activeSteps = attachedFile.type.startsWith('image/') ? imageAnalysisSteps : documentAnalysisSteps;
      interval = setInterval(() => {
        setFileAnalysisStepIndex((prev) => {
          if (prev >= activeSteps.length - 1) {
            clearInterval(interval);
            
            let finalCaption = '';
            if (attachedFile.type.startsWith('image/')) {
              finalCaption = `A picture is worth a thousand words, but in B2B, it's worth a thousand leads. 📈\n\nSharing a quick snapshot of our brand-new synchronized workflow dashboard in AaisuuSync. Notice how clean the spacing is—no lag, pure visual focus.\n\nVisual assets increase engagement on LinkedIn by up to 2.3x compared to text-only updates. Make sure you're attaching high-fidelity assets to your scheduled updates.\n\nWhat do you think of this layout? Let's talk in the comments!\n\n#ProductDesign #UIUX #LinkedInMarketing #WorkspaceProductivity`;
            } else {
              finalCaption = `Just finished compiling our comprehensive B2B Outreach Playbook for Q3 2026. 📄\n\nAttached the full document below detailing:\n- High-fit lead identification algorithms\n- Dynamic template variables that bypass spam filters\n- Multi-channel sync schedules (YouTube Studio + Reels + LinkedIn)\n\nDownload the full guide to see how we automate outbound flows without breaking API guidelines.\n\n#B2BOutbound #GrowthHacking #Playbook #AutomationGuides`;
            }
            
            setGeneratedPostText(finalCaption);
            setEditorText(finalCaption);
            setIsAnalyzingFile(false);
            
            // Handle automatic scheduling if checked!
            if (autoSchedule) {
              const newPostItem = {
                id: `li_sched_${Date.now()}`,
                title: finalCaption,
                scheduled: `Scheduled for ${scheduledTimeSelect}`,
                status: 'ready',
                tone: 'Thought Leader',
                views: 'N/A',
                attachment: {
                  name: attachedFile.name,
                  type: attachedFile.type,
                  previewUrl: attachedFile.previewUrl
                }
              };
              setScheduledPosts(prev => [newPostItem, ...prev]);
              resetWriterStates();
              setActiveTab('pipeline');
            }
            return 0;
          }
          return prev + 1;
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isAnalyzingFile, attachedFile, autoSchedule, scheduledTimeSelect]);

  const resetWriterStates = () => {
    setTopicInput('');
    setEditorText('');
    setGeneratedPostText('');
    setAttachedFile(null);
    setAutoSchedule(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    let previewUrl = '';
    if (file.type.startsWith('image/')) {
      previewUrl = URL.createObjectURL(file);
    }
    
    setAttachedFile({
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB',
      type: file.type,
      previewUrl: previewUrl,
      rawFile: file
    });
    setEditorText('');
    setGeneratedPostText('');
  };

  const handleStartAutopilot = (e) => {
    e.preventDefault();
    if (!connectedAccounts.linkedin || connectedAccounts.linkedin.length === 0) {
      alert('Please connect a LinkedIn account first!');
      return;
    }
    setIsAutopilotGenerating(true);
    setAutopilotStepIndex(0);
    setGeneratedPostText('');
    setEditorText('');
  };

  const handleStartMediaAnalysis = (e) => {
    e.preventDefault();
    if (!attachedFile) return;
    setIsAnalyzingFile(true);
    setFileAnalysisStepIndex(0);
    setGeneratedPostText('');
    setEditorText('');
  };

  // Helper generator function
  const getGeneratedPostText = (topic, tone, length) => {
    const cleanTopic = topic || 'AI automation and agent systems';
    const cleanLength = length === 'Short' ? 'Keep it concise.' : length === 'Long' ? 'Provide deep details.' : 'Moderate length.';
    
    if (tone === 'Thought Leader') {
      return `The future of ${cleanTopic} is moving faster than anyone anticipated.\n\nMost organizations are focusing on basic bots. But the real leverage? Agentic synchronization—where multiple models orchestrate tasks in parallel without manual friction.\n\nHere are 3 key takeaways I’ve noticed:\n\n1. Spacing and UX design is the ultimate bottleneck for agent interfaces.\n2. Local inference models like Ollama are saving massive API costs for batch tasks.\n3. Continuous context updates prevent agent drift over long campaigns.\n\nAre you looking at ${cleanTopic} as a tool, or as the core architecture of your workflows?\n\n#ArtificialIntelligence #AgenticAI #B2BTech #Innovation`;
    } else if (tone === 'Storytelling') {
      return `I remember when we first tried to automate our social pipelines. It was a complete mess.\n\nChatGPT templates smelled robotic, API limits were constantly breaking, and the spacing felt off. But then we realized one simple rule: context is everything.\n\nThat was the spark that led us to build AaisuuSync. We wanted to merge the reasoning of Gemini Pro with the cheap scaling capability of local Ollama nodes.\n\nToday, we run multiple content automation pipelines completely lag-free.\n\nLesson learned: Don't just automate tasks. Automate the synchronization of your brand voice.\n\nHave you had any scaling issues with ${cleanTopic} lately? Let's chat below! 👇\n\n#Storytelling #FounderJourney #ProductDesign #AIAutomation`;
    } else if (tone === 'Casual') {
      return `Let's be real about ${cleanTopic} for a second. 🔍\n\nThere's a lot of noise about prompts and ChatGPT hacks. But the actual value lies in how your agent interacts with live platforms—whether it's managing YouTube Studio clips, Instagram Reels scheduling, or automated InMails.\n\nIt needs to feel fluid, responsive, and (most importantly) completely bug-free.\n\nThat's why we spend so much time refining the layout structure of AaisuuSync. A premium workspace prevents cognitive overload.\n\nWhat is your go-to setup for ${cleanTopic} right now? Let's share some insights.\n\n#AIProductivity #NoCodeTools #TechStack #SocialGrowth`;
    } else { // Educational
      return `How to master ${cleanTopic} in 3 simple steps (Without breaking your budget): 📚\n\nHere is a quick framework we use daily:\n\n1. Core Logic Layer: Use powerful cloud LLMs like Gemini Pro for script writing and deep structural planning.\n2. Scale Processing Layer: Offload repetitive actions (like drafts and auto-DMs) to local models like Llama 3 or Ollama to drop running costs to zero.\n3. Clean Interface Spacing: Structure your pipeline logs horizontally so you can identify bottlenecks at a glance.\n\nSave this post if you want to implement this in your next social campaign!\n\n#LearningAI #TechGuides #AutomationTutorials #B2BSaaS`;
    }
  };

  const handleStartGeneration = (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setStepIndex(0);
    setGeneratedPostText('');
  };

  const handleSchedulePost = () => {
    if (!editorText) return;
    const newPostItem = {
      id: `li_sched_${Date.now()}`,
      title: editorText,
      scheduled: 'Scheduled for ' + new Date(Date.now() + 86400000 * 2).toLocaleDateString() + ' 12:00 PM',
      status: 'ready',
      tone: toneSelect,
      views: 'N/A',
      attachment: attachedFile ? {
        name: attachedFile.name,
        type: attachedFile.type,
        previewUrl: attachedFile.previewUrl
      } : null
    };
    setScheduledPosts([newPostItem, ...scheduledPosts]);
    resetWriterStates();
    setActiveTab('pipeline');
  };

  const handlePublishNow = () => {
    if (!editorText) return;
    const newPublishItem = {
      id: `li_pub_${Date.now()}`,
      title: editorText,
      publishedTime: 'Just now',
      views: '0',
      likes: 0,
      comments: 0,
      reposts: 0,
      attachment: attachedFile ? {
        name: attachedFile.name,
        type: attachedFile.type,
        previewUrl: attachedFile.previewUrl
      } : null
    };
    setPublishedPosts([newPublishItem, ...publishedPosts]);
    resetWriterStates();
    setActiveTab('pipeline');
  };

  const handleDeletePost = (id, type) => {
    if (type === 'scheduled') {
      setScheduledPosts(scheduledPosts.filter(p => p.id !== id));
    } else {
      setPublishedPosts(publishedPosts.filter(p => p.id !== id));
    }
  };

  // Outreach Configuration States
  const [targetRoles, setTargetRoles] = useState('Founder, CTO, VP Engineering');
  const [targetLocation, setTargetLocation] = useState('San Francisco, New York, London');
  const [templateText, setTemplateText] = useState('Hi {first_name}, came across your work in B2B AI. Would love to connect and share insights on what we are building at AaisuuSync!');
  const [leadsList, setLeadsList] = useState(initialLeads);
  const [outreachLogs, setOutreachLogs] = useState([
    '[18:54:12] LinkedIn Outreach Daemon standby.',
    '[18:54:15] Target criteria configured.'
  ]);

  // Outreach Simulator Loop
  useEffect(() => {
    let timeout;
    if (systemOn) {
      const simulateOutreachActivity = () => {
        const firstPending = leadsList.find(lead => lead.status === 'Pending' || lead.status === 'Connecting');
        
        if (firstPending) {
          setLeadsList(prevLeads => prevLeads.map(l => {
            if (l.id === firstPending.id) {
              const nextStatus = l.status === 'Pending' ? 'Connecting' : 'Connected';
              // Update log
              setOutreachLogs(prevLogs => [
                `[${new Date().toLocaleTimeString()}] ${l.name}: Promoting status to ${nextStatus}...`,
                ...prevLogs.slice(0, 8)
              ]);
              return { ...l, status: nextStatus };
            }
            return l;
          }));
        } else {
          // If all connected, add a mock lead
          const names = ['Clara Ostrom', 'Jordan Vance', 'Aleksei P.', 'Sienna Patel'];
          const roles = ['Product Manager', 'Director of Engineering', 'CEO at CyberVibe', 'VP Growth'];
          const randomIdx = Math.floor(Math.random() * names.length);
          const newId = Date.now();
          const newLead = {
            id: newId,
            name: names[randomIdx],
            role: roles[randomIdx],
            score: Math.floor(Math.random() * 20) + 80,
            status: 'Pending',
            avatarColor: 'linear-gradient(135deg, #ec4899, #0ea5e9)'
          };
          setLeadsList(prev => [...prev, newLead]);
          setOutreachLogs(prevLogs => [
            `[${new Date().toLocaleTimeString()}] Found new matching target: ${newLead.name} (${newLead.score}% Match)`,
            ...prevLogs.slice(0, 8)
          ]);
        }
        
        // Schedule next action
        timeout = setTimeout(simulateOutreachActivity, 6000);
      };
      
      timeout = setTimeout(simulateOutreachActivity, 3000);
    }
    return () => clearTimeout(timeout);
  }, [systemOn, leadsList]);

  // Get active account details for preview
  const liAccount = (connectedAccounts.linkedin && connectedAccounts.linkedin[0]) || {
    name: 'Abhay Gupta',
    username: 'abhaygupta',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=60'
  };

  return (
    <div className="linkedin-page page-container">
      {/* Page Header */}
      <div className="linkedin-header-block">
        <div className="linkedin-header-left">
          <div className="engine-status-badge">
            <svg className="linkedin-logo-svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764 0-.973.784-1.763 1.75-1.763s1.75.79 1.75 1.763c0 .974-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
            </svg>
            <span className="engine-status-lbl">LinkedIn Synthesis Engine</span>
            <span className="linkedin-new-badge">ACTIVE</span>
            <span className="status-indicator-dot pulsing"></span>
          </div>
          <p className="engine-desc">
            AI-driven outreach, post scheduling, and professional B2B relationship building.
          </p>
        </div>
        <div className="linkedin-header-right">
          <div className="linkedin-master-switch">
            <span>OUTREACH DAEMON {systemOn ? 'ON' : 'OFF'}</span>
            <div
              className={`switch-toggle ${systemOn ? 'on' : ''}`}
              onClick={() => setSystemOn(!systemOn)}
              role="button"
              tabIndex={0}
            />
          </div>
          <button className="linkedin-scope-btn">
            <HiOutlineAdjustments />
            Settings
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="linkedin-tabs">
        <Tabs tabs={mainTabs} activeTab={activeTab} onTabChange={setActiveTab} variant="minimal" />
      </div>

      <div className="linkedin-workspace-content">
        {connectedAccounts.linkedin && connectedAccounts.linkedin.length === 0 && activeTab !== 'pipeline' ? (
          <div className="glass-card linkedin-lock-overlay animate-fade-in" style={{ padding: '48px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', margin: '24px 0' }}>
            <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: 'rgba(99,102,241,0.1)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>
              <HiOutlineLink />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>LinkedIn Account Not Linked</h3>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', maxWidth: '420px', lineHeight: 1.55 }}>
              Link your LinkedIn credentials on the Pipeline Dashboard or in the Accounts page to unlock the AI Post Writer, Connection Automation, and Engagement Analytics.
            </p>
            <button className="gradient-btn" onClick={() => setShowLiModal(true)}>
              <HiOutlinePlus /> Link Account Now
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'pipeline' && (
              <PipelineWorkspace 
                scheduled={scheduledPosts} 
                published={publishedPosts} 
                onDelete={handleDeletePost} 
                onNavigate={setActiveTab}
                connectedAccounts={connectedAccounts}
                onDisconnect={handleDisconnectLinkedIn}
                onConnect={() => setShowLiModal(true)}
              />
            )}

            {activeTab === 'writer' && (
              <WriterWorkspace 
                topic={topicInput} 
                setTopic={setTopicInput}
                tone={toneSelect} 
                setTone={setToneSelect}
                length={lengthSelect} 
                setLength={setLengthSelect}
                isGenerating={isGenerating}
                stepIndex={stepIndex}
                editorText={editorText}
                setEditorText={setEditorText}
                hasGenerated={!!generatedPostText || !!editorText}
                account={liAccount}
                modelName={currentModel.name}
                modelColor={currentModel.color}
                onGenerate={handleStartGeneration}
                onSchedule={handleSchedulePost}
                onPublish={handlePublishNow}
                
                // Autopilot and Media Upload Props
                writerMode={writerMode}
                setWriterMode={setWriterMode}
                attachedFile={attachedFile}
                setAttachedFile={setAttachedFile}
                autoSchedule={autoSchedule}
                setAutoSchedule={setAutoSchedule}
                scheduledTimeSelect={scheduledTimeSelect}
                setScheduledTimeSelect={setScheduledTimeSelect}
                isAnalyzingFile={isAnalyzingFile}
                fileAnalysisStepIndex={fileAnalysisStepIndex}
                isAutopilotGenerating={isAutopilotGenerating}
                autopilotStepIndex={autopilotStepIndex}
                autopilotSteps={autopilotSteps}
                activeAnalysisSteps={activeAnalysisSteps}
                handleFileChange={handleFileChange}
                onStartAutopilot={handleStartAutopilot}
                onStartMediaAnalysis={handleStartMediaAnalysis}
              />
            )}

            {activeTab === 'outreach' && (
              <OutreachWorkspace 
                systemOn={systemOn}
                targetRoles={targetRoles}
                setTargetRoles={setTargetRoles}
                targetLocation={targetLocation}
                setTargetLocation={setTargetLocation}
                templateText={templateText}
                setTemplateText={setTemplateText}
                leads={leadsList}
                logs={outreachLogs}
              />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsWorkspace 
                published={publishedPosts} 
              />
            )}
          </>
        )}
      </div>

      {/* LinkedIn Connect Modal */}
      <Modal
        isOpen={showLiModal}
        onClose={() => setShowLiModal(false)}
        title="Connect LinkedIn Account"
      >
        {isLiConnecting ? (
          <div className="modal-connect-loading">
            <div className="orbit-spinner">
              <div className="spinner-inner"></div>
            </div>
            <h4>Authenticating via OAuth Gateway</h4>
            <div className="loading-steps-list">
              {[
                'Authenticating with LinkedIn OAuth gateway...',
                'Retrieving Member Profile permissions...',
                'Establishing publication scopes (w_member_social)...',
                'Configuring dynamic posting triggers...',
                'Encrypting and storing session access tokens...'
              ].map((step, idx) => (
                <div 
                  key={idx} 
                  className={`loading-step-row ${liConnectSteps.includes(step) ? 'active' : ''}`}
                >
                  {liConnectSteps.includes(step) ? (
                    <HiOutlineCheck className="icon check" />
                  ) : (
                    <span className="step-bullet-pending">●</span>
                  )}
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <form onSubmit={handleConnectLinkedInSubmit} className="modal-connect-form">
            <div className="form-group">
              <label>LinkedIn Profile Username</label>
              <input
                type="text"
                value={liUsername}
                onChange={(e) => setLiUsername(e.target.value)}
                placeholder="e.g. abhaygupta"
                required
              />
            </div>
            <div className="form-group">
              <label>Profile Display Name</label>
              <input
                type="text"
                value={liName}
                onChange={(e) => setLiName(e.target.value)}
                placeholder="e.g. Abhay Gupta"
                required
              />
            </div>
            <div className="form-group">
              <label>Persona / Headline</label>
              <input
                type="text"
                value={liRole}
                onChange={(e) => setLiRole(e.target.value)}
                placeholder="e.g. B2B Influencer or Founder"
              />
            </div>
            <div className="modal-actions">
              <button 
                type="button" 
                className="outline-btn" 
                onClick={() => setShowLiModal(false)}
              >
                Cancel
              </button>
              <button type="submit" className="gradient-btn">
                Authenticate & Connect
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

/* =============================================
   Pipeline Workspace Component
   ============================================= */
function PipelineWorkspace({ 
  scheduled, 
  published, 
  onDelete, 
  onNavigate, 
  connectedAccounts, 
  onConnect, 
  onDisconnect 
}) {
  const [filter, setFilter] = useState('queued');

  const hasLinkedInConnected = connectedAccounts.linkedin && connectedAccounts.linkedin.length > 0;
  const activeAccount = hasLinkedInConnected ? connectedAccounts.linkedin[0] : null;

  const filterTabs = [
    { id: 'queued', label: 'Queued', icon: <HiOutlineClock />, count: scheduled.length },
    { id: 'published', label: 'Published', icon: <HiOutlineCheckCircle />, count: published.length },
    { id: 'failed', label: 'Failed', icon: <HiOutlineXCircle />, count: 0 },
  ];

  return (
    <div className="pipeline-section animate-fade-in">
      

      {/* Tools Grid (The Three Cards) */}
      <div className="linkedin-tools-grid">
        <div className="glass-card tool-card writer-card">
          <div className="tool-icon-wrapper blue">
            <HiOutlinePencilAlt />
          </div>
          <h4>AI Post Writer</h4>
          <p>Generate engaging LinkedIn posts using AI, tailored to your brand voice and target audience.</p>
          <button className="tool-btn blue-btn" onClick={() => onNavigate('writer')}>
            Create Post
          </button>
        </div>

        <div className="glass-card tool-card outreach-card">
          <div className="tool-icon-wrapper purple">
            <HiOutlineUserAdd />
          </div>
          <h4>Connection Automation</h4>
          <p>Automatically send personalized connection requests to targeted prospects in your niche.</p>
          <button className="tool-btn purple-btn" onClick={() => onNavigate('outreach')}>
            Configure
          </button>
        </div>

        <div className="glass-card tool-card analytics-card">
          <div className="tool-icon-wrapper green">
            <HiOutlineChartSquareBar />
          </div>
          <h4>Engagement Analytics</h4>
          <p>Track post performance, connection acceptance rates, and profile views in real-time.</p>
          <button className="tool-btn green-btn" onClick={() => onNavigate('analytics')}>
            View Analytics
          </button>
        </div>
      </div>

      {/* Scheduled/Published Posts Section */}
      <div className="scheduled-posts-section">
        <h3 className="section-title">Scheduled Posts</h3>
        <p className="section-subtitle">
          Your upcoming LinkedIn posts will appear here once you start creating content.
        </p>

        <div className="pipeline-filters">
          <Tabs tabs={filterTabs} activeTab={filter} onTabChange={setFilter} />
        </div>

        {filter === 'queued' && (
          <div className="linkedin-queue-list">
            {scheduled.length > 0 ? (
              scheduled.map((item) => (
                <div key={item.id} className="glass-card linkedin-queue-item">
                  <div className="li-queue-badge">
                    <HiOutlineCalendar />
                  </div>
                  <div className="li-queue-info">
                    <div className="li-queue-meta">
                      <span className="li-meta-tag">{item.tone || 'Thought Leader'}</span>
                      <span><HiOutlineClock /> {item.scheduled}</span>
                    </div>
                    <p className="li-queue-text">{item.title}</p>
                    {item.attachment && (
                      <div className="li-queue-attachment-preview">
                        {item.attachment.type.startsWith('image/') ? (
                          <div className="queue-image-thumb-container">
                            <img src={item.attachment.previewUrl} alt="Thumbnail" className="queue-image-thumb" />
                            <span className="attachment-badge"><HiOutlinePhotograph /> Image</span>
                          </div>
                        ) : (
                          <div className="queue-doc-thumb-container">
                            <HiOutlineDocumentText className="queue-doc-icon" />
                            <span className="queue-doc-name">{item.attachment.name}</span>
                            <span className="attachment-badge"><HiOutlineDocumentText /> Doc</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="li-queue-actions">
                    <span className="li-status-pill ready">● Ready</span>
                    <button 
                      className="li-delete-btn" 
                      onClick={() => onDelete(item.id, 'scheduled')}
                      title="Remove post"
                    >
                      <HiOutlineTrash />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-scheduled-card">
                <div className="empty-scheduled-icon">
                  <HiOutlineCalendar />
                </div>
                <p className="empty-scheduled-text">No scheduled posts yet</p>
              </div>
            )}
          </div>
        )}

        {filter === 'published' && (
          <div className="linkedin-queue-list">
            {published.length > 0 ? (
              published.map((item) => (
                <div key={item.id} className="glass-card linkedin-queue-item published">
                  <div className="li-queue-badge published">
                    <HiOutlineCheckCircle />
                  </div>
                  <div className="li-queue-info">
                    <div className="li-queue-meta">
                      <span className="li-meta-tag published">Published</span>
                      <span>{item.publishedTime}</span>
                    </div>
                    <p className="li-queue-text">{item.title}</p>
                    {item.attachment && (
                      <div className="li-queue-attachment-preview">
                        {item.attachment.type.startsWith('image/') ? (
                          <div className="queue-image-thumb-container">
                            <img src={item.attachment.previewUrl} alt="Thumbnail" className="queue-image-thumb" />
                            <span className="attachment-badge"><HiOutlinePhotograph /> Image</span>
                          </div>
                        ) : (
                          <div className="queue-doc-thumb-container">
                            <HiOutlineDocumentText className="queue-doc-icon" />
                            <span className="queue-doc-name">{item.attachment.name}</span>
                            <span className="attachment-badge"><HiOutlineDocumentText /> Doc</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="li-published-stats">
                      <span>👍 {item.likes} Likes</span>
                      <span>💬 {item.comments} Comments</span>
                      <span>🔁 {item.reposts} Reposts</span>
                      <span>👁️ {item.views} Impressions</span>
                    </div>
                  </div>
                  <div className="li-queue-actions">
                    <button 
                      className="li-delete-btn" 
                      onClick={() => onDelete(item.id, 'published')}
                      title="Remove record"
                    >
                      <HiOutlineTrash />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-scheduled-card">
                <div className="empty-scheduled-icon">
                  <HiOutlineCheckCircle />
                </div>
                <p className="empty-scheduled-text">No published posts yet</p>
              </div>
            )}
          </div>
        )}

        {filter === 'failed' && (
          <div className="empty-scheduled-card">
            <div className="empty-scheduled-icon">
              <HiOutlineXCircle />
            </div>
            <p className="empty-scheduled-text">No failed publications</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* =============================================
   AI Post Writer Workspace Component
   ============================================= */
function WriterWorkspace({
  topic, setTopic,
  tone, setTone,
  length, setLength,
  isGenerating,
  stepIndex,
  editorText, setEditorText,
  hasGenerated,
  account,
  modelName,
  modelColor,
  onGenerate,
  onSchedule,
  onPublish,
  
  writerMode, setWriterMode,
  attachedFile, setAttachedFile,
  autoSchedule, setAutoSchedule,
  scheduledTimeSelect, setScheduledTimeSelect,
  isAnalyzingFile,
  fileAnalysisStepIndex,
  isAutopilotGenerating,
  autopilotStepIndex,
  autopilotSteps,
  activeAnalysisSteps,
  handleFileChange,
  onStartAutopilot,
  onStartMediaAnalysis
}) {
  return (
    <div className="linkedin-writer-grid animate-fade-in">
      
      {/* Config Form Panel */}
      <div className="glass-card writer-config-card">
        <h3><HiOutlineSparkles style={{ color: 'var(--accent-primary)' }} /> AI Generator Settings</h3>
        <p>Design trending LinkedIn posts customized to your domain expertise.</p>

        {/* Writer Mode Selector */}
        <div className="writer-mode-selector">
          <button 
            type="button" 
            className={`mode-btn ${writerMode === 'manual' ? 'active' : ''}`}
            onClick={() => setWriterMode('manual')}
          >
            <HiOutlinePencilAlt /> Manual Draft
          </button>
          <button 
            type="button" 
            className={`mode-btn ${writerMode === 'autopilot' ? 'active' : ''}`}
            onClick={() => setWriterMode('autopilot')}
          >
            <HiOutlineSparkles /> AI Autopilot
          </button>
          <button 
            type="button" 
            className={`mode-btn ${writerMode === 'media' ? 'active' : ''}`}
            onClick={() => setWriterMode('media')}
          >
            <HiOutlineUpload /> Upload Asset
          </button>
        </div>

        {writerMode === 'manual' && (
          <form onSubmit={onGenerate} className="writer-form">
            <div className="form-group">
              <label>Core Topic / Outline</label>
              <textarea 
                value={topic} 
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Scaling B2B outbound with local Ollama agents to bypass API quotas..."
                required
                disabled={isGenerating}
              />
            </div>

            <div className="form-row-split">
              <div className="form-group">
                <label>Audience Tone</label>
                <select value={tone} onChange={(e) => setTone(e.target.value)} disabled={isGenerating}>
                  <option value="Thought Leader">Thought Leader</option>
                  <option value="Storytelling">Storytelling</option>
                  <option value="Casual">Casual</option>
                  <option value="Educational">Educational</option>
                </select>
              </div>

              <div className="form-group">
                <label>Post Length</label>
                <select value={length} onChange={(e) => setLength(e.target.value)} disabled={isGenerating}>
                  <option value="Short">Short (Under 100 words)</option>
                  <option value="Medium">Medium (150-250 words)</option>
                  <option value="Long">Long (Detailed/Thread)</option>
                </select>
              </div>
            </div>

            <div className="writer-model-indicator">
              <span className="model-dot" style={{ background: modelColor }} />
              <div>
                <span className="lbl">Target AI Inference</span>
                <span className="val">{modelName}</span>
              </div>
            </div>

            <button 
              type="submit" 
              className="gradient-btn generate-submit-btn" 
              disabled={isGenerating || !topic}
            >
              {isGenerating ? (
                <>Generating Post...</>
              ) : (
                <>
                  <HiOutlineSparkles /> Generate Post
                </>
              )}
            </button>
          </form>
        )}

        {writerMode === 'autopilot' && (
          <div className="autopilot-section writer-form">
            <div className="autopilot-info-card">
              <div className="autopilot-info-header">
                <HiOutlineSparkles className="glowing-sparkle-icon" />
                <h5>Profile-Driven Autopilot</h5>
              </div>
              <p>
                The AI will scan the connected profile details for <strong>{account?.name || 'Abhay Gupta'}</strong> (Headline: <em>{account?.role || 'B2B Influencer'}</em>) and synthesize insights appropriate for their career niche.
              </p>
            </div>

            <div className="writer-model-indicator">
              <span className="model-dot" style={{ background: modelColor }} />
              <div>
                <span className="lbl">Target AI Inference</span>
                <span className="val">{modelName}</span>
              </div>
            </div>

            <button 
              type="button" 
              onClick={onStartAutopilot} 
              className="gradient-btn generate-submit-btn"
              disabled={isAutopilotGenerating}
            >
              {isAutopilotGenerating ? 'Scanning & Synthesizing...' : 'Scan Profile & Autopilot Post'}
            </button>
          </div>
        )}

        {writerMode === 'media' && (
          <div className="media-upload-section writer-form">
            <label className="media-dropzone" htmlFor="linkedin-media-upload">
              <input 
                type="file" 
                id="linkedin-media-upload" 
                accept="image/*,.pdf,.doc,.docx,.ppt,.pptx" 
                onChange={handleFileChange} 
                style={{ display: 'none' }}
              />
              <div className="dropzone-content">
                <div className="upload-icon-wrapper">
                  <HiOutlineUpload className="upload-icon" />
                </div>
                <h5>Choose Image or Document</h5>
                <p>Support PNG, JPG, PDF, or PPT (Max 25MB)</p>
              </div>
            </label>

            {attachedFile && (
              <div className="uploaded-file-row">
                <div className="file-info">
                  {attachedFile.type.startsWith('image/') ? (
                    <HiOutlinePhotograph className="file-icon img-type" />
                  ) : (
                    <HiOutlineDocumentText className="file-icon doc-type" />
                  )}
                  <div className="file-meta">
                    <span className="file-name">{attachedFile.name}</span>
                    <span className="file-size">{attachedFile.size}</span>
                  </div>
                </div>
                <button 
                  type="button" 
                  className="file-clear-btn" 
                  onClick={() => setAttachedFile(null)}
                >
                  ×
                </button>
              </div>
            )}

            {attachedFile && (
              <div className="media-scheduling-options animate-fade-in">
                <div className="form-group checkbox-group">
                  <label className="switch-label-wrapper">
                    <input 
                      type="checkbox" 
                      checked={autoSchedule} 
                      onChange={(e) => setAutoSchedule(e.target.checked)} 
                    />
                    <span>Auto-Schedule post on completion</span>
                  </label>
                </div>
                
                <div className="form-group">
                  <label>Scheduled Slot</label>
                  <select 
                    value={scheduledTimeSelect} 
                    onChange={(e) => setScheduledTimeSelect(e.target.value)}
                    disabled={!autoSchedule}
                  >
                    <option value="Tomorrow 10:00 AM">Tomorrow 10:00 AM</option>
                    <option value="Monday 2:00 PM">Monday 2:00 PM</option>
                    <option value="Wednesday 11:00 AM">Wednesday 11:00 AM</option>
                    <option value="Custom">Custom Target Time</option>
                  </select>
                </div>
              </div>
            )}

            <button 
              type="button"
              className="gradient-btn generate-submit-btn"
              disabled={isAnalyzingFile || !attachedFile}
              onClick={onStartMediaAnalysis}
            >
              {isAnalyzingFile ? 'Analyzing Media...' : 'Analyze & Write Caption'}
            </button>
          </div>
        )}

      </div>

      {/* Editor & Preview Pane */}
      <div className="writer-display-column">
        {isGenerating && (
          <div className="glass-card writer-loading-pane">
            <div className="orbit-spinner">
              <div className="spinner-inner"></div>
            </div>
            <h4>Synthesizing B2B LinkedIn Post</h4>
            <div className="loading-steps-list">
              {generationSteps.map((step, idx) => (
                <div key={idx} className={`loading-step-row ${idx <= stepIndex ? 'active' : ''}`}>
                  {idx < stepIndex ? (
                    <HiOutlineCheck className="icon check" />
                  ) : idx === stepIndex ? (
                    <span className="step-bullet-active">◌</span>
                  ) : (
                    <span className="step-bullet-pending">●</span>
                  )}
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {isAutopilotGenerating && (
          <div className="glass-card writer-loading-pane">
            <div className="orbit-spinner">
              <div className="spinner-inner"></div>
            </div>
            <h4>Scanning LinkedIn Profile & Synthesizing Post</h4>
            <div className="loading-steps-list">
              {autopilotSteps.map((step, idx) => (
                <div key={idx} className={`loading-step-row ${idx <= autopilotStepIndex ? 'active' : ''}`}>
                  {idx < autopilotStepIndex ? (
                    <HiOutlineCheck className="icon check" />
                  ) : idx === autopilotStepIndex ? (
                    <span className="step-bullet-active">◌</span>
                  ) : (
                    <span className="step-bullet-pending">●</span>
                  )}
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {isAnalyzingFile && (
          <div className="glass-card writer-loading-pane">
            <div className="orbit-spinner">
              <div className="spinner-inner"></div>
            </div>
            <h4>Parsing Media Asset & Generating Copy</h4>
            <div className="loading-steps-list">
              {activeAnalysisSteps.map((step, idx) => (
                <div key={idx} className={`loading-step-row ${idx <= fileAnalysisStepIndex ? 'active' : ''}`}>
                  {idx < fileAnalysisStepIndex ? (
                    <HiOutlineCheck className="icon check" />
                  ) : idx === fileAnalysisStepIndex ? (
                    <span className="step-bullet-active">◌</span>
                  ) : (
                    <span className="step-bullet-pending">●</span>
                  )}
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isGenerating && !isAutopilotGenerating && !isAnalyzingFile && hasGenerated ? (
          <div className="glass-card preview-pane-card animate-fade-in">
            <div className="preview-header-label">LinkedIn Live Mockup (Editable)</div>
            
            {/* Live LinkedIn Card Preview */}
            <div className="linkedin-post-preview">
              <div className="li-preview-top">
                <img src={account.avatar} alt="Avatar" className="li-preview-avatar" />
                <div className="li-preview-user-info">
                  <h5>{account.name}</h5>
                  <p>AaisuuSync Pro • {account.role}</p>
                  <span>Just now · 🌐</span>
                </div>
              </div>

              <div className="li-preview-body">
                <textarea 
                  className="li-preview-textarea" 
                  value={editorText} 
                  onChange={(e) => setEditorText(e.target.value)}
                  placeholder="Review AI draft here..."
                />
              </div>

              {attachedFile && (
                <div className="li-preview-attachment-wrapper">
                  {attachedFile.type.startsWith('image/') ? (
                    <div className="li-preview-image-box">
                      <img src={attachedFile.previewUrl} alt="Attached media" className="li-preview-attached-img" />
                      <button className="remove-preview-attachment-btn" onClick={() => setAttachedFile(null)}>×</button>
                    </div>
                  ) : (
                    <div className="li-preview-doc-box">
                      <div className="doc-icon-container">
                        <HiOutlineDocumentText className="doc-icon" />
                      </div>
                      <div className="doc-details">
                        <span className="doc-name">{attachedFile.name}</span>
                        <span className="doc-info">{attachedFile.size} · Document Attachment</span>
                      </div>
                      <button className="remove-preview-attachment-btn" onClick={() => setAttachedFile(null)}>×</button>
                    </div>
                  )}
                </div>
              )}

              <div className="li-preview-actions">
                <div className="li-action-btn">👍 Like</div>
                <div className="li-action-btn">💬 Comment</div>
                <div className="li-action-btn">🔁 Repost</div>
                <div className="li-action-btn">↗️ Send</div>
              </div>
            </div>

            <div className="preview-action-row">
              <button className="outline-btn" onClick={onPublish}>
                <HiOutlinePaperAirplane /> Publish Now
              </button>
              <button className="gradient-btn" onClick={onSchedule}>
                <HiOutlineCalendar /> Schedule Post
              </button>
            </div>
          </div>
        ) : (
          !isGenerating && !isAutopilotGenerating && !isAnalyzingFile && (
            <div className="glass-card writer-empty-pane">
              <div className="empty-pane-icon"><HiOutlinePencilAlt /></div>
              <h4>LinkedIn Editor Window</h4>
              <p>Customize parameters on the left and click Generate to run the AI engine.</p>
            </div>
          )
        )}
      </div>

    </div>
  );
}

/* =============================================
   Connection Outreach Workspace Component
   ============================================= */
function OutreachWorkspace({
  systemOn,
  targetRoles, setTargetRoles,
  targetLocation, setTargetLocation,
  templateText, setTemplateText,
  leads,
  logs
}) {
  return (
    <div className="linkedin-outreach-grid animate-fade-in">
      {/* Config Form */}
      <div className="glass-card outreach-config-card">
        <h3><HiOutlineAdjustments /> Targeting Parameters</h3>
        <p>Set search criteria for the agent daemon to discover and connect with prospects.</p>

        <div className="outreach-form-stack">
          <div className="form-group">
            <label>Target Job Roles (Comma separated)</label>
            <input 
              type="text" 
              value={targetRoles} 
              onChange={(e) => setTargetRoles(e.target.value)}
              placeholder="e.g. Founder, CTO, VP Engineering"
            />
          </div>

          <div className="form-group">
            <label>Location Target</label>
            <input 
              type="text" 
              value={targetLocation} 
              onChange={(e) => setTargetLocation(e.target.value)}
              placeholder="e.g. San Francisco, London, Remote"
            />
          </div>

          <div className="form-group">
            <div className="label-row">
              <label>AI Message Personalization Template</label>
              <span className="token-tip">Use {`{first_name}`} or {`{role}`}</span>
            </div>
            <textarea 
              value={templateText} 
              onChange={(e) => setTemplateText(e.target.value)}
              placeholder="e.g. Hi {first_name}, noticed your work in B2B AI..."
            />
          </div>

          {/* Outreach agent running log terminal */}
          <div className="outreach-log-terminal">
            <div className="terminal-header">
              <span className="terminal-dot red"></span>
              <span className="terminal-dot yellow"></span>
              <span className="terminal-dot green"></span>
              <span className="terminal-title">AGENT RUNNING LOG</span>
            </div>
            <div className="terminal-body">
              {logs.map((log, i) => (
                <div key={i} className="log-line">{log}</div>
              ))}
              {systemOn && <div className="log-line blinking-cursor">🤖 Agent listening...</div>}
            </div>
          </div>
        </div>
      </div>

      {/* Target Leads List */}
      <div className="glass-card outreach-leads-card">
        <div className="leads-header">
          <div>
            <h3>Active Campaign Targets</h3>
            <p>Recently scanned profiles that match your targeting scope.</p>
          </div>
          <span className={`outreach-badge ${systemOn ? 'active' : 'inactive'}`}>
            {systemOn ? '● CAMPAIGN RUNNING' : '◌ STANDBY'}
          </span>
        </div>

        <div className="leads-list-container">
          <table className="leads-table">
            <thead>
              <tr>
                <th>PROSPECT</th>
                <th>ROLE</th>
                <th>FIT SCORE</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="lead-tr">
                  <td>
                    <div className="lead-user-cell">
                      <div className="lead-avatar" style={{ background: lead.avatarColor }}>
                        {lead.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="lead-name">{lead.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className="lead-role-lbl">{lead.role}</span>
                  </td>
                  <td>
                    <span className={`lead-score-badge ${lead.score >= 90 ? 'high' : 'medium'}`}>
                      {lead.score}% Match
                    </span>
                  </td>
                  <td>
                    <span className={`lead-status-pill ${lead.status.toLowerCase()}`}>
                      {lead.status === 'Replied' && '● Replied'}
                      {lead.status === 'Connected' && '● Connected'}
                      {lead.status === 'Connecting' && '◌ Connecting'}
                      {lead.status === 'Pending' && '◌ Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* =============================================
   LinkedIn Analytics Workspace Component
   ============================================= */
function AnalyticsWorkspace({ published }) {
  const chartPeriod = '7d';

  // Calculate quick metrics
  const totalViews = published.reduce((acc, curr) => acc + parseInt(curr.views.replace(',', '') || 0), 2310);
  const totalLikes = published.reduce((acc, curr) => acc + curr.likes, 126);

  return (
    <div className="linkedin-analytics-grid animate-fade-in">
      
      {/* Metrics Row */}
      <div className="analytics-stats stagger">
        <div className="glass-card stat-metric accent-border-sky">
          <div className="stat-icon sky"><HiOutlineEye /></div>
          <div>
            <div className="stat-value">{totalViews.toLocaleString()}</div>
            <div className="stat-label">Post Impressions</div>
          </div>
          <span className="stat-change up">+18.4%</span>
        </div>

        <div className="glass-card stat-metric accent-border-indigo">
          <div className="stat-icon indigo"><HiOutlineUserGroup /></div>
          <div>
            <div className="stat-value">48%</div>
            <div className="stat-label">Connection Rate</div>
          </div>
          <span className="stat-change up">+4.2%</span>
        </div>

        <div className="glass-card stat-metric accent-border-teal">
          <div className="stat-icon teal"><HiOutlineChatAlt2 /></div>
          <div>
            <div className="stat-value">32</div>
            <div className="stat-label">Inbound Messages</div>
          </div>
          <span className="stat-change up">+12</span>
        </div>

        <div className="glass-card stat-metric accent-border-orange">
          <div className="stat-icon orange"><HiOutlineTrendingUp /></div>
          <div>
            <div className="stat-value">1,420</div>
            <div className="stat-label">Profile Views</div>
          </div>
          <span className="stat-change up">+14.2%</span>
        </div>
      </div>

      {/* Chart & Top Posts */}
      <div className="analytics-bottom-row">
        
        {/* Chart Card */}
        <div className="glass-card analytics-chart-card accent-border-indigo">
          <div className="chart-card-header">
            <h4>Weekly Profile Views</h4>
            <span className="chart-sub">Last 7 days (Views)</span>
          </div>
          <div className="chart-body">
            {mockAnalytics.viewsData.map((d) => (
              <div key={d.day} className="chart-row">
                <span className="chart-label">{d.day}</span>
                <div className="chart-bar-track">
                  <div className="chart-bar-fill" style={{ width: `${(d.count / 530) * 100}%` }} />
                </div>
                <span className="chart-value">{d.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Posts Card */}
        <div className="glass-card top-posts-card">
          <div className="top-posts-header">
            <h4><HiOutlineFire style={{ color: 'var(--orange)' }} /> Top Performing Updates</h4>
          </div>
          <div className="top-posts-list">
            {published.map((post, i) => (
              <div key={post.id} className="top-post-item">
                <div className="post-item-avatar">
                  <HiOutlinePlay />
                </div>
                <div className="post-item-info">
                  <h5>{post.title.substring(0, 52)}...</h5>
                  <span>Published {post.publishedTime}</span>
                </div>
                <div className="post-item-metric">
                  <strong>👁️ {post.views}</strong>
                  <span>Imp.</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
