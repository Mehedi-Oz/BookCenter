// Android SQLite Database for BookCenter
/// <reference path="../types/expo-sqlite.d.ts" />
import * as SQLite from 'expo-sqlite';
import { Book, Note, Order, OrderItem, Customer, Reminder, SearchQuery } from '@/types';
import { SearchRanking, FuzzySearch, Transliteration, SuggestionEngine } from './advancedSearch';

class DatabaseManager {
  private db: any = null;

  async init() {
    if (this.db) return this.db;

    this.db = await SQLite.openDatabaseAsync('bookcenter.db');
    // Strengthen SQLite behavior before creating tables
    // - Enforce foreign keys for relational integrity
    // - Use WAL for better concurrency/stability
    // - Reasonable busy timeout to avoid transient lock errors
    await this.db.execAsync(`PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;`);
    await this.createTables();
    return this.db;
  }

  private async createTables() {
    if (!this.db) return;

    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS books (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        author TEXT,
        publisher TEXT,
        coverUrl TEXT,
        notes TEXT,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL,
        version INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        bookId TEXT,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL,
        FOREIGN KEY (bookId) REFERENCES books (id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        address TEXT
      );

      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        customerId TEXT NOT NULL,
        customerName TEXT NOT NULL,
        customerPhone TEXT,
        customerEmail TEXT,
        customerAddress TEXT,
        totalAmount REAL NOT NULL,
        discountAmount REAL DEFAULT 0,
        finalAmount REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY,
        orderId TEXT NOT NULL,
        bookId TEXT NOT NULL,
        bookName TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unitPrice REAL NOT NULL,
        discount REAL DEFAULT 0,
        FOREIGN KEY (orderId) REFERENCES orders (id) ON DELETE CASCADE,
        FOREIGN KEY (bookId) REFERENCES books (id)
      );

      CREATE TABLE IF NOT EXISTS reminders (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        dueDate INTEGER NOT NULL,
        completed INTEGER DEFAULT 0,
        bookId TEXT,
        createdAt INTEGER NOT NULL,
        FOREIGN KEY (bookId) REFERENCES books (id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS search_queries (
        id TEXT PRIMARY KEY,
        query TEXT NOT NULL,
        resultsCount INTEGER NOT NULL,
        createdAt INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_books_name ON books(name);
      CREATE INDEX IF NOT EXISTS idx_books_author ON books(author);
      CREATE INDEX IF NOT EXISTS idx_books_updated ON books(updatedAt);
      CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(createdAt);
      CREATE INDEX IF NOT EXISTS idx_reminders_due ON reminders(dueDate);
    `);
  }

  // Book operations
  async addBook(book: Omit<Book, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<Book> {
    const db = await this.init();
    const id = `book_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    const newBook: Book = {
      ...book,
      id,
      createdAt: now,
      updatedAt: now,
      version: 1,
    };

    await db.runAsync(
      'INSERT INTO books (id, name, price, author, publisher, coverUrl, notes, createdAt, updatedAt, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [newBook.id, newBook.name, newBook.price, newBook.author || null, newBook.publisher || null,
      newBook.coverUrl || null, newBook.notes || null, newBook.createdAt, newBook.updatedAt, newBook.version]
    );

    return newBook;
  }

  async updateBook(id: string, updates: Partial<Book>): Promise<void> {
    const db = await this.init();
    const now = Date.now();

    const setClause = Object.keys(updates)
      .filter(key => key !== 'id' && key !== 'createdAt')
      .map(key => `${key} = ?`)
      .join(', ');

    // Nothing to update
    if (!setClause) {
      return;
    }

    const values = Object.entries(updates)
      .filter(([key]) => key !== 'id' && key !== 'createdAt')
      .map(([, value]) => value);

    await db.runAsync(
      `UPDATE books SET ${setClause}, updatedAt = ?, version = version + 1 WHERE id = ?`,
      [...values, now, id]
    );
  }

  async deleteBook(id: string): Promise<void> {
    const db = await this.init();
    await db.runAsync('DELETE FROM books WHERE id = ?', [id]);
  }

  async getBook(id: string): Promise<Book | null> {
    const db = await this.init();
    const result = await db.getFirstAsync('SELECT * FROM books WHERE id = ?', [id]) as Book | null;
    return result || null;
  }

  async getAllBooks(): Promise<Book[]> {
    const db = await this.init();
    const result = await db.getAllAsync('SELECT * FROM books ORDER BY updatedAt DESC') as Book[];
    return result;
  }

  async searchBooks(query: string): Promise<Book[]> {
    const db = await this.init();

    // First try exact FTS5 search
    const searchTerm = `%${query.toLowerCase()}%`;

    const ftsResults = await db.getAllAsync(
      `SELECT * FROM books 
       WHERE LOWER(name) LIKE ? 
          OR LOWER(author) LIKE ? 
          OR LOWER(publisher) LIKE ?
       ORDER BY 
         CASE 
           WHEN LOWER(name) = LOWER(?) THEN 1
           WHEN LOWER(name) LIKE ? THEN 2
           WHEN LOWER(author) LIKE ? THEN 3
           ELSE 4
         END,
         updatedAt DESC`,
      [searchTerm, searchTerm, searchTerm, query.toLowerCase(), `${query.toLowerCase()}%`, searchTerm]
    ) as Book[];

    // If FTS5 gives good results, return them
    if (ftsResults.length >= 3) {
      SuggestionEngine.addQuery(query);
      return ftsResults;
    }

    // Otherwise, fall back to fuzzy search on all books
    const allBooks = await this.getAllBooks();

    // Use advanced search ranking
    const rankedResults = SearchRanking.rankResults(query, allBooks, 0.3);

    // Also try transliteration variations
    const variations = Transliteration.getAllVariations(query);
    for (const variation of variations) {
      if (variation !== query) {
        const variantResults = SearchRanking.rankResults(variation, allBooks, 0.3);
        // Add unique results
        variantResults.forEach(book => {
          if (!rankedResults.find(existing => existing.id === book.id)) {
            rankedResults.push(book);
          }
        });
      }
    }

    SuggestionEngine.addQuery(query);
    return rankedResults.slice(0, 50); // Limit to top 50 results
  }

  // Order operations
  async addOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    const db = await this.init();
    await db.runAsync('BEGIN TRANSACTION');

    try {
      // Compute next sequential numeric ID within the same transaction.
      // Ignore any existing non-numeric IDs (from older versions) when calculating MAX.
      const row = (await db.getFirstAsync(
        "SELECT COALESCE(MAX(CASE WHEN id GLOB '[0-9]*' THEN CAST(id AS INTEGER) ELSE 0 END), 0) AS maxId FROM orders"
      )) as { maxId?: number } | null;
      const nextId = ((row?.maxId ?? 0) + 1).toString();
      const now = Date.now();

      const newOrder: Order = {
        ...order,
        id: nextId,
        createdAt: now,
        updatedAt: now,
      };

      await db.runAsync(
        `INSERT INTO orders (id, customerId, customerName, customerPhone, customerEmail, customerAddress, 
         totalAmount, discountAmount, finalAmount, status, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [newOrder.id, newOrder.customerId, newOrder.customerName, newOrder.customerPhone || null,
        newOrder.customerEmail || null, newOrder.customerAddress || null, newOrder.totalAmount,
        newOrder.discountAmount, newOrder.finalAmount, newOrder.status, newOrder.createdAt, newOrder.updatedAt]
      );

      for (const item of newOrder.items) {
        const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await db.runAsync(
          'INSERT INTO order_items (id, orderId, bookId, bookName, quantity, unitPrice, discount) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [itemId, newOrder.id, item.bookId, item.bookName, item.quantity, item.unitPrice, item.discount]
        );
      }

      await db.runAsync('COMMIT');
      return newOrder;
    } catch (error) {
      await db.runAsync('ROLLBACK');
      throw error;
    }
  }

  async getAllOrders(): Promise<Order[]> {
    const db = await this.init();
    const orders = await db.getAllAsync(
      'SELECT * FROM orders ORDER BY createdAt DESC'
    ) as any[];

    const result: Order[] = [];
    for (const order of orders) {
      const items = await db.getAllAsync(
        'SELECT * FROM order_items WHERE orderId = ?',
        [order.id]
      ) as OrderItem[];

      result.push({
        id: order.id,
        customerId: order.customerId,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerEmail: order.customerEmail,
        customerAddress: order.customerAddress,
        items,
        totalAmount: order.totalAmount,
        discountAmount: order.discountAmount,
        finalAmount: order.finalAmount,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      });
    }

    return result;
  }

  async getOrderById(id: string): Promise<Order | null> {
    const db = await this.init();
    const order = await db.getFirstAsync('SELECT * FROM orders WHERE id = ?', [id]) as any | null;
    if (!order) return null;
    const items = await db.getAllAsync('SELECT * FROM order_items WHERE orderId = ?', [id]) as OrderItem[];
    return {
      id: order.id,
      customerId: order.customerId,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail,
      customerAddress: order.customerAddress,
      items,
      totalAmount: order.totalAmount,
      discountAmount: order.discountAmount,
      finalAmount: order.finalAmount,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  async updateOrder(updated: Order): Promise<Order> {
    const db = await this.init();
    await db.runAsync('BEGIN');
    try {
      const now = Date.now();
      await db.runAsync(
        'UPDATE orders SET customerId = ?, customerName = ?, customerPhone = ?, customerEmail = ?, customerAddress = ?, totalAmount = ?, discountAmount = ?, finalAmount = ?, status = ?, updatedAt = ? WHERE id = ?',
        [
          updated.customerId,
          updated.customerName,
          updated.customerPhone || null,
          updated.customerEmail || null,
          updated.customerAddress || null,
          updated.totalAmount,
          updated.discountAmount,
          updated.finalAmount,
          updated.status,
          now,
          updated.id,
        ]
      );

      // replace items
      await db.runAsync('DELETE FROM order_items WHERE orderId = ?', [updated.id]);
      for (const item of updated.items) {
        const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await db.runAsync(
          'INSERT INTO order_items (id, orderId, bookId, bookName, quantity, unitPrice, discount) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [itemId, updated.id, item.bookId, item.bookName, item.quantity, item.unitPrice, item.discount]
        );
      }

      await db.runAsync('COMMIT');
      const fresh = await this.getOrderById(updated.id);
      if (!fresh) throw new Error('Failed to reload updated order');
      return fresh;
    } catch (e) {
      await db.runAsync('ROLLBACK');
      throw e;
    }
  }

  async deleteOrder(id: string): Promise<boolean> {
    const db = await this.init();
    const result = await db.runAsync('DELETE FROM orders WHERE id = ?', [id]);
    // order_items rows will be deleted via ON DELETE CASCADE
    return result.changes > 0;
  }

  async updateOrderStatus(id: string, status: 'pending' | 'completed' | 'cancelled'): Promise<void> {
    const db = await this.init();
    const now = Date.now();
    await db.runAsync('UPDATE orders SET status = ?, updatedAt = ? WHERE id = ?', [status, now, id]);
  }

  // Note operations
  async addNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> {
    const db = await this.init();
    const id = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    const newNote: Note = {
      ...note,
      id,
      createdAt: now,
      updatedAt: now,
    };

    await db.runAsync(
      'INSERT INTO notes (id, title, content, bookId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
      [newNote.id, newNote.title, newNote.content, newNote.bookId || null, newNote.createdAt, newNote.updatedAt]
    );

    return newNote;
  }

  async updateNote(id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>): Promise<Note | null> {
    const db = await this.init();
    const now = Date.now();

    // First, get the current note
    const currentNote = await db.getFirstAsync('SELECT * FROM notes WHERE id = ?', [id]) as Note | null;
    if (!currentNote) return null;

    // Merge updates
    const updatedNote: Note = {
      ...currentNote,
      ...updates,
      updatedAt: now,
    };

    await db.runAsync(
      'UPDATE notes SET title = ?, content = ?, bookId = ?, updatedAt = ? WHERE id = ?',
      [updatedNote.title, updatedNote.content, updatedNote.bookId || null, updatedNote.updatedAt, id]
    );

    return updatedNote;
  }

  async deleteNote(id: string): Promise<boolean> {
    const db = await this.init();
    const result = await db.runAsync('DELETE FROM notes WHERE id = ?', [id]);
    return result.changes > 0;
  }

  async getAllNotes(): Promise<Note[]> {
    const db = await this.init();
    const result = await db.getAllAsync('SELECT * FROM notes ORDER BY updatedAt DESC') as Note[];
    return result;
  }

  // Reminder operations
  async addReminder(reminder: Omit<Reminder, 'id' | 'createdAt'>): Promise<Reminder> {
    const db = await this.init();
    const id = `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    const newReminder: Reminder = {
      ...reminder,
      id,
      createdAt: now,
    };

    await db.runAsync(
      'INSERT INTO reminders (id, title, description, dueDate, completed, bookId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [newReminder.id, newReminder.title, newReminder.description || null, newReminder.dueDate,
      newReminder.completed ? 1 : 0, newReminder.bookId || null, newReminder.createdAt]
    );

    return newReminder;
  }

  async getAllReminders(): Promise<Reminder[]> {
    const db = await this.init();
    const result = await db.getAllAsync('SELECT * FROM reminders ORDER BY dueDate ASC') as any[];
    return result.map((r: any) => ({ ...r, completed: Boolean(r.completed) }));
  }

  async updateReminder(id: string, updates: Partial<Omit<Reminder, 'id' | 'createdAt'>>): Promise<Reminder | null> {
    const db = await this.init();

    // First, get the current reminder
    const currentReminder = await db.getFirstAsync('SELECT * FROM reminders WHERE id = ?', [id]) as any | null;
    if (!currentReminder) return null;

    // Merge updates
    const updatedReminder: Reminder = {
      ...currentReminder,
      ...updates,
      completed: Boolean(currentReminder.completed),
    };

    await db.runAsync(
      'UPDATE reminders SET title = ?, description = ?, dueDate = ?, completed = ?, bookId = ? WHERE id = ?',
      [updatedReminder.title, updatedReminder.description || null, updatedReminder.dueDate,
      updatedReminder.completed ? 1 : 0, updatedReminder.bookId || null, id]
    );

    return updatedReminder;
  }

  async deleteReminder(id: string): Promise<boolean> {
    const db = await this.init();
    const result = await db.runAsync('DELETE FROM reminders WHERE id = ?', [id]);
    return result.changes > 0;
  }

  // Analytics
  async recordSearch(query: string, resultsCount: number): Promise<void> {
    const db = await this.init();
    const id = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await db.runAsync(
      'INSERT INTO search_queries (id, query, resultsCount, createdAt) VALUES (?, ?, ?, ?)',
      [id, query, resultsCount, Date.now()]
    );
  }

  async getStats(): Promise<{
    totalBooks: number;
    totalOrders: number;
    totalNotes: number;
    pendingReminders: number;
  }> {
    const db = await this.init();

    const [books, orders, notes, reminders] = await Promise.all([
      db.getFirstAsync('SELECT COUNT(*) as count FROM books') as Promise<{ count: number } | null>,
      db.getFirstAsync('SELECT COUNT(*) as count FROM orders') as Promise<{ count: number } | null>,
      db.getFirstAsync('SELECT COUNT(*) as count FROM notes') as Promise<{ count: number } | null>,
      db.getFirstAsync('SELECT COUNT(*) as count FROM reminders WHERE completed = 0') as Promise<{ count: number } | null>,
    ]);

    return {
      totalBooks: books?.count || 0,
      totalOrders: orders?.count || 0,
      totalNotes: notes?.count || 0,
      pendingReminders: reminders?.count || 0,
    };
  }

  // Clear all data from database
  async clearAllData(): Promise<void> {
    const db = await this.init();
    // Use a transaction and delete in FK-safe order.
    // orders -> cascades to order_items; then clear other tables; finally books.
    await db.runAsync('BEGIN');
    try {
      await db.runAsync('DELETE FROM orders');
      await db.runAsync('DELETE FROM notes');
      await db.runAsync('DELETE FROM reminders');
      await db.runAsync('DELETE FROM search_queries');
      await db.runAsync('DELETE FROM customers');
      await db.runAsync('DELETE FROM books');
      await db.runAsync('COMMIT');
    } catch (e) {
      await db.runAsync('ROLLBACK');
      throw e;
    }
  }
}

export const db = new DatabaseManager();