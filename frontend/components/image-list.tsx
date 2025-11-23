"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

interface Image {
  id: number
  filename: string
  labels: string[]
}

interface ImageListProps {
  images: Image[]
  onDelete: (id: number) => Promise<void>
}

export default function ImageList({ images, onDelete }: ImageListProps) {
  const [deletingId, setDeletingId] = React.useState<number | null>(null)

  const handleDelete = async (id: number) => {
    setDeletingId(id)
    try {
      await onDelete(id)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-3 app-theme-whiteblue">
      <style>{`
        .app-theme-whiteblue{ --primary: #2563eb; --foreground: #0f172a; --muted: #64748b; --border: #e6eef9; --bg: #ffffff; }
        .app-theme-whiteblue .bg-background\/50, .app-theme-whiteblue .bg-background{ background: var(--bg) !important; }
        .app-theme-whiteblue .text-foreground{ color: var(--foreground) !important; }
        .app-theme-whiteblue .text-muted-foreground{ color: var(--muted) !important; }
        .app-theme-whiteblue .border-border, .app-theme-whiteblue .border-border\/50{ border-color: var(--border) !important; }
        .app-theme-whiteblue .bg-primary\/20{ background: rgba(37,99,235,0.12) !important; }
        .app-theme-whiteblue .text-primary{ color: var(--primary) !important; }
        .app-theme-whiteblue .text-destructive{ color: #ef4444 !important; }
      `}</style>
      {images.map((image) => (
        <div
          key={image.id}
          className="p-4 rounded-lg bg-background/50 border border-border/50 hover:border-border/80 transition-colors"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-foreground truncate">{image.filename}</h4>
              {image.labels && image.labels.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {image.labels.map((label, idx) => (
                    <span
                      key={idx}
                      className="inline-block px-2 py-1 text-xs rounded-md bg-primary/20 text-primary border border-primary/30"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">No labels detected</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(image.id)}
              disabled={deletingId === image.id}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
