const express = require("express");
const mongoose = require("mongoose");
const app = express();
const nocache = require("nocache");
const coupon = require("../model/coupon");

const controls = {
  viewcouponget: async (req, res) => {
    try {
      const coupondet = await coupon.find().sort({ expiredate: 1 });
      res.render("viewcoupon", { coupondet });
    } catch (err) {
      console.log(Error);
    }
  },

  addcouponget: (req, res) => {
    try {
      res.render("addcoupon");
    } catch (err) {
      console.log(Error);
    }
  },

  addcouponpost: async (req, res) => {
    try {
      const newcoupon = new coupon({
        couponcode: req.body.couponcode,
        discount: req.body.discount,
        expiredate: req.body.selectedDate,
        minamount: req.body.minprice,
      });
      await newcoupon.save();

      res.redirect("/coupon");
    } catch (err) {
      console.log(Error);
    }
  },

  updatecouponget: async (req, res) => {
    try {
      const couponid = req.params.id;
      const coupondetails = await coupon.findById(couponid);
      res.render("updatecoupon", { coupondetails });
    } catch (err) {
      console.log(Error);
    }
  },

  updatecouponpost: async (req, res) => {
    try {
      const couponid = req.params.id;

      await coupon
        .findByIdAndUpdate(couponid, {
          couponcode: req.body.couponcode,
          discount: req.body.discount,
          expiredate: req.body.selectedDate,
          minamount: req.body.minprice,
        })
        .then((x) => {
          console.log("updated");
          res.redirect("/coupon");
        });
    } catch (err) {
      console.log(Error);
    }
  },

  deletecoupon: async (req, res) => {
    try {
      const couponId = req.params.id;

      console.log("coupon is ", couponId);

      const result = await coupon.findByIdAndDelete({ _id: couponId });
      res.redirect("/coupon");
    } catch (error) {
      console.error("Error deleting coupon:", error.message);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  validatecoupon: async (req, res) => {
    try {
      let currentDate = new Date();
      const couponcode = req.body.couponcode;

      if (req.session.coupon && couponcode == req.session.coupon) {
        return res.status(400).json({
          success: false,
          message: "Already applied Cant apply again !!",
        });
      }

      const coupondetails = await coupon.findOne({
        couponcode: { $regex: new RegExp(couponcode, "i") },
      });

      if (coupondetails && coupondetails.couponcode == couponcode) {
        if (
          coupondetails &&
          coupondetails.expiredate > currentDate &&
          couponcode == coupondetails.couponcode
        ) {
          const discountAmount = coupondetails.discount;
          const amountLimit = coupondetails.minamount;
          req.session.coupon = coupondetails.couponcode;

          return res.json({
            success: true,
            discount: discountAmount,
            amount: amountLimit,
          });
        } else {
          return res.status(400).json({
            success: false,
            message: "Coupon is expired",
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          message: "Entered Coupon is Invalid",
        });
      }
    } catch (error) {
      console.error("Error in couponcheck:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error during coupon validation.",
      });
    }
  },

  removecoupon: (req, res) => {
    try {
      console.log("entered remove coupon");
      if (req.session.coupon) {
        console.log("Coupon before removal:", req.session.coupon);
        req.session.coupon = null; // Assuming you're using Express session
        console.log("Couponafter removal:", req.session.coupon);

        return res.json({
          success: true,
          message: "Coupon removed successfully",
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "No coupon applied",
        });
      }
    } catch (error) {
      console.error("Error removing coupon:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error during coupon removal.",
      });
    }
  },
};

module.exports = controls;
