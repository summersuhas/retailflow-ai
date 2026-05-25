import { useState, useEffect } from 'react'
import api from '../api'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

import {
  Package,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  RefreshCw,
} from 'lucide-react'

const COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
]

function KPICard({
  icon: Icon,
  label,
  value,
  sub,
  iconBg,
  iconColor,
}) {
  return (
    <div className="card flex items-start gap-4">
      <div
        className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}
      >
        <Icon
          size={18}
          className={iconColor}
        />
      </div>

      <div>
        <p className="text-sm text-gray-500">
          {label}
        </p>

        <p className="text-2xl font-bold text-gray-800 mt-0.5">
          {value}
        </p>

        {sub && (
          <p className="text-xs text-gray-400 mt-0.5">
            {sub}
          </p>
        )}
      </div>
    </div>
  )
}

const CustomTooltip = ({
  active,
  payload,
  label,
}) => {
  if (
    active &&
    payload &&
    payload.length
  ) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm text-sm">
        <p className="font-medium text-gray-700 mb-1">
          {label}
        </p>

        {payload.map((p, i) => (
          <p
            key={i}
            style={{ color: p.color }}
          >
            {p.name}:{' '}
            {typeof p.value ===
              'number' &&
            p.name
              .toLowerCase()
              .includes('sale')
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
  const [stats, setStats] =
    useState(null)

  const [salesData, setSalesData] =
    useState([])

  const [
    categoryData,
    setCategoryData,
  ] = useState([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  const fetchData = async () => {
    setLoading(true)
    setError('')

    try {
      const [
        statsRes,
        inventoryRes,
      ] = await Promise.all([
        api.get(
          '/api/dashboard/stats'
        ),

        api.get('/api/inventory'),
      ])

      setStats(statsRes.data)

      setSalesData(
        statsRes.data.salesTrend || []
      )

      const items = inventoryRes.data

      const catMap = {}

      items.forEach((item) => {
        catMap[item.category] =
          (catMap[item.category] ||
            0) + item.quantity
      })

      setCategoryData(
        Object.entries(catMap).map(
          ([name, value]) => ({
            name,
            value,
          })
        )
      )
    } catch (err) {
      setError(
        'Failed to load dashboard data.'
      )
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
        <RefreshCw
          size={20}
          className="animate-spin mr-2"
        />

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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Dashboard
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Overview of inventory
            and sales performance
          </p>
        </div>

        <button
          onClick={fetchData}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KPICard
            icon={Package}
            label="Total Products"
            value={
              stats.totalProducts || 0
            }
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
          />

          <KPICard
            icon={AlertTriangle}
            label="Low Stock Items"
            value={
              stats.lowStockItems ||
              0
            }
            iconBg="bg-red-100"
            iconColor="text-red-600"
          />

          <KPICard
            icon={DollarSign}
            label="Total Sales"
            value={`$${(
              stats.totalSales || 0
            ).toLocaleString()}`}
            iconBg="bg-green-100"
            iconColor="text-green-600"
          />

          <KPICard
            icon={TrendingUp}
            label="Revenue Growth"
            value={`${
              stats.revenueGrowth ||
              0
            }%`}
            iconBg="bg-purple-100"
            iconColor="text-purple-600"
          />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Sales Trend
          </h2>

          <div className="h-80">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <AreaChart
                data={salesData}
              >
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="month" />

                <YAxis />

                <Tooltip
                  content={
                    <CustomTooltip />
                  }
                />

                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#3b82f6"
                  fill="#93c5fd"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Inventory by Category
          </h2>

          <div className="h-80">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={100}
                  label
                >
                  {categoryData.map(
                    (
                      entry,
                      index
                    ) => (
                      <Cell
                        key={index}
                        fill={
                          COLORS[
                            index %
                              COLORS.length
                          ]
                        }
                      />
                    )
                  )}
                </Pie>

                <Tooltip />

                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}