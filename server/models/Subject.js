const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
    subjectId: { 
        type: String, 
        required: true, 
        unique: true 
    },
    subjectName: { 
        type: String, 
        required: true 
    },
    credits: { 
        type: Number, 
        required: true 
    }
}, { timestamps: true });

module.exports = mongoose.model('Subject', SubjectSchema);
