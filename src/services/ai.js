// AI Service - Gemini API integration
// ============================================================
// GEMINI 2.5 MODELS - Updated Jan 2026
// Using stable GA versions (Generally Available since June 2025)
// Preview versions have expired, using production model names
// ============================================================
import { getGeminiApiKey, isGeminiConfigured } from './settings.js';

// Gemini 2.5 GA models (stable, production-ready)
const GEMINI_MODELS = [
    'gemini-2.5-flash',           // 2.5 Flash - Fast, optimized (GA June 2025)
    'gemini-2.5-pro',             // 2.5 Pro - High capability (GA June 2025)  
    'gemini-2.0-flash',           // 2.0 Flash - Fallback (GA Feb 2025)
];

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

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

            return await callGeminiAPIWithFallback(prompt);
        } catch (err) {
            console.error('Gemini API error:', err);
        }
    }

    // Fallback to template
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

            return await callGeminiAPIWithFallback(prompt);
        } catch (err) {
            console.error('Gemini API error:', err);
        }
    }

    return `Kính gửi Quý Phụ huynh,\n\nGiáo viên vừa giao bài tập môn ${subject}:\n\n📝 ${content}\n\n⏰ Hạn nộp: ${formattedDeadline}\n\nTrân trọng!`;
}

// Generate math quiz questions - ONLY Gemini API, NO mock data
export async function generateMathQuestions(grade, topic, difficulty, count) {
    if (!isGeminiConfigured()) {
        throw new Error('Vui lòng cấu hình Gemini API Key trong Cài đặt');
    }

    const prompt = `Tạo ${count} câu hỏi trắc nghiệm Toán lớp ${grade}, chủ đề: ${topic}, độ khó: ${difficulty}.

Định dạng JSON array:
[
  {
    "text": "Câu hỏi?",
    "options": ["A", "B", "C", "D"],
    "correctIndex": 0
  }
]

Chỉ trả về JSON array, không giải thích thêm.`;

    const response = await callGeminiAPIWithFallback(prompt);

    // Parse JSON response
    try {
        const cleaned = response.replace(/```json?|```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        if (!Array.isArray(parsed) || parsed.length === 0) {
            throw new Error('API không trả về câu hỏi hợp lệ');
        }

        // Validate structure
        for (const q of parsed) {
            if (!q.text || !Array.isArray(q.options) || q.options.length !== 4 || typeof q.correctIndex !== 'number') {
                throw new Error('Định dạng câu hỏi không hợp lệ');
            }
        }

        return parsed;
    } catch (err) {
        console.error('Failed to parse Gemini response:', response);
        throw new Error('Không thể phân tích câu trả lời từ Gemini API');
    }
}

// Generate quiz name/title
export async function generateQuizName(grade, topic, difficulty, questionCount) {
    if (isGeminiConfigured()) {
        try {
            const prompt = `Tạo một tên ngắn gọn, hấp dẫn cho bài kiểm tra Toán lớp ${grade}, chủ đề ${topic}, độ khó ${difficulty}, ${questionCount} câu. 
Chỉ trả về tên bài kiểm tra (tối đa 50 ký tự), không giải thích.`;

            return await callGeminiAPIWithFallback(prompt);
        } catch (err) {
            console.error('Gemini name generation error:', err);
        }
    }

    // Fallback pattern
    const difficultyMap = { easy: 'Dễ', medium: 'TB', hard: 'Khó' };
    return `${topic} (${difficultyMap[difficulty] || difficulty}) - ${questionCount} câu`;
}

// Chat with AI assistant
export async function chat(message, context = 'general') {
    if (isGeminiConfigured()) {
        try {
            const prompt = `Bạn là trợ lý AI cho giáo viên. Trả lời ngắn gọn bằng tiếng Việt.
Người dùng nói: "${message}"`;

            return await callGeminiAPIWithFallback(prompt);
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

// ============================================================
// GEMINI 2.5 API CALLER - With clear quota error handling
// ============================================================
async function callGeminiAPIWithFallback(prompt) {
    const apiKey = getGeminiApiKey();
    if (!apiKey) throw new Error('API key not configured');

    let lastError = null;
    let quotaExceeded = false;

    for (const model of GEMINI_MODELS) {
        try {
            console.log(`[Gemini 2.5] Trying model: ${model}`);
            const result = await callGeminiAPI(prompt, model);
            console.log(`[Gemini 2.5] ✓ Success with model: ${model}`);
            return result;
        } catch (err) {
            console.warn(`[Gemini 2.5] ✗ Model ${model} failed:`, err.message);
            lastError = err;

            // Check for quota exceeded
            if (err.message.includes('429')) {
                quotaExceeded = true;
            }
        }
    }

    // Provide helpful error message
    if (quotaExceeded) {
        throw new Error('⚠️ Gemini API đã hết quota. Vui lòng tạo API key mới tại aistudio.google.com hoặc chờ reset quota.');
    }

    throw lastError || new Error('Tất cả Gemini 2.5 models đều không khả dụng');
}

// Direct API call to specific model
async function callGeminiAPI(prompt, model) {
    const apiKey = getGeminiApiKey();
    const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Gemini 2.5] ${model} error:`, errorText.substring(0, 200));
        throw new Error(`${model}: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
        console.error('[Gemini 2.5] No text in response:', JSON.stringify(data).substring(0, 200));
        throw new Error('No response from Gemini');
    }

    return text;
}
