import React, { useState, useEffect } from 'react'
import { useToast } from '../../contexts/ToastContext'
import Modal from '../Modal'
import {
    subscribeToStudents,
    subscribeToClasses,
    addStudent,
    updateStudent,
    deleteStudent,
    addClass,
    updateClass,
    deleteClass
} from '../../services/firebase'

export default function StudentsTab() {
    const { showToast } = useToast()
    const [students, setStudents] = useState([])
    const [classes, setClasses] = useState([])
    const [activeTab, setActiveTab] = useState('classes')
    const [search, setSearch] = useState('')
    const [filterClass, setFilterClass] = useState('')

    // Modal states
    const [showAddStudent, setShowAddStudent] = useState(false)
    const [showEditStudent, setShowEditStudent] = useState(false)
    const [showAddClass, setShowAddClass] = useState(false)
    const [editingStudent, setEditingStudent] = useState(null)

    // Form states
    const [studentForm, setStudentForm] = useState({ name: '', class: '', zaloId: '' })
    const [classForm, setClassForm] = useState({ name: '', teacher: '' })

    useEffect(() => {
        const unsubStudents = subscribeToStudents(setStudents)
        const unsubClasses = subscribeToClasses(setClasses)
        return () => {
            unsubStudents?.()
            unsubClasses?.()
        }
    }, [])

    // Filter students
    const filteredStudents = students.filter(s => {
        const matchSearch = s.name.toLowerCase().includes(search.toLowerCase())
        const matchClass = !filterClass || s.class === filterClass
        return matchSearch && matchClass
    }).sort((a, b) => a.class.localeCompare(b.class) || a.name.localeCompare(b.name))

    // CRUD: Add Student
    const handleAddStudent = async () => {
        if (!studentForm.name || !studentForm.class) {
            showToast('Vui lòng điền đầy đủ thông tin', 'error')
            return
        }
        try {
            await addStudent({
                name: studentForm.name,
                class: studentForm.class,
                zaloId: studentForm.zaloId || '',
                avatar: Math.random() > 0.5 ? '👦' : '👧'
            })
            setShowAddStudent(false)
            setStudentForm({ name: '', class: '', zaloId: '' })
            showToast(`Đã thêm học sinh ${studentForm.name}`, 'success')
        } catch (err) {
            showToast('Lỗi: ' + err.message, 'error')
        }
    }

    // CRUD: Edit Student
    const handleEditStudent = async () => {
        if (!studentForm.name || !studentForm.class) {
            showToast('Vui lòng điền đầy đủ thông tin', 'error')
            return
        }
        try {
            await updateStudent(editingStudent.id, {
                name: studentForm.name,
                class: studentForm.class,
                zaloId: studentForm.zaloId || '',
                avatar: editingStudent.avatar || '👤',
                createdAt: editingStudent.createdAt || Date.now()
            })
            setShowEditStudent(false)
            setEditingStudent(null)
            setStudentForm({ name: '', class: '', zaloId: '' })
            showToast(`Đã cập nhật học sinh ${studentForm.name}`, 'success')
        } catch (err) {
            showToast('Lỗi: ' + err.message, 'error')
        }
    }

    // CRUD: Delete Student
    const handleDeleteStudent = async (student) => {
        if (!confirm(`Xác nhận xóa học sinh ${student.name}?`)) return
        try {
            await deleteStudent(student.id)
            showToast(`Đã xóa học sinh ${student.name}`, 'success')
        } catch (err) {
            showToast('Lỗi: ' + err.message, 'error')
        }
    }

    // CRUD: Add Class
    const handleAddClass = async () => {
        if (!classForm.name) {
            showToast('Vui lòng nhập tên lớp', 'error')
            return
        }
        if (classes.find(c => c.name.toLowerCase() === classForm.name.toLowerCase())) {
            showToast('Lớp này đã tồn tại', 'error')
            return
        }
        try {
            await addClass({ name: classForm.name, teacher: classForm.teacher || '' })
            setShowAddClass(false)
            setClassForm({ name: '', teacher: '' })
            showToast(`Đã thêm lớp ${classForm.name}`, 'success')
        } catch (err) {
            showToast('Lỗi: ' + err.message, 'error')
        }
    }

    // CRUD: Edit Class
    const handleEditClass = async (cls) => {
        const newName = prompt('Tên lớp mới:', cls.name)
        if (!newName || newName === cls.name) return
        const newTeacher = prompt('Giáo viên chủ nhiệm:', cls.teacher || '')
        try {
            await updateClass(cls.id, { name: newName, teacher: newTeacher || '', createdAt: cls.createdAt || Date.now() })
            showToast(`Đã cập nhật lớp ${newName}`, 'success')
        } catch (err) {
            showToast('Lỗi: ' + err.message, 'error')
        }
    }

    // CRUD: Delete Class (cascade delete students)
    const handleDeleteClass = async (cls) => {
        const studentsInClass = students.filter(s => s.class === cls.name)
        const confirmMsg = studentsInClass.length > 0
            ? `Xác nhận xóa lớp ${cls.name} và ${studentsInClass.length} học sinh trong lớp?`
            : `Xác nhận xóa lớp ${cls.name}?`
        if (!confirm(confirmMsg)) return
        try {
            // Cascade delete students first
            for (const student of studentsInClass) {
                await deleteStudent(student.id)
            }
            await deleteClass(cls.id)
            const msg = studentsInClass.length > 0
                ? `Đã xóa lớp ${cls.name} và ${studentsInClass.length} học sinh`
                : `Đã xóa lớp ${cls.name}`
            showToast(msg, 'success')
        } catch (err) {
            showToast('Lỗi: ' + err.message, 'error')
        }
    }

    const openEditStudent = (student) => {
        setEditingStudent(student)
        setStudentForm({ name: student.name, class: student.class, zaloId: student.zaloId || '' })
        setShowEditStudent(true)
    }

    return (
        <section id="tab-students" className="tab-content active">
            {/* Mini Tabs */}
            <div className="mini-tabs">
                <button className={`mini-tab ${activeTab === 'classes' ? 'active' : ''}`} onClick={() => setActiveTab('classes')}>
                    📁 Quản lý Lớp
                </button>
                <button className={`mini-tab ${activeTab === 'students' ? 'active' : ''}`} onClick={() => setActiveTab('students')}>
                    👥 Danh sách Học Sinh
                </button>
            </div>

            {/* Classes Tab */}
            {activeTab === 'classes' && (
                <div className="mini-tab-content active">
                    <div className="tab-header">
                        <h2>Quản Lý Lớp</h2>
                        <button className="btn btn-primary" onClick={() => setShowAddClass(true)}>
                            <span>➕</span> Thêm Lớp
                        </button>
                    </div>
                    <div className="classes-grid" id="classes-list">
                        {classes.length === 0 ? (
                            <div className="empty-state">
                                <span className="empty-state-icon">📁</span>
                                <h4>Chưa có lớp nào</h4>
                                <p>Nhấn "Thêm Lớp" để bắt đầu</p>
                            </div>
                        ) : (
                            classes.map(cls => {
                                const studentCount = students.filter(s => s.class === cls.name).length
                                return (
                                    <div key={cls.id} className="class-card" onClick={() => { setFilterClass(cls.name); setActiveTab('students') }}>
                                        <div className="class-actions">
                                            <button className="btn-icon-sm edit" onClick={(e) => { e.stopPropagation(); handleEditClass(cls) }} title="Sửa">✏️</button>
                                            <button className="btn-icon-sm delete" onClick={(e) => { e.stopPropagation(); handleDeleteClass(cls) }} title="Xóa">🗑️</button>
                                        </div>
                                        <div className="class-name">Lớp {cls.name}</div>
                                        <div className="class-meta">
                                            <span>👥 {studentCount} học sinh</span>
                                            {cls.teacher && <span>• {cls.teacher}</span>}
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            )}

            {/* Students Tab */}
            {activeTab === 'students' && (
                <div className="mini-tab-content active">
                    <div className="tab-header">
                        <h2>Danh Sách Học Sinh</h2>
                        <button className="btn btn-primary" onClick={() => setShowAddStudent(true)}>
                            <span>➕</span> Thêm Học Sinh
                        </button>
                    </div>

                    <div className="search-filter-bar">
                        <div className="search-box">
                            <span className="search-icon">🔍</span>
                            <input type="text" placeholder="Tìm kiếm học sinh..." value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <div className="filter-group">
                            <select className="select-input" value={filterClass} onChange={e => setFilterClass(e.target.value)}>
                                <option value="">Tất cả lớp</option>
                                {classes.map(c => <option key={c.id} value={c.name}>Lớp {c.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="students-grid">
                        {filteredStudents.length === 0 ? (
                            <div className="empty-state">
                                <span className="empty-state-icon">👥</span>
                                <h4>Chưa có học sinh</h4>
                                <p>Nhấn "Thêm Học Sinh" để bắt đầu</p>
                            </div>
                        ) : (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '8%' }}>STT</th>
                                        <th style={{ width: '30%' }}>Họ và tên</th>
                                        <th style={{ width: '12%' }}>Lớp</th>
                                        <th style={{ width: '30%' }}>SĐT Phụ huynh</th>
                                        <th style={{ width: '20%' }}>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.map((student, index) => (
                                        <tr key={student.id}>
                                            <td className="text-center">{index + 1}</td>
                                            <td>
                                                <div className="student-name-cell">
                                                    <span className="student-avatar-sm">{student.avatar || '👤'}</span>
                                                    <strong>{student.name}</strong>
                                                </div>
                                            </td>
                                            <td className="text-center"><span className="class-badge">{student.class}</span></td>
                                            <td className="zalo-cell">{student.zaloId || <span className="text-muted">—</span>}</td>
                                            <td className="text-center">
                                                <div className="action-btns">
                                                    <button className="btn-icon-sm edit" onClick={() => openEditStudent(student)} title="Sửa">✏️</button>
                                                    <button className="btn-icon-sm delete" onClick={() => handleDeleteStudent(student)} title="Xóa">🗑️</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        {filteredStudents.length > 0 && (
                            <div className="table-footer">
                                <span>Tổng: <strong>{filteredStudents.length}</strong> học sinh</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Add Student Modal */}
            <Modal show={showAddStudent} onClose={() => setShowAddStudent(false)} title="Thêm Học Sinh Mới">
                <div className="form-group">
                    <label>Họ và tên <span className="required">*</span></label>
                    <input type="text" placeholder="Nguyễn Văn A" value={studentForm.name} onChange={e => setStudentForm({ ...studentForm, name: e.target.value })} />
                </div>
                <div className="form-group">
                    <label>Lớp <span className="required">*</span></label>
                    <select className="select-input" value={studentForm.class} onChange={e => setStudentForm({ ...studentForm, class: e.target.value })}>
                        <option value="">Chọn lớp</option>
                        {classes.map(c => <option key={c.id} value={c.name}>Lớp {c.name}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label>SĐT Phụ huynh</label>
                    <input type="tel" placeholder="0901234567" value={studentForm.zaloId} onChange={e => setStudentForm({ ...studentForm, zaloId: e.target.value })} />
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={() => setShowAddStudent(false)}>Hủy</button>
                    <button className="btn btn-primary" onClick={handleAddStudent}>Lưu</button>
                </div>
            </Modal>

            {/* Edit Student Modal */}
            <Modal show={showEditStudent} onClose={() => setShowEditStudent(false)} title="Chỉnh Sửa Học Sinh">
                <div className="form-group">
                    <label>Họ và tên <span className="required">*</span></label>
                    <input type="text" value={studentForm.name} onChange={e => setStudentForm({ ...studentForm, name: e.target.value })} />
                </div>
                <div className="form-group">
                    <label>Lớp <span className="required">*</span></label>
                    <select className="select-input" value={studentForm.class} onChange={e => setStudentForm({ ...studentForm, class: e.target.value })}>
                        <option value="">Chọn lớp</option>
                        {classes.map(c => <option key={c.id} value={c.name}>Lớp {c.name}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label>SĐT Phụ huynh</label>
                    <input type="tel" value={studentForm.zaloId} onChange={e => setStudentForm({ ...studentForm, zaloId: e.target.value })} />
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={() => setShowEditStudent(false)}>Hủy</button>
                    <button className="btn btn-primary" onClick={handleEditStudent}>Cập nhật</button>
                </div>
            </Modal>

            {/* Add Class Modal */}
            <Modal show={showAddClass} onClose={() => setShowAddClass(false)} title="Thêm Lớp Mới">
                <div className="form-group">
                    <label>Tên lớp <span className="required">*</span></label>
                    <input type="text" placeholder="VD: 8A, 9B, 10C..." value={classForm.name} onChange={e => setClassForm({ ...classForm, name: e.target.value })} />
                </div>
                <div className="form-group">
                    <label>Giáo viên chủ nhiệm</label>
                    <input type="text" placeholder="Nguyễn Văn B" value={classForm.teacher} onChange={e => setClassForm({ ...classForm, teacher: e.target.value })} />
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={() => setShowAddClass(false)}>Hủy</button>
                    <button className="btn btn-primary" onClick={handleAddClass}>Lưu</button>
                </div>
            </Modal>
        </section>
    )
}
