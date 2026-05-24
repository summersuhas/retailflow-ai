import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
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
        axios.get('/api/dashboard/stats'),
        axios.get('/api/inventory'),
      ])
      setStats(statsRes.data)
      setSalesData(statsRes.data.salesTrend || [])

      // Build category distribution from inventory
      const items = inventoryRes.data
      const catMap = {}
      items.forEach((item) => {
        catMap[item.category] = (catMap[item.category] || 0) + item.quantity
      })
      setCategoryData(Object.entries(catMap).map(([name, value]) => ({ name, value })))
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
        <RefreshCw size={20} className="animate-spin mr-2" /> Loading dashboard...
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">Overview of your inventory and sales</p>
        </div>
        <button onClick={fetchData} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={Package}
          label="Total Products"
          value={stats?.totalProducts ?? 0}
          sub="across all categories"
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <KPICard
          icon={AlertTriangle}
          label="Low Stock Items"
          value={stats?.lowStockItems ?? 0}
          sub="below threshold"
          iconBg="bg-red-50"
          iconColor="text-red-500"
        />
        <KPICard
          icon={DollarSign}
          label="Monthly Sales"
          value={`$${(stats?.monthlySales ?? 0).toLocaleString()}`}
          sub="estimated revenue"
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />
        <KPICard
          icon={TrendingUp}
          label="Predicted Demand"
          value={`${stats?.predictedDemand ?? 0} units`}
          sub="next 30 days (AI)"
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sales Trend - wider */}
        <div className="card lg:col-span-2">
          <p className="section-title">Monthly Sales Trend</p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={salesData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="sales"
                name="Sales ($)"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#salesGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Pie */}
        <div className="card">
          <p className="section-title">Stock by Category</p>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => [`${val} units`, 'Quantity']} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(val) => <span style={{ fontSize: 11, color: '#6b7280' }}>{val}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-52 text-gray-400 text-sm">
              No inventory data yet
            </div>
          )}
        </div>
      </div>

      {/* Low Stock Table */}
      <div className="card">
        <p className="section-title">Low Stock Alerts</p>
        {stats?.lowStockList?.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left pb-2 text-gray-500 font-medium">Product</th>
                <th className="text-left pb-2 text-gray-500 font-medium">Category</th>
                <th className="text-left pb-2 text-gray-500 font-medium">Stock</th>
                <th className="text-left pb-2 text-gray-500 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.lowStockList.map((item) => (
                <tr key={item._id} className="border-b border-gray-50 table-row-hover">
                  <td className="py-2.5 font-medium text-gray-700">{item.name}</td>
                  <td className="py-2.5 text-gray-500">{item.category}</td>
                  <td className="py-2.5 text-gray-700">{item.quantity}</td>
                  <td className="py-2.5">
                    {item.quantity === 0 ? (
                      <span className="badge-red">Out of Stock</span>
                    ) : (
                      <span className="badge-yellow">Low Stock</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-gray-400">All items are well-stocked. Great job!</p>
        )}
      </div>
    </div>
  )
}
