// Router - Tab Navigation
let currentTab = 'students';

export function initRouter() {
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = item.dataset.tab;
            switchTab(tabId);
            updateChatbotContext(tabId);
        });
    });

    // Handle hash navigation
    const hash = window.location.hash.slice(1);
    if (hash && ['students', 'attendance', 'homework', 'quiz'].includes(hash)) {
        switchTab(hash);
    }
}

export function switchTab(tabId) {
    currentTab = tabId;

    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.tab === tabId);
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `tab-${tabId}`);
    });

    // Update page title
    const titles = {
        students: { title: 'Quản Lý Học Sinh 👥', subtitle: 'Thêm, sửa, xóa thông tin học sinh' },
        attendance: { title: 'Điểm Danh 📋', subtitle: 'Ghi nhận tình trạng chuyên cần' },
        homework: { title: 'Bài Tập 📚', subtitle: 'Giao và theo dõi bài tập về nhà' },
        quiz: { title: 'Trắc Nghiệm Toán ✏️', subtitle: 'Tạo bài kiểm tra với AI' }
    };

    const pageTitle = document.querySelector('.page-title');
    const pageSubtitle = document.querySelector('.page-subtitle');
    if (pageTitle && titles[tabId]) {
        pageTitle.textContent = titles[tabId].title;
        pageSubtitle.textContent = titles[tabId].subtitle;
    }

    // Update URL hash
    window.location.hash = tabId;
}

function updateChatbotContext(tabId) {
    const contextBadge = document.querySelector('.context-badge');
    const contextTexts = {
        students: '👥 Đang xem: Học Sinh',
        attendance: '📋 Đang xem: Điểm Danh',
        homework: '📚 Đang xem: Bài Tập',
        quiz: '✏️ Đang xem: Trắc Nghiệm'
    };
    if (contextBadge && contextTexts[tabId]) {
        contextBadge.textContent = contextTexts[tabId];
    }
}

export function getCurrentTab() {
    return currentTab;
}
