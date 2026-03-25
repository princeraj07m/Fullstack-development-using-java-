"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, AlertTriangle, TrendingUp, Clock, BarChart3, Zap } from "lucide-react"
import { useAuth } from "@/context/auth"

const API_BASE_URL = "http://localhost:4000"

export default function DashboardPage() {
  const { user, getAuthHeaders } = useAuth()
  const [products, setProducts] = useState([])
  const [transactions, setTransactions] = useState([])
  const [alerts, setAlerts] = useState([])
  const [categories, setCategories] = useState([])

  useEffect(() => {
    async function loadAll() {
      try {
        const headers = getAuthHeaders()
        const [pRes, tRes, aRes, cRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/products`, { headers }),
          fetch(`${API_BASE_URL}/api/transactions`, { headers }),
          fetch(`${API_BASE_URL}/api/alerts`, { headers }),
          fetch(`${API_BASE_URL}/api/categories`, { headers }),
        ])
        const [pData, tData, aData, cData] = await Promise.all([
          pRes.json(),
          tRes.json(),
          aRes.json(),
          cRes.json(),
        ])
        setProducts(pData)
        setTransactions(tData)
        setAlerts(aData)
        setCategories(cData)
      } catch (error) {
        console.error("Failed to load dashboard data", error)
      }
    }

    loadAll()
  }, [user?.id])

  const stockSummary = useMemo(() => {
    const totalSkus = products.length
    const optimal = products.filter((p) => p.status === "optimal").length
    const low = products.filter((p) => p.status === "low").length
    return { totalSkus, optimal, low }
  }, [products])

  const recentActivity = useMemo(
    () =>
      transactions
        .slice(0, 5)
        .map((t) => ({
          time: t.date,
          type: t.type,
          product: t.product,
          quantity: t.quantity,
          reference: t.reference,
        })),
    [transactions],
  )

  const categoryBreakdown = useMemo(() => {
    if (!categories.length) return []
    const totalItems = categories.reduce((sum, c) => sum + (c.itemCount || 0), 0)
    return categories.map((c) => ({
      name: c.name,
      percent: totalItems ? Math.round(((c.itemCount || 0) / totalItems) * 100) : 0,
    }))
  }, [categories])

  const keyMetrics = useMemo(() => {
    const critical = products.filter((p) => p.status === "critical").length
    const low = products.filter((p) => p.status === "low").length
    const optimal = products.filter((p) => p.status === "optimal").length
    const totalValue = products.reduce(
      (sum, p) => sum + (p.quantity || 0) * (p.price || 0),
      0,
    )
    return { critical, low, optimal, totalValue }
  }, [products])

  return (
    <div className="p-6 space-y-6">
      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Stock Overview */}
        <Card className="lg:col-span-4 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">STOCK SUMMARY</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-white font-mono">
                  {stockSummary.totalSkus}
                </div>
                <div className="text-xs text-neutral-500">Total SKUs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white font-mono">
                  {stockSummary.optimal}
                </div>
                <div className="text-xs text-neutral-500">In Stock</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500 font-mono">
                  {stockSummary.low}
                </div>
                <div className="text-xs text-neutral-500">Low Stock</div>
              </div>
            </div>

            <div className="space-y-2">
              {[
                { sku: "SKU-001", name: "Industrial Bearing", stock: 450, status: "optimal" },
                { sku: "SKU-002", name: "Steel Fastener", stock: 89, status: "low" },
                { sku: "SKU-003", name: "Rubber Gasket", stock: 234, status: "optimal" },
                { sku: "SKU-004", name: "Aluminum Rod", stock: 12, status: "critical" },
              ].map((item) => (
                <div
                  key={item.sku}
                  className="flex items-center justify-between p-2 bg-neutral-800 rounded hover:bg-neutral-700 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        item.status === "optimal"
                          ? "bg-white"
                          : item.status === "low"
                            ? "bg-orange-500"
                            : "bg-red-500"
                      }`}
                    ></div>
                    <div>
                      <div className="text-xs text-white font-mono">{item.sku}</div>
                      <div className="text-xs text-neutral-500">{item.name}</div>
                    </div>
                  </div>
                  <div className="text-xs text-white font-mono">{item.stock} units</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="lg:col-span-4 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">RECENT ACTIVITY</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recentActivity.map((log, index) => (
                <div
                  key={index}
                  className="text-xs border-l-2 border-orange-500 pl-3 hover:bg-neutral-800 p-2 rounded transition-colors"
                >
                  <div className="text-neutral-500 font-mono">{log.time}</div>
                  <div className="text-white">
                    <span className={`${log.type === "in" ? "text-green-400" : log.type === "out" ? "text-orange-500" : "text-blue-400"} font-mono`}>
                      {log.type.toUpperCase()}
                    </span>{" "}
                    {log.quantity} units of <span className="text-white font-mono">{log.product}</span>
                    <div className="text-neutral-400 text-xs mt-1">{log.reference}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stock Distribution */}
        <Card className="lg:col-span-4 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">CATEGORY BREAKDOWN</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {/* Pie Chart Representation */}
            <div className="relative w-32 h-32 mb-4">
              <svg viewBox="0 0 120 120" className="w-full h-full">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#f97316" strokeWidth="12" strokeDasharray="47.1 314" />
                <circle cx="60" cy="60" r="50" fill="none" stroke="#ffffff" strokeWidth="12" strokeDasharray="62.8 314" strokeDashoffset="-47.1" />
                <circle cx="60" cy="60" r="50" fill="none" stroke="#ef4444" strokeWidth="12" strokeDasharray="94.2 314" strokeDashoffset="-109.9" />
                <circle cx="60" cy="60" r="50" fill="none" stroke="#10b981" strokeWidth="12" strokeDasharray="109.9 314" strokeDashoffset="-204.1" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-sm font-bold text-white">2,847</div>
                  <div className="text-xs text-neutral-400">items</div>
                </div>
              </div>
            </div>

            <div className="text-xs text-neutral-400 space-y-1 w-full font-mono">
              {categoryBreakdown.map((cat, idx) => {
                const colors = ["bg-orange-500", "bg-white", "bg-red-500", "bg-green-500"]
                const color = colors[idx % colors.length]
                return (
                  <div key={cat.name} className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <div className={`w-2 h-2 ${color}`}></div>
                      {cat.name}
                    </span>
                    <span>{cat.percent}%</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Inventory Turnover Chart */}
        <Card className="lg:col-span-8 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">MONTHLY INVENTORY TURNOVER</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 relative">
              {/* Chart Grid */}
              <div className="absolute inset-0 grid grid-cols-8 grid-rows-6 opacity-20">
                {Array.from({ length: 48 }).map((_, i) => (
                  <div key={i} className="border border-neutral-700"></div>
                ))}
              </div>

              {/* Chart Line */}
              <svg className="absolute inset-0 w-full h-full">
                <polyline
                  points="0,100 50,85 100,70 150,60 200,75 250,50 300,65 350,45"
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="2"
                />
                <polyline
                  points="0,120 50,115 100,110 150,105 200,110 250,115 300,105 350,100"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
              </svg>

              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-neutral-500 -ml-5 font-mono">
                <span>5000</span>
                <span>4000</span>
                <span>3000</span>
                <span>2000</span>
              </div>

              {/* X-axis labels */}
              <div className="absolute bottom-0 left-0 w-full flex justify-between text-xs text-neutral-500 -mb-6 font-mono">
                <span>Jan 2026</span>
                <span>Feb 2026</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <Card className="lg:col-span-4 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">KEY METRICS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-white" />
                  <span className="text-xs text-white font-medium">Reorder Items</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">Critical Level</span>
                    <span className="text-red-500 font-bold font-mono">
                      {keyMetrics.critical}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">Low Stock</span>
                    <span className="text-orange-500 font-bold font-mono">
                      {keyMetrics.low}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">Optimal Stock</span>
                    <span className="text-white font-bold font-mono">
                      {keyMetrics.optimal}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-orange-500" />
                  <span className="text-xs text-orange-500 font-medium">Quick Stats</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">Avg Stock Age</span>
                    <span className="text-white font-bold font-mono">45 days</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">Turnover Rate</span>
                    <span className="text-white font-bold font-mono">8.2x/yr</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">Total Value</span>
                    <span className="text-white font-bold font-mono">
                      ${(keyMetrics.totalValue / 1000).toFixed(1)}K
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
