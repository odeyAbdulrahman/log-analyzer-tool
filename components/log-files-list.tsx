"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle, FileText, RefreshCw, Trash2, Search } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatFileSize, formatDate } from "@/lib/utils"
import { Input } from "@/components/ui/input"

interface LogFilesListProps {
  onRefresh: () => void
}

export function LogFilesList({ onRefresh }: LogFilesListProps) {
  const [files, setFiles] = useState<Array<{ name: string; size: number; lastModified: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const loadFiles = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/logs/files")
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to load log files")
      }

      if (data.success) {
        setFiles(data.files)
      } else {
        setError(data.error || "Failed to load log files")
      }
    } catch (err) {
      console.error("Error loading files:", err)
      setError(err instanceof Error ? err.message : "Failed to load log files")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFiles()
  }, [])

  const handleDelete = async () => {
    if (selectedFiles.size === 0) return

    if (!confirm(`Are you sure you want to delete ${selectedFiles.size} file(s)?`)) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch("/api/logs/files", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          files: Array.from(selectedFiles),
        }),
      })

      const data = await response.json()
      if (data.success) {
        // Refresh the file list
        loadFiles()
        // Clear selection
        setSelectedFiles(new Set())
      } else {
        setError(data.error || "Failed to delete files")
      }
    } catch (err) {
      console.error("Error deleting files:", err)
      setError(err instanceof Error ? err.message : "Failed to delete files")
    } finally {
      setIsDeleting(false)
    }
  }

  const toggleFileSelection = (fileName: string) => {
    const newSelection = new Set(selectedFiles)
    if (newSelection.has(fileName)) {
      newSelection.delete(fileName)
    } else {
      newSelection.add(fileName)
    }
    setSelectedFiles(newSelection)
  }

  const toggleSelectAll = () => {
    const filteredFiles = files.filter(file => 
      file.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    if (selectedFiles.size === filteredFiles.length) {
      setSelectedFiles(new Set())
    } else {
      setSelectedFiles(new Set(filteredFiles.map(f => f.name)))
    }
  }

  // Format date for display
  const formatDisplayDate = (dateString: string) => {
    const { date, time } = formatDate(dateString)
    return `${date} ${time} UTC`
  }

  // Filter files based on search query
  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Log Files</CardTitle>
            <CardDescription>Manage your log files</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {selectedFiles.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected ({selectedFiles.size})
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={loadFiles} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>

          <div className="space-y-2">
            {filteredFiles.length > 0 && (
              <div className="flex items-center space-x-2 p-2 border-b">
                <Checkbox
                  id="select-all"
                  checked={selectedFiles.size === filteredFiles.length}
                  onCheckedChange={toggleSelectAll}
                />
                <label
                  htmlFor="select-all"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Select All
                </label>
              </div>
            )}
            {filteredFiles.map((file) => (
              <div
                key={file.name}
                className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg"
              >
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={file.name}
                    checked={selectedFiles.has(file.name)}
                    onCheckedChange={() => toggleFileSelection(file.name)}
                  />
                  <label
                    htmlFor={file.name}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">{file.name}</span>
                  </label>
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatFileSize(file.size)} • {formatDisplayDate(file.lastModified)}
                </div>
              </div>
            ))}
            {filteredFiles.length === 0 && !loading && (
              <div className="text-center text-muted-foreground py-8">
                {searchQuery ? "No files match your search" : "No log files found. Upload some log files to get started."}
              </div>
            )}
            {loading && (
              <div className="text-center text-muted-foreground py-8">
                Loading files...
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
