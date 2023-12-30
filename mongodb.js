const mongoose = require('mongoose')
var db = mongoose.connect('') //add mongodb link
    .then(() => {
        console.log("Database connected");
    })
    .catch(() => {
        console.log("Failed to connect Database");
    })

const LogInSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: false
    },
    lastName: {
        type: String,
        required: true
    },
    firstName: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    subscription: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
})

const collection = new mongoose.model("NewsCollection", LogInSchema)
module.exports = collection
