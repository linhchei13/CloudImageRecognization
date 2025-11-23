"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
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
        // Optional: Switch to login tab automatically if we had access to tab state control
      } else {
        const error = await response.json()
        setMessage({ type: "error", text: error.detail || "Signup failed" })
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Signup failed" })
    }
    setIsLoading(false)
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
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
    <div className="flex items-center justify-center min-h-screen px-4 app-theme-whiteblue">
      <style>{`
        .app-theme-whiteblue .text-primary { color: #2563eb !important; }
        .app-theme-whiteblue .bg-primary { background-color: #2563eb !important; }
        .app-theme-whiteblue .bg-primary:hover { background-color: #1d4ed8 !important; }
      `}</style>
      <Card className="w-full max-w-md border-border/50 shadow-lg">
        <CardHeader className="space-y-2 text-center pb-2">
          <CardTitle className="text-2xl font-bold text-primary">Cloud Image Rec</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full" onValueChange={() => setMessage(null)}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            {message && (
              <div
                className={`flex gap-3 p-3 rounded-lg mb-4 ${
                  message.type === "success"
                    ? "bg-green-500/10 text-green-600 border border-green-500/20"
                    : "bg-destructive/10 text-destructive border border-destructive/20"
                }`}
              >
                {message.type === "success" ? (
                  <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                )}
                <p className="text-sm">{message.text}</p>
              </div>
            )}

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Username</label>
                  <Input
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                    className="bg-background/50 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Password</label>
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="bg-background/50 border-border/50"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  Login
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Username</label>
                  <Input
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                    className="bg-background/50 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Password</label>
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="bg-background/50 border-border/50"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  Register
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
