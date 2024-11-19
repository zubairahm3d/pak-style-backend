const Order = require("../models/orderModel");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
async function createOrder(req, res) {
  console.log("Received Order Data:", JSON.stringify(req.body, null, 2));
  try {
    const newOrder = await Order.create(req.body);
    console.log("New Order Created:", newOrder);
    res.json(newOrder);
  } catch (error) {
    console.error("Error creating order:", error); // Log the error
    res.status(400).json({ error: error.message });
  }
}

async function getOrders(req, res) {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getOrderById(req, res) {
  try {
    const order = await Order.findById(req.params.id);
    res.json(order);
  } catch (error) {
    res.status(404).json({ error: "Order not found" });
  }
}

async function updateOrder(req, res) {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedOrder);
  } catch (error) {
    res.status(404).json({ error: "Order not found" });
  }
}

async function updateOrderStatus(req, res) {
  const { id } = req.params; // Keep the order ID in params
  const { status, recipientEmail } = req.body; // Get status from request body
  const email = process.env.GMAIL_USER;
  const password = process.env.GMAIL_PASS;

  // Create the transporter object using SMTP settings
  const transporter = nodemailer.createTransport({
    service: "gmail",
    secure: true,
    auth: {
      user: email,
      pass: password,
    },
  });
  console.log(id, " : ", status, " : ", recipientEmail);

  // Check if the status is valid
  if (!["Pending", "Shipped", "Canceled"].includes(status)) {
    return res.status(400).json({
      error: "Invalid status. Use 'Pending', 'Shipped', or 'Canceled'.",
    });
  }

  try {
    // Setup email data
    const mailOptions = {
      from: email, // Sender address
      to: recipientEmail, // Recipient email
      subject: "Your Order Status", // Subject line
      text: `Your Order has been ${status}.`, // Plain text body
      html: `<p>Your Order has been ${status}. </p>`, // HTML body
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    // Find the order by ID and update the status
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status: status }, // Update only the shipping status
      { new: true }
    );

    // Check if the order was found and updated
    if (!updatedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(updatedOrder);
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while updating the order." });
  }
}

async function deleteOrder(req, res) {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    res.status(404).json({ error: "Order not found" });
  }
}

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  updateOrderStatus,
};
