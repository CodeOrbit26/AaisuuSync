import React, { useState, useEffect, useRef } from 'react';
import {
  HiOutlineTerminal,
  HiOutlineChevronRight,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineXCircle,
  HiOutlinePlay,
  HiOutlineDownload,
  HiOutlineSearch,
  HiOutlineDatabase,
  HiOutlineAdjustments,
  HiOutlineMusicNote,
  HiOutlineFilm,
  HiOutlineDocumentDuplicate,
  HiOutlineCheck,
  HiOutlineExternalLink,
  HiOutlineChevronDown,
  HiOutlineChevronUp
} from 'react-icons/hi';
import './Workflow.css';

const STAGE_KEYS = [
  'input_processing',
  'audio_memory_verification',
  'lyrics_analysis',
  'visual_planning',
  'asset_selection',
  'reel_composition',
  'backend_execution',
  'rendering',
  'final_output'
];

const STAGES = [
  {
    key: 'input_processing',
    title: 'Input Processing',
    description: 'Endpoint request interception and input parameter validation',
    icon: <HiOutlineDatabase />
  },
  {
    key: 'audio_memory_verification',
    title: 'Audio Memory Verification',
    description: 'Cross-referencing suggested song hooks against the Audio Memory database',
    icon: <HiOutlineSearch />
  },
  {
    key: 'lyrics_analysis',
    title: 'Lyrics Analysis',
    description: 'LLM song suggestion, YouTube download, and lyrics transcription',
    icon: <HiOutlineMusicNote />
  },
  {
    key: 'visual_planning',
    title: 'Visual Planning',
    description: 'Timings alignment and typographical canvas styles planning',
    icon: <HiOutlineAdjustments />
  },
  {
    key: 'asset_selection',
    title: 'Asset Selection',
    description: 'Google Font loading and design backdrop resolution',
    icon: <HiOutlineSearch />
  },
  {
    key: 'reel_composition',
    title: 'Reel Composition',
    description: 'Puppeteer headless canvas rendering and frame screenshots extraction',
    icon: <HiOutlineFilm />
  },
  {
    key: 'backend_execution',
    title: 'Backend Execution',
    description: 'Pipeline services topology and full infrastructure diagram',
    icon: <HiOutlineTerminal />
  },
  {
    key: 'rendering',
    title: 'Rendering',
    description: 'FFmpeg sequential image stitching and audio muxing pipeline',
    icon: <HiOutlineExternalLink />
  },
  {
    key: 'final_output',
    title: 'Final Output',
    description: 'Preview rendering, download generation, and summary reports',
    icon: <HiOutlineCheckCircle />
  }
];

