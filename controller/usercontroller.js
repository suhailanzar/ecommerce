const express = require("express");
const app = express();
const user = require("../model/user");
const nocache = require("nocache");
const nodemailer = require("nodemailer");
const product = require("../model/product");
const category = require("../model/category");
const wallet = require("../model/wallet");
const wishlist = require("../model/wishlist");
const offer = require("../model/offer");
const crypto = require("crypto");
const { MongoClient, ObjectId } = require("mongodb");
const bcrypt = require('bcryptjs');
const saltRounds = 10;

require("dotenv").config();

// Your application code goes here

app.use(nocache());

// OTP generator
const generateOTP = (length) => {
  const digits = "0123456789";
  let OTP = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, digits.length);
    OTP += digits[randomIndex];
  }

  return OTP;
};

// for generating the referal code for the user
function generateReferralCode(length) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const codeLength = length || 8; // Default length is 8 characters
  let referralCode = "";

  for (let i = 0; i < codeLength; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    referralCode += characters.charAt(randomIndex);
  }

  return referralCode;
}

// EmailSending
const sendOtpEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL, // Assuming you meant EMAIL instead of EMAIL_USER
    to: email,
    subject: "One-Time Password (OTP) for Authentication ",
    text: `Your Authentication OTP is: ${otp}`,
  };

  transporter.sendMail(mailOptions, async (error, info) => {
    if (error) {
      return console.error("Error:", error);
    }
    console.log("otp is :", otp);
    console.log("Email sent for resent:", info.response);
  });
};

//email validating function

function isEmailValid(email) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}

// phone number validating
function isPhoneNumberValid(phoneNumber) {
  const phoneRegex = /^\d{10}$/; // Matches exactly 10 digits (0-9)
  return phoneRegex.test(phoneNumber);
}

function isStrongPassword(password) {
  // Use a regular expression for strong password validation
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/;
  return passwordRegex.test(password);
}

