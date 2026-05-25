import { useState, useEffect } from 'react'
import api from '../api'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import {
  Package, AlertTriangle, DollarSign, TrendingUp, RefreshCw
} from 'lucide-react'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

function KPICard({ icon: Icon, label, value, sub, iconBg, iconColor }) {
  return (
    <div className="card flex items-start gap-4">
      <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
        <Icon size={18} className={iconColor} />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-800 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm text-sm">
        <p className="font-medium text-gray-700 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>
            {p.name}: {typeof p.value === 'number' && p.name.toLowerCase().includes('sale')
              ? `$${p.value.toLocaleString()}`
              : p.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [salesData, setSalesData] = useState([])
  const [categoryData, setCategoryData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchData = async () => {
    setLoading(true)
    setError('')

    try {
      const [statsRes, inventoryRes] = await Promise.all([
        api.get('/api/dashboard/stats'),
        api.get('/api/inventory'),
      ])

      setStats(statsRes.data)
      setSalesData(statsRes.data.salesTrend || [])

      const items = inventoryRes.data
      const catMap = {}

      items.forEach((item) => {
        catMap[item.category] = (catMap[item.category] || 0) + item.quantity
      })

      setCategoryData(
        Object.entries(catMap).map(([name, value]) => ({
          name,
          value,
        }))
      )
    } catch (err) {
      setError('Failed to load dashboard data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <RefreshCw size={20} className="animate-spin mr-2" />
        Loading dashboard...
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-600">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      Dashboard Working
    </div>
  )
}