import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import { Book, Note, Order, Reminder } from '@/types';
import { db } from '@/utils/database';
import { CSVManager } from '@/utils/csvManager';

// Android-only app using SQLite database
const database = db;

export const [BookStoreProvider, useBookStore] = createContextHook(() => {
  const [books, setBooks] = useState<Book[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalOrders: 0,
    totalNotes: 0,
    pendingReminders: 0,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('BookStore: Starting database initialization...');
      await database.init();
      console.log('BookStore: Database initialized successfully');

      // Android platform - full data loading with SQLite
      const [booksData, ordersData, notesData, remindersData, statsData] = await Promise.all([
        database.getAllBooks(),
        database.getAllOrders(),
        database.getAllNotes(),
        database.getAllReminders(),
        database.getStats(),
      ]);

      setBooks(booksData);
      setOrders(ordersData);
      setNotes(notesData);
      setReminders(remindersData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      setError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const addBook = async (bookData: Omit<Book, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => {
    try {
      console.log('useBookStore.addBook called with:', bookData);
      console.log('Database instance:', database);

      const newBook = await database.addBook(bookData);
      console.log('Database returned new book:', newBook);

      setBooks(prev => [newBook, ...prev]);
      setStats(prev => ({ ...prev, totalBooks: prev.totalBooks + 1 }));

      console.log('Book added to state successfully');
      return newBook;
    } catch (error) {
      console.error('Failed to add book in useBookStore:', error);
      throw error;
    }
  };

  const updateBook = async (id: string, updates: Partial<Book>) => {
    try {
      await database.updateBook(id, updates);
      setBooks(prev => prev.map(book =>
        book.id === id ? { ...book, ...updates, updatedAt: Date.now() } : book
      ));
    } catch (error) {
      console.error('Failed to update book:', error);
      throw error;
    }
  };

  const deleteBook = async (id: string) => {
    try {
      await database.deleteBook(id);
      setBooks(prev => prev.filter(book => book.id !== id));
      setStats(prev => ({ ...prev, totalBooks: prev.totalBooks - 1 }));
    } catch (error) {
      console.error('Failed to delete book:', error);
      throw error;
    }
  };

  const searchBooks = async (query: string): Promise<Book[]> => {
    try {
      // Android SQLite search with analytics
      const results = await database.searchBooks(query);
      await database.recordSearch(query, results.length);
      return results;
    } catch (error) {
      console.error('Failed to search books:', error);
      return [];
    }
  };

  const importBooksFromCSV = async (
    csvContent: string,
    onProgress?: (progress: number, message: string) => void
  ): Promise<{
    total: number;
    added: number;
    updated: number;
    skipped: number;
    errors: string[];
  }> => {
    try {
      onProgress?.(0, 'Validating CSV...');

      // Validate CSV structure
      const validation = CSVManager.validateCSV(csvContent);
      if (!validation.valid) {
        throw new Error(`Invalid CSV: ${validation.errors.join(', ')}`);
      }

      onProgress?.(10, 'Parsing CSV data...');

      // Parse CSV to book objects
      const csvBooks = CSVManager.parseCSV(csvContent);
      const results = {
        total: csvBooks.length,
        added: 0,
        updated: 0,
        skipped: 0,
        errors: [] as string[]
      };

      onProgress?.(20, 'Processing books...');

      // Get all existing books for comparison
      const existingBooks = await database.getAllBooks();
      const existingBooksMap = new Map(
        existingBooks.map(book => [book.name.toLowerCase().trim(), book])
      );

      for (let i = 0; i < csvBooks.length; i++) {
        const csvBook = csvBooks[i];
        const progress = 20 + ((i / csvBooks.length) * 70);

        try {
          onProgress?.(progress, `Processing book ${i + 1}/${csvBooks.length}: ${csvBook.name}`);

          if (!csvBook.name || !csvBook.price) {
            results.errors.push(`Row ${i + 2}: Missing required fields (name or price)`);
            continue;
          }

          const bookKey = csvBook.name.toLowerCase().trim();
          const existingBook = existingBooksMap.get(bookKey);

          if (existingBook) {
            // Book exists - check price
            if (existingBook.price === csvBook.price) {
              // Same price - skip
              results.skipped++;
              onProgress?.(progress, `Skipped: ${csvBook.name} (same price)`);
            } else {
              // Different price - update
              await updateBook(existingBook.id, {
                price: csvBook.price!,
                author: csvBook.author || existingBook.author,
                publisher: csvBook.publisher || existingBook.publisher,
                notes: csvBook.notes || existingBook.notes
              });
              results.updated++;
              onProgress?.(progress, `Updated: ${csvBook.name} (price: ${existingBook.price} → ${csvBook.price})`);
            }
          } else {
            // New book - add it
            await addBook({
              name: csvBook.name,
              price: csvBook.price!,
              author: csvBook.author,
              publisher: csvBook.publisher,
              notes: csvBook.notes
            });
            results.added++;
            onProgress?.(progress, `Added: ${csvBook.name}`);
          }
        } catch (error) {
          const errorMsg = `Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          results.errors.push(errorMsg);
          console.error(`CSV import error for book ${i + 1}:`, error);
        }
      }

      onProgress?.(100, 'Import completed!');

      // Refresh data to reflect changes
      await loadData();

      return results;
    } catch (error) {
      console.error('CSV import failed:', error);
      throw error;
    }
  };

  const addOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newOrder = await database.addOrder(orderData);
      setOrders(prev => [newOrder, ...prev]);
      setStats(prev => ({ ...prev, totalOrders: prev.totalOrders + 1 }));
      return newOrder;
    } catch (error) {
      console.error('Failed to add order:', error);
      throw error;
    }
  };

  const deleteOrder = async (id: string) => {
    try {
      const success = await database.deleteOrder(id);
      if (success) {
        setOrders(prev => prev.filter(o => o.id !== id));
        setStats(prev => ({ ...prev, totalOrders: Math.max(0, prev.totalOrders - 1) }));
      }
      return success;
    } catch (error) {
      console.error('Failed to delete order:', error);
      throw error;
    }
  };

  const updateOrderStatus = async (id: string, status: Order['status']) => {
    try {
      await database.updateOrderStatus(id, status as any);
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status, updatedAt: Date.now() } : o));
    } catch (error) {
      console.error('Failed to update order status:', error);
      throw error;
    }
  };

  const getOrderById = async (id: string) => {
    try {
      return await database.getOrderById(id);
    } catch (error) {
      console.error('Failed to get order:', error);
      return null;
    }
  };

  const updateOrder = async (order: Order) => {
    try {
      const updated = await database.updateOrder(order);
      setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
      return updated;
    } catch (error) {
      console.error('Failed to update order:', error);
      throw error;
    }
  };

  const addNote = async (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newNote = await database.addNote(noteData);
      setNotes(prev => [newNote, ...prev]);
      setStats(prev => ({ ...prev, totalNotes: prev.totalNotes + 1 }));
      return newNote;
    } catch (error) {
      console.error('Failed to add note:', error);
      throw error;
    }
  };

  const updateNote = async (id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>) => {
    try {
      const updatedNote = await database.updateNote(id, updates);
      if (updatedNote) {
        setNotes(prev => prev.map(note => note.id === id ? updatedNote : note));
        return updatedNote;
      }
      return null;
    } catch (error) {
      console.error('Failed to update note:', error);
      throw error;
    }
  };

  const deleteNote = async (id: string) => {
    try {
      const success = await database.deleteNote(id);
      if (success) {
        setNotes(prev => prev.filter(note => note.id !== id));
        setStats(prev => ({ ...prev, totalNotes: prev.totalNotes - 1 }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to delete note:', error);
      throw error;
    }
  };

  const addReminder = async (reminderData: Omit<Reminder, 'id' | 'createdAt'>) => {
    try {
      const newReminder = await database.addReminder(reminderData);
      setReminders(prev => [newReminder, ...prev.filter(r => r.id !== newReminder.id)].sort((a, b) => a.dueDate - b.dueDate));
      if (!newReminder.completed) {
        setStats(prev => ({ ...prev, pendingReminders: prev.pendingReminders + 1 }));
      }
      return newReminder;
    } catch (error) {
      console.error('Failed to add reminder:', error);
      throw error;
    }
  };

  const updateReminder = async (id: string, updates: Partial<Omit<Reminder, 'id' | 'createdAt'>>) => {
    try {
      const updatedReminder = await database.updateReminder(id, updates);
      if (updatedReminder) {
        setReminders(prev => prev.map(reminder =>
          reminder.id === id ? updatedReminder : reminder
        ).sort((a, b) => a.dueDate - b.dueDate));
        return updatedReminder;
      }
      return null;
    } catch (error) {
      console.error('Failed to update reminder:', error);
      throw error;
    }
  };

  const deleteReminder = async (id: string) => {
    try {
      const success = await database.deleteReminder(id);
      if (success) {
        setReminders(prev => prev.filter(reminder => reminder.id !== id));
        setStats(prev => ({ ...prev, pendingReminders: prev.pendingReminders - 1 }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to delete reminder:', error);
      throw error;
    }
  };

  const clearAllData = async () => {
    try {
      // Clear SQLite database for Android
      await database.clearAllData();

      // Reset all state
      setBooks([]);
      setOrders([]);
      setNotes([]);
      setReminders([]);
      setStats({
        totalBooks: 0,
        totalOrders: 0,
        totalNotes: 0,
        pendingReminders: 0,
      });

      // Reload to ensure clean state
      await loadData();
    } catch (error) {
      console.error('Failed to clear all data:', error);
      throw error;
    }
  };

  const refreshData = async () => {
    await loadData();
  };

  return {
    books,
    orders,
    notes,
    reminders,
    stats,
    loading,
    error,
    addBook,
    updateBook,
    deleteBook,
    searchBooks,
    importBooksFromCSV,
    addOrder,
    deleteOrder,
    updateOrderStatus,
    getOrderById,
    updateOrder,
    addNote,
    updateNote,
    deleteNote,
    addReminder,
    updateReminder,
    deleteReminder,
    clearAllData,
    refreshData,
  };
});