import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { ToastProvider } from './contexts/ToastContext'
import { DialogProvider } from './components/DialogProvider'
import './styles/main.css'
import './styles/landing.css'
import './styles/components.css'
import './styles/chatbot.css'
import './styles/quiz-player.css'


ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <HashRouter>
            <ToastProvider>
                <DialogProvider>
                    <App />
                </DialogProvider>
            </ToastProvider>
        </HashRouter>
    </React.StrictMode>
)

