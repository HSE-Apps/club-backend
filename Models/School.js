const mongoose = require('mongoose')

const School = new mongoose.Schema({
    clubs:{
        type: [mongoose.Schema.ObjectId],
        required: false
    },
    settings:{
        teacherDomain:{
            type: String,
        },
        studentDomain:{
            type: String
        }
    },
    logo:{
        type: String,
        required: true
    },
    name:{
        type: String
    }
})

module.exports = mongoose.model('School', School)