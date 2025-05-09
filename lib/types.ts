export interface LogEntry {
  timestamp: string
  level: string
  message: string
  exceptionType?: string
  sourceFile?: string
  stackTrace?: string
}

export interface LogSearchCriteria {
  fromDate?: string
  toDate?: string
  level?: string
  searchText?: string
  exceptionType?: string
  sourceFile?: string
  page?: number
  pageSize?: number
}

export interface LogSearchResult {
  success: boolean
  results: LogEntry[]
  totalCount: number
  page: number
  pageSize: number
  error?: string
}

export interface LogStats {
  totalEntries: number
  errorCount: number
  warningCount: number
  infoCount: number
  commonExceptions: { [key: string]: number }
  commonSources: { [key: string]: number }
}

export interface GroupedLogResults {
  results: { [fileName: string]: LogEntry[] }
  totalCount: number
}
