const mongoose = require('mongoose');

const CourseMaterialSchema = new mongoose.Schema({
    class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    type: {
        type: String,
        enum: ['lecture', 'document', 'assignment'],
        required: true
    },
    fileUrl: {
        type: String,
        default: ''
    },
    s3Key: {
        type: String,
        default: ''
    },
    dueDate: {
        type: Date,
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('CourseMaterial', CourseMaterialSchema);
