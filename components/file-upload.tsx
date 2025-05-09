"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Upload, Check, AlertCircle, X } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface FileUploadProps {
  onUploadComplete?: (fileNames: string[]) => void
  onRefreshFileList?: () => void
}

export function FileUpload({ onUploadComplete, onRefreshFileList }: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files))
      setUploadStatus("idle")
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles(Array.from(e.dataTransfer.files))
      setUploadStatus("idle")
    }
  }

  const simulateProgress = () => {
    let progress = 0
    const interval = setInterval(() => {
      progress += 5
      if (progress >= 90) {
        clearInterval(interval)
      }
      setUploadProgress(progress)
    }, 100)

    return () => clearInterval(interval)
  }

  const handleUpload = async () => {
    if (!files.length) return

    setUploading(true)
    setUploadProgress(0)
    setUploadStatus("idle")

    const cleanupProgress = simulateProgress()
    const uploadedFiles: string[] = []

    try {
      // Upload each file sequentially
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/logs/upload", {
          method: "POST",
          body: formData,
        })

        const result = await response.json()

        if (result.success) {
          uploadedFiles.push(result.fileName)
          // Update progress based on completed files
          setUploadProgress(Math.round(((i + 1) / files.length) * 100))
        } else {
          throw new Error(`Failed to upload ${file.name}: ${result.error}`)
        }
      }

      setUploadStatus("success")
      if (onUploadComplete) {
        onUploadComplete(uploadedFiles)
      }
      if (onRefreshFileList) {
        onRefreshFileList()
      }
    } catch (error) {
      setUploadStatus("error")
      setErrorMessage((error as Error).message || "Failed to upload files")
    } finally {
      cleanupProgress()
      setUploading(false)
    }
  }

  const resetUpload = () => {
    setFiles([])
    setUploadProgress(0)
    setUploadStatus("idle")
    setErrorMessage("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <Card className="shadow-md">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <CardTitle className="flex items-center">
          <Upload className="mr-2 h-5 w-5" />
          Upload Log Files
        </CardTitle>
        <CardDescription className="text-blue-100">Upload your log files for analysis</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center ${
            files.length ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-blue-400"
          } transition-colors cursor-pointer`}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            className="hidden"
            onChange={handleFileChange}
            ref={fileInputRef}
            accept=".log,.txt"
            multiple
          />

          {!files.length ? (
            <div className="py-4">
              <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium">Drag and drop your log files here or click to browse</p>
              <p className="text-xs text-gray-500 mt-1">Supports multiple .log and .txt files</p>
            </div>
          ) : (
            <div className="py-2">
              <p className="text-sm font-medium mb-2">Selected {files.length} file(s):</p>
              <div className="max-h-32 overflow-y-auto text-left">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center text-xs mb-1">
                    <FileIcon className="h-3 w-3 mr-1 text-blue-600 flex-shrink-0" />
                    <span className="truncate">{file.name}</span>
                    <span className="ml-1 text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {files.length > 0 && (
          <div className="mt-4 space-y-4">
            {uploadStatus === "idle" && (
              <div className="flex justify-between gap-2">
                <Button onClick={handleUpload} disabled={uploading} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  {uploading ? "Uploading..." : "Upload File"}
                </Button>
                <Button variant="outline" onClick={resetUpload} disabled={uploading} className="px-3">
                  <X className="h-4 w-4" />
                  <span className="sr-only">Cancel</span>
                </Button>
              </div>
            )}

            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {uploadStatus === "success" && (
              <Alert className="bg-green-50 border-green-200 text-green-800">
                <Check className="h-4 w-4 text-green-600" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>
                  {files.length} file(s) uploaded successfully. You can now search and analyze these log files.
                </AlertDescription>
              </Alert>
            )}

            {uploadStatus === "error" && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{errorMessage || "Failed to upload files. Please try again."}</AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Simple file icon component
function FileIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  )
}
