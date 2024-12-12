const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  productId: String,
  brandId: String,
  quantity: Number,
  color: String,
  size: String,
});

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true,
    default: () => new mongoose.Types.ObjectId(),
  },
  userId: String,
  totalPrice: Number,
  orderDate: Date,
  status: String,
  paymentMethod: String,
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  stripePaymentIntentId: String,
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String,
  },
  items: [itemSchema],
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;

