// Quiz Tab - Math quiz generation with AI and Firebase
import { showToast } from '../utils/toast.js';
import { generateMathQuestions } from '../services/ai.js';
import { saveQuiz as saveQuizToDb } from '../services/firebase.js';
import { exportQuizToPDF } from '../services/export.js';

let generatedQuestions = [];
let currentQuizConfig = {};

// Topic configurations by grade
const topicsByGrade = {
  '8': [
    { value: 'phuong-trinh-bac-nhat', label: 'Phương trình bậc nhất một ẩn' },
    { value: 'bat-phuong-trinh-bac-nhat', label: 'Bất phương trình bậc nhất' },
    { value: 'phan-thuc-dai-so', label: 'Phân thức đại số' },
    { value: 'hinh-thang', label: 'Hình thang - Hình bình hành' },
    { value: 'tam-giac-dong-dang', label: 'Tam giác đồng dạng' },
    { value: 'dinh-ly-talet', label: 'Định lý Talet' },
    { value: 'ti-le-thuc', label: 'Tỉ lệ thức và dãy tỉ số bằng nhau' },
    { value: 'so-that', label: 'Số thực - Căn bậc hai' },
  ],
  '9': [
    { value: 'phuong-trinh-bac-hai', label: 'Phương trình bậc hai' },
    { value: 'he-phuong-trinh', label: 'Hệ phương trình bậc nhất' },
    { value: 'ham-so-bac-nhat', label: 'Hàm số bậc nhất y = ax + b' },
    { value: 'ham-so-bac-hai', label: 'Hàm số y = ax² và đồ thị Parabol' },
    { value: 'can-bac-hai', label: 'Căn bậc hai - Căn bậc ba' },
    { value: 'he-thuc-luong', label: 'Hệ thức lượng trong tam giác vuông' },
    { value: 'duong-tron', label: 'Đường tròn' },
    { value: 'goc-voi-duong-tron', label: 'Góc với đường tròn' },
    { value: 'hinh-tru-non-cau', label: 'Hình trụ - Hình nón - Hình cầu' },
  ]
};

export function initQuiz() {
  setupEventListeners();
  updateTopicOptions(); // Initialize topics for default grade
}

function setupEventListeners() {
  document.getElementById('btn-generate-quiz')?.addEventListener('click', generateQuiz);

  // Update topics when grade changes
  document.getElementById('quiz-grade')?.addEventListener('change', updateTopicOptions);
}

function updateTopicOptions() {
  const gradeSelect = document.getElementById('quiz-grade');
  const topicSelect = document.getElementById('quiz-topic');

  if (!gradeSelect || !topicSelect) return;

  const grade = gradeSelect.value;
  const topics = topicsByGrade[grade] || [];

  // Clear and repopulate
  topicSelect.innerHTML = topics.map(t =>
    `<option value="${t.value}">${t.label}</option>`
  ).join('');
}

async function generateQuiz() {
  const grade = document.getElementById('quiz-grade')?.value;
  const topic = document.getElementById('quiz-topic')?.value;
  const topicLabel = document.getElementById('quiz-topic')?.selectedOptions[0]?.text || '';
  const difficulty = document.getElementById('quiz-difficulty')?.value;
  const count = parseInt(document.getElementById('quiz-count')?.value || '10');

  // Validate count
  if (count < 1 || count > 50) {
    showToast('Số câu hỏi phải từ 1 đến 50', 'error');
    return;
  }

  const btn = document.getElementById('btn-generate-quiz');
  const preview = document.getElementById('quiz-preview');

  if (!preview) return;

  // Save config for export
  currentQuizConfig = { grade, topic: topicLabel, difficulty };

  // Show loading
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Đang tạo câu hỏi...';
  preview.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
    </div>
  `;

  try {
    const questions = await generateMathQuestions(grade, topic, difficulty, count);
    generatedQuestions = questions;
    renderQuizPreview(questions, topicLabel, grade);
    showToast(`Đã tạo ${questions.length} câu hỏi trắc nghiệm!`, 'success');
  } catch (err) {
    showToast('Có lỗi khi tạo câu hỏi', 'error');
    console.error(err);
    preview.innerHTML = `
      <div class="empty-state">
        <span class="empty-state-icon">❌</span>
        <h4>Có lỗi xảy ra</h4>
        <p>Vui lòng thử lại sau</p>
      </div>
    `;
  }

  // Reset button
  btn.disabled = false;
  btn.innerHTML = '<span class="btn-icon">🤖</span><span>Tạo Câu Hỏi Bằng AI</span>';
}

function renderQuizPreview(questions, topicLabel, grade) {
  const preview = document.getElementById('quiz-preview');
  if (!preview || !questions.length) return;

  preview.innerHTML = `
    <div class="quiz-preview-header">
      <h3>📝 Bài Kiểm Tra Toán - Khối ${grade}</h3>
      <p class="quiz-meta">
        <span class="quiz-topic-badge">${topicLabel}</span>
        <span>${questions.length} câu hỏi</span>
        <span>⏱️ 15 phút</span>
      </p>
    </div>
    <div class="quiz-questions-list">
      ${questions.map((q, i) => renderQuestion(q, i + 1)).join('')}
    </div>
    <div class="quiz-actions">
      <button class="btn btn-secondary" onclick="regenerateQuiz()">🔄 Tạo lại</button>
      <button class="btn btn-accent" onclick="exportQuizPDF()">📄 Xuất PDF</button>
      <button class="btn btn-primary" onclick="saveQuiz()">💾 Lưu bài kiểm tra</button>
    </div>
  `;
}

function renderQuestion(question, number) {
  return `
    <div class="quiz-question">
      <div class="quiz-question-header">
        <span class="quiz-question-number">${number}</span>
        <span class="quiz-question-text">${question.text}</span>
      </div>
      <div class="quiz-options">
        ${question.options.map((opt, i) => {
    const letter = ['A', 'B', 'C', 'D'][i];
    const isCorrect = i === question.correctIndex;
    return `
            <div class="quiz-option ${isCorrect ? 'correct' : ''}">
              <span class="quiz-option-letter">${letter}</span>
              <span>${opt}</span>
              ${isCorrect ? '<span class="correct-mark">✓</span>' : ''}
            </div>
          `;
  }).join('')}
      </div>
    </div>
  `;
}

window.regenerateQuiz = function () {
  document.getElementById('btn-generate-quiz')?.click();
};

window.exportQuizPDF = function () {
  if (generatedQuestions.length === 0) {
    showToast('Chưa có câu hỏi để xuất', 'error');
    return;
  }

  try {
    const filename = exportQuizToPDF(currentQuizConfig, generatedQuestions);
    showToast(`Đã xuất file ${filename}`, 'success');
  } catch (err) {
    console.error('Export error:', err);
    showToast('Lỗi khi xuất PDF', 'error');
  }
};

window.saveQuiz = async function () {
  if (generatedQuestions.length === 0) {
    showToast('Chưa có câu hỏi để lưu', 'error');
    return;
  }

  try {
    await saveQuizToDb({
      ...currentQuizConfig,
      questions: generatedQuestions,
      count: generatedQuestions.length
    });
    showToast(`Đã lưu bài kiểm tra với ${generatedQuestions.length} câu hỏi!`, 'success');
  } catch (err) {
    console.error('Save error:', err);
    showToast('Lỗi khi lưu bài kiểm tra', 'error');
  }
};

export function getGeneratedQuestions() {
  return generatedQuestions;
}
