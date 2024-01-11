const mongoose= require('mongoose')




const userschema=new mongoose.Schema({
    userid:{
        type:mongoose.Schema.ObjectId
    },
    productid:{
        type:mongoose.Schema.ObjectId
    },
    product:{
        type:String
    },
    price:{
        type:String
    },
    image:{
        type:String
    }
 

})



const collection =new mongoose.model('wishlist',userschema)
module.exports=collection;


