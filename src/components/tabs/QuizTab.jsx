import React, { useState, useEffect } from 'react'
import { useToast } from '../../contexts/ToastContext'
import { useDialog } from '../DialogProvider'
import { getQuizzes, saveQuiz, deleteQuiz } from '../../services/firebase'
import { generateMathQuestions, generateQuizName } from '../../services/ai'
import { isGeminiConfigured } from '../../services/settings'

const topicsByGrade = {
    '8': [
        { value: 'phuong-trinh-bac-nhat', label: 'Phương trình bậc nhất một ẩn' },
        { value: 'bat-phuong-trinh-bac-nhat', label: 'Bất phương trình bậc nhất' },
        { value: 'phan-thuc-dai-so', label: 'Phân thức đại số' },
        { value: 'hinh-thang', label: 'Hình thang - Hình bình hành' },
        { value: 'tam-giac-dong-dang', label: 'Tam giác đồng dạng' },
    ],
    '9': [
        { value: 'phuong-trinh-bac-hai', label: 'Phương trình bậc hai' },
        { value: 'he-phuong-trinh', label: 'Hệ phương trình bậc nhất' },
        { value: 'ham-so-bac-nhat', label: 'Hàm số bậc nhất y = ax + b' },
        { value: 'can-bac-hai', label: 'Căn bậc hai - Căn bậc ba' },
        { value: 'duong-tron', label: 'Đường tròn' },
    ]
}

