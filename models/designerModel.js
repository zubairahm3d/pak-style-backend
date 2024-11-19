const mongoose = require("mongoose");

const designerSchema = new mongoose.Schema({
  designerId: { type: String, unique: true },
  name: String,
  username: String,
  email: String,
  password: String,
  passwordConfirm: String,
  userType: String,
  bio: String,
  profilePicture: String,
  coverImage: String,
  portfolio: [String],
  socialMedia: {
    instagram: String,
    facebook: String,
    twitter: String,
  },
});

const Designer = mongoose.model("Designer", designerSchema);

module.exports = Designer;
