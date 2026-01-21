import React, { useState, useEffect, useRef } from 'react'
import { useToast } from '../../contexts/ToastContext'
import {
    subscribeToStudents,
    getAttendance,
    saveAttendance,
    getAttendanceRange
} from '../../services/firebase'
import { sendAbsenceNotification, isEmailConfigured } from '../../services/notification'
import { createAttendancePieChart, createWeeklyBarChart, generateWeekData, destroyCharts } from '../../services/charts'

export default function AttendanceTab() {
    const { showToast } = useToast()
    const [students, setStudents] = useState([])
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [attendance, setAttendance] = useState({})
    const [loading, setLoading] = useState(false)
    const [weeklyData, setWeeklyData] = useState(null)
    const pieChartRef = useRef(null)
    const barChartRef = useRef(null)
    const chartsInitialized = useRef(false)

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

    // Load weekly data for chart
    const loadWeeklyData = async () => {
        try {
            // Calculate date range for last 7 days
            const today = new Date()
            const startDate = new Date(today)
            startDate.setDate(startDate.getDate() - 6) // 6 days ago

            const formatDate = (d) => d.toISOString().split('T')[0]
            const attendanceByDate = await getAttendanceRange(formatDate(startDate), formatDate(today))
            const weekData = generateWeekData(attendanceByDate, students.length)
            setWeeklyData(weekData)
        } catch (err) {
            console.error('Error loading weekly data:', err)
        }
    }

    const presentCount = students.filter(s => attendance[s.id] !== 'absent').length
    const absentCount = students.filter(s => attendance[s.id] === 'absent').length

    // Render charts when data changes
    useEffect(() => {
        if (students.length > 0) {
            loadWeeklyData()
            // Render pie chart
            setTimeout(() => {
                createAttendancePieChart('today-chart', presentCount, absentCount)
            }, 100)
        }
        return () => destroyCharts()
    }, [students, attendance, presentCount, absentCount])

    // Render weekly chart when data available
    useEffect(() => {
        if (weeklyData) {
            setTimeout(() => {
                createWeeklyBarChart('weekly-chart', weeklyData)
            }, 100)
        }
    }, [weeklyData])


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

            if (absentStudents.length > 0 && isEmailConfigured()) {
                showToast(`Đang gửi Email cho ${absentStudents.length} phụ huynh...`, 'info')
                let successCount = 0
                let failCount = 0

                for (const student of absentStudents) {
                    if (!student.parentEmail) { failCount++; continue }
                    try {
                        const message = `Kính gửi Phụ huynh,\n\nNhà trường xin thông báo: Em ${student.name} lớp ${student.class} đã vắng mặt trong buổi học ngày ${new Date(date).toLocaleDateString('vi-VN')}.\n\nKính mong Quý Phụ huynh xác nhận lý do.\n\nTrân trọng,\nEduAssist`
                        await sendAbsenceNotification(student, date, message)
                        successCount++
                    } catch (err) {
                        console.error('Email error:', err)
                        failCount++
                    }
                }

                if (successCount > 0) showToast(`Đã lưu và gửi ${successCount} Email thành công!`, 'success')
                if (failCount > 0) showToast(`${failCount} email thất bại (thiếu email phụ huynh)`, 'warning')
            } else if (absentStudents.length > 0 && !isEmailConfigured()) {
                showToast('Điểm danh đã lưu! (Cấu hình Email trong Cài đặt để gửi thông báo)', 'info')
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

            {/* Charts Row */}
            <div className="charts-row">
                <div className="chart-card">
                    <canvas id="today-chart" style={{ maxHeight: '180px' }}></canvas>
                </div>
                <div className="chart-card chart-wide">
                    <canvas id="weekly-chart" style={{ maxHeight: '180px' }}></canvas>
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
