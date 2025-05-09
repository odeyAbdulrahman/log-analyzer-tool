import { type NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const customPath = searchParams.get("path")

    // Get log directory path - in a real app, this would be configurable
    const logDirectory = customPath || path.join(process.cwd(), "public", "logs")

    if (!fs.existsSync(logDirectory)) {
      return NextResponse.json({
        success: false,
        error: `Directory does not exist: ${logDirectory}`,
      })
    }

    const files = fs.readdirSync(logDirectory)
    const fileDetails = files.map((file) => {
      const filePath = path.join(logDirectory, file)
      const stats = fs.statSync(filePath)

      return {
        name: file,
        path: filePath,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isDirectory: stats.isDirectory(),
      }
    })

    return NextResponse.json({
      success: true,
      directory: logDirectory,
      fileCount: files.length,
      files: fileDetails,
    })
  } catch (error) {
    console.error("Error in debug endpoint:", error)
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
        stack: (error as Error).stack,
      },
      { status: 500 },
    )
  }
}
