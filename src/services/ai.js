// AI Service - Gemini API integration with mock fallback
import { getGeminiApiKey, isGeminiConfigured } from './settings.js';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Generate absence notice for parent notification
export async function generateAbsenceNotice(studentName, date, className) {
    const formattedDate = new Date(date).toLocaleDateString('vi-VN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    if (isGeminiConfigured()) {
        try {
            const prompt = `Viết một tin nhắn thông báo vắng mặt ngắn gọn, lịch sự cho phụ huynh.
Thông tin:
- Tên học sinh: ${studentName}
- Lớp: ${className}
- Ngày vắng: ${formattedDate}

Yêu cầu: Tin nhắn ngắn gọn, tối đa 100 từ, bằng tiếng Việt.`;

            return await callGeminiAPI(prompt);
        } catch (err) {
            console.error('Gemini API error:', err);
        }
    }

    // Fallback to mock
    return `Kính gửi Quý Phụ huynh,\n\nNhà trường xin thông báo: Em ${studentName} lớp ${className} đã vắng mặt trong buổi học ngày ${formattedDate}.\n\nKính mong Quý Phụ huynh xác nhận lý do.\n\nTrân trọng,\nNhà trường`;
}

// Generate homework reminder for parents
export async function generateHomeworkReminder(subject, content, deadline) {
    const formattedDeadline = new Date(deadline).toLocaleDateString('vi-VN', {
        weekday: 'long', day: 'numeric', month: 'long'
    });

    if (isGeminiConfigured()) {
        try {
            const prompt = `Viết tin nhắn nhắc bài tập cho phụ huynh:
- Môn: ${subject}
- Nội dung: ${content}
- Hạn nộp: ${formattedDeadline}

Yêu cầu: Ngắn gọn, lịch sự, tối đa 80 từ, tiếng Việt.`;

            return await callGeminiAPI(prompt);
        } catch (err) {
            console.error('Gemini API error:', err);
        }
    }

    return `Kính gửi Quý Phụ huynh,\n\nGiáo viên vừa giao bài tập môn ${subject}:\n\n📝 ${content}\n\n⏰ Hạn nộp: ${formattedDeadline}\n\nTrân trọng!`;
}

// Question bank for quiz generation
const questionBank = {
    'phuong-trinh-bac-nhat': [
        { text: 'Giải phương trình: 2x + 5 = 11', options: ['x = 2', 'x = 3', 'x = 4', 'x = 5'], correctIndex: 1 },
        { text: 'Tìm x biết: 3x - 7 = 8', options: ['x = 3', 'x = 4', 'x = 5', 'x = 6'], correctIndex: 2 },
        { text: 'Nghiệm của phương trình 4x = 20 là:', options: ['x = 4', 'x = 5', 'x = 6', 'x = 16'], correctIndex: 1 },
        { text: 'Giải: x/2 + 3 = 7', options: ['x = 2', 'x = 4', 'x = 8', 'x = 10'], correctIndex: 2 },
        { text: 'Tìm x: 5(x - 2) = 15', options: ['x = 3', 'x = 4', 'x = 5', 'x = 6'], correctIndex: 2 },
    ],
    'phuong-trinh-bac-hai': [
        { text: 'Số nghiệm của phương trình x² - 4 = 0 là:', options: ['0', '1', '2', '3'], correctIndex: 2 },
        { text: 'Giải phương trình x² = 9', options: ['x = 3', 'x = -3', 'x = ±3', 'x = 9'], correctIndex: 2 },
        { text: 'Tính Δ của phương trình x² - 5x + 6 = 0', options: ['Δ = 1', 'Δ = -1', 'Δ = 25', 'Δ = 0'], correctIndex: 0 },
        { text: 'Phương trình x² + 1 = 0 có bao nhiêu nghiệm thực?', options: ['0', '1', '2', 'Vô số'], correctIndex: 0 },
        { text: 'Tổng 2 nghiệm của x² - 7x + 10 = 0 là:', options: ['5', '7', '10', '-7'], correctIndex: 1 },
    ],
    'he-phuong-trinh': [
        { text: 'Hệ phương trình x + y = 5, x - y = 1 có nghiệm (x, y) là:', options: ['(2, 3)', '(3, 2)', '(4, 1)', '(1, 4)'], correctIndex: 1 },
        { text: 'Giải hệ: 2x + y = 7, x + y = 4', options: ['(3, 1)', '(2, 2)', '(1, 3)', '(4, -1)'], correctIndex: 0 },
    ],
    'duong-tron': [
        { text: 'Diện tích hình tròn bán kính r = 3 là:', options: ['6π', '9π', '12π', '3π'], correctIndex: 1 },
        { text: 'Chu vi hình tròn bán kính r là:', options: ['πr', '2πr', 'πr²', '2πr²'], correctIndex: 1 },
    ],
    'can-bac-hai': [
        { text: '√50 = ?', options: ['5√2', '2√5', '25', '10'], correctIndex: 0 },
        { text: '√12 + √27 = ?', options: ['5√3', '√39', '6√3', '7√3'], correctIndex: 0 },
    ],
};

