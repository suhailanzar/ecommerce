const express = require("express");
const app = express();
const mongoose = require("mongoose");
const offer = require("../model/offer");
const Category = require("../model/category");
const Product = require("../model/product");

const nocache = require("nocache");

let controls = {
  getoffer: async (req, res) => {
    try {
      const offerdetails = await offer.find();

      res.render("offer", { offerdetails });
    } catch (error) {
      console.log(error);
    }
  },

  addoffer: async (req, res) => {
    try {
      const proddet = await Product.find({ isListed: true, isDeleted: false });
      const catdet = await Category.find({ isListed: true, isDeleted: false });

      res.render("addoffer", { catdet, proddet });
    } catch (error) {
      console.log(error);
    }
  },

  addofferpost: async (req, res) => {
    try {
      const { product, category, selectedDate, discount } = req.body;

      const newoffer = new offer({
        product: product,
        category: category,
        expiredate: selectedDate,
        discount: discount,
      });

      await newoffer.save();

      res.redirect("/getoffer");
    } catch (error) {
      console.log(error);
    }
  },


addoffercategory: async (req, res) => {
  try {

    // const proddet = await Product.find({ isListed: true, isDeleted: false });
    const catdet = await Category.find({ isListed: true, isDeleted: false });

    res.render('addoffercategory',{catdet})
   
  } catch (error) {
    console.log(error);
  }
},


updateofferget: async (req, res) => {
  try {

    const offerid = req.params.id

    const proddet = await Product.find({ isListed: true, isDeleted: false });
    const catdet = await Category.find({ isListed: true, isDeleted: false });
    const offerdet = await offer.find({_id:offerid})


    res.render('editoffer',{proddet,catdet,offerdet})
   
  } catch (error) {
    console.log(error);
  }
},

deleteoffer:async(req,res)=>{
  try {

    const offerId = req.params.id;

  
    const result = await offer.findByIdAndDelete({_id:offerId});
    res.redirect('/getoffer')
 
} catch (error) {
    console.error('Error deleting offer:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
}
},

}

module.exports = controls;
