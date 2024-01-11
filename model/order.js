const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userid: {
    type: mongoose.Schema.Types.ObjectId,
  },
  user: {
    type: String,
  },
  products: [
    {
      productid: {
        type: mongoose.Schema.Types.ObjectId,
      },
      product: {
        type: String,
      },
      price: {
        type: Number,
      },
      
      quantity: {
        type: Number,
      },
      status: {
        type: String,
      },
      discount: {
        type: String 
      },
    },
  ],

  addressid:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Address', 
   },
  address: {
    type:String,
  },
  paymentmethod: {
    type: String,
  },
  razorpaypaymentid: {
    type: String,
  },
  orderdate: {
    type: Date,
  },
  totalprice:{
    type:Number
  },


});

module.exports = mongoose.model('Order', orderSchema);
