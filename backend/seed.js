/**
 * Seed script — run with: node seed.js
 * Creates a demo admin user and sample inventory items.
 */
require('dotenv').config()
const mongoose = require('mongoose')
const User = require('./models/User')
const Inventory = require('./models/Inventory')

const MONGO_URI = process.env.MONGO_URI || 'your_mongodb_connection_string'

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function makeSalesHistory(baseUnits, price) {
  return months.map((month, i) => {
    const seasonal = 1 + 0.25 * Math.sin(((i - 2) / 12) * 2 * Math.PI)
    const jitter = 0.85 + Math.random() * 0.3
    const sales = Math.max(1, Math.round(baseUnits * seasonal * jitter))
    return { month, sales, revenue: Math.round(sales * price * 100) / 100 }
  })
}

const sampleItems = [
  { name: 'Wireless Earbuds Pro', sku: 'ELEC-001', category: 'Electronics', quantity: 45, price: 79.99, lowStockThreshold: 10, description: 'Noise-cancelling Bluetooth earbuds with 24h battery' },
  { name: 'USB-C Charging Hub', sku: 'ELEC-002', category: 'Electronics', quantity: 8, price: 39.99, lowStockThreshold: 15, description: '7-in-1 USB-C hub for laptops' },
  { name: 'Smart LED Desk Lamp', sku: 'ELEC-003', category: 'Electronics', quantity: 32, price: 54.99, lowStockThreshold: 10, description: 'Adjustable color temperature and brightness' },
  { name: 'Men\'s Running Shoes', sku: 'SPT-001', category: 'Sports', quantity: 60, price: 89.99, lowStockThreshold: 20, description: 'Lightweight with arch support, sizes 7-13' },
  { name: 'Yoga Mat Premium', sku: 'SPT-002', category: 'Sports', quantity: 5, price: 34.99, lowStockThreshold: 10, description: '6mm thick non-slip yoga mat' },
  { name: 'Water Bottle 1L', sku: 'SPT-003', category: 'Sports', quantity: 120, price: 24.99, lowStockThreshold: 25, description: 'BPA-free stainless steel, keeps cold 24h' },
  { name: 'Organic Green Tea', sku: 'FOD-001', category: 'Food & Beverage', quantity: 200, price: 12.99, lowStockThreshold: 50, description: '100g loose leaf, single origin Darjeeling' },
  { name: 'Protein Bar (Box of 12)', sku: 'FOD-002', category: 'Food & Beverage', quantity: 3, price: 28.99, lowStockThreshold: 20, description: 'Chocolate peanut butter, 20g protein each' },
  { name: 'Winter Jacket - Navy', sku: 'CLO-001', category: 'Clothing', quantity: 25, price: 129.99, lowStockThreshold: 8, description: 'Water-resistant puffer jacket, sizes S-XXL' },
  { name: 'Cotton T-Shirt 3-Pack', sku: 'CLO-002', category: 'Clothing', quantity: 85, price: 29.99, lowStockThreshold: 20, description: 'Premium combed cotton, various colors' },
  { name: 'Plant Pot Set (3pc)', sku: 'HOM-001', category: 'Home & Garden', quantity: 0, price: 19.99, lowStockThreshold: 10, description: 'Ceramic pots with drainage holes, 4/6/8 inch' },
  { name: 'Python Crash Course', sku: 'BOK-001', category: 'Books', quantity: 40, price: 34.99, lowStockThreshold: 10, description: 'Beginner programming book, 3rd edition' },
  { name: 'LEGO City Police Set', sku: 'TOY-001', category: 'Toys', quantity: 18, price: 59.99, lowStockThreshold: 5, description: '350 pieces, ages 6+' },
  { name: 'Vitamin D3 Supplement', sku: 'HLT-001', category: 'Health', quantity: 7, price: 16.99, lowStockThreshold: 15, description: '2000 IU, 90 capsules, 3-month supply' },
]

async function seed() {
  try {
    await mongoose.connect(MONGO_URI)
    console.log('Connected to MongoDB')

    // Clear existing data
    await User.deleteMany({})
    await Inventory.deleteMany({})
    console.log('Cleared existing data')

    // Create admin user
    const user = await User.create({
      name: 'Admin User',
      email: 'admin@retailflow.com',
      password: 'password123',
      role: 'admin',
    })
    console.log(`Created user: ${user.email}`)

    // Create inventory items with sales history
    const inventoryData = sampleItems.map((item) => ({
      ...item,
      salesHistory: makeSalesHistory(Math.max(5, Math.floor(item.quantity * 0.4)), item.price),
    }))

    await Inventory.insertMany(inventoryData)
    console.log(`Created ${inventoryData.length} inventory items`)

    console.log('\n✅ Seed complete!')
    console.log('Demo login: admin@retailflow.com / password123')
    process.exit(0)
  } catch (err) {
    console.error('Seed failed:', err.message)
    process.exit(1)
  }
}

seed()
