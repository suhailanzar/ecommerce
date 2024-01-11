const mongoose= require('mongoose')


const walletschema=new mongoose.Schema({
  

    userid:{
        type: mongoose.Schema.Types.ObjectId,
    },
    amount:{
        type:Number,
    },
    date:{
        type:Date
    },
    status:{
        type:String
    }

})



const collection =new mongoose.model('wallet',walletschema)
module.exports=collection;








