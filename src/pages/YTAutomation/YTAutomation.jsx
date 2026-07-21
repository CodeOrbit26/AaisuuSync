import React, { useState } from 'react';
import {
  HiOutlineTrendingUp,
  HiOutlineEye,
  HiOutlineThumbUp,
  HiOutlineUserAdd,
  HiOutlineFilm,
  HiOutlineVideoCamera,
  HiOutlineChartBar,
  HiOutlineClock,
  HiOutlineCog,
  HiOutlineCloud,
  HiOutlineRefresh,
  HiOutlineLightningBolt,
  HiOutlinePlay,
  HiOutlineFire,
  HiOutlineCalendar,
  HiOutlineColorSwatch,
  HiOutlineDatabase,
  HiOutlineAdjustments,
  HiOutlineUpload,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineDocumentDuplicate,
  HiOutlineMusicNote,
  HiOutlineLink,
  HiOutlineSparkles,
  HiOutlinePhotograph,
  HiOutlineGlobe,
  HiOutlineClipboardList,
} from 'react-icons/hi';
import Tabs from '../../components/Tabs/Tabs';
import { useApp } from '../../context/AppContext';
import './YTAutomation.css';

const blueprintTypes = ['Shorts', 'Long-Form', 'Tutorials', 'Vlogs', 'Compilations'];

const mainTabs = [
  { id: 'pipeline', label: 'Pipeline Dashboard', icon: <HiOutlineChartBar /> },
  { id: 'studio', label: 'Video Studio', icon: <HiOutlineColorSwatch /> },
  { id: 'memory', label: 'Content Memory', icon: <HiOutlineDatabase /> },
  { id: 'analytics', label: 'YT Analytics', icon: <HiOutlineTrendingUp /> },
];

const viewsData = [];
const topVideos = [];

export default function YTAutomation() {
  const { currentUser } = useAuth();
  const uid = currentUser?.id || '';
  const uk = (key) => uid ? `${uid}_${key}` : key;

  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem(uk('aaisuu_active_tab_yt')) || 'pipeline';
  });

  React.useEffect(() => {
    localStorage.setItem(uk('aaisuu_active_tab_yt'), activeTab);
  }, [activeTab, uid]);

  const [pipelineFilter, setPipelineFilter] = useState('queued');
  const [activeBlueprint, setActiveBlueprint] = useState('Shorts');
  const [systemOn, setSystemOn] = useState(false);
  const { currentModel, connectedAccounts } = useApp();

  const isChannelConnected = !!connectedAccounts.youtubeChannel;

  return (
    <div className="yt-page page-container">
      {/* Header — mirrors Reel Automation */}
      <div className="yt-header">
        <div className="yt-header-left">
          <h2>
            <svg className="yt-icon" viewBox="0 0 24 24" fill="currentColor" style={{ width: '20px', height: '20px', marginRight: '8px' }}>
              <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.13C5.12 19.56 12 19.56 12 19.56s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/>
              <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="white"/>
            </svg>
            YouTube Synthesis Engine
          </h2>
          <p>
            Automate video creation, scheduling, and publishing. Design content templates,
            manage your upload pipeline, and track performance through YT Studio analytics.
          </p>
        </div>
        <div className="yt-header-right">
          <div className="yt-master-switch">
            <span>AUTO-PUBLISH {systemOn ? 'ON' : 'OFF'}</span>
            <div
              className={`switch-toggle ${systemOn ? 'on' : ''}`}
              onClick={() => setSystemOn(!systemOn)}
              role="button"
              tabIndex={0}
            />
          </div>
          <button className="yt-scope-btn">
            <HiOutlineAdjustments />
            All Channels
          </button>
        </div>
      </div>

      {/* Main Tabs — minimal variant like Reel Automation */}
      <div className="yt-tabs">
        <Tabs tabs={mainTabs} activeTab={activeTab} onTabChange={setActiveTab} variant="minimal" />
      </div>

      {/* Tab Content */}
      {!isChannelConnected ? (
        <div className="glass-card yt-lock-overlay animate-fade-in" style={{ padding: '48px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', margin: '24px 0' }}>
          <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: 'var(--yt-red-bg)', color: 'var(--yt-red)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.13C5.12 19.56 12 19.56 12 19.56s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/>
              <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="white"/>
            </svg>
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>YouTube Channel Not Linked</h3>
          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', maxWidth: '420px', lineHeight: 1.55 }}>
            Authenticate your YouTube account credentials using Google OAuth on the Accounts page to authorize auto-publishing pipelines and sync Studio stats.
          </p>
        </div>
      ) : (
        <>
          {activeTab === 'pipeline' && <PipelineTab filter={pipelineFilter} setFilter={setPipelineFilter} />}
          {activeTab === 'studio' && <StudioTab activeBlueprint={activeBlueprint} setActiveBlueprint={setActiveBlueprint} currentModel={currentModel} />}
          {activeTab === 'memory' && <MemoryTab activeBlueprint={activeBlueprint} setActiveBlueprint={setActiveBlueprint} />}
          {activeTab === 'analytics' && <AnalyticsTab />}
        </>
      )}
    </div>
  );
}

