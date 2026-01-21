import React, { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import StudentsTab from '../components/tabs/StudentsTab'
import AttendanceTab from '../components/tabs/AttendanceTab'
import HomeworkTab from '../components/tabs/HomeworkTab'
import QuizTab from '../components/tabs/QuizTab'
import SettingsModal from '../components/SettingsModal'
import Chatbot from '../components/Chatbot'
import { initNotificationService } from '../services/notification'
import { getApp } from '../services/firebase'

const tabs = ['students', 'attendance', 'homework', 'quiz']

export default function Dashboard({ onLogout }) {
    const [activeTab, setActiveTab] = useState('students')
    const [showSettings, setShowSettings] = useState(false)

    useEffect(() => {
        // Initialize Email notification service
        try {
            initNotificationService(getApp())
        } catch (err) {
            console.warn('Email service init failed:', err)
        }

        // Handle hash routing
        const handleHash = () => {
            const hash = window.location.hash.replace('#', '')
            if (tabs.includes(hash)) {
                setActiveTab(hash)
            }
        }
        handleHash()
        window.addEventListener('hashchange', handleHash)
        return () => window.removeEventListener('hashchange', handleHash)
    }, [])

    const handleTabChange = (tab) => {
        setActiveTab(tab)
        window.location.hash = tab
    }

    return (
        <div className="app-container" style={{ display: 'flex' }}>
            <Sidebar activeTab={activeTab} onTabChange={handleTabChange} onLogout={onLogout} />

            <main className="main-content">
                <Header onOpenSettings={() => setShowSettings(true)} />

                <div className="tab-content-wrapper">
                    {activeTab === 'students' && <StudentsTab />}
                    {activeTab === 'attendance' && <AttendanceTab />}
                    {activeTab === 'homework' && <HomeworkTab />}
                    {activeTab === 'quiz' && <QuizTab />}
                </div>
            </main>

            <Chatbot activeTab={activeTab} />

            {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
        </div>
    )
}
