import { type NextRequest, NextResponse } from "next/server"
import { getLogStats } from "@/lib/log-parser"
import path from "path"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    const fromDate = searchParams.get("fromDate") || undefined
    const toDate = searchParams.get("toDate") || undefined

    // Get log directory path - in a real app, this would be configurable
    const logDirectory = path.join(process.cwd(), "public", "logs")

    const stats = getLogStats(logDirectory, fromDate, toDate)

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error getting log stats:", error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
