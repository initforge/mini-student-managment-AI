import React from 'react'

const navItems = [
    { id: 'students', icon: '👥', label: 'Học Sinh' },
    { id: 'attendance', icon: '📋', label: 'Điểm Danh' },
    { id: 'homework', icon: '📚', label: 'Bài Tập' },
    { id: 'quiz', icon: '✏️', label: 'Trắc Nghiệm' },
]

export default function Sidebar({ activeTab, onTabChange, onLogout }) {
    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="logo">
                    <span className="logo-icon">🎓</span>
                    <span className="logo-text">EduAssist</span>
                </div>
            </div>

            <div className="user-profile">
                <div className="avatar">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=teacher" alt="Teacher Avatar" />
                </div>
                <div className="user-info">
                    <span className="user-name">Giáo Viên</span>
                    <span className="user-role">Chủ nhiệm</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                <ul>
                    {navItems.map(item => (
                        <li key={item.id}>
                            <a
                                href={`#${item.id}`}
                                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                                onClick={(e) => {
                                    e.preventDefault()
                                    onTabChange(item.id)
                                }}
                            >
                                <span className="nav-icon">{item.icon}</span>
                                <span className="nav-text">{item.label}</span>
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="sidebar-footer">
                <button className="btn btn-secondary btn-block" onClick={onLogout}>
                    <span>🚪</span> Đăng xuất
                </button>
            </div>
        </aside>
    )
}
