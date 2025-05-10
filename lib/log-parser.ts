import fs from "fs"
import path from "path"
import type { LogEntry, LogSearchCriteria, LogStats, GroupedLogResults } from "./types"

// Define regex patterns for different log formats
const LOG_FORMATS = {
  standard: {
    newEntry: /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}.*\[(ERR|WRN|INF)\]/,
    parse: /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}).*?\[(ERR|WRN|INF)\](.*)/,
  },
  serilog: {
    newEntry: /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} [\w]+ /,
    parse: /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) ([\w]+) (.*)/,
  },
  nlog: {
    newEntry: /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3} \[/,
    parse: /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3}) \[([\w]+)\] (.*)/,
  },
  log4net: {
    newEntry: /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2},\d{3}\s+\[\w+\]/,
    parse: /^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2},\d{3})\s+\[([\w]+)\]\s+(.*)/,
  },
}

// Helper function to map log levels to standard format
function mapLogLevel(level: string): string {
  level = level.toUpperCase()

  // Handle error levels
  if (level.includes("ERROR") || level.includes("FATAL") || level.includes("SEVERE") || level === "ERR") {
    return "ERR"
  }

  // Handle warning levels
  if (level.includes("WARN") || level === "WRN") {
    return "WRN"
  }

  // Handle info levels
  if (level.includes("INFO") || level.includes("INFORMATION") || level === "INF") {
    return "INF"
  }

  // Handle debug/trace levels
  if (level.includes("DEBUG") || level.includes("TRACE") || level.includes("VERBOSE")) {
    return "INF"
  }

  // Default to INFO for unknown levels
  return "INF"
}

// Detect log format from sample lines
function detectLogFormat(sampleLines: string[]): string {
  for (const line of sampleLines) {
    for (const [format, patterns] of Object.entries(LOG_FORMATS)) {
      if (patterns.newEntry.test(line)) {
        return format
      }
    }
  }

  return "standard" // Default
}

// Parse a log file
export function parseLogFile(filePath: string): LogEntry[] {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`File does not exist: ${filePath}`)
      return []
    }

    const content = fs.readFileSync(filePath, "utf8")
    const lines = content.split("\n")

    if (lines.length === 0) {
      console.warn(`File is empty: ${filePath}`)
      return []
    }

    // Detect log format
    const sampleLines = lines.slice(0, 10)
    const format = detectLogFormat(sampleLines)
    const patterns = LOG_FORMATS[format as keyof typeof LOG_FORMATS]

    const entries: LogEntry[] = []
    let currentEntry: LogEntry | null = null

    for (const line of lines) {
      if (patterns.newEntry.test(line)) {
        if (currentEntry) entries.push(currentEntry)
        currentEntry = parseLogLine(line, format)
      } else if (currentEntry) {
        currentEntry.message += "\n" + line
        if (line.includes(" at ") && !currentEntry.stackTrace) {
          currentEntry.stackTrace = line + "\n"
        }
      }
    }

    if (currentEntry) entries.push(currentEntry)

    return entries
  } catch (error) {
    console.error(`Error parsing log file: ${filePath}`, error)
    return []
  }
}

// Parse a single log line
function parseLogLine(line: string, format: string): LogEntry {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: "INF",
    message: line,
  }

  try {
    const patterns = LOG_FORMATS[format as keyof typeof LOG_FORMATS]
    const match = line.match(patterns.parse)

    if (match) {
      let timestamp = match[1]
      const level = match[2]
      const message = match[3] || ""

      // Handle different date formats
      if (format === "nlog" || format === "log4net") {
        timestamp = timestamp.replace(",", ".")
      }

      // Parse the timestamp with timezone information
      const dateMatch = timestamp.match(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}) ([+-]\d{2}:\d{2})/)
      if (dateMatch) {
        const [_, dateTime, timezone] = dateMatch
        // Create date with timezone offset
        const date = new Date(dateTime + timezone)
        entry.timestamp = date.toISOString()
      } else {
        // Fallback to simple date parsing if no timezone
        entry.timestamp = new Date(timestamp).toISOString()
      }

      entry.level = mapLogLevel(level)
      entry.message = message.trim()

      // Extract exception information if present
      if (entry.message.includes("Exception")) {
        const exceptionMatch = entry.message.match(/(\w+\.\w+Exception):/)
        if (exceptionMatch) {
          entry.exceptionType = exceptionMatch[1]
        }

        const sourceMatch = entry.message.match(/in (.*\.cs):line \d+/)
        if (sourceMatch) {
          entry.sourceFile = path.basename(sourceMatch[1])
        }
      }
    }
  } catch (error) {
    console.error(`Error parsing log line: ${line}`, error)
  }

  return entry
}

