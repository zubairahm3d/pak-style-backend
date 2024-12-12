const CustomOrder = require("../models/customOrderModel");
const mongoose = require("mongoose");

// Helper function to generate a unique customOrderId
const generateUniqueOrderId = async () => {
  const timestamp = Date.now().toString();
  const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `CO-${timestamp}-${randomNum}`;
};

// Helper function to retry operations
const retryOperation = async (operation, maxRetries = 5) => {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.log(`Attempt ${attempt} failed: ${error.message}`);
      lastError = error;
      if (attempt === maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
    }
  }
};

// Create new custom order
const createCustomOrder = async (req, res) => {
  const createOrderOperation = async () => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const customOrderId = await generateUniqueOrderId();
      const orderData = {
        ...req.body,
        customOrderId,
        status: 'pending',
        measurements: {
          chest: parseFloat(req.body.measurements.chest),
          shoulder: parseFloat(req.body.measurements.shoulder),
          waist: parseFloat(req.body.measurements.waist),
          inseam: parseFloat(req.body.measurements.inseam),
          armLength: parseFloat(req.body.measurements.armLength),
          legLength: parseFloat(req.body.measurements.legLength)
        }
      };

      const newCustomOrder = await CustomOrder.create([orderData], { session });

      // Populate the brand and product details
      const populatedOrder = await CustomOrder.findById(newCustomOrder[0]._id)
        .populate('brandId', 'name')
        .populate('productId', 'name images')
        .populate('designerId', 'name')
        .populate('userId', 'name email')
        .session(session);
      
      await session.commitTransaction();
      session.endSession();

      return populatedOrder;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  };

  try {
    const result = await retryOperation(createOrderOperation);

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Custom order creation error:', error);
    
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
        error: 'A duplicate order exists or there was an issue generating a unique order ID. Please try again.'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error while creating order. Please try again.'
    });
  }
};

// Get all custom orders with filtering options
const getCustomOrders = async (req, res) => {
  try {
    const filters = {};
    
    if (req.query.designerId) filters.designerId = req.query.designerId;
    if (req.query.userId) filters.userId = req.query.userId;
    if (req.query.brandId) filters.brandId = req.query.brandId;
    if (req.query.status) filters.status = req.query.status;

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const customOrders = await CustomOrder.find(filters)
      .populate('brandId', 'name')
      .populate('productId', 'name images')
      .populate('designerId', 'name')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    const total = await CustomOrder.countDocuments(filters);

    res.status(200).json({
      success: true,
      count: customOrders.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: customOrders
    });
  } catch (error) {
    console.error('Error fetching custom orders:', error);
    res.status(500).json({
      success: false,
      error: "Server Error"
    });
  }
};

// Get single custom order by ID
const getCustomOrderById = async (req, res) => {
  try {
    const customOrder = await CustomOrder.findById(req.params.id)
      .populate('brandId', 'name')
      .populate('productId', 'name images')
      .populate('designerId', 'name')
      .populate('userId', 'name email');
    
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
    console.error('Error fetching custom order:', error);
    res.status(404).json({
      success: false,
      error: "Custom order not found"
    });
  }
};

// Update custom order
const updateCustomOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updatedAt: Date.now() };

    if (updateData.measurements) {
      updateData.measurements = {
        chest: parseFloat(updateData.measurements.chest),
        shoulder: parseFloat(updateData.measurements.shoulder),
        waist: parseFloat(updateData.measurements.waist),
        inseam: parseFloat(updateData.measurements.inseam),
        armLength: parseFloat(updateData.measurements.armLength),
        legLength: parseFloat(updateData.measurements.legLength)
      };
    }

    const customOrder = await CustomOrder.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).populate('brandId', 'name')
     .populate('productId', 'name images')
     .populate('designerId', 'name')
     .populate('userId', 'name email');

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
    console.error('Error updating custom order:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Delete custom order
const deleteCustomOrder = async (req, res) => {
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
      message: "Custom order deleted successfully"
    });
  } catch (error) {
    console.error('Error deleting custom order:', error);
    res.status(500).json({
      success: false,
      error: "Server Error"
    });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        error: "Status is required"
      });
    }

    const customOrder = await CustomOrder.findByIdAndUpdate(
      id,
      { 
        status,
        updatedAt: Date.now()
      },
      {
        new: true,
        runValidators: true
      }
    ).populate('brandId', 'name')
     .populate('productId', 'name images')
     .populate('designerId', 'name')
     .populate('userId', 'name email');

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
    console.error('Error updating order status:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Get custom order statistics
const getOrderStatistics = async (req, res) => {
  try {
    const stats = await CustomOrder.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$count' },
          statuses: { $push: { status: '$_id', count: '$count' } }
        }
      },
      {
        $project: {
          _id: 0,
          total: 1,
          statuses: 1
        }
      }
    ]);

    if (stats.length === 0) {
      return res.status(200).json({
        success: true,
        data: { total: 0, statuses: [] }
      });
    }

    res.status(200).json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    console.error('Error fetching order statistics:', error);
    res.status(500).json({
      success: false,
      error: "Server Error"
    });
  }
};

module.exports = {
  createCustomOrder,
  getCustomOrders,
  getCustomOrderById,
  updateCustomOrder,
  deleteCustomOrder,
  updateOrderStatus,
  getOrderStatistics
};

