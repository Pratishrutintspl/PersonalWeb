const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true 
    },
    email:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        lowecase:true,
    },
    password:{
        type:String,
        required:true
    },
    refreshToken:{
        type:String,
        default:null
    }
},{
    timestamps:true
})

module.exports = mongoose.model("User",userSchema)