const express = require("express");
const app = express();
const category = require("../model/category");
const nocache = require("nocache");

app.use(nocache());

const categorycontrol = {
  catget: async (req, res) => {
    const x = await category
      .find({ isDeleted: false })
      .sort({ _id: -1 })
      .exec();

    res.render("category", { datas: x });
  },

  updatecatget: async (req, res) => {
    const id = req.params.id;
    const x = await category.findById({ _id: id });
    res.render("updatecategory", { data: x });
  },

  updatecatpost: async (req, res) => {
    try {
      const id = req.params.id;
      const x = await category.findById({ _id: id });
      const cat = req.body.categoryname;

      const existing = await category.findOne({
        category: { $regex: new RegExp("^" + cat + "$", "i") },
      });
      if (existing) {
        res.render("updatecategory", {
          message: "category already  exists",
          data: x,
        });
      } else {
        await category
          .findByIdAndUpdate(id, {
            category: req.body.categoryname,
          })
          .then((x) => {
            console.log("updted " + x);
            res.redirect("/category");
          });
      }
    } catch (error) {
      console.log(error);
    }
  },

  // deletecatget:async(req,res)=>{
  //     try{

  //       const id = req.params.id
  //       const result = await category.findByIdAndDelete({_id:id})
  //       if(result){
  //           const x = await category.find()
  //           res.redirect('/category')
  //       }
  //     }catch(err){

  //       res.json({msg:err.message})
  //     }
  //   },

  addcatget: (req, res) => {
    res.render("addcategory");
  },

  postaddcat: async (req, res) => {
    const cat = req.body.categoryname;

    const existing = await category.findOne({
      category: { $regex: new RegExp("^" + cat + "$", "i") },
    });

    if (existing) {
      res.render("addcategory", { message: "category already  exists" });
    } else {
      const newcat = new category({
        category: cat,
      });
      newcat.save();
      res.redirect("/category");
    }
  },

  listcat: async (req, res) => {
    const id = req.params.id;

    const cat = await category.findOne({ _id: id });
    if (cat) {
      cat.isListed = !cat.isListed;
      console.log(cat.isListed);
      await cat.save();
      res.redirect("/category");
    } else {
      res.status(404).send("category not found");
    }
  },

  softdeletecat: async (req, res) => {
    const id = req.params.id;

    try {
      const catdet = await category.findOne({ _id: id });

      if (catdet) {
        catdet.isDeleted = true;

        await catdet.save();
        res.redirect("/category");
      } else {
        res.status(404).send("Product not found");
      }
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  },
};

module.exports = categorycontrol;
