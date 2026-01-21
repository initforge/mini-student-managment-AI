import React, { useState, useEffect, useRef } from 'react'
import { useToast } from '../contexts/ToastContext'
import { getStudents, getAttendance, getHomework, getClasses } from '../services/firebase'
import { isGeminiConfigured, getGeminiApiKey } from '../services/settings'

export default function Chatbot({ activeTab }) {
    const { showToast } = useToast()
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState([
        { type: 'bot', content: 'Xin chào! Tôi là trợ lý AI của EduAssist. Hỏi tôi bất cứ điều gì về hệ thống hoặc dữ liệu của bạn!' }
    ])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const messagesEndRef = useRef(null)

    // Parse markdown to HTML
    const parseMarkdown = (text) => {
        if (!text) return ''
        return text
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br />')
    }

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Build complete system context for AI
    const buildSystemContext = async () => {
        const today = new Date().toISOString().split('T')[0]
        const [students, attendance, homework, classes] = await Promise.all([
            getStudents(),
            getAttendance(today),
            getHomework(),
            getClasses()
        ])

        const now = new Date()

        // Student details
        const studentList = students.map(s => `${s.name} (${s.class}, Email PH: ${s.parentEmail || 'chưa có'})`).join('\n')

        // Class details
        const classDetails = classes.map(c => {
            const count = students.filter(s => s.class === c.name).length
            return `${c.name}: ${count} học sinh`
        }).join(', ')

        // Attendance today
        const presentStudents = students.filter(s => attendance[s.id] === 'present').map(s => s.name)
        const absentStudents = students.filter(s => attendance[s.id] === 'absent').map(s => `${s.name} (${s.class})`)

        // Homework details
        const homeworkList = homework.map(h => {
            const deadline = new Date(h.deadline)
            const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24))
            const status = daysLeft < 0 ? `QUÁ HẠN ${Math.abs(daysLeft)} ngày` : `còn ${daysLeft} ngày`
            return `- ${h.subject} (${h.class}): "${h.content}" [${status}]`
        }).join('\n')

        return `BẠN LÀ TRỢ LÝ AI CHO HỆ THỐNG EDUASSIST - ỨNG DỤNG QUẢN LÝ HỌC SINH.

=== MÔ TẢ HỆ THỐNG ===
EduAssist có 4 tab chính:
1. **Học Sinh**: Quản lý danh sách học sinh và lớp học
   - Thêm lớp mới: Bấm "+ Thêm Lớp"
   - Thêm học sinh: Bấm "+ Thêm Học Sinh", nhập tên, chọn lớp, nhập email phụ huynh
   - Sửa/Xóa: Hover vào học sinh, bấm icon

2. **Điểm Danh**: Điểm danh hàng ngày + tự động gửi email
   - Chọn ngày, bấm "Có mặt" hoặc "Vắng" cho từng học sinh
   - Bấm "Lưu & Gửi Thông Báo" - hệ thống tự động gửi email cho phụ huynh học sinh vắng
   - Có biểu đồ thống kê hôm nay và 7 ngày

3. **Bài Tập**: Giao bài và nhắc phụ huynh
   - Bấm "+ Giao Bài Tập", chọn môn, lớp, nhập nội dung, chọn deadline
   - Hệ thống tự động gửi email nhắc phụ huynh

4. **Trắc Nghiệm**: AI tạo quiz và share cho học sinh
   - Chọn Khối (8/9), Chủ đề, Mức độ (Dễ/TB/Khó), Số câu
   - Bấm "🤖 Tạo Câu Hỏi" - AI Gemini tạo câu hỏi tự động
   - Bấm "💾 Lưu bài kiểm tra", hover bài đã lưu, bấm 📋 copy link
   - Gửi link cho học sinh làm bài online và xem kết quả

=== DỮ LIỆU THỰC TẾ HIỆN TẠI ===
� Ngày: ${now.toLocaleDateString('vi-VN')} (${now.toLocaleTimeString('vi-VN')})

👥 HỌC SINH (${students.length} em):
${studentList || '(Chưa có học sinh)'}

🏫 LỚP HỌC: ${classDetails || '(Chưa có lớp)'}

📋 ĐIỂM DANH HÔM NAY:
- Có mặt: ${presentStudents.length} - ${presentStudents.join(', ') || '(không ai)'}
- Vắng: ${absentStudents.length} - ${absentStudents.join(', ') || '(không ai)'}
- Chưa điểm danh: ${students.length - presentStudents.length - absentStudents.length}

📚 BÀI TẬP (${homework.length} bài):
${homeworkList || '(Chưa có bài tập)'}

=== QUY TẮC TRẢ LỜI ===
- Trả lời CHÍNH XÁC dựa trên dữ liệu thực ở trên
- Nếu hỏi về học sinh/điểm danh/bài tập cụ thể, dùng dữ liệu thực
- Nếu hỏi cách sử dụng, hướng dẫn theo mô tả hệ thống
- Trả lời ngắn gọn, dễ hiểu, thân thiện
- Dùng emoji phù hợp
- Nếu câu hỏi không liên quan đến hệ thống, vẫn cố gắng trả lời hữu ích`
    }

    // Process all queries through Gemini
    const processQuery = async (query) => {
        if (!isGeminiConfigured()) {
            return `⚠️ Vui lòng cấu hình Gemini API Key trong Cài đặt để sử dụng AI.`
        }

        try {
            const systemContext = await buildSystemContext()
            const response = await callGemini(query, systemContext)
            return response
        } catch (err) {
            console.error('AI Error:', err)
            return `❌ Lỗi: ${err.message}\n\nHãy thử lại hoặc kiểm tra API Key trong Cài đặt.`
        }
    }

    // Gemini models with fallback (same as ai.js)
    const GEMINI_MODELS = [
        'gemini-2.5-flash',   // 2.5 Flash - Fast
        'gemini-2.5-pro',     // 2.5 Pro - High capability
        'gemini-2.0-flash',   // 2.0 Flash - Fallback
    ]

    const callGemini = async (message, context) => {
        const apiKey = getGeminiApiKey()
        let lastError = null

        for (const model of GEMINI_MODELS) {
            try {
                console.log(`[Chatbot] Trying model: ${model}`)
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: `${context}\n\n=== CÂU HỎI CỦA NGƯỜI DÙNG ===\n${message}` }] }],
                        generationConfig: { maxOutputTokens: 800, temperature: 0.7 }
                    })
                })

                if (!response.ok) {
                    const errorData = await response.json()
                    throw new Error(`${model}: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
                }

                const data = await response.json()
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text
                if (text) {
                    console.log(`[Chatbot] ✓ Success with model: ${model}`)
                    return text
                }
                throw new Error('No response text')
            } catch (err) {
                console.warn(`[Chatbot] ✗ Model ${model} failed:`, err.message)
                lastError = err
            }
        }

        throw lastError || new Error('Tất cả Gemini models đều không khả dụng')
    }

    const handleSend = async () => {
        if (!input.trim() || loading) return

        const userMessage = input.trim()
        setInput('')
        setMessages(prev => [...prev, { type: 'user', content: userMessage }])
        setLoading(true)

        try {
            const response = await processQuery(userMessage)
            setMessages(prev => [...prev, { type: 'bot', content: response }])
        } catch (err) {
            setMessages(prev => [...prev, { type: 'bot', content: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.' }])
        } finally {
            setLoading(false)
        }
    }

    const handleQuickAction = (action) => {
        const actions = {
            today: 'Thống kê điểm danh hôm nay?',
            homework: 'Tình trạng bài tập hiện tại?',
            overview: 'Cho tôi xem tổng quan hệ thống',
            help: 'Hướng dẫn tôi sử dụng ứng dụng này'
        }
        setInput(actions[action] || '')
    }

    return (
        <div className="chatbot-container" style={{ display: 'block' }}>
            <button className="chatbot-toggle" onClick={() => setIsOpen(!isOpen)} title="AI Assistant">
                <span className="chatbot-icon">🤖</span>
                <span className="chatbot-pulse"></span>
            </button>

            {isOpen && (
                <div className="chatbot-panel">
                    <div className="chatbot-header">
                        <div className="chatbot-title">
                            <span>🤖</span>
                            <span>AI Assistant</span>
                        </div>
                        <button className="chatbot-close" onClick={() => setIsOpen(false)}>✕</button>
                    </div>

                    <div className="chatbot-messages">
                        {messages.map((msg, i) => (
                            <div key={i} className={`message ${msg.type === 'bot' ? 'bot' : 'user'}`}>
                                {msg.type === 'bot' && <div className="message-avatar">🤖</div>}
                                <div
                                    className="message-content"
                                    dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }}
                                />
                            </div>
                        ))}
                        {loading && (
                            <div className="message bot">
                                <div className="message-avatar">🤖</div>
                                <div className="message-content">
                                    <p>Đang xử lý...</p>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="chatbot-quick-actions">
                        <button className="quick-action" onClick={() => handleQuickAction('today')}>📋 Hôm nay</button>
                        <button className="quick-action" onClick={() => handleQuickAction('homework')}>📚 Bài tập</button>
                        <button className="quick-action" onClick={() => handleQuickAction('overview')}>🏫 Tổng quan</button>
                        <button className="quick-action" onClick={() => handleQuickAction('help')}>❓ Trợ giúp</button>
                    </div>

                    <div className="chatbot-input-area">
                        <input
                            type="text"
                            placeholder="Hỏi bất cứ điều gì..."
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
