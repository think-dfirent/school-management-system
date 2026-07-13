const mongoose = require('mongoose');

const EnrollmentSchema = new mongoose.Schema({
    student: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    class: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Class', 
        required: true 
    },
    semester: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Semester', 
        required: true 
    },
    attendanceScore: {
        type: Number,
        default: null
    },
    grades: {
        attendance: { type: Number, default: null },
        midterm: { type: Number, default: null },
        final: { type: Number, default: null },
        total: { type: Number, default: null },
        letterGrade: { type: String, default: null }
    },
    midtermScore: {
        type: Number,
        default: null
    },
    finalScore: {
        type: Number,
        default: null
    },
    totalScore: {
        type: Number,
        default: null
    },
    letterGrade: {
        type: String,
        default: null
    },
    status: {
        type: String,
        default: 'Chưa có điểm'
    }
}, { timestamps: true });

module.exports = mongoose.model('Enrollment', EnrollmentSchema);
