const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: String,
  brandId: String,
  brandName: String,
  designerId: String,
  category: String,
  price: Number,
  description: String,
  search_count: Number,
  images: [String],
  sizes: [String],
  colors: [String],
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;