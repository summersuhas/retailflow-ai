import { useState, useEffect } from 'react'
import api from '../api'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  LineChart,
  Line,
  Legend,
} from 'recharts'

import {
  TrendingUp,
  Info,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm text-sm">
        <p className="font-medium text-gray-700 mb-1">{label}</p>

        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>
            {p.name}: {p.value}
          </p>
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
        const res = await api.get('/api/inventory')

        setItems(res.data)

        if (res.data.length > 0) {
          setSelectedItem(res.data[0]._id)
        }
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
      const res = await api.post('/api/forecast', {
        itemId: selectedItem,
      })

      setForecast(res.data)
    } catch (err) {
      if (err.response?.status === 503) {
        setMlError(
          'ML service is not running. Start it with: cd ml-service && python3 app.py'
        )
      } else {
        setMlError(
          err.response?.data?.message ||
            'Forecast failed. Check that the ML service is running.'
        )
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

      {/* Info */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 flex gap-3">
        <Info
          size={16}
          className="text-blue-500 flex-shrink-0 mt-0.5"
        />

        <div className="text-sm text-blue-700">
          <p className="font-medium mb-0.5">
            How does this work?
          </p>

          <p className="text-blue-600 text-xs leading-relaxed">
            The ML model uses historical sales patterns,
            price, current stock levels, and seasonal
            signals to predict demand for the next 30 days.
          </p>
        </div>
      </div>

      {/* Selector */}
      <div className="card">
        <p className="section-title">Run Forecast</p>

        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="form-label">
              Select Product
            </label>

            <select
              className="form-input"
              value={selectedItem}
              onChange={(e) =>
                setSelectedItem(e.target.value)
              }
              disabled={itemsLoading}
            >
              {items.map((item) => (
                <option
                  key={item._id}
                  value={item._id}
                >
                  {item.name} — {item.category} (Stock:{' '}
                  {item.quantity})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleForecast}
            disabled={loading || !selectedItem}
            className="btn-primary flex items-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <>
                <RefreshCw
                  size={14}
                  className="animate-spin"
                />
                Forecasting...
              </>
            ) : (
              <>
                <TrendingUp size={14} />
                Run Forecast
              </>
            )}
          </button>
        </div>

        {mlError && (
          <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-md p-3">
            <AlertTriangle
              size={15}
              className="text-amber-500 flex-shrink-0 mt-0.5"
            />

            <div>
              <p className="text-sm text-amber-700 font-medium">
                ML Service Error
              </p>

              <p className="text-xs text-amber-600 mt-0.5">
                {mlError}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {forecast && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card text-center">
              <p className="text-xs text-gray-400 mb-1">
                Predicted Demand
              </p>

              <p className="text-3xl font-bold text-blue-600">
                {forecast.predictedDemand}
              </p>
            </div>

            <div className="card text-center">
              <p className="text-xs text-gray-400 mb-1">
                Current Stock
              </p>

              <p className="text-3xl font-bold text-gray-700">
                {selectedProduct?.quantity}
              </p>
            </div>

            <div className="card text-center">
              <p className="text-xs text-gray-400 mb-1">
                Restock Needed
              </p>

              <p
                className={`text-3xl font-bold ${
                  forecast.restockQty > 0
                    ? 'text-red-500'
                    : 'text-green-600'
                }`}
              >
                {Math.max(0, forecast.restockQty)}
              </p>
            </div>

            <div className="card text-center">
              <p className="text-xs text-gray-400 mb-1">
                Model Confidence
              </p>

              <p className="text-3xl font-bold text-green-600">
                {forecast.confidence}%
              </p>
            </div>
          </div>
        </div>
      )}

      {!forecast && !loading && (
        <div className="card text-center py-12">
          <TrendingUp
            size={36}
            className="mx-auto text-gray-200 mb-3"
          />

          <p className="text-sm text-gray-400">
            Select a product and click "Run Forecast"
            to see AI predictions.
          </p>
        </div>
      )}
    </div>
  )
}