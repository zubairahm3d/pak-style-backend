
// customOrderController.js
const CustomOrder = require("../models/customOrderModel");

// Create new custom order
async function createCustomOrder(req, res) {
  try {
    // Convert string IDs to ObjectIds if needed
    const orderData = {
      ...req.body,
      status: 'pending',
      // Parse measurements as numbers
      measurements: {
        chest: parseFloat(req.body.measurements.chest),
        shoulder: parseFloat(req.body.measurements.shoulder),
        waist: parseFloat(req.body.measurements.waist),
        inseam: parseFloat(req.body.measurements.inseam),
        armLength: parseFloat(req.body.measurements.armLength),
        legLength: parseFloat(req.body.measurements.legLength)
      }
    };

    const newCustomOrder = await CustomOrder.create(orderData);
    
    res.status(201).json({
      success: true,
      data: newCustomOrder
    });
  } catch (error) {
    console.error('Custom order creation error:', error);
    
    // Handle specific error types
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid order data',
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'A duplicate order exists'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error while creating order'
    });
  }
}

// Get all custom orders with filtering options
async function getCustomOrders(req, res) {
  try {
    const filters = {};
    
    // Add optional filters
    if (req.query.designerId) filters.designerId = req.query.designerId;
    if (req.query.userId) filters.userId = req.query.userId;
    if (req.query.status) filters.status = req.query.status;

    const customOrders = await CustomOrder.find(filters)
      .sort({ createdAt: -1 }); // Sort by newest first

    res.status(200).json({
      success: true,
      count: customOrders.length,
      data: customOrders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server Error"
    });
  }
}

// Get single custom order by ID
async function getCustomOrderById(req, res) {
  try {
    const customOrder = await CustomOrder.findById(req.params.id);
    
    if (!customOrder) {
      return res.status(404).json({
        success: false,
        error: "Custom order not found"
      });
    }

    res.status(200).json({
      success: true,
      data: customOrder
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: "Custom order not found"
    });
  }
}

// Update custom order
async function updateCustomOrder(req, res) {
  try {
    const customOrder = await CustomOrder.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      {
        new: true,
        runValidators: true
      }
    );

    if (!customOrder) {
      return res.status(404).json({
        success: false,
        error: "Custom order not found"
      });
    }

    res.status(200).json({
      success: true,
      data: customOrder
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

// Delete custom order
async function deleteCustomOrder(req, res) {
  try {
    const customOrder = await CustomOrder.findById(req.params.id);

    if (!customOrder) {
      return res.status(404).json({
        success: false,
        error: "Custom order not found"
      });
    }

    await customOrder.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server Error"
    });
  }
}

// Update order status
async function updateOrderStatus(req, res) {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        error: "Status is required"
      });
    }

    const customOrder = await CustomOrder.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        updatedAt: Date.now()
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!customOrder) {
      return res.status(404).json({
        success: false,
        error: "Custom order not found"
      });
    }

    res.status(200).json({
      success: true,
      data: customOrder
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

module.exports = {
  createCustomOrder,
  getCustomOrders,
  getCustomOrderById,
  updateCustomOrder,
  deleteCustomOrder,
  updateOrderStatus
};
