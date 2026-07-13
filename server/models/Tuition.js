const mongoose = require('mongoose');

const TuitionSchema = new mongoose.Schema({
    student: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    semester: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Semester', 
        required: true 
    },
    totalFee: { 
        type: Number, 
        required: true 
    },
    discount: { 
        type: Number, 
        default: 0 
    },
    payableAmount: { 
        type: Number, 
        required: true 
    },
    paidAmount: { 
        type: Number, 
        default: 0 
    },
    debtAmount: { 
        type: Number, 
        required: true 
    },
    status: { 
        type: String, 
        enum: ['paid', 'partial', 'unpaid'], 
        default: 'unpaid' 
    }
}, { timestamps: true });

module.exports = mongoose.model('Tuition', TuitionSchema);
