const mongoose = require("mongoose");

const brandSchema = new mongoose.Schema({
  brandId: { type: String, unique: true },
  name: String,
  username: String,
  email: String,
  password: String,
  passwordConfirm: String,
  userType: String,
  description: String,
  logo: String,
  coverImage: String,
  socialMedia: {
    instagram: String,
    facebook: String,
    twitter: String,
  },
});

const Brand = mongoose.model("Brand", brandSchema);

module.exports = Brand;
