// Homework Tab - Assignment management with Firebase and SMS
import { openModal, closeModal } from '../utils/modal.js';
import { showToast } from '../utils/toast.js';
import { sendHomeworkReminder, isSmsConfigured } from '../services/sms.js';
import { getStudentsByClass } from './students.js';
import {
    getHomework as fetchHomework,
    addHomework as addHomeworkToDb,
    deleteHomework as deleteHomeworkFromDb
} from '../services/firebase.js';

// Homework data from Firebase
let homeworkList = [];

export function initHomework() {
    loadHomework();
    setupEventListeners();
    setDefaultDeadline();
}

async function loadHomework() {
    try {
        homeworkList = await fetchHomework();
        renderHomeworkList();
    } catch (err) {
        console.error('Error loading homework:', err);
        homeworkList = [];
        renderHomeworkList();
    }
}

function setupEventListeners() {
    document.getElementById('btn-add-homework')?.addEventListener('click', () => {
        document.getElementById('form-add-homework')?.reset();
        setDefaultDeadline();
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
      <div class="homework-card" data-id="${hw.id}">
        <div class="homework-header">
          <span class="homework-subject">📖 ${hw.subject}</span>
          <span class="homework-class">Lớp ${hw.class}</span>
          <button class="btn-icon-sm delete" onclick="deleteHomework('${hw.id}')" title="Xóa">🗑️</button>
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

    const btn = document.getElementById('btn-save-homework');
    btn.disabled = true;
    btn.textContent = 'Đang lưu...';

    try {
        const newHomework = {
            subject,
            class: hwClass,
            content,
            deadline,
            notified: false
        };

        // Save to Firebase
        const id = await addHomeworkToDb(newHomework);
        newHomework.id = id;

        closeModal('modal-add-homework');
        document.getElementById('form-add-homework')?.reset();

        // Send SMS notifications if configured
        if (isSmsConfigured()) {
            showToast('Đang gửi SMS cho phụ huynh...', 'info');
            const students = getStudentsByClass(hwClass);

            let successCount = 0;
            for (const student of students) {
                const phone = student.zaloId || student.phone;
                if (!phone) continue;

                try {
                    await sendHomeworkReminder(student.name, phone, subject, formatDate(deadline));
                    successCount++;
                } catch (err) {
                    console.error('SMS error:', err);
                }
            }

            if (successCount > 0) {
                showToast(`Đã gửi ${successCount} SMS thông báo bài tập!`, 'success');
            }
        } else {
            showToast('Đã lưu bài tập! (Cấu hình SMS để gửi thông báo)', 'info');
        }

        // Reload list
        await loadHomework();
    } catch (err) {
        console.error('Error saving homework:', err);
        showToast('Lỗi: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Lưu';
    }
}

// Delete homework
window.deleteHomework = async function (id) {
    if (!confirm('Xác nhận xóa bài tập này?')) return;

    try {
        await deleteHomeworkFromDb(id);
        showToast('Đã xóa bài tập', 'success');
        await loadHomework();
    } catch (err) {
        console.error('Error deleting homework:', err);
        showToast('Lỗi: ' + err.message, 'error');
    }
};

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
}

export function getHomeworkList() {
    return homeworkList;
}
