import { type NextRequest, NextResponse } from "next/server"
import { searchLogs } from "@/lib/log-parser"
import path from "path"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    const criteria = {
      fromDate: searchParams.get("fromDate") || undefined,
      toDate: searchParams.get("toDate") || undefined,
      level: searchParams.get("level") || undefined,
      searchText: searchParams.get("searchText") || undefined,
      exceptionType: searchParams.get("exceptionType") || undefined,
      sourceFile: searchParams.get("sourceFile") || undefined,
      page: Number.parseInt(searchParams.get("page") || "1"),
      pageSize: Number.parseInt(searchParams.get("pageSize") || "20"),
    }

    // Get log directory path - in a real app, this would be configurable
    const logDirectory = path.join(process.cwd(), "public", "logs")

    const { results, totalCount } = searchLogs(logDirectory, criteria)

    return NextResponse.json({
      success: true,
      results,
      totalCount,
      page: criteria.page,
      pageSize: criteria.pageSize,
      groupedByFile: true,
    })
  } catch (error) {
    console.error("Error in log search:", error)
    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while searching logs",
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
