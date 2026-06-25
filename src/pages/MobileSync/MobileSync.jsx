import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  HiOutlineDeviceMobile,
  HiOutlineWifi,
  HiOutlineQrcode,
  HiOutlineClipboardCopy,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineUpload,
  HiOutlinePlus,
  HiOutlineInformationCircle,
  HiOutlineTrash,
  HiOutlineExternalLink
} from 'react-icons/hi';
import './MobileSync.css';

export default function MobileSync() {
  const [serverStatus, setServerStatus] = useState({ online: false, localIp: '127.0.0.1', isHostMode: false });
  const [syncData, setSyncData] = useState({ approvals: [], uploads: [] });
  const [pollingActive, setPollingActive] = useState(true);
  
  // New Approval Request Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newMediaUrl, setNewMediaUrl] = useState('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=60');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Selected Image for Preview Modal
  const [previewImage, setPreviewImage] = useState(null);

  // Poll status & sync data
  useEffect(() => {
    let timer;
    const fetchData = async () => {
      try {
        const statusRes = await fetch('/api/status');
        if (statusRes.ok) {
          const statusJson = await statusRes.json();
          setServerStatus(statusJson);
        } else {
          setServerStatus(prev => ({ ...prev, online: false }));
        }

        const dataRes = await fetch('/api/data');
        if (dataRes.ok) {
          const dataJson = await dataRes.json();
          setSyncData(dataJson);
        }
      } catch (err) {
        console.error('Error polling Mobile Sync API:', err);
        setServerStatus(prev => ({ ...prev, online: false }));
      }
    };

    fetchData(); // Initial call
    if (pollingActive) {
      timer = setInterval(fetchData, 2000); // Poll every 2s
    }

    return () => clearInterval(timer);
  }, [pollingActive]);

  const handleCopyIp = () => {
    navigator.clipboard.writeText(serverStatus.localIp);
    triggerToast('IP Address copied to clipboard!');
  };

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleCreateApproval = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/add-approval-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          mediaUrl: newMediaUrl
        })
      });

      if (res.ok) {
        setNewTitle('');
        setNewDesc('');
        triggerToast('Approval request sent to mobile!');
        // Refresh data immediately
        const dataRes = await fetch('/api/data');
        if (dataRes.ok) {
          setSyncData(await dataRes.json());
        }
      } else {
        triggerToast('Failed to create approval request.');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Error connecting to backend API.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveReject = async (id, status) => {
    try {
      const res = await fetch('/api/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });

      if (res.ok) {
        triggerToast(`Task successfully ${status}!`);
        // Refresh data immediately
        const dataRes = await fetch('/api/data');
        if (dataRes.ok) {
          setSyncData(await dataRes.json());
        }
      }
    } catch (err) {
      console.error(err);
      triggerToast('Error updating status.');
    }
  };

  // Helper to format bytes
  const formatBytes = (bytes, decimals = 1) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Helper to format dates
  const formatTimeAgo = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString();
  };

  const connectionUri = `aaisu-sync://${serverStatus.localIp}:5173`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=e8edf5&bgcolor=151d30&data=${encodeURIComponent(connectionUri)}`;

  return (
    <div className="mobile-sync-page page-container">
      {/* Header */}
      <div className="sync-header animate-fade-in">
        <div className="sync-header-left">
          <h2>
            <HiOutlineDeviceMobile className="icon" />
            Mobile Integration Hub
          </h2>
          <p>
            Connect your Android device to upload files, give real-time pipeline approvals, and monitor system daemon health directly from your pocket.
          </p>
        </div>
        <div className="sync-header-right">
          <div className="live-status-pill">
            <span className={`status-dot ${serverStatus.online ? 'online' : 'offline'}`} />
            <span>LOCAL GATEWAY: {serverStatus.online ? 'ONLINE' : 'OFFLINE'}</span>
          </div>
          <button 
            className={`polling-toggle-btn ${pollingActive ? 'active' : ''}`}
            onClick={() => setPollingActive(!pollingActive)}
          >
            {pollingActive ? 'Live Polling ON' : 'Live Polling OFF'}
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="sync-grid animate-fade-in">
        
        {/* Left Side: Connection & Connection Configuration */}
        <div className="sync-column-left">
          
          {/* QR Code and Connection Panel */}
          <div className="glass-card connection-card">
            <h3><HiOutlineWifi /> Device Connection</h3>
            <p className="card-subtitle">Scan the QR code in the AaisuuSync Mobile App or enter the IP details below.</p>
            
            <div className="qr-container">
              {serverStatus.online ? (
                <div className="qr-box">
                  <img src={qrCodeUrl} alt="Connection QR Code" className="qr-image" />
                  <div className="qr-overlay-text">
                    <HiOutlineQrcode /> Scan to Connect
                  </div>
                </div>
              ) : (
                <div className="qr-placeholder">
                  <p>Start local server to generate QR Code</p>
                </div>
              )}
            </div>

            <div className="connection-details">
              <div className="detail-row">
                <span className="detail-label">Computer local IP</span>
                <div className="ip-display-wrapper">
                  <code>{serverStatus.localIp}</code>
                  <button onClick={handleCopyIp} className="copy-btn" title="Copy IP">
                    <HiOutlineClipboardCopy />
                  </button>
                </div>
              </div>
              <div className="detail-row">
                <span className="detail-label">Port</span>
                <code>5173</code>
              </div>
              <div className="detail-row">
                <span className="detail-label">App Scheme Protocol</span>
                <code>aaisu-sync://</code>
              </div>
            </div>

            {!serverStatus.isHostMode && (
              <div className="info-box warning-box">
                <HiOutlineInformationCircle className="info-icon" />
                <div className="info-text">
                  <strong>Network Sharing Recommended:</strong> Vite is currently listening on localhost. To allow mobile phone connection, make sure you run:
                  <code style={{ display: 'block', marginTop: '6px', color: 'var(--warning)' }}>npm run dev</code>
                  (We automatically configured network host permissions for you).
                </div>
              </div>
            )}
          </div>

          {/* New Approval Request Form */}
          <div className="glass-card create-task-card">
            <h3><HiOutlinePlus /> Create Approval Request</h3>
            <p className="card-subtitle">Push a content item to the mobile app for immediate review.</p>
            
            <form onSubmit={handleCreateApproval} className="task-form">
              <div className="form-group">
                <label>Task Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Instagram Reel Batch #4" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description / Caption</label>
                <textarea 
                  placeholder="Describe what needs to be reviewed or approved..." 
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  required
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Preset Preview Media</label>
                <select value={newMediaUrl} onChange={(e) => setNewMediaUrl(e.target.value)}>
                  <option value="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=60">Cyber Aesthetic (Indigo)</option>
                  <option value="https://images.unsplash.com/photo-1618005198143-e5283b519a7f?w=600&auto=format&fit=crop&q=60">AI Workspace Mockup (Violet)</option>
                  <option value="https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&auto=format&fit=crop&q=60">Fluid Gradient Background (Pink/Amber)</option>
                  <option value="https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=600&auto=format&fit=crop&q=60">Abstract 3D Shape (Cyan)</option>
                </select>
              </div>

              <button type="submit" className="gradient-btn" disabled={isSubmitting}>
                {isSubmitting ? 'Sending Request...' : 'Send to Phone'}
              </button>
            </form>
          </div>

        </div>

        {/* Right Side: Approvals Sync Status & File Uploads */}
        <div className="sync-column-right">
          
          {/* Approvals Live List */}
          <div className="glass-card approvals-card">
            <div className="card-header-row">
              <h3><HiOutlineCheckCircle /> Mobile Approvals Queue</h3>
              <span className="badge-count">{syncData.approvals.filter(a => a.status === 'pending').length} PENDING</span>
            </div>
            
            <div className="approvals-list">
              {syncData.approvals.length === 0 ? (
                <div className="list-empty">
                  <HiOutlineClock />
                  <p>No active approval requests</p>
                </div>
              ) : (
                syncData.approvals.map((appr) => (
                  <div key={appr.id} className={`approval-item accent-border-${appr.status === 'approved' ? 'success' : appr.status === 'rejected' ? 'danger' : 'indigo'}`}>
                    <div className="approval-item-media">
                      <img src={appr.mediaUrl} alt={appr.title} />
                      <div className={`status-tag ${appr.status}`}>
                        {appr.status.toUpperCase()}
                      </div>
                    </div>
                    <div className="approval-item-content">
                      <div className="item-meta">
                        <h4>{appr.title}</h4>
                        <span className="time">{formatTimeAgo(appr.createdAt)}</span>
                      </div>
                      <p>{appr.description}</p>
                      
                      {appr.status === 'pending' && (
                        <div className="item-actions">
                          <button 
                            className="action-btn approve"
                            onClick={() => handleApproveReject(appr.id, 'approved')}
                          >
                            <HiOutlineCheckCircle /> Approve
                          </button>
                          <button 
                            className="action-btn reject"
                            onClick={() => handleApproveReject(appr.id, 'rejected')}
                          >
                            <HiOutlineXCircle /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Media Uploads Section */}
          <div className="glass-card uploads-card">
            <div className="card-header-row">
              <h3><HiOutlineUpload /> Files Uploaded from Mobile</h3>
              <span className="badge-count">{syncData.uploads.length} TOTAL</span>
            </div>

            {syncData.uploads.length === 0 ? (
              <div className="list-empty">
                <HiOutlineUpload />
                <p>No mobile uploads yet</p>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Use the companion app to snap photos or upload files.</span>
              </div>
            ) : (
              <div className="uploads-grid">
                {syncData.uploads.map((upload) => (
                  <div key={upload.id} className="upload-grid-item" onClick={() => setPreviewImage(upload)}>
                    <div className="upload-media-preview">
                      {upload.fileType.startsWith('image/') ? (
                        <img src={upload.url} alt={upload.originalName} />
                      ) : (
                        <div className="video-placeholder">
                          <HiOutlineExternalLink style={{ fontSize: '2rem', color: 'var(--cyan)' }} />
                          <span>Video File</span>
                        </div>
                      )}
                      <div className="upload-hover-overlay">
                        <span>Click to Expand</span>
                      </div>
                    </div>
                    <div className="upload-item-details">
                      <span className="file-name" title={upload.originalName}>{upload.originalName}</span>
                      <div className="file-meta">
                        <span>{formatBytes(upload.sizeBytes)}</span>
                        <span>·</span>
                        <span>{formatTimeAgo(upload.uploadedAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Image Preview Modal */}
      {previewImage && createPortal(
        <div className="modal-overlay" onClick={() => setPreviewImage(null)}>
          <div className="modal-content-wrapper" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setPreviewImage(null)}>
              <HiOutlineXCircle />
            </button>
            <div className="modal-body-content">
              {previewImage.fileType.startsWith('image/') ? (
                <img src={previewImage.url} alt={previewImage.originalName} className="modal-full-image" />
              ) : (
                <div className="video-player-placeholder">
                  <p>Video Player (Raw File Available at: <code>{previewImage.url}</code>)</p>
                  <a href={previewImage.url} target="_blank" rel="noreferrer" className="gradient-btn" style={{ display: 'inline-flex', gap: '8px' }}>
                    Open Video in New Tab <HiOutlineExternalLink />
                  </a>
                </div>
              )}
              <div className="modal-meta-bar">
                <div>
                  <h3>{previewImage.originalName}</h3>
                  <p>Uploaded {new Date(previewImage.uploadedAt).toLocaleString()} · {formatBytes(previewImage.sizeBytes)}</p>
                </div>
                <a href={previewImage.url} download={previewImage.originalName} className="copy-btn" style={{ background: 'var(--bg-elevated)', padding: '10px 14px' }}>
                  Download Raw File
                </a>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Floating Toast Notification */}
      <div className={`toast-notification ${showToast ? 'show' : ''}`}>
        <HiOutlineCheckCircle className="toast-icon" />
        <span>{toastMessage}</span>
      </div>
    </div>
  );
}
