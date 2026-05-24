const Inventory = require('../models/Inventory')

// GET /api/inventory
exports.getAll = async (req, res) => {
  try {
    const items = await Inventory.find().sort({ createdAt: -1 })
    res.json(items)
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch inventory.' })
  }
}

// GET /api/inventory/:id
exports.getOne = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id)
    if (!item) return res.status(404).json({ message: 'Item not found.' })
    res.json(item)
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch item.' })
  }
}

// POST /api/inventory
exports.create = async (req, res) => {
  try {
    const { name, category, quantity, price, sku, lowStockThreshold, description } = req.body
    if (!name || quantity === undefined || !price || !category) {
      return res.status(400).json({ message: 'Name, category, quantity, and price are required.' })
    }

    // Generate simple simulated sales history for ML
    const salesHistory = generateSalesHistory(Number(quantity), Number(price))

    const item = await Inventory.create({
      name, category, quantity, price, sku, lowStockThreshold, description, salesHistory
    })
    res.status(201).json(item)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to create item.' })
  }
}

// PUT /api/inventory/:id
exports.update = async (req, res) => {
  try {
    const { name, category, quantity, price, sku, lowStockThreshold, description } = req.body
    const item = await Inventory.findByIdAndUpdate(
      req.params.id,
      { name, category, quantity, price, sku, lowStockThreshold, description },
      { new: true, runValidators: true }
    )
    if (!item) return res.status(404).json({ message: 'Item not found.' })
    res.json(item)
  } catch (err) {
    res.status(500).json({ message: 'Failed to update item.' })
  }
}

// DELETE /api/inventory/:id
exports.remove = async (req, res) => {
  try {
    const item = await Inventory.findByIdAndDelete(req.params.id)
    if (!item) return res.status(404).json({ message: 'Item not found.' })
    res.json({ message: 'Item deleted successfully.' })
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete item.' })
  }
}

// Helper: generate plausible sales history for a new item
function generateSalesHistory(quantity, price) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const baseMonthly = Math.max(5, Math.floor(quantity * 0.3))
  return months.map((month, i) => {
    // Add seasonal variation
    const seasonal = 1 + 0.2 * Math.sin((i / 12) * 2 * Math.PI)
    const jitter = 0.8 + Math.random() * 0.4
    const sales = Math.round(baseMonthly * seasonal * jitter)
    return { month, sales, revenue: sales * price }
  })
}
