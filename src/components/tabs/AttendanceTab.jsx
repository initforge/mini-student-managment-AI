import React, { useState, useEffect } from 'react'
import { useToast } from '../../contexts/ToastContext'
import {
    subscribeToStudents,
    getAttendance,
    saveAttendance,
    getAttendanceRange
} from '../../services/firebase'
import { sendAbsenceNotification, isSmsConfigured } from '../../services/sms'

export default function AttendanceTab() {
    const { showToast } = useToast()
    const [students, setStudents] = useState([])
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [attendance, setAttendance] = useState({})
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const unsub = subscribeToStudents(setStudents)
        return () => unsub?.()
    }, [])

    useEffect(() => {
        loadAttendance()
    }, [date])

    const loadAttendance = async () => {
        try {
            const data = await getAttendance(date)
            setAttendance(data || {})
        } catch (err) {
            console.error('Error loading attendance:', err)
            setAttendance({})
        }
    }

    const presentCount = students.filter(s => attendance[s.id] !== 'absent').length
    const absentCount = students.filter(s => attendance[s.id] === 'absent').length

    const toggleAttendance = (studentId, status) => {
        setAttendance(prev => ({ ...prev, [studentId]: status }))
    }

    const markAllPresent = () => {
        const newAttendance = {}
        students.forEach(s => { newAttendance[s.id] = 'present' })
        setAttendance(newAttendance)
        showToast('Đã đánh dấu tất cả có mặt', 'success')
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            await saveAttendance(date, attendance)

            const absentStudents = students.filter(s => attendance[s.id] === 'absent')

            if (absentStudents.length > 0 && isSmsConfigured()) {
                showToast(`Đang gửi SMS cho ${absentStudents.length} phụ huynh...`, 'info')
                let successCount = 0
                let failCount = 0

                for (const student of absentStudents) {
                    const phone = student.zaloId || student.phone
                    if (!phone) { failCount++; continue }
                    try {
                        await sendAbsenceNotification(student.name, phone, date)
                        successCount++
                    } catch (err) {
                        console.error('SMS error:', err)
                        failCount++
                    }
                }

                if (successCount > 0) showToast(`Đã lưu và gửi ${successCount} SMS thành công!`, 'success')
                if (failCount > 0) showToast(`${failCount} tin nhắn thất bại`, 'warning')
            } else if (absentStudents.length > 0 && !isSmsConfigured()) {
                showToast('Điểm danh đã lưu! (Cấu hình SMS trong Cài đặt để gửi thông báo)', 'info')
            } else {
                showToast('Điểm danh đã được lưu!', 'success')
            }
        } catch (err) {
            showToast('Lỗi: ' + err.message, 'error')
        } finally {
            setLoading(false)
        }
    }

    const sortedStudents = [...students].sort((a, b) =>
        a.class.localeCompare(b.class) || a.name.localeCompare(b.name)
    )

    return (
        <section id="tab-attendance" className="tab-content active">
            <div className="tab-header">
                <h2>Điểm Danh Ngày</h2>
                <div className="attendance-date-picker">
                    <input type="date" className="date-input" value={date} onChange={e => setDate(e.target.value)} />
                </div>
            </div>

            <div className="attendance-actions">
                <button className="btn btn-secondary" onClick={markAllPresent}>
                    <span>✅</span> Tất cả có mặt
                </button>
                <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                    {loading ? <><span className="spinner"></span> Đang lưu...</> : <><span>💾</span> Lưu & Gửi Thông Báo</>}
                </button>
            </div>

            <div className="attendance-summary">
                <div className="summary-card present">
                    <span className="summary-icon">✅</span>
                    <span className="summary-count">{presentCount}</span>
                    <span className="summary-label">Có mặt</span>
                </div>
                <div className="summary-card absent">
                    <span className="summary-icon">❌</span>
                    <span className="summary-count">{absentCount}</span>
                    <span className="summary-label">Vắng</span>
                </div>
            </div>

            <div className="attendance-list">
                {students.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-state-icon">📋</span>
                        <h4>Chưa có học sinh</h4>
                        <p>Thêm học sinh ở tab "Học Sinh" trước</p>
                    </div>
                ) : (
                    <table className="data-table attendance-table">
                        <thead>
                            <tr>
                                <th style={{ width: '50px' }}>STT</th>
                                <th>Họ và tên</th>
                                <th style={{ width: '80px' }}>Lớp</th>
                                <th style={{ width: '200px' }}>Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedStudents.map((student, index) => {
                                const status = attendance[student.id] || 'present'
                                return (
                                    <tr key={student.id} className={status === 'absent' ? 'row-absent' : ''}>
                                        <td className="text-center">{index + 1}</td>
                                        <td>
                                            <div className="student-name-cell">
                                                <span className="student-avatar-sm">{student.avatar || '👤'}</span>
                                                <span>{student.name}</span>
                                            </div>
                                        </td>
                                        <td className="text-center"><span className="class-badge">{student.class}</span></td>
                                        <td>
                                            <div className="attendance-toggle">
                                                <button
                                                    className={`toggle-btn present ${status === 'present' ? 'active' : ''}`}
                                                    onClick={() => toggleAttendance(student.id, 'present')}
                                                >
                                                    ✅ Có mặt
                                                </button>
                                                <button
                                                    className={`toggle-btn absent ${status === 'absent' ? 'active' : ''}`}
                                                    onClick={() => toggleAttendance(student.id, 'absent')}
                                                >
                                                    ❌ Vắng
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </section>
    )
}
