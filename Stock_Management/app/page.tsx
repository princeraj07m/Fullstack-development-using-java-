"use client"

import { useState } from "react"
import { ChevronRight, BarChart3, Settings, Package, Truck, AlertTriangle, Bell, RefreshCw, Factory, Users2, LogIn, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/auth"
import DashboardPage from "./dashboard/page"
import ProductsPage from "./products/page"
import TransactionsPage from "./transactions/page"
import AlertsPage from "./alerts/page"
import CategoriesPage from "./categories/page"
import SuppliersPage from "./suppliers/page"
import CustomersPage from "./customers/page"

export default function InventoryManagementSystem() {
  const [activeSection, setActiveSection] = useState("dashboard")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { user, login, logout } = useAuth()
  const [loginOpen, setLoginOpen] = useState(false)
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [loginError, setLoginError] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)

  const handleLogin = async () => {
    setLoginError("")
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError("Email and password are required")
      return
    }
    setLoginLoading(true)
    try {
      const result = await login(loginEmail.trim(), loginPassword)
      if (result.error) {
        setLoginError(result.error)
      } else {
        setLoginOpen(false)
        setLoginEmail("")
        setLoginPassword("")
      }
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div
        className={`${sidebarCollapsed ? "w-16" : "w-70"} bg-neutral-900 border-r border-neutral-700 transition-all duration-300 fixed md:relative z-50 md:z-auto h-full md:h-auto ${!sidebarCollapsed ? "md:block" : ""}`}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-8">
            <div className={`${sidebarCollapsed ? "hidden" : "block"}`}>
              <h1 className="text-orange-500 font-bold text-lg tracking-wider">INVENTORY PRO</h1>
              <p className="text-neutral-500 text-xs">v1.0.0 SYSTEM</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-neutral-400 hover:text-orange-500"
            >
              <ChevronRight
                className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${sidebarCollapsed ? "" : "rotate-180"}`}
              />
            </Button>
          </div>

          <nav className="space-y-2">
            {[
              { id: "dashboard", icon: BarChart3, label: "DASHBOARD" },
              { id: "products", icon: Package, label: "PRODUCTS" },
              { id: "suppliers", icon: Factory, label: "SUPPLIERS" },
              { id: "customers", icon: Users2, label: "CUSTOMERS" },
              { id: "transactions", icon: Truck, label: "TRANSACTIONS" },
              { id: "categories", icon: Settings, label: "CATEGORIES" },
              { id: "alerts", icon: AlertTriangle, label: "ALERTS" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 p-3 rounded transition-colors ${
                  activeSection === item.id
                    ? "bg-orange-500 text-white"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                }`}
              >
                <item.icon className="w-5 h-5 md:w-5 md:h-5 sm:w-6 sm:h-6" />
                {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            ))}
          </nav>

          {!sidebarCollapsed && (
            <div className="mt-8 p-4 bg-neutral-800 border border-neutral-700 rounded">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-xs text-white">SYSTEM ONLINE</span>
              </div>
              <div className="text-xs text-neutral-500">
                <div>ITEMS: 2,847 SKUs</div>
                <div>CATEGORIES: 12</div>
                <div>LOW STOCK: 5 ALERTS</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Overlay */}
      {!sidebarCollapsed && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarCollapsed(true)} />
      )}

      {/* Main Content */}
      <div className={`flex-1 flex flex-col ${!sidebarCollapsed ? "md:ml-0" : ""}`}>
        {/* Top Toolbar */}
        <div className="h-16 bg-neutral-800 border-b border-neutral-700 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="text-sm text-neutral-400">
              INVENTORY SYSTEM / <span className="text-orange-500">{activeSection.toUpperCase()}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs text-neutral-500">LAST UPDATE: 25/02/2026 10:00 UTC</div>
            {user ? (
              <>
                <span className="text-xs text-neutral-400">
                  {user.name} ({user.email})
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="text-neutral-300 border-neutral-600 hover:bg-neutral-700"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Logout
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLoginOpen(true)}
                className="text-orange-500 border-orange-500 hover:bg-orange-500/10"
              >
                <LogIn className="w-4 h-4 mr-1" />
                Login
              </Button>
            )}
            <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-orange-500">
              <Bell className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-orange-500">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Login Dialog */}
        <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
          <DialogContent className="bg-neutral-900 border-neutral-700 text-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle>LOGIN</DialogTitle>
              <DialogDescription>Enter your credentials to access Inventory Pro</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {loginError && (
                <div className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded">{loginError}</div>
              )}
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="prince@mail.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="bg-neutral-800 border-neutral-600"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="•••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="bg-neutral-800 border-neutral-600"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setLoginOpen(false)} className="border-neutral-600">
                Cancel
              </Button>
              <Button onClick={handleLogin} disabled={loginLoading} className="bg-orange-500 hover:bg-orange-600">
                {loginLoading ? "Logging in..." : "Login"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto">
          {activeSection === "dashboard" && <DashboardPage />}
          {activeSection === "products" && <ProductsPage />}
          {activeSection === "suppliers" && <SuppliersPage />}
          {activeSection === "customers" && <CustomersPage />}
          {activeSection === "transactions" && <TransactionsPage />}
          {activeSection === "categories" && <CategoriesPage />}
          {activeSection === "alerts" && <AlertsPage />}
        </div>
      </div>
    </div>
  )
}
