import React, { useState, useEffect } from 'react'
import { useToast } from '../contexts/ToastContext'
import { getGeminiApiKey, saveGeminiApiKey, isGeminiConfigured } from '../services/settings'
import { isEmailConfigured, saveEmailConfig, initNotificationService } from '../services/notification'

export default function SettingsModal({ onClose }) {
    const { showToast } = useToast()
    const [geminiKey, setGeminiKey] = useState('')
    const [showKeys, setShowKeys] = useState(true) // Default to visible
    // EmailJS Config
    const [emailjsServiceId, setEmailjsServiceId] = useState('')
    const [emailjsTemplateId, setEmailjsTemplateId] = useState('')
    const [emailjsPublicKey, setEmailjsPublicKey] = useState('')

    useEffect(() => {
        setGeminiKey(getGeminiApiKey() || '')
        // Load settings from localStorage
        try {
            const saved = localStorage.getItem('eduassist_settings')
            if (saved) {
                const settings = JSON.parse(saved)
                setEmailjsServiceId(settings.emailjsServiceId || '')
                setEmailjsTemplateId(settings.emailjsTemplateId || '')
                setEmailjsPublicKey(settings.emailjsPublicKey || '')
            }
        } catch (err) {
            console.error('Error loading settings:', err)
        }
    }, [])

    const handleSave = () => {
        // Save Gemini API key
        saveGeminiApiKey(geminiKey)

        // Save all settings
        const newSettings = {
            geminiApiKey: geminiKey,
            emailjsServiceId: emailjsServiceId,
            emailjsTemplateId: emailjsTemplateId,
            emailjsPublicKey: emailjsPublicKey
        }
        try {
            localStorage.setItem('eduassist_settings', JSON.stringify(newSettings))
            saveEmailConfig(emailjsPublicKey, emailjsServiceId, emailjsTemplateId)
            // Re-initialize notification service after saving
            initNotificationService()
        } catch (err) {
            console.error('Error saving config:', err)
        }

        showToast('Đã lưu cài đặt!', 'success')
        onClose()
    }

    const emailConfigured = emailjsServiceId && emailjsTemplateId && emailjsPublicKey

    return (
        <div className="modal-overlay" style={{ display: 'flex' }} onClick={onClose}>
            <div className="modal modal-settings" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
                <div className="modal-header">
                    <h3>
                        <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                            <circle cx="12" cy="12" r="3" />
                        </svg>
                        Cài Đặt API
                    </h3>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                    <form id="form-settings">
                        {/* Toggle Show/Hide Keys */}
                        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setShowKeys(!showKeys)}
                                style={{ fontSize: '0.8rem', padding: '4px 12px' }}
                            >
                                {showKeys ? '🙈 Ẩn API Keys' : '👁️ Hiện API Keys'}
                            </button>
                        </div>

                        {/* Gemini API Section */}
                        <div className="form-group">
                            <label className="label-with-icon">
                                <svg className="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 2a5 5 0 0 1 5 5v3a5 5 0 0 1-10 0V7a5 5 0 0 1 5-5z" />
                                    <path d="M12 14v4" />
                                    <circle cx="12" cy="20" r="2" />
                                </svg>
                                Gemini API Key
                                <a href="https://ai.google.dev" target="_blank" rel="noreferrer" className="link-help">(Lấy key)</a>
                            </label>
                            <input
                                type={showKeys ? "text" : "password"}
                                placeholder="AIzaSy..."
                                className="input-field"
                                value={geminiKey}
                                onChange={e => setGeminiKey(e.target.value)}
                            />
                        </div>

                        {/* EmailJS Section */}
                        <div style={{ borderTop: '1px solid var(--border)', marginTop: '1rem', paddingTop: '1rem' }}>
                            <h4 style={{ marginBottom: '0.75rem', color: 'var(--text)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                📧 Email Thông Báo (EmailJS)
                                <span style={{
                                    fontSize: '0.7rem',
                                    background: emailConfigured ? '#10b981' : '#ef4444',
                                    color: 'white',
                                    padding: '2px 8px',
                                    borderRadius: '10px'
                                }}>
                                    {emailConfigured ? '✓ Đã cấu hình' : 'Chưa cấu hình'}
                                </span>
                            </h4>

                            <small style={{
                                color: 'var(--text-muted)',
                                fontSize: '0.75rem',
                                display: 'block',
                                marginBottom: '0.75rem',
                                background: 'var(--surface)',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                lineHeight: '1.5'
                            }}>
                                ✅ Miễn phí 200 email/tháng<br />
                                ✅ Không cần GPKD/xác minh<br />
                                ✅ Setup đơn giản, hoạt động ngay
                            </small>

                            <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                                <label className="label-with-icon">
                                    Service ID
                                    <a href="https://dashboard.emailjs.com/admin" target="_blank" rel="noreferrer" className="link-help">(Lấy từ EmailJS Dashboard)</a>
                                </label>
                                <input
                                    type="text"
                                    placeholder="service_xxxxxxx"
                                    className="input-field"
                                    value={emailjsServiceId}
                                    onChange={e => setEmailjsServiceId(e.target.value)}
                                    style={{ borderColor: emailjsServiceId ? '#10b981' : 'var(--border)' }}
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                                <label className="label-with-icon">
                                    Template ID
                                </label>
                                <input
                                    type="text"
                                    placeholder="template_xxxxxxx"
                                    className="input-field"
                                    value={emailjsTemplateId}
                                    onChange={e => setEmailjsTemplateId(e.target.value)}
                                    style={{ borderColor: emailjsTemplateId ? '#10b981' : 'var(--border)' }}
                                />
                            </div>

                            <div className="form-group">
                                <label className="label-with-icon">
                                    Public Key
                                </label>
                                <input
                                    type={showKeys ? "text" : "password"}
                                    placeholder="Nhập Public Key từ EmailJS"
                                    className="input-field"
                                    value={emailjsPublicKey}
                                    onChange={e => setEmailjsPublicKey(e.target.value)}
                                    style={{ borderColor: emailjsPublicKey ? '#10b981' : 'var(--border)' }}
                                />
                            </div>
                        </div>

                        {/* Status Indicators */}
                        <div className="form-group" style={{ marginTop: '1.25rem' }}>
                            <label className="label-with-icon">
                                <svg className="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                                </svg>
                                Trạng thái kết nối
                            </label>
                            <div className="status-indicators">
                                <div className="status-item">
                                    <span className="status-dot" style={{ background: '#10b981' }}></span>
                                    <span>Firebase</span>
                                </div>
                                <div className="status-item">
                                    <span className="status-dot" style={{ background: geminiKey ? '#10b981' : '#ef4444' }}></span>
                                    <span>Gemini AI</span>
                                </div>
                                <div className="status-item">
                                    <span className="status-dot" style={{ background: emailConfigured ? '#10b981' : '#ef4444' }}></span>
                                    <span>Email (EmailJS)</span>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Đóng</button>
                    <button className="btn btn-primary" onClick={handleSave}>
                        <svg className="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                            <polyline points="17 21 17 13 7 13 7 21" />
                            <polyline points="7 3 7 8 15 8" />
                        </svg>
                        Lưu cài đặt
                    </button>
                </div>
            </div>
        </div>
    )
}
