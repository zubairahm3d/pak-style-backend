const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  passwordConfirm: {
    type: String,
    required: true
  },
  userType: {
    type: String,
    enum: ['customer', 'designer', 'brand', 'admin'],
    required: true
  },
  profilePicture: {
    type: String,
    default: "https://res.cloudinary.com/drhzmuvil/image/upload/v1726947332/profile_pictures/fp6pmmmtbc5xcgiiukhp.png"
  },
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
  status: {
    type: String,
    enum: ['pending', 'active', 'inactive'],
    default: 'pending'
  },
  conversations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation'
  }],
  unreadMessages: {
    type: Number,
    default: 0
  },
  passwordChangedAt: Date
}, {
  timestamps: true
});

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

userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000; // Subtract 1 second to ensure the token is created after the password has been changed
  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;

