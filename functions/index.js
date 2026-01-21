const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');

admin.initializeApp();

// eSMS API configuration - store in Firebase environment config
// Run: firebase functions:config:set esms.apikey="YOUR_KEY" esms.secretkey="YOUR_SECRET" esms.brandname="YOUR_BRAND"
const ESMS_API_URL = 'https://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_get';

/**
 * Send SMS via eSMS API
 * Called from client with: { phone: "0901234567", message: "Hello" }
 */
exports.sendSMS = functions.https.onCall(async (data, context) => {
    const { phone, message } = data;

    if (!phone || !message) {
        throw new functions.https.HttpsError('invalid-argument', 'Phone and message are required');
    }

    // Get SMS config from Firebase
    const config = functions.config().esms || {};
    const apiKey = config.apikey;
    const secretKey = config.secretkey;
    const brandName = config.brandname || 'Baotrixemay';

    if (!apiKey || !secretKey) {
        throw new functions.https.HttpsError('failed-precondition', 'SMS API chưa được cấu hình. Liên hệ admin.');
    }

    // Format phone number
    let formattedPhone = phone.replace(/[^\d]/g, '');
    if (formattedPhone.startsWith('0')) {
        formattedPhone = '84' + formattedPhone.substring(1);
    }

    // Build API URL
    const params = new URLSearchParams({
        ApiKey: apiKey,
        SecretKey: secretKey,
        Phone: formattedPhone,
        Content: message,
        SmsType: '2',
        Brandname: brandName,
        IsUnicode: '1',
        Sandbox: '0'
    });

    try {
        const response = await fetch(`${ESMS_API_URL}?${params.toString()}`);
        const result = await response.json();

        console.log('eSMS response:', result);

        if (result.CodeResult === '100') {
            return { success: true, smsId: result.SMSID };
        } else {
            console.error('eSMS error:', result);
            throw new functions.https.HttpsError('internal', getErrorMessage(result.CodeResult));
        }
    } catch (error) {
        console.error('SMS send failed:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

/**
 * Send absence notification to parent
 */
exports.sendAbsenceNotification = functions.https.onCall(async (data, context) => {
    const { studentName, parentPhone, date, reason } = data;

    const message = `[EduAssist] Thông báo: Học sinh ${studentName} vắng mặt ngày ${date}.${reason ? ` Lý do: ${reason}` : ''} Vui lòng liên hệ giáo viên nếu cần.`;

    // Reuse sendSMS logic
    return exports.sendSMS.run({ phone: parentPhone, message }, context);
});

/**
 * Send homework reminder
 */
exports.sendHomeworkReminder = functions.https.onCall(async (data, context) => {
    const { studentName, parentPhone, subject, deadline } = data;

    const message = `[EduAssist] Nhắc bài tập: Con ${studentName} có bài ${subject} hạn nộp ${deadline}. Vui lòng đôn đốc con hoàn thành.`;

    return exports.sendSMS.run({ phone: parentPhone, message }, context);
});

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
