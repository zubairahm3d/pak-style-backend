// orderController.js
const Order = require("../models/orderModel");
const nodemailer = require("nodemailer");
const { createPaymentIntent, confirmPaymentIntent } = require("../stripeService");
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function createOrder(req, res) {
  try {
    const { userId, totalPrice, items, shippingAddress, paymentMethod } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    if (!totalPrice || totalPrice < 50) {
      return res.status(400).json({ 
        error: "Total price must be at least 50 PKR" 
      });
    }

    // Create a payment intent if payment method is credit card
    let paymentIntent = null;
    if (paymentMethod === 'credit_card') {
      paymentIntent = await createPaymentIntent(totalPrice);
    }

    const newOrder = await Order.create({
      userId,
      totalPrice,
      items,
      shippingAddress,
      paymentMethod,
      status: paymentMethod === 'cash_on_delivery' ? 'Pending' : 'Processing',
      paymentStatus: paymentMethod === 'credit_card' ? 'paid' : 'pending', // Updated this line
      stripePaymentIntentId: paymentIntent?.id,
      orderDate: new Date()
    });

    console.log("New Order Created:", newOrder);
    res.status(201).json({
      order: newOrder,
      paymentIntent: paymentIntent ? {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret
      } : null
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(400).json({ 
      error: error.message || "Failed to create order" 
    });
  }
}

async function confirmPayment(req, res) {
  const { orderId } = req.params;
  const { paymentIntentId, paymentMethodId } = req.body;

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ error: "Order has already been paid" });
    }

    // For cash on delivery, just update the status
    if (order.paymentMethod === 'cash_on_delivery') {
      order.paymentStatus = 'pending';
      order.status = 'Pending';
      await order.save();
      return res.json({ 
        message: "Cash on delivery order confirmed", 
        order 
      });
    }

    // For credit card payments, process with Stripe
    if (!paymentMethodId) {
      return res.status(400).json({ error: "Payment method is required" });
    }

    await stripe.paymentIntents.update(paymentIntentId, {
      payment_method: paymentMethodId,
    });

    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      order.paymentStatus = 'paid';
      order.status = 'Processing';
      await order.save();

      res.json({ 
        message: "Payment confirmed successfully", 
        order 
      });
    } else {
      res.status(400).json({ 
        error: `Payment unsuccessful. Status: ${paymentIntent.status}` 
      });
    }
  } catch (error) {
    console.error("Error confirming payment:", error);
    res.status(500).json({ 
      error: error.message || "An error occurred while confirming the payment" 
    });
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
  confirmPayment,
};

