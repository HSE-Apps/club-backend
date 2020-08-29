const mongoose = require('mongoose')

const User = new mongoose.Schema({
    clubs:{
        type: [mongoose.Schema.ObjectId],
        required: false
    },
    pendingClubs:{
        type: [mongoose.Schema.ObjectId],
        required: false
    }
})

module.exports = mongoose.model('User', User)