import React, { useState, useEffect } from 'react'
import { useToast } from '../contexts/ToastContext'
import { getGeminiApiKey, saveGeminiApiKey, isGeminiConfigured } from '../services/settings'
import { isSmsConfigured } from '../services/sms'

export default function SettingsModal({ onClose }) {
    const { showToast } = useToast()
    const [geminiKey, setGeminiKey] = useState('')

    useEffect(() => {
        setGeminiKey(getGeminiApiKey() || '')
    }, [])

    const handleSave = () => {
        saveGeminiApiKey(geminiKey)
        showToast('Đã lưu cài đặt', 'success')
        onClose()
    }

    return (
        <div className="modal-overlay" style={{ display: 'flex' }} onClick={onClose}>
            <div className="modal modal-settings" onClick={e => e.stopPropagation()}>
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
                <div className="modal-body">
                    <form id="form-settings">
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

                        <div className="form-group">
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
                                    <span className="status-dot" style={{ background: isSmsConfigured() ? '#10b981' : '#ef4444' }}></span>
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
