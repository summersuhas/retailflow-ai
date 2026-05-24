import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, LineChart, Line, Legend
} from 'recharts'
import { TrendingUp, Info, RefreshCw, AlertTriangle } from 'lucide-react'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm text-sm">
        <p className="font-medium text-gray-700 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    )
  }
  return null
}

export default function Forecasting() {
  const [items, setItems] = useState([])
  const [selectedItem, setSelectedItem] = useState('')
  const [forecast, setForecast] = useState(null)
  const [loading, setLoading] = useState(false)
  const [itemsLoading, setItemsLoading] = useState(true)
  const [error, setError] = useState('')
  const [mlError, setMlError] = useState('')

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await axios.get('/api/inventory')
        setItems(res.data)
        if (res.data.length > 0) setSelectedItem(res.data[0]._id)
      } catch (err) {
        setError('Failed to load inventory.')
      } finally {
        setItemsLoading(false)
      }
    }
    fetchItems()
  }, [])

  const handleForecast = async () => {
    if (!selectedItem) return
    setLoading(true)
    setForecast(null)
    setMlError('')
    try {
      const res = await axios.post('/api/forecast', { itemId: selectedItem })
      setForecast(res.data)
    } catch (err) {
      if (err.response?.status === 503) {
        setMlError('ML service is not running. Start it with: cd ml-service && python app.py')
      } else {
        setMlError(err.response?.data?.message || 'Forecast failed. Check that the ML service is running.')
      }
    } finally {
      setLoading(false)
    }
  }

  const selectedProduct = items.find((i) => i._id === selectedItem)

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="page-title">AI Demand Forecasting</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Powered by Random Forest Regressor — scikit-learn
        </p>
      </div>

      {/* How it works */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 flex gap-3">
        <Info size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700">
          <p className="font-medium mb-0.5">How does this work?</p>
          <p className="text-blue-600 text-xs leading-relaxed">
            The ML model uses historical sales patterns, price, current stock levels, and
            seasonal signals to predict demand for the next 30 days. It's trained using
            Random Forest Regressor from scikit-learn — a reliable, explainable algorithm
            that averages multiple decision trees.
          </p>
        </div>
      </div>

      {/* Selector */}
      <div className="card">
        <p className="section-title">Run Forecast</p>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="form-label">Select Product</label>
            <select
              className="form-input"
              value={selectedItem}
              onChange={(e) => setSelectedItem(e.target.value)}
              disabled={itemsLoading}
            >
              {items.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name} — {item.category} (Stock: {item.quantity})
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleForecast}
            disabled={loading || !selectedItem}
            className="btn-primary flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <><RefreshCw size={14} className="animate-spin" /> Forecasting...</>
            ) : (
              <><TrendingUp size={14} /> Run Forecast</>
            )}
          </button>
        </div>

        {mlError && (
          <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-md p-3">
            <AlertTriangle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-700 font-medium">ML Service Error</p>
              <p className="text-xs text-amber-600 mt-0.5">{mlError}</p>
            </div>
          </div>
        )}
      </div>

      {/* Forecast Results */}
      {forecast && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card text-center">
              <p className="text-xs text-gray-400 mb-1">Predicted Demand</p>
              <p className="text-3xl font-bold text-blue-600">{forecast.predictedDemand}</p>
              <p className="text-xs text-gray-400 mt-1">units / 30 days</p>
            </div>
            <div className="card text-center">
              <p className="text-xs text-gray-400 mb-1">Current Stock</p>
              <p className="text-3xl font-bold text-gray-700">{selectedProduct?.quantity}</p>
              <p className="text-xs text-gray-400 mt-1">units available</p>
            </div>
            <div className="card text-center">
              <p className="text-xs text-gray-400 mb-1">Restock Needed</p>
              <p className={`text-3xl font-bold ${forecast.restockQty > 0 ? 'text-red-500' : 'text-green-600'}`}>
                {Math.max(0, forecast.restockQty)}
              </p>
              <p className="text-xs text-gray-400 mt-1">units to order</p>
            </div>
            <div className="card text-center">
              <p className="text-xs text-gray-400 mb-1">Model Confidence</p>
              <p className="text-3xl font-bold text-green-600">{forecast.confidence}%</p>
              <p className="text-xs text-gray-400 mt-1">R² score</p>
            </div>
          </div>

          {/* Recommendation */}
          <div className={`card border-l-4 ${forecast.restockQty > 0 ? 'border-l-red-400' : 'border-l-green-400'}`}>
            <div className="flex items-start gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {forecast.restockQty > 0 ? '⚠️ Restock Recommended' : '✅ Stock Level Sufficient'}
                </p>
                <p className="text-sm text-gray-500 mt-1">{forecast.recommendation}</p>
              </div>
            </div>
          </div>

          {/* Forecast Chart */}
          <div className="card">
            <p className="section-title">30-Day Demand Forecast vs Historical</p>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={forecast.chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconSize={10} formatter={(val) => <span style={{ fontSize: 11, color: '#6b7280' }}>{val}</span>} />
                <ReferenceLine x="Week 5" stroke="#e5e7eb" strokeDasharray="4 4" label={{ value: 'Forecast', fontSize: 11, fill: '#9ca3af' }} />
                <Line type="monotone" dataKey="actual" name="Actual Sales" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="predicted" name="Predicted" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Feature Importance */}
          <div className="card">
            <p className="section-title">Feature Importance (What drove the forecast)</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                layout="vertical"
                data={forecast.featureImportance}
                margin={{ top: 0, right: 20, left: 80, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} domain={[0, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                <YAxis type="category" dataKey="feature" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <Tooltip formatter={(v) => `${(v * 100).toFixed(1)}%`} />
                <Bar dataKey="importance" name="Importance" fill="#3b82f6" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-400 mt-2">
              Feature importance shows which input variables most influenced the model's prediction.
            </p>
          </div>
        </div>
      )}

      {!forecast && !loading && (
        <div className="card text-center py-12">
          <TrendingUp size={36} className="mx-auto text-gray-200 mb-3" />
          <p className="text-sm text-gray-400">Select a product and click "Run Forecast" to see AI predictions.</p>
        </div>
      )}
    </div>
  )
}
