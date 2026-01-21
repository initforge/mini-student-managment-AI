// SMS Service - Uses Firebase Cloud Functions or direct API call
import { getFunctions, httpsCallable } from 'firebase/functions';

let functions = null;
let localConfig = null;

// Initialize Firebase Functions
export function initSmsService(app) {
    try {
        functions = getFunctions(app, 'us-central1');
    } catch (err) {
        console.warn('Firebase Functions not available, using direct API mode');
    }
    // Load local SMS config from settings
    loadLocalConfig();
}

// Load SMS config from localStorage (for direct API mode)
function loadLocalConfig() {
    try {
        const saved = localStorage.getItem('eduassist_settings');
        if (saved) {
            const settings = JSON.parse(saved);
            if (settings.smsApiKey && settings.smsSecretKey) {
                localConfig = {
                    apiKey: settings.smsApiKey,
                    secretKey: settings.smsSecretKey,
                    brandName: settings.smsBrandName || 'Baotrixemay'
                };
            }
        }
    } catch (err) {
        console.error('Error loading SMS config:', err);
    }
}

// Check if SMS is configured
export function isSmsConfigured() {
    loadLocalConfig(); // Refresh config
    return localConfig !== null && localConfig.apiKey && localConfig.secretKey;
}

// Save SMS config (for compatibility with settings.js)
export function saveSmsConfig(apiKey, secretKey, brandName) {
    if (apiKey && secretKey) {
        localConfig = {
            apiKey: apiKey,
            secretKey: secretKey,
            brandName: brandName || 'Baotrixemay'
        };
    } else {
        localConfig = null;
    }
}

// Legacy config getter
export function getSmsConfig() {
    return localConfig ? { configured: true } : { configured: false };
}

// Format phone number for eSMS API (84xxxxxxxxx)
function formatPhoneForApi(phone) {
    let formatted = phone.replace(/[^\d]/g, '');
    if (formatted.startsWith('0')) {
        formatted = '84' + formatted.substring(1);
    }
    return formatted;
}

// Send SMS via direct API call (client-side)
async function sendSMSDirectApi(phone, message) {
    if (!localConfig) {
        throw new Error('SMS chưa được cấu hình. Vào Cài đặt để nhập API Key.');
    }

    const formattedPhone = formatPhoneForApi(phone);

    // eSMS API endpoint
    const params = new URLSearchParams({
        ApiKey: localConfig.apiKey,
        SecretKey: localConfig.secretKey,
        Phone: formattedPhone,
        Content: message,
        SmsType: '2',
        Brandname: localConfig.brandName,
        IsUnicode: '1',
        Sandbox: '0'
    });

    const apiUrl = 'https://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_get';

    try {
        console.log('Sending SMS to:', formattedPhone);

        // Use JSONP approach via script tag (eSMS supports JSONP)
        const response = await fetchWithCorsWorkaround(`${apiUrl}?${params.toString()}`);

        console.log('eSMS response:', response);

        if (response.CodeResult === '100') {
            return { success: true, smsId: response.SMSID };
        } else {
            const errorMsg = getErrorMessage(response.CodeResult);
            throw new Error(errorMsg);
        }
    } catch (error) {
        console.error('SMS send failed:', error);
        throw error;
    }
}

// Fetch with CORS workaround using image/script approach
async function fetchWithCorsWorkaround(url) {
    // Try direct fetch first (if CORS is allowed)
    try {
        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors'
        });
        if (response.ok) {
            return await response.json();
        }
    } catch (corsError) {
        console.warn('Direct fetch failed (CORS), trying alternative...');
    }

    // Try using allorigins.win as CORS proxy
    try {
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        if (response.ok) {
            const data = await response.json();
            return JSON.parse(data.contents);
        }
    } catch (proxyError) {
        console.warn('Proxy fetch also failed:', proxyError);
    }

    // Last resort: Try another CORS proxy
    try {
        const proxyUrl2 = `https://corsproxy.io/?${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl2);
        if (response.ok) {
            return await response.json();
        }
    } catch (proxy2Error) {
        console.warn('Secondary proxy also failed:', proxy2Error);
    }

    throw new Error('Không thể kết nối tới API SMS. Vui lòng kiểm tra kết nối mạng.');
}

// Send SMS - try Cloud Functions first, fall back to direct API
export async function sendSMS(phone, message) {
    // Try Cloud Functions first
    if (functions) {
        try {
            const sendSMSFn = httpsCallable(functions, 'sendSMS');
            const result = await sendSMSFn({ phone, message });
            console.log('SMS sent via Cloud Function:', result.data);
            return result.data;
        } catch (error) {
            console.warn('Cloud Function failed, trying direct API:', error.message);
            // Fall through to direct API
        }
    }

    // Fall back to direct API
    return await sendSMSDirectApi(phone, message);
}

// Send absence notification
export async function sendAbsenceNotification(studentName, parentPhone, date, reason = '') {
    const message = `[EduAssist] Thông báo: Học sinh ${studentName} vắng mặt ngày ${date}.${reason ? ` Lý do: ${reason}` : ''} Vui lòng liên hệ giáo viên nếu cần.`;
    return await sendSMS(parentPhone, message);
}

// Send homework reminder
export async function sendHomeworkReminder(studentName, parentPhone, subject, deadline) {
    const message = `[EduAssist] Nhắc bài tập: Con ${studentName} có bài ${subject} hạn nộp ${deadline}. Vui lòng đôn đốc con hoàn thành.`;
    return await sendSMS(parentPhone, message);
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

// Get error message from eSMS code
function getErrorMessage(code) {
    const errors = {
        '99': 'Lỗi không xác định',
        '100': 'Gửi thành công',
        '101': 'Sai API Key hoặc Secret Key',
        '102': 'Sai tài khoản/mật khẩu',
        '103': 'Tài khoản đã bị khóa',
        '104': 'Brandname không tồn tại',
        '118': 'Số dư không đủ',
        '119': 'Số điện thoại không hợp lệ'
    };
    return errors[code] || `Lỗi không xác định (${code})`;
}
