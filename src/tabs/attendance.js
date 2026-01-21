// Attendance Tab - Daily attendance tracking with Firebase and Charts (Production Mode)
import { getStudents } from './students.js';
import { showToast } from '../utils/toast.js';
import { generateAbsenceNotice } from '../services/ai.js';
import { sendAbsenceNotification, isEmailConfigured } from '../services/notification.js';
import {
  getAttendance as fetchAttendance,
  saveAttendance as saveAttendanceToDb,
  getAttendanceRange
} from '../services/firebase.js';
import { createAttendancePieChart, createWeeklyBarChart, generateWeekData } from '../services/charts.js';
import { exportAttendanceToPDF } from '../services/export.js';

// Local attendance data cache
let attendanceData = {};
let currentDate = '';

export function initAttendance() {
  setupDatePicker();
  setupEventListeners();
}

function setupDatePicker() {
  const datePicker = document.getElementById('attendance-date');
  if (datePicker) {
    const today = new Date().toISOString().split('T')[0];
    datePicker.value = today;
    currentDate = today;
    datePicker.addEventListener('change', async () => {
      currentDate = datePicker.value;
      await loadAttendance(currentDate);
    });
  }
  // Delay to let students load first
  setTimeout(() => {
    loadAttendance(currentDate || new Date().toISOString().split('T')[0]);
  }, 500);
}

async function loadAttendance(date) {
  try {
    const data = await fetchAttendance(date);
    attendanceData[date] = data || {};
    renderAttendanceList();
    await loadCharts();
  } catch (err) {
    console.error('Error loading attendance:', err);
    attendanceData[date] = {};
    renderAttendanceList();
  }
}

function setupEventListeners() {
  document.getElementById('btn-all-present')?.addEventListener('click', markAllPresent);
  document.getElementById('btn-save-attendance')?.addEventListener('click', saveAttendance);
}

async function loadCharts() {
  try {
    const students = getStudents();
    const date = document.getElementById('attendance-date')?.value;
    const dayData = attendanceData[date] || {};

    let presentCount = 0;
    let absentCount = 0;
    students.forEach(s => {
      if (dayData[s.id] === 'absent') absentCount++;
      else presentCount++;
    });

    // Create today's pie chart
    createAttendancePieChart('today-chart', presentCount, absentCount);

    // Load real weekly data from Firebase
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 6);

    const rangeData = await getAttendanceRange(weekAgo, today);
    const weekData = generateWeekData(rangeData, students.length);
    createWeeklyBarChart('weekly-chart', weekData);
  } catch (err) {
    console.error('Error loading charts:', err);
  }
}

