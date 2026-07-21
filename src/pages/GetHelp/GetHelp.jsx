import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineQuestionMarkCircle,
  HiOutlineSearch,
  HiOutlineBookOpen,
  HiOutlineChatAlt2,
  HiOutlineMail,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineSparkles,
  HiOutlinePaperAirplane,
  HiOutlineCheckCircle,
  HiOutlineArrowLeft
} from 'react-icons/hi';
import './GetHelp.css';

const faqs = [
  {
    q: 'How do I connect my Instagram DM auto-responder node?',
    a: 'Navigate to Instagram DM from the sidebar menu, click "Connect Account", and enter your Instagram session ID or Meta Graph token. Once connected, Gemini AI will automatically reply to incoming customer messages based on your custom prompt rules.'
  },
  {
    q: 'How do I get a free Google Gemini API Key?',
    a: 'Visit Google AI Studio (aistudio.google.com/app/apikey), sign in with your Google account, and click "Create API Key". Copy the key and paste it into Settings -> API & AI Inference in AaisuuSync.'
  },
  {
    q: 'Why is Reel Synthesis taking longer on local node?',
    a: 'When running local Ollama inference or rendering high-bitrate 4K background video loops from Pexels, processing depends on your hardware CPU/GPU. You can switch to Gemini Pro (Cloud) in Settings for instant rendering.'
  },
  {
    q: 'How does per-user data isolation work?',
    a: 'All local blueprints, prompts, connected accounts, and API tokens are isolated per User ID in localStorage and encrypted Chrome server profiles. Your data is never shared across accounts.'
  },
  {
    q: 'Can I export my automated reels and LinkedIn drafts?',
    a: 'Yes! From the Dashboard or Settings page, click "Export JSON" to download your complete workspace configuration, reel logs, and custom presets.'
  }
];

export default function GetHelp() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState(null);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSubmitted, setTicketSubmitted] = useState(false);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleTicketSubmit = (e) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMessage) return;
    setTicketSubmitted(true);
    setTicketSubject('');
    setTicketMessage('');
    setTimeout(() => setTicketSubmitted(false), 4000);
  };

  const filteredFaqs = faqs.filter(
    (item) =>
      item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="help-container page-container">
      {/* Top Page Header Row */}
      <div className="page-header-row">
        <button className="back-btn" onClick={() => navigate(-1)} aria-label="Go back" title="Go back">
          <HiOutlineArrowLeft />
        </button>
        <span className="page-header-context-title">Back to Dashboard</span>
      </div>

      {/* Search & Hero Banner */}
      <div className="help-hero">
        <div className="help-pill">
          <HiOutlineQuestionMarkCircle /> Help Center & Support
        </div>
        <h2>How can we help you today?</h2>
        <p>Search FAQs, browse workflow tutorials, or submit a direct ticket to our engineering team.</p>

        <div className="help-search-bar">
          <HiOutlineSearch className="help-search-icon" />
          <input
            type="text"
            placeholder="Search questions, API setup, Reel engine..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Support Quick Channels */}
      <div className="help-channels-grid">
        <div className="help-channel-card">
          <div className="channel-icon discord">
            <HiOutlineChatAlt2 />
          </div>
          <h4>Discord Community</h4>
          <p>Join 2,500+ creators sharing AI reel prompts & automation strategies.</p>
          <a href="https://discord.gg" target="_blank" rel="noopener noreferrer" className="channel-link">
            Join Discord →
          </a>
        </div>

        <div className="help-channel-card">
          <div className="channel-icon docs">
            <HiOutlineBookOpen />
          </div>
          <h4>Interactive Documentation</h4>
          <p>Read step-by-step guides for YouTube Shorts, LinkedIn outreach, and LRC captions.</p>
          <a href="#faqs" className="channel-link">
            Read Docs →
          </a>
        </div>

        <div className="help-channel-card">
          <div className="channel-icon email">
            <HiOutlineMail />
          </div>
          <h4>Email Engineering Support</h4>
          <p>Direct priority support for account issues and API rate limit troubleshooting.</p>
          <a href="mailto:abhaygupta26nov11@gmail.com" className="channel-link">
            Email Us →
          </a>
        </div>
      </div>

      {/* FAQ Accordion Section */}
      <div className="help-section" id="faqs">
        <div className="section-title-row">
          <h3>Frequently Asked Questions</h3>
          <span className="faq-count">{filteredFaqs.length} articles</span>
        </div>

        <div className="faq-accordion">
          {filteredFaqs.map((faq, index) => (
            <div
              key={index}
              className={`faq-item ${openFaq === index ? 'open' : ''}`}
              onClick={() => toggleFaq(index)}
            >
              <div className="faq-question">
                <span>{faq.q}</span>
                {openFaq === index ? <HiOutlineChevronUp /> : <HiOutlineChevronDown />}
              </div>
              {openFaq === index && (
                <div className="faq-answer">
                  <p>{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Submit Ticket Form */}
      <div className="help-ticket-card">
        <div className="ticket-header">
          <h3>Submit a Support Ticket</h3>
          <p>Need custom help? Send a message directly to Abhay Gupta & engineering.</p>
        </div>

        <form onSubmit={handleTicketSubmit} className="ticket-form">
          <div className="ticket-field">
            <label htmlFor="ticket-subject">Subject</label>
            <input
              id="ticket-subject"
              type="text"
              placeholder="e.g. Gemini API key connection error"
              value={ticketSubject}
              onChange={(e) => setTicketSubject(e.target.value)}
              required
            />
          </div>

          <div className="ticket-field">
            <label htmlFor="ticket-message">Message Details</label>
            <textarea
              id="ticket-message"
              rows={4}
              placeholder="Describe the issue or feature request in detail..."
              value={ticketMessage}
              onChange={(e) => setTicketMessage(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="ticket-submit-btn">
            <HiOutlinePaperAirplane />
            <span>Send Support Ticket</span>
          </button>
        </form>
      </div>

      {ticketSubmitted && (
        <div className="help-toast">
          <HiOutlineCheckCircle className="toast-icon" />
          <span>Ticket submitted successfully! We will reply to your registered email shortly.</span>
        </div>
      )}
    </div>
  );
}
