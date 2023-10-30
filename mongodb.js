const mongoose = require('mongoose')
var db = mongoose.connect('mongodb+srv://khushi2001:khushi123@cluster0.h5ec2bd.mongodb.net/NewsNest')
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