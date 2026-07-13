const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
    class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    sessionNumber: {
        type: Number,
        required: true
    },
    records: [{
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        status: {
            type: String,
            enum: ['present', 'absent', 'excused'],
            required: true
        }
    }]
}, { timestamps: true });

// Dam bao Ensure no duplicate attendance for a class by session number
AttendanceSchema.index({ class: 1, sessionNumber: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
