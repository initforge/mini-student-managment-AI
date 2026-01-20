// Notification Service - Mock Zalo OA integration
// Replace with actual Zalo API in production

const MOCK_DELAY = 500;

export async function sendZaloNotification(zaloUserId, message) {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));

    console.log(`📤 [MOCK Zalo OA] Sending to ${zaloUserId}:`);
    console.log(message);
    console.log('---');

    // Mock success response
    return {
        success: true,
        messageId: `msg_${Date.now()}`,
        recipientId: zaloUserId
    };
}

export async function getZaloUserInfo(zaloUserId) {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));

    return {
        id: zaloUserId,
        name: 'Phụ huynh',
        avatar: null
    };
}
