// PDF Export Service using jsPDF
import { jsPDF } from 'jspdf';

// Export quiz to PDF
export function exportQuizToPDF(quiz, questions) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('BAI KIEM TRA TRAC NGHIEM TOAN', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    // Subtitle
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Khoi ${quiz.grade} - ${quiz.topic}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
    doc.text(`Thoi gian: 15 phut | So cau: ${questions.length}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Line
    doc.setDrawColor(200);
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 10;

    // Questions
    doc.setFontSize(11);
    questions.forEach((q, idx) => {
        // Check if we need a new page
        if (yPos > 270) {
            doc.addPage();
            yPos = 20;
        }

        // Question text
        doc.setFont('helvetica', 'bold');
        doc.text(`Cau ${idx + 1}: ${q.text}`, 20, yPos);
        yPos += 7;

        // Options
        doc.setFont('helvetica', 'normal');
        const letters = ['A', 'B', 'C', 'D'];
        q.options.forEach((opt, i) => {
            doc.text(`   ${letters[i]}. ${opt}`, 25, yPos);
            yPos += 6;
        });
        yPos += 5;
    });

    // Answer key on new page
    doc.addPage();
    yPos = 20;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DAP AN', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const letters = ['A', 'B', 'C', 'D'];

    // 4 columns layout for answers
    const colWidth = 40;
    let col = 0;
    questions.forEach((q, idx) => {
        const x = 25 + (col * colWidth);
        doc.text(`Cau ${idx + 1}: ${letters[q.correctIndex]}`, x, yPos);
        col++;
        if (col >= 4) {
            col = 0;
            yPos += 8;
        }
    });

    // Save
    const filename = `TracNghiem_Khoi${quiz.grade}_${Date.now()}.pdf`;
    doc.save(filename);
    return filename;
}

// Export attendance list to PDF
export function exportAttendanceToPDF(date, students, attendanceData) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Format date
    const dateStr = new Date(date).toLocaleDateString('vi-VN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    // Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('BANG DIEM DANH', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(dateStr, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Count summary
    let presentCount = 0;
    let absentCount = 0;
    students.forEach(s => {
        if (attendanceData[s.id] === 'absent') absentCount++;
        else presentCount++;
    });

    doc.text(`Tong so: ${students.length} | Co mat: ${presentCount} | Vang: ${absentCount}`, 20, yPos);
    yPos += 10;

    // Line
    doc.setDrawColor(200);
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 5;

    // Table header
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('STT', 25, yPos);
    doc.text('Ho va ten', 45, yPos);
    doc.text('Lop', 120, yPos);
    doc.text('Trang thai', 150, yPos);
    yPos += 3;
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 5;

    // Table rows
    doc.setFont('helvetica', 'normal');
    students.forEach((student, idx) => {
        if (yPos > 280) {
            doc.addPage();
            yPos = 20;
        }

        const status = attendanceData[student.id] === 'absent' ? 'Vang' : 'Co mat';
        doc.text(`${idx + 1}`, 25, yPos);
        doc.text(student.name.substring(0, 30), 45, yPos);
        doc.text(student.class, 120, yPos);
        doc.text(status, 150, yPos);
        yPos += 7;
    });

    // Save
    const dateKey = new Date(date).toISOString().split('T')[0];
    const filename = `DiemDanh_${dateKey}.pdf`;
    doc.save(filename);
    return filename;
}

// Export student list to PDF
export function exportStudentsToPDF(students) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('DANH SACH HOC SINH', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tong so: ${students.length} hoc sinh`, 20, yPos);
    yPos += 10;

    // Line
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 5;

    // Table header
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('STT', 25, yPos);
    doc.text('Ho va ten', 45, yPos);
    doc.text('Lop', 120, yPos);
    doc.text('Zalo PH', 145, yPos);
    yPos += 3;
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 5;

    // Table rows
    doc.setFont('helvetica', 'normal');
    students.forEach((student, idx) => {
        if (yPos > 280) {
            doc.addPage();
            yPos = 20;
        }

        doc.text(`${idx + 1}`, 25, yPos);
        doc.text(student.name.substring(0, 30), 45, yPos);
        doc.text(student.class, 120, yPos);
        doc.text((student.zaloId || '-').substring(0, 20), 145, yPos);
        yPos += 7;
    });

    // Save
    const filename = `DanhSachHocSinh_${Date.now()}.pdf`;
    doc.save(filename);
    return filename;
}
