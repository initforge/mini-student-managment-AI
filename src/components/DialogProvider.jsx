import React, { useState, createContext, useContext, useCallback } from 'react'
import Modal from './Modal'

const DialogContext = createContext(null)

export function DialogProvider({ children }) {
    const [confirmState, setConfirmState] = useState({
        isOpen: false,
        message: '',
        resolve: null
    })
    const [promptState, setPromptState] = useState({
        isOpen: false,
        message: '',
        defaultValue: '',
        resolve: null
    })

    const confirm = useCallback((message) => {
        return new Promise((resolve) => {
            setConfirmState({ isOpen: true, message, resolve })
        })
    }, [])

    const prompt = useCallback((message, defaultValue = '') => {
        return new Promise((resolve) => {
            setPromptState({ isOpen: true, message, defaultValue, resolve })
        })
    }, [])

    const handleConfirmYes = () => {
        confirmState.resolve?.(true)
        setConfirmState({ isOpen: false, message: '', resolve: null })
    }

    const handleConfirmNo = () => {
        confirmState.resolve?.(false)
        setConfirmState({ isOpen: false, message: '', resolve: null })
    }

    const handlePromptSubmit = (value) => {
        promptState.resolve?.(value)
        setPromptState({ isOpen: false, message: '', defaultValue: '', resolve: null })
    }

    const handlePromptCancel = () => {
        promptState.resolve?.(null)
        setPromptState({ isOpen: false, message: '', defaultValue: '', resolve: null })
    }

    return (
        <DialogContext.Provider value={{ confirm, prompt }}>
            {children}

            {/* Confirm Modal */}
            <Modal show={confirmState.isOpen} onClose={handleConfirmNo} title="Xác nhận">
                <p style={{ marginBottom: '1.5rem', lineHeight: '1.6' }}>{confirmState.message}</p>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={handleConfirmNo}>Hủy</button>
                    <button className="btn btn-danger" onClick={handleConfirmYes}>Xác nhận</button>
                </div>
            </Modal>

            {/* Prompt Modal */}
            <PromptModal
                isOpen={promptState.isOpen}
                message={promptState.message}
                defaultValue={promptState.defaultValue}
                onSubmit={handlePromptSubmit}
                onCancel={handlePromptCancel}
            />
        </DialogContext.Provider>
    )
}

function PromptModal({ isOpen, message, defaultValue, onSubmit, onCancel }) {
    const [value, setValue] = useState(defaultValue)

    React.useEffect(() => {
        setValue(defaultValue)
    }, [defaultValue, isOpen])

    const handleSubmit = () => {
        onSubmit(value)
    }

    return (
        <Modal show={isOpen} onClose={onCancel} title="Nhập thông tin">
            <p style={{ marginBottom: '1rem' }}>{message}</p>
            <input
                type="text"
                className="input-field"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                autoFocus
                style={{ width: '100%', marginBottom: '1.5rem' }}
            />
            <div className="modal-footer">
                <button className="btn btn-secondary" onClick={onCancel}>Hủy</button>
                <button className="btn btn-primary" onClick={handleSubmit}>OK</button>
            </div>
        </Modal>
    )
}

export function useDialog() {
    const context = useContext(DialogContext)
    if (!context) {
        throw new Error('useDialog must be used within a DialogProvider')
    }
    return context
}