export default function QuizTab() {
    const { showToast } = useToast()
    const { confirm } = useDialog()
    const [savedQuizzes, setSavedQuizzes] = useState([])
    const [generatedQuestions, setGeneratedQuestions] = useState([])
    const [loading, setLoading] = useState(false)
    const [config, setConfig] = useState({
        grade: '8',
        topic: 'phuong-trinh-bac-nhat',
        difficulty: 'easy',
        count: 5
    })
    const [currentQuizConfig, setCurrentQuizConfig] = useState({})

    useEffect(() => {
        loadQuizzes()
    }, [])

    const loadQuizzes = async () => {
        try {
            const data = await getQuizzes()
            setSavedQuizzes(data || [])
        } catch (err) {
            console.error('Error loading quizzes:', err)
        }
    }

    const topics = topicsByGrade[config.grade] || []
    const topicLabel = topics.find(t => t.value === config.topic)?.label || config.topic

    const handleGenerate = async () => {
        if (!isGeminiConfigured()) {
            showToast('Vui lòng cấu hình Gemini API Key trong Cài đặt', 'error')
            return
        }
        setLoading(true)
        try {
            const questions = await generateMathQuestions(config.grade, config.topic, config.difficulty, config.count)
            setGeneratedQuestions(questions)
            setCurrentQuizConfig({ grade: config.grade, topic: topicLabel, difficulty: config.difficulty })
            showToast(`Đã tạo ${questions.length} câu hỏi trắc nghiệm!`, 'success')
        } catch (err) {
            showToast('Lỗi: ' + err.message, 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (generatedQuestions.length === 0) {
            showToast('Chưa có câu hỏi để lưu', 'error')
            return
        }
        try {
            let quizName = `${currentQuizConfig.topic} - ${currentQuizConfig.difficulty}`
            try {
                quizName = await generateQuizName(currentQuizConfig.grade, currentQuizConfig.topic, currentQuizConfig.difficulty, generatedQuestions.length)
            } catch (err) {
                console.log('Using fallback quiz name')
            }

            const quizId = await saveQuiz({
                ...currentQuizConfig,
                name: quizName,
                questions: generatedQuestions,
                count: generatedQuestions.length
            })

            showToast(`Đã lưu: ${quizName}`, 'success')
            await loadQuizzes()
        } catch (err) {
            showToast('Lỗi: ' + err.message, 'error')
        }
    }

    const handleDelete = async (quiz) => {
        const confirmed = await confirm(`Xóa bài "${quiz.name || quiz.topic}"?`)
        if (!confirmed) return
        try {
            await deleteQuiz(quiz.id)
            showToast('Đã xóa bài kiểm tra', 'success')
            await loadQuizzes()
        } catch (err) {
            showToast('Lỗi: ' + err.message, 'error')
        }
    }

    const handleLoad = (quiz) => {
        if (!quiz.questions) {
            showToast('Không tìm thấy bài kiểm tra', 'error')
            return
        }
        setGeneratedQuestions(quiz.questions)
        setCurrentQuizConfig({ grade: quiz.grade, topic: quiz.topic, difficulty: quiz.difficulty })
    }

    const handleCopyLink = async (quizId) => {
        const link = `https://aisupportgv.web.app/#quiz/${quizId}`
        try {
            await navigator.clipboard.writeText(link)
            showToast('Đã copy link!', 'success')
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea')
            textArea.value = link
            document.body.appendChild(textArea)
            textArea.select()
            document.execCommand('copy')
            document.body.removeChild(textArea)
            showToast('Đã copy link!', 'success')
        }
    }

    const formatMathText = (text) => {
        if (!text) return ''
        return text.replace(/\^2/g, '²').replace(/\^3/g, '³').replace(/sqrt\(([^)]+)\)/g, '√$1').replace(/\*/g, '×').replace(/\//g, '÷')
    }

    const getDifficultyLabel = (d) => ({ easy: 'Dễ', medium: 'TB', hard: 'Khó' }[d] || d)

    return (
        <section id="tab-quiz" className="tab-content active">
            <div className="tab-header">
                <h2>Tạo Bài Trắc Nghiệm Toán</h2>
            </div>

            <div className="quiz-generator">
                <div className="quiz-top-row">
                    {/* Saved Quizzes */}
                    <div className="quiz-card">
                        <h4>📂 Bài đã lưu</h4>
                        <div className="saved-quizzes-list">
                            {savedQuizzes.length === 0 ? (
                                <span className="empty-hint">Chưa có bài lưu</span>
                            ) : (
                                [...savedQuizzes].sort((a, b) => b.createdAt - a.createdAt).map(quiz => (
                                    <div key={quiz.id} className="saved-quiz-item" onClick={() => handleLoad(quiz)} style={{ cursor: 'pointer' }}>
                                        <span className="quiz-label">
                                            {quiz.name || `K${quiz.grade} - ${quiz.topic}`}
                                        </span>
                                        <div className="quiz-item-actions">
                                            <span className={`difficulty-badge ${quiz.difficulty}`}>{getDifficultyLabel(quiz.difficulty)}</span>
                                            <button
                                                className="btn-copy-link"
                                                onClick={(e) => { e.stopPropagation(); handleCopyLink(quiz.id) }}
                                                title="Copy link"
                                            >📋</button>
                                            <button
                                                className="btn-delete-quiz"
                                                onClick={(e) => { e.stopPropagation(); handleDelete(quiz) }}
                                                title="Xóa"
                                            >🗑️</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Config */}
                    <div className="quiz-card">
                        <h4>⚙️ Cấu hình</h4>
                        <div className="quiz-config-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Khối</label>
                                    <select className="select-input" value={config.grade} onChange={e => setConfig({ ...config, grade: e.target.value, topic: topicsByGrade[e.target.value][0]?.value })}>
                                        <option value="8">Khối 8</option>
                                        <option value="9">Khối 9</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Chủ đề</label>
                                    <select className="select-input" value={config.topic} onChange={e => setConfig({ ...config, topic: e.target.value })}>
                                        {topics.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Mức độ</label>
                                    <select className="select-input" value={config.difficulty} onChange={e => setConfig({ ...config, difficulty: e.target.value })}>
                                        <option value="easy">Dễ</option>
                                        <option value="medium">Trung bình</option>
                                        <option value="hard">Khó</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Số câu</label>
                                    <input type="number" className="text-input" value={config.count} min="1" max="20" onChange={e => setConfig({ ...config, count: parseInt(e.target.value) || 5 })} />
                                </div>
                            </div>
                            <button className="btn btn-accent btn-generate" onClick={handleGenerate} disabled={loading}>
                                {loading ? <><span className="spinner"></span> Đang tạo...</> : '🤖 Tạo Câu Hỏi'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Preview */}
                <div className="quiz-preview-area">
                    <div className="quiz-preview">
                        {generatedQuestions.length === 0 ? (
                            <div className="preview-placeholder">
                                <span className="placeholder-icon">📝</span>
                                <p>Chọn cấu hình và bấm "Tạo Câu Hỏi" để xem trước danh sách câu hỏi</p>
                            </div>
                        ) : (
                            <>
                                <div className="quiz-preview-header">
                                    <h3>📝 Bài Kiểm Tra Toán - Khối {currentQuizConfig.grade}</h3>
                                    <p className="quiz-meta">
                                        <span className="quiz-topic-badge">{currentQuizConfig.topic}</span>
                                        <span>{generatedQuestions.length} câu hỏi</span>
                                        <span>⏱️ 15 phút</span>
                                    </p>
                                </div>
                                <div className="quiz-questions-list">
                                    {generatedQuestions.map((q, i) => (
                                        <div key={i} className="quiz-question">
                                            <div className="quiz-question-header">
                                                <span className="quiz-question-number">{i + 1}</span>
                                                <span className="quiz-question-text">{formatMathText(q.text)}</span>
                                            </div>
                                            <div className="quiz-options">
                                                {q.options.map((opt, j) => {
                                                    const letter = ['A', 'B', 'C', 'D'][j]
                                                    const isCorrect = j === q.correctIndex
                                                    return (
                                                        <div key={j} className={`quiz-option ${isCorrect ? 'correct' : ''}`}>
                                                            <span className="quiz-option-letter">{letter}</span>
                                                            <span>{formatMathText(opt)}</span>
                                                            {isCorrect && <span className="correct-mark">✓</span>}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="quiz-actions">
                                    <button className="btn btn-secondary" onClick={handleGenerate}>🔄 Tạo lại</button>
                                    <button className="btn btn-primary" onClick={handleSave}>💾 Lưu bài kiểm tra</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </section>
    )
}
