import React, { useState } from 'react';
import {
  HiOutlineChatAlt2,
  HiOutlineCog,
  HiOutlineLightningBolt,
  HiOutlineTemplate,
  HiOutlinePaperAirplane,
  HiOutlineLink,
  HiOutlinePlus,
} from 'react-icons/hi';
import { useApp } from '../../context/AppContext';
import './InstagramDM.css';

const mockConversations = [
  { id: 1, name: 'Riya Patel', lastMsg: 'Can you tell me more about your services?', time: '2m', unread: true, color: '#6366f1' },
  { id: 2, name: 'Arjun Verma', lastMsg: 'Thanks for the info! Will check it out', time: '15m', unread: true, color: '#22c55e' },
  { id: 3, name: 'Sneha Kapoor', lastMsg: 'Looking forward to the collaboration', time: '1h', unread: false, color: '#eab308' },
  { id: 4, name: 'Vikram Shah', lastMsg: 'What are your pricing plans?', time: '3h', unread: false, color: '#8b5cf6' },
  { id: 5, name: 'Anika Roy', lastMsg: 'Great content on your page!', time: '1d', unread: false, color: '#ef4444' },
];

const mockMessages = [
  { id: 1, text: 'Hi! I love your content. Can you tell me more about your automation services?', type: 'incoming', time: '10:32 AM' },
  { id: 2, text: 'Thank you so much! 🙏 We offer AI-powered Instagram automation including auto-DM replies, content scheduling, and lead generation. Would you like to know about any specific feature?', type: 'outgoing', ai: true, time: '10:33 AM' },
  { id: 3, text: "Yes! I'm interested in the auto-reply feature. How does it work?", type: 'incoming', time: '10:35 AM' },
  { id: 4, text: 'Our AI auto-reply uses advanced NLP to understand incoming messages and respond naturally. It learns your brand voice and can handle FAQs, pricing inquiries, and even book appointments. The AI improves with every interaction! 🤖', type: 'outgoing', ai: true, time: '10:36 AM' },
];

