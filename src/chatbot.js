// Chatbot Component - Global AI Assistant
import { chat } from './services/ai.js';
import { getCurrentTab } from './router.js';

let isOpen = false;

export function initChatbot() {
    setupToggle();
    setupQuickActions();
    setupMessageInput();
}

function setupToggle() {
    const toggleBtn = document.getElementById('chatbot-toggle');
    const closeBtn = document.getElementById('chatbot-close');
    const panel = document.getElementById('chatbot-panel');

    toggleBtn?.addEventListener('click', () => {
        isOpen = !isOpen;
        panel?.classList.toggle('active', isOpen);
    });

    closeBtn?.addEventListener('click', () => {
        isOpen = false;
        panel?.classList.remove('active');
    });
}

function setupQuickActions() {
    document.querySelectorAll('.quick-action').forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            handleQuickAction(action);
        });
    });
}

function handleQuickAction(action) {
    const actions = {
        absence: 'Tôi muốn soạn thông báo vắng mặt cho học sinh',
        homework: 'Giúp tôi soạn tin nhắn nhắc bài tập cho phụ huynh',
        quiz: 'Tôi cần tạo câu hỏi trắc nghiệm Toán'
    };

    const message = actions[action];
    if (message) {
        addUserMessage(message);
        processMessage(message);
    }
}

function setupMessageInput() {
    const input = document.getElementById('chatbot-input');
    const sendBtn = document.getElementById('chatbot-send');

    sendBtn?.addEventListener('click', sendMessage);

    input?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
}

function sendMessage() {
    const input = document.getElementById('chatbot-input');
    const message = input?.value?.trim();

    if (!message) return;

    addUserMessage(message);
    input.value = '';
    processMessage(message);
}

function addUserMessage(text) {
    const container = document.getElementById('chatbot-messages');
    if (!container) return;

    const div = document.createElement('div');
    div.className = 'message user';
    div.innerHTML = `
    <div class="message-avatar">👤</div>
    <div class="message-content"><p>${escapeHtml(text)}</p></div>
  `;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function addBotMessage(text) {
    const container = document.getElementById('chatbot-messages');
    if (!container) return;

    const div = document.createElement('div');
    div.className = 'message bot';
    div.innerHTML = `
    <div class="message-avatar">🤖</div>
    <div class="message-content"><p>${text.replace(/\n/g, '<br>')}</p></div>
  `;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function showTyping() {
    const container = document.getElementById('chatbot-messages');
    if (!container) return null;

    const div = document.createElement('div');
    div.className = 'message bot typing';
    div.innerHTML = `
    <div class="message-avatar">🤖</div>
    <div class="typing-indicator">
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    </div>
  `;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div;
}

async function processMessage(message) {
    const typingIndicator = showTyping();

    try {
        const context = getCurrentTab();
        const response = await chat(message, context);

        typingIndicator?.remove();
        addBotMessage(response);
    } catch (err) {
        typingIndicator?.remove();
        addBotMessage('Xin lỗi, có lỗi xảy ra. Vui lòng thử lại.');
        console.error('Chat error:', err);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

export function openChatbot() {
    const panel = document.getElementById('chatbot-panel');
    isOpen = true;
    panel?.classList.add('active');
}

export function closeChatbot() {
    const panel = document.getElementById('chatbot-panel');
    isOpen = false;
    panel?.classList.remove('active');
}
