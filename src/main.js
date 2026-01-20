// Main Application Entry Point
import { initRouter } from './router.js';
import { initStudents } from './tabs/students.js';
import { initAttendance } from './tabs/attendance.js';
import { initHomework } from './tabs/homework.js';
import { initQuiz } from './tabs/quiz.js';
import { initChatbot } from './chatbot.js';
import { showToast } from './utils/toast.js';
import { initSettings } from './services/settings.js';

// App State
let isLoggedIn = false;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎓 EduAssist - Mini Chatbot Support initialized');

  // Setup landing page buttons
  setupLandingPage();

  // Check if we should show dashboard directly (for development)
  const hash = window.location.hash;
  if (hash && hash !== '#' && hash !== '#features' && hash !== '#about') {
    enterDashboard();
  }
});

function setupLandingPage() {
  // All CTA buttons to enter app
  const enterButtons = [
    document.getElementById('btn-enter-app'),
    document.getElementById('btn-start'),
    document.getElementById('btn-demo'),
    document.getElementById('btn-cta-start')
  ];

  enterButtons.forEach(btn => {
    btn?.addEventListener('click', enterDashboard);
  });

  // Logout button
  document.getElementById('btn-logout')?.addEventListener('click', exitDashboard);
}

function enterDashboard() {
  isLoggedIn = true;

  // Hide landing, show dashboard
  document.getElementById('landing-page').style.display = 'none';
  document.getElementById('dashboard-app').style.display = 'flex';
  document.getElementById('chatbot-container').style.display = 'block';

  // Initialize dashboard if not already done
  if (!window.dashboardInitialized) {
    initDashboard();
    window.dashboardInitialized = true;
  }
}

function exitDashboard() {
  isLoggedIn = false;

  // Show landing, hide dashboard
  document.getElementById('landing-page').style.display = 'block';
  document.getElementById('dashboard-app').style.display = 'none';
  document.getElementById('chatbot-container').style.display = 'none';

  // Clear hash
  window.location.hash = '';
}

function initDashboard() {
  // Set current date
  updateCurrentDate();

  // Initialize settings
  initSettings();

  // Initialize router for tab navigation
  initRouter();

  // Initialize all tabs
  initStudents();
  initAttendance();
  initHomework();
  initQuiz();

  // Initialize chatbot
  initChatbot();

  // Show welcome toast
  showToast('Chào mừng bạn đến với EduAssist! 🎓', 'success');
}

function updateCurrentDate() {
  const dateElement = document.getElementById('current-date');
  if (dateElement) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateElement.textContent = new Date().toLocaleDateString('vi-VN', options);
  }
}
