"use client"

import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, AlertTriangle, Info, BarChart2 } from "lucide-react"

interface StatsPanelProps {
  stats: any
  loading: boolean
}

export function StatsPanel({ stats, loading }: StatsPanelProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-[50%]" />
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-[50%]" />
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-[50%]" />
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-[50%]" />
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-3 mb-4">
          <BarChart2 className="h-6 w-6 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No statistics available</h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-md">
          Use the search filters to analyze logs and view statistics.
        </p>
      </div>
    )
  }

  const getPercentage = (part: number, total: number) => {
    return total > 0 ? Math.round((part / total) * 100) : 0
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
          <div className="flex items-center">
            <div className="bg-red-100 dark:bg-red-900/30 rounded-full p-2 mr-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <div className="text-sm font-medium text-red-800 dark:text-red-300">Errors</div>
              <div className="text-2xl font-bold text-red-900 dark:text-red-200">{stats.errorCount}</div>
            </div>
          </div>
          <Progress
            value={getPercentage(stats.errorCount, stats.totalEntries)}
            className="h-1.5 mt-3 bg-red-200 dark:bg-red-900/50"
          >
            <div className="bg-red-600 dark:bg-red-400 h-full" />
          </Progress>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
          <div className="flex items-center">
            <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-full p-2 mr-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <div className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Warnings</div>
              <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-200">{stats.warningCount}</div>
            </div>
          </div>
          <Progress
            value={getPercentage(stats.warningCount, stats.totalEntries)}
            className="h-1.5 mt-3 bg-yellow-200 dark:bg-yellow-900/50"
          >
            <div className="bg-yellow-600 dark:bg-yellow-400 h-full" />
          </Progress>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="flex items-center">
            <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-2 mr-3">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-sm font-medium text-blue-800 dark:text-blue-300">Info</div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-200">{stats.infoCount}</div>
            </div>
          </div>
          <Progress
            value={getPercentage(stats.infoCount, stats.totalEntries)}
            className="h-1.5 mt-3 bg-blue-200 dark:bg-blue-900/50"
          >
            <div className="bg-blue-600 dark:bg-blue-400 h-full" />
          </Progress>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4 flex items-center">
          <BarChart2 className="h-5 w-5 mr-2 text-gray-500" />
          Log Distribution
        </h3>
        <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex">
          {stats.errorCount > 0 && (
            <div
              className="h-full bg-red-500 dark:bg-red-600 flex items-center justify-center text-white text-xs font-medium"
              style={{ width: `${getPercentage(stats.errorCount, stats.totalEntries)}%` }}
            >
              {getPercentage(stats.errorCount, stats.totalEntries)}%
            </div>
          )}
          {stats.warningCount > 0 && (
            <div
              className="h-full bg-yellow-500 dark:bg-yellow-600 flex items-center justify-center text-white text-xs font-medium"
              style={{ width: `${getPercentage(stats.warningCount, stats.totalEntries)}%` }}
            >
              {getPercentage(stats.warningCount, stats.totalEntries)}%
            </div>
          )}
          {stats.infoCount > 0 && (
            <div
              className="h-full bg-blue-500 dark:bg-blue-600 flex items-center justify-center text-white text-xs font-medium"
              style={{ width: `${getPercentage(stats.infoCount, stats.totalEntries)}%` }}
            >
              {getPercentage(stats.infoCount, stats.totalEntries)}%
            </div>
          )}
        </div>
        <div className="flex justify-center mt-2 gap-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Errors</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-1"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Warnings</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Info</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stats.commonExceptions && Object.keys(stats.commonExceptions).length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">Top Exceptions</h3>
            <ul className="space-y-2">
              {Object.entries(stats.commonExceptions).map(([key, value]: [string, any], index) => (
                <li
                  key={key}
                  className="flex justify-between items-center text-sm p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex items-center space-x-2 truncate mr-2">
                    <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium">
                      {index + 1}
                    </span>
                    <span className="truncate font-medium" title={key}>
                      {key}
                    </span>
                  </div>
                  <Badge variant="secondary" className="ml-auto flex-shrink-0">
                    {value}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        )}

        {stats.commonSources && Object.keys(stats.commonSources).length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">Top Source Files</h3>
            <ul className="space-y-2">
              {Object.entries(stats.commonSources).map(([key, value]: [string, any], index) => (
                <li
                  key={key}
                  className="flex justify-between items-center text-sm p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex items-center space-x-2 truncate mr-2">
                    <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium">
                      {index + 1}
                    </span>
                    <span className="truncate font-medium" title={key}>
                      {key}
                    </span>
                  </div>
                  <Badge variant="secondary" className="ml-auto flex-shrink-0">
                    {value}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
