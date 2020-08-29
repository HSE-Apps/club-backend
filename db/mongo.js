const mongoose = require('mongoose')
const { config } = require('../config')



const setup = async () => {
    try{
        mongoose.connect(config.MONGO_URI,{useNewUrlParser: true, useUnifiedTopology: true})
    } catch(err) {
        console.log(err)
    }

}

setup()

const db = mongoose.connection

module.exports = db