const mongoose = require('mongoose')

const inventorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    sku: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      required: true,
      enum: ['Electronics', 'Clothing', 'Food & Beverage', 'Home & Garden', 'Sports', 'Toys', 'Books', 'Health', 'Other'],
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
    },
    description: {
      type: String,
      default: '',
    },
    // Simulated monthly sales history for ML forecasting
    // Each entry = { month: 'Jan', sales: 120 }
    salesHistory: {
      type: Array,
      default: [],
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Inventory', inventorySchema)
