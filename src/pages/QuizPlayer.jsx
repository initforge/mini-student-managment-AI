import React, { useState, useEffect } from 'react'
import { getDatabase, ref, get } from 'firebase/database'
import { initializeApp } from 'firebase/app'

// Firebase config (same as main app)
const firebaseConfig = {
    apiKey: "AIzaSyAdZ6TrhlQ656ydInUNxtuwhodO9bg9oow",
    authDomain: "aisupportgv.firebaseapp.com",
    databaseURL: "https://aisupportgv-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "aisupportgv",
    storageBucket: "aisupportgv.firebasestorage.app",
    messagingSenderId: "981039830132",
    appId: "1:981039830132:web:3fd32a3f193182c7be6d21"
}

const app = initializeApp(firebaseConfig, 'quiz-player')
const database = getDatabase(app)

export default function QuizPlayer({ quizId, onBack }) {
    const [quiz, setQuiz] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [answers, setAnswers] = useState({})
    const [submitted, setSubmitted] = useState(false)
    const [score, setScore] = useState(0)
    const [studentName, setStudentName] = useState('')
    const [started, setStarted] = useState(false)

    useEffect(() => {
        loadQuiz()
    }, [quizId])

    const loadQuiz = async () => {
        try {
            const snapshot = await get(ref(database, `quizzes/${quizId}`))
            if (snapshot.exists()) {
                setQuiz(snapshot.val())
            } else {
                setError('Không tìm thấy bài kiểm tra')
            }
        } catch (err) {
            setError('Lỗi tải bài kiểm tra: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleAnswer = (questionIndex, optionIndex) => {
        if (submitted) return
        setAnswers(prev => ({ ...prev, [questionIndex]: optionIndex }))
    }

    const handleSubmit = () => {
        if (!quiz?.questions) return

        let correct = 0
        quiz.questions.forEach((q, i) => {
            if (answers[i] === q.correctIndex) {
                correct++
            }
        })
        setScore(correct)
        setSubmitted(true)
    }

    const handleRetry = () => {
        setAnswers({})
        setSubmitted(false)
        setScore(0)
    }

    const formatMathText = (text) => {
        if (!text) return ''
        return text
            .replace(/\^2/g, '²')
            .replace(/\^3/g, '³')
            .replace(/sqrt\(([^)]+)\)/g, '√$1')
            .replace(/\*/g, '×')
            .replace(/\//g, '÷')
    }

    if (loading) {
        return (
            <div className="quiz-player-container">
                <div className="quiz-player-loading">
                    <div className="spinner-large"></div>
                    <p>Đang tải bài kiểm tra...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="quiz-player-container">
                <div className="quiz-player-error">
                    <span className="error-icon">❌</span>
                    <h2>Lỗi</h2>
                    <p>{error}</p>
                    <button className="btn btn-primary" onClick={onBack}>← Quay lại</button>
                </div>
            </div>
        )
    }

    if (!started) {
        return (
            <div className="quiz-player-container">
                <div className="quiz-player-intro">
                    <div className="intro-header">
                        <span className="intro-icon">📝</span>
                        <h1>{quiz?.name || 'Bài Kiểm Tra'}</h1>
                    </div>
                    <div className="intro-meta">
                        <span className="meta-item">📚 Khối {quiz?.grade}</span>
                        <span className="meta-item">📖 {quiz?.topic}</span>
                        <span className="meta-item">❓ {quiz?.questions?.length || 0} câu hỏi</span>
                    </div>
                    <div className="intro-form">
                        <label>Họ và tên:</label>
                        <input
                            type="text"
                            placeholder="Nhập họ tên của bạn..."
                            value={studentName}
                            onChange={e => setStudentName(e.target.value)}
                            className="input-name"
                        />
                    </div>
                    <button
                        className="btn btn-primary btn-start"
                        onClick={() => setStarted(true)}
                        disabled={!studentName.trim()}
                    >
                        🚀 Bắt Đầu Làm Bài
                    </button>
                    <p className="intro-note">
                        Lưu ý: Chọn đáp án cho từng câu hỏi, sau đó nộp bài để xem kết quả.
                    </p>
                </div>
            </div>
        )
    }

    if (submitted) {
        const total = quiz?.questions?.length || 0
        const percentage = total > 0 ? Math.round((score / total) * 100) : 0
        const isPassed = percentage >= 50

        return (
            <div className="quiz-player-container">
                <div className="quiz-player-result">
                    <div className={`result-header ${isPassed ? 'passed' : 'failed'}`}>
                        <span className="result-icon">{isPassed ? '🎉' : '😔'}</span>
                        <h1>{isPassed ? 'Chúc mừng!' : 'Cố gắng hơn nhé!'}</h1>
                    </div>
                    <div className="result-stats">
                        <div className="result-score">
                            <span className="score-number">{score}</span>
                            <span className="score-divider">/</span>
                            <span className="score-total">{total}</span>
                        </div>
                        <div className={`result-percentage ${isPassed ? 'passed' : 'failed'}`}>
                            {percentage}%
                        </div>
                    </div>
                    <p className="result-name">Học sinh: <strong>{studentName}</strong></p>

                    <div className="result-review">
                        <h3>📋 Chi tiết đáp án:</h3>
                        {quiz.questions.map((q, i) => {
                            const isCorrect = answers[i] === q.correctIndex
                            return (
                                <div key={i} className={`review-item ${isCorrect ? 'correct' : 'wrong'}`}>
                                    <div className="review-header">
                                        <span className={`review-status ${isCorrect ? 'correct' : 'wrong'}`}>
                                            {isCorrect ? '✓' : '✗'}
                                        </span>
                                        <span className="review-question">Câu {i + 1}: {formatMathText(q.text)}</span>
                                    </div>
                                    <div className="review-answers">
                                        <p>
                                            <span className="label">Bạn chọn:</span>
                                            <span className={answers[i] !== undefined ? (isCorrect ? 'correct' : 'wrong') : 'skipped'}>
                                                {answers[i] !== undefined ? ['A', 'B', 'C', 'D'][answers[i]] + '. ' + formatMathText(q.options[answers[i]]) : '(Chưa chọn)'}
                                            </span>
                                        </p>
                                        {!isCorrect && (
                                            <p>
                                                <span className="label">Đáp án đúng:</span>
                                                <span className="correct">
                                                    {['A', 'B', 'C', 'D'][q.correctIndex]}. {formatMathText(q.options[q.correctIndex])}
                                                </span>
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <div className="result-actions">
                        <button className="btn btn-secondary" onClick={handleRetry}>🔄 Làm lại</button>
                        <button className="btn btn-primary" onClick={onBack}>← Quay lại</button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="quiz-player-container">
            <div className="quiz-player-main">
                <div className="quiz-player-header">
                    <h1>{quiz?.name || 'Bài Kiểm Tra'}</h1>
                    <div className="quiz-progress">
                        <span>{Object.keys(answers).length} / {quiz?.questions?.length || 0} câu đã trả lời</span>
                    </div>
                </div>

                <div className="quiz-questions">
                    {quiz?.questions?.map((q, i) => (
                        <div key={i} className={`quiz-question-card ${answers[i] !== undefined ? 'answered' : ''}`}>
                            <div className="question-header">
                                <span className="question-number">Câu {i + 1}</span>
                            </div>
                            <p className="question-text">{formatMathText(q.text)}</p>
                            <div className="question-options">
                                {q.options.map((opt, j) => (
                                    <button
                                        key={j}
                                        className={`option-btn ${answers[i] === j ? 'selected' : ''}`}
                                        onClick={() => handleAnswer(i, j)}
                                    >
                                        <span className="option-letter">{['A', 'B', 'C', 'D'][j]}</span>
                                        <span className="option-text">{formatMathText(opt)}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="quiz-player-footer">
                    <button className="btn btn-secondary" onClick={onBack}>
                        ← Thoát
                    </button>
                    <button
                        className="btn btn-primary btn-submit"
                        onClick={handleSubmit}
                        disabled={Object.keys(answers).length === 0}
                    >
                        ✅ Nộp Bài
                    </button>
                </div>
            </div>
        </div>
    )
}
