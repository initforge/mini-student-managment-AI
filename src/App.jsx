import React, { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false)

    const handleEnter = () => setIsLoggedIn(true)
    const handleLogout = () => setIsLoggedIn(false)

    if (!isLoggedIn) {
        return <Landing onEnter={handleEnter} />
    }

    return <Dashboard onLogout={handleLogout} />
}

export default App