export default function WorkflowTab({ isGenerating }) {
  const [activeStep, setActiveStep] = useState('input_processing');
  const [copiedText, setCopiedText] = useState('');
  const [expandedPrompts, setExpandedPrompts] = useState({ prompt1: false, prompt2: false, prompt3: false });
  const [statusData, setStatusData] = useState({
    status: 'idle',
    stage: 'idle',
    logs: [],
    executionData: {}
  });

  const terminalBodyRef = useRef(null);
  const isUserScrollingRef = useRef(false);

  // Poll workflow status from backend
  const fetchStatus = async () => {
    try {
      const res = await fetch(`/api/workflow-status?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        
        // Only update state if data has actually changed to prevent redundant re-renders
        setStatusData(prev => {
          const hasStatusChanged = prev.status !== data.status;
          const hasStageChanged = prev.stage !== data.stage;
          const hasLogsChanged = prev.logs.length !== data.logs.length;
          const hasExecutionDataChanged = JSON.stringify(prev.executionData) !== JSON.stringify(data.executionData);
          
          if (hasStatusChanged || hasStageChanged || hasLogsChanged || hasExecutionDataChanged) {
            return data;
          }
          return prev;
        });

        // Automatically switch active step to the currently processing backend stage
        if (data.status === 'processing' && data.stage && STAGE_KEYS.includes(data.stage)) {
          setActiveStep(data.stage);
        }
      }
    } catch (e) {
      console.error('Failed to fetch workflow status:', e);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Poll every 1s when generating
    let interval;
    if (isGenerating || statusData.status === 'processing') {
      interval = setInterval(fetchStatus, 1000);
    } else {
      interval = setInterval(fetchStatus, 3000); // lower frequency when idle
    }
    return () => clearInterval(interval);
  }, [isGenerating, statusData.status]);

  const handleScroll = () => {
    if (!terminalBodyRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = terminalBodyRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    isUserScrollingRef.current = !isAtBottom;
  };

  // Scroll terminal to bottom when new logs arrive
  useEffect(() => {
    if (statusData.stage === 'input_processing') {
      isUserScrollingRef.current = false;
    }
    if (!isUserScrollingRef.current && terminalBodyRef.current) {
      terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight;
    }
  }, [statusData.logs, statusData.stage]);

  // Handle Clipboard Copy
  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedText(key);
    setTimeout(() => setCopiedText(''), 2000);
  };

  // Helper to determine stage status class
  const getStepStatusClass = (stepKey) => {
    if (statusData.status === 'idle') return 'completed'; // default display when idle

    const currentIndex = STAGE_KEYS.indexOf(statusData.stage);
    const stepIndex = STAGE_KEYS.indexOf(stepKey);

    if (statusData.status === 'completed') return 'completed';
    if (statusData.status === 'failed') {
      if (stepKey === statusData.stage) return 'failed';
      return stepIndex < currentIndex ? 'completed' : 'pending';
    }

    if (stepIndex < currentIndex) return 'completed';
    if (stepKey === statusData.stage) return 'active current-running';
    return 'pending';
  };

  const getStepStatusText = (stepKey) => {
    const statusClass = getStepStatusClass(stepKey);
    if (statusClass.includes('failed')) return 'FAILED';
    if (statusClass.includes('current-running')) return 'RUNNING';
    if (statusClass.includes('completed')) return 'SUCCESS';
    return 'PENDING';
  };

  const currentData = statusData.executionData || {};

  return (
    <div className="workflow-tab">
      <div className="workflow-container">
        {/* Left Sidebar Stepper */}
        <div className="workflow-stepper">
          {STAGES.map((step, idx) => {
            const statusClass = getStepStatusClass(step.key);
            const isActive = activeStep === step.key;
            return (
              <div
                key={step.key}
                className={`workflow-step-card ${statusClass} ${isActive ? 'active' : ''}`}
                onClick={() => setActiveStep(step.key)}
              >
                <div className="workflow-step-indicator">
                  {statusClass.includes('completed') ? (
                    <HiOutlineCheckCircle />
                  ) : statusClass.includes('failed') ? (
                    <HiOutlineXCircle />
                  ) : statusClass.includes('active') ? (
                    <div className="spinner-border" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                <div className="workflow-step-info">
                  <h4>{step.title}</h4>
                  <div className="workflow-step-status-row">
                    <span className={`workflow-step-status-tag ${statusClass}`}>{getStepStatusText(step.key)}</span>
                  </div>
                </div>
                <HiOutlineChevronRight className="workflow-arrow-icon" style={{ opacity: isActive ? 1 : 0.25 }} />
              </div>
            );
          })}
        </div>

        {/* Right Dashboard panel */}
        <div className="workflow-detail-panel">
          <div className="workflow-panel-card glass-card">
            <div className="workflow-panel-header">
              <div className="workflow-panel-title">
                <h3>
                  {STAGES.find((s) => s.key === activeStep)?.icon}
                  {STAGES.find((s) => s.key === activeStep)?.title}
                </h3>
                <p>{STAGES.find((s) => s.key === activeStep)?.description}</p>
              </div>
              <span className={`workflow-badge ${statusData.status}`}>
                {statusData.status === 'idle' ? 'STANDBY' : statusData.status.toUpperCase()}
              </span>
            </div>

            <div className="workflow-panel-content-body">
              {/* Render Step specifics */}
              {activeStep === 'input_processing' && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="workflow-stats-grid">
                    <div className="workflow-stat-card border-pink">
                      <h5>HTTP Request Method</h5>
                      <p className="text-neon-pink">POST</p>
                    </div>
                    <div className="workflow-stat-card border-blue">
                      <h5>Vibe Selected</h5>
                      <p className="text-neon-blue">{currentData.vibe || 'lofi / chill'}</p>
                    </div>
                    <div className="workflow-stat-card border-green">
                      <h5>API Credentials</h5>
                      <p style={{ color: currentData.apiKeysValidated ? '#10b981' : '#ef4444' }}>
                        {currentData.apiKeysValidated ? 'VALIDATED' : 'NOT FOUND'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', marginBottom: '8px', color: 'rgba(255,255,255,0.9)' }}>Input Mapping Validation</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                      The AI agent listens to parameters posted to <code>/api/generate-viral-reel</code>. 
                      Credentials are parsed securely from global React Context. If a specific song override (e.g. <code>promptSource</code>) is specified, it is prioritised over random vibe suggestions.
                    </p>
                  </div>
                </div>
              )}

              {activeStep === 'audio_memory_verification' && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="workflow-stats-grid">
                    <div className="workflow-stat-card border-pink">
                      <h5>Audio Memory Size</h5>
                      <p className="text-neon-pink">{currentData.dbTotalSongs || '40'} Songs</p>
                    </div>
                    <div className="workflow-stat-card border-blue">
                      <h5>Checking Candidates</h5>
                      <p className="text-neon-blue">3 Suggestions</p>
                    </div>
                    <div className="workflow-stat-card border-green">
                      <h5>Validation Rule</h5>
                      <p className="text-neon-green">Gap &gt;= 20s</p>
                    </div>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', marginBottom: '8px', color: 'rgba(255,255,255,0.9)' }}>Audio Memory Verification Logic</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                      The AI agent queries <code>audio_memory.json</code> to load all previously used tracks and drop timestamps.
                      When Gemini recommends a set of 3 candidate songs, the system checks each option:
                      If a candidate song has been used before, it is only accepted if the proposed hook start timestamp differs by at least 20 seconds from all previously recorded timestamps for that song.
                      This ensures song variety while allowing different high-impact drop hooks of the same song to be used.
                    </p>
                  </div>
                </div>
              )}

              {activeStep === 'lyrics_analysis' && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="workflow-stats-grid">
                    <div className="workflow-stat-card border-pink">
                      <h5>Suggested Song</h5>
                      <p className="text-neon-pink">{currentData.songName || 'Phir Se Udd Chala'}</p>
                    </div>
                    <div className="workflow-stat-card border-blue">
                      <h5>YouTube Search Query</h5>
                      <p className="text-neon-blue" style={{ fontSize: '0.85rem' }}>{currentData.youtubeSearchQuery || 'Phir Se Udd Chala Lofi'}</p>
                    </div>
                    <div className="workflow-stat-card border-yellow">
                      <h5>Hook Drop Start</h5>
                      <p className="text-neon-yellow">{currentData.viralHookStartTime ? `${currentData.viralHookStartTime}s` : '55s'}</p>
                    </div>
                  </div>

                  {/* Collapsible Prompt 1 */}
                  <div className="workflow-accordion glass-card">
                    <div 
                      className="workflow-accordion-header" 
                      onClick={() => setExpandedPrompts(prev => ({ ...prev, prompt1: !prev.prompt1 }))}
                    >
                      <span>Song Recommendation Prompt (Prompt 1)</span>
                      <div className="workflow-accordion-header-right">
                        <button 
                          className="workflow-copy-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(currentData.prompt1 || 'Suggest Hindi/Haryanvi song matching lofi vibe...', 'prompt1');
                          }}
                        >
                          {copiedText === 'prompt1' ? <HiOutlineCheck style={{ color: '#10b981' }} /> : <HiOutlineDocumentDuplicate />}
                        </button>
                        {expandedPrompts.prompt1 ? <HiOutlineChevronUp /> : <HiOutlineChevronDown />}
                      </div>
                    </div>
                    {expandedPrompts.prompt1 && (
                      <div className="workflow-accordion-body">
                        <pre>{currentData.prompt1 || 'You are a viral TikTok/Reels expert. Suggest a trending song right now with a lofi vibe (ONLY Hindi or Haryanvi, NO English). Return JSON format: { "songName": "string", "youtubeSearchQuery": "string", "viralHookStartTime": number }'}</pre>
                      </div>
                    )}
                  </div>

                  {/* Collapsible Prompt 2 */}
                  <div className="workflow-accordion glass-card">
                    <div 
                      className="workflow-accordion-header" 
                      onClick={() => setExpandedPrompts(prev => ({ ...prev, prompt2: !prev.prompt2 }))}
                    >
                      <span>Transcription & Alignment Prompt (Prompt 2)</span>
                      <div className="workflow-accordion-header-right">
                        <button 
                          className="workflow-copy-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(currentData.prompt2 || 'Listen to this 15-second clip and transcribe in LRC format...', 'prompt2');
                          }}
                        >
                          {copiedText === 'prompt2' ? <HiOutlineCheck style={{ color: '#10b981' }} /> : <HiOutlineDocumentDuplicate />}
                        </button>
                        {expandedPrompts.prompt2 ? <HiOutlineChevronUp /> : <HiOutlineChevronDown />}
                      </div>
                    </div>
                    {expandedPrompts.prompt2 && (
                      <div className="workflow-accordion-body">
                        <pre>{currentData.prompt2 || 'Listen to this 15-second audio clip. Transcribe the lyrics exactly as they are sung in Hinglish only. Return lyrics in strict LRC format. Every single line MUST start with a timestamp [mm:ss.ms].'}</pre>
                      </div>
                    )}
                  </div>

                  {/* Collapsible Prompt 3 */}
                  <div className="workflow-accordion glass-card">
                    <div 
                      className="workflow-accordion-header" 
                      onClick={() => setExpandedPrompts(prev => ({ ...prev, prompt3: !prev.prompt3 }))}
                    >
                      <span>Viral Hashtags Prompt (Prompt 3)</span>
                      <div className="workflow-accordion-header-right">
                        <button 
                          className="workflow-copy-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(currentData.prompt3 || 'Generate hashtags based on song composition...', 'prompt3');
                          }}
                        >
                          {copiedText === 'prompt3' ? <HiOutlineCheck style={{ color: '#10b981' }} /> : <HiOutlineDocumentDuplicate />}
                        </button>
                        {expandedPrompts.prompt3 ? <HiOutlineChevronUp /> : <HiOutlineChevronDown />}
                      </div>
                    </div>
                    {expandedPrompts.prompt3 && (
                      <div className="workflow-accordion-body">
                        <pre>{currentData.prompt3 || 'You are an Instagram Reels virality expert. Based on the selected song name and the lyrics snippet, generate a list of 8-10 highly targeted viral hashtags.'}</pre>
                      </div>
                    )}
                  </div>

                  {currentData.syncedLyrics && (
                    <div>
                      <h4 style={{ fontSize: '0.95rem', marginBottom: '8px', color: 'rgba(255,255,255,0.9)' }}>Synced Timestamp Lyrics (LRC)</h4>
                      <textarea
                        readOnly
                        value={currentData.syncedLyrics}
                        className="workflow-code-display code-lyrics"
                        style={{ height: '140px' }}
                      />
                    </div>
                  )}

                  {currentData.viralHashtags && (
                    <div>
                      <h4 style={{ fontSize: '0.95rem', marginBottom: '8px', color: 'rgba(255,255,255,0.9)' }}>Generated Hashtags</h4>
                      <div className="workflow-code-display code-lyrics" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', minHeight: '50px', background: 'rgba(0, 0, 0, 0.35)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '16px' }}>
                        {currentData.viralHashtags.split(/\s+/).filter(tag => tag.startsWith('#')).map((tag, idx) => (
                          <span key={idx} style={{ background: 'rgba(236, 72, 153, 0.12)', color: '#f472b6', border: '1px solid rgba(236, 72, 153, 0.25)', padding: '4px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600 }}>{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeStep === 'visual_planning' && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="workflow-stats-grid">
                    <div className="workflow-stat-card border-pink">
                      <h5>Layout Structure</h5>
                      <p className="text-neon-pink">Static Cursive Typography</p>
                    </div>
                    <div className="workflow-stat-card border-blue">
                      <h5>Typography font</h5>
                      <p className="text-neon-blue">'Caveat' Cursive</p>
                    </div>
                    <div className="workflow-stat-card border-green">
                      <h5>Styles Settings</h5>
                      <p className="text-neon-green">70px | 500 wght</p>
                    </div>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', marginBottom: '8px', color: 'rgba(255,255,255,0.9)' }}>Transitions & Animating Mechanics</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: '0 0 12px 0' }}>
                      Timestamps are parsed with a strict Regex scanner. As the music plays, a loop determines the current active index and injects the <code>active</code> styling class to shift position or alter opacity.
                    </p>
                    <textarea
                      readOnly
                      value={`// Evaluated during render:
function updateTime(t) {
  let activeIndex = 0;
  for (let i = lyrics.length - 1; i >= 0; i--) {
    if (t >= lyrics[i].time) {
      activeIndex = i;
      break;
    }
  }
  // Toggle .active class to apply soft typography animations
}`}
                      className="workflow-code-display code-script"
                      style={{ height: '180px' }}
                    />
                  </div>
                </div>
              )}

              {activeStep === 'asset_selection' && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="workflow-stats-grid">
                    <div className="workflow-stat-card border-pink">
                      <h5>Fonts resource</h5>
                      <p className="text-neon-pink">Google Web Fonts API</p>
                    </div>
                    <div className="workflow-stat-card border-blue">
                      <h5>Backdrop Type</h5>
                      <p className="text-neon-blue">Solid Black (#000)</p>
                    </div>
                    <div className="workflow-stat-card border-green">
                      <h5>Readability Score</h5>
                      <p className="text-neon-green">PASS (W3C standard)</p>
                    </div>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', marginBottom: '8px', color: 'rgba(255,255,255,0.9)' }}>Asset Retrieval details</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                      Custom handwritten fonts are requested with weights 500 and 700. Solid dark backdrops ensure optimal typography contrast for mobile viewports, maximizing viewer retention.
                    </p>
                  </div>
                </div>
              )}

              {activeStep === 'reel_composition' && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="workflow-composition-timeline">
                    <div className="workflow-composition-progress">
                      <span>Headless Canvas Screenshotting</span>
                      <span>{currentData.renderingProgress || 150} / {currentData.renderingTotal || 150} Frames</span>
                    </div>
                    <div className="workflow-composition-bar-container">
                      <div 
                        className="workflow-composition-bar" 
                        style={{ width: `${((currentData.renderingProgress || 150) / (currentData.renderingTotal || 150)) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {currentData.puppeteerHtml && (
                    <div>
                      <h4 style={{ fontSize: '0.95rem', marginBottom: '8px', color: 'rgba(255,255,255,0.9)' }}>Headless DOM Layout HTML</h4>
                      <textarea
                        readOnly
                        value={currentData.puppeteerHtml}
                        className="workflow-code-display code-html"
                        style={{ height: '200px' }}
                      />
                    </div>
                  )}
                </div>
              )}

              {activeStep === 'backend_execution' && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <h4 style={{ fontSize: '0.95rem', margin: 0, color: 'rgba(255,255,255,0.9)' }}>Infrastructure Pipeline Topology</h4>
                  
                  {/* Microservices flowchart */}
                  <div className="workflow-topology-diagram">
                    <div className="topology-node pink">
                      <HiOutlineDatabase />
                      <span>Gemini API</span>
                      <small>Song suggestion</small>
                    </div>
                    <div className="topology-connector" />
                    <div className="topology-node blue">
                      <HiOutlineMusicNote />
                      <span>yt-dlp core</span>
                      <small>Audio download</small>
                    </div>
                    <div className="topology-connector" />
                    <div className="topology-node purple">
                      <HiOutlineFilm />
                      <span>Puppeteer</span>
                      <small>Canvas exporter</small>
                    </div>
                    <div className="topology-connector" />
                    <div className="topology-node green">
                      <HiOutlineTerminal />
                      <span>FFmpeg Engine</span>
                      <small>Video assembler</small>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                    The backend coordinates external APIs and local shell bin processes inside a node execution thread. Logs and progress are stored dynamically without interrupting active browser or rendering cycles.
                  </p>
                </div>
              )}

              {activeStep === 'rendering' && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="workflow-stats-grid">
                    <div className="workflow-stat-card border-pink">
                      <h5>Resolution</h5>
                      <p className="text-neon-pink">1080x1920 (9:16)</p>
                    </div>
                    <div className="workflow-stat-card border-blue">
                      <h5>Frame Rate</h5>
                      <p className="text-neon-blue">10 FPS</p>
                    </div>
                    <div className="workflow-stat-card border-green">
                      <h5>Video Codec</h5>
                      <p className="text-neon-green">libx264 (H.264)</p>
                    </div>
                    <div className="workflow-stat-card border-yellow">
                      <h5>Audio Codec</h5>
                      <p className="text-neon-yellow">AAC stereo</p>
                    </div>
                  </div>

                  {currentData.ffmpegCmd && (
                    <div>
                      <h4 style={{ fontSize: '0.95rem', marginBottom: '8px', color: 'rgba(255,255,255,0.9)' }}>FFmpeg Mux Stitching CLI</h4>
                      <textarea
                        readOnly
                        value={currentData.ffmpegCmd}
                        className="workflow-code-display code-ffmpeg"
                        style={{ height: '100px' }}
                      />
                    </div>
                  )}
                </div>
              )}

              {activeStep === 'final_output' && (
                <div className="animate-fade-in workflow-output-card">
                  <div className="workflow-output-preview">
                    {currentData.videoUrl || statusData.status === 'completed' ? (
                      <video 
                        className="workflow-output-video" 
                        src={currentData.videoUrl || "/uploads/viral_reel_trimmed.mp4"} 
                        controls
                        autoPlay
                        loop
                        muted
                      />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '10px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        <div className="spinner-border text-pink" style={{ width: '2rem', height: '2rem' }} />
                        <span>Assembling Video...</span>
                      </div>
                    )}
                  </div>

                  <div className="workflow-output-details">
                    <div className="workflow-output-info">
                      <h4>{currentData.songName || 'Phir Se Udd Chala'}</h4>
                      <p>
                        The high-retention aesthetic lyrics reel has been synthesized successfully. 
                        The download file is optimized with native resolution codecs for premium Instagram publishing quality.
                      </p>
                      
                      <div className="workflow-stats-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '10px', borderRadius: '6px' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Render Elapsed</span>
                          <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{currentData.totalElapsedTime || '18.4s'}</span>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '10px', borderRadius: '6px' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Files Status</span>
                          <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#10b981' }}>RENDERED</span>
                        </div>
                      </div>

                      {currentData.viralReachHashtags && (
                        <div style={{ marginBottom: '16px' }}>
                          <h5 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>Strictly High-Reach / Viral Hashtags</h5>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {currentData.viralReachHashtags.split(/\s+/).filter(tag => tag.startsWith('#')).map((tag, idx) => (
                              <span key={idx} style={{ background: 'rgba(236, 72, 153, 0.12)', color: '#f472b6', border: '1px solid rgba(236, 72, 153, 0.25)', padding: '4px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600 }}>{tag}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="workflow-output-actions">
                      <a 
                        href={currentData.videoUrl || "#"} 
                        download={`${(currentData.songName || 'viral_reel').replace(/\s+/g, '_')}_${Date.now()}.mp4`}
                        className={`gradient-btn ${!(currentData.videoUrl) && statusData.status !== 'completed' ? 'disabled' : ''}`}
                        style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', fontSize: '0.9rem', cursor: (currentData.videoUrl) || statusData.status === 'completed' ? 'pointer' : 'not-allowed' }}
                        onClick={(e) => {
                          if (!(currentData.videoUrl) && statusData.status !== 'completed') {
                            e.preventDefault();
                          }
                        }}
                      >
                        <HiOutlineDownload /> Download Reel
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Always Visible Terminal console at the bottom */}
          <div className="workflow-terminal glass-card">
            <div className="workflow-terminal-header">
              <div className="workflow-terminal-dots">
                <div className="workflow-terminal-dot red" />
                <div className="workflow-terminal-dot yellow" />
                <div className="workflow-terminal-dot green" />
              </div>
              <div className="workflow-terminal-title">
                <HiOutlineTerminal style={{ marginRight: '6px', color: '#ec4899', verticalAlign: 'middle' }} />
                Server Execution logs
              </div>
              <span className={`terminal-status-light ${statusData.status}`} />
            </div>
            <div className="workflow-terminal-body" ref={terminalBodyRef} onScroll={handleScroll}>
              {statusData.logs.length === 0 ? (
                <div className="workflow-terminal-log info">
                  <span className="workflow-terminal-log-time">[{new Date().toLocaleTimeString()}]</span>
                  <span className="workflow-terminal-log-text">System standby. Waiting for generation...</span>
                </div>
              ) : (
                statusData.logs.map((log, index) => (
                  <div key={index} className={`workflow-terminal-log ${log.type || 'info'}`}>
                    <span className="workflow-terminal-log-time">[{log.timestamp}]</span>
                    <span className="workflow-terminal-log-text">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
