const mongoose = require('mongoose')

const Announcement = new mongoose.Schema({
    club:{
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    message:{
        type: String,
        required: true
    },
    date:{
        type: Date,
        default: Date.now()
    },
    senderName:{
        type: String,
        required: true
    }
})

module.exports = mongoose.model('Announcement', Announcement)