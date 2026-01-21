import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import QuizPlayer from './pages/QuizPlayer'

function App() {
    // Persist login state in localStorage
    const [isLoggedIn, setIsLoggedIn] = useState(() => {
        return localStorage.getItem('eduassist_logged_in') === 'true'
    })

    // Check for quiz route in hash
    const [quizId, setQuizId] = useState(null)

    useEffect(() => {
        const checkQuizRoute = () => {
            const hash = window.location.hash
            const quizMatch = hash.match(/^#quiz\/(.+)$/)
            if (quizMatch) {
                setQuizId(quizMatch[1])
            } else {
                setQuizId(null)
            }
        }

        checkQuizRoute()
        window.addEventListener('hashchange', checkQuizRoute)
        return () => window.removeEventListener('hashchange', checkQuizRoute)
    }, [])

    const handleEnter = () => {
        setIsLoggedIn(true)
        localStorage.setItem('eduassist_logged_in', 'true')
    }

    const handleLogout = () => {
        setIsLoggedIn(false)
        localStorage.removeItem('eduassist_logged_in')
    }

    const handleBackFromQuiz = () => {
        window.location.hash = ''
        setQuizId(null)
    }

    // If quiz route is detected, show QuizPlayer (public, no login required)
    if (quizId) {
        return <QuizPlayer quizId={quizId} onBack={handleBackFromQuiz} />
    }

    if (!isLoggedIn) {
        return <Landing onEnter={handleEnter} />
    }

    return <Dashboard onLogout={handleLogout} />
}

export default App


