const express = require("express");
const mongoose = require("mongoose");
const app = express();
const wishlist = require("../model/wishlist");
const user = require("../model/user");
const product = require("../model/product");

const nocache = require("nocache");

app.use(nocache());

const controls = {
  getWishlist: async (req, res) => {
    const userId = req.session.userdetail._id;
    const wishlistdet = await wishlist.find({});

    try {
      res.render("wishlist", { wishlistdet });
    } catch (error) {
      console.error("Error:", error.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  addToWishlist: async (req, res) => {
    const productId = req.params.id;
    const userId = req.session.userdetail._id;

    // Check if the product is already in the cart for the user
    const existingItem = await wishlist.findOne({
      userid: userId,
      productid: productId,
    });

    if (!existingItem) {
      const userdata = await user.findOne({ _id: userId });
      const productdata = await product.findOne({ _id: productId });

      const newcart = new wishlist({
        userid: userdata._id,
        productid: productdata._id,
        product: productdata.productname,
        price: productdata.price,
        image: productdata.image[0],
      });

      await newcart.save();
    }

    res.redirect("/getwishlist");
  },

  removewishget: async (req, res) => {
    try {
      const productId = req.params.id;
      await wishlist.findByIdAndDelete(productId);
      res.redirect("/getwishlist");
    } catch (error) {
      console.error("Error:", error.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
};

module.exports = controls;
