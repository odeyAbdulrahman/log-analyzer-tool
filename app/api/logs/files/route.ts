import { NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

// Update the logs directory path to use the public directory
const LOGS_DIR = path.join(process.cwd(), "public", "logs")

export async function GET() {
  try {
    // Ensure logs directory exists
    await fs.mkdir(LOGS_DIR, { recursive: true })

    // Read all files in the logs directory
    const files = await fs.readdir(LOGS_DIR)

    // Get file stats for each file
    const fileStats = await Promise.all(
      files.map(async (fileName) => {
        const filePath = path.join(LOGS_DIR, fileName)
        const stats = await fs.stat(filePath)
        return {
          name: fileName,
          size: stats.size,
          lastModified: stats.mtime.toISOString(),
        }
      })
    )

    // Sort files by last modified date (newest first)
    fileStats.sort((a, b) => 
      new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
    )

    return NextResponse.json({ success: true, files: fileStats })
  } catch (error) {
    console.error("Error reading log files:", error)
    return NextResponse.json(
      { success: false, error: "Failed to read log files" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { files } = await request.json()

    if (!Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { success: false, error: "No files specified for deletion" },
        { status: 400 }
      )
    }

    // Ensure logs directory exists
    await fs.mkdir(LOGS_DIR, { recursive: true })

    // Delete each file
    const results = await Promise.allSettled(
      files.map(async (fileName) => {
        const filePath = path.join(LOGS_DIR, fileName)
        await fs.unlink(filePath)
        return fileName
      })
    )

    // Check if any deletions failed
    const failedDeletions = results.filter(
      (result) => result.status === "rejected"
    )

    if (failedDeletions.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Some files could not be deleted",
          failedFiles: failedDeletions.map((result) => {
            if (result.status === "rejected") {
              return (result.reason as Error).message
            }
            return null
          }),
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting log files:", error)
    return NextResponse.json(
      { success: false, error: "Failed to delete log files" },
      { status: 500 }
    )
  }
}
