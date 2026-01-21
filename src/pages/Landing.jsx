import React from 'react'

export default function Landing({ onEnter }) {
    return (
        <div id="landing-page" className="landing-page">
            {/* Header */}
            <header className="landing-header">
                <div className="landing-container">
                    <div className="landing-logo">
                        <span className="logo-icon">🎓</span>
                        <span className="logo-text">EduAssist</span>
                    </div>
                    <nav className="landing-nav">
                        <a href="#features">Tính năng</a>
                        <a href="#about">Giới thiệu</a>
                        <button className="btn btn-accent" onClick={onEnter}>Truy cập hệ thống</button>
                    </nav>
                </div>
            </header>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-background">
                    <div className="hero-shape shape-1"></div>
                    <div className="hero-shape shape-2"></div>
                    <div className="hero-shape shape-3"></div>
                </div>
                <div className="landing-container">
                    <div className="hero-content">
                        <span className="hero-badge">🚀 Dành cho giáo viên THCS</span>
                        <h1 className="hero-title">
                            Quản lý lớp học <span className="text-accent">thông minh</span><br />
                            với trợ lý AI
                        </h1>
                        <p className="hero-subtitle">
                            Hệ thống hỗ trợ giáo viên điểm danh, giao bài tập, tạo đề trắc nghiệm Toán
                            và tự động thông báo cho phụ huynh qua Email.
                        </p>
                        <div className="hero-cta">
                            <button className="btn btn-primary btn-lg" onClick={onEnter}>
                                <span>🎯</span> Truy cập hệ thống
                            </button>
                        </div>
                        <div className="hero-stats">
                            <div className="stat-item">
                                <span className="stat-number">4</span>
                                <span className="stat-label">Tab chức năng</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">AI</span>
                                <span className="stat-label">Trợ lý thông minh</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">Email</span>
                                <span className="stat-label">Thông báo tự động</span>
                            </div>
                        </div>
                    </div>
                    <div className="hero-visual">
                        <div className="hero-mockup">
                            <div className="mockup-header">
                                <div className="mockup-dots">
                                    <span></span><span></span><span></span>
                                </div>
                                <span>EduAssist Dashboard</span>
                            </div>
                            <div className="mockup-content">
                                <div className="mockup-sidebar">
                                    <div className="mock-nav-item active">👥 Học Sinh</div>
                                    <div className="mock-nav-item">📋 Điểm Danh</div>
                                    <div className="mock-nav-item">📚 Bài Tập</div>
                                    <div className="mock-nav-item">✏️ Trắc Nghiệm</div>
                                </div>
                                <div className="mockup-main">
                                    <div className="mock-card"></div>
                                    <div className="mock-table">
                                        <div className="mock-row"></div>
                                        <div className="mock-row"></div>
                                        <div className="mock-row"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="features-section">
                <div className="landing-container">
                    <div className="section-header">
                        <span className="section-badge">✨ Tính năng</span>
                        <h2>Mọi thứ giáo viên cần trong một nơi</h2>
                    </div>
                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon">👥</div>
                            <h3>Quản lý học sinh</h3>
                            <p>Lưu trữ thông tin học sinh, lớp học và liên kết email phụ huynh.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">📋</div>
                            <h3>Điểm danh thông minh</h3>
                            <p>Điểm danh nhanh theo ngày. AI tự động soạn và gửi thông báo vắng cho phụ huynh.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">📚</div>
                            <h3>Giao bài tập</h3>
                            <p>Tạo và quản lý bài tập. Tự động nhắc nhở phụ huynh về hạn nộp.</p>
                        </div>
                        <div className="feature-card featured">
                            <div className="feature-icon">🤖</div>
                            <h3>Trắc nghiệm Toán AI</h3>
                            <p>AI tạo câu hỏi trắc nghiệm Toán theo khối, chủ đề và độ khó phù hợp.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section id="about" className="about-section">
                <div className="landing-container">
                    <div className="about-content">
                        <div className="about-text">
                            <span className="section-badge">💡 Về dự án</span>
                            <h2>Dự án KHKT cấp THCS</h2>
                            <p>
                                EduAssist là hệ thống quản lý lớp học được phát triển dành cho dự án
                                Khoa học Kỹ thuật (KHKT) cấp Trung học Cơ sở.
                            </p>
                            <ul className="about-list">
                                <li>✅ Giao diện thân thiện, dễ sử dụng</li>
                                <li>✅ AI hỗ trợ soạn nội dung</li>
                                <li>✅ Tích hợp Email thông báo</li>
                                <li>✅ Phù hợp khối 8 - 9</li>
                            </ul>
                        </div>
                        <div className="about-visual">
                            <div className="tech-stack">
                                <div className="tech-item">🔥 Firebase</div>
                                <div className="tech-item">🤖 Gemini AI</div>
                                <div className="tech-item">📧 EmailJS</div>
                                <div className="tech-item">⚡ React</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer CTA */}
            <section className="cta-section">
                <div className="landing-container">
                    <div className="cta-content">
                        <h2>Sẵn sàng trải nghiệm?</h2>
                        <p>Bắt đầu sử dụng EduAssist ngay hôm nay!</p>
                        <button className="btn btn-accent btn-xl" onClick={onEnter}>
                            <span>🚀</span> Truy cập hệ thống
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="landing-container">
                    <div className="footer-content">
                        <div className="footer-logo">
                            <span className="logo-icon">🎓</span>
                            <span className="logo-text">EduAssist</span>
                        </div>
                        <p>Dự án KHKT - Hệ thống quản lý lớp học thông minh</p>
                    </div>
                </div>
            </footer>
        </div>
    )
}
