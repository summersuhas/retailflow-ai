const axios = require('axios')
const Inventory = require('../models/Inventory')

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000'

// POST /api/forecast
exports.getForecast = async (req, res) => {
  try {
    const { itemId } = req.body
    if (!itemId) {
      return res.status(400).json({ message: 'itemId is required.' })
    }

    const item = await Inventory.findById(itemId)
    if (!item) {
      return res.status(404).json({ message: 'Item not found.' })
    }

    if (!item.salesHistory || item.salesHistory.length < 3) {
      return res.status(400).json({ message: 'Not enough sales history to forecast.' })
    }

    // Send data to ML service
    const payload = {
      item_id: item._id.toString(),
      name: item.name,
      category: item.category,
      current_stock: item.quantity,
      price: item.price,
      low_stock_threshold: item.lowStockThreshold,
      sales_history: item.salesHistory,
    }

    let mlResponse
    try {
      mlResponse = await axios.post(`${ML_SERVICE_URL}/forecast`, payload, {
        timeout: 10000,
      })
    } catch (mlErr) {
      if (mlErr.code === 'ECONNREFUSED' || mlErr.code === 'ECONNABORTED') {
        return res.status(503).json({
          message: 'ML service is not reachable. Start it with: cd ml-service && python app.py',
        })
      }
      throw mlErr
    }

    res.json(mlResponse.data)
  } catch (err) {
    console.error('Forecast error:', err.message)
    res.status(500).json({ message: 'Forecast failed. Check that the ML service is running.' })
  }
}
