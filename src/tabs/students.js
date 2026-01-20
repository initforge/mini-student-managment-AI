// Students Tab - CRUD operations with Firebase (Production Mode)
import { openModal, closeModal, initModals } from '../utils/modal.js';
import { showToast } from '../utils/toast.js';
import {
  getStudents as fetchStudents,
  addStudent as addStudentToDb,
  deleteStudent as deleteStudentFromDb,
  subscribeToStudents
} from '../services/firebase.js';
import { exportStudentsToPDF } from '../services/export.js';

// Local students cache
let students = [];
let unsubscribe = null;

export function initStudents() {
  initModals();
  setupEventListeners();
  loadStudents();
}

async function loadStudents() {
  try {
    // Subscribe to Firebase real-time updates
    unsubscribe = subscribeToStudents((data) => {
      students = data || [];
      renderStudents();
    });
  } catch (err) {
    console.error('Error loading students:', err);
    showToast('Lỗi kết nối Firebase. Kiểm tra Rules!', 'error');
  }
}

function setupEventListeners() {
  // Add student button
  document.getElementById('btn-add-student')?.addEventListener('click', () => {
    openModal('modal-add-student');
  });

  // Save student button
  document.getElementById('btn-save-student')?.addEventListener('click', saveStudent);

  // Search
  document.getElementById('student-search')?.addEventListener('input', (e) => {
    renderStudents(e.target.value, document.getElementById('filter-class')?.value);
  });

  // Filter by class
  document.getElementById('filter-class')?.addEventListener('change', (e) => {
    renderStudents(document.getElementById('student-search')?.value, e.target.value);
  });
}

function renderStudents(search = '', filterClass = '') {
  const container = document.getElementById('students-list');
  if (!container) return;

  let filtered = students;

  if (search) {
    filtered = filtered.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  }
  if (filterClass) {
    filtered = filtered.filter(s => s.class === filterClass);
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-state-icon">👥</span>
        <h4>Chưa có học sinh</h4>
        <p>Nhấn "Thêm Học Sinh" để bắt đầu</p>
      </div>
    `;
    return;
  }

  // Sort by class then by name
  filtered.sort((a, b) => a.class.localeCompare(b.class) || a.name.localeCompare(b.name));

  container.innerHTML = `
    <div class="table-actions">
      <button class="btn btn-secondary btn-sm" onclick="exportStudentsList()">
        📄 Xuất PDF
      </button>
    </div>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 8%;">STT</th>
          <th style="width: 30%;">Họ và tên</th>
          <th style="width: 12%;">Lớp</th>
          <th style="width: 30%;">Zalo Phụ huynh</th>
          <th style="width: 20%;">Thao tác</th>
        </tr>
      </thead>
      <tbody>
        ${filtered.map((student, index) => `
          <tr data-id="${student.id}">
            <td class="text-center">${index + 1}</td>
            <td>
              <div class="student-name-cell">
                <span class="student-avatar-sm">${student.avatar || '👤'}</span>
                <strong>${student.name}</strong>
              </div>
            </td>
            <td class="text-center"><span class="class-badge">${student.class}</span></td>
            <td class="zalo-cell">${student.zaloId || '<span class="text-muted">—</span>'}</td>
            <td class="text-center">
              <div class="action-btns">
                <button class="btn-icon-sm edit" onclick="editStudent('${student.id}')" title="Sửa">✏️</button>
                <button class="btn-icon-sm delete" onclick="deleteStudent('${student.id}')" title="Xóa">🗑️</button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div class="table-footer">
      <span>Tổng: <strong>${filtered.length}</strong> học sinh</span>
    </div>
  `;
}

async function saveStudent() {
  const name = document.getElementById('student-name')?.value?.trim();
  const studentClass = document.getElementById('student-class')?.value;
  const zaloId = document.getElementById('student-zalo')?.value?.trim();

  if (!name || !studentClass) {
    showToast('Vui lòng điền đầy đủ thông tin', 'error');
    return;
  }

  const btn = document.getElementById('btn-save-student');
  btn.disabled = true;
  btn.textContent = 'Đang lưu...';

  try {
    await addStudentToDb({
      name,
      class: studentClass,
      zaloId: zaloId || '',
      avatar: Math.random() > 0.5 ? '👦' : '👧'
    });

    closeModal('modal-add-student');
    document.getElementById('form-add-student')?.reset();
    showToast(`Đã thêm học sinh ${name}`, 'success');
  } catch (err) {
    console.error('Error saving student:', err);
    showToast('Lỗi: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Lưu';
  }
}

// Global functions for inline onclick
window.editStudent = function (id) {
  const student = students.find(s => s.id === id);
  if (student) {
    showToast(`Chỉnh sửa: ${student.name}`, 'info');
    // TODO: Open edit modal
  }
};

window.deleteStudent = async function (id) {
  const student = students.find(s => s.id === id);
  if (student && confirm(`Xác nhận xóa học sinh ${student.name}?`)) {
    try {
      await deleteStudentFromDb(id);
      showToast(`Đã xóa học sinh ${student.name}`, 'success');
    } catch (err) {
      console.error('Error deleting student:', err);
      showToast('Lỗi: ' + err.message, 'error');
    }
  }
};

window.exportStudentsList = function () {
  if (students.length === 0) {
    showToast('Không có học sinh để xuất', 'error');
    return;
  }
  const filename = exportStudentsToPDF(students);
  showToast(`Đã xuất file ${filename}`, 'success');
};

export function getStudents() {
  return students;
}

export function getStudentsByClass(className) {
  return students.filter(s => s.class === className);
}