export default function InstagramDM() {
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [replyText, setReplyText] = useState('');
  const { connectedAccounts } = useApp();

  const isInstagramConnected = connectedAccounts.instagram && connectedAccounts.instagram.length > 0;

  const handleSyncInbox = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setConversations(mockConversations);
      setMessages(mockMessages);
      setSelectedConv(1);
      setIsSyncing(false);
    }, 1500);
  };

  const handleSendMessage = () => {
    if (!replyText.trim()) return;
    const newMsg = {
      id: Date.now(),
      text: replyText,
      type: 'outgoing',
      ai: false,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, newMsg]);
    setReplyText('');

    // Simulate AI thinking and reply
    setTimeout(() => {
      const aiMsg = {
        id: Date.now() + 1,
        text: `I am simulating an AI response to: "${replyText}". The local agent is analyzing your message flow.`,
        type: 'outgoing',
        ai: true,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    }, 1000);
  };

  return (
    <div className="dm-page page-container">
      <div className="dm-header">
        <div className="dm-header-left">
          <h2>Instagram DM Automation</h2>
          <p>Reply to customers automatically using local AI models.</p>
        </div>
        <button className="gradient-btn">
          <HiOutlineCog /> Configure AI
        </button>
      </div>

      {!isInstagramConnected ? (
        <div className="glass-card dm-lock-overlay animate-fade-in" style={{ padding: '48px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', margin: '24px 0' }}>
          <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: 'rgba(236,72,153,0.1)', color: 'var(--pink)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>
            <HiOutlineLink />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>Instagram Account Not Linked</h3>
          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', maxWidth: '420px', lineHeight: 1.55 }}>
            Link your Instagram account credentials on the Accounts page to authorize DM inbox reading access and enable AI Auto-Reply pipelines.
          </p>
        </div>
      ) : (
        <div className="dm-layout">
          <div className="glass-card dm-conversations accent-border-pink">
            <div className="dm-conv-header" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input type="text" placeholder="Search..." style={{ flex: 1 }} />
              <button 
                className="gradient-btn" 
                onClick={handleSyncInbox} 
                disabled={isSyncing}
                style={{ padding: '8px 12px', fontSize: 'var(--font-xs)', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                {isSyncing ? (
                  <span className="spinner-loader" style={{ width: '12px', height: '12px', border: '1.5px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--pink)' }}></span>
                ) : 'Sync'}
              </button>
            </div>
            <div className="dm-conv-list">
              {isSyncing ? (
                <div style={{ padding: '48px 16px', textAlign: 'center' }}>
                  <div className="spinner-loader" style={{ width: '24px', height: '24px', border: '2.5px solid rgba(255,255,255,0.08)', borderTopColor: 'var(--pink)', borderRadius: '50%', marginBottom: '8px' }}></div>
                  <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Syncing Direct Messages...</p>
                </div>
              ) : conversations.length === 0 ? (
                <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <HiOutlineChatAlt2 style={{ fontSize: '1.8rem', opacity: 0.2, marginBottom: '6px' }} />
                  <p style={{ fontSize: 'var(--font-xs)' }}>Inbox is empty.</p>
                  <button onClick={handleSyncInbox} style={{ background: 'none', border: 'none', color: 'var(--pink)', cursor: 'pointer', fontSize: 'var(--font-xs)', fontWeight: 600, marginTop: '8px', textDecoration: 'underline' }}>
                    Sync mock messages
                  </button>
                </div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`dm-conv-item ${selectedConv === conv.id ? 'active' : ''}`}
                    onClick={() => setSelectedConv(conv.id)}
                  >
                    <div className="dm-conv-avatar" style={{ background: conv.color }}>
                      {conv.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="dm-conv-info">
                      <h4>{conv.name}</h4>
                      <p>{conv.lastMsg}</p>
                    </div>
                    <span className="dm-conv-time">{conv.time}</span>
                    {conv.unread && <span className="dm-conv-unread" />}
                  </div>
                ))
              )}
            </div>
          </div>

          {selectedConv === null || conversations.length === 0 ? (
            <div className="glass-card dm-chat accent-border-indigo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px', color: 'var(--text-muted)' }}>
              <HiOutlineChatAlt2 style={{ fontSize: '2.5rem', marginBottom: '12px', opacity: 0.3, color: 'var(--accent-primary)' }} />
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>No Chat Selected</p>
              <span style={{ fontSize: 'var(--font-xs)', textAlign: 'center', maxWidth: '320px' }}>
                Select a conversation from the sidebar or sync your inbox to start.
              </span>
            </div>
          ) : (
            <div className="glass-card dm-chat accent-border-indigo">
              <div className="dm-chat-header">
                <div className="dm-chat-user">
                  <div className="dm-conv-avatar" style={{ background: conversations.find(c => c.id === selectedConv)?.color || '#6366f1', width: 32, height: 32, fontSize: '0.6rem' }}>
                    {conversations.find(c => c.id === selectedConv)?.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h4>{conversations.find(c => c.id === selectedConv)?.name}</h4>
                    <span>Active now</span>
                  </div>
                </div>
                <span className="dm-ai-badge">AI Auto-Reply ON</span>
              </div>

              <div className="dm-chat-messages">
                {messages.map((msg) => (
                  <div key={msg.id} className={`dm-message ${msg.type} ${msg.ai ? 'ai-generated' : ''}`}>
                    {msg.text}
                    <div className="dm-message-time">{msg.time}</div>
                  </div>
                ))}
              </div>

              <div className="dm-chat-input">
                <input 
                  type="text" 
                  placeholder="Type a message..." 
                  value={replyText} 
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button className="gradient-btn" style={{ padding: '8px 14px' }} onClick={handleSendMessage}>
                  <HiOutlinePaperAirplane />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="dm-config">
        <h3>AI Configuration</h3>
        <div className="dm-config-grid stagger">
          <div className="glass-card dm-config-card accent-border-orange">
            <h4><HiOutlineLightningBolt style={{ color: 'var(--orange)' }} /> Auto-Reply Speed</h4>
            <p>AI responds within 30 seconds of receiving a new message. Configurable delay to appear natural.</p>
          </div>
          <div className="glass-card dm-config-card accent-border-indigo">
            <h4><HiOutlineTemplate style={{ color: 'var(--accent-primary)' }} /> Message Templates</h4>
            <p>12 custom templates loaded for FAQs, pricing, booking, and general inquiries.</p>
          </div>
          <div className="glass-card dm-config-card accent-border-success">
            <h4><HiOutlineChatAlt2 style={{ color: 'var(--success)' }} /> Conversation Memory</h4>
            <p>AI remembers context from previous conversations to provide personalized responses.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
