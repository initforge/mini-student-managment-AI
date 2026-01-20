// Settings Service - Manages API keys and app configuration
import { showToast } from '../utils/toast.js';

const STORAGE_KEY = 'eduassist_settings';

// Default settings
let settings = {
    geminiApiKey: '',
};

// Load settings from localStorage
export function loadSettings() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            settings = { ...settings, ...JSON.parse(saved) };
        }
    } catch (err) {
        console.error('Error loading settings:', err);
    }
    return settings;
}

// Save settings to localStorage
export function saveSettings(newSettings) {
    settings = { ...settings, ...newSettings };
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        return true;
    } catch (err) {
        console.error('Error saving settings:', err);
        return false;
    }
}

// Get Gemini API key
export function getGeminiApiKey() {
    return settings.geminiApiKey;
}

// Check if Gemini is configured
export function isGeminiConfigured() {
    return settings.geminiApiKey && settings.geminiApiKey.length > 10;
}

// Initialize settings UI
export function initSettings() {
    loadSettings();
    setupEventListeners();
    updateStatusIndicators();
}

function setupEventListeners() {
    // Open settings modal
    document.getElementById('btn-settings')?.addEventListener('click', () => {
        openSettingsModal();
    });

    // Save settings
    document.getElementById('btn-save-settings')?.addEventListener('click', handleSaveSettings);

    // Close buttons for settings modal
    document.querySelectorAll('#modal-settings .modal-close, #modal-settings [data-modal]').forEach(btn => {
        btn.addEventListener('click', closeSettingsModal);
    });

    // Close on overlay click
    const overlay = document.getElementById('modal-settings');
    overlay?.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeSettingsModal();
        }
    });
}

function openSettingsModal() {
    const modal = document.getElementById('modal-settings');
    if (modal) {
        // Populate current values
        const apiKeyInput = document.getElementById('gemini-api-key');
        if (apiKeyInput && settings.geminiApiKey) {
            apiKeyInput.value = settings.geminiApiKey;
        }

        updateStatusIndicators();
        modal.classList.add('active');
    }
}

function closeSettingsModal() {
    const modal = document.getElementById('modal-settings');
    if (modal) {
        modal.classList.remove('active');
    }
}

function handleSaveSettings() {
    const apiKey = document.getElementById('gemini-api-key')?.value?.trim();

    const newSettings = {
        geminiApiKey: apiKey || '',
    };

    if (saveSettings(newSettings)) {
        showToast('Đã lưu cài đặt!', 'success');
        updateStatusIndicators();
        closeSettingsModal();
    } else {
        showToast('Lỗi khi lưu cài đặt', 'error');
    }
}

export function updateStatusIndicators() {
    // Firebase status
    const firebaseStatus = document.getElementById('status-firebase');
    if (firebaseStatus) {
        firebaseStatus.className = 'status-dot connected';
    }

    // Gemini status
    const geminiStatus = document.getElementById('status-gemini');
    if (geminiStatus) {
        if (isGeminiConfigured()) {
            geminiStatus.className = 'status-dot connected';
        } else {
            geminiStatus.className = 'status-dot disconnected';
        }
    }
}
