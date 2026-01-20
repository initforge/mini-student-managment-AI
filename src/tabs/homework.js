// Homework Tab - Assignment management
import { openModal, closeModal } from '../utils/modal.js';
import { showToast } from '../utils/toast.js';
import { sendZaloNotification } from '../services/notification.js';
import { generateHomeworkReminder } from '../services/ai.js';
import { getStudentsByClass } from './students.js';

// Mock homework data
let homeworkList = [
    {
        id: 1, subject: 'Toán', class: '9A',
        content: 'Làm bài tập 1-10 trang 45 SGK Toán 9',
        deadline: '2026-01-22', createdAt: '2026-01-19', notified: true
    },
    {
        id: 2, subject: 'Ngữ Văn', class: '8A',
        content: 'Soạn bài "Lão Hạc" - trả lời câu hỏi 1,2,3',
        deadline: '2026-01-21', createdAt: '2026-01-18', notified: true
    },
];

export function initHomework() {
    renderHomeworkList();
    setupEventListeners();
    setDefaultDeadline();
}

function setupEventListeners() {
    document.getElementById('btn-add-homework')?.addEventListener('click', () => {
        openModal('modal-add-homework');
    });

    document.getElementById('btn-save-homework')?.addEventListener('click', saveHomework);
}

function setDefaultDeadline() {
    const deadlineInput = document.getElementById('homework-deadline');
    if (deadlineInput) {
        // Default to 3 days from now
        const date = new Date();
        date.setDate(date.getDate() + 3);
        deadlineInput.value = date.toISOString().split('T')[0];
    }
}

function renderHomeworkList() {
    const container = document.getElementById('homework-list');
    if (!container) return;

    if (homeworkList.length === 0) {
        container.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <span class="empty-state-icon">📚</span>
        <h4>Chưa có bài tập nào</h4>
        <p>Bấm "Giao Bài Tập Mới" để bắt đầu</p>
      </div>
    `;
        return;
    }

    // Sort by deadline
    const sorted = [...homeworkList].sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

    container.innerHTML = sorted.map(hw => {
        const deadline = new Date(hw.deadline);
        const today = new Date();
        const daysLeft = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
        const isOverdue = daysLeft < 0;
        const isUrgent = daysLeft <= 1 && !isOverdue;

        return `
      <div class="homework-card">
        <div class="homework-header">
          <span class="homework-subject">📖 ${hw.subject}</span>
          <span class="homework-class">Lớp ${hw.class}</span>
        </div>
        <div class="homework-content">${hw.content}</div>
        <div class="homework-footer">
          <div class="homework-deadline ${isOverdue ? 'overdue' : ''} ${isUrgent ? 'urgent' : ''}">
            <span>📅</span>
            <span>${isOverdue ? 'Quá hạn' : `Còn ${daysLeft} ngày`}</span>
            <span style="color: var(--color-gray-400);">(${formatDate(hw.deadline)})</span>
          </div>
          <span class="homework-status ${hw.notified ? 'sent' : 'pending'}">
            ${hw.notified ? '✅ Đã thông báo' : '⏳ Chờ gửi'}
          </span>
        </div>
      </div>
    `;
    }).join('');
}

async function saveHomework() {
    const subject = document.getElementById('homework-subject')?.value;
    const hwClass = document.getElementById('homework-class')?.value;
    const content = document.getElementById('homework-content')?.value?.trim();
    const deadline = document.getElementById('homework-deadline')?.value;

    if (!subject || !hwClass || !content || !deadline) {
        showToast('Vui lòng điền đầy đủ thông tin', 'error');
        return;
    }

    const newHomework = {
        id: Date.now(),
        subject, class: hwClass, content, deadline,
        createdAt: new Date().toISOString().split('T')[0],
        notified: false
    };

    homeworkList.push(newHomework);
    closeModal('modal-add-homework');
    document.getElementById('form-add-homework')?.reset();
    setDefaultDeadline();

    showToast('Đang gửi thông báo cho phụ huynh...', 'info');

    // Send notifications to parents
    const students = getStudentsByClass(hwClass);

    try {
        const message = await generateHomeworkReminder(subject, content, deadline);

        for (const student of students) {
            if (student.zaloId) {
                await sendZaloNotification(student.zaloId, message);
            }
        }

        newHomework.notified = true;
        showToast(`Đã thông báo bài tập ${subject} cho ${students.length} phụ huynh!`, 'success');
    } catch (err) {
        showToast('Có lỗi khi gửi thông báo', 'error');
        console.error(err);
    }

    renderHomeworkList();
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
}

export function getHomeworkList() {
    return homeworkList;
}
