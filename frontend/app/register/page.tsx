"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"

export default function RegisterPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

  async function handleRegister(e?: React.FormEvent) {
    e?.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch(`${apiUrl}/signup?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`, { method: "POST" })
      if (res.ok) {
        setMessage("Account created. Redirecting to login...")
        setTimeout(() => router.push("/login"), 800)
      } else {
        const j = await res.json().catch(() => ({}))
        setMessage(j.error || j.detail || "Register failed")
      }
    } catch (err: any) {
      setMessage(err.message || "Register failed")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <form onSubmit={handleRegister} className="space-y-4">
          <h2 className="text-2xl font-semibold">Create account</h2>
          {message && <div className="text-sm text-red-600">{message}</div>}
          <input className="w-full px-3 py-2 border rounded" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
          <input className="w-full px-3 py-2 border rounded" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <div className="flex gap-2">
            <button className="btn btn-primary" type="submit" disabled={loading}>Create</button>
            <button type="button" className="btn btn-secondary" onClick={() => router.push('/login')}>Back to login</button>
          </div>
        </form>
      </div>
    </div>
  )
}
