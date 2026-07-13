const mongoose = require('mongoose');

const SemesterSchema = new mongoose.Schema({
    semesterId: { 
        type: String, 
        required: true, 
        unique: true 
    },
    semesterName: { 
        type: String, 
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
    registrationStartDate: { 
        type: Date, 
        required: true 
    },
    registrationEndDate: { 
        type: Date, 
        required: true 
    },
    isActive: { 
        type: Boolean, 
        default: false 
    }
}, { timestamps: true });

module.exports = mongoose.model('Semester', SemesterSchema);