// Get relevant log files based on criteria
export function getRelevantLogFiles(logDirectory: string, criteria: LogSearchCriteria): string[] {
  try {
    if (!fs.existsSync(logDirectory)) {
      console.warn(`Log directory does not exist: ${logDirectory}`)
      return []
    }

    const allFiles = fs
      .readdirSync(logDirectory)
      .map((file) => path.join(logDirectory, file))
      .filter((file) => fs.statSync(file).isFile())

    // If no date criteria, return all files
    if (!criteria.fromDate && !criteria.toDate) {
      return allFiles
    }

    // Filter files by date
    const fromDate = criteria.fromDate ? new Date(criteria.fromDate) : null
    const toDate = criteria.toDate ? new Date(criteria.toDate) : null

    const relevantFiles = allFiles.filter((file) => {
      const fileName = path.basename(file, path.extname(file))

      // Try to parse date from filename
      const dateFormats = ["yyyyMMdd", "yyyy-MM-dd", "yyyy_MM_dd"]
      for (const format of dateFormats) {
        const datePattern = format.replace("yyyy", "(\\d{4})").replace("MM", "(\\d{2})").replace("dd", "(\\d{2})")

        const match = fileName.match(new RegExp(datePattern))
        if (match) {
          const year = Number.parseInt(match[1])
          const month = Number.parseInt(match[2]) - 1 // JS months are 0-based
          const day = Number.parseInt(match[3])

          const fileDate = new Date(year, month, day)

          if (fromDate && fileDate < fromDate) return false
          if (toDate && fileDate > toDate) return false
          return true
        }
      }

      // If filename doesn't contain a date, check file stats
      try {
        const stats = fs.statSync(file)
        const fileDate = stats.mtime

        if (fromDate && fileDate < fromDate) return false
        if (toDate && fileDate > toDate) return false
        return true
      } catch {
        return true // Include file if we can't determine date
      }
    })

    return relevantFiles.length > 0 ? relevantFiles : allFiles
  } catch (error) {
    console.error(`Error getting relevant log files: ${error}`)
    return []
  }
}

