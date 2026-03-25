"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, TrendingDown, TrendingUp, Edit2, Filter } from "lucide-react"
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

const API_BASE_URL = "http://localhost:4000"

export default function TransactionsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [filterType, setFilterType] = useState("all")
  const [transactions, setTransactions] = useState([])
  const [products, setProducts] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [customers, setCustomers] = useState([])

  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState("create") // create | edit
  const [formError, setFormError] = useState("")
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    id: "",
    occurredAt: "",
    reference: "",
    type: "in",
    productSku: "",
    supplierCode: "",
    customerCode: "",
    quantity: "",
    unitPrice: "",
    user: "",
    notes: "",
  })

  useEffect(() => {
    async function loadTransactions() {
      try {
        const headers = getAuthHeaders()
        const res = await fetch(`${API_BASE_URL}/api/transactions`, { headers })
        const data = await res.json()
        const normalized = data.map((txn) => ({
          ...txn,
          quantity: Number(txn.quantity),
          unitPrice: Number(txn.unitPrice),
          total: Number(txn.total),
        }))
        setTransactions(normalized)
      } catch (error) {
        console.error("Failed to load transactions", error)
      }
    }

    loadTransactions()
  }, [user?.id])

  useEffect(() => {
    async function loadLookups() {
      try {
        const headers = getAuthHeaders()
        const [pRes, sRes, cRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/products`, { headers }),
          fetch(`${API_BASE_URL}/api/suppliers`, { headers }),
          fetch(`${API_BASE_URL}/api/customers`, { headers }),
        ])
        const [pData, sData, cData] = await Promise.all([
          pRes.json(),
          sRes.json(),
          cRes.json(),
        ])
        setProducts(pData)
        setSuppliers(sData)
        setCustomers(cData)
      } catch (error) {
        console.error("Failed to load lookups", error)
      }
    }
    loadLookups()
  }, [user?.id])

  const productOptions = useMemo(
    () => products.map((p) => ({ value: p.sku, label: `${p.sku} - ${p.name}` })),
    [products],
  )
  const supplierOptions = useMemo(
    () => suppliers.map((s) => ({ value: s.code, label: `${s.code} - ${s.name}` })),
    [suppliers],
  )
  const customerOptions = useMemo(
    () => customers.map((c) => ({ value: c.code, label: `${c.code} - ${c.name}` })),
    [customers],
  )

  const resetForm = () => {
    setFormError("")
    setForm({
      id: "",
      occurredAt: "",
      reference: "",
      type: "in",
      productSku: "",
      supplierCode: "",
      customerCode: "",
      quantity: "",
      unitPrice: "",
      user: "",
      notes: "",
    })
  }

  const openCreate = () => {
    resetForm()
    setFormMode("create")
    setFormOpen(true)
  }

  const openEdit = (txn) => {
    setFormError("")
    setFormMode("edit")
    // txn.date is "YYYY-MM-DD HH:mm:ss" -> convert to datetime-local
    const occurredAt = txn.date ? txn.date.replace(" ", "T").slice(0, 16) : ""
    setForm({
      id: txn.id,
      occurredAt,
      reference: txn.reference || "",
      type: txn.type || "in",
      productSku: txn.sku || "",
      supplierCode: "",
      customerCode: "",
      quantity: String(txn.quantity ?? ""),
      unitPrice: String(txn.unitPrice ?? ""),
      user: txn.user || "",
      notes: txn.notes || "",
    })
    setFormOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    setFormError("")
    try {
      const payload = {
        occurredAt: form.occurredAt ? new Date(form.occurredAt).toISOString() : undefined,
        reference: form.reference?.trim(),
        type: form.type,
        productSku: form.productSku,
        supplierCode: form.supplierCode || null,
        customerCode: form.customerCode || null,
        quantity: form.quantity === "" ? 0 : Number(form.quantity),
        unitPrice: form.unitPrice === "" ? 0 : Number(form.unitPrice),
        user: form.user?.trim() || null,
        notes: form.notes?.trim() || null,
      }

      if (!payload.reference || !payload.productSku) {
        throw new Error("Reference and Product are required")
      }

      const url =
        formMode === "create"
          ? `${API_BASE_URL}/api/transactions`
          : `${API_BASE_URL}/api/transactions/${encodeURIComponent(form.id)}`

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
        unitPrice: Number(saved.unitPrice),
        total: Number(saved.total),
      }

      setTransactions((prev) => {
        if (formMode === "create") return [normalized, ...prev]
        return prev.map((t) => (t.id === normalized.id ? normalized : t))
      })

      if (selectedTransaction?.id === normalized.id) setSelectedTransaction(normalized)
      setFormOpen(false)
      resetForm()
    } catch (e) {
      setFormError(e?.message || "Save failed")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (txn) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/transactions/${encodeURIComponent(txn.id)}`,
        { method: "DELETE", headers: getAuthHeaders() },
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Delete failed")
      }
      setTransactions((prev) => prev.filter((t) => t.id !== txn.id))
      if (selectedTransaction?.id === txn.id) setSelectedTransaction(null)
    } catch (e) {
      setFormError(e?.message || "Delete failed")
    }
  }

  const filteredTransactions = transactions.filter((txn) => {
    const matchesSearch =
      txn.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === "all" || txn.type === filterType
    return matchesSearch && matchesFilter
  })

  const getTypeColor = (type) => {
    switch (type) {
      case "in":
        return "bg-green-500/20 text-green-400"
      case "out":
        return "bg-orange-500/20 text-orange-500"
      case "adjustment":
        return "bg-blue-500/20 text-blue-400"
      default:
        return "bg-neutral-500/20 text-neutral-300"
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case "in":
        return <TrendingUp className="w-4 h-4" />
      case "out":
        return <TrendingDown className="w-4 h-4" />
      case "adjustment":
        return <Edit2 className="w-4 h-4" />
      default:
        return null
    }
  }

  const stats = {
    in: transactions.filter((t) => t.type === "in").reduce((sum, t) => sum + t.total, 0),
    out: transactions.filter((t) => t.type === "out").reduce((sum, t) => sum + t.total, 0),
    adjustment: transactions.filter((t) => t.type === "adjustment").reduce((sum, t) => sum + t.total, 0),
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">TRANSACTION HISTORY</h1>
          <p className="text-sm text-neutral-400">Track all inventory movements and adjustments</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={openCreate}>
            Record Transaction
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">
            <Filter className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Transaction Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">INBOUND VALUE</p>
                <p className="text-2xl font-bold text-green-400 font-mono">${(stats.in / 1000).toFixed(1)}K</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">OUTBOUND VALUE</p>
                <p className="text-2xl font-bold text-orange-500 font-mono">${(stats.out / 1000).toFixed(1)}K</p>
              </div>
              <TrendingDown className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">ADJUSTMENTS</p>
                <p className="text-2xl font-bold text-blue-400 font-mono">${(stats.adjustment / 1000).toFixed(1)}K</p>
              </div>
              <Edit2 className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="lg:col-span-2 bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                placeholder="Search by reference, product, or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex gap-2">
              {["all", "in", "out", "adjustment"].map((type) => (
                <Button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`text-xs ${
                    filterType === type
                      ? "bg-orange-500 text-white"
                      : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">TRANSACTION LIST</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-700">
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">DATE & TIME</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">REFERENCE</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">TYPE</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">PRODUCT</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">QUANTITY</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">UNIT PRICE</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">TOTAL</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">USER</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((txn, index) => (
                  <tr
                    key={txn.id}
                    className={`border-b border-neutral-800 hover:bg-neutral-800 transition-colors cursor-pointer ${
                      index % 2 === 0 ? "bg-neutral-900" : "bg-neutral-850"
                    }`}
                    onClick={() => setSelectedTransaction(txn)}
                  >
                    <td className="py-3 px-4 text-sm text-white font-mono">{txn.date}</td>
                    <td className="py-3 px-4 text-sm text-neutral-300 font-mono">{txn.reference}</td>
                    <td className="py-3 px-4">
                      <Badge className={getTypeColor(txn.type)}>
                        {txn.type.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-white">{txn.product}</td>
                    <td className="py-3 px-4 text-sm text-white font-mono">{txn.quantity}</td>
                    <td className="py-3 px-4 text-sm text-neutral-300 font-mono">${txn.unitPrice}</td>
                    <td className="py-3 px-4 text-sm text-white font-mono">${txn.total.toFixed(2)}</td>
                    <td className="py-3 px-4 text-sm text-neutral-300">{txn.user}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="bg-neutral-900 border-neutral-700 w-full max-w-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-white tracking-wider">{selectedTransaction.reference}</CardTitle>
                <p className="text-sm text-neutral-400 font-mono">{selectedTransaction.id}</p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setSelectedTransaction(null)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">TRANSACTION TYPE</p>
                  <Badge className={getTypeColor(selectedTransaction.type)}>
                    {selectedTransaction.type.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">DATE & TIME</p>
                  <p className="text-sm text-white">{selectedTransaction.date}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">PRODUCT</p>
                  <p className="text-sm text-white">{selectedTransaction.product}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">SKU</p>
                  <p className="text-sm text-neutral-300 font-mono">{selectedTransaction.sku}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">QUANTITY</p>
                  <p className="text-sm text-white font-mono">{selectedTransaction.quantity}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">UNIT PRICE</p>
                  <p className="text-sm text-white font-mono">${selectedTransaction.unitPrice}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">TOTAL VALUE</p>
                  <p className="text-2xl font-bold text-orange-500 font-mono">${selectedTransaction.total.toFixed(2)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">HANDLED BY</p>
                  <p className="text-sm text-white">{selectedTransaction.user}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">NOTES</p>
                  <p className="text-sm text-neutral-300">{selectedTransaction.notes}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">Print Receipt</Button>
                <Button
                  variant="outline"
                  className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent"
                  onClick={() => openEdit(selectedTransaction)}
                >
                  Edit
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
                      <AlertDialogTitle className="text-white">Delete transaction?</AlertDialogTitle>
                      <AlertDialogDescription className="text-neutral-400">
                        This will permanently remove{" "}
                        <span className="text-white font-mono">{selectedTransaction.id}</span>.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-neutral-700 text-neutral-300 bg-transparent hover:bg-neutral-800">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                        onClick={() => handleDelete(selectedTransaction)}
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

      {/* Create/Edit Transaction Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="bg-neutral-900 border-neutral-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white tracking-wider">
              {formMode === "create" ? "RECORD TRANSACTION" : "EDIT TRANSACTION"}
            </DialogTitle>
            <DialogDescription className="text-neutral-400">
              Record inbound, outbound, or adjustment movements linked to SKUs.
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="border border-red-500/40 bg-red-500/10 text-red-200 text-sm rounded p-3">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">DATE & TIME</Label>
              <Input
                type="datetime-local"
                value={form.occurredAt}
                onChange={(e) => setForm((f) => ({ ...f, occurredAt: e.target.value }))}
                className="bg-neutral-800 border-neutral-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">REFERENCE</Label>
              <Input
                value={form.reference}
                onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
                placeholder="PO-0000 / SO-0000 / ADJ-000"
                className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">TYPE</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger className="bg-neutral-800 border-neutral-600 text-white">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-neutral-700 text-white">
                  <SelectItem value="in">in</SelectItem>
                  <SelectItem value="out">out</SelectItem>
                  <SelectItem value="adjustment">adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">PRODUCT (SKU)</Label>
              <Select
                value={form.productSku}
                onValueChange={(v) => setForm((f) => ({ ...f, productSku: v }))}
              >
                <SelectTrigger className="bg-neutral-800 border-neutral-600 text-white">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-neutral-700 text-white">
                  {productOptions.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">SUPPLIER (optional)</Label>
              <Select
                value={form.supplierCode}
                onValueChange={(v) => setForm((f) => ({ ...f, supplierCode: v }))}
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
              <Label className="text-xs text-neutral-400 tracking-wider">CUSTOMER (optional)</Label>
              <Select
                value={form.customerCode}
                onValueChange={(v) => setForm((f) => ({ ...f, customerCode: v }))}
              >
                <SelectTrigger className="bg-neutral-800 border-neutral-600 text-white">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-neutral-700 text-white">
                  {customerOptions.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
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
              <Label className="text-xs text-neutral-400 tracking-wider">UNIT PRICE</Label>
              <Input
                value={form.unitPrice}
                onChange={(e) => setForm((f) => ({ ...f, unitPrice: e.target.value }))}
                placeholder="0.00"
                className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">USER</Label>
              <Input
                value={form.user}
                onChange={(e) => setForm((f) => ({ ...f, user: e.target.value }))}
                placeholder="Operator name"
                className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label className="text-xs text-neutral-400 tracking-wider">NOTES</Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Optional notes"
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
