const mongoose = require('mongoose');

const DepartmentSchema = new mongoose.Schema({
    departmentId: { 
        type: String, 
        required: true, 
        unique: true 
    },
    departmentName: { 
        type: String, 
        required: true 
    }
}, { timestamps: true });

module.exports = mongoose.model('Department', DepartmentSchema);
