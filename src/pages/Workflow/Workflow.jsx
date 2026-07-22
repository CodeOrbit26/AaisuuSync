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
  HiOutlineChevronUp,
  HiOutlineRefresh
} from 'react-icons/hi';
import './Workflow.css';

export const STAGE_KEYS = [
  'input_processing',
  'prompt1_song',
  'audio_memory_verification',
  'prompt2_lyrics',
  'audio_download_trim',
  'prompt3_visual_specs',
  'reel_canvas_composition',
  'rendering',
  'prompt4_hashtags',
  'audio_memory_save',
  'final_output'
];

export const STAGES = [
  {
    key: 'input_processing',
    title: '1. Input Processing',
    description: 'Workflow initialization, blueprint load, and API key validation',
    icon: <HiOutlineDatabase />
  },
  {
    key: 'prompt1_song',
    title: '2. Prompt 1 — Song Recommendation',
    description: 'LLM viral track selection and timestamp recommendation',
    icon: <HiOutlineMusicNote />
  },
  {
    key: 'audio_memory_verification',
    title: '3. Audio Memory Verification',
    description: 'Checking DB history for song/timestamp collisions & retry loop',
    icon: <HiOutlineSearch />
  },
  {
    key: 'prompt2_lyrics',
    title: '4. Prompt 2 — Lyrics & Timestamp Extraction',
    description: 'Multimodal LRC transcription & Hinglish timestamp syncing',
    icon: <HiOutlineTerminal />
  },
  {
    key: 'audio_download_trim',
    title: '5. Audio Download & Trimming',
    description: 'yt-dlp stream fetch & FFmpeg precise 15s hook cropping',
    icon: <HiOutlineDownload />
  },
  {
    key: 'prompt3_visual_specs',
    title: '6. Prompt 3 — Visual Specifications',
    description: 'Typographical layout styling, font, colors & aesthetic tokens',
    icon: <HiOutlineAdjustments />
  },
  {
    key: 'reel_canvas_composition',
    title: '7. Reel Canvas Composition',
    description: 'Puppeteer frame screenshot generation & lyrics animation sync',
    icon: <HiOutlineFilm />
  },
  {
    key: 'rendering',
    title: '8. Rendering',
    description: 'FFmpeg sequential image stitching & audio muxing pipeline',
    icon: <HiOutlinePlay />
  },
  {
    key: 'prompt4_hashtags',
    title: '9. Prompt 4 — Viral Caption & Hashtags',
    description: 'LLM high-engagement caption & viral hashtag generation',
    icon: <HiOutlineDocumentDuplicate />
  },
  {
    key: 'audio_memory_save',
    title: '10. Audio Memory Save',
    description: 'Persisting track, timestamp, and trim parameters to Audio Memory DB',
    icon: <HiOutlineCheckCircle />
  },
  {
    key: 'final_output',
    title: '11. Final Output',
    description: 'Video preview, download link, hashtags & complete execution report',
    icon: <HiOutlineExternalLink />
  }
];

