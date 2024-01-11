const mongoose= require('mongoose')


const categoryschema =new mongoose.Schema({
  
    category:{
      type:String,
      required:true
    },

    
    isListed:{
      type :Boolean,
      default:true
    
   },
   isDeleted:{
    type :Boolean,
    default:true
  
 },
    })

    
const collection =new mongoose.model('category',categoryschema)
module.exports=collection;
 