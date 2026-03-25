"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Factory, Search, Phone, Mail, MapPin, Star } from "lucide-react"
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

export default function SuppliersPage() {
  const { user, getAuthHeaders } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [suppliers, setSuppliers] = useState([])
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState("create") // create | edit
  const [formError, setFormError] = useState("")
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    id: "",
    code: "",
    name: "",
    contactName: "",
    email: "",
    phone: "",
    location: "",
    leadTimeDays: "",
    onTimeRate: "",
    rating: "",
    status: "active",
    paymentTerms: "",
    lastOrderDate: "",
    totalSpend: "",
  })

  useEffect(() => {
    async function loadSuppliers() {
      try {
        const headers = getAuthHeaders()
        const res = await fetch(`${API_BASE_URL}/api/suppliers`, { headers })
        const data = await res.json()
        setSuppliers(data)
      } catch (error) {
        console.error("Failed to load suppliers", error)
      }
    }

    loadSuppliers()
  }, [user?.id])

  const resetForm = () => {
    setFormError("")
    setForm({
      id: "",
      code: "",
      name: "",
      contactName: "",
      email: "",
      phone: "",
      location: "",
      leadTimeDays: "",
      onTimeRate: "",
      rating: "",
      status: "active",
      paymentTerms: "",
      lastOrderDate: "",
      totalSpend: "",
    })
  }

  const openCreate = () => {
    resetForm()
    setFormMode("create")
    setFormOpen(true)
  }

  const openEdit = (supplier) => {
    setFormError("")
    setFormMode("edit")
    setForm({
      id: String(supplier.id ?? ""),
      code: supplier.code || "",
      name: supplier.name || "",
      contactName: supplier.contactName || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      location: supplier.location || "",
      leadTimeDays: supplier.leadTimeDays !== null && supplier.leadTimeDays !== undefined ? String(supplier.leadTimeDays) : "",
      onTimeRate: supplier.onTimeRate !== null && supplier.onTimeRate !== undefined ? String(supplier.onTimeRate) : "",
      rating: supplier.rating !== null && supplier.rating !== undefined ? String(supplier.rating) : "",
      status: supplier.status || "active",
      paymentTerms: supplier.paymentTerms || "",
      lastOrderDate: supplier.lastOrderDate || "",
      totalSpend: supplier.totalSpend !== null && supplier.totalSpend !== undefined ? String(supplier.totalSpend) : "",
    })
    setFormOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    setFormError("")
    try {
      const payload = {
        code: form.code?.trim() || undefined,
        name: form.name?.trim(),
        contactName: form.contactName?.trim() || null,
        email: form.email?.trim() || null,
        phone: form.phone?.trim() || null,
        location: form.location?.trim() || null,
        leadTimeDays: form.leadTimeDays === "" ? null : Number(form.leadTimeDays),
        onTimeRate: form.onTimeRate === "" ? null : Number(form.onTimeRate),
        rating: form.rating === "" ? null : Number(form.rating),
        status: form.status,
        paymentTerms: form.paymentTerms?.trim() || null,
        lastOrderDate: form.lastOrderDate || null,
        totalSpend: form.totalSpend === "" ? 0 : Number(form.totalSpend),
      }

      if (!payload.name) throw new Error("Supplier name is required")

      const url =
        formMode === "create"
          ? `${API_BASE_URL}/api/suppliers`
          : `${API_BASE_URL}/api/suppliers/${encodeURIComponent(form.id)}`

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
        leadTimeDays: saved.leadTimeDays === null ? null : Number(saved.leadTimeDays),
        onTimeRate: saved.onTimeRate === null ? null : Number(saved.onTimeRate),
        rating: saved.rating === null ? null : Number(saved.rating),
        totalSpend: saved.totalSpend === null ? 0 : Number(saved.totalSpend),
      }

      setSuppliers((prev) => {
        if (formMode === "create") return [normalized, ...prev]
        return prev.map((s) => (String(s.id) === String(normalized.id) ? normalized : s))
      })

      if (selectedSupplier?.id === normalized.id) setSelectedSupplier(normalized)
      setFormOpen(false)
      resetForm()
    } catch (e) {
      setFormError(e?.message || "Save failed")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (supplier) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/suppliers/${supplier.id}`, { method: "DELETE", headers: getAuthHeaders() })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Delete failed")
      }
      setSuppliers((prev) => prev.filter((s) => String(s.id) !== String(supplier.id)))
      if (selectedSupplier?.id === supplier.id) setSelectedSupplier(null)
    } catch (e) {
      setFormError(e?.message || "Delete failed")
    }
  }

      const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          String(supplier.id).toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400"
      case "on-hold":
        return "bg-orange-500/20 text-orange-500"
      case "inactive":
        return "bg-neutral-600/40 text-neutral-300"
      default:
        return "bg-neutral-500/20 text-neutral-300"
    }
  }

  const totalSuppliers = suppliers.length
  const activeSuppliers = suppliers.filter((s) => s.status === "active").length
  const onHoldSuppliers = suppliers.filter((s) => s.status === "on-hold").length
  const avgLeadTime =
    Math.round(
      suppliers.reduce((sum, s) => sum + s.leadTimeDays, 0) / (suppliers.length || 1),
    )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">SUPPLIERS</h1>
          <p className="text-sm text-neutral-400">
            Manage all vendors providing stock to your warehouses
          </p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={openCreate}>
            Add Supplier
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">
            Export List
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">TOTAL SUPPLIERS</p>
                <p className="text-2xl font-bold text-white font-mono">{totalSuppliers}</p>
              </div>
              <Factory className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">ACTIVE</p>
                <p className="text-2xl font-bold text-green-400 font-mono">
                  {activeSuppliers}
                </p>
              </div>
              <Badge className="bg-green-500/20 text-green-400 text-xs">OK</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">ON HOLD</p>
                <p className="text-2xl font-bold text-orange-500 font-mono">
                  {onHoldSuppliers}
                </p>
              </div>
              <Badge className="bg-orange-500/20 text-orange-500 text-xs">
                REVIEW
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">AVG LEAD TIME</p>
                <p className="text-2xl font-bold text-white font-mono">
                  {avgLeadTime} days
                </p>
              </div>
              <Star className="w-8 h-8 text-orange-500" />
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
              placeholder="Search suppliers by name, code, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400"
            />
          </div>
        </CardContent>
      </Card>

      {/* Suppliers Table */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
            SUPPLIER LIST
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-700">
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">
                    CODE
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">
                    SUPPLIER NAME
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">
                    CONTACT
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">
                    PHONE
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">
                    EMAIL
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">
                    STATUS
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">
                    LEAD TIME
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">
                    TOTAL SPEND
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.map((supplier, index) => (
                  <tr
                    key={supplier.id}
                    className={`border-b border-neutral-800 hover:bg-neutral-800 transition-colors cursor-pointer ${
                      index % 2 === 0 ? "bg-neutral-900" : "bg-neutral-850"
                    }`}
                    onClick={() => setSelectedSupplier(supplier)}
                  >
                    <td className="py-3 px-4 text-sm text-white font-mono">
                      {supplier.code}
                    </td>
                    <td className="py-3 px-4 text-sm text-white">{supplier.name}</td>
                    <td className="py-3 px-4 text-sm text-neutral-300">
                      {supplier.contactName}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3 text-neutral-400" />
                        <span className="text-sm text-neutral-300">
                          {supplier.phone}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3 h-3 text-neutral-400" />
                        <span className="text-xs text-neutral-300">
                          {supplier.email}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={getStatusColor(supplier.status)}>
                        {supplier.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-white font-mono">
                      {supplier.leadTimeDays} days
                    </td>
                    <td className="py-3 px-4 text-sm text-white font-mono">
                      ${supplier.totalSpend.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Supplier Detail Modal */}
      {selectedSupplier && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="bg-neutral-900 border-neutral-700 w-full max-w-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-white tracking-wider">
                  {selectedSupplier.name}
                </CardTitle>
                <p className="text-sm text-neutral-400 font-mono">
                  {selectedSupplier.code}
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setSelectedSupplier(null)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">
                    CONTACT NAME
                  </p>
                  <p className="text-sm text-white">{selectedSupplier.contactName}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">
                    LOCATION
                  </p>
                  <p className="text-sm text-white flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-neutral-400" />
                    {selectedSupplier.location}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">
                    EMAIL
                  </p>
                  <p className="text-sm text-white flex items-center gap-2">
                    <Mail className="w-3 h-3 text-neutral-400" />
                    {selectedSupplier.email}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">
                    PHONE
                  </p>
                  <p className="text-sm text-white flex items-center gap-2">
                    <Phone className="w-3 h-3 text-neutral-400" />
                    {selectedSupplier.phone}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">
                    STATUS
                  </p>
                  <Badge className={getStatusColor(selectedSupplier.status)}>
                    {selectedSupplier.status.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">
                    PAYMENT TERMS
                  </p>
                  <p className="text-sm text-white">{selectedSupplier.paymentTerms}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">
                    LEAD TIME
                  </p>
                  <p className="text-2xl text-white font-bold font-mono">
                    {selectedSupplier.leadTimeDays} days
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">
                    ON-TIME DELIVERY
                  </p>
                  <p className="text-2xl text-orange-500 font-bold font-mono">
                    {selectedSupplier.onTimeRate}%
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">
                    TOTAL SPEND
                  </p>
                  <p className="text-2xl font-bold text-orange-500 font-mono">
                    ${selectedSupplier.totalSpend.toLocaleString()}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">
                    LAST ORDER DATE
                  </p>
                  <p className="text-sm text-white font-mono">
                    {selectedSupplier.lastOrderDate}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 pt-4 border-t border-neutral-700">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                  Create Purchase Order
                </Button>
                <Button
                  variant="outline"
                  className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent"
                >
                  View Purchase History
                </Button>
                <Button
                  variant="outline"
                  className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent"
                  onClick={() => openEdit(selectedSupplier)}
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
                      <AlertDialogTitle className="text-white">Delete supplier?</AlertDialogTitle>
                      <AlertDialogDescription className="text-neutral-400">
                        This will remove supplier{" "}
                        <span className="text-white font-mono">{selectedSupplier.code}</span> and
                        unlink it from products/transactions.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-neutral-700 text-neutral-300 bg-transparent hover:bg-neutral-800">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                        onClick={() => handleDelete(selectedSupplier)}
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

      {/* Create/Edit Supplier Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="bg-neutral-900 border-neutral-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white tracking-wider">
              {formMode === "create" ? "ADD SUPPLIER" : "EDIT SUPPLIER"}
            </DialogTitle>
            <DialogDescription className="text-neutral-400">
              {formMode === "create"
                ? "Create a new supplier profile."
                : "Update supplier contact and performance details."}
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="border border-red-500/40 bg-red-500/10 text-red-200 text-sm rounded p-3">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">CODE (optional)</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                placeholder="SUP-IND-01"
                className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">SUPPLIER NAME</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Industrial Components Co."
                className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">CONTACT NAME</Label>
              <Input
                value={form.contactName}
                onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
                placeholder="Laura Bennett"
                className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">STATUS</Label>
              <Select
                value={form.status}
                onValueChange={(value) => setForm((f) => ({ ...f, status: value }))}
              >
                <SelectTrigger className="bg-neutral-800 border-neutral-600 text-white">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-neutral-700 text-white">
                  <SelectItem value="active">active</SelectItem>
                  <SelectItem value="on-hold">on-hold</SelectItem>
                  <SelectItem value="inactive">inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">EMAIL</Label>
              <Input
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="supplier@email.com"
                className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">PHONE</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+1 (555) 000-0000"
                className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label className="text-xs text-neutral-400 tracking-wider">LOCATION</Label>
              <Input
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="City, Country"
                className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">LEAD TIME (days)</Label>
              <Input
                value={form.leadTimeDays}
                onChange={(e) => setForm((f) => ({ ...f, leadTimeDays: e.target.value }))}
                placeholder="7"
                className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">ON-TIME RATE (%)</Label>
              <Input
                value={form.onTimeRate}
                onChange={(e) => setForm((f) => ({ ...f, onTimeRate: e.target.value }))}
                placeholder="98"
                className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">RATING (1-5)</Label>
              <Input
                value={form.rating}
                onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))}
                placeholder="5"
                className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">PAYMENT TERMS</Label>
              <Input
                value={form.paymentTerms}
                onChange={(e) => setForm((f) => ({ ...f, paymentTerms: e.target.value }))}
                placeholder="Net 30"
                className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">LAST ORDER DATE</Label>
              <Input
                type="date"
                value={form.lastOrderDate}
                onChange={(e) => setForm((f) => ({ ...f, lastOrderDate: e.target.value }))}
                className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">TOTAL SPEND</Label>
              <Input
                value={form.totalSpend}
                onChange={(e) => setForm((f) => ({ ...f, totalSpend: e.target.value }))}
                placeholder="0"
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
