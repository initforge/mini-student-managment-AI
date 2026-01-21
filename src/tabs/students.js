// Students Tab - CRUD operations with Firebase + Class Management
import { openModal, closeModal, initModals } from '../utils/modal.js';
import { showToast } from '../utils/toast.js';
import {
  getStudents as fetchStudents,
  addStudent as addStudentToDb,
  updateStudent as updateStudentInDb,
  deleteStudent as deleteStudentFromDb,
  subscribeToStudents,
  subscribeToClasses,
  addClass as addClassToDb,
  deleteClass as deleteClassFromDb,
  updateClass as updateClassInDb
} from '../services/firebase.js';
import { exportStudentsToPDF } from '../services/export.js';

// Local cache
let students = [];
let classes = [];
let unsubscribe = null;
let unsubscribeClasses = null;

// ===== REGISTER WINDOW FUNCTIONS IMMEDIATELY =====
// These must be available when onclick handlers are parsed
window.selectClass = function (className) {
  document.querySelector('.mini-tab[data-mini-tab="students"]')?.click();
  setTimeout(() => {
    document.getElementById('filter-class').value = className;
    renderStudents('', className);
  }, 100);
};

window.editClass = async function (id) {
  const classObj = classes.find(c => c.id === id);
  if (!classObj) {
    showToast('Không tìm thấy lớp', 'error');
    return;
  }

  const newName = prompt('Tên lớp mới:', classObj.name);
  if (!newName || newName.trim() === '') return;

  const newTeacher = prompt('Giáo viên chủ nhiệm:', classObj.teacher || '');

  try {
    await updateClassInDb(id, {
      name: newName.trim(),
      teacher: newTeacher?.trim() || '',
      createdAt: classObj.createdAt || Date.now()
    });
    showToast(`Đã cập nhật lớp ${newName}`, 'success');
  } catch (err) {
    console.error('Error updating class:', err);
    showToast('Lỗi: ' + err.message, 'error');
  }
};

window.deleteClass = async function (id) {
  const classObj = classes.find(c => c.id === id);
  if (!classObj) {
    showToast('Không tìm thấy lớp', 'error');
    return;
  }

  const studentsInClass = students.filter(s => s.class === classObj.name);
  const studentCount = studentsInClass.length;

  const confirmMsg = studentCount > 0
    ? `Xác nhận xóa lớp ${classObj.name} và ${studentCount} học sinh trong lớp?`
    : `Xác nhận xóa lớp ${classObj.name}?`;

  if (confirm(confirmMsg)) {
    try {
      // Cascade delete: remove all students in this class first
      for (const student of studentsInClass) {
        await deleteStudentFromDb(student.id);
      }
      // Then delete the class
      await deleteClassFromDb(id);
      const successMsg = studentCount > 0
        ? `Đã xóa lớp ${classObj.name} và ${studentCount} học sinh`
        : `Đã xóa lớp ${classObj.name}`;
      showToast(successMsg, 'success');
    } catch (err) {
      console.error('Error deleting class:', err);
      showToast('Lỗi: ' + err.message, 'error');
    }
  }
};

console.log('✅ Class management functions registered: editClass, deleteClass, selectClass');

export function initStudents() {
  initModals();
  loadClasses();
  setupEventListeners();
  setupMiniTabs();
  loadStudents();
}

function loadClasses() {
  // Subscribe to Firebase classes
  unsubscribeClasses = subscribeToClasses((data) => {
    classes = data || [];
    renderClasses();
    populateClassDropdowns();
  });
}

function setupMiniTabs() {
  document.querySelectorAll('.mini-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.dataset.miniTab;

      // Update tab state
      document.querySelectorAll('.mini-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Update content
      document.querySelectorAll('.mini-tab-content').forEach(c => c.classList.remove('active'));
      document.getElementById(`mini-tab-${targetId}`)?.classList.add('active');
    });
  });
}

// Populate all class dropdowns dynamically
function populateClassDropdowns() {
  const selects = ['filter-class', 'student-class', 'edit-student-class'];
  selects.forEach(id => {
    const select = document.getElementById(id);
    if (!select) return;

    const currentValue = select.value;
    const isFilter = id === 'filter-class';

    select.innerHTML = isFilter
      ? '<option value="">Tất cả lớp</option>'
      : '<option value="">Chọn lớp</option>';

    classes.forEach(c => {
      select.innerHTML += `<option value="${c.name}">Lớp ${c.name}</option>`;
    });

    if (currentValue) select.value = currentValue;
  });
}

async function loadStudents() {
  try {
    unsubscribe = subscribeToStudents((data) => {
      students = data || [];
      renderStudents();
    });
  } catch (err) {
    console.error('Error loading students:', err);
    showToast('Lỗi kết nối Firebase!', 'error');
  }
}

function setupEventListeners() {
  // Add class button
  document.getElementById('btn-add-class')?.addEventListener('click', () => {
    document.getElementById('form-add-class')?.reset();
    openModal('modal-add-class');
  });

  // Save class
  document.getElementById('btn-save-class')?.addEventListener('click', saveClass);

  // Add student button
  document.getElementById('btn-add-student')?.addEventListener('click', () => {
    document.getElementById('form-add-student')?.reset();
    openModal('modal-add-student');
  });

  // Save new student
  document.getElementById('btn-save-student')?.addEventListener('click', saveStudent);

  // Update existing student
  document.getElementById('btn-update-student')?.addEventListener('click', updateStudent);

  // Search
  document.getElementById('student-search')?.addEventListener('input', (e) => {
    renderStudents(e.target.value, document.getElementById('filter-class')?.value);
  });

  // Filter by class
  document.getElementById('filter-class')?.addEventListener('change', (e) => {
    renderStudents(document.getElementById('student-search')?.value, e.target.value);
  });
}

