"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { AlertTriangle, AlertCircle, CheckCircle, Clock, Trash2 } from "lucide-react"
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
import { useAuth } from "@/context/auth"

const API_BASE_URL = "http://localhost:4000"

export default function AlertsPage() {
  const { user, getAuthHeaders } = useAuth()
  const [alerts, setAlerts] = useState([])
  const [products, setProducts] = useState([])
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState("create") // create | edit
  const [formError, setFormError] = useState("")
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    id: "",
    type: "warning",
    status: "active",
    productSku: "",
    current: "",
    threshold: "",
    message: "",
    alertAt: "",
  })

  useEffect(() => {
    async function loadAlerts() {
      try {
        const headers = getAuthHeaders()
        const res = await fetch(`${API_BASE_URL}/api/alerts`, { headers })
        const data = await res.json()
        setAlerts(data)
      } catch (error) {
        console.error("Failed to load alerts", error)
      }
    }

    loadAlerts()
  }, [])

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/products`)
        const data = await res.json()
        setProducts(data)
      } catch (error) {
        console.error("Failed to load products", error)
      }
    }
    loadProducts()
  }, [user?.id])

  const productOptions = useMemo(
    () => products.map((p) => ({ value: p.sku, label: `${p.sku} - ${p.name}` })),
    [products],
  )

  const [selectedAlert, setSelectedAlert] = useState(null)

  const getAlertColor = (type) => {
    switch (type) {
      case "critical":
        return "bg-red-500/20 text-red-500"
      case "warning":
        return "bg-orange-500/20 text-orange-500"
      case "info":
        return "bg-blue-500/20 text-blue-400"
      default:
        return "bg-neutral-500/20 text-neutral-300"
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-red-500/20 text-red-500"
      case "acknowledged":
        return "bg-orange-500/20 text-orange-500"
      case "resolved":
        return "bg-green-500/20 text-green-400"
      default:
        return "bg-neutral-500/20 text-neutral-300"
    }
  }

  const getAlertIcon = (type) => {
    switch (type) {
      case "critical":
        return <AlertTriangle className="w-5 h-5" />
      case "warning":
        return <AlertCircle className="w-5 h-5" />
      case "info":
        return <CheckCircle className="w-5 h-5" />
      default:
        return null
    }
  }

  const dismissAlert = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/alerts/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Delete failed")
      }
      setAlerts((prev) => prev.filter((a) => a.id !== id))
      if (selectedAlert?.id === id) setSelectedAlert(null)
    } catch (e) {
      setFormError(e?.message || "Delete failed")
    }
  }

  const updateAlertStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/alerts/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Update failed")
      }
      const updated = await res.json()
      setAlerts((prev) => prev.map((a) => (a.id === id ? updated : a)))
      if (selectedAlert?.id === id) setSelectedAlert(updated)
    } catch (e) {
      setFormError(e?.message || "Update failed")
    }
  }

  const acknowledgeAlert = (id) => updateAlertStatus(id, "acknowledged")
  const resolveAlert = (id) => updateAlertStatus(id, "resolved")

  const resetForm = () => {
    setFormError("")
    setForm({
      id: "",
      type: "warning",
      status: "active",
      productSku: "",
      current: "",
      threshold: "",
      message: "",
      alertAt: "",
    })
  }

  const openCreate = () => {
    resetForm()
    setFormMode("create")
    setFormOpen(true)
  }

  const openEdit = (alert) => {
    setFormError("")
    setFormMode("edit")
    const alertAt = alert.date ? alert.date.replace(" ", "T").slice(0, 16) : ""
    setForm({
      id: alert.id,
      type: alert.type || "warning",
      status: alert.status || "active",
      productSku: alert.sku || "",
      current: String(alert.current ?? ""),
      threshold: String(alert.threshold ?? ""),
      message: alert.message || "",
      alertAt,
    })
    setFormOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    setFormError("")
    try {
      const payload = {
        type: form.type,
        status: form.status,
        productSku: form.productSku,
        current: form.current === "" ? 0 : Number(form.current),
        threshold: form.threshold === "" ? 0 : Number(form.threshold),
        message: form.message?.trim(),
        alertAt: form.alertAt ? new Date(form.alertAt).toISOString() : undefined,
      }

      if (!payload.productSku || !payload.message) {
        throw new Error("Product and message are required")
      }

      const url =
        formMode === "create"
          ? `${API_BASE_URL}/api/alerts`
          : `${API_BASE_URL}/api/alerts/${encodeURIComponent(form.id)}`

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
      setAlerts((prev) => {
        if (formMode === "create") return [saved, ...prev]
        return prev.map((a) => (a.id === saved.id ? saved : a))
      })
      if (selectedAlert?.id === saved.id) setSelectedAlert(saved)
      setFormOpen(false)
      resetForm()
    } catch (e) {
      setFormError(e?.message || "Save failed")
    } finally {
      setSaving(false)
    }
  }

  const clearAll = async () => {
    setFormError("")
    try {
      const headers = getAuthHeaders()
      await Promise.all(
        alerts.map((a) =>
          fetch(`${API_BASE_URL}/api/alerts/${encodeURIComponent(a.id)}`, { method: "DELETE", headers }),
        ),
      )
      setAlerts([])
      setSelectedAlert(null)
    } catch (e) {
      setFormError(e?.message || "Clear all failed")
    }
  }

  const activeAlerts = alerts.filter((a) => a.status === "active")
  const acknowledgedAlerts = alerts.filter((a) => a.status === "acknowledged")
  const resolvedAlerts = alerts.filter((a) => a.status === "resolved")
  let saveButtonLabel = formMode === "create" ? "Create" : "Update"
  if (saving) saveButtonLabel = "Saving..."

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">INVENTORY ALERTS</h1>
          <p className="text-sm text-neutral-400">Low stock warnings and system notifications</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={openCreate}>
            New Alert
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={clearAll}>
            Clear All
          </Button>
        </div>
      </div>

      {/* Alert Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">TOTAL ALERTS</p>
                <p className="text-2xl font-bold text-white font-mono">{alerts.length}</p>
              </div>
              <Clock className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">ACTIVE</p>
                <p className="text-2xl font-bold text-red-500 font-mono">{activeAlerts.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">ACKNOWLEDGED</p>
                <p className="text-2xl font-bold text-orange-500 font-mono">{acknowledgedAlerts.length}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">RESOLVED</p>
                <p className="text-2xl font-bold text-green-400 font-mono">{resolvedAlerts.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">ACTIVE ALERTS</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activeAlerts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-neutral-400">No active alerts</p>
              </div>
            ) : (
              activeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="border border-neutral-700 rounded p-4 hover:border-orange-500/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <button
                      type="button"
                      className="flex items-start gap-3 flex-1 text-left"
                      onClick={() => setSelectedAlert(alert)}
                    >
                      {getAlertIcon(alert.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-bold text-white">{alert.product}</h3>
                          <span className="text-xs text-neutral-400 font-mono">{alert.sku}</span>
                        </div>
                        <p className="text-sm text-neutral-300 mb-2">{alert.message}</p>
                        <div className="text-xs text-neutral-500">
                          Current Stock: <span className="text-white font-mono">{alert.current}</span> / Threshold:{" "}
                          <span className="text-white font-mono">{alert.threshold}</span>
                        </div>
                      </div>
                    </button>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={getAlertColor(alert.type)}>{alert.type.toUpperCase()}</Badge>
                      <span className="text-xs text-neutral-500">{alert.date}</span>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          className="bg-orange-500 hover:bg-orange-600 text-white text-xs h-7"
                          onClick={(e) => {
                            e.stopPropagation()
                            acknowledgeAlert(alert.id)
                          }}
                        >
                          Acknowledge
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-neutral-400 hover:text-red-500 h-7"
                          onClick={(e) => {
                            e.stopPropagation()
                            dismissAlert(alert.id)
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Acknowledged Alerts */}
      {acknowledgedAlerts.length > 0 && (
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">ACKNOWLEDGED ALERTS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {acknowledgedAlerts.map((alert) => (
                <button
                  type="button"
                  key={alert.id}
                  className="w-full text-left border border-neutral-700 rounded p-4 opacity-70 hover:opacity-100 transition-opacity"
                  onClick={() => setSelectedAlert(alert)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-bold text-white">{alert.product}</h3>
                          <span className="text-xs text-neutral-400 font-mono">{alert.sku}</span>
                        </div>
                        <p className="text-sm text-neutral-300">{alert.message}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={getStatusColor(alert.status)}>ACKNOWLEDGED</Badge>
                      <span className="text-xs text-neutral-500">{alert.date}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="bg-neutral-900 border-neutral-700 w-full max-w-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                {getAlertIcon(selectedAlert.type)}
                <div>
                  <CardTitle className="text-lg font-bold text-white tracking-wider">
                    {selectedAlert.product}
                  </CardTitle>
                  <p className="text-sm text-neutral-400 font-mono">{selectedAlert.sku}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={() => setSelectedAlert(null)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">ALERT TYPE</p>
                  <Badge className={getAlertColor(selectedAlert.type)}>
                    {selectedAlert.type.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">STATUS</p>
                  <Badge className={getStatusColor(selectedAlert.status)}>
                    {selectedAlert.status.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">CURRENT STOCK</p>
                  <p className="text-2xl font-bold text-white font-mono">{selectedAlert.current}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">THRESHOLD</p>
                  <p className="text-2xl font-bold text-orange-500 font-mono">{selectedAlert.threshold}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">MESSAGE</p>
                  <p className="text-sm text-neutral-300">{selectedAlert.message}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">TIMESTAMP</p>
                  <p className="text-sm text-white font-mono">{selectedAlert.date}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-4 border-t border-neutral-700">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => openEdit(selectedAlert)}>
                  Edit
                </Button>
                <Button
                  variant="outline"
                  className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent"
                >
                  View Product
                </Button>
                {selectedAlert.status === "active" && (
                  <Button
                    variant="outline"
                    className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent"
                    onClick={() => {
                      acknowledgeAlert(selectedAlert.id)
                      setSelectedAlert(null)
                    }}
                  >
                    Acknowledge
                  </Button>
                )}
                {selectedAlert.status !== "resolved" && (
                  <Button
                    variant="outline"
                    className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent"
                    onClick={() => resolveAlert(selectedAlert.id)}
                  >
                    Resolve
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-red-500 bg-transparent"
                  onClick={() => dismissAlert(selectedAlert.id)}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create/Edit Alert Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="bg-neutral-900 border-neutral-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white tracking-wider">
              {formMode === "create" ? "NEW ALERT" : "EDIT ALERT"}
            </DialogTitle>
            <DialogDescription className="text-neutral-400">
              Create system notifications linked to SKUs.
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="border border-red-500/40 bg-red-500/10 text-red-200 text-sm rounded p-3">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-xs text-neutral-400 tracking-wider">PRODUCT (SKU)</Label>
              <Select value={form.productSku} onValueChange={(v) => setForm((f) => ({ ...f, productSku: v }))}>
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
              <Label className="text-xs text-neutral-400 tracking-wider">TYPE</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger className="bg-neutral-800 border-neutral-600 text-white">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-neutral-700 text-white">
                  <SelectItem value="critical">critical</SelectItem>
                  <SelectItem value="warning">warning</SelectItem>
                  <SelectItem value="info">info</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">STATUS</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger className="bg-neutral-800 border-neutral-600 text-white">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-neutral-700 text-white">
                  <SelectItem value="active">active</SelectItem>
                  <SelectItem value="acknowledged">acknowledged</SelectItem>
                  <SelectItem value="resolved">resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">CURRENT STOCK</Label>
              <Input
                value={form.current}
                onChange={(e) => setForm((f) => ({ ...f, current: e.target.value }))}
                placeholder="0"
                className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">THRESHOLD</Label>
              <Input
                value={form.threshold}
                onChange={(e) => setForm((f) => ({ ...f, threshold: e.target.value }))}
                placeholder="0"
                className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label className="text-xs text-neutral-400 tracking-wider">MESSAGE</Label>
              <Input
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                placeholder="Describe the alert"
                className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label className="text-xs text-neutral-400 tracking-wider">ALERT TIME</Label>
              <Input
                type="datetime-local"
                value={form.alertAt}
                onChange={(e) => setForm((f) => ({ ...f, alertAt: e.target.value }))}
                className="bg-neutral-800 border-neutral-600 text-white"
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
              {saveButtonLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
