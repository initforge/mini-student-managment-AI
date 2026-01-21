// Chart Service - Attendance visualization using Chart.js
import Chart from 'chart.js/auto';

// Create attendance summary chart (Có mặt vs Vắng)
export function createAttendancePieChart(canvasId, presentCount, absentCount) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    // Properly destroy existing chart using Chart.js getChart method
    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
        existingChart.destroy();
    }

    console.log('[Chart] Creating pie chart with Present:', presentCount, 'Absent:', absentCount);

    const ctx = canvas.getContext('2d');
    const chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Có mặt', 'Vắng'],
            datasets: [{
                data: [presentCount, absentCount],
                backgroundColor: [
                    '#10b981', // Green for present
                    '#ef4444'  // Red for absent
                ],
                borderColor: ['#fff', '#fff'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { family: 'Inter', size: 12 },
                        padding: 15
                    }
                },
                title: {
                    display: true,
                    text: 'Thống kê điểm danh hôm nay',
                    font: { family: 'Inter', size: 14, weight: '600' }
                }
            }
        }
    });

    return chart;
}

// Create weekly attendance bar chart
export function createWeeklyBarChart(canvasId, weekData) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    // Properly destroy existing chart
    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
        existingChart.destroy();
    }

    const ctx = canvas.getContext('2d');
    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: weekData.labels,
            datasets: [
                {
                    label: 'Có mặt',
                    data: weekData.present,
                    backgroundColor: '#10b981',
                    borderRadius: 4
                },
                {
                    label: 'Vắng',
                    data: weekData.absent,
                    backgroundColor: '#ef4444',
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: { display: false }
                },
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: { family: 'Inter', size: 11 },
                        boxWidth: 12,
                        padding: 10
                    }
                },
                title: {
                    display: true,
                    text: 'Điểm danh 7 ngày gần nhất',
                    font: { family: 'Inter', size: 14, weight: '600' }
                }
            }
        }
    });

    return chart;
}

// Generate week data from attendance records
export function generateWeekData(attendanceByDate, studentCount) {
    const today = new Date();
    const labels = [];
    const present = [];
    const absent = [];
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateKey = formatDateKey(date);
        const dayLabel = dayNames[date.getDay()];
        const dateNum = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;

        // Format: "T2 20/01"
        labels.push(`${dayLabel} ${dateNum}`);

        const dayData = attendanceByDate[dateKey] || {};
        let presentCount = 0;
        let absentCount = 0;

        Object.values(dayData).forEach(status => {
            if (status === 'present') presentCount++;
            else if (status === 'absent') absentCount++;
        });

        present.push(presentCount);
        absent.push(absentCount);
    }

    return { labels, present, absent };
}

function formatDateKey(date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Cleanup charts
export function destroyCharts() {
    if (attendanceChart) {
        attendanceChart.destroy();
        attendanceChart = null;
    }
    if (weeklyChart) {
        weeklyChart.destroy();
        weeklyChart = null;
    }
}
