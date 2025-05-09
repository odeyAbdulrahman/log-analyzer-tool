"use client"

import React from "react"
import type { LogEntry } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Search, AlertCircle, FileText } from "lucide-react"
import { Pagination } from "@/components/pagination"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "@/lib/utils"

interface LogTableProps {
  logs: { [fileName: string]: LogEntry[] }
  loading: boolean
  error: string | null
  totalCount: number
  currentPage: number
  pageSize: number
  onPageChange: (page: number) => void
  onViewDetails: (log: LogEntry) => void
}

export function LogTable({
  logs,
  loading,
  error,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onViewDetails,
}: LogTableProps) {
  const formatExceptionType = (exceptionType: string) => {
    // Remove namespace prefixes for common .NET exceptions
    const commonPrefixes = [
      'System.IO.',
      'System.Security.Cryptography.',
      'System.',
      'Microsoft.',
    ]
    
    let formattedType = exceptionType
    for (const prefix of commonPrefixes) {
      if (formattedType.startsWith(prefix)) {
        formattedType = formattedType.substring(prefix.length)
        break
      }
    }
    
    // Add spaces before capital letters for better readability
    formattedType = formattedType.replace(/([A-Z])/g, ' $1').trim()
    
    return formattedType
  }

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

  const getBadgeIcon = (level: string) => {
    switch (level) {
      case "ERR":
        return <AlertCircle className="h-3 w-3 mr-1" />
      case "WRN":
        return <AlertCircle className="h-3 w-3 mr-1" />
      default:
        return <FileText className="h-3 w-3 mr-1" />
    }
  }

  const getRowClass = (level: string) => {
    switch (level) {
      case "ERR":
        return "bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20"
      case "WRN":
        return "bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/10 dark:hover:bg-yellow-900/20"
      default:
        return "hover:bg-gray-50 dark:hover:bg-gray-800/50"
    }
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex flex-col space-y-3">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-4 w-[30%]" />
                <Skeleton className="h-4 w-[15%]" />
                <Skeleton className="h-4 w-[15%]" />
              </div>
              <Skeleton className="h-4 w-[80%]" />
              <Skeleton className="h-4 w-[40%]" />
              <div className="border-b border-gray-100 dark:border-gray-800 pt-2" />
            </div>
          ))}
        </div>
      )
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium">Error loading logs</h3>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      )
    }

    const allLogs = Object.values(logs).flat()
    if (allLogs.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-3 mb-4">
            <Search className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No log entries found</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-md">
            Try adjusting your search filters or selecting a different date range to find log entries.
          </p>
        </div>
      )
    }

    return (
      <>
        <div className="overflow-x-auto -mx-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="text-left p-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="text-left p-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Level
                </th>
                <th className="text-left p-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Exception
                </th>
                <th className="text-left p-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Message
                </th>
                <th className="text-right p-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {Object.entries(logs).map(([fileName, fileLogs]) => (
                <React.Fragment key={fileName}>
                  <tr className="bg-gray-50 dark:bg-gray-800/50">
                    <td colSpan={5} className="p-2 px-3">
                      <div className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                        <FileText className="h-4 w-4 mr-2" />
                        {fileName}
                      </div>
                    </td>
                  </tr>
                  {fileLogs.map((log, index) => {
                    const messagePreview = log.message.length > 100 ? log.message.substring(0, 100) + "..." : log.message

                    return (
                      <tr key={`${fileName}-${index}`} className={`${getRowClass(log.level)} transition-colors`}>
                        <td className="p-3 text-sm whitespace-nowrap">
                          <div className="font-medium">{formatDate(log.timestamp).date}</div>
                          <div className="text-gray-500 dark:text-gray-400 text-xs">
                            {formatDate(log.timestamp).time}
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant={getBadgeVariant(log.level)} className="flex items-center">
                            {getBadgeIcon(log.level)}
                            {log.level}
                          </Badge>
                        </td>
                        <td className="p-3">
                          {log.exceptionType ? (
                            <div className="flex items-center">
                              <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                              <div className="text-sm">
                                <div className="font-medium text-red-600 dark:text-red-400">
                                  {formatExceptionType(log.exceptionType)}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-[200px]" title={log.exceptionType}>
                                  {log.exceptionType}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="p-3 text-sm">
                          <div className="font-medium">{messagePreview}</div>
                          {log.sourceFile && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Source: {log.sourceFile}</div>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewDetails(log)}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(totalCount / pageSize)}
            onPageChange={onPageChange}
          />
        </div>
      </>
    )
  }

  return (
    <Card className="shadow-sm overflow-hidden">
      <CardContent className="p-6">{renderContent()}</CardContent>
    </Card>
  )
}
