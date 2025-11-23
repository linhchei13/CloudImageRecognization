"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle } from "lucide-react"

interface AuthFormProps {
  onLogin: (token: string) => void
}

export default function AuthForm({ onLogin }: AuthFormProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

  async function handleSignup() {
    if (!username || !password) {
      setMessage({ type: "error", text: "Please enter username and password" })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(
        `${apiUrl}/signup?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
        {
          method: "POST",
        },
      )

      if (response.ok) {
        setMessage({ type: "success", text: "Account created successfully! You can now login." })
        setUsername("")
        setPassword("")
      } else {
        const error = await response.json()
        setMessage({ type: "error", text: error.detail || "Signup failed" })
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Signup failed" })
    }
    setIsLoading(false)
  }

  async function handleLogin() {
    if (!username || !password) {
      setMessage({ type: "error", text: "Please enter username and password" })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(
        `${apiUrl}/login?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
        {
          method: "POST",
        },
      )

      if (response.ok) {
        const data = await response.json()
        const token = data.token || data.access_token
        if (token) {
          onLogin(token)
        } else {
          setMessage({ type: "error", text: "No token received" })
        }
      } else {
        const error = await response.json()
        setMessage({ type: "error", text: error.detail || "Login failed" })
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Login failed" })
    }
    setIsLoading(false)
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <Card className="w-full max-w-md border-border/50">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Cloud Image Recognition</CardTitle>
          <CardDescription>Sign up or login to get started</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <div
              className={`flex gap-3 p-3 rounded-lg ${
                message.type === "success"
                  ? "bg-green-500/10 text-green-600 border border-green-500/20"
                  : "bg-destructive/10 text-destructive border border-destructive/20"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              )}
              <p className="text-sm">{message.text}</p>
            </div>
          )}

          <div className="space-y-3">
            <Input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              onKeyPress={(e) => e.key === "Enter" && handleLogin()}
              className="bg-background/50 border-border/50"
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              onKeyPress={(e) => e.key === "Enter" && handleLogin()}
              className="bg-background/50 border-border/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={handleSignup}
              disabled={isLoading}
              className="bg-transparent"
            >
              Sign up
            </Button>
            <Button onClick={handleLogin} disabled={isLoading}>
              Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
