// SMS Service - Uses Firebase Cloud Functions for secure API calls
import { getFunctions, httpsCallable } from 'firebase/functions';
import { showToast } from '../utils/toast.js';

let functions = null;

// Initialize Firebase Functions
export function initSmsService(app) {
    functions = getFunctions(app, 'us-central1');
}

// Check if SMS is configured (always true if using Cloud Functions)
export function isSmsConfigured() {
    return functions !== null;
}

// Legacy config functions - not needed with Cloud Functions but kept for compatibility
export function getSmsConfig() {
    return { configured: true };
}

export function saveSmsConfig() {
    // Config is now stored in Firebase Functions environment
    console.log('SMS config is managed via Firebase Functions environment');
}

// Send SMS via Cloud Function
export async function sendSMS(phone, message) {
    if (!functions) {
        throw new Error('SMS service not initialized');
    }

    try {
        const sendSMSFn = httpsCallable(functions, 'sendSMS');
        const result = await sendSMSFn({ phone, message });
        console.log('SMS sent via Cloud Function:', result.data);
        return result.data;
    } catch (error) {
        console.error('SMS Cloud Function error:', error);
        throw new Error(error.message || 'Lỗi gửi SMS');
    }
}

// Send absence notification
export async function sendAbsenceNotification(studentName, parentPhone, date, reason = '') {
    if (!functions) {
        throw new Error('SMS service not initialized');
    }

    try {
        const sendFn = httpsCallable(functions, 'sendAbsenceNotification');
        const result = await sendFn({ studentName, parentPhone, date, reason });
        return result.data;
    } catch (error) {
        console.error('Absence notification error:', error);
        throw error;
    }
}

// Send homework reminder
export async function sendHomeworkReminder(studentName, parentPhone, subject, deadline) {
    if (!functions) {
        throw new Error('SMS service not initialized');
    }

    try {
        const sendFn = httpsCallable(functions, 'sendHomeworkReminder');
        const result = await sendFn({ studentName, parentPhone, subject, deadline });
        return result.data;
    } catch (error) {
        console.error('Homework reminder error:', error);
        throw error;
    }
}

// Format phone number for display
export function formatPhoneNumber(phone) {
    if (!phone) return '';
    let cleaned = phone.replace(/[^\d]/g, '');
    if (cleaned.startsWith('84')) {
        cleaned = '0' + cleaned.substring(2);
    }
    return cleaned;
}
