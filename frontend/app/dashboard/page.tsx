"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Dashboard from "@/components/dashboard"

export default function DashboardPage() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const t = typeof window !== 'undefined' ? localStorage.getItem('CIR_TOKEN') : null
    if (!t) {
      router.replace('/login')
    } else {
      setToken(t)
    }
  }, [])

  function handleLogout() {
    try { localStorage.removeItem('CIR_TOKEN') } catch(e){}
    router.push('/login')
  }

  if (!token) return null

  return <Dashboard token={token} onLogout={handleLogout} />
}
