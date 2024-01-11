const mongoose =require('mongoose')

const cartschema = new mongoose.Schema({

    userid:{
        type:mongoose.Schema.ObjectId
    },
    username:{
        type: String
    },
    productid:{
        type:mongoose.Schema.ObjectId
    },
    product:{
        type:String
    },
    price:{
        type : Number
    },
    quantity:{
        type : Number
    },
    image : {
        type : String
    }
})

module.exports = mongoose.model('cart',cartschema)