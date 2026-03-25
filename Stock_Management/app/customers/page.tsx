"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Users2, Search, Phone, Mail, MapPin, DollarSign } from "lucide-react"
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

export default function CustomersPage() {
  const { user, getAuthHeaders } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [customers, setCustomers] = useState([])
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState("create") // create | edit
  const [formError, setFormError] = useState("")
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    id: "",
    code: "",
    name: "",
    type: "B2B",
    contactName: "",
    email: "",
    phone: "",
    location: "",
    totalOrders: "",
    totalRevenue: "",
    lastOrderDate: "",
    status: "active",
    creditLimit: "",
    balance: "",
  })

  useEffect(() => {
    async function loadCustomers() {
      try {
        const headers = getAuthHeaders()
        const res = await fetch(`${API_BASE_URL}/api/customers`, { headers })
        const data = await res.json()
        setCustomers(data)
      } catch (error) {
        console.error("Failed to load customers", error)
      }
    }

    loadCustomers()
  }, [user?.id])

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(customer.id).toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const resetForm = () => {
    setFormError("")
    setForm({
      id: "",
      code: "",
      name: "",
      type: "B2B",
      contactName: "",
      email: "",
      phone: "",
      location: "",
      totalOrders: "",
      totalRevenue: "",
      lastOrderDate: "",
      status: "active",
      creditLimit: "",
      balance: "",
    })
  }

  const openCreate = () => {
    resetForm()
    setFormMode("create")
    setFormOpen(true)
  }

  const openEdit = (customer) => {
    setFormError("")
    setFormMode("edit")
    setForm({
      id: String(customer.id ?? ""),
      code: customer.code || "",
      name: customer.name || "",
      type: customer.type || "B2B",
      contactName: customer.contactName || "",
      email: customer.email || "",
      phone: customer.phone || "",
      location: customer.location || "",
      totalOrders: customer.totalOrders !== null && customer.totalOrders !== undefined ? String(customer.totalOrders) : "",
      totalRevenue: customer.totalRevenue !== null && customer.totalRevenue !== undefined ? String(customer.totalRevenue) : "",
      lastOrderDate: customer.lastOrderDate || "",
      status: customer.status || "active",
      creditLimit: customer.creditLimit !== null && customer.creditLimit !== undefined ? String(customer.creditLimit) : "",
      balance: customer.balance !== null && customer.balance !== undefined ? String(customer.balance) : "",
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
        type: form.type,
        contactName: form.contactName?.trim() || null,
        email: form.email?.trim() || null,
        phone: form.phone?.trim() || null,
        location: form.location?.trim() || null,
        totalOrders: form.totalOrders === "" ? 0 : Number(form.totalOrders),
        totalRevenue: form.totalRevenue === "" ? 0 : Number(form.totalRevenue),
        lastOrderDate: form.lastOrderDate || null,
        status: form.status,
        creditLimit: form.creditLimit === "" ? 0 : Number(form.creditLimit),
        balance: form.balance === "" ? 0 : Number(form.balance),
      }

      if (!payload.name) throw new Error("Customer name is required")

      const url =
        formMode === "create"
          ? `${API_BASE_URL}/api/customers`
          : `${API_BASE_URL}/api/customers/${encodeURIComponent(form.id)}`

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
        totalOrders: Number(saved.totalOrders),
        totalRevenue: Number(saved.totalRevenue),
        creditLimit: Number(saved.creditLimit),
        balance: Number(saved.balance),
      }

      setCustomers((prev) => {
        if (formMode === "create") return [normalized, ...prev]
        return prev.map((c) => (String(c.id) === String(normalized.id) ? normalized : c))
      })

      if (selectedCustomer?.id === normalized.id) setSelectedCustomer(normalized)
      setFormOpen(false)
      resetForm()
    } catch (e) {
      setFormError(e?.message || "Save failed")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (customer) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/customers/${customer.id}`, { method: "DELETE", headers: getAuthHeaders() })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Delete failed")
      }
      setCustomers((prev) => prev.filter((c) => String(c.id) !== String(customer.id)))
      if (selectedCustomer?.id === customer.id) setSelectedCustomer(null)
    } catch (e) {
      setFormError(e?.message || "Delete failed")
    }
  }

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

  const totalCustomers = customers.length
  const activeCustomers = customers.filter((c) => c.status === "active").length
  const highValueCustomers = customers.filter((c) => c.totalRevenue > 500000).length
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalRevenue, 0)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">CUSTOMERS</h1>
          <p className="text-sm text-neutral-400">
            Track customers linked to inventory movements and orders
          </p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={openCreate}>
            Add Customer
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
                <p className="text-xs text-neutral-400 tracking-wider">TOTAL CUSTOMERS</p>
                <p className="text-2xl font-bold text-white font-mono">
                  {totalCustomers}
                </p>
              </div>
              <Users2 className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">ACTIVE</p>
                <p className="text-2xl font-bold text-green-400 font-mono">
                  {activeCustomers}
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
                <p className="text-xs text-neutral-400 tracking-wider">HIGH VALUE</p>
                <p className="text-2xl font-bold text-orange-500 font-mono">
                  {highValueCustomers}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">TOTAL REVENUE</p>
                <p className="text-2xl font-bold text-white font-mono">
                  ${(totalRevenue / 1000).toFixed(1)}K
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-white" />
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
              placeholder="Search customers by name, code, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
            CUSTOMER LIST
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
                    CUSTOMER NAME
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">
                    TYPE
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">
                    LOCATION
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">
                    LAST ORDER
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">
                    ORDERS
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">
                    REVENUE
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">
                    STATUS
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer, index) => (
                  <tr
                    key={customer.id}
                    className={`border-b border-neutral-800 hover:bg-neutral-800 transition-colors cursor-pointer ${
                      index % 2 === 0 ? "bg-neutral-900" : "bg-neutral-850"
                    }`}
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    <td className="py-3 px-4 text-sm text-white font-mono">
                      {customer.code}
                    </td>
                    <td className="py-3 px-4 text-sm text-white">{customer.name}</td>
                    <td className="py-3 px-4 text-sm text-neutral-300">
                      {customer.type}
                    </td>
                    <td className="py-3 px-4 text-sm text-neutral-300">
                      <span className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-neutral-400" />
                        {customer.location}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-neutral-300 font-mono">
                      {customer.lastOrderDate}
                    </td>
                    <td className="py-3 px-4 text-sm text-white font-mono">
                      {customer.totalOrders}
                    </td>
                    <td className="py-3 px-4 text-sm text-white font-mono">
                      ${customer.totalRevenue.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={getStatusColor(customer.status)}>
                        {customer.status.toUpperCase()}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="bg-neutral-900 border-neutral-700 w-full max-w-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-white tracking-wider">
                  {selectedCustomer.name}
                </CardTitle>
                <p className="text-sm text-neutral-400 font-mono">
                  {selectedCustomer.code}
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setSelectedCustomer(null)}
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
                  <p className="text-sm text-white">{selectedCustomer.contactName}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">
                    LOCATION
                  </p>
                  <p className="text-sm text-white flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-neutral-400" />
                    {selectedCustomer.location}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">
                    EMAIL
                  </p>
                  <p className="text-sm text-white flex items-center gap-2">
                    <Mail className="w-3 h-3 text-neutral-400" />
                    {selectedCustomer.email}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">
                    PHONE
                  </p>
                  <p className="text-sm text-white flex items-center gap-2">
                    <Phone className="w-3 h-3 text-neutral-400" />
                    {selectedCustomer.phone}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">
                    STATUS
                  </p>
                  <Badge className={getStatusColor(selectedCustomer.status)}>
                    {selectedCustomer.status.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">
                    CUSTOMER TYPE
                  </p>
                  <p className="text-sm text-white">{selectedCustomer.type}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">
                    TOTAL ORDERS
                  </p>
                  <p className="text-2xl text-white font-bold font-mono">
                    {selectedCustomer.totalOrders}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">
                    TOTAL REVENUE
                  </p>
                  <p className="text-2xl text-orange-500 font-bold font-mono">
                    ${selectedCustomer.totalRevenue.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">
                    CREDIT LIMIT
                  </p>
                  <p className="text-sm text-white font-mono">
                    ${selectedCustomer.creditLimit.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">
                    OUTSTANDING BALANCE
                  </p>
                  <p className="text-sm text-white font-mono">
                    ${selectedCustomer.balance.toLocaleString()}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">
                    LAST ORDER DATE
                  </p>
                  <p className="text-sm text-white font-mono">
                    {selectedCustomer.lastOrderDate}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 pt-4 border-t border-neutral-700">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                  Create Sales Order
                </Button>
                <Button
                  variant="outline"
                  className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent"
                >
                  View Order History
                </Button>
                <Button
                  variant="outline"
                  className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent"
                  onClick={() => openEdit(selectedCustomer)}
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
                      <AlertDialogTitle className="text-white">Delete customer?</AlertDialogTitle>
                      <AlertDialogDescription className="text-neutral-400">
                        This will remove customer{" "}
                        <span className="text-white font-mono">{selectedCustomer.code}</span> and
                        unlink it from transactions.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-neutral-700 text-neutral-300 bg-transparent hover:bg-neutral-800">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                        onClick={() => handleDelete(selectedCustomer)}
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

      {/* Create/Edit Customer Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="bg-neutral-900 border-neutral-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white tracking-wider">
              {formMode === "create" ? "ADD CUSTOMER" : "EDIT CUSTOMER"}
            </DialogTitle>
            <DialogDescription className="text-neutral-400">
              {formMode === "create"
                ? "Create a new customer profile."
                : "Update customer contact and account details."}
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
                placeholder="CUST-MFG-01"
                className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">CUSTOMER NAME</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Alpha Manufacturing Ltd."
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
                  <SelectItem value="B2B">B2B</SelectItem>
                  <SelectItem value="B2C">B2C</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">STATUS</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
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
              <Label className="text-xs text-neutral-400 tracking-wider">CONTACT NAME</Label>
              <Input
                value={form.contactName}
                onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
                placeholder="Michael Green"
                className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">LOCATION</Label>
              <Input
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="City, Country"
                className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">EMAIL</Label>
              <Input
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="customer@email.com"
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

            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">TOTAL ORDERS</Label>
              <Input
                value={form.totalOrders}
                onChange={(e) => setForm((f) => ({ ...f, totalOrders: e.target.value }))}
                placeholder="0"
                className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">TOTAL REVENUE</Label>
              <Input
                value={form.totalRevenue}
                onChange={(e) => setForm((f) => ({ ...f, totalRevenue: e.target.value }))}
                placeholder="0"
                className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">CREDIT LIMIT</Label>
              <Input
                value={form.creditLimit}
                onChange={(e) => setForm((f) => ({ ...f, creditLimit: e.target.value }))}
                placeholder="0"
                className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">BALANCE</Label>
              <Input
                value={form.balance}
                onChange={(e) => setForm((f) => ({ ...f, balance: e.target.value }))}
                placeholder="0"
                className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label className="text-xs text-neutral-400 tracking-wider">LAST ORDER DATE</Label>
              <Input
                type="date"
                value={form.lastOrderDate}
                onChange={(e) => setForm((f) => ({ ...f, lastOrderDate: e.target.value }))}
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