const defaultQuestions = [
    { text: 'Tính: 15 + 27 = ?', options: ['32', '42', '52', '62'], correctIndex: 1 },
    { text: '8 × 7 = ?', options: ['54', '55', '56', '57'], correctIndex: 2 },
    { text: '100 ÷ 4 = ?', options: ['20', '25', '30', '35'], correctIndex: 1 },
];

// Generate math quiz questions
export async function generateMathQuestions(grade, topic, difficulty, count) {
    // Try Gemini API first
    if (isGeminiConfigured()) {
        try {
            const prompt = `Tạo ${count} câu hỏi trắc nghiệm Toán lớp ${grade}, chủ đề: ${topic}, độ khó: ${difficulty}.

Định dạng JSON array:
[
  {
    "text": "Câu hỏi?",
    "options": ["A", "B", "C", "D"],
    "correctIndex": 0
  }
]

Chỉ trả về JSON, không giải thích.`;

            const response = await callGeminiAPI(prompt);
            const parsed = JSON.parse(response.replace(/```json?|```/g, '').trim());
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        } catch (err) {
            console.error('Gemini quiz error:', err);
        }
    }

    // Fallback to question bank
    await new Promise(resolve => setTimeout(resolve, 1000));
    const pool = questionBank[topic] || defaultQuestions;
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const result = [];

    for (let i = 0; i < count; i++) {
        result.push(shuffled[i % shuffled.length]);
    }

    return result;
}

// Chat with AI assistant
export async function chat(message, context = 'general') {
    if (isGeminiConfigured()) {
        try {
            const prompt = `Bạn là trợ lý AI cho giáo viên. Trả lời ngắn gọn bằng tiếng Việt.
Người dùng nói: "${message}"`;

            return await callGeminiAPI(prompt);
        } catch (err) {
            console.error('Gemini chat error:', err);
        }
    }

    // Fallback responses
    const lowerMsg = message.toLowerCase();

    if (lowerMsg.includes('vắng') || lowerMsg.includes('nghỉ')) {
        return 'Tôi có thể giúp bạn soạn thông báo vắng mặt. Vui lòng cung cấp tên học sinh và ngày vắng.';
    }

    if (lowerMsg.includes('bài tập')) {
        return 'Bạn muốn giao bài tập mới? Tôi có thể giúp soạn nội dung nhắc nhở cho phụ huynh.';
    }

    if (lowerMsg.includes('trắc nghiệm') || lowerMsg.includes('quiz')) {
        return 'Tôi có thể tạo câu hỏi trắc nghiệm Toán cho khối 8-9. Hãy vào tab "Trắc Nghiệm".';
    }

    return `Tôi hiểu bạn nói: "${message}". Tôi có thể hỗ trợ soạn thông báo, nhắc bài tập hoặc tạo câu hỏi trắc nghiệm.`;
}

// Call Gemini API
async function callGeminiAPI(prompt) {
    const apiKey = getGeminiApiKey();
    if (!apiKey) throw new Error('API key not configured');

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
    });

    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}