/* =============================================
   Pipeline Tab — queued / published / failed
   ============================================= */
function PipelineTab({ filter, setFilter }) {
  const filterTabs = [
    { id: 'queued', label: 'Queued', icon: <HiOutlineClock />, count: 4 },
    { id: 'published', label: 'Published', icon: <HiOutlineCheckCircle />, count: 18 },
    { id: 'failed', label: 'Failed', icon: <HiOutlineXCircle />, count: 0 },
  ];

  const queuedItems = [];

  return (
    <div className="yt-pipeline-section">
      <div className="yt-pipeline-header-row">
        <div>
          <h3>Publishing Pipeline</h3>
          <p>Manage queued videos, review published content, and track failures.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="outline-btn"><HiOutlineRefresh /> Sync YT Studio</button>
          <button className="gradient-btn"><HiOutlineUpload /> Queue Video</button>
        </div>
      </div>

      <div className="yt-pipeline-filters">
        <Tabs tabs={filterTabs} activeTab={filter} onTabChange={setFilter} />
      </div>

      {filter === 'queued' && (
        <div className="yt-queue-list">
          {queuedItems.length === 0 ? (
            <div className="glass-card" style={{ width: '100%' }}>
              <div className="yt-empty-state" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div className="yt-empty-icon" style={{ fontSize: '2rem', marginBottom: '8px', opacity: 0.3 }}><HiOutlineClock /></div>
                <p style={{ fontSize: 'var(--font-sm)', fontWeight: 500 }}>No videos currently queued</p>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Generate videos in the Video Studio or queue draft clips manually.</span>
              </div>
            </div>
          ) : (
            queuedItems.map((item, i) => (
              <div key={i} className="glass-card yt-queue-item">
                <div className="yt-queue-thumb" style={{ background: item.color }}>
                  <HiOutlinePlay />
                </div>
                <div className="yt-queue-info">
                  <h4>{item.title}</h4>
                  <div className="yt-queue-meta">
                    <span className="yt-queue-type">{item.type}</span>
                    <span>{item.duration}</span>
                    <span><HiOutlineCalendar /> {item.scheduled}</span>
                  </div>
                </div>
                <div className="yt-queue-status">
                  <span className={`yt-status-pill ${item.status}`}>
                    {item.status === 'ready' && '● Ready'}
                    {item.status === 'rendering' && '◌ Rendering'}
                    {item.status === 'drafting' && '◌ Drafting'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {filter === 'published' && (
        <div className="glass-card yt-pipeline-summary">
          {topVideos.length === 0 ? (
            <div className="yt-empty-state" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div className="yt-empty-icon" style={{ fontSize: '2rem', marginBottom: '8px', opacity: 0.3 }}><HiOutlineCheckCircle /></div>
              <p style={{ fontSize: 'var(--font-sm)', fontWeight: 500 }}>No published videos found</p>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Publish videos to see your live channel catalog.</span>
            </div>
          ) : (
            <div className="yt-published-grid">
              {topVideos.map((v, i) => (
                <div key={i} className="yt-published-item">
                  <div className="yt-pub-thumb" style={{ background: v.color }}><HiOutlinePlay /></div>
                  <div className="yt-pub-info">
                    <h4>{v.title}</h4>
                    <span>{v.views} views · Published {i + 1}d ago</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {filter === 'failed' && (
        <div className="glass-card">
          <div className="yt-empty-state">
            <div className="yt-empty-icon"><HiOutlineCheckCircle /></div>
            <p>No failed uploads — everything's running smooth!</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* =============================================
   Studio Tab — Video creation matrix
   ============================================= */
function StudioTab({ activeBlueprint, setActiveBlueprint, currentModel }) {
  return (
    <div className="yt-studio-grid">
      {/* Preview Panel */}
      <div className="glass-card yt-studio-preview accent-border-yt">
        <div className="yt-studio-preview-label">
          <HiOutlineVideoCamera /> Video Preview
        </div>
        <div className="yt-studio-canvas">
          <div className="yt-studio-canvas-play">
            <HiOutlinePlay />
          </div>
          <div className="yt-studio-canvas-bars">
            <div className="yt-studio-bar" style={{ width: '70%' }} />
            <div className="yt-studio-bar" style={{ width: '90%' }} />
            <div className="yt-studio-bar" style={{ width: '55%' }} />
          </div>
        </div>
        <div className="yt-studio-canvas-meta">
          {activeBlueprint.toUpperCase()} TEMPLATE<br />
          <span>1920×1080 · 16:9 Landscape</span>
        </div>
      </div>

      {/* Right Side Config */}
      <div className="yt-studio-right">
        <div className="glass-card yt-studio-config">
          <h3><HiOutlineDocumentDuplicate /> Active Content Blueprint</h3>
          <p>Configure the template the AI agent uses to generate videos.</p>

          <div className="yt-studio-chips">
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

          {/* Asset Config */}
          <div className="yt-synth-section">
            <h4>Content Synthesizer</h4>
            <div className="yt-synth-grid">
              <div className="synth-item">
                <div className="synth-item-icon"><HiOutlineMusicNote /></div>
                <div className="synth-item-text">
                  <div className="synth-item-label">Background Audio</div>
                  <div className="synth-item-value">Lo-fi Chill (Auto-select)</div>
                </div>
              </div>
              <div className="synth-item">
                <div className="synth-item-icon" style={{ background: 'var(--yt-red-bg)', color: 'var(--yt-red)' }}><HiOutlinePhotograph /></div>
                <div className="synth-item-text">
                  <div className="synth-item-label">Thumbnail Style</div>
                  <div className="synth-item-value">AI Generated (DALL-E)</div>
                </div>
              </div>
              <div className="synth-item">
                <div className="synth-item-icon" style={{ background: 'var(--teal-bg)', color: 'var(--teal)' }}><HiOutlineGlobe /></div>
                <div className="synth-item-text">
                  <div className="synth-item-label">SEO Optimization</div>
                  <div className="synth-item-value">Auto Title + Tags + Description</div>
                </div>
              </div>
              <div className="synth-item">
                <div className="synth-item-icon" style={{ background: 'var(--orange-bg)', color: 'var(--orange)' }}><HiOutlineLink /></div>
                <div className="synth-item-text">
                  <div className="synth-item-label">Watermark</div>
                  <div className="synth-item-value">AaisuuSync Branding</div>
                </div>
              </div>
            </div>

            {/* AI Engine + Schedule */}
            <div className="synth-poll">
              <div className="synth-poll-left">
                <div className="synth-poll-icon" style={{ background: `${currentModel.color}18`, color: currentModel.color }}>
                  <HiOutlineSparkles />
                </div>
                <div className="synth-item-text">
                  <div className="synth-item-label">AI Engine</div>
                  <div className="synth-item-value">{currentModel.name} ({currentModel.type})</div>
                </div>
              </div>
              <button className="generating-btn">Generating...</button>
            </div>

            <div className="synth-poll" style={{ marginTop: 10 }}>
              <div className="synth-poll-left">
                <div className="synth-poll-icon"><HiOutlineRefresh /></div>
                <div className="synth-item-text">
                  <div className="synth-item-label">Auto-Publish Schedule</div>
                  <div className="synth-item-value">Shorts Daily 6PM · Long-Form Tue/Thu</div>
                </div>
              </div>
              <button className="generating-btn" style={{ background: 'var(--yt-red-bg)', color: 'var(--yt-red)', borderColor: 'rgba(255,0,51,0.15)' }}>Scheduled</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =============================================
   Memory Tab — Content Memory (mirrors Reel)
   ============================================= */
function MemoryTab({ activeBlueprint, setActiveBlueprint }) {
  return (
    <div className="glass-card yt-memory-section">
      {/* Header */}
      <div className="memory-header">
        <div className="memory-header-left">
          <div className="memory-avatar" style={{ background: 'linear-gradient(135deg, #ff0033, #cc0029)' }}>
            <HiOutlineVideoCamera />
          </div>
          <div className="memory-header-text">
            <h3>{activeBlueprint.toUpperCase()}</h3>
            <span>Blueprint // {activeBlueprint} ●</span>
          </div>
        </div>

        <div className="memory-chips">
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

        <button className="memory-sync-btn">
          <HiOutlineRefresh /> Sync Blueprint
        </button>
      </div>

      {/* Body */}
      <div className="memory-body">
        <div className="memory-logic">
          <div className="memory-logic-header">
            <span className="memory-logic-title"><span className="status-dot online" /> Content Generation Logic</span>
            <button className="memory-action-btn generate">⬛ Generate by Agent</button>
            <button className="memory-action-btn patch">Run_Patch</button>
          </div>
          <textarea
            className="memory-textarea"
            defaultValue={`# YouTube ${activeBlueprint} Blueprint\n\n## Content Rules\n- Topic: Trending AI & automation subjects\n- Hook: First 3 seconds must grab attention\n- CTA: Subscribe + comment prompt at end\n- Duration: ${activeBlueprint === 'Shorts' ? '30-58 seconds' : '8-15 minutes'}\n\n## SEO Config\n- Auto-generate title with power words\n- 15-20 relevant tags per video\n- Description with timestamps + links\n- Custom thumbnail with face + text overlay`}
          />
        </div>

        <div className="memory-assets">
          <span className="memory-assets-title">
            <span className="status-dot" style={{ background: 'var(--yt-red)' }} /> Asset Reference Library
          </span>
          <div className="memory-dropzone">
            <div className="memory-dropzone-icon"><HiOutlineUpload /></div>
            <p>Drop Video Clips or Thumbnails</p>
            <button className="memory-dropzone-btn">Select Files</button>
          </div>
          <div className="memory-no-assets">NO_REFERENCE_ASSETS</div>
        </div>
      </div>
    </div>
  );
}

/* =============================================
   Analytics Tab — Full YT Studio Analytics
   ============================================= */
function AnalyticsTab() {
  const [chartPeriod, setChartPeriod] = useState('7d');
  const { connectedAccounts } = useApp();

  const subscribers = connectedAccounts.youtubeChannel ? connectedAccounts.youtubeChannel.subscribers : '0';

  return (
    <div className="yt-analytics-section">
      {/* Stats Row */}
      <div className="yt-analytics-stats stagger">
        <div className="glass-card yt-mini-stat accent-border-yt">
          <div className="yt-mini-stat-icon" style={{ background: 'var(--yt-red-bg)', color: 'var(--yt-red)' }}><HiOutlineEye /></div>
          <div>
            <div className="yt-mini-stat-value">0</div>
            <div className="yt-mini-stat-label">Total Views</div>
          </div>
          <span className="yt-mini-stat-change">+0%</span>
        </div>
        <div className="glass-card yt-mini-stat accent-border-indigo">
          <div className="yt-mini-stat-icon" style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--accent-primary)' }}><HiOutlineUserAdd /></div>
          <div>
            <div className="yt-mini-stat-value">{subscribers}</div>
            <div className="yt-mini-stat-label">Subscribers</div>
          </div>
          <span className="yt-mini-stat-change">+0</span>
        </div>
        <div className="glass-card yt-mini-stat accent-border-teal">
          <div className="yt-mini-stat-icon" style={{ background: 'var(--teal-bg)', color: 'var(--teal)' }}><HiOutlineThumbUp /></div>
          <div>
            <div className="yt-mini-stat-value">0.0%</div>
            <div className="yt-mini-stat-label">Engagement</div>
          </div>
          <span className="yt-mini-stat-change">+0.0%</span>
        </div>
        <div className="glass-card yt-mini-stat accent-border-orange">
          <div className="yt-mini-stat-icon" style={{ background: 'var(--orange-bg)', color: 'var(--orange)' }}><HiOutlineClock /></div>
          <div>
            <div className="yt-mini-stat-value">0:00</div>
            <div className="yt-mini-stat-label">Avg. Watch Time</div>
          </div>
          <span className="yt-mini-stat-change">+0:00</span>
        </div>
      </div>

      {/* Charts Row */}
      <div className="yt-analytics-grid">
        <div className="glass-card yt-chart-card accent-border-yt">
          <div className="yt-chart-header">
            <h4>Weekly Performance</h4>
            <div className="yt-chart-period">
              {['7d', '30d', '90d'].map((p) => (
                <button key={p} className={chartPeriod === p ? 'active' : ''} onClick={() => setChartPeriod(p)}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="yt-chart-body">
            {viewsData.length === 0 ? (
              <div className="yt-empty-state" style={{ padding: '64px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: 'var(--font-xs)', fontWeight: 500 }}>No weekly performance data recorded yet</p>
              </div>
            ) : (
              viewsData.map((d) => (
                <div key={d.day}>
                  <div className="yt-bar-row">
                    <span className="yt-bar-label">{d.day}</span>
                    <div className="yt-bar-track">
                      <div className="yt-bar-fill views" style={{ width: `${d.views}%` }} />
                    </div>
                    <span className="yt-bar-value">{(d.views * 45).toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="glass-card yt-top-videos">
          <div className="yt-top-videos-header">
            <h4><HiOutlineFire style={{ color: 'var(--orange)' }} /> Top Performing</h4>
          </div>
          {topVideos.length === 0 ? (
            <div className="yt-empty-state" style={{ padding: '64px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: 'var(--font-xs)', fontWeight: 500 }}>No top performing videos found</p>
            </div>
          ) : (
            topVideos.map((video, i) => (
              <div key={i} className="yt-video-item">
                <div className="yt-video-thumb" style={{ background: video.color }}>
                  <HiOutlinePlay />
                </div>
                <div className="yt-video-info">
                  <h5>{video.title}</h5>
                  <span>Published {i + 1}d ago</span>
                </div>
                <span className="yt-video-views">{video.views}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="yt-analytics-timeline">
        <h4><HiOutlineClipboardList /> Recent Channel Activity</h4>
        <div className="glass-card yt-timeline">
          <div className="yt-empty-state" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: 'var(--font-xs)', fontWeight: 500 }}>No recent channel activity found.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
