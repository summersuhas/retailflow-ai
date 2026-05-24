import { useState, useEffect } from 'react'
import api from '../api'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  RefreshCw,
} from 'lucide-react'

const CATEGORIES = [
  'Electronics',
  'Clothing',
  'Food & Beverage',
  'Home & Garden',
  'Sports',
  'Toys',
  'Books',
  'Health',
  'Other',
]

const emptyForm = {
  name: '',
  category: 'Electronics',
  quantity: '',
  price: '',
  sku: '',
  lowStockThreshold: 10,
  description: '',
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-lg w-full max-w-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">
            {title}
          </h3>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export default function Inventory() {
  const [items, setItems] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)

  const [showModal, setShowModal] =
    useState(false)

  const [editItem, setEditItem] =
    useState(null)

  const [form, setForm] =
    useState(emptyForm)

  const [search, setSearch] = useState('')

  const [categoryFilter, setCategoryFilter] =
    useState('All')

  const [saving, setSaving] = useState(false)

  const [deleteId, setDeleteId] =
    useState(null)

  const [formError, setFormError] =
    useState('')

  useEffect(() => {
    const token =
      localStorage.getItem('token')

    if (token) {
      api.defaults.headers.common[
        'Authorization'
      ] = `Bearer ${token}`
    }

    fetchItems()
  }, [])

  const fetchItems = async () => {
    setLoading(true)
  
    try {
      const res = await api.get('/api/inventory')
  
      console.log(res.data)
  
      setItems(res.data)
    } catch (err) {
      console.error(err)
  
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let list = Array.isArray(items)
      ? items
      : []

    if (categoryFilter !== 'All') {
      list = list.filter(
        (i) =>
          i.category === categoryFilter
      )
    }

    if (search) {
      list = list.filter(
        (i) =>
          i.name
            .toLowerCase()
            .includes(
              search.toLowerCase()
            ) ||
          i.sku
            ?.toLowerCase()
            .includes(
              search.toLowerCase()
            )
      )
    }

    setFiltered(list)
  }, [items, search, categoryFilter])

  const openAdd = () => {
    setEditItem(null)
    setForm(emptyForm)
    setFormError('')
    setShowModal(true)
  }

  const openEdit = (item) => {
    setEditItem(item)

    setForm({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      price: item.price,
      sku: item.sku || '',
      lowStockThreshold:
        item.lowStockThreshold || 10,
      description:
        item.description || '',
    })

    setFormError('')
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()

    setFormError('')

    if (
      !form.name ||
      !form.quantity ||
      !form.price
    ) {
      setFormError(
        'Name, quantity, and price are required.'
      )

      return
    }

    setSaving(true)

    try {
      if (editItem) {
        await api.put(
          `/api/inventory/${editItem._id}`,
          form
        )
      } else {
        await api.post(
          '/api/inventory',
          form
        )
      }

      setShowModal(false)

      fetchItems()
    } catch (err) {
      console.error(err)

      setFormError(
        err.response?.data
          ?.message ||
          'Failed to save item.'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(
        `/api/inventory/${id}`
      )

      setDeleteId(null)

      fetchItems()
    } catch (err) {
      console.error(err)
    }
  }

  const stockBadge = (item) => {
    if (item.quantity === 0) {
      return (
        <span className="badge-red">
          Out of Stock
        </span>
      )
    }

    if (
      item.quantity <=
      item.lowStockThreshold
    ) {
      return (
        <span className="badge-yellow">
          Low Stock
        </span>
      )
    }

    return (
      <span className="badge-green">
        In Stock
      </span>
    )
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">
            Inventory
          </h1>

          <p className="text-sm text-gray-400 mt-0.5">
            {items.length} products total
          </p>
        </div>

        <button
          onClick={openAdd}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={15} />
          Add Product
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="form-input pl-9"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) =>
            setCategoryFilter(
              e.target.value
            )
          }
          className="form-input w-auto min-w-[160px]"
        >
          <option value="All">
            All Categories
          </option>

          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <RefreshCw
              size={18}
              className="animate-spin mr-2"
            />

            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm">
              No products found.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="text-left px-5 py-3">
                    Product
                  </th>

                  <th className="text-left px-4 py-3">
                    SKU
                  </th>

                  <th className="text-left px-4 py-3">
                    Category
                  </th>

                  <th className="text-left px-4 py-3">
                    Qty
                  </th>

                  <th className="text-left px-4 py-3">
                    Price
                  </th>

                  <th className="text-left px-4 py-3">
                    Status
                  </th>

                  <th className="text-right px-5 py-3">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((item) => (
                  <tr
                    key={item._id}
                    className="border-b border-gray-50"
                  >
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-800">
                        {item.name}
                      </p>

                      {item.description && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {item.description}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                      {item.sku || '—'}
                    </td>

                    <td className="px-4 py-3">
                      {item.category}
                    </td>

                    <td className="px-4 py-3">
                      {item.quantity}
                    </td>

                    <td className="px-4 py-3">
                      $
                      {Number(
                        item.price
                      ).toFixed(2)}
                    </td>

                    <td className="px-4 py-3">
                      {stockBadge(item)}
                    </td>

                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() =>
                            openEdit(item)
                          }
                          className="p-1.5 text-gray-400 hover:text-blue-600"
                        >
                          <Edit2 size={14} />
                        </button>

                        <button
                          onClick={() =>
                            setDeleteId(
                              item._id
                            )
                          }
                          className="p-1.5 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <Modal
          title={
            editItem
              ? 'Edit Product'
              : 'Add New Product'
          }
          onClose={() =>
            setShowModal(false)
          }
        >
          <form
            onSubmit={handleSave}
            className="space-y-4"
          >
            {formError && (
              <p className="text-sm text-red-600">
                {formError}
              </p>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="form-label">
                  Product Name *
                </label>

                <input
                  className="form-input"
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name:
                        e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="form-label">
                  SKU
                </label>

                <input
                  className="form-input"
                  value={form.sku}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      sku:
                        e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="form-label">
                  Category
                </label>

                <select
                  className="form-input"
                  value={form.category}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      category:
                        e.target.value,
                    })
                  }
                >
                  {CATEGORIES.map((c) => (
                    <option key={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">
                  Quantity *
                </label>

                <input
                  type="number"
                  className="form-input"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      quantity:
                        e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="form-label">
                  Price *
                </label>

                <input
                  type="number"
                  className="form-input"
                  value={form.price}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      price:
                        e.target.value,
                    })
                  }
                />
              </div>

              <div className="col-span-2">
                <label className="form-label">
                  Low Stock Threshold
                </label>

                <input
                  type="number"
                  className="form-input"
                  value={
                    form.lowStockThreshold
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      lowStockThreshold:
                        e.target.value,
                    })
                  }
                />
              </div>

              <div className="col-span-2">
                <label className="form-label">
                  Description
                </label>

                <textarea
                  rows={3}
                  className="form-input"
                  value={form.description}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description:
                        e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() =>
                  setShowModal(false)
                }
                className="btn-secondary"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="btn-primary"
              >
                {saving
                  ? 'Saving...'
                  : editItem
                  ? 'Save Changes'
                  : 'Add Product'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}