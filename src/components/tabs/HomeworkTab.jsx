import React, { useState, useEffect } from 'react'
import { useToast } from '../../contexts/ToastContext'
import { useDialog } from '../DialogProvider'
import Modal from '../Modal'
import {
    subscribeToClasses,
    getHomework,
    addHomework,
    deleteHomework
} from '../../services/firebase'
import { subscribeToStudents } from '../../services/firebase'
import { sendHomeworkReminder, isEmailConfigured } from '../../services/notification'

export default function HomeworkTab() {
    const { showToast } = useToast()
    const { confirm } = useDialog()
    const [homework, setHomework] = useState([])
    const [classes, setClasses] = useState([])
    const [students, setStudents] = useState([])
    const [showAdd, setShowAdd] = useState(false)
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        subject: '',
        class: '',
        content: '',
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    })

    useEffect(() => {
        loadHomework()
        const unsubClasses = subscribeToClasses(setClasses)
        const unsubStudents = subscribeToStudents(setStudents)
        return () => {
            unsubClasses?.()
            unsubStudents?.()
        }
    }, [])

    const loadHomework = async () => {
        try {
            const data = await getHomework()
            setHomework(data || [])
        } catch (err) {
            console.error('Error loading homework:', err)
        }
    }

    const handleAdd = async () => {
        if (!form.subject || !form.class || !form.content || !form.deadline) {
            showToast('Vui lòng điền đầy đủ thông tin', 'error')
            return
        }
        setLoading(true)
        try {
            await addHomework({ ...form, notified: false })
            setShowAdd(false)
            setForm({ subject: '', class: '', content: '', deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] })

            // Send Email
            if (isEmailConfigured()) {
                const classStudents = students.filter(s => s.class === form.class)
                showToast('Đang gửi Email cho phụ huynh...', 'info')
                let successCount = 0
                for (const student of classStudents) {
                    if (!student.parentEmail) continue
                    try {
                        const message = `Kính gửi Phụ huynh,\n\nEm ${student.name} lớp ${student.class} có bài tập mới:\n\n📚 Môn: ${form.subject}\n📝 Nội dung: ${form.content}\n📅 Hạn nộp: ${formatDate(form.deadline)}\n\nKính mong Quý Phụ huynh nhắc nhở em hoàn thành đúng hạn.\n\nTrân trọng,\nEduAssist`
                        await sendHomeworkReminder(student, form, message)
                        successCount++
                    } catch (err) {
                        console.error('Email error:', err)
                    }
                }
                if (successCount > 0) showToast(`Đã gửi ${successCount} Email thông báo bài tập!`, 'success')
            } else {
                showToast('Đã lưu bài tập! (Cấu hình Email để gửi thông báo)', 'info')
            }

            await loadHomework()
        } catch (err) {
            showToast('Lỗi: ' + err.message, 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (hw) => {
        const confirmed = await confirm('Xác nhận xóa bài tập này?')
        if (!confirmed) return
        try {
            await deleteHomework(hw.id)
            showToast('Đã xóa bài tập', 'success')
            await loadHomework()
        } catch (err) {
            showToast('Lỗi: ' + err.message, 'error')
        }
    }

    const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })

    const sortedHomework = [...homework].sort((a, b) => new Date(a.deadline) - new Date(b.deadline))

    return (
        <section id="tab-homework" className="tab-content active">
            <div className="tab-header">
                <h2>Quản Lý Bài Tập</h2>
                <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
                    <span>➕</span> Giao Bài Tập Mới
                </button>
            </div>

            <div className="homework-list">
                {homework.length === 0 ? (
                    <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                        <span className="empty-state-icon">📚</span>
                        <h4>Chưa có bài tập nào</h4>
                        <p>Bấm "Giao Bài Tập Mới" để bắt đầu</p>
                    </div>
                ) : (
                    sortedHomework.map(hw => {
                        const deadline = new Date(hw.deadline)
                        const today = new Date()
                        const daysLeft = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24))
                        const isOverdue = daysLeft < 0
                        const isUrgent = daysLeft <= 1 && !isOverdue

                        return (
                            <div key={hw.id} className="homework-card">
                                <div className="homework-header">
                                    <span className="homework-subject">📖 {hw.subject}</span>
                                    <span className="homework-class">Lớp {hw.class}</span>
                                    <button className="btn-icon-sm delete" onClick={() => handleDelete(hw)} title="Xóa">🗑️</button>
                                </div>
                                <div className="homework-content">{hw.content}</div>
                                <div className="homework-footer">
                                    <div className={`homework-deadline ${isOverdue ? 'overdue' : ''} ${isUrgent ? 'urgent' : ''}`}>
                                        <span>📅</span>
                                        <span>{isOverdue ? 'Quá hạn' : `Còn ${daysLeft} ngày`}</span>
                                        <span style={{ color: 'var(--color-gray-400)' }}>({formatDate(hw.deadline)})</span>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            <Modal show={showAdd} onClose={() => setShowAdd(false)} title="Giao Bài Tập Mới">
                <div className="form-row">
                    <div className="form-group">
                        <label>Môn học <span className="required">*</span></label>
                        <select className="select-input" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}>
                            <option value="">Chọn môn</option>
                            <option value="Toán">Toán</option>
                            <option value="Ngữ Văn">Ngữ Văn</option>
                            <option value="Tiếng Anh">Tiếng Anh</option>
                            <option value="Vật Lý">Vật Lý</option>
                            <option value="Hóa Học">Hóa Học</option>
                            <option value="Sinh Học">Sinh Học</option>
                            <option value="Lịch Sử">Lịch Sử</option>
                            <option value="Địa Lý">Địa Lý</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Lớp <span className="required">*</span></label>
                        <select className="select-input" value={form.class} onChange={e => setForm({ ...form, class: e.target.value })}>
                            <option value="">Chọn lớp</option>
                            {classes.map(c => <option key={c.id} value={c.name}>Lớp {c.name}</option>)}
                        </select>
                    </div>
                </div>
                <div className="form-group">
                    <label>Nội dung <span className="required">*</span></label>
                    <textarea rows="3" placeholder="Mô tả chi tiết bài tập..." value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
                </div>
                <div className="form-group">
                    <label>Hạn nộp <span className="required">*</span></label>
                    <input type="date" className="date-input" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Hủy</button>
                    <button className="btn btn-primary" onClick={handleAdd} disabled={loading}>
                        {loading ? 'Đang lưu...' : 'Lưu & Gửi Thông Báo'}
                    </button>
                </div>
            </Modal>
        </section>
    )
}
