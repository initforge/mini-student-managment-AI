import React, { useState } from 'react'
import { useToast } from '../contexts/ToastContext'
import { chat } from '../services/ai'

const tabLabels = {
    students: 'Học Sinh',
    attendance: 'Điểm Danh',
    homework: 'Bài Tập',
    quiz: 'Trắc Nghiệm'
}

export default function Chatbot({ activeTab }) {
    const { showToast } = useToast()
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState([
        { type: 'bot', content: 'Xin chào! Tôi là trợ lý AI của bạn. Tôi có thể giúp bạn soạn thông báo, nhắc bài tập hoặc tạo câu hỏi trắc nghiệm.' }
    ])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSend = async () => {
        if (!input.trim() || loading) return

        const userMessage = input.trim()
        setInput('')
        setMessages(prev => [...prev, { type: 'user', content: userMessage }])
        setLoading(true)

        try {
            const response = await chat(userMessage, activeTab)
            setMessages(prev => [...prev, { type: 'bot', content: response }])
        } catch (err) {
            setMessages(prev => [...prev, { type: 'bot', content: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.' }])
        } finally {
            setLoading(false)
        }
    }

    const handleQuickAction = (action) => {
        const actions = {
            absence: 'Giúp tôi soạn thông báo vắng học sinh',
            homework: 'Giúp tôi nhắc phụ huynh về bài tập',
            quiz: 'Giúp tôi tạo câu hỏi trắc nghiệm Toán'
        }
        setInput(actions[action] || '')
    }

    return (
        <div className="chatbot-container" style={{ display: 'block' }}>
            <button className="chatbot-toggle" onClick={() => setIsOpen(!isOpen)} title="Trợ lý AI">
                <span className="chatbot-icon">🤖</span>
                <span className="chatbot-pulse"></span>
            </button>

            {isOpen && (
                <div className="chatbot-panel">
                    <div className="chatbot-header">
                        <div className="chatbot-title">
                            <span>🤖</span>
                            <span>Trợ Lý AI</span>
                        </div>
                        <button className="chatbot-close" onClick={() => setIsOpen(false)}>✕</button>
                    </div>

                    <div className="chatbot-context">
                        <span className="context-badge">📋 Đang xem: {tabLabels[activeTab] || 'Dashboard'}</span>
                    </div>

                    <div className="chatbot-messages">
                        {messages.map((msg, i) => (
                            <div key={i} className={`message ${msg.type === 'bot' ? 'bot' : 'user'}`}>
                                {msg.type === 'bot' && <div className="message-avatar">🤖</div>}
                                <div className="message-content">
                                    <p>{msg.content}</p>
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="message bot">
                                <div className="message-avatar">🤖</div>
                                <div className="message-content">
                                    <p>Đang suy nghĩ...</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="chatbot-quick-actions">
                        <button className="quick-action" onClick={() => handleQuickAction('absence')}>📢 Thông báo vắng</button>
                        <button className="quick-action" onClick={() => handleQuickAction('homework')}>📝 Nhắc bài tập</button>
                        <button className="quick-action" onClick={() => handleQuickAction('quiz')}>✏️ Tạo câu hỏi</button>
                    </div>

                    <div className="chatbot-input-area">
                        <input
                            type="text"
                            placeholder="Nhập tin nhắn..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && handleSend()}
                        />
                        <button className="btn-send" onClick={handleSend} disabled={loading}>
                            <span>📤</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
