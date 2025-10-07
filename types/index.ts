export interface Book {
  id: string;
  name: string;
  price: number;
  author?: string;
  publisher?: string;
  coverUrl?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
  version: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  bookId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  bookId: string;
  bookName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  items: OrderItem[];
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: number;
  updatedAt: number;
}

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  dueDate: number;
  completed: boolean;
  bookId?: string;
  createdAt: number;
}

export interface SearchQuery {
  id: string;
  query: string;
  resultsCount: number;
  createdAt: number;
}