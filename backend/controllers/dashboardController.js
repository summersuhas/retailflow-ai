const Inventory = require('../models/Inventory')

// GET /api/dashboard/stats
exports.getStats = async (req, res) => {
  try {
    const items = await Inventory.find()

    const totalProducts = items.length
    const lowStockItems = items.filter(
      (i) => i.quantity <= i.lowStockThreshold
    ).length

    const lowStockList = items
      .filter((i) => i.quantity <= i.lowStockThreshold)
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 8)

    // Estimated monthly sales = sum of most recent month's sales across all items
    let monthlySales = 0
    items.forEach((item) => {
      if (item.salesHistory && item.salesHistory.length > 0) {
        const latest = item.salesHistory[item.salesHistory.length - 1]
        monthlySales += latest.revenue || 0
      }
    })

    // Predicted demand: sum of avg monthly sales across items
    let predictedDemand = 0
    items.forEach((item) => {
      if (item.salesHistory && item.salesHistory.length > 0) {
        const avgSales =
          item.salesHistory.reduce((s, m) => s + m.sales, 0) /
          item.salesHistory.length
        predictedDemand += Math.round(avgSales)
      }
    })

    // Build 12-month sales trend by summing across all items
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const salesTrend = monthNames.map((month) => {
      let sales = 0
      items.forEach((item) => {
        const entry = item.salesHistory?.find((h) => h.month === month)
        if (entry) sales += entry.revenue || 0
      })
      return { month, sales: Math.round(sales) }
    })

    res.json({
      totalProducts,
      lowStockItems,
      lowStockList,
      monthlySales: Math.round(monthlySales),
      predictedDemand,
      salesTrend,
    })
  } catch (err) {
    console.error('Dashboard stats error:', err)
    res.status(500).json({ message: 'Failed to load dashboard stats.' })
  }
}
