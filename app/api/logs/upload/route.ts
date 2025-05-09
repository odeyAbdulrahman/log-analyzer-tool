import { type NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { existsSync } from "fs"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    // Get the log directory path
    const logDirectory = path.join(process.cwd(), "public", "logs")

    // Create the directory if it doesn't exist
    if (!existsSync(logDirectory)) {
      await mkdir(logDirectory, { recursive: true })
    }

    // Generate a unique filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const fileName = `${timestamp}-${file.name}`
    const filePath = path.join(logDirectory, fileName)

    // Convert the file to a Buffer and write it to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    await writeFile(filePath, buffer)

    return NextResponse.json({
      success: true,
      fileName,
      path: `/logs/${fileName}`,
      message: "File uploaded successfully",
    })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to upload file",
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}

// Increase the body size limit for file uploads (default is 4mb)
export const config = {
  api: {
    bodyParser: false,
  },
}
