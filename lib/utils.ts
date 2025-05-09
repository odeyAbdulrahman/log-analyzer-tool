import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(timestamp: string): { date: string; time: string } {
  const date = new Date(timestamp)
  
  // Format date as YYYY-MM-DD
  const formattedDate = date.toISOString().split('T')[0]
  
  // Format time as HH:mm:ss
  const hours = date.getUTCHours().toString().padStart(2, '0')
  const minutes = date.getUTCMinutes().toString().padStart(2, '0')
  const seconds = date.getUTCSeconds().toString().padStart(2, '0')
  const formattedTime = `${hours}:${minutes}:${seconds}`
  
  return {
    date: formattedDate,
    time: formattedTime
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}
