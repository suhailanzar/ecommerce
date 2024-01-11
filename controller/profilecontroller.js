const express = require("express");
const mongoose = require("mongoose");
const app = express();
const Address = require("../model/address");
const User = require("../model/user");
const nocache = require("nocache");
const order = require("../model/order");
const Product = require("../model/product");
const address = require("../model/address");
const wallet = require("../model/wallet");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const PDFDocument = require("pdfkit-table");
const ExcelJS = require("exceljs");


app.use(nocache());

const controls = {
  profileget: async (req, res) => {
    const userid = req.session.userid;
    const userdetails = await User.findOne({ _id: userid });
    res.render("profile", { userdetails });
  },

  editprofileget: async (req, res) => {
    const userid = req.session.userid;
    const userdetails = await User.findOne({ _id: userid });
    res.render("editprofile", { userdetails });
  },

  editprofilepost: async (req, res) => {
    try {
      const userid = req.params.id;
      const userdetails = await User.findOne({ _id: userid });

      console.log("req.body:", req.body);
      console.log("req.file:", req.file);

      if (req.file) {
        await User.updateOne(
          { _id: userid },
          {
            $set: {
              name: req.body.name,
              image: req.file.path.substring(6),
            },
          }
        );

        res.redirect("/editprofileget");
      } else {
        await User.updateOne(
          { _id: userid },
          {
            $set: {
              name: req.body.name,
            },
          }
        );

        res.redirect("/profileget");
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  passwordreset: async (req, res) => {
    res.render("profileresetpassword");
  },

  passwordresetpost: async (req, res) => {
    try {
      const userid = req.session.userid;
      const userdetails = await User.findOne({ _id: userid });
      const userpass = userdetails.password;

      const passwordMatch = await bcrypt.compare(req.body.oldpass, userpass);

      if (passwordMatch) {
        if (req.body.newpass === req.body.confirmpass) {
          // Update the user's password
          const hashedPassword = await bcrypt.hash(
            req.body.newpass,
            saltRounds
          );

          userdetails.password = hashedPassword;
          await userdetails.save();

          return res.json({
            success: true,
            redirect: "/signin",
            message: "Password reset successfully",
          });
        } else {
          return res.status(400).json({
            success: false,
            message: "New password and confirm password doesnt match",
          });
        }
      } else {
        return res
          .status(400)
          .json({ success: false, message: "old password is wrong" });
      }
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  addressget: async (req, res) => {
    const userid = req.session.userdetail._id;
    const useraddress = await Address.find({ userid: userid });
    res.render("address", { useraddress });
  },

  editaddress: async (req, res) => {
    const newid = req.params.id;
    console.log("param id is : ", newid);
    const useraddress = await Address.findById({ _id: newid });
    console.log("edit address state is ", useraddress.state);
    res.render("editaddress", { useraddress });
  },

  editaddresspost: async (req, res) => {
    try {
      const newid = req.params.id; // Assuming you get the id from the route parameters
      console.log("params id is: ", newid);
      const { firstname, lastname, address, city, state, pincode, phone } =
        req.body;
      const objectId = new mongoose.Types.ObjectId(newid);

      // Use findOneAndUpdate to find and update the address by userid
      const updatedAddress = await Address.findByIdAndUpdate(objectId, {
        firstname: firstname,
        lastname: lastname,
        address: address,
        city: city,
        state: state,
        pincode: pincode,
        phone: phone,
      });

      if (!updatedAddress) {
        return res.status(404).send("Address not found");
      }
      await updatedAddress.save();
      res.redirect("/addressget");
    } catch (error) {
      console.error("Error:", error);
      res.status(500).send("Internal Server Error");
    }
  },

  deleteaddress: async (req, res) => {
    const addid = req.params.id;
    console.log("id for delete is", addid);

    await Address.findByIdAndDelete(addid);
    res.redirect("/addressget");
  },

  addaddressget: async (req, res) => {
    res.render("addaddress");
  },

  addresspost: async (req, res) => {
    try {
      const { firstname, lastname, address, city, state, pincode, phone } =
        req.body;
      const newid = req.session.userdetail._id;
      const newaddress = new Address({
        userid: newid,
        firstname: firstname,
        lastname: lastname,
        address: address,
        city: city,
        state: state,
        pincode: pincode,
        phone: phone,
      });

      await newaddress.save();
      res.redirect("/addressget");
    } catch (error) {
      console.error("Error:", error);
      res.status(500).send("Internal Server Error");
    }
  },

  ordersget: async (req, res) => {
    const userid = req.session.userid;
    const userorder = await order
      .find({ userid: userid })
      .sort({ orderdate: -1 });
    res.render("ordersuser", { userorder });
  },

  // order get and cancel ...........

  ordercancel: async (req, res) => {
    try {
      const userid = req.session.userdetail._id;
      const Productid = req.params.productid;
      const orderid = req.params.orderid;

      const orderss = await order.findById(orderid);
      const noofproducts = orderss.products.length;

      let totalreturnprice = 0;
      for (const product of orderss.products) {
        if (Productid == product.productid) {
          const newdiscount = product.discount;
          const price = product.price;
          const Productid = product.productid;
          const Quantity = product.quantity;

          const afterdiscount = newdiscount / noofproducts;
          const returnprice = price * Quantity - afterdiscount;

          console.log("new discount  is ", newdiscount);
          console.log("price is ", price);
          console.log("after discount is ", afterdiscount);
          console.log("no of products is ", noofproducts);
          console.log("return price is ", returnprice);

          await Product.updateOne(
            { _id: Productid },
            { $inc: { stock: +Quantity } }
          );

          totalreturnprice += returnprice;
        }
      }
      // wallet controlls

      await wallet.insertMany({
        userid:userid,
        amount:totalreturnprice,
        date:new Date(),
        status: "credited"
      })

      await User.updateOne(
        { _id: userid },
        { $inc: { wallet: totalreturnprice } }
      );

      await order.updateOne(
        { _id: orderid, "products.productid": Productid },
        { $set: { "products.$.status": "Cancelled" } }
      );

      res.redirect("/ordersget");
      return res.status(200);
    } catch (err) {
      console.error(err);

      return res.status(500).json({ error: "Failed to cancel order by user." });
    }
  },

  orderreturn: async (req, res) => {
    try {
      const userid = req.session.userdetail._id;
      const productid = req.params.productid;
      const orderid = req.params.orderid;

      const orderss = await order.findById(orderid);
      const noofproducts = orderss.products.length;

      let totalreturnprice = 0;

      for (const product of orderss.products) {
        if (productid == product.productid) {
          const newdiscount = product.discount;
          const price = product.price;
          const Productid = product.productid;
          const Quantity = product.quantity;

          const afterdiscount = newdiscount / noofproducts;
          const returnprice = price * Quantity - afterdiscount;

          await Product.updateOne(
            { _id: Productid },
            { $inc: { stock: +Quantity } }
          );

          totalreturnprice += returnprice;
        }
      }

      await wallet.insertMany({
        userid:userid,
        amount:totalreturnprice,
        date:new Date(),
        status: "credited"
      })

      await User.updateOne(
        { _id: userid },
        { $inc: { wallet: totalreturnprice } }
      );

      await order.updateOne(
        { _id: orderid, "products.productid": productid },
        { $set: { "products.$.status": "Returned" } }
      );

      res.redirect("/ordersget");
      return res.status(200);
    } catch (err) {
      console.error(err);

      return res.status(500).json({ error: "Failed to return order by user." });
    }
  },

  vieworder: async (req, res) => {
    try {
      const userid = req.session.userdetail._id;
      const Productid = req.params.productid;
      const Orderid = req.params.orderid;

      const productdetails = await Product.findOne({ _id: Productid });
      const Orderdetails = await order.find({ _id: Orderid });
      const userdetails = await User.findOne({ _id: userid });
      const useraddress = await address.findOne({ userid: userid });

      res.render("orderdetails", {
        userdetails,
        useraddress,
        productdetails,
        Orderdetails,
      });
    } catch (err) {
      console.error(err);
    }
  },



  
  getGeneratePdforder: async (req, res) => {
    try {

      const productid= req.params.id
      console.log("entereed the generate pdf");
      


      // Fetch orders within the specified date range
      const orders = await order.find({ "products.productid":productid,
      
        "products.status": "Delivered",
      });

      console.log("orders were",orders);

      let addressDetails;
      for (let address of orders) {
        addressDetails = await Address.findById(address.addressid);
      }
  
      // Create a PDF document
      const doc = new PDFDocument();
      const filename = "sales_report.pdf";

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      res.setHeader("Content-Type", "application/pdf");

      doc.pipe(res);

      // Add content to the PDF document
      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .text("Sales Report", { align: "center", margin: 10 });
   

      // Define the table data
      const tableData = {
        headers: [
          "Username",
          "Product Name",
          "Price",
          "Quantity",
          "Address",
          "City",
          "Pincode",
          "Phone",
        ],

        rows: orders.map((order) => [
          order.user,
          order.products
            .filter((product) => product.status === "Delivered")
            .map((product) => product.product)
            .join(", "),
          order.products
            .filter((product) => product.status === "Delivered")
            .map((product) => product.price)
            .join(", "),
          order.products
            .filter((product) => product.status === "Delivered")
            .map((product) => product.quantity)
            .join(", "),
          addressDetails.address,
          addressDetails.city,
          addressDetails.pincode,
          addressDetails.phone,
        ]),
      };

      // Draw the table
      await doc.table(tableData, {
        prepareHeader: () => doc.font("Helvetica-Bold"),
        prepareRow: () => doc.font("Helvetica"),
      });

      // Finalize the PDF document
      doc.end();
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).send("Internal Server Error");
    }
  },



  walletget: async (req, res) => {
    try {
      const userid = req.session.userdetail._id;
      const userdet = await User.findById(userid);
      const walletdetails = await wallet.find({userid:userid}).sort({ date: -1 });

      console.log("wallet of the user is ", walletdetails);

      res.render("wallet", { userdet,walletdetails });
    } catch (err) {
      console.error(err);

      return res.status(500).json({ error: "Failed to cancel order by user." });
    }
  },
};

module.exports = controls;
