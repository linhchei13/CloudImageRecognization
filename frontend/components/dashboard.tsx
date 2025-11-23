"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle, LogOut, Upload } from "lucide-react"
import ImageUploader from "./image-uploader"
import ImageList from "./image-list"

interface DashboardProps {
  token: string
  onLogout: () => void
}

interface Image {
  id: number
  filename: string
  labels: string[]
}

export default function Dashboard({ token, onLogout }: DashboardProps) {
  const [images, setImages] = useState<Image[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

  useEffect(() => {
    fetchImages()
  }, [token])

  async function fetchImages() {
    try {
      setIsLoading(true)
      const response = await fetch(`${apiUrl}/images`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setImages(data)
      } else {
        setMessage({ type: "error", text: "Failed to load images" })
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to load images" })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleUpload(file: File) {
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch(`${apiUrl}/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setMessage({ type: "success", text: `Image uploaded successfully! Found ${data.labels?.length || 0} labels.` })
        await fetchImages()
      } else {
        const error = await response.json()
        setMessage({ type: "error", text: error.detail || "Upload failed" })
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Upload failed" })
    }
  }

  async function handleDelete(imageId: number) {
    try {
      const response = await fetch(`${apiUrl}/images/${imageId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setMessage({ type: "success", text: "Image deleted successfully" })
        await fetchImages()
      } else {
        setMessage({ type: "error", text: "Failed to delete image" })
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to delete image" })
    }
  }

  return (
    <div className="min-h-screen app-theme-whiteblue">
      <style>{`
        /* Embedded white + blue theme (component-scoped) */
        .app-theme-whiteblue{ --primary: #2563eb; --foreground: #0f172a; --muted: #64748b; --border: #e6eef9; --bg: #ffffff; --muted-bg: #f8fafc; }
        .app-theme-whiteblue{ background: var(--muted-bg); color: var(--foreground); }
        .app-theme-whiteblue .bg-background, .app-theme-whiteblue .bg-background\/50{ background: var(--bg) !important; }
        .app-theme-whiteblue .text-foreground{ color: var(--foreground) !important; }
        .app-theme-whiteblue .text-muted-foreground{ color: var(--muted) !important; }
        .app-theme-whiteblue .border-border, .app-theme-whiteblue .border-border\/50{ border-color: var(--border) !important; }
        .app-theme-whiteblue .bg-primary{ background: var(--primary) !important; color: #fff !important; }
        .app-theme-whiteblue .text-primary{ color: var(--primary) !important; }
        .app-theme-whiteblue .bg-primary\/20{ background: rgba(37,99,235,0.12) !important; }
        .app-theme-whiteblue .border-primary\/30{ border-color: rgba(37,99,235,0.18) !important; }
        .app-theme-whiteblue .text-destructive{ color: #ef4444 !important; }
        .app-theme-whiteblue .bg-destructive\/10{ background: rgba(239,68,68,0.1) !important; }
        .app-theme-whiteblue .inline-block.animate-spin{ border-color: var(--primary) !important; }
        .app-theme-whiteblue img{ background: transparent; }
        /* Buttons and badges */
        .app-theme-whiteblue button, .app-theme-whiteblue .btn{ color: inherit !important; }
        .app-theme-whiteblue .badge, .app-theme-whiteblue .badge-label{ background: rgba(37,99,235,0.08); color: var(--primary) !important; border: 1px solid rgba(37,99,235,0.16); }
      `}</style>
      {/* Header */}
      <div className="border-b border-border/50 bg-background/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Cloud Image Recognition</h1>
            <p className="text-sm text-muted-foreground mt-1">Analyze your images with AI-powered labels</p>
          </div>
          <Button variant="outline" onClick={onLogout} className="gap-2 border-border/50 bg-transparent">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <div
            className={`mb-6 flex gap-3 p-4 rounded-lg border ${
              message.type === "success"
                ? "bg-green-500/10 text-green-600 border-green-500/20"
                : "bg-destructive/10 text-destructive border-destructive/20"
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Card */}
          <div className="lg:col-span-1">
            <Card className="border-border/50 h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  Upload Image
                </CardTitle>
                <CardDescription>Select an image to analyze</CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUploader onUpload={handleUpload} isLoading={isLoading} />
              </CardContent>
            </Card>
          </div>

          {/* Images List */}
          <div className="lg:col-span-2">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>My Images</CardTitle>
                <CardDescription>Your uploaded images and their AI-generated labels</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-3 border-primary border-t-transparent"></div>
                    <p className="text-muted-foreground mt-2">Loading images...</p>
                  </div>
                ) : images.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No images yet. Upload one to get started!</p>
                  </div>
                ) : (
                  <ImageList images={images} onDelete={handleDelete} />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
