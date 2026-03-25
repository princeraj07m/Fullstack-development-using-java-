"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Package, Search, MapPin, AlertCircle, CheckCircle } from "lucide-react"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/context/auth"

const API_BASE_URL = "http://localhost:4000"

export default function ProductsPage() {
  const { user, getAuthHeaders } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [suppliers, setSuppliers] = useState([])

  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState("create") // create | edit
  const [formError, setFormError] = useState("")
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    id: "",
    sku: "",
    name: "",
    category: "",
    supplier: "",
    quantity: "",
    reorderPoint: "",
    price: "",
    location: "",
    lastRestocked: "",
  })

  useEffect(() => {
    async function loadProducts() {
      try {
        const headers = getAuthHeaders()
        const res = await fetch(`${API_BASE_URL}/api/products`, { headers })
        const data = await res.json()
        const normalized = data.map((p) => ({
          ...p,
          quantity: Number(p.quantity),
          reorderPoint: Number(p.reorderPoint),
          price: Number(p.price),
        }))
        setProducts(normalized)
      } catch (error) {
        console.error("Failed to load products", error)
      }
    }

    loadProducts()
  }, [user?.id])

  useEffect(() => {
    async function loadLookups() {
      try {
        const headers = getAuthHeaders()
        const [cRes, sRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/categories`, { headers }),
          fetch(`${API_BASE_URL}/api/suppliers`, { headers }),
        ])
        const [cData, sData] = await Promise.all([cRes.json(), sRes.json()])
        setCategories(cData)
        setSuppliers(sData)
      } catch (error) {
        console.error("Failed to load lookups", error)
      }
    }
    loadLookups()
  }, [user?.id])

  const resetForm = () => {
    setFormError("")
    setForm({
      id: "",
      sku: "",
      name: "",
      category: "",
      supplier: "",
      quantity: "",
      reorderPoint: "",
      price: "",
      location: "",
      lastRestocked: "",
    })
  }

  const openCreate = () => {
    resetForm()
    setFormMode("create")
    setFormOpen(true)
  }

  const openEdit = (product) => {
    setFormError("")
    setFormMode("edit")
    setForm({
      id: product.id || "",
      sku: product.sku || "",
      name: product.name || "",
      category: product.category || "",
      supplier: product.supplier || "",
      quantity: String(product.quantity ?? ""),
      reorderPoint: String(product.reorderPoint ?? ""),
      price: String(product.price ?? ""),
      location: product.location || "",
      lastRestocked: product.lastRestocked || "",
    })
    setFormOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    setFormError("")
    try {
      const payload = {
        sku: form.sku?.trim() || undefined,
        name: form.name?.trim(),
        category: form.category,
        supplier: form.supplier || null,
        quantity: form.quantity === "" ? 0 : Number(form.quantity),
        reorderPoint: form.reorderPoint === "" ? 0 : Number(form.reorderPoint),
        price: form.price === "" ? 0 : Number(form.price),
        location: form.location?.trim() || null,
        lastRestocked: form.lastRestocked || null,
      }

      const url =
        formMode === "create"
          ? `${API_BASE_URL}/api/products`
          : `${API_BASE_URL}/api/products/${encodeURIComponent(form.id)}`

      const res = await fetch(url, {
        method: formMode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Save failed")
      }

      const saved = await res.json()
      const normalized = {
        ...saved,
        quantity: Number(saved.quantity),
        reorderPoint: Number(saved.reorderPoint),
        price: Number(saved.price),
      }

      setProducts((prev) => {
        if (formMode === "create") return [normalized, ...prev]
        return prev.map((p) => (p.id === normalized.id ? normalized : p))
      })

      if (selectedProduct?.id === normalized.id) setSelectedProduct(normalized)
      setFormOpen(false)
      resetForm()
    } catch (e) {
      setFormError(e?.message || "Save failed")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (product) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/products/${encodeURIComponent(product.id)}`,
        { method: "DELETE", headers: getAuthHeaders() },
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Delete failed")
      }
      setProducts((prev) => prev.filter((p) => p.id !== product.id))
      if (selectedProduct?.id === product.id) setSelectedProduct(null)
    } catch (e) {
      console.error("Delete failed", e)
      setFormError(e?.message || "Delete failed")
    }
  }

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.id.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusColor = (status) => {
    switch (status) {
      case "optimal":
        return "bg-white/20 text-white"
      case "low":
        return "bg-orange-500/20 text-orange-500"
      case "critical":
        return "bg-red-500/20 text-red-500"
      default:
        return "bg-neutral-500/20 text-neutral-300"
    }
  }

  const totalProducts = products.length
  const optimalCount = products.filter((p) => p.status === "optimal").length
  const lowCount = products.filter((p) => p.status === "low").length
  const criticalCount = products.filter((p) => p.status === "critical").length

  const categoryOptions = useMemo(
    () => categories.map((c) => ({ value: c.name, label: c.name })),
    [categories],
  )

  const supplierOptions = useMemo(
    () => suppliers.map((s) => ({ value: s.code, label: `${s.code} - ${s.name}` })),
    [suppliers],
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">PRODUCT INVENTORY</h1>
          <p className="text-sm text-neutral-400">Manage all products and stock levels</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={openCreate}>
            Add Product
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">Export List</Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">TOTAL PRODUCTS</p>
                <p className="text-2xl font-bold text-white font-mono">{totalProducts}</p>
              </div>
              <Package className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">OPTIMAL STOCK</p>
                <p className="text-2xl font-bold text-white font-mono">{optimalCount}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">LOW STOCK</p>
                <p className="text-2xl font-bold text-orange-500 font-mono">{lowCount}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">CRITICAL</p>
                <p className="text-2xl font-bold text-red-500 font-mono">{criticalCount}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input
              placeholder="Search products by name, SKU, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400"
            />
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">PRODUCT LIST</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-700">
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">SKU</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">PRODUCT NAME</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">CATEGORY</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">QUANTITY</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">REORDER</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">STATUS</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">LOCATION</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">PRICE</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product, index) => (
                  <tr
                    key={product.id}
                    className={`border-b border-neutral-800 hover:bg-neutral-800 transition-colors cursor-pointer ${
                      index % 2 === 0 ? "bg-neutral-900" : "bg-neutral-850"
                    }`}
                    onClick={() => setSelectedProduct(product)}
                  >
                    <td className="py-3 px-4 text-sm text-white font-mono">{product.sku}</td>
                    <td className="py-3 px-4 text-sm text-white">{product.name}</td>
                    <td className="py-3 px-4 text-sm text-neutral-300">{product.category}</td>
                    <td className="py-3 px-4 text-sm text-white font-mono">{product.quantity}</td>
                    <td className="py-3 px-4 text-sm text-neutral-300 font-mono">{product.reorderPoint}</td>
                    <td className="py-3 px-4">
                      <Badge className={getStatusColor(product.status)}>
                        {product.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-neutral-400" />
                        <span className="text-sm text-neutral-300">{product.location}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-white font-mono">${product.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="bg-neutral-900 border-neutral-700 w-full max-w-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-white tracking-wider">{selectedProduct.name}</CardTitle>
                <p className="text-sm text-neutral-400 font-mono">{selectedProduct.sku}</p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setSelectedProduct(null)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">CURRENT STOCK</p>
                  <p className="text-2xl text-white font-bold font-mono">{selectedProduct.quantity}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">REORDER POINT</p>
                  <p className="text-2xl text-orange-500 font-bold font-mono">{selectedProduct.reorderPoint}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">LOCATION</p>
                  <p className="text-sm text-white">{selectedProduct.location}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">UNIT PRICE</p>
                  <p className="text-sm text-white">${selectedProduct.price}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">STATUS</p>
                  <Badge className={getStatusColor(selectedProduct.status)}>
                    {selectedProduct.status.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">LAST RESTOCKED</p>
                  <p className="text-sm text-white font-mono">{selectedProduct.lastRestocked}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={() => openEdit(selectedProduct)}
                >
                  Update Stock
                </Button>
                <Button
                  variant="outline"
                  className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent"
                  onClick={() => openEdit(selectedProduct)}
                >
                  Edit Product
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-red-500 bg-transparent"
                    >
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-neutral-900 border-neutral-700">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white">Delete product?</AlertDialogTitle>
                      <AlertDialogDescription className="text-neutral-400">
                        This will permanently remove{" "}
                        <span className="text-white font-mono">{selectedProduct.sku}</span> from
                        inventory (and remove linked alerts/transactions).
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-neutral-700 text-neutral-300 bg-transparent hover:bg-neutral-800">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                        onClick={() => handleDelete(selectedProduct)}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create/Edit Product Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="bg-neutral-900 border-neutral-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white tracking-wider">
              {formMode === "create" ? "ADD PRODUCT" : "EDIT PRODUCT"}
            </DialogTitle>
            <DialogDescription className="text-neutral-400">
              {formMode === "create"
                ? "Create a new SKU and set initial stock."
                : "Update product details and stock values."}
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="border border-red-500/40 bg-red-500/10 text-red-200 text-sm rounded p-3">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">SKU (optional)</Label>
              <Input
                value={form.sku}
                onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                placeholder="SKU-010"
                className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">PRODUCT NAME</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Industrial Bearing"
                className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">CATEGORY</Label>
              <Select
                value={form.category}
                onValueChange={(value) => setForm((f) => ({ ...f, category: value }))}
              >
                <SelectTrigger className="bg-neutral-800 border-neutral-600 text-white">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-neutral-700 text-white">
                  {categoryOptions.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">SUPPLIER (optional)</Label>
              <Select
                value={form.supplier || ""}
                onValueChange={(value) => setForm((f) => ({ ...f, supplier: value }))}
              >
                <SelectTrigger className="bg-neutral-800 border-neutral-600 text-white">
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-neutral-700 text-white">
                  {supplierOptions.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">QUANTITY</Label>
              <Input
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                placeholder="0"
                className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">REORDER POINT</Label>
              <Input
                value={form.reorderPoint}
                onChange={(e) => setForm((f) => ({ ...f, reorderPoint: e.target.value }))}
                placeholder="0"
                className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">UNIT PRICE</Label>
              <Input
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="0.00"
                className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">LOCATION</Label>
              <Input
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="Bin A-01"
                className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label className="text-xs text-neutral-400 tracking-wider">LAST RESTOCKED</Label>
              <Input
                type="date"
                value={form.lastRestocked}
                onChange={(e) => setForm((f) => ({ ...f, lastRestocked: e.target.value }))}
                className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="border-neutral-700 text-neutral-300 bg-transparent hover:bg-neutral-800"
              onClick={() => {
                setFormOpen(false)
                resetForm()
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : formMode === "create" ? "Create" : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
