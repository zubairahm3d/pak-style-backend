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
    required: true
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
  brandId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
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
  neckline: {
    type: String,
    enum: ['round', 'vneck', 'collar', 'mandarin'],
  },
  sleeves: {
    type: String,
    enum: ['full', 'threeQuarter', 'half', 'sleeveless'],
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

customOrderSchema.index({ customOrderId: 1 }, { unique: true });
customOrderSchema.index({ designerId: 1 });
customOrderSchema.index({ userId: 1 });
customOrderSchema.index({ brandId: 1 });
customOrderSchema.index({ productId: 1 });
customOrderSchema.index({ status: 1 });
customOrderSchema.index({ createdAt: -1 });

module.exports = mongoose.model("CustomOrder", customOrderSchema);

