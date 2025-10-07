import { Book } from '@/types';

/**
 * CSV Import/Export utilities for BookCenter
 */
export class CSVManager {

  /**
   * Convert books array to CSV string
   */
  static exportToCSV(books: Book[]): string {
    const headers = ['Name', 'Price', 'Author', 'Publisher', 'Notes', 'Created Date', 'Updated Date'];

    const csvContent = [
      headers.join(','),
      ...books.map(book => [
        this.escapeCSVValue(book.name),
        book.price.toString(),
        this.escapeCSVValue(book.author || ''),
        this.escapeCSVValue(book.publisher || ''),
        this.escapeCSVValue(book.notes || ''),
        new Date(book.createdAt).toLocaleDateString(),
        new Date(book.updatedAt).toLocaleDateString()
      ].join(','))
    ].join('\n');

    return csvContent;
  }

  /**
   * Parse CSV string to books array
   */
  static parseCSV(csvContent: string): Partial<Book>[] {
    const lines = csvContent.trim().split('\n');

    if (lines.length < 2) {
      throw new Error('CSV file must contain at least a header and one data row');
    }

    const headers = this.parseCSVLine(lines[0]);
    const books: Partial<Book>[] = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = this.parseCSVLine(lines[i]);
        const book = this.mapCSVRowToBook(headers, values, i + 1);
        if (book) {
          books.push(book);
        }
      } catch (error) {
        console.warn(`Error parsing CSV row ${i + 1}:`, error);
        // Continue with other rows
      }
    }

    return books;
  }

  /**
   * Validate and map CSV row to book object
   */
  private static mapCSVRowToBook(headers: string[], values: string[], rowNumber: number): Partial<Book> | null {
    const book: Partial<Book> = {};

    // Map values based on header names (case-insensitive)
    headers.forEach((header, index) => {
      const normalizedHeader = header.toLowerCase().trim();
      const value = values[index]?.trim() || '';

      switch (normalizedHeader) {
        case 'name':
        case 'book name':
        case 'title':
          book.name = value;
          break;
        case 'price':
        case 'cost':
        case 'amount':
          const price = parseFloat(value);
          if (!isNaN(price) && price > 0) {
            book.price = price;
          }
          break;
        case 'author':
        case 'writer':
        case 'লেখক':
          book.author = value || undefined;
          break;
        case 'publisher':
        case 'publication':
        case 'প্রকাশক':
        case 'প্রকাশনী':
          book.publisher = value || undefined;
          break;
        case 'notes':
        case 'note':
        case 'description':
        case 'details':
          book.notes = value || undefined;
          break;
      }
    });

    // Validate required fields
    if (!book.name) {
      throw new Error(`Row ${rowNumber}: Book name is required`);
    }

    if (!book.price || book.price <= 0) {
      throw new Error(`Row ${rowNumber}: Valid price is required`);
    }

    return book;
  }

  /**
   * Parse a single CSV line handling quoted values
   */
  private static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i += 2;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator
        result.push(current);
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }

    // Add last field
    result.push(current);

    return result;
  }

  /**
   * Escape CSV value (add quotes if necessary)
   */
  private static escapeCSVValue(value: string): string {
    if (!value) return '';

    // Check if value needs escaping
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      // Escape quotes by doubling them
      const escapedValue = value.replace(/"/g, '""');
      return `"${escapedValue}"`;
    }

    return value;
  }

  /**
   * Generate filename with timestamp
   */
  static generateFilename(prefix = 'bookcenter_export'): string {
    const now = new Date();
    const timestamp = now.toISOString().slice(0, 19).replace(/[:\-]/g, '').replace('T', '_');
    return `${prefix}_${timestamp}.csv`;
  }

  /**
   * Detect CSV encoding (basic detection)
   */
  static detectEncoding(content: string): 'utf-8' | 'utf-16' {
    // Simple heuristic: if content contains Bangla characters, likely UTF-8
    const banglaPattern = /[\u0980-\u09FF]/;
    return banglaPattern.test(content) ? 'utf-8' : 'utf-8';
  }

  /**
   * Validate CSV structure
   */
  static validateCSV(csvContent: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      const lines = csvContent.trim().split('\n');

      if (lines.length < 2) {
        errors.push('CSV must contain at least a header row and one data row');
      }

      const headers = this.parseCSVLine(lines[0]);

      // Check for required headers
      const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
      const hasName = normalizedHeaders.some(h =>
        ['name', 'book name', 'title'].includes(h)
      );
      const hasPrice = normalizedHeaders.some(h =>
        ['price', 'cost', 'amount'].includes(h)
      );

      if (!hasName) {
        errors.push('CSV must contain a name/title column');
      }

      if (!hasPrice) {
        errors.push('CSV must contain a price/cost column');
      }

      // Validate a few sample rows
      const sampleSize = Math.min(5, lines.length - 1);
      for (let i = 1; i <= sampleSize; i++) {
        try {
          const values = this.parseCSVLine(lines[i]);
          if (values.length !== headers.length) {
            errors.push(`Row ${i + 1}: Column count mismatch`);
          }
        } catch (error) {
          errors.push(`Row ${i + 1}: Parse error`);
        }
      }

    } catch (error) {
      errors.push('Invalid CSV format');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * File download utility for web
 */
export class FileDownloader {
  /**
   * Download data as CSV file
   */
  static downloadCSV(data: string, filename: string) {
    if (typeof window === 'undefined') {
      throw new Error('File download is only available in web environment');
    }

    const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }
}

/**
 * Progress tracking for import/export operations
 */
export class ProgressTracker {
  private callback: (progress: number, message: string) => void;

  constructor(callback: (progress: number, message: string) => void) {
    this.callback = callback;
  }

  update(progress: number, message: string) {
    this.callback(Math.min(100, Math.max(0, progress)), message);
  }

  complete(message = 'Operation completed') {
    this.callback(100, message);
  }

  error(message: string) {
    this.callback(-1, message);
  }
}
