import { validateFileType, validateFileSize, sanitizeFileName } from '@/lib/utils/validation'

describe('Document Validation', () => {
  describe('validateFileType', () => {
    test('should accept valid PDF file', () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
      expect(validateFileType(file)).toBe(true)
    })

    test('should accept valid DOC file', () => {
      const file = new File(['content'], 'test.doc', { type: 'application/msword' })
      expect(validateFileType(file)).toBe(true)
    })

    test('should accept valid DOCX file', () => {
      const file = new File(['content'], 'test.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      })
      expect(validateFileType(file)).toBe(true)
    })

    test('should accept valid image files', () => {
      const jpgFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' })
      const pngFile = new File(['content'], 'test.png', { type: 'image/png' })
      expect(validateFileType(jpgFile)).toBe(true)
      expect(validateFileType(pngFile)).toBe(true)
    })

    test('should reject invalid file types', () => {
      const exeFile = new File(['content'], 'test.exe', { type: 'application/x-msdownload' })
      const batFile = new File(['content'], 'test.bat', { type: 'application/x-msdownload' })
      expect(validateFileType(exeFile)).toBe(false)
      expect(validateFileType(batFile)).toBe(false)
    })
  })

  describe('validateFileSize', () => {
    test('should accept files under 10MB', () => {
      const file = new File([new ArrayBuffer(5 * 1024 * 1024)], 'test.pdf', {
        type: 'application/pdf',
      })
      expect(validateFileSize(file)).toBe(true)
    })

    test('should reject files over 10MB', () => {
      const file = new File([new ArrayBuffer(11 * 1024 * 1024)], 'large.pdf', {
        type: 'application/pdf',
      })
      expect(validateFileSize(file)).toBe(false)
    })

    test('should accept files exactly at 10MB', () => {
      const file = new File([new ArrayBuffer(10 * 1024 * 1024)], 'test.pdf', {
        type: 'application/pdf',
      })
      expect(validateFileSize(file, 10 * 1024 * 1024)).toBe(true)
    })
  })

  describe('sanitizeFileName', () => {
    test('should remove special characters', () => {
      expect(sanitizeFileName('test file@#$.pdf')).toBe('test_file____.pdf')
    })

    test('should preserve alphanumeric, dots, hyphens, and underscores', () => {
      expect(sanitizeFileName('test-file_123.pdf')).toBe('test-file_123.pdf')
    })

    test('should handle empty string', () => {
      expect(sanitizeFileName('')).toBe('')
    })

    test('should handle file names with spaces', () => {
      expect(sanitizeFileName('my document file.pdf')).toBe('my_document_file.pdf')
    })
  })
})

