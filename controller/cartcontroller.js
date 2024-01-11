const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cart = require("../model/cart");
const product = require("../model/product");
const category = require("../model/category");
const user = require("../model/user");
const order = require("../model/order");
const address = require("../model/address");
const offer = require("../model/offer");
const coupon = require("../model/coupon");
const wallet = require("../model/wallet");
const nocache = require("nocache");
const { find, findById, insertMany } = require("../model/order");
const { ordersget } = require("./profilecontroller");

app.use(nocache());

let controls = {
  cartget: async (req, res) => {
    const Userid = req.session.userid;
    const cartdetails = await cart.find({ userid: Userid });


    const offersForProducts = [];
    let Product ;
    for (const cartItem of cartdetails) {
      Product = await product.findById(cartItem.productid);
      const Category = await category.findById(Product.category);

      const Offer = await offer.findOne({
        $or: [
          { product: Product.productname },
          { category: Category.category },
        ],
      });

      offersForProducts.push({
        cart: cartItem,
        offer: Offer ? Offer : null,
      });

    }

    res.render("cart", { cartdetails, offers: offersForProducts, Userid ,Product });
  },

  addtocartget: async (req, res) => {
    const userid = req.session.userdetail._id;
    const productid = req.params.id;

    // Check if the product is already in the cart for the user
    const existingCartItem = await cart.findOne({
      userid: userid,
      productid: productid,
    });

    if (existingCartItem) {
      // Product is already in the cart, update the quantity
      existingCartItem.quantity += 1;
      await existingCartItem.save();
    } else {
      // Product is not in the cart, add a new entry
      const userdata = await user.findOne({ _id: userid });
      const productdata = await product.findOne({ _id: productid });

      const newcart = new cart({
        userid: userdata._id,
        username: userdata.name,
        productid: productdata._id,
        product: productdata.productname,
        price: productdata.price,
        quantity: 1,
        image: productdata.image[0],
      });

      await newcart.save();
    }

    res.redirect("/cartget");
  },

  increment: async (req, res) => {
    const itemId = req.params.id;

    try {
      const cartitem = await cart.findById(itemId);
      const productdetails = await product.findById(cartitem.productid);

      if (cartitem) {
      
        if (productdetails.stock < cartitem.quantity) {
          res
            .status(404)
            .json({ success: false, messagestock: "maximum stock reached" });
        } else {
          cartitem.quantity += 1;
          await cartitem.save();
          res.json({ success: true, updatecart: cartitem.quantity });
        }
      } else {
        res.status(404).json({ success: false, message: "Item not found" });
      }
    } catch (error) {
      console.error("Error:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  decrement: async (req, res) => {
    const itemId = req.params.id;

    try {
      const cartitem = await cart.findById(itemId);

      if (cartitem) {
        if (cartitem.quantity > 1) {
          cartitem.quantity -= 1;
          await cartitem.save();
          res.json({ success: true, updatecart: cartitem.quantity });
        } else if (cartitem.quantity === 1) {
          res.json({ success: true, updatecart: cartitem.quantity });
        } else {
          res.status(400).json({ success: false, message: "Invalid quantity" });
        }
      } else {
        res.status(404).json({ success: false, message: "Item not found" });
      }
    } catch (error) {
      console.error("Error:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  removecartget: async (req, res) => {
    try {
      const productId = req.params.id;
      await cart.findByIdAndDelete(productId);
      res.redirect("/cartget");
    } catch (error) {
      console.error("Error:", error.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  checkoutget: async (req, res) => {
    try {
      const Userid = req.session.userid;
      const userdet = await user.findOne({ _id: Userid });
      const cartitem = await cart.find({ userid: Userid });
      const Address = await address.find({ userid: Userid });

      const offersForProducts = [];
      let Product;
      for (const cartItem of cartitem) {
        Product = await product.findById(cartItem.productid);
        const Category = await category.findById(Product.category);

        const Offer = await offer.findOne({
          $or: [
            { product: Product.productname },
            { category: Category.category },
          ],
        });

        offersForProducts.push({
          cart: cartItem,
          offer: Offer ? Offer : null,
        });
      }

      const coupondet = await coupon.find();
      res.render("checkoutpage", {
        Product,
        cartitem,
        Address,
        coupondet,
        userdet,
        offers: offersForProducts,
      });
    } catch (error) {
      console.error("Error:", error.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  orderconfirmed: async (req, res) => {
    try {
      const userId = req.session.userid;
      const cartDetails = await cart.find({ userid: userId });
      const userinfo = await address.findOne({ userid: userId });
      const discountprice = parseFloat(req.body.discount);
      const onlinepay = req.body.paymentMethod;

      const Userid = req.session.userid;
      const cartitem = await cart.find({ userid: Userid });
      const Address = await address.find({ userid: Userid });
      const coupondet = await coupon.find();

      const productCollectionArray = [];

      for (const items of cartDetails) {
        const Product = await product.findById(items.productid);
        const Category = await category.findById(Product.category);

        const Offer = await offer.findOne({
          $or: [
            { product: Product.productname },
            { category: Category.category },
          ],
        });
        const offerdetails = Offer || null;

        const totalpriceoffer = offerdetails
          ? items.price - offerdetails.discount
          : items.price;

        const productInStock = await product.findOne({
          _id: items.productid,
          stock: { $gte: items.quantity },
        });

        if (!productInStock) {
          // Insufficient stock, send JSON response
          return res.render("checkoutpage", { cartitem, Address, coupondet });
        }

        const productData = {
          productid: items.productid,
          product: items.product,
          price: totalpriceoffer,
          quantity: items.quantity,
          status: "pending",
          discount: discountprice || 0,
        };

        // pushing the products as objects in the array
        productCollectionArray.push(productData);

        // Update product stock
        await product.updateOne(
          { _id: items.productid },
          { $inc: { stock: -items.quantity } }
        );
      }

      const totalOrderPrice = cartDetails.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );

      console.log("total order price is ", totalOrderPrice);

      const totalafterdis = totalOrderPrice - (discountprice || 0);

      console.log("total price after discount is ", totalafterdis);

      const orderData = new order({
        userid: req.session.userid,
        user: cartDetails[0].username,
        products: productCollectionArray,
        orderdate: new Date(),
        address: userinfo.address,
        paymentmethod: req.body.paymentSelect || onlinepay,
        totalprice: totalOrderPrice,
        addressid: userinfo._id,
      });

      // Create a single order document with an array of cart items
      await orderData.save();

      if (req.body.paymentSelect == "WALLET") {
        await user.updateOne(
          { _id: Userid },
          { $inc: { wallet: -totalafterdis } }
        );

        await wallet.insertMany({
          userid:Userid,
          amount:totalafterdis,
          date:new Date(),
          status: "Debited"
        })
      }

      await cart.deleteMany({ userid: userId });

      res.render("orderconfirmed");
    } catch (error) {
      console.error("Error:", error.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
};

module.exports = controls;