const controls = {
  //home page routers

  homeroute: (req, res) => {
    userdet = req.session.userdetail;
    if (userdet) {
      res.redirect("/userpage");
    } else {
    res.render("userlogin");
    }
  },

  signinget: (req, res) => {
    userdet = req.session.userdetail;
    if (userdet) {
      res.redirect("/userpage");
    } else {
      res.render("userlogin");
    }
  },

  signinpost: async (req, res) => {
    try {
      const { email, password } = req.body;
      const userFound = await user.findOne({ email });
      req.session.userid = userFound ? userFound._id : null;

      if (
        !email ||
        !password ||
        email.trim() === "" ||
        password.trim() === ""
      ) {
        return res.status(400).json({ message: " " });
      }

      if (!isEmailValid(email)) {
        return res.status(400).json({ message: " " });
      }

      if (!userFound) {
        return res.status(403).json({ message: "User not found" });
      }

      const passwordMatch = await bcrypt.compare(password, userFound.password);

      if (userFound.isBlocked) {
        return res.status(403).json({ message: "User is blocked" });
      }

      if (passwordMatch) {
        req.session.userdetail = userFound;
        return res
          .status(200)
          .json({ success: true, redirect: "/userpage", message: "" });
      } else {
        return res.status(401).json({ message: "Invalid email or password" });
      }
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).json({ message: "" });
    }
  },

  //sign get
  signupget: (req, res) => {
    res.render("usersignup");
  },

  signuppost: async (req, res) => {
    try {
      let reffered = false;

      const data = {
        name: req.body.name,
        phone: req.body.phone,
        email: req.body.email,
        password: req.body.password,
        refcode: req.body.refcode,
      };

      console.log("entered referal cod3 is", data.refcode);

      req.session.usmail = data.email;
      const usermail = data.email;

      // req.session.userdata = data;

      if (!isEmailValid(data.email)) {
        return res.status(400).json({ message: "" });
      }

      if (data.name === null || data.name.trim() === "") {
        return res.status(400).json({ message: "Invalid name" });
      }

      if (!isPhoneNumberValid(data.phone)) {
        return res.status(400).json({ message: "Invalid phone number" });
      }

      if (!isStrongPassword(data.password)) {
        return res.status(400).json({ message: "" });
      }
      const reffereduser = await user.findOne({ refcode: data.refcode });

      if (reffereduser) {
        if (data.refcode === reffereduser.refcode) {
          reffered = true;
          console.log("Referral code exists");

       

          // Update the user's wallet
          reffereduser.wallet += 100;

          // Save the changes to the database
          await reffereduser.save();

          await wallet.insertMany({
            userid:reffereduser._id,
            amount: 100, 
            date:new Date(),
            status: "credited"
          })

        } else {
          return res
            .status(400)
            .json({ success: false, message: "Invalid referral code" });
        }
      }

      const userma = await user.findOne({ email: data.email });

      if (userma && userma.email == data.email) {
        return res
          .status(400)
          .json({ message: "Already have a user with this Email" });
      }

      const userph = await user.findOne({ phone: data.phone });
      if (userph && userph.phone == data.phone) {
        return res
          .status(400)
          .json({ message: "Already have a user with this phone number" });
      }

      const hashedPassword = await bcrypt.hash(data.password, saltRounds);

      const userdata = await user.findOne({ email: data.email });
      if (userdata === null) {
        const otp = generateOTP(4);
        req.session.otp = otp;

        const referralCode = generateReferralCode();

        // Save the user to the database with the hashed password
        const signupdetails = {
          name: data.name,
          phone: data.phone,
          email: data.email,
          password: hashedPassword,
          refcode: referralCode,
          wallet: reffered ? 50 : 0,
        };

        

        req.session.signupdetails = signupdetails;

        await sendOtpEmail(usermail, otp);
        return res
          .status(200)
          .json({
            success: true,
            redirect: "/otppage",
            message: "Signup successful",
          });
      } else {
        return res.status(400).json({ message: "Email already exists" });
      }
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Oops, something went wrong!!!!!!" });
    }
  },

  resendotpget: async (req, res) => {
    try {
      const enteredmail = req.session.usmail;

      if (!enteredmail) {
        console.error("Error: No recipients defined");
        return res
          .status(500)
          .json({ message: "Error: No recipients defined" });
      }

      // Generate a new OTP
      const newOtp = generateOTP(4);

      req.session.otp = newOtp;

      // Send the new OTP via email
      await sendOtpEmail(enteredmail, newOtp);

      return res
        .status(200)
        .render("otppage", { message: "OTP resent successfully" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Error resending OTP" });
    }
  },

  // otp page route

  otpget: (req, res) => {
    res.render("otppage");
  },

  otppost: async (req, res) => {
    try {
      console.log("otp is" + req.session.otp);
      console.log("entered otp is" + req.body.otpbox);

      if (req.session.otp == req.body.otpbox) {
        // OTP is correct, insert the user data
        await user.insertMany([req.session.signupdetails]);

        // Redirect to the specified URL
        res.redirect("/signin");
      } else {
        // Incorrect OTP, render the OTP page with an error message
        res.render("otppage", { message: "Incorrect OTP" });
      }
    } catch (error) {
      console.error("Error:", error);
      // Handle other errors, e.g., send a JSON response for server error
      res
        .status(500)
        .json({ success: false, message: "Oops, something went wrong!" });
    }
  },

  emailforgotget: (req, res) => {
    res.render("emailforgot");
  },

  // emailforgotpost route on the server side
  emailforgotpost: async (req, res) => {
    try {
      const enteredmail = req.body.email;
      req.session.usermail = enteredmail;

      const usermail = await user.findOne({ email: enteredmail });

      if (!usermail) {
        res
          .status(400)
          .json({ success: false, message: "Email does not exist" });
      } else {
        const otp = generateOTP(4);
        req.session.otpforget = otp;
        await sendOtpEmail(enteredmail, otp);

        res
          .status(200)
          .json({ success: true, redirect: "/otpforgotget", message: "" });
      }
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ success: false, message: "Oops, something went wrong!" });
    }
  },

  resendotpforgotget: async (req, res) => {
    const data = req.session.usermail;

    const newotp = generateOTP(4);
    console.log("resended otp is " + newotp);
    req.session.otpforget = newotp;
    await sendOtpEmail(data, newotp);
    res.redirect("/otpforgotget");
  },

  otpforgotget: (req, res) => {
    res.render("otpforgot");
  },

  otpforgotpost: (req, res) => {
    const typedotp = req.body.otpbox;
    if (req.session.otpforget == typedotp) {
      res.render("resetpassword");
    } else {
      res.render("otpforgot", { loginmessage: "wrong otp" });
    }
  },

  resetpasswordpost: async (req, res) => {
    const pass1 = req.body.pass;
    const pass2 = req.body.pass2;

    if (pass1 === pass2) {
      try {
        let usermail = req.session.usermail;
        const userFound = await user.findOne({ email: usermail });

        // Check for strong password
        if (!isStrongPassword(pass2)) {
          return res.status(400).json({ success: false, message: "" });
        }

        const hashedPassword = await bcrypt.hash(pass2, saltRounds);

        if (userFound) {
          userFound.password = hashedPassword;
          await userFound.save(); // Save the changes to the user document

          // Instead of redirecting, send a JSON response
          return res.json({
            success: true,
            redirect: "/signin",
            message: "Password reset successful",
          });
        } else {
          // User not found
          return res
            .status(404)
            .json({ success: false, message: "User not found" });
        }
      } catch (error) {
        console.error(error);
        return res
          .status(500)
          .json({ success: false, message: "Internal Server Error" });
      }
    } else {
      // Passwords don't match
      return res
        .status(400)
        .json({ success: false, message: "Passwords do not match" });
    }
  },

  searchproducts: async (req, res) => {
    try {
      const searchQuery = req.query.search;
      let productFilter = {};
      let categoryFilter = {};

      if (searchQuery == null) {
        const regexPattern = new RegExp(searchQuery, "i");

        // Find products matching the query
        productFilter = { isDeleted: false, isListed: true };

        // Find categories matching the query
        categoryFilter = { isListed: true, isDeleted: false };
      } else {
        const regexPattern = new RegExp(searchQuery, "i");

        // Find products matching the query
        productFilter = {
          productname: { $regex: regexPattern },
          isDeleted: false,
          isListed: true,
        };

        // Find categories matching the query
        categoryFilter = {
          category: { $regex: regexPattern },
          isListed: true,
          isDeleted: false,
        };
      }

      const matchingProducts = await product
        .find(productFilter)
        .populate("category");
      const matchingCategories = await category.find(categoryFilter);
      const response = {
        products: matchingProducts,
        categories: matchingCategories,
      };

      res.json(response);
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "Error while searaching." });
    }
  },

  homepageget: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 4;
      const userid = req.session.userid;
      const userdetails = await user.findOne({ _id: userid });

      const skip = (page - 1) * pageSize;

      const productsByCategory = await product.aggregate([
        {
          $match: { isListed: true },
        },
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "categoryInfo",
          },
        },
        {
          $unwind: "$categoryInfo",
        },
        {
          $group: {
            _id: "$categoryInfo.category",
            products: {
              $push: "$$ROOT",
            },
          },
        },
      ]);

      // Fetch paginated products
      const paginatedProducts = await product
        .find({ isListed: true, isDeleted: false })
        .skip(skip)
        .limit(pageSize);

      // Fetch total count of products
      const totalProducts = await product.countDocuments({
        isListed: true,
        isDeleted: false,
      });

      const totalPages = Math.ceil(totalProducts / pageSize);

      res.render("userpage", {
        userdetails,
        prod: paginatedProducts,
        currentPage: page,
        totalPages,
        pageSize,
        productsByCategory,
      });
    } catch (error) {
      console.error(error);
      res.status(500).render("error", { error: "Internal Server Error" });
    }
  },

  productpage: async (req, res) => {
    const prod = await product.findById({ _id: req.params.id });
    const cat = await category.findById({ _id: prod.category });

    const offerdet = await offer.find({
      $or: [{ product: prod.productname }, { category: cat.category }],
    });

    console.log("offer dertaisl are ", offerdet);

    const userid = req.session.userid;
    const userdetails = await user.findOne({ _id: userid });
    res.render("product", { prod, userdetails, offerdet });
  },

  categorypage: async (req, res) => {
    const catname = req.params.id;
    const categorydata = await category.find({ category: catname });

    // category data is in the array use map to retrieve it
    const extractedIds = categorydata.map((item) => item._id);
    myObjectIdString = extractedIds.toString();

    const productdata = await product.find({
      category: myObjectIdString,
      isListed: true,
      isDeleted: false,
    });

    res.render("categorypage", { productdata, catname });
  },

  sortedproduct: async (req, res) => {
    try {
      console.log("entered sort");
      let products;

      console.log("req order is ", req.body.order);

      if (req.body.order == "asc") {
        products = await product.find({}).sort({ price: 1 });
      } else if (req.body.order == "desc") {
        products = await product.find({}).sort({ price: -1 });
      } else {
        products = await product.find({});
      }
      res.json({ products: products, wishlist });
    } catch (err) {
      console.log("Error sorting products: ", err);
    }
  },

  logoutuser: (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error(err);
      }
      res.redirect("/signin");
    });
  },
};

module.exports = controls;
