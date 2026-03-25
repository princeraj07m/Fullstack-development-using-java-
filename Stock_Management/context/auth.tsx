"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

const API_BASE = "http://localhost:4000"
const STORAGE_KEY = "inventoryProUser"

type User = { id: number; name: string; email: string } | null

type AuthContextType = {
  user: User
  login: (email: string, password: string) => Promise<{ error?: string }>
  logout: () => void
  getAuthHeaders: () => Record<string, string>
  api: (path: string, opts?: RequestInit) => Promise<Response>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as User
        if (parsed?.id && parsed?.name && parsed?.email) setUser(parsed)
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) return { error: data.error || "Login failed" }
      const u = { id: data.id, name: data.name, email: data.email }
      setUser(u)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
      return {}
    } catch (e) {
      return { error: "Failed to connect" }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  const getAuthHeaders = () => {
    if (user?.id) return { "X-User-Id": String(user.id) }
    return {}
  }

  const api = (path: string, opts: RequestInit = {}) => {
    return fetch(`${API_BASE}${path}`, {
      ...opts,
      headers: { "Content-Type": "application/json", ...getAuthHeaders(), ...(opts.headers as Record<string, string>) },
    })
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, getAuthHeaders, api }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
