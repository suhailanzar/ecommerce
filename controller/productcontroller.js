const express = require("express");
const app = express();
const mongoose = require("mongoose");
const product = require("../model/product");
const category = require("../model/category");
const nocache = require("nocache");

app.use(nocache());

const productcontrol = {
  productget: async (req, res) => {
    try {
      const prlist = await product
        .find({ isDeleted: false })
        .populate("category")
        .sort({ _id: -1 })
        .exec();

      res.render("productmgmt", { prlist });
    } catch (error) {
      console.log(error);
    }
  },

  productpost: async (req, res) => {
    try {
      const prlist = await product.find();
      res.render("productmgmt", { prlist });
    } catch (error) {
      console.log(error);
    }
  },

  addprodget: async (req, res) => {
    // if(req.session.data){
    try {
      const categorylist = await category.find();
      res.render("addproduct", { Categories: categorylist });
    } catch (error) {
      console.log(error);
    }
  },

  addprodpost: async (req, res) => {
    try {
      const {
        productname,
        category,
        price,
        model,
        description,
        stock,
        croppedImages,
      } = req.body;
      const prodata = new product({
        productname: productname,
        category: category,
        price: price,
        model: model,
        description: description,
        stock: stock,
        image: croppedImages || [], // Array of cropped image data
      });

      await prodata.save();
      res.redirect("/product");
    } catch (error) {
      if (
        error.code === 11000 &&
        error.keyPattern &&
        error.keyPattern.category
      ) {
        console.error(
          "Duplicate key error for category:",
          error.keyValue.category
        );
        res.status(500).send("Duplicate key error for category");
      } else {
        console.error("Error saving product:", error);
        res.status(500).send("Error saving product");
      }
    }
  },

  updateprodget: async (req, res) => {
    try {
      const id = req.params.id;
      const value = await product.findById(id);
      const categorylist = await category.find();
      const stringValue = value.category.toString();

      res.render("updateproduct", {
        value,
        Categories: categorylist,
        stringValue,
      });
    } catch (error) {
      console.log(error);
    }
  },

  removeproductpost: async (req, res) => {
    const productId = req.body.productId;
    const imageIndex = req.body.imageIndex;
    console.log(productId);
    try {
      const product1 = await product.findById(productId);
      if (!product1) {
        return res.status(404).send("Product not found");
      }
      if (imageIndex < 0 || imageIndex >= product1.image.length) {
        return res.status(400).send("Invalid image index");
      }
      product1.image.splice(imageIndex, 1);
      await product1.save();
      res.status(200).send("Image removed successfully");
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
  },

  updateprodpost: async (req, res) => {
    try {
      const id = req.params.id;
      const value = await product.findByIdAndUpdate(id, {
        productname: req.body.productname,
        category: req.body.category,
        price: req.body.price,
        model: req.body.model,
        description: req.body.description,
        stock: req.body.stock,
        // image: req.files.map(file => file.path.substring(6))
      });
      if (!value) {
        res.render("updateproduct", value);
      } else {
        if (req.files && req.files.length > 0) {
          const newImages = req.files.map((file) => file.path.substring(6));
          value.image = value.image.concat(newImages);
        }
        if (!value) {
          console.log("Product not found");
          res.status(404).send("Product not found");
          return;
        }
        await value.save();

        res.redirect("/product");
      }
    } catch (error) {
      console.log(error);
    }
  },

  deleteproductget: async (req, res) => {
    try {
      const id = req.params.id;
      const result = await product.findByIdAndDelete({ _id: id });

      if (result) {
        const prlist = await product.find();
        res.render("productmgmt", { prlist, msg: "deleted Successfully" });
        console.log("deleted");
      }
    } catch (err) {
      console.error("Error deleting product:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  listproduct: async (req, res) => {
    const id = req.params.id;
    const productdet = await product.findOne({ _id: id });
    if (productdet) {
      productdet.isListed = !productdet.isListed;
      await productdet.save();
      res.redirect("/product");
    } else {
      res.status(404).send("product not found");
    }
  },

  softdeleteproduct: async (req, res) => {
    const id = req.params.id;

    try {
      const productdet = await product.findOne({ _id: id });

      if (productdet) {
        // Soft delete by setting isDeleted to true
        productdet.isDeleted = true;

        await productdet.save();
        res.redirect("/product");
      } else {
        res.status(404).send("Product not found");
      }
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  },
};

module.exports = productcontrol;
