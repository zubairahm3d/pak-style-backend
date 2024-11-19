// customOrderModel.js
const mongoose = require("mongoose");

const measurementsSchema = new mongoose.Schema({
  chest: {
    type: Number,
    required: true
  },
  shoulder: {
    type: Number,
    required: true
  },
  waist: {
    type: Number,
    required: true
  },
  inseam: {
    type: Number,
    required: true
  },
  armLength: {
    type: Number,
    required: true
  },
  legLength: {
    type: Number,
    required: true
  }
});

const customOrderSchema = new mongoose.Schema({
  customOrderId: {
    type: String,
    unique: true,
    sparse: true // Allows null values while maintaining uniqueness
  },
  designerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Designer',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  garmentType: {
    type: String,
    enum: ['shalwarKameez', 'kurtaPajama', 'sherwani', 'waistcoat'],
    required: true
  },
  occasion: {
    type: String,
    enum: ['casual', 'eid', 'wedding', 'formal'],
    required: true
  },
  fabric: {
    type: String,
    enum: ['cotton', 'linen', 'silk', 'khaddar'],
    required: true
  },
  color: {
    type: String,
    required: true,
    trim: true
  },
  pattern: {
    type: String,
    enum: ['solid', 'floral', 'geometric', 'striped'],
    required: true
  },
  fitting: {
    type: String,
    enum: ['regular', 'slim', 'loose'],
    required: true
  },
  measurements: {
    type: measurementsSchema,
    required: true
  },
  specialInstructions: {
    type: String,
    trim: true
  },
  deliveryPreference: {
    type: String,
    enum: ['homeDelivery', 'pickup'],
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['cod', 'card', 'mobileMoney'],
    required: true
  },
  rushOrder: {
    type: Boolean,
    default: false
  },
  consultationDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'inProgress', 'completed', 'cancelled'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Generate custom order ID before saving
customOrderSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Get the current date
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    // Find the latest order number for the current month
    const latestOrder = await this.constructor.findOne({
      customOrderId: new RegExp(`^CO${year}${month}`)
    }).sort({ customOrderId: -1 });
    
    let orderNumber = 1;
    if (latestOrder && latestOrder.customOrderId) {
      const lastNumber = parseInt(latestOrder.customOrderId.slice(-4));
      orderNumber = lastNumber + 1;
    }
    
    // Generate the new order ID (format: CO-YYMM-XXXX)
    this.customOrderId = `CO${year}${month}${String(orderNumber).padStart(4, '0')}`;
  }
  
  this.updatedAt = Date.now();
  next();
});

// Create indexes
customOrderSchema.index({ customOrderId: 1 }, { unique: true, sparse: true });
customOrderSchema.index({ designerId: 1 });
customOrderSchema.index({ userId: 1 });
customOrderSchema.index({ status: 1 });
customOrderSchema.index({ createdAt: -1 });

const CustomOrder = mongoose.model("CustomOrder", customOrderSchema);

module.exports = CustomOrder;