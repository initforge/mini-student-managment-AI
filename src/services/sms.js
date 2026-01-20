// SMS Service - eSMS.vn API Integration
// Docs: https://esms.vn/

const ESMS_API_URL = 'https://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_get';

// Get SMS config from localStorage
function getSmsConfig() {
    const config = localStorage.getItem('eduassist_sms_config');
    return config ? JSON.parse(config) : null;
}

// Save SMS config
export function saveSmsConfig(apiKey, secretKey, brandName = '') {
    const config = { apiKey, secretKey, brandName };
    localStorage.setItem('eduassist_sms_config', JSON.stringify(config));
    return true;
}

// Check if SMS is configured
export function isSmsConfigured() {
    const config = getSmsConfig();
    return config && config.apiKey && config.secretKey;
}

// Format phone number to Vietnam format
function formatPhoneNumber(phone) {
    let cleaned = phone.replace(/\D/g, '');

    // Convert 0xxx to 84xxx
    if (cleaned.startsWith('0')) {
        cleaned = '84' + cleaned.substring(1);
    }

    // Add 84 if not present
    if (!cleaned.startsWith('84')) {
        cleaned = '84' + cleaned;
    }

    return cleaned;
}

// Send SMS via eSMS API
export async function sendSMS(phone, message) {
    const config = getSmsConfig();

    if (!config) {
        throw new Error('SMS chưa được cấu hình. Vui lòng thêm API Key trong Cài đặt.');
    }

    const formattedPhone = formatPhoneNumber(phone);

    // eSMS API parameters
    const params = new URLSearchParams({
        ApiKey: config.apiKey,
        SecretKey: config.secretKey,
        Phone: formattedPhone,
        Content: message,
        SmsType: config.brandName ? '2' : '4', // 2 = Brandname, 4 = Đầu số cố định
        Brandname: config.brandName || '',
        IsUnicode: '1', // Support Vietnamese
        Sandbox: '0', // 0 = production, 1 = test
    });

    try {
        const response = await fetch(`${ESMS_API_URL}?${params.toString()}`);
        const data = await response.json();

        if (data.CodeResult === '100') {
            console.log('SMS sent successfully:', data);
            return { success: true, smsId: data.SMSID };
        } else {
            console.error('SMS error:', data);
            throw new Error(getErrorMessage(data.CodeResult));
        }
    } catch (error) {
        console.error('Failed to send SMS:', error);
        throw error;
    }
}

// Send SMS to multiple recipients
export async function sendBulkSMS(phones, message) {
    const results = [];

    for (const phone of phones) {
        try {
            const result = await sendSMS(phone, message);
            results.push({ phone, success: true, ...result });
        } catch (error) {
            results.push({ phone, success: false, error: error.message });
        }
    }

    return results;
}

// Send absence notification
export async function sendAbsenceNotification(studentName, parentPhone, date, reason = '') {
    const message = `[EduAssist] Thông báo: Học sinh ${studentName} vắng mặt ngày ${date}.${reason ? ` Lý do: ${reason}` : ''} Vui lòng liên hệ giáo viên nếu cần.`;

    return sendSMS(parentPhone, message);
}

// Send homework reminder
export async function sendHomeworkReminder(studentName, parentPhone, subject, deadline) {
    const message = `[EduAssist] Nhắc nhở: ${studentName} có bài tập môn ${subject}, hạn nộp: ${deadline}. Vui lòng nhắc con hoàn thành.`;

    return sendSMS(parentPhone, message);
}

// Send custom notification
export async function sendCustomNotification(parentPhone, content) {
    const message = `[EduAssist] ${content}`;
    return sendSMS(parentPhone, message);
}

// Error code mapping
function getErrorMessage(code) {
    const errors = {
        '99': 'Lỗi không xác định',
        '100': 'Gửi thành công',
        '101': 'Sai thông tin xác thực',
        '102': 'Tài khoản bị khóa',
        '103': 'Số dư không đủ',
        '104': 'Brandname không tồn tại',
        '118': 'Số điện thoại sai định dạng',
        '119': 'Nội dung có ký tự không hợp lệ',
    };
    return errors[code] || `Lỗi: ${code}`;
}

// Check account balance
export async function checkBalance() {
    const config = getSmsConfig();
    if (!config) return null;

    const url = `https://rest.esms.vn/MainService.svc/json/GetBalance/${config.apiKey}/${config.secretKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.Balance || 0;
    } catch (error) {
        console.error('Failed to check balance:', error);
        return null;
    }
}
