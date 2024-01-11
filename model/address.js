const mongoose = require('mongoose')
const {Schema,ObjectId}=mongoose

const addressschema = new mongoose.Schema({

userid:{
    type:ObjectId

},
firstname:{
    type:String
},
lastname:{
    type:String
},
address:{
    type:String
},
city:{
    type:String
},
state:{
    type:String
},
pincode:{
    type:Number
},
phone:{
    type:Number
},


})


module.exports = mongoose.model('address',addressschema)
