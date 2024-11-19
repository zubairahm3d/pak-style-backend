const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userId: String,
  name: String,
  username: String,
  email: String,
  password: String,
  passwordConfirm: String,
  userType: String,
  profilePicture: String,
  portfolioImages: [String], 
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String,
  },
  phone: String,
  website: String,
  status: String,
});

const User = mongoose.model("User", userSchema);
userSchema.methods.changedPasswordAfter = function (JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimeStamp < changedTimestamp;
  }
  // False means password was not changed after token was issued
  return false;
};

module.exports = User;
