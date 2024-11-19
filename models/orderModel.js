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
  }, // Example of generating unique IDs
  userId: String,
  totalPrice: Number,
  orderDate: Date,
  status: String,
  paymentMethod: String,
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String,
  },
  items: [itemSchema], // Array of items
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
