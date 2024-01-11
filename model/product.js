const mongoose= require('mongoose')
const Category=require('../model/category')
const {Schema , ObjectId }=mongoose


const productschema =new mongoose.Schema({
  productname:{
      type:String,
    },
    category:{
      type: ObjectId,
      ref: Category, 
      required:true,
      },
      price:{
        type:Number,
      },
      rating:{
        type:Number,
        default:0
    },
    model:{
        type:String,
        default:''
      },
      description:{
      type:String,
      },

      stock:{
        type:Number,
        },



      isListed:{
        type :Boolean,
        default:true
      
     },
     isDeleted:{
      type :Boolean,
      default:false
    
   },
    image:{
      type: [String],
      required:true
    },
  
   
   

  

})

const collection =new mongoose.model('products',productschema)
module.exports=collection;