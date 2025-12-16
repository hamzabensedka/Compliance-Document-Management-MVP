import { z } from 'zod'

export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
] as const

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export function validateFileType(file: File): boolean {
  return ALLOWED_FILE_TYPES.includes(file.type as typeof ALLOWED_FILE_TYPES[number])
}

export function validateFileSize(file: File, maxSize: number = MAX_FILE_SIZE): boolean {
  return file.size <= maxSize
}

export function sanitizeFileName(fileName: string): string {
  // Remove special characters, keep alphanumeric, dots, hyphens, underscores
  return fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
}

export const uploadDocumentSchema = z.object({
  siteId: z.string().uuid(),
  categoryId: z.string().uuid().optional(),
  expiryDate: z.string().date().optional(),
  notes: z.string().optional(),
})

export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>

