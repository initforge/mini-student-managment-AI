/**
 * Notification Service - EmailJS Only
 * ============================================================
 * Simple, reliable email notifications via EmailJS
 * - Free 200 emails/month
 * - No CORS issues
 * - No server-side code needed
 * - Works directly from browser
 * ============================================================
 */

let config = {
    emailjsPublicKey: null,
    emailjsServiceId: null,
    emailjsTemplateId: null,
};

// ============================================================
// INITIALIZATION
// ============================================================
export function initNotificationService() {
    try {
        const saved = localStorage.getItem('eduassist_settings');
        if (saved) {
            const settings = JSON.parse(saved);
            config.emailjsPublicKey = settings.emailjsPublicKey || null;
            config.emailjsServiceId = settings.emailjsServiceId || null;
            config.emailjsTemplateId = settings.emailjsTemplateId || null;
        }
        console.log('[Email] Service initialized', {
            configured: isEmailConfigured()
        });
    } catch (e) {
        console.error('[Email] Failed to load settings:', e);
    }
}

export function saveEmailConfig(publicKey, serviceId, templateId) {
    config.emailjsPublicKey = publicKey;
    config.emailjsServiceId = serviceId;
    config.emailjsTemplateId = templateId;
}

export function isEmailConfigured() {
    return !!(config.emailjsPublicKey && config.emailjsServiceId && config.emailjsTemplateId);
}

// ============================================================
// SEND EMAIL VIA EMAILJS
// ============================================================
export async function sendEmail(toEmail, toName, subject, message) {
    if (!isEmailConfigured()) {
        throw new Error('Email chưa được cấu hình. Vào Cài đặt → Nhập EmailJS credentials.');
    }

    if (!toEmail) {
        throw new Error('Email người nhận không được để trống');
    }

    console.log('[EmailJS] Sending email...');
    console.log('[EmailJS] To:', toEmail);
    console.log('[EmailJS] Subject:', subject);

    const templateParams = {
        to_email: toEmail,
        to_name: toName || 'Phụ huynh',
        subject: subject || 'Thông báo từ EduAssist',
        message: message,
        from_name: 'EduAssist'
    };

    try {
        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                service_id: config.emailjsServiceId,
                template_id: config.emailjsTemplateId,
                user_id: config.emailjsPublicKey,
                template_params: templateParams
            })
        });

        if (response.ok) {
            console.log('[EmailJS] ✓ Email sent successfully!');
            return {
                success: true,
                provider: 'EmailJS',
                email: toEmail
            };
        }

        const errorText = await response.text();
        console.error('[EmailJS] ✗ Failed:', errorText);
        throw new Error(`EmailJS Error: ${errorText}`);

    } catch (error) {
        console.error('[EmailJS] Request failed:', error);
        throw error;
    }
}

// ============================================================
// SIMPLIFIED SEND FUNCTION
// ============================================================
export async function sendNotification(contact, message, options = {}) {
    if (!contact.email) {
        return { success: false, error: 'Học sinh chưa có email phụ huynh' };
    }

    if (!isEmailConfigured()) {
        return { success: false, error: 'Email chưa được cấu hình' };
    }

    try {
        const result = await sendEmail(
            contact.email,
            contact.name || 'Phụ huynh',
            options.subject || 'Thông báo từ EduAssist',
            message
        );
        return { success: true, ...result };
    } catch (e) {
        console.error('[Notification] Failed:', e.message);
        return { success: false, error: e.message };
    }
}

export async function sendAbsenceNotification(student, date, message) {
    return sendNotification(
        { email: student.parentEmail, name: student.parentName },
        message,
        { subject: `Thông báo vắng mặt - ${student.name}` }
    );
}

export async function sendHomeworkReminder(student, homework, message) {
    return sendNotification(
        { email: student.parentEmail, name: student.parentName },
        message,
        { subject: `Nhắc bài tập - ${student.name}` }
    );
}

// Initialize on import
initNotificationService();
