const express = require("express");
const app = express();
const collection = require("../model/user");
const product = require("../model/product");
const Order = require("../model/order");
const Address = require("../model/address");
const path = require("path");
const multer = require("multer");
const nocache = require("nocache");
const { log } = require("console");
const PDFDocument = require("pdfkit-table");
const ExcelJS = require("exceljs");

app.use(nocache());

const controls = {
  // admin login routes

  loginget: (req, res) => {
    {
      res.render("adminlogin");
    }
  },

  loginpost: async (req, res) => {
    try {
      const credentials = {
        email: process.env.ADMINEMAIL,
        password: process.env.ADMINPASSWORD,
      };

      req.session.admindet = credentials;

      if (req.body.email.trim() === "" || req.body.password.trim() === "") {
        return res.status(400).json({ message: " " });
      }
      if (
        credentials.email === req.body.email &&
        credentials.password === req.body.password
      ) {
        res.json({ success: true, message: "", redirect: "/admin/dashboard" });
      } else {
        res
          .status(401)
          .json({ success: false, message: "Invalid email or password" });
      }
    } catch (error) {
      console.error("Error:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  // dashget:(req,res)=>{
  //   res.render('dashboard')
  // },

  usermgmtget: async (req, res) => {
    try {
      const datas = await collection.find();

      if (datas) {
        res.render("usermgmt", { datas });
      } else {
        res.render("usermgmt", { datas: [] });
      }
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  },

  blockUser: async (req, res) => {
    const id = req.params.id;
    const val = await collection.findOne({ _id: id });
    if (val) {
      val.isBlocked = !val.isBlocked;
      await val.save();
      res.redirect("/admin/usermanagement");
    } else {
      res.status(404).send("User not found");
    }
  },

  dashget: async (req, res) => {
    try {
      // for daily orderss

      const dailyOrders = await Order.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$orderdate" } },
            orderCount: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const { dates, orderCounts, totalOrderCount } = dailyOrders.reduce(
        (result, order) => {
          result.dates.push(order._id);
          result.orderCounts.push(order.orderCount);
          result.totalOrderCount += order.orderCount;
          return result;
        },
        { dates: [], orderCounts: [], totalOrderCount: 0 }
      );

      // for monthly orderss

      const monthlyOrders = await Order.aggregate([
        {
          $group: {
            _id: {
              year: { $year: "$orderdate" },
              month: { $month: "$orderdate" },
            },
            orderCount: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]);

      // Extract only the order counts
      const orderCount = monthlyOrders.map((order) => order.orderCount);

      const monthlyData = monthlyOrders.reduce((result, order) => {
        const monthYearString = `${order._id.year}-${String(
          order._id.month
        ).padStart(2, "0")}`;
        result.push({
          month: monthYearString,
          orderCount: order.orderCount,
        });
        return result;
      }, []);
      let monthdata = orderCount;

      // for yearly orders

      const yearlyOrders = await Order.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: "%Y", date: "$orderdate" } },
            orderCount: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const { years, orderCounts3, totalOrderCount3 } = yearlyOrders.reduce(
        (result, order) => {
          result.years.push(order._id);
          result.orderCounts3.push(order.orderCount);
          result.totalOrderCount3 += order.orderCount;
          return result;
        },
        { years: [], orderCounts3: [], totalOrderCount3: 0 }
      );
      res.render("dashboard", {
        dailyOrders,
        dates,
        orderCounts,
        monthdata,
        totalOrderCount3,
      });
    } catch (error) {
      console.error("Error fetching and aggregating orders:", error);
      res.status(500).send("Internal Server Error");
    }
  },

  getGeneratePdf: async (req, res) => {
    try {
      console.log("entereed the generate pdf");
      const startingDate = new Date(req.query.startingdate);
      const endingDate = new Date(req.query.endingdate);

      // Fetch orders within the specified date range
      const orders = await Order.find({
        orderdate: {
          $gte: startingDate,
          $lte: new Date(endingDate.getTime() + 86400000),
        },
        "products.status": "Delivered",
      });
      console.log('order',orders);
      let addressDetails;
      for (let address of orders) {
        addressDetails = await Address.find({_id:address.addressid});
      }
      console.log(addressDetails,"hereeeeee");
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

  getExcelReport: async (req, res) => {
    try {
      const startdate = new Date(req.query.startingdate);
      const Endingdate = new Date(req.query.endingdate);
      Endingdate.setDate(Endingdate.getDate() + 1);

      const orderCursor = await Order.aggregate([
        {
          $match: {
            orderdate: { $gte: startdate, $lte: Endingdate },
          },
        },
      ]);

      if (orderCursor.length === 0) {
        return res.redirect("/salesreport");
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Sheet 1");

      // Add data to the worksheet
      worksheet.columns = [
        { header: "Username", key: "username", width: 15 },
        { header: "Product Name", key: "productname", width: 20 },
        { header: "Quantity", key: "quantity", width: 15 },
        { header: "Price", key: "price", width: 15 },
        { header: "Status", key: "status", width: 15 },
        { header: "Order Date", key: "orderdate", width: 18 },
        { header: "Address", key: "address", width: 30 },
        { header: "City", key: "city", width: 20 }, // Add City column
        { header: "Pincode", key: "pincode", width: 15 }, // Add Pincode column
        { header: "Phone", key: "phone", width: 15 }, // Add Phone column
      ];

      for (const orderItem of orderCursor) {
        const addressDetails = await Address.findById(orderItem.addressid);
        for (const product of orderItem.products) {
          if (product.status === "Delivered") {
            worksheet.addRow({
              username: orderItem.user,
              productname: product.product,
              quantity: product.quantity,
              price: product.price,
              status: product.status,
              orderdate: orderItem.orderdate,
              address: addressDetails ? addressDetails.address : "N/A",
              city: addressDetails ? addressDetails.city : "N/A",
              pincode: addressDetails ? addressDetails.pincode : "N/A",
              phone: addressDetails ? addressDetails.phone : "N/A",
            });
          }
        }
      }

      // Generate the Excel file and send it as a response
      workbook.xlsx.writeBuffer().then((buffer) => {
        const excelBuffer = Buffer.from(buffer);
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader("Content-Disposition", "attachment; filename=excel.xlsx");
        res.send(excelBuffer);
      });
    } catch (error) {
      console.error("Error creating or sending Excel file:", error);
      res.status(500).send("Internal Server Error");
    }
  },

  bannerget: (req, res) => {
    res.render("banner");
  },

  logout: (req, res) => {
    // Destroy the session
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
      } else {
        res.redirect("/admin");
      }
    });
  },
};

module.exports = controls;
