const mongoose = require('mongoose')

const Announcement = new mongoose.Schema({
    club:{
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    seen:{
        type: [mongoose.Schema.Types.ObjectId],
        default: []
    },
    message:{
        type: String,
        required: true
    }
})

module.exports = mongoose.model('Announcement', Announcement)