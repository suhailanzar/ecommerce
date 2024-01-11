const mongoose= require('mongoose')




const userschema=new mongoose.Schema({
    name:{
        type :String,
    },

    email:{
        type:String,
    },
    
    password:{
        type:String,
    },

    phone:{
        type:Number
    },

    isBlocked:{
        type:Boolean,
        default: false
    },
    image:{
        type: String,
      },

    wallet:{
        type:Number,
        default:0
    },
    refcode:{
        type:String
    }

})



const collection =new mongoose.model('signupuser',userschema)
module.exports=collection;








