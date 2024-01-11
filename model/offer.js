const mongoose= require('mongoose')
const {Schema , ObjectId }=mongoose
const Category = require('../model/category')


const offerschema =new mongoose.Schema({
  product:{
      type:String,
    },
    category:{
     type:String
      },
      expiredate:{
        type:Date,
      },
      discount:{
        type:Number,
        default:0
    },
    isactive:{
        type:String,
        default: true
      },
     
  

})

const collection =new mongoose.model('offer',offerschema)
module.exports=collection;