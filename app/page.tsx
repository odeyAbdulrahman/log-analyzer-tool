"use client"

import { useState, useEffect } from "react"
import type { LogEntry, LogSearchCriteria } from "@/lib/types"
import { SearchFilters } from "@/components/search-filters"
import { StatsPanel } from "@/components/stats-panel"
import { LogTable } from "@/components/log-table"
import { LogDetailsModal } from "@/components/log-details-modal"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, RefreshCw } from "lucide-react"
import { FileUpload } from "@/components/file-upload"
import dynamic from "next/dynamic"

// Dynamically import LogFilesList with SSR disabled
const LogFilesList = dynamic(() => import("@/components/log-files-list").then(mod => mod.LogFilesList), {
  ssr: false,
  loading: () => (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Log Files</CardTitle>
            <CardDescription>Manage your log files</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center text-muted-foreground py-8">
          Loading...
        </div>
      </CardContent>
    </Card>
  ),
})

export default function LogAnalyzerPage() {
  const [searchResults, setSearchResults] = useState<{ [fileName: string]: LogEntry[] }>({})
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("logs")
  const [searchCriteria, setSearchCriteria] = useState<LogSearchCriteria>({})
  const [lastUploadedFile, setLastUploadedFile] = useState<string | null>(null)
  const [refreshFileListTrigger, setRefreshFileListTrigger] = useState(0)

  const pageSize = 20

  useEffect(() => {
    // Load initial stats and logs on page load
    loadStats()
    // Set default date range (last 7 days)
    const today = new Date()
    const lastWeek = new Date()
    lastWeek.setDate(today.getDate() - 7)
    
    const initialCriteria: LogSearchCriteria = {
      fromDate: lastWeek.toISOString().split('T')[0],
      toDate: today.toISOString().split('T')[0],
      page: 1,
      pageSize: pageSize
    }
    
    handleSearch(initialCriteria)
  }, [])

  const handleSearch = async (criteria: LogSearchCriteria) => {
    setLoading(true)
    setError(null)
    setSearchCriteria(criteria)

    try {
      const response = await fetch(
        `/api/logs/search?${new URLSearchParams({
          ...criteria,
          page: currentPage.toString(),
          pageSize: pageSize.toString(),
        })}`,
      )

      const data = await response.json()

      if (data.success) {
        setSearchResults(data.results)
        setTotalCount(data.totalCount)

        // Switch to logs tab after search
        setActiveTab("logs")
      } else {
        setError(data.error || "An error occurred while searching logs")
      }
    } catch (err) {
      setError("Failed to fetch search results")
      console.error(err)
    } finally {
      setLoading(false)
    }

    // Also refresh stats
    loadStats(criteria.fromDate, criteria.toDate)
  }

  const loadStats = async (fromDate?: string, toDate?: string) => {
    setStatsLoading(true)

    try {
      const params = new URLSearchParams()
      if (fromDate) params.append("fromDate", fromDate)
      if (toDate) params.append("toDate", toDate)

      const response = await fetch(`/api/logs/stats?${params}`)
      const data = await response.json()

      setStats(data)
    } catch (err) {
      console.error("Failed to load stats:", err)
    } finally {
      setStatsLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Re-trigger search with new page
    handleSearch({
      ...searchCriteria,
      page,
      pageSize,
    })
  }

  const handleViewDetails = (log: LogEntry) => {
    setSelectedLog(log)
    setShowModal(true)
  }

  const handleRefresh = () => {
    handleSearch(searchCriteria)
  }

  const handleExport = async () => {
    try {
      // Create CSV content
      let csvContent = "data:text/csv;charset=utf-8,"

      // Add headers
      csvContent += "Timestamp,Level,Message,Exception Type,Source File\n"

      // Add data rows
      Object.values(searchResults).flat().forEach((log: LogEntry) => {
        const timestamp = new Date(log.timestamp).toISOString()
        const level = log.level
        const message = `"${log.message.replace(/"/g, '""')}"`
        const exceptionType = log.exceptionType || ""
        const sourceFile = log.sourceFile || ""

        csvContent += `${timestamp},${level},${message},${exceptionType},${sourceFile}\n`
      })

      // Create download link
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement("a")
      link.setAttribute("href", encodedUri)
      link.setAttribute("download", `log-export-${new Date().toISOString().split("T")[0]}.csv`)
      document.body.appendChild(link)

      // Trigger download
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error("Failed to export logs:", err)
    }
  }

  const refreshFileList = () => {
    setRefreshFileListTrigger((prev) => prev + 1)
  }

  const handleUploadComplete = (fileNames: string[]) => {
    // Refresh the logs after upload
    handleSearch(searchCriteria)
    // Also refresh the file list
    refreshFileList()
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="flex flex-col space-y-6">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Log Analyzer</h1>
            <p className="text-muted-foreground mt-1">Search, analyze, and visualize your application logs</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExport} 
              disabled={Object.values(searchResults).flat().length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <SearchFilters onSearch={handleSearch} />
            <FileUpload onUploadComplete={handleUploadComplete} onRefreshFileList={refreshFileList} />
          </div>

          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex justify-between items-center mb-4">
                <TabsList>
                  <TabsTrigger value="logs">Log Entries</TabsTrigger>
                  <TabsTrigger value="stats">Statistics</TabsTrigger>
                  <TabsTrigger value="files">Files</TabsTrigger>
                </TabsList>
                <div className="text-sm text-muted-foreground">
                  {activeTab === "logs" && totalCount > 0 && `${totalCount} entries found`}
                </div>
              </div>

              <TabsContent value="logs" className="mt-0">
                <LogTable
                  logs={searchResults}
                  loading={loading}
                  error={error}
                  totalCount={totalCount}
                  currentPage={currentPage}
                  pageSize={pageSize}
                  onPageChange={handlePageChange}
                  onViewDetails={handleViewDetails}
                />
              </TabsContent>

              <TabsContent value="stats" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Log Statistics</CardTitle>
                    <CardDescription>Overview of log entries distribution and common patterns</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <StatsPanel stats={stats} loading={statsLoading} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="files" className="mt-0">
                <LogFilesList key={refreshFileListTrigger} onRefresh={refreshFileList} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <LogDetailsModal log={selectedLog} isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  )
}
