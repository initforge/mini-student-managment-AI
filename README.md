# 🎓 EduAssist - AI-Powered School Management System

> Hệ thống quản lý học sinh thông minh với AI, tự động gửi thông báo email và tạo bài kiểm tra trắc nghiệm online.

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-aisupportgv.web.app-blue?style=for-the-badge)](https://aisupportgv.web.app)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Realtime_DB-FFCA28?style=flat-square&logo=firebase)](https://firebase.google.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-2.5_Flash-4285F4?style=flat-square&logo=google)](https://ai.google.dev/)

---

## 🎯 Tổng Quan Dự Án

**EduAssist** là ứng dụng web giúp giáo viên quản lý học sinh với các tính năng tự động hóa:

| Tính năng | Mô tả |
|-----------|-------|
| 👥 **Quản lý Học sinh** | CRUD học sinh, lớp học với Firebase Realtime DB |
| ✅ **Điểm danh thông minh** | Điểm danh + tự động gửi email cho phụ huynh học sinh vắng |
| 📚 **Giao bài tập** | Tạo bài tập + tự động nhắc nhở phụ huynh |
| 🤖 **AI Trắc nghiệm** | Gemini AI tạo câu hỏi Toán + chia sẻ link làm bài online |
| 📊 **AI Thống kê** | Chatbot AI trả lời câu hỏi về dữ liệu thời gian thực |

---

## ✨ Tính Năng Nổi Bật

### 1. 🤖 AI-Powered Quiz Generation
```
Giáo viên chọn: Khối 8 → Phương trình bậc nhất → Trung bình → 5 câu
↓
AI tự động tạo 5 câu trắc nghiệm
↓
Lưu + Share link → Học sinh làm bài online → Xem kết quả
```

### 2. 📧 Email Automation (EmailJS)
- **Điểm danh vắng** → Email tự động đến phụ huynh
- **Giao bài tập** → Email nhắc nhở deadline
- **Zero backend** - Gửi email trực tiếp từ frontend

### 3. 📊 AI Analytics Chatbot
```
User: "Hôm nay có ai vắng không?"
AI: "Có 2 học sinh vắng: Nguyễn Văn A (Lớp 9A), Trần Thị B (Lớp 8B)"
```
AI có access đến data thời gian thực từ Firebase.

### 4. 🎯 Public Quiz Player
- Link dạng: `https://aisupportgv.web.app/#quiz/{id}`
- Học sinh nhập tên → Làm bài → Xem kết quả chi tiết
- Không cần đăng nhập

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 + Vite |
| **Routing** | React Router (HashRouter) |
| **Database** | Firebase Realtime Database |
| **Hosting** | Firebase Hosting |
| **AI** | Google Gemini 2.5 Flash API |
| **Email** | EmailJS (no backend) |
| **Charts** | Chart.js |
| **Styling** | Vanilla CSS (Custom Design) |

---

## 📁 Cấu Trúc Dự Án

```
src/
├── components/
│   ├── Chatbot.jsx          # AI Analytics chatbot
│   ├── Sidebar.jsx          # Navigation sidebar
│   ├── SettingsModal.jsx    # API keys configuration
│   ├── DialogProvider.jsx   # Custom modal system
│   └── tabs/
│       ├── StudentsTab.jsx  # Student & Class CRUD
│       ├── AttendanceTab.jsx# Daily attendance + Charts
│       ├── HomeworkTab.jsx  # Homework management
│       └── QuizTab.jsx      # AI Quiz generation
├── pages/
│   ├── Landing.jsx          # Landing page
│   ├── Dashboard.jsx        # Main dashboard
│   └── QuizPlayer.jsx       # Public quiz taking page
├── services/
│   ├── firebase.js          # Firebase CRUD operations
│   ├── ai.js                # Gemini API integration
│   ├── notification.js      # EmailJS service
│   ├── charts.js            # Chart.js visualizations
│   └── settings.js          # API keys management
├── contexts/
│   └── ToastContext.jsx     # Toast notifications
└── styles/
    ├── main.css             # Global styles
    ├── landing.css          # Landing page
    ├── components.css       # Component styles
    ├── chatbot.css          # Chatbot panel
    └── quiz-player.css      # Quiz player page
```

---

## 🚀 Cài Đặt & Chạy

### Prerequisites
- Node.js 18+
- npm hoặc yarn

### 1. Clone Repository
```bash
git clone https://github.com/[your-username]/mini-chatbot-support.git
cd mini-chatbot-support
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
```

---

## ⚙️ Cấu Hình API Keys

Sau khi chạy ứng dụng, click **"Cài đặt API"** (góc phải trên) để nhập:

| API | Nguồn | Mục đích |
|-----|-------|----------|
| **Gemini API Key** | [aistudio.google.com](https://aistudio.google.com) | AI Quiz + Chatbot |
| **EmailJS Service ID** | [emailjs.com](https://emailjs.com) | Gửi email |
| **EmailJS Template ID** | emailjs.com | Email template |
| **EmailJS Public Key** | emailjs.com | Authentication |

> ⚠️ Keys lưu trong localStorage (chỉ phù hợp demo, không production)

---

## 📱 Screenshots

### Dashboard - Điểm Danh
- Biểu đồ Pie: Có mặt/Vắng hôm nay
- Biểu đồ Bar: Thống kê 7 ngày
- Tự động gửi email cho phụ huynh học sinh vắng

### AI Quiz Generator
- Chọn khối lớp, chủ đề, độ khó
- AI tạo câu hỏi trắc nghiệm
- Share link cho học sinh làm bài

### AI Chatbot
- Hỏi thống kê: "Hôm nay có ai vắng?"
- Hỏi hướng dẫn: "Làm sao tạo quiz?"
- Trả lời dựa trên dữ liệu thực

---

## 🔐 Bảo Mật

| Vấn đề | Giải pháp đề xuất |
|--------|------------------|
| API Keys trong localStorage | Environment variables + Backend proxy |
| Firebase rules | Implement proper security rules |
| Email templates | Server-side email với SendGrid/AWS SES |

---

## 📈 Roadmap

- [ ] Đăng nhập/Đăng ký với Firebase Auth
- [ ] Lưu kết quả quiz của học sinh
- [ ] Export báo cáo PDF
- [ ] Push notifications
- [ ] Dark mode

---

## 👨‍💻 Tác Giả

**[Your Name]**

- Ứng dụng demo: [aisupportgv.web.app](https://aisupportgv.web.app)
- GitHub: [github.com/your-username](https://github.com/your-username)

---

## 📄 License

MIT License - Tự do sử dụng và phát triển.