export default function WorkflowTab({ isGenerating }) {
  const [activeStep, setActiveStep] = useState('input_processing');
  const [copiedText, setCopiedText] = useState('');
  const [expandedSections, setExpandedSections] = useState({ prompt: true, raw: false, json: true });
  const [audioMemoryCount, setAudioMemoryCount] = useState(0);
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

        // Automatically switch active step to current processing stage
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
    fetch('/api/audio-memory')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAudioMemoryCount(data.length);
        }
      })
      .catch(() => {});
      
    let interval;
    if (isGenerating || statusData.status === 'processing') {
      interval = setInterval(fetchStatus, 1000);
    } else {
      interval = setInterval(fetchStatus, 3000);
    }
    return () => clearInterval(interval);
  }, [isGenerating, statusData.status]);

  const handleScroll = () => {
    if (!terminalBodyRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = terminalBodyRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    isUserScrollingRef.current = !isAtBottom;
  };

  useEffect(() => {
    if (statusData.stage === 'input_processing') {
      isUserScrollingRef.current = false;
    }
    if (!isUserScrollingRef.current && terminalBodyRef.current) {
      terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight;
    }
  }, [statusData.logs, statusData.stage]);

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(typeof text === 'object' ? JSON.stringify(text, null, 2) : text);
    setCopiedText(key);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const getStepStatusClass = (stepKey) => {
    const stagesData = statusData.executionData?.stagesData || {};
    const stageInfo = stagesData[stepKey];

    if (stageInfo) {
      if (stageInfo.status === 'completed') return 'completed';
      if (stageInfo.status === 'failed') return 'failed';
      if (stageInfo.status === 'retrying') return 'retrying';
      if (stageInfo.status === 'running') return 'active current-running';
    }

    if (statusData.status === 'idle') return 'completed';

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
    if (statusClass.includes('retrying')) return 'RETRYING';
    if (statusClass.includes('current-running')) return 'RUNNING';
    if (statusClass.includes('completed')) return 'SUCCESS';
    return 'PENDING';
  };

  const currentData = statusData.executionData || {};
  const stagesData = currentData.stagesData || {};
  const activeStageInfo = stagesData[activeStep] || {};

  // Generic LLM Stage Debugger component
  const renderLlmStageDebugger = (stageKey, title, defaultPromptText) => {
    const info = stagesData[stageKey] || {};
    const promptText = info.promptSent || currentData[stageKey]?.promptSent || defaultPromptText;
    const rawResponse = info.rawResponse || (info.parsedJson ? JSON.stringify(info.parsedJson, null, 2) : 'No raw response received yet.');
    const parsedJson = info.parsedJson || info.outputData || {};

    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Stage Status Summary Cards */}
        <div className="workflow-stats-grid">
          <div className="workflow-stat-card border-pink">
            <h5>Stage Status</h5>
            <p className="text-neon-pink">{(info.status || getStepStatusText(stageKey)).toUpperCase()}</p>
          </div>
          <div className="workflow-stat-card border-blue">
            <h5>Execution Time</h5>
            <p className="text-neon-blue">{info.duration || 'Live'}</p>
          </div>
          <div className="workflow-stat-card border-green">
            <h5>Data Format</h5>
            <p className="text-neon-green">Structured JSON</p>
          </div>
        </div>

        {/* 1. Prompt Sent */}
        <div className="workflow-accordion glass-card">
          <div 
            className="workflow-accordion-header" 
            onClick={() => setExpandedSections(prev => ({ ...prev, prompt: !prev.prompt }))}
          >
            <span style={{ fontWeight: 600, color: 'var(--accent-primary)', fontSize: '0.88rem' }}>Prompt Sent to LLM Agent</span>
            <div className="workflow-accordion-header-right">
              <button 
                className="workflow-copy-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(promptText, `${stageKey}_prompt`);
                }}
              >
                {copiedText === `${stageKey}_prompt` ? <HiOutlineCheck style={{ color: '#10b981' }} /> : <HiOutlineDocumentDuplicate />}
              </button>
              {expandedSections.prompt ? <HiOutlineChevronUp /> : <HiOutlineChevronDown />}
            </div>
          </div>
          {expandedSections.prompt && (
            <div className="workflow-accordion-body">
              <pre>{promptText}</pre>
            </div>
          )}
        </div>

        {/* 2. Raw LLM Response */}
        <div className="workflow-accordion glass-card">
          <div 
            className="workflow-accordion-header" 
            onClick={() => setExpandedSections(prev => ({ ...prev, raw: !prev.raw }))}
          >
            <span style={{ fontWeight: 600, color: '#f59e0b', fontSize: '0.88rem' }}>Raw LLM Response</span>
            <div className="workflow-accordion-header-right">
              <button 
                className="workflow-copy-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(rawResponse, `${stageKey}_raw`);
                }}
              >
                {copiedText === `${stageKey}_raw` ? <HiOutlineCheck style={{ color: '#10b981' }} /> : <HiOutlineDocumentDuplicate />}
              </button>
              {expandedSections.raw ? <HiOutlineChevronUp /> : <HiOutlineChevronDown />}
            </div>
          </div>
          {expandedSections.raw && (
            <div className="workflow-accordion-body">
              <pre style={{ color: '#fbbf24' }}>{rawResponse}</pre>
            </div>
          )}
        </div>

        {/* 3. Parsed JSON View */}
        <div className="workflow-accordion glass-card">
          <div 
            className="workflow-accordion-header" 
            onClick={() => setExpandedSections(prev => ({ ...prev, json: !prev.json }))}
          >
            <span style={{ fontWeight: 600, color: '#34d399', fontSize: '0.88rem' }}>Parsed JSON Payload</span>
            <div className="workflow-accordion-header-right">
              <button 
                className="workflow-copy-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(parsedJson, `${stageKey}_json`);
                }}
              >
                {copiedText === `${stageKey}_json` ? <HiOutlineCheck style={{ color: '#10b981' }} /> : <HiOutlineDocumentDuplicate />}
              </button>
              {expandedSections.json ? <HiOutlineChevronUp /> : <HiOutlineChevronDown />}
            </div>
          </div>
          {expandedSections.json && (
            <div className="workflow-accordion-body">
              <textarea
                readOnly
                value={JSON.stringify(parsedJson, null, 2)}
                className="workflow-code-display code-json"
                style={{ height: '180px', fontFamily: 'monospace' }}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

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
                  ) : statusClass.includes('retrying') ? (
                    <HiOutlineRefresh className="spin-icon" style={{ color: '#f59e0b' }} />
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
              <span className={`workflow-badge ${getStepStatusClass(activeStep)}`}>
                {getStepStatusText(activeStep)}
              </span>
            </div>

            <div className="workflow-panel-content-body">
              {/* STAGE 1: INPUT PROCESSING */}
              {activeStep === 'input_processing' && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="workflow-stats-grid">
                    <div className="workflow-stat-card border-pink">
                      <h5>HTTP Request Method</h5>
                      <p className="text-neon-pink">POST /api/generate-viral-reel</p>
                    </div>
                    <div className="workflow-stat-card border-blue">
                      <h5>Selected Blueprint</h5>
                      <p className="text-neon-blue">{currentData.blueprint || 'Lyrics'}</p>
                    </div>
                    <div className="workflow-stat-card border-green">
                      <h5>API Key Status</h5>
                      <p className="text-neon-green">VALIDATED</p>
                    </div>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', marginBottom: '8px', color: 'rgba(255,255,255,0.9)' }}>Input Execution Context</h4>
                    <textarea
                      readOnly
                      value={JSON.stringify(stagesData.input_processing || {
                        workflowId: currentData.workflowId || 'wf_init',
                        blueprint: currentData.blueprint || 'Lyrics',
                        vibeFilter: currentData.vibeFilter || 'random',
                        promptSource: currentData.promptSource || 'None',
                        apiStatus: 'Gemini API Keys Validated'
                      }, null, 2)}
                      className="workflow-code-display code-json"
                      style={{ height: '140px' }}
                    />
                  </div>
                </div>
              )}

              {/* STAGE 2: PROMPT 1 (SONG RECOMMENDATION) */}
              {activeStep === 'prompt1_song' && renderLlmStageDebugger(
                'prompt1_song',
                'Prompt 1 — Song Recommendation',
                'You are a viral TikTok/Reels expert. Suggest 3 distinct trending Hindi or Haryanvi songs for an emotional reel.'
              )}

              {/* STAGE 3: AUDIO MEMORY VERIFICATION */}
              {activeStep === 'audio_memory_verification' && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="workflow-stats-grid">
                    <div className="workflow-stat-card border-pink">
                      <h5>Audio Memory Size</h5>
                      <p className="text-neon-pink">{(stagesData.audio_memory_verification?.inputData?.dbTotalSongs ?? audioMemoryCount)} Songs Logged</p>
                    </div>
                    <div className="workflow-stat-card border-blue">
                      <h5>Approved Song</h5>
                      <p className="text-neon-blue">{stagesData.audio_memory_verification?.approvedSong || currentData.songName || 'Kitab'}</p>
                    </div>
                    <div className="workflow-stat-card border-green">
                      <h5>Timestamp Gap Rule</h5>
                      <p className="text-neon-green">&gt;= 20 Seconds Spacing</p>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '0.95rem', marginBottom: '8px', color: 'rgba(255,255,255,0.9)' }}>Audio Memory Verification & Collision Logs</h4>
                    <div style={{ background: 'rgba(0, 0, 0, 0.35)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '16px' }}>
                      {Array.isArray(stagesData.audio_memory_verification?.checkedCandidates) && stagesData.audio_memory_verification.checkedCandidates.length > 0 ? (
                        stagesData.audio_memory_verification.checkedCandidates.map((cand, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.85rem' }}>{cand.songName}</span>
                            <span style={{ color: cand.status === 'APPROVED' ? '#10b981' : '#f59e0b', fontSize: '0.78rem', fontWeight: 700 }}>
                              {cand.status}: {cand.reason}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          Checking Audio Memory pool... Candidate tracks are verified to guarantee no repeat songs or timestamp collisions occur.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* STAGE 4: PROMPT 2 (LYRICS & TIMESTAMPS) */}
              {activeStep === 'prompt2_lyrics' && renderLlmStageDebugger(
                'prompt2_lyrics',
                'Prompt 2 — Lyrics & Timestamp Extraction',
                'Listen to this 15-second audio clip. Transcribe the lyrics exactly as sung in Hinglish only with LRC timestamps [mm:ss.ms].'
              )}

              {/* STAGE 5: AUDIO DOWNLOAD & TRIMMING */}
              {activeStep === 'audio_download_trim' && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="workflow-stats-grid">
                    <div className="workflow-stat-card border-pink">
                      <h5>Audio Tool</h5>
                      <p className="text-neon-pink">yt-dlp Core</p>
                    </div>
                    <div className="workflow-stat-card border-blue">
                      <h5>Audio Crop Tool</h5>
                      <p className="text-neon-blue">FFmpeg (-ss -t 15)</p>
                    </div>
                    <div className="workflow-stat-card border-green">
                      <h5>Trimmed Clip Size</h5>
                      <p className="text-neon-green">{stagesData.audio_download_trim?.audioSize || '245,120 bytes'}</p>
                    </div>
                  </div>

                  {stagesData.audio_download_trim?.youtubeCmd && (
                    <div>
                      <h4 style={{ fontSize: '0.95rem', marginBottom: '8px', color: 'rgba(255,255,255,0.9)' }}>yt-dlp Download Stream Command</h4>
                      <textarea readOnly value={stagesData.audio_download_trim.youtubeCmd} className="workflow-code-display code-script" style={{ height: '80px' }} />
                    </div>
                  )}

                  {stagesData.audio_download_trim?.trimCmd && (
                    <div>
                      <h4 style={{ fontSize: '0.95rem', marginBottom: '8px', color: 'rgba(255,255,255,0.9)' }}>FFmpeg 15s Trim Command</h4>
                      <textarea readOnly value={stagesData.audio_download_trim.trimCmd} className="workflow-code-display code-ffmpeg" style={{ height: '80px' }} />
                    </div>
                  )}
                </div>
              )}

              {/* STAGE 6: PROMPT 3 (VISUAL SPECIFICATIONS) */}
              {activeStep === 'prompt3_visual_specs' && renderLlmStageDebugger(
                'prompt3_visual_specs',
                'Prompt 3 — Visual Specifications',
                'This reel style features a minimalist black background with vibrant light pink, handwritten-style text. Layout: 1080x1920 Portrait.'
              )}

              {/* STAGE 7: REEL CANVAS COMPOSITION */}
              {activeStep === 'reel_canvas_composition' && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="workflow-composition-timeline">
                    <div className="workflow-composition-progress">
                      <span>Headless Canvas Screenshotting</span>
                      <span>{stagesData.reel_canvas_composition?.renderingProgress || 150} / {stagesData.reel_canvas_composition?.renderingTotal || 150} Frames</span>
                    </div>
                    <div className="workflow-composition-bar-container">
                      <div 
                        className="workflow-composition-bar" 
                        style={{ width: `${((stagesData.reel_canvas_composition?.renderingProgress || 150) / (stagesData.reel_canvas_composition?.renderingTotal || 150)) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {stagesData.reel_canvas_composition?.puppeteerHtml && (
                    <div>
                      <h4 style={{ fontSize: '0.95rem', marginBottom: '8px', color: 'rgba(255,255,255,0.9)' }}>Headless DOM Layout HTML</h4>
                      <textarea
                        readOnly
                        value={stagesData.reel_canvas_composition.puppeteerHtml}
                        className="workflow-code-display code-html"
                        style={{ height: '200px' }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* STAGE 8: RENDERING */}
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

                  {stagesData.rendering?.ffmpegCmd && (
                    <div>
                      <h4 style={{ fontSize: '0.95rem', marginBottom: '8px', color: 'rgba(255,255,255,0.9)' }}>FFmpeg Mux Stitching CLI</h4>
                      <textarea
                        readOnly
                        value={stagesData.rendering.ffmpegCmd}
                        className="workflow-code-display code-ffmpeg"
                        style={{ height: '100px' }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* STAGE 9: PROMPT 4 (VIRAL CAPTION & HASHTAGS) */}
              {activeStep === 'prompt4_hashtags' && renderLlmStageDebugger(
                'prompt4_hashtags',
                'Prompt 4 — Viral Caption & Hashtags',
                'You are an Instagram Reels virality expert. Based on the selected song name [SONG_NAME] and lyrics snippet [LYRICS], generate a list of 8-10 highly targeted viral hashtags.'
              )}

              {/* STAGE 10: AUDIO MEMORY SAVE */}
              {activeStep === 'audio_memory_save' && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="workflow-stats-grid">
                    <div className="workflow-stat-card border-pink">
                      <h5>Database Status</h5>
                      <p className="text-neon-pink">PERSISTED_TO_DB</p>
                    </div>
                    <div className="workflow-stat-card border-blue">
                      <h5>Logged Track</h5>
                      <p className="text-neon-blue">{stagesData.audio_memory_save?.savedRecord?.songName || currentData.songName || 'Kitab'}</p>
                    </div>
                    <div className="workflow-stat-card border-green">
                      <h5>Recorded Hook Start</h5>
                      <p className="text-neon-green">{stagesData.audio_memory_save?.savedRecord?.timestamp ?? 15}s</p>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '0.95rem', marginBottom: '8px', color: 'rgba(255,255,255,0.9)' }}>Saved Audio Memory Database Payload</h4>
                    <textarea
                      readOnly
                      value={JSON.stringify(stagesData.audio_memory_save?.savedRecord || {
                        songName: currentData.songName || 'Kitab',
                        artist: 'Female Version',
                        blueprint: currentData.blueprint || 'Lyrics',
                        timestamp: 15,
                        trimRange: '15s',
                        workflowId: currentData.workflowId || 'wf_1721667000123',
                        createdTime: new Date().toISOString()
                      }, null, 2)}
                      className="workflow-code-display code-json"
                      style={{ height: '180px' }}
                    />
                  </div>
                </div>
              )}

              {/* STAGE 11: FINAL OUTPUT */}
              {activeStep === 'final_output' && (
                <div className="animate-fade-in workflow-output-card">
                  <div className="workflow-output-preview">
                    {currentData.videoUrl || stagesData.final_output?.videoUrl || statusData.status === 'completed' ? (
                      <video 
                        className="workflow-output-video" 
                        src={window.resolveUrl(currentData.videoUrl || stagesData.final_output?.videoUrl || "/uploads/viral_reel_trimmed.mp4")} 
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
                      <h4>{currentData.songName || stagesData.final_output?.songName || 'Kitab'}</h4>
                      <p>
                        The high-retention aesthetic lyrics reel has been synthesized successfully. 
                        The download file is optimized with native resolution codecs for premium Instagram publishing quality.
                      </p>

                      <div style={{ margin: '12px 0', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '10px 12px' }}>
                        <span style={{ fontSize: '0.75rem', color: '#a78bfa', fontWeight: 600, display: 'block', marginBottom: '4px' }}>AI GENERATED CAPTION</span>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#e2e8f0' }}>{currentData.caption || stagesData.final_output?.caption || 'Tumein me bhul jaunga... ✨'}</p>
                      </div>
                      
                      <div className="workflow-stats-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '10px', borderRadius: '6px' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Render Elapsed</span>
                          <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{currentData.totalElapsedTime || stagesData.final_output?.totalElapsedTime || '18.4s'}</span>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '10px', borderRadius: '6px' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Files Status</span>
                          <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#10b981' }}>RENDERED</span>
                        </div>
                      </div>

                      {(currentData.viralHashtags || stagesData.final_output?.hashtags) && (
                        <div style={{ marginBottom: '16px' }}>
                          <h5 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>Strictly High-Reach / Viral Hashtags</h5>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {(currentData.viralHashtags || stagesData.final_output?.hashtags || '').split(/\s+/).filter(tag => tag.startsWith('#')).map((tag, idx) => (
                              <span key={idx} style={{ background: 'rgba(236, 72, 153, 0.12)', color: '#f472b6', border: '1px solid rgba(236, 72, 153, 0.25)', padding: '4px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600 }}>{tag}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="workflow-output-actions">
                      <a 
                        href={currentData.videoUrl || stagesData.final_output?.videoUrl || "#"} 
                        download={`${(currentData.songName || 'viral_reel').replace(/\s+/g, '_')}_${Date.now()}.mp4`}
                        className={`gradient-btn ${!(currentData.videoUrl || stagesData.final_output?.videoUrl) && statusData.status !== 'completed' ? 'disabled' : ''}`}
                        style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', fontSize: '0.9rem', cursor: (currentData.videoUrl || stagesData.final_output?.videoUrl) || statusData.status === 'completed' ? 'pointer' : 'not-allowed' }}
                        onClick={(e) => {
                          if (!(currentData.videoUrl || stagesData.final_output?.videoUrl) && statusData.status !== 'completed') {
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
