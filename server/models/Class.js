const mongoose = require('mongoose');

const ClassSchema = new mongoose.Schema({
    classId: { 
        type: String, 
        required: true, 
        unique: true 
    },
    subject: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Subject', 
        required: true 
    },
    instructor: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    semester: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Semester', 
        required: true 
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    schedules: [{
        dayOfWeek: { 
            type: Number, 
            required: true, 
            min: 2, 
            max: 8 
        },
        startPeriod: { 
            type: Number, 
            required: true, 
            min: 1, 
            max: 14 
        },
        endPeriod: { 
            type: Number, 
            required: true, 
            min: 1, 
            max: 14 
        },
        room: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Room',
            required: true
        }
    }],
    room: { 
        type: String,
        default: ''
    },
    maxStudents: { 
        type: Number, 
        required: true 
    },
    currentStudents: { 
        type: Number, 
        default: 0 
    }
}, { timestamps: true });

module.exports = mongoose.model('Class', ClassSchema);