// Search logs based on criteria
export function searchLogs(
  logDirectory: string,
  criteria: LogSearchCriteria,
): GroupedLogResults {
  try {
    const logFiles = getRelevantLogFiles(logDirectory, criteria)
    let allEntries: LogEntry[] = []

    for (const file of logFiles) {
      const entries = parseLogFile(file)
      // Add file name to each entry
      entries.forEach(entry => {
        entry.sourceFile = path.basename(file)
      })
      allEntries = [...allEntries, ...entries]
    }

    // Apply filters
    const filtered = allEntries.filter((entry) => {
      const entryDate = new Date(entry.timestamp)
      
      if (criteria.fromDate) {
        const fromDate = new Date(criteria.fromDate)
        fromDate.setHours(0, 0, 0, 0) // Set to start of day
        if (entryDate < fromDate) return false
      }
      
      if (criteria.toDate) {
        const toDate = new Date(criteria.toDate)
        toDate.setHours(23, 59, 59, 999) // Set to end of day
        if (entryDate > toDate) return false
      }
      
      if (criteria.level && entry.level !== criteria.level) return false
      if (criteria.searchText && !entry.message.toLowerCase().includes(criteria.searchText.toLowerCase())) return false
      if (
        criteria.exceptionType &&
        (!entry.exceptionType || !entry.exceptionType.toLowerCase().includes(criteria.exceptionType.toLowerCase()))
      )
        return false
      if (
        criteria.sourceFile &&
        (!entry.sourceFile || !entry.sourceFile.toLowerCase().includes(criteria.sourceFile.toLowerCase()))
      )
        return false
      return true
    })

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Group entries by file name
    const groupedEntries: { [fileName: string]: LogEntry[] } = {}
    filtered.forEach(entry => {
      const fileName = entry.sourceFile || 'unknown'
      if (!groupedEntries[fileName]) {
        groupedEntries[fileName] = []
      }
      groupedEntries[fileName].push(entry)
    })

    // Apply pagination to each group
    const page = criteria.page || 1
    const pageSize = criteria.pageSize || 20
    const start = (page - 1) * pageSize
    const end = start + pageSize

    // Get paginated results for each group
    const pagedGroups: { [fileName: string]: LogEntry[] } = {}
    Object.entries(groupedEntries).forEach(([fileName, entries]) => {
      pagedGroups[fileName] = entries.slice(start, end)
    })

    return {
      results: pagedGroups,
      totalCount: filtered.length,
    }
  } catch (error) {
    console.error(`Error searching logs: ${error}`)
    return {
      results: {},
      totalCount: 0,
    }
  }
}

// Get log statistics
export function getLogStats(logDirectory: string, fromDate?: string, toDate?: string): LogStats {
  try {
    const criteria: LogSearchCriteria = { fromDate, toDate }
    // Get all results without pagination
    const logFiles = getRelevantLogFiles(logDirectory, criteria)
    let allEntries: LogEntry[] = []

    for (const file of logFiles) {
      const entries = parseLogFile(file)
      entries.forEach(entry => {
        entry.sourceFile = path.basename(file)
      })
      allEntries = [...allEntries, ...entries]
    }

    // Filter entries based on date criteria and level
    const filtered = allEntries.filter((entry) => {
      const entryDate = new Date(entry.timestamp)
      
      if (criteria.fromDate) {
        const fromDate = new Date(criteria.fromDate)
        fromDate.setHours(0, 0, 0, 0)
        if (entryDate < fromDate) return false
      }
      
      if (criteria.toDate) {
        const toDate = new Date(criteria.toDate)
        toDate.setHours(23, 59, 59, 999)
        if (entryDate > toDate) return false
      }

      // In searchLogs function
      if (criteria.level && entry.level !== criteria.level) return false

      // In getLogStats function
      if (criteria.level && entry.level !== criteria.level) return false

      return true
    })

    const stats: LogStats = {
      totalEntries: filtered.length,
      errorCount: filtered.filter((log) => log.level === "ERR").length,
      warningCount: filtered.filter((log) => log.level === "WRN").length,
      infoCount: filtered.filter((log) => log.level === "INF").length,
      commonExceptions: {},
      commonSources: {},
    }

    // Calculate common exceptions
    filtered
      .filter((log) => log.exceptionType)
      .forEach((log) => {
        const exceptionType = log.exceptionType as string
        stats.commonExceptions[exceptionType] = (stats.commonExceptions[exceptionType] || 0) + 1
      })

    // Calculate common source files
    filtered
      .filter((log) => log.sourceFile)
      .forEach((log) => {
        const sourceFile = log.sourceFile as string
        stats.commonSources[sourceFile] = (stats.commonSources[sourceFile] || 0) + 1
      })

    // Sort and limit to top 5
    stats.commonExceptions = Object.fromEntries(
      Object.entries(stats.commonExceptions)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
    )

    stats.commonSources = Object.fromEntries(
      Object.entries(stats.commonSources)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
    )

    return stats
  } catch (error) {
    console.error(`Error getting log stats: ${error}`)
    return {
      totalEntries: 0,
      errorCount: 0,
      warningCount: 0,
      infoCount: 0,
      commonExceptions: {},
      commonSources: {},
    }
  }
}
