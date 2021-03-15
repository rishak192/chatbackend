const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const User = new Schema({
    name: String,
    chatid:Object
});

const user = mongoose.model('user', User);
module.exports=user
