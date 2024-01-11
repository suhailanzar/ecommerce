const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cart = require("../model/cart");
const Product = require("../model/product");
const User = require("../model/user");
const order = require("../model/order");
const wallet = require("../model/wallet");
const address = require("../model/address");

const nocache = require("nocache");

let controls = {
  orderget: async (req, res) => {
    const neworder = await order.find().sort({ orderdate: -1 });
    res.render("orders", { neworder });
  },

  ordercancel: async (req, res) => {
    try {
      const productid = req.params.productid;
      const orderid = req.params.orderid;

      const orderss = await order.findById(orderid);
      const noofproducts = orderss.products.length;

      let totalreturnprice = 0;
      let Userid;
      for (const product of orderss.products) {
        if (productid == product.productid) {
          const newdiscount = product.discount;

          const Productid = product.productid;
          const price = product.price;
          const Quantity = product.quantity;
          const Userobjid = orderss.userid;

          const afterdiscount = newdiscount / noofproducts;
          const returnprice = price * Quantity - afterdiscount;

          Userid = Userobjid.toString();

          await Product.updateOne(
            { _id: Productid },
            { $inc: { stock: +Quantity } }
          );

          totalreturnprice += returnprice;
        }
      }

      await wallet.insertMany({
        userid:Userid,
        amount:totalreturnprice,
        date:new Date(),
        status: "credited"
      })

      await User.updateOne(
        { _id: Userid },
        { $inc: { wallet: totalreturnprice } }
      );

      await order.updateOne(
        { _id: orderid, "products.productid": productid },
        { $set: { "products.$.status": "Cancelled" } }
      );
      res.redirect("/orders");
      return res.status(200);
    } catch (err) {
      console.error(err);

      return res.status(500).json({ error: "Failed to cancel order by user." });
    }
  },

  orderupdate: async (req, res) => {
    try {
      const productid = req.params.productid;
      const orderid = req.params.orderid;
      const newStatus = req.body.orderstatus;

      console.log("the stays osisj", newStatus);

      // Validate the received status
      if (
        !["Shipped", "Delivered", "Processing", "Pending"].includes(newStatus)
      ) {
        return res.status(400).json({ error: "Invalid status provided." });
      }

      await order.updateOne(
        { _id: orderid, "products.productid": productid },
        { $set: { "products.$.status": newStatus } }
      );

      res.redirect("/orders");
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to update order status." });
    }
  },
};

module.exports = controls;