function renderAttendanceList() {
  const container = document.getElementById('attendance-list');
  const date = document.getElementById('attendance-date')?.value;
  if (!container) return;

  const students = getStudents();
  const dayData = attendanceData[date] || {};

  if (students.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-state-icon">📋</span>
        <h4>Chưa có học sinh</h4>
        <p>Thêm học sinh ở tab "Học Sinh" trước</p>
      </div>
    `;
    return;
  }

  const sorted = [...students].sort((a, b) => a.class.localeCompare(b.class) || a.name.localeCompare(b.name));

  container.innerHTML = `
    <div class="table-actions">
      <button class="btn btn-secondary btn-sm" onclick="exportAttendanceList()">
        📄 Xuất PDF
      </button>
    </div>
    <table class="data-table attendance-table">
      <thead>
        <tr>
          <th style="width: 50px;">STT</th>
          <th>Họ và tên</th>
          <th style="width: 80px;">Lớp</th>
          <th style="width: 200px;">Trạng thái</th>
        </tr>
      </thead>
      <tbody>
        ${sorted.map((student, index) => {
    const status = dayData[student.id] || 'present';
    return `
          <tr data-student-id="${student.id}" class="${status === 'absent' ? 'row-absent' : ''}">
            <td class="text-center">${index + 1}</td>
            <td>
              <div class="student-name-cell">
                <span class="student-avatar-sm">${student.avatar || '👤'}</span>
                <span>${student.name}</span>
              </div>
            </td>
            <td class="text-center"><span class="class-badge">${student.class}</span></td>
            <td>
              <div class="attendance-toggle">
                <button class="toggle-btn present ${status === 'present' ? 'active' : ''}" 
                        onclick="toggleAttendance('${student.id}', 'present')">
                  ✅ Có mặt
                </button>
                <button class="toggle-btn absent ${status === 'absent' ? 'active' : ''}"
                        onclick="toggleAttendance('${student.id}', 'absent')">
                  ❌ Vắng
                </button>
              </div>
            </td>
          </tr>
        `;
  }).join('')}
      </tbody>
    </table>
  `;

  updateSummary();
}

function updateSummary() {
  const date = document.getElementById('attendance-date')?.value;
  const students = getStudents();
  const dayData = attendanceData[date] || {};

  let presentCount = 0;
  let absentCount = 0;

  students.forEach(student => {
    const status = dayData[student.id] || 'present';
    if (status === 'present') presentCount++;
    else absentCount++;
  });

  const presentEl = document.getElementById('present-count');
  const absentEl = document.getElementById('absent-count');
  if (presentEl) presentEl.textContent = presentCount;
  if (absentEl) absentEl.textContent = absentCount;
}

window.toggleAttendance = function (studentId, status) {
  const date = document.getElementById('attendance-date')?.value;
  if (!date) return;

  if (!attendanceData[date]) attendanceData[date] = {};
  attendanceData[date][studentId] = status;

  renderAttendanceList();
  loadCharts();
};

function markAllPresent() {
  const date = document.getElementById('attendance-date')?.value;
  const students = getStudents();
  if (!date) return;

  attendanceData[date] = {};
  students.forEach(s => {
    attendanceData[date][s.id] = 'present';
  });

  renderAttendanceList();
  loadCharts();
  showToast('Đã đánh dấu tất cả có mặt', 'success');
}

async function saveAttendance() {
  const date = document.getElementById('attendance-date')?.value;
  const students = getStudents();
  const dayData = attendanceData[date] || {};

  const btn = document.getElementById('btn-save-attendance');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Đang lưu...';

  try {
    // Save to Firebase
    await saveAttendanceToDb(date, dayData);

    // Find absent students
    const absentStudents = students.filter(s => dayData[s.id] === 'absent');

    if (absentStudents.length > 0 && isEmailConfigured()) {
      showToast(`Đang gửi SMS cho ${absentStudents.length} phụ huynh...`, 'info');

      let successCount = 0;
      let failCount = 0;

      for (const student of absentStudents) {
        // Use phone number (stored in zaloId field for now)
        const parentPhone = student.zaloId || student.phone;
        if (!parentPhone) {
          console.warn(`No phone for ${student.name}`);
          failCount++;
          continue;
        }

        try {
          await sendAbsenceNotification(student.name, parentPhone, date);
          console.log(`📤 SMS sent for ${student.name}`);
          successCount++;
        } catch (err) {
          console.error('SMS error:', err);
          failCount++;
        }
      }

      if (successCount > 0) {
        showToast(`Đã lưu và gửi ${successCount} SMS thành công!`, 'success');
      }
      if (failCount > 0) {
        showToast(`${failCount} tin nhắn thất bại`, 'warning');
      }
    } else if (absentStudents.length > 0 && !isEmailConfigured()) {
      showToast('Điểm danh đã lưu! (Cấu hình SMS trong Cài đặt để gửi thông báo)', 'info');
    } else {
      showToast('Điểm danh đã được lưu!', 'success');
    }

    await loadCharts();
  } catch (err) {
    console.error('Error saving attendance:', err);
    showToast('Lỗi: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>💾</span> Lưu & Gửi Thông Báo';
  }
}

window.exportAttendanceList = function () {
  const date = document.getElementById('attendance-date')?.value;
  const students = getStudents();
  const dayData = attendanceData[date] || {};

  if (students.length === 0) {
    showToast('Không có dữ liệu để xuất', 'error');
    return;
  }

  const filename = exportAttendanceToPDF(date, students, dayData);
  showToast(`Đã xuất file ${filename}`, 'success');
};

export function getAttendanceData() {
  return attendanceData;
}
