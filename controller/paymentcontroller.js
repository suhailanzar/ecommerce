const express = require("express");
const mongoose = require("mongoose");
const app = express();
const nocache = require("nocache");
const Razorpay = require("razorpay");

app.use(nocache());

const controls = {
  razorpaygetpost: (req, res) => {
    try {
      let instance = new Razorpay({
        key_id: process.env.KEYID,
        key_secret: process.env.KEYSECRET,
      });
      let options = {
        amount: Amount * 100,
        currency: "INR",
        receipt: "order_rcptid_11",
      };

      // Creating the order
      instance.orders.create(options, function (err, order) {
        if (err) {
          console.error(err);
          res.status(500).send("Error creating order");
          return;
        }

        console.log(order);
        // Add order details to the response object
        res.send({ orderId: order.id });
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  },
};

module.exports = controls;
