"use client"

import { useState, useEffect, type FormEvent } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, RotateCcw } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface SearchFiltersProps {
  onSearch: (criteria: any) => void
}

export function SearchFilters({ onSearch }: SearchFiltersProps) {
  // Define the formatDateForInput function first
  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split("T")[0]
  }

  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [logLevel, setLogLevel] = useState("")
  const [searchText, setSearchText] = useState("")
  const [exceptionType, setExceptionType] = useState("")
  const [sourceFile, setSourceFile] = useState("")
  const [expandedAdvanced, setExpandedAdvanced] = useState(false)

  // Set default date range (last 7 days)
  useEffect(() => {
    const today = new Date()
    const lastWeek = new Date()
    lastWeek.setDate(today.getDate() - 7)

    setToDate(formatDateForInput(today))
    setFromDate(formatDateForInput(lastWeek))
  }, [])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    onSearch({
      fromDate,
      toDate,
      level: logLevel,
      searchText,
      exceptionType,
      sourceFile,
      page: 1,
      pageSize: 20,
    })
  }

  const handleReset = () => {
    const today = new Date()
    const lastWeek = new Date()
    lastWeek.setDate(today.getDate() - 7)

    setToDate(formatDateForInput(today))
    setFromDate(formatDateForInput(lastWeek))
    setLogLevel("")
    setSearchText("")
    setExceptionType("")
    setSourceFile("")
  }

  return (
    <Card className="shadow-md">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <CardTitle className="flex items-center">
          <Search className="mr-2 h-5 w-5" />
          Search Filters
        </CardTitle>
        <CardDescription className="text-blue-100">Find and analyze specific log entries</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="dateRange" className="text-sm font-medium">
              Date Range
            </Label>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              <div className="relative">
                <Input
                  type="date"
                  id="fromDate"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="pl-3"
                />
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 pointer-events-none text-xs">
                  From
                </span>
              </div>
              <div className="relative">
                <Input
                  type="date"
                  id="toDate"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="pl-3"
                />
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 pointer-events-none text-xs">
                  To
                </span>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="logLevel" className="text-sm font-medium">
              Log Level
            </Label>
            <Select value={logLevel} onValueChange={setLogLevel}>
              <SelectTrigger id="logLevel" className="mt-1.5">
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Levels</SelectItem>
                <SelectItem value="ERR">Errors</SelectItem>
                <SelectItem value="WRN">Warnings</SelectItem>
                <SelectItem value="INF">Info</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="searchText" className="text-sm font-medium">
              Search Text
            </Label>
            <Input
              id="searchText"
              placeholder="Message content..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="mt-1.5"
            />
          </div>

          <Accordion
            type="single"
            collapsible
            value={expandedAdvanced ? "advanced" : ""}
            onValueChange={(val) => setExpandedAdvanced(val === "advanced")}
          >
            <AccordionItem value="advanced" className="border-none">
              <AccordionTrigger className="py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:no-underline">
                Advanced Filters
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <div>
                  <Label htmlFor="exceptionType" className="text-sm font-medium">
                    Exception Type
                  </Label>
                  <Input
                    id="exceptionType"
                    placeholder="System.Exception"
                    value={exceptionType}
                    onChange={(e) => setExceptionType(e.target.value)}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="sourceFile" className="text-sm font-medium">
                    Source File
                  </Label>
                  <Input
                    id="sourceFile"
                    placeholder="File.cs"
                    value={sourceFile}
                    onChange={(e) => setSourceFile(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
            <Button type="button" variant="outline" onClick={handleReset} className="px-3">
              <RotateCcw className="h-4 w-4" />
              <span className="sr-only">Reset</span>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
