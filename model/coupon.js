 const mongoose= require('mongoose')

const couponschema = new mongoose.Schema({
    couponcode:{
        type:String
    },
    discount:{
        type:Number
    },
    expiredate:{
        type:Date
        
    },
    minamount:{
        type:Number
    }
})


const couponmodel= new mongoose.model('coupons',couponschema)
module.exports=couponmodel;