// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, push, remove, onValue } from 'firebase/database';

const firebaseConfig = {
    apiKey: "AIzaSyAdZ6TrhlQ656ydInUNxtuwhodO9bg9oow",
    authDomain: "aisupportgv.firebaseapp.com",
    databaseURL: "https://aisupportgv-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "aisupportgv",
    storageBucket: "aisupportgv.firebasestorage.app",
    messagingSenderId: "981039830132",
    appId: "1:981039830132:web:3fd32a3f193182c7be6d21",
    measurementId: "G-TJ3DPWTV8S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Export app for other services (Email, etc.)
export function getApp() {
    return app;
}

// ================== STUDENTS ==================
export async function getStudents() {
    const snapshot = await get(ref(database, 'students'));
    if (snapshot.exists()) {
        const data = snapshot.val();
        return Object.keys(data).map(key => ({ id: key, ...data[key] }));
    }
    return [];
}

export async function addStudent(student) {
    const newRef = push(ref(database, 'students'));
    await set(newRef, {
        name: student.name,
        class: student.class,
        parentEmail: student.parentEmail || '',
        avatar: student.avatar || '👤',
        createdAt: Date.now()
    });
    return newRef.key;
}

export async function updateStudent(id, updates) {
    await set(ref(database, `students/${id}`), updates);
}

export async function deleteStudent(id) {
    await remove(ref(database, `students/${id}`));
}

export function subscribeToStudents(callback) {
    return onValue(ref(database, 'students'), (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            const students = Object.keys(data).map(key => ({ id: key, ...data[key] }));
            callback(students);
        } else {
            callback([]);
        }
    });
}

// ================== CLASSES ==================
export async function getClasses() {
    const snapshot = await get(ref(database, 'classes'));
    if (snapshot.exists()) {
        const data = snapshot.val();
        return Object.keys(data).map(key => ({ id: key, ...data[key] }));
    }
    return [];
}

export function subscribeToClasses(callback) {
    return onValue(ref(database, 'classes'), (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            const classes = Object.keys(data).map(key => ({ id: key, ...data[key] }));
            callback(classes);
        } else {
            callback([]);
        }
    });
}

export async function addClass(classData) {
    const newRef = push(ref(database, 'classes'));
    await set(newRef, {
        name: classData.name,
        teacher: classData.teacher || '',
        createdAt: Date.now()
    });
    return newRef.key;
}

export async function updateClass(id, updates) {
    await set(ref(database, `classes/${id}`), updates);
}

export async function deleteClass(id) {
    await remove(ref(database, `classes/${id}`));
}

// ================== ATTENDANCE ==================
export async function getAttendance(date) {
    const dateKey = formatDateKey(date);
    const snapshot = await get(ref(database, `attendance/${dateKey}`));
    if (snapshot.exists()) {
        return snapshot.val();
    }
    return {};
}

export async function saveAttendance(date, attendanceData) {
    const dateKey = formatDateKey(date);
    await set(ref(database, `attendance/${dateKey}`), {
        ...attendanceData,
        updatedAt: Date.now()
    });
}

export function subscribeToAttendance(date, callback) {
    const dateKey = formatDateKey(date);
    return onValue(ref(database, `attendance/${dateKey}`), (snapshot) => {
        if (snapshot.exists()) {
            callback(snapshot.val());
        } else {
            callback({});
        }
    });
}

// Get attendance for date range (for charts)
export async function getAttendanceRange(startDate, endDate) {
    const snapshot = await get(ref(database, 'attendance'));
    if (!snapshot.exists()) return {};

    const data = snapshot.val();
    const result = {};
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    Object.keys(data).forEach(dateKey => {
        const date = parseDateKey(dateKey);
        if (date >= start && date <= end) {
            result[dateKey] = data[dateKey];
        }
    });

    return result;
}

// ================== HOMEWORK ==================
export async function getHomework() {
    const snapshot = await get(ref(database, 'homework'));
    if (snapshot.exists()) {
        const data = snapshot.val();
        return Object.keys(data).map(key => ({ id: key, ...data[key] }));
    }
    return [];
}

export async function addHomework(homework) {
    const newRef = push(ref(database, 'homework'));
    await set(newRef, {
        ...homework,
        createdAt: Date.now()
    });
    return newRef.key;
}

export async function deleteHomework(id) {
    await remove(ref(database, `homework/${id}`));
}

// ================== QUIZZES ==================
export async function saveQuiz(quiz) {
    const newRef = push(ref(database, 'quizzes'));
    await set(newRef, {
        ...quiz,
        createdAt: Date.now()
    });
    return newRef.key;
}

export async function getQuizzes() {
    const snapshot = await get(ref(database, 'quizzes'));
    if (snapshot.exists()) {
        const data = snapshot.val();
        return Object.keys(data).map(key => ({ id: key, ...data[key] }));
    }
    return [];
}

export async function deleteQuiz(id) {
    await remove(ref(database, `quizzes/${id}`));
}

// ================== HELPERS ==================
function formatDateKey(date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseDateKey(dateKey) {
    const [year, month, day] = dateKey.split('-').map(Number);
    return new Date(year, month - 1, day).getTime();
}

export { database, formatDateKey };
