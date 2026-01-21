import React, { useState, useEffect } from 'react'
import { useToast } from '../contexts/ToastContext'
import { getGeminiApiKey, saveGeminiApiKey, isGeminiConfigured, loadSettings, saveSettings } from '../services/settings'
import { isSmsConfigured, saveSmsConfig } from '../services/sms'

export default function SettingsModal({ onClose }) {
    const { showToast } = useToast()
    const [geminiKey, setGeminiKey] = useState('')
    const [smsApiKey, setSmsApiKey] = useState('')
    const [smsSecretKey, setSmsSecretKey] = useState('')
    const [smsBrandName, setSmsBrandName] = useState('')
    const [smsStatus, setSmsStatus] = useState(false)

    useEffect(() => {
        setGeminiKey(getGeminiApiKey() || '')
        // Load SMS settings from localStorage
        try {
            const saved = localStorage.getItem('eduassist_settings')
            if (saved) {
                const settings = JSON.parse(saved)
                setSmsApiKey(settings.smsApiKey || '')
                setSmsSecretKey(settings.smsSecretKey || '')
                setSmsBrandName(settings.smsBrandName || '')
            }
        } catch (err) {
            console.error('Error loading SMS settings:', err)
        }
        setSmsStatus(isSmsConfigured())
    }, [])

    const handleSave = () => {
        // Save Gemini API key
        saveGeminiApiKey(geminiKey)

        // Save SMS config
        const newSettings = {
            geminiApiKey: geminiKey,
            smsApiKey: smsApiKey,
            smsSecretKey: smsSecretKey,
            smsBrandName: smsBrandName || 'Baotrixemay'
        }
        try {
            localStorage.setItem('eduassist_settings', JSON.stringify(newSettings))
            saveSmsConfig(smsApiKey, smsSecretKey, smsBrandName)
        } catch (err) {
            console.error('Error saving SMS config:', err)
        }

        showToast('Đã lưu cài đặt', 'success')
        onClose()
    }

    return (
        <div className="modal-overlay" style={{ display: 'flex' }} onClick={onClose}>
            <div className="modal modal-settings" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
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
                <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    <form id="form-settings">
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
                                type="password"
                                placeholder="AIzaSy..."
                                className="input-field"
                                value={geminiKey}
                                onChange={e => setGeminiKey(e.target.value)}
                            />
                        </div>

                        {/* SMS API Section */}
                        <div style={{ borderTop: '1px solid var(--border)', marginTop: '1rem', paddingTop: '1rem' }}>
                            <h4 style={{ marginBottom: '0.75rem', color: 'var(--text)', fontSize: '0.95rem' }}>
                                📱 Cấu hình SMS (eSMS.vn)
                            </h4>

                            <div className="form-group">
                                <label className="label-with-icon">
                                    API Key
                                    <a href="https://account.esms.vn/Home/Index" target="_blank" rel="noreferrer" className="link-help">(Lấy key)</a>
                                </label>
                                <input
                                    type="password"
                                    placeholder="Nhập API Key từ eSMS"
                                    className="input-field"
                                    value={smsApiKey}
                                    onChange={e => setSmsApiKey(e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label className="label-with-icon">Secret Key</label>
                                <input
                                    type="password"
                                    placeholder="Nhập Secret Key từ eSMS"
                                    className="input-field"
                                    value={smsSecretKey}
                                    onChange={e => setSmsSecretKey(e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label className="label-with-icon">Brandname (tùy chọn)</label>
                                <input
                                    type="text"
                                    placeholder="Baotrixemay"
                                    className="input-field"
                                    value={smsBrandName}
                                    onChange={e => setSmsBrandName(e.target.value)}
                                />
                                <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                    Để trống sẽ dùng "Baotrixemay". Brandname cần được đăng ký với eSMS.
                                </small>
                            </div>
                        </div>

                        {/* Status Indicators */}
                        <div className="form-group" style={{ marginTop: '1rem' }}>
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
                                    <span className="status-dot" style={{ background: isGeminiConfigured() ? '#10b981' : '#ef4444' }}></span>
                                    <span>Gemini AI</span>
                                </div>
                                <div className="status-item">
                                    <span className="status-dot" style={{ background: (smsApiKey && smsSecretKey) ? '#10b981' : '#ef4444' }}></span>
                                    <span>SMS</span>
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
