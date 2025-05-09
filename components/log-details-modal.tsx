"use client"

import type { LogEntry } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, AlertTriangle, Info, Clock, FileText, Code } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { formatDate } from "@/lib/utils"

interface LogDetailsModalProps {
  log: LogEntry | null
  isOpen: boolean
  onClose: () => void
}

export function LogDetailsModal({ log, isOpen, onClose }: LogDetailsModalProps) {
  const [activeTab, setActiveTab] = useState("message")

  if (!log) return null

  const getBadgeVariant = (level: string) => {
    switch (level) {
      case "ERR":
        return "destructive"
      case "WRN":
        return "warning"
      default:
        return "secondary"
    }
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "ERR":
        return <AlertCircle className="h-4 w-4 mr-1.5" />
      case "WRN":
        return <AlertTriangle className="h-4 w-4 mr-1.5" />
      default:
        return <Info className="h-4 w-4 mr-1.5" />
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        // Could add a toast notification here
        console.log("Copied to clipboard")
      })
      .catch((err) => {
        console.error("Failed to copy: ", err)
      })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center text-xl">
            {getLevelIcon(log.level)}
            Log Entry Details
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 border-y">
          <div className="flex items-start">
            <Clock className="h-4 w-4 mt-0.5 mr-2 text-gray-500" />
            <div>
              <div className="text-xs text-gray-500 font-medium">TIMESTAMP</div>
              <div className="font-medium">{formatDate(log.timestamp).date}</div>
              <div className="text-sm text-gray-600">{formatDate(log.timestamp).time}</div>
            </div>
          </div>

          <div className="flex items-start">
            <div className="mt-0.5 mr-2">
              <Badge variant={getBadgeVariant(log.level)} className="flex items-center">
                {getLevelIcon(log.level)}
                {log.level}
              </Badge>
            </div>
            <div>
              <div className="text-xs text-gray-500 font-medium">LEVEL</div>
              <div className="text-sm">
                {log.level === "ERR" && "Error"}
                {log.level === "WRN" && "Warning"}
                {log.level === "INF" && "Information"}
              </div>
            </div>
          </div>

          {log.exceptionType && (
            <div className="flex items-start">
              <AlertCircle className="h-4 w-4 mt-0.5 mr-2 text-gray-500" />
              <div>
                <div className="text-xs text-gray-500 font-medium">EXCEPTION</div>
                <div className="font-medium text-red-600 dark:text-red-400">{log.exceptionType}</div>
              </div>
            </div>
          )}

          {log.sourceFile && (
            <div className="flex items-start">
              <FileText className="h-4 w-4 mt-0.5 mr-2 text-gray-500" />
              <div>
                <div className="text-xs text-gray-500 font-medium">SOURCE</div>
                <div className="font-medium">{log.sourceFile}</div>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-hidden mt-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="message" className="flex items-center">
                  <FileText className="h-4 w-4 mr-1.5" />
                  Message
                </TabsTrigger>
                {log.stackTrace && (
                  <TabsTrigger value="stacktrace" className="flex items-center">
                    <Code className="h-4 w-4 mr-1.5" />
                    Stack Trace
                  </TabsTrigger>
                )}
              </TabsList>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(activeTab === "message" ? log.message : log.stackTrace || "")}
                className="text-xs"
              >
                Copy to Clipboard
              </Button>
            </div>

            <TabsContent value="message" className="mt-0 max-h-[50vh] overflow-auto">
              <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md overflow-x-auto whitespace-pre-wrap text-sm font-mono border border-gray-200 dark:border-gray-800">
                {log.message}
              </pre>
            </TabsContent>

            {log.stackTrace && (
              <TabsContent value="stacktrace" className="mt-0 max-h-[50vh] overflow-auto">
                <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md overflow-x-auto whitespace-pre-wrap text-sm font-mono border border-gray-200 dark:border-gray-800">
                  {log.stackTrace}
                </pre>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
