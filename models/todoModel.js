const mongoose = require('mongoose')
const { Schema } = require('./userModel')
const schema = mongoose.Schema;

const todoSchema = new schema({
    todo : {
        type : String,
        required : true,
    },
    username : {
        type : String,
        required : true,
    }
    
},
{
    timpestamps : true,
});

module.exports = mongoose.model("todo", todoSchema);

