import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineBookOpen,
  HiOutlineSparkles,
  HiOutlineFilm,
  HiOutlineUserGroup,
  HiOutlineChatAlt2,
  HiOutlineExternalLink,
  HiOutlineCheckCircle,
  HiOutlineChip,
  HiOutlinePlay,
  HiOutlineLightBulb,
  HiOutlineArrowLeft
} from 'react-icons/hi';
import './LearnMore.css';

const guides = [
  {
    id: 'reel-engine',
    title: 'Automated Reel Synthesis & Subtitle Timing',
    category: 'Video Automation',
    icon: HiOutlineFilm,
    readTime: '4 min read',
    summary: 'Learn how AaisuuSync compiles Pexels HD video background loops, syncs LRC song lyrics, and renders vertical 1080x1920 reels for Instagram & Shorts.',
    content: [
      'Step 1: Open Reel Automation from the main menu.',
      'Step 2: Enter your topic or lyrics (e.g., trending song LRC lines or tech motivation).',
      'Step 3: Choose your AI Inference engine (Gemini Cloud or Local Ollama).',
      'Step 4: Click "Generate Reel Assets" — AaisuuSync fetches 4K loops from Pexels, burns animated subtitles, and prepares your video bundle.'
    ]
  },
  {
    id: 'linkedin-outreach',
    title: 'AI LinkedIn Campaign & Outreach Sequences',
    category: 'Growth & Leads',
    icon: HiOutlineUserGroup,
    readTime: '3 min read',
    summary: 'Orchestrate smart connection requests, personalized follow-ups, and post scheduling with AI prompt guardrails.',
    content: [
      'Step 1: Go to LinkedIn Automation in your workspace.',
      'Step 2: Set target industry tags (e.g. Founders, Software Engineers, Marketing leads).',
      'Step 3: Select outreach persona (Friendly, Professional, Direct pitch).',
      'Step 4: Launch campaign — AaisuuSync queues automated messages respecting daily rate limits.'
    ]
  },
  {
    id: 'instagram-autoresponder',
    title: 'Instagram DM AI Auto-Responder Node',
    category: 'Conversational AI',
    icon: HiOutlineChatAlt2,
    readTime: '5 min read',
    summary: 'Never miss a buyer lead. Train your AI on product links, pricing FAQs, and automatic appointment booking.',
    content: [
      'Step 1: Connect your Instagram account from Accounts or Instagram DM.',
      'Step 2: Configure system instructions (e.g., "Always share discount code SAVE20 for ebook inquiries").',
      'Step 3: Enable Auto-Responder toggle.',
      'Step 4: Incoming DMs are analyzed by Gemini in real time and replied to within 2 seconds.'
    ]
  }
];

export default function LearnMore() {
  const navigate = useNavigate();
  const [selectedGuide, setSelectedGuide] = useState(guides[0]);

  return (
    <div className="learn-container page-container">
      {/* Top Page Header Row */}
      <div className="page-header-row">
        <button className="back-btn" onClick={() => navigate(-1)} aria-label="Go back" title="Go back">
          <HiOutlineArrowLeft />
        </button>
        <span className="page-header-context-title">Back to Dashboard</span>
      </div>

      {/* Hero Header */}
      <div className="learn-hero">
        <span className="learn-pill">
          <HiOutlineBookOpen /> Platform Guides & Tutorials
        </span>
        <h2>Master AaisuuSync Automation</h2>
        <p>Step-by-step documentation and prompt engineering tips to maximize your growth pipelines.</p>
      </div>

      {/* Guide Cards Row */}
      <div className="guides-grid">
        {guides.map((g) => {
          const IconComponent = g.icon;
          const isSelected = selectedGuide.id === g.id;
          return (
            <div
              key={g.id}
              className={`guide-card ${isSelected ? 'active' : ''}`}
              onClick={() => setSelectedGuide(g)}
            >
              <div className="guide-card-top">
                <div className="guide-icon">
                  <IconComponent />
                </div>
                <span className="guide-read-time">{g.readTime}</span>
              </div>
              <span className="guide-category">{g.category}</span>
              <h4>{g.title}</h4>
              <p>{g.summary}</p>
            </div>
          );
        })}
      </div>

      {/* Selected Walkthrough Detail Card */}
      <div className="guide-detail-card">
        <div className="detail-header">
          <div>
            <span className="detail-category">{selectedGuide.category}</span>
            <h3>{selectedGuide.title}</h3>
          </div>
          <span className="detail-read-time">{selectedGuide.readTime}</span>
        </div>

        <p className="detail-summary">{selectedGuide.summary}</p>

        <div className="steps-list">
          <h4>Workflow Execution Steps:</h4>
          {selectedGuide.content.map((step, idx) => (
            <div key={idx} className="step-card">
              <span className="step-num">{idx + 1}</span>
              <p>{step}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Prompt Engineering Tips */}
      <div className="prompt-tips-card">
        <div className="tips-header">
          <HiOutlineLightBulb className="tips-icon" />
          <div>
            <h3>Pro Prompt Engineering Tips for Gemini</h3>
            <p>Get 3x higher engagement by following these system prompt structures.</p>
          </div>
        </div>

        <div className="tips-grid">
          <div className="tip-box">
            <h4>1. Dynamic Subtitle Hooks</h4>
            <p>Always tell Gemini to generate a 3-word opening hook in uppercase (e.g. <code>"STOP DOING THIS"</code>) to capture scroll attention.</p>
          </div>
          <div className="tip-box">
            <h4>2. Strict JSON Outputs</h4>
            <p>Ensure your prompt instructs Gemini to output raw JSON with keys <code>intro</code>, <code>verse</code>, and <code>outro</code> for seamless LRC timing.</p>
          </div>
          <div className="tip-box">
            <h4>3. Local Node Backup</h4>
            <p>Keep Ollama Llama3 installed locally so your pipelines continue running smoothly even during cloud network maintenance.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
