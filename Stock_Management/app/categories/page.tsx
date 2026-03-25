"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Folder, Package, Edit2, Trash2, Plus } from "lucide-react"
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

export default function CategoriesPage() {
  const { user, getAuthHeaders } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [categories, setCategories] = useState([])
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState("create") // create | edit
  const [formError, setFormError] = useState("")
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    id: "",
    code: "",
    name: "",
    description: "",
    subcategories: "",
    status: "active",
    lastModified: "",
  })

  const resetForm = () => {
    setFormError("")
    setForm({
      id: "",
      code: "",
      name: "",
      description: "",
      subcategories: "",
      status: "active",
      lastModified: "",
    })
  }

  const openCreate = () => {
    resetForm()
    setFormMode("create")
    setFormOpen(true)
  }

  const openEdit = (category) => {
    setFormError("")
    setFormMode("edit")
    setForm({
      id: String(category.id ?? ""),
      code: category.code || "",
      name: category.name || "",
      description: category.description || "",
      subcategories: Array.isArray(category.subcategories)
        ? category.subcategories.join(",")
        : category.subcategories || "",
      status: category.status || "active",
      lastModified: category.lastModified || "",
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
        description: form.description?.trim() || null,
        subcategories: form.subcategories?.trim() || null,
        status: form.status,
        lastModified: form.lastModified || null,
      }

      if (!payload.name) throw new Error("Category name is required")

      const url =
        formMode === "create"
          ? `${API_BASE_URL}/api/categories`
          : `${API_BASE_URL}/api/categories/${encodeURIComponent(form.id)}`

      const res = await fetch(url, {
        method: formMode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Save failed")
      }

      const saved = await res.json()
      const mapped = {
        ...saved,
        subcategories: saved.subcategories
          ? String(saved.subcategories).split(",").filter(Boolean)
          : [],
      }

      setCategories((prev) => {
        if (formMode === "create") return [mapped, ...prev]
        return prev.map((c) => (String(c.id) === String(mapped.id) ? mapped : c))
      })

      if (selectedCategory?.id === mapped.id) setSelectedCategory(mapped)
      setFormOpen(false)
      resetForm()
    } catch (e) {
      setFormError(e?.message || "Save failed")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (category) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/categories/${category.id}`, { method: "DELETE", headers: getAuthHeaders() })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Delete failed")
      }
      setCategories((prev) => prev.filter((c) => String(c.id) !== String(category.id)))
      if (selectedCategory?.id === category.id) setSelectedCategory(null)
    } catch (e) {
      setFormError(e?.message || "Delete failed")
    }
  }

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/categories`)
        const data = await res.json()
        const mapped = data.map((cat) => ({
          ...cat,
          subcategories: cat.subcategories ? cat.subcategories.split(",") : [],
        }))
        setCategories(mapped)
      } catch (error) {
        console.error("Failed to load categories", error)
      }
    }

    loadCategories()
  }, [user?.id])

  const totalItems = categories.reduce((sum, cat) => sum + (cat.itemCount || 0), 0)
  const totalValue = categories.reduce((sum, cat) => sum + (cat.totalValue || 0), 0)
  let saveButtonLabel = formMode === "create" ? "Create" : "Update"
  if (saving) saveButtonLabel = "Saving..."

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">PRODUCT CATEGORIES</h1>
          <p className="text-sm text-neutral-400">Organize and manage product categories</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            New Category
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">Export Report</Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">TOTAL CATEGORIES</p>
                <p className="text-2xl font-bold text-white font-mono">{categories.length}</p>
              </div>
              <Folder className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">TOTAL PRODUCTS</p>
                <p className="text-2xl font-bold text-white font-mono">{totalItems}</p>
              </div>
              <Package className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">INVENTORY VALUE</p>
                <p className="text-2xl font-bold text-orange-500 font-mono">${(totalValue / 1000).toFixed(0)}K</p>
              </div>
              <Package className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {categories.map((category) => (
          <Card
            key={category.id}
            className="bg-neutral-900 border-neutral-700 hover:border-orange-500/50 transition-colors cursor-pointer"
            onClick={() => setSelectedCategory(category)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Folder className="w-6 h-6 text-orange-500 mt-1" />
                  <div>
                    <CardTitle className="text-sm font-bold text-white tracking-wider">{category.name}</CardTitle>
                    <p className="text-xs text-neutral-400 font-mono">{category.id}</p>
                  </div>
                </div>
                <Badge className="bg-white/20 text-white">{category.status.toUpperCase()}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-neutral-300">{category.description}</p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-neutral-400">ITEMS</p>
                  <p className="text-xl font-bold text-white font-mono">{category.itemCount}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400">VALUE</p>
                  <p className="text-xl font-bold text-white font-mono">${(category.totalValue / 1000).toFixed(1)}K</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-neutral-400">SUBCATEGORIES</p>
                <div className="flex flex-wrap gap-1">
                  {category.subcategories.map((sub) => (
                    <Badge key={sub} className="bg-neutral-800 text-neutral-300 text-xs">
                      {sub}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-neutral-700">
                <Button
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600 text-white text-xs flex-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    openEdit(category)
                  }}
                >
                  <Edit2 className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-neutral-400 hover:text-red-500"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-neutral-900 border-neutral-700">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white">Delete category?</AlertDialogTitle>
                      <AlertDialogDescription className="text-neutral-400">
                        Products in this category will be moved to{" "}
                        <span className="text-white font-mono">Uncategorized</span>.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-neutral-700 text-neutral-300 bg-transparent hover:bg-neutral-800">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                        onClick={() => handleDelete(category)}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Category Management Table */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">CATEGORY DETAILS</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-700">
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">NAME</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">ITEMS</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">VALUE</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">STATUS</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">LAST MODIFIED</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category, index) => (
                  <tr
                    key={category.id}
                    className={`border-b border-neutral-800 hover:bg-neutral-800 transition-colors ${
                      index % 2 === 0 ? "bg-neutral-900" : "bg-neutral-850"
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Folder className="w-4 h-4 text-orange-500" />
                        <span className="text-sm text-white font-medium">{category.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-white font-mono">{category.itemCount}</td>
                    <td className="py-3 px-4 text-sm text-white font-mono">${(category.totalValue / 1000).toFixed(1)}K</td>
                    <td className="py-3 px-4">
                      <Badge className="bg-white/20 text-white text-xs">{category.status.toUpperCase()}</Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-neutral-300 font-mono">{category.lastModified}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-neutral-400 hover:text-orange-500 h-7"
                          onClick={() => openEdit(category)}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-neutral-400 hover:text-red-500 h-7"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-neutral-900 border-neutral-700">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">Delete category?</AlertDialogTitle>
                              <AlertDialogDescription className="text-neutral-400">
                                Products in this category will be moved to{" "}
                                <span className="text-white font-mono">Uncategorized</span>.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-neutral-700 text-neutral-300 bg-transparent hover:bg-neutral-800">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-orange-500 hover:bg-orange-600 text-white"
                                onClick={() => handleDelete(category)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Category Detail Modal */}
      {selectedCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="bg-neutral-900 border-neutral-700 w-full max-w-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <Folder className="w-8 h-8 text-orange-500" />
                <div>
                  <CardTitle className="text-lg font-bold text-white tracking-wider">
                    {selectedCategory.name}
                  </CardTitle>
                  <p className="text-sm text-neutral-400 font-mono">{selectedCategory.id}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={() => setSelectedCategory(null)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider mb-2">DESCRIPTION</p>
                <p className="text-sm text-neutral-300">{selectedCategory.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">TOTAL ITEMS</p>
                  <p className="text-2xl font-bold text-white font-mono">{selectedCategory.itemCount}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">TOTAL VALUE</p>
                  <p className="text-2xl font-bold text-orange-500 font-mono">
                    ${(selectedCategory.totalValue / 1000).toFixed(1)}K
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">STATUS</p>
                  <Badge className="bg-white/20 text-white">{selectedCategory.status.toUpperCase()}</Badge>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">LAST MODIFIED</p>
                  <p className="text-sm text-white font-mono">{selectedCategory.lastModified}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-neutral-400 tracking-wider mb-2">SUBCATEGORIES</p>
                <div className="flex flex-wrap gap-2">
                  {selectedCategory.subcategories.map((sub) => (
                    <Badge key={sub} className="bg-neutral-800 text-neutral-300">
                      {sub}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-neutral-700">
                <Button
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={() => openEdit(selectedCategory)}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Category
                </Button>
                <Button
                  variant="outline"
                  className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent"
                >
                  View Products
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-red-500 bg-transparent"
                    >
                      Delete Category
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-neutral-900 border-neutral-700">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white">Delete category?</AlertDialogTitle>
                      <AlertDialogDescription className="text-neutral-400">
                        Products in this category will be moved to{" "}
                        <span className="text-white font-mono">Uncategorized</span>.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-neutral-700 text-neutral-300 bg-transparent hover:bg-neutral-800">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                        onClick={() => handleDelete(selectedCategory)}
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

      {/* Create/Edit Category Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="bg-neutral-900 border-neutral-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white tracking-wider">
              {formMode === "create" ? "NEW CATEGORY" : "EDIT CATEGORY"}
            </DialogTitle>
            <DialogDescription className="text-neutral-400">
              Manage category metadata and subcategories.
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
                placeholder="CAT-007"
                className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">NAME</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Hardware"
                className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label className="text-xs text-neutral-400 tracking-wider">DESCRIPTION</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Short description"
                className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label className="text-xs text-neutral-400 tracking-wider">
                SUBCATEGORIES (comma separated)
              </Label>
              <Input
                value={form.subcategories}
                onChange={(e) => setForm((f) => ({ ...f, subcategories: e.target.value }))}
                placeholder="Bolts,Nuts,Screws"
                className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400"
              />
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
                  <SelectItem value="inactive">inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">LAST MODIFIED</Label>
              <Input
                type="date"
                value={form.lastModified}
                onChange={(e) => setForm((f) => ({ ...f, lastModified: e.target.value }))}
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