// ===== CLASS MANAGEMENT =====
function renderClasses() {
  const container = document.getElementById('classes-list');
  if (!container) return;

  if (classes.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-state-icon">📁</span>
        <h4>Chưa có lớp nào</h4>
        <p>Nhấn "Thêm Lớp" để bắt đầu</p>
      </div>
    `;
    return;
  }

  container.innerHTML = classes.map(c => {
    const studentCount = students.filter(s => s.class === c.name).length;
    return `
      <div class="class-card" onclick="window.selectClass('${c.name}')">
        <div class="class-actions">
          <button class="btn-icon-sm edit" onclick="event.stopPropagation(); window.editClass('${c.id}')" title="Sửa">✏️</button>
          <button class="btn-icon-sm delete" onclick="event.stopPropagation(); window.deleteClass('${c.id}')" title="Xóa">🗑️</button>
        </div>
        <div class="class-name">Lớp ${c.name}</div>
        <div class="class-meta">
          <span>👥 ${studentCount} học sinh</span>
          ${c.teacher ? `<span>• ${c.teacher}</span>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

async function saveClass() {
  const name = document.getElementById('class-name')?.value?.trim();
  const teacher = document.getElementById('class-teacher')?.value?.trim();

  if (!name) {
    showToast('Vui lòng nhập tên lớp', 'error');
    return;
  }

  if (classes.find(c => c.name.toLowerCase() === name.toLowerCase())) {
    showToast('Lớp này đã tồn tại', 'error');
    return;
  }

  const btn = document.getElementById('btn-save-class');
  btn.disabled = true;
  btn.textContent = 'Đang lưu...';

  try {
    await addClassToDb({
      name: name,
      teacher: teacher || ''
    });

    closeModal('modal-add-class');
    document.getElementById('form-add-class')?.reset();
    showToast(`Đã thêm lớp ${name}`, 'success');
  } catch (err) {
    console.error('Error adding class:', err);
    showToast('Lỗi: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Lưu';
  }
}

window.selectClass = function (className) {
  // Switch to students tab and filter by class
  document.querySelector('.mini-tab[data-mini-tab="students"]')?.click();
  setTimeout(() => {
    document.getElementById('filter-class').value = className;
    renderStudents('', className);
  }, 100);
};

// Duplicate removed - function defined above at line 58

window.editClass = function (id) {
  const classObj = classes.find(c => c.id === id);
  if (!classObj) return;

  // For now, use prompt - can be upgraded to modal later
  const newName = prompt('Tên lớp mới:', classObj.name);
  if (!newName || newName === classObj.name) return;

  const newTeacher = prompt('Giáo viên chủ nhiệm:', classObj.teacher || '');

  updateClassData(id, newName, newTeacher);
};

async function updateClassData(id, newName, newTeacher) {
  const classObj = classes.find(c => c.id === id);
  if (!classObj) return;

  try {
    const { updateClass } = await import('../services/firebase.js');
    await updateClass(id, {
      name: newName,
      teacher: newTeacher || '',
      createdAt: classObj.createdAt || Date.now()
    });
    showToast(`Đã cập nhật lớp ${newName}`, 'success');
  } catch (err) {
    console.error('Error updating class:', err);
    showToast('Lỗi: ' + err.message, 'error');
  }
}

// ===== STUDENT MANAGEMENT =====
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
    // Also update class count in render
    renderClasses();
    return;
  }

  // Sort by class then by name
  filtered.sort((a, b) => a.class.localeCompare(b.class) || a.name.localeCompare(b.name));

  container.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 8%;">STT</th>
          <th style="width: 30%;">Họ và tên</th>
          <th style="width: 12%;">Lớp</th>
          <th style="width: 30%;">SĐT Phụ huynh</th>
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
                <button class="btn-icon-sm edit" onclick="window.editStudent('${student.id}')" title="Sửa">✏️</button>
                <button class="btn-icon-sm delete" onclick="window.deleteStudent('${student.id}')" title="Xóa">🗑️</button>
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

  // Update class counts
  renderClasses();
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

// Edit student
window.editStudent = function (id) {
  const student = students.find(s => s.id === id);
  if (!student) return;

  document.getElementById('edit-student-id').value = id;
  document.getElementById('edit-student-name').value = student.name;
  document.getElementById('edit-student-class').value = student.class;
  document.getElementById('edit-student-zalo').value = student.zaloId || '';

  openModal('modal-edit-student');
};

async function updateStudent() {
  const id = document.getElementById('edit-student-id')?.value;
  const name = document.getElementById('edit-student-name')?.value?.trim();
  const studentClass = document.getElementById('edit-student-class')?.value;
  const zaloId = document.getElementById('edit-student-zalo')?.value?.trim();

  if (!id || !name || !studentClass) {
    showToast('Vui lòng điền đầy đủ thông tin', 'error');
    return;
  }

  const btn = document.getElementById('btn-update-student');
  btn.disabled = true;
  btn.textContent = 'Đang cập nhật...';

  try {
    const student = students.find(s => s.id === id);
    await updateStudentInDb(id, {
      name,
      class: studentClass,
      zaloId: zaloId || '',
      avatar: student?.avatar || '👤',
      createdAt: student?.createdAt || Date.now()
    });

    closeModal('modal-edit-student');
    showToast(`Đã cập nhật học sinh ${name}`, 'success');
  } catch (err) {
    console.error('Error updating student:', err);
    showToast('Lỗi: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Cập nhật';
  }
}

// Delete student
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

export function getClasses() {
  return classes;
}
