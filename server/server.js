const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Khoi tao app Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import Routes (Khai bao cac file routes cua ban o day)
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const classRoutes = require('./routes/classRoutes');
const semesterRoutes = require('./routes/semesterRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const gradeRoutes = require('./routes/gradeRoutes');
const tuitionRoutes = require('./routes/tuitionRoutes');
const supportRoutes = require('./routes/supportRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const materialRoutes = require('./routes/materialRoutes');
const roomRoutes = require('./routes/roomRoutes');
const adminGradeRoutes = require('./routes/adminGradeRoutes');
// Ket noi co so du lieu MongoDB
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected Successfully: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1); 
    }
};

connectDB();


// KHU VUC register CAC DUONG DAN API (API ENDPOINTS)

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/semesters', semesterRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/tuition', tuitionRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/admin/grades', adminGradeRoutes);
// API Test co ban
app.get('/', (req, res) => {
    res.send('School Management System API is running...');
});

// Lang nghe port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});