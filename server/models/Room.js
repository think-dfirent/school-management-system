const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true,
        unique: true
    },
    roomType: {
        type: String,
        enum: ['theory', 'lab'],
        default: 'theory'
    }
}, { timestamps: true });

module.exports = mongoose.model('Room', RoomSchema);
