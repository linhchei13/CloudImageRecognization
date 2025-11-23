"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"

interface ImageUploaderProps {
  onUpload: (file: File) => Promise<void>
  isLoading: boolean
}

export default function ImageUploader({ onUpload, isLoading }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string>("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        setPreview(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    try {
      await onUpload(selectedFile)
      setSelectedFile(null)
      setPreview("")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-4 app-theme-whiteblue-uploader">
      <style>{`
        .app-theme-whiteblue-uploader{ --primary: #2563eb; --foreground: #0f172a; --muted: #64748b; --border: #e6eef9; --bg: #ffffff; }
        .app-theme-whiteblue-uploader .border-border\/50, .app-theme-whiteblue-uploader .border-2{ border-color: var(--border) !important; }
        .app-theme-whiteblue-uploader .text-muted-foreground{ color: var(--muted) !important; }
        .app-theme-whiteblue-uploader .hover\:border-primary\/50:hover{ border-color: rgba(37,99,235,0.2) !important; }
        .app-theme-whiteblue-uploader .bg-primary\/20{ background: rgba(37,99,235,0.12) !important; }
      `}</style>
      <div
        className="border-2 border-dashed border-border/50 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm font-medium">Click to upload</p>
        <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF up to 10MB</p>
      </div>

      {preview && (
        <div className="relative rounded-lg overflow-hidden bg-background/50 border border-border/50">
          <img src={preview || "/placeholder.svg"} alt="Preview" className="w-full h-auto max-h-48 object-cover" />
        </div>
      )}

      <Button onClick={handleUpload} disabled={!selectedFile || isUploading || isLoading} className="w-full">
        {isUploading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2"></span>
            Uploading...
          </>
        ) : (
          "Upload Image"
        )}
      </Button>
    </div>
  )
}
