import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useBookStore } from '@/hooks/useBookStore';
import { EmptyState } from '@/components/EmptyState';
import { Book, Order, OrderItem, Customer } from '@/types';

interface OrderFormData {
  customer: Customer;
  items: Array<{
    book: Book;
    quantity: number;
    discount: number;
  }>;
  totalDiscount: number;
}

export default function OrderManagementScreen() {
  const { orders, books, addOrder, deleteOrder } = useBookStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = orders.filter(order =>
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerPhone?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredOrders(filtered);
    } else {
      setFilteredOrders(orders);
    }
  }, [searchQuery, orders]);

  const formatPrice = (price: number) => {
    return `৳${price.toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Status badge is not shown per request; keep formatter if needed later.

  const handleDeleteOrder = (order: Order) => {
    Alert.alert(
      'Delete Order',
      `Are you sure you want to delete order #${order.id}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const ok = await deleteOrder(order.id);
              if (!ok) Alert.alert('Not deleted', 'Order could not be deleted.');
            } catch (e) {
              Alert.alert('Error', 'Failed to delete order.');
            }
          },
        },
      ]
    );
  };

  const renderOrder = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => router.push(`/order/${item.id}`)}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>#{item.id}</Text>
          <Text style={styles.customerName}>{item.customerName}</Text>
          {item.customerPhone && (
            <Text style={styles.customerPhone}>{item.customerPhone}</Text>
          )}
        </View>
        <View style={styles.orderMeta}>
          <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
        </View>
      </View>

      <View style={styles.orderDetails}>
        <Text style={styles.itemCount}>
          {item.items.length} item{item.items.length !== 1 ? 's' : ''}
        </Text>
        <Text style={styles.orderTotal}>{formatPrice(item.finalAmount)}</Text>
      </View>

      <View style={styles.orderActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push(`/order/edit/${item.id}`)}
        >
          <Ionicons name="pencil" size={16} color={Colors.primary} />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteOrder(item)}
        >
          <Ionicons name="trash-outline" size={16} color={Colors.error} />
          <Text style={[styles.actionText, { color: Colors.error }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="receipt-outline" size={64} color={Colors.textLight} />
      </View>

      <Text style={styles.emptyTitle}>No orders yet</Text>
      <Text style={styles.emptySubtitle}>Create your first customer order to get started.</Text>

      <TouchableOpacity
        style={styles.createButton}
        onPress={() => setShowCreateModal(true)}
      >
        <Ionicons name="add" size={20} color={Colors.surface} />
        <Text style={styles.createButtonText}>Create Order</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search orders by customer..."
            placeholderTextColor={Colors.textLight}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={24} color={Colors.surface} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsHeader}>
        <Text style={styles.resultCount}>
          {searchQuery.trim()
            ? `${filteredOrders.length} order${filteredOrders.length !== 1 ? 's' : ''} found`
            : `${orders.length} total order${orders.length !== 1 ? 's' : ''}`
          }
        </Text>
      </View>

      <FlatList
        data={filteredOrders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={filteredOrders.length === 0 ? styles.emptyContainer : styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      <CreateOrderModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        books={books}
        onCreateOrder={async (order: any) => {
          const created = await addOrder(order);
          setShowCreateModal(false);
          router.push(`/order/${created.id}`);
        }}
      />
    </View>
  );
}

interface CreateOrderModalProps {
  visible: boolean;
  onClose: () => void;
  books: Book[];
  onCreateOrder: (order: any) => Promise<void>;
}

function CreateOrderModal({ visible, onClose, books, onCreateOrder }: CreateOrderModalProps) {
  const [customerData, setCustomerData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });
  const [selectedBooks, setSelectedBooks] = useState<Array<{ book: Book; quantity: number; discount: number }>>([]);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setCustomerData({ name: '', phone: '', email: '', address: '' });
    setSelectedBooks([]);
  };

  const addBookToOrder = (book: Book) => {
    const existing = selectedBooks.find(item => item.book.id === book.id);
    if (existing) {
      setSelectedBooks(prev => prev.map(item =>
        item.book.id === book.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setSelectedBooks(prev => [...prev, { book, quantity: 1, discount: 0 }]);
    }
  };

  const updateBookQuantity = (bookId: string, quantity: number) => {
    if (quantity <= 0) {
      setSelectedBooks(prev => prev.filter(item => item.book.id !== bookId));
    } else {
      setSelectedBooks(prev => prev.map(item =>
        item.book.id === bookId ? { ...item, quantity } : item
      ));
    }
  };

  const calculateTotal = () => {
    return selectedBooks.reduce((total, item) => {
      const itemTotal = (item.book.price * item.quantity) - item.discount;
      return total + Math.max(0, itemTotal);
    }, 0);
  };

  const handleCreateOrder = async () => {
    if (!customerData.name.trim()) {
      Alert.alert('Error', 'Customer name is required.');
      return;
    }

    if (selectedBooks.length === 0) {
      Alert.alert('Error', 'Please add at least one book to the order.');
      return;
    }

    setLoading(true);
    try {
      const orderItems: OrderItem[] = selectedBooks.map(item => ({
        id: '',
        orderId: '',
        bookId: item.book.id,
        bookName: item.book.name,
        quantity: item.quantity,
        unitPrice: item.book.price,
        discount: item.discount,
      }));

      const totalAmount = calculateTotal();

      await onCreateOrder({
        customer: {
          id: `customer_${Date.now()}`,
          name: customerData.name.trim(),
          phone: customerData.phone.trim() || undefined,
          email: customerData.email.trim() || undefined,
          address: customerData.address.trim() || undefined,
        },
        customerName: customerData.name.trim(),
        customerPhone: customerData.phone.trim() || undefined,
        customerEmail: customerData.email.trim() || undefined,
        customerAddress: customerData.address.trim() || undefined,
        items: orderItems,
        totalAmount,
        discountAmount: 0,
        finalAmount: totalAmount,
        status: 'pending',
      });

      Alert.alert('Success', 'Order created successfully!');
      resetForm();
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to create order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Create New Order</Text>
          <TouchableOpacity
            onPress={handleCreateOrder}
            disabled={loading}
            style={[styles.saveButton, loading && styles.disabledButton]}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Creating...' : 'Create'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Customer Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name *</Text>
              <TextInput
                style={styles.textInput}
                value={customerData.name}
                onChangeText={(text: string) => setCustomerData(prev => ({ ...prev, name: text }))}
                placeholder="Customer name"
                placeholderTextColor={Colors.textLight}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone</Text>
              <TextInput
                style={styles.textInput}
                value={customerData.phone}
                onChangeText={(text: string) => setCustomerData(prev => ({ ...prev, phone: text }))}
                placeholder="Phone number"
                placeholderTextColor={Colors.textLight}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.textInput}
                value={customerData.email}
                onChangeText={(text: string) => setCustomerData(prev => ({ ...prev, email: text }))}
                placeholder="Email address"
                placeholderTextColor={Colors.textLight}
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Address</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={customerData.address}
                onChangeText={(text: string) => setCustomerData(prev => ({ ...prev, address: text }))}
                placeholder="Customer address"
                placeholderTextColor={Colors.textLight}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Book Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add Books</Text>

            {books.slice(0, 10).map(book => (
              <TouchableOpacity
                key={book.id}
                style={styles.bookItem}
                onPress={() => addBookToOrder(book)}
              >
                <View style={styles.bookInfo}>
                  <Text style={styles.bookName}>{book.name}</Text>
                  <Text style={styles.bookPrice}>{`৳${book.price}`}</Text>
                </View>
                <Ionicons name="add-circle-outline" size={24} color={Colors.primary} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Selected Books */}
          {selectedBooks.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Selected Books</Text>

              {selectedBooks.map(item => (
                <View key={item.book.id} style={styles.selectedBookItem}>
                  <View style={styles.selectedBookInfo}>
                    <Text style={styles.selectedBookName}>{item.book.name}</Text>
                    <Text style={styles.selectedBookPrice}>
                      {`৳${item.book.price} × ${item.quantity} = ৳${(item.book.price * item.quantity).toFixed(2)}`}
                    </Text>
                  </View>

                  <View style={styles.quantityControls}>
                    <TouchableOpacity
                      onPress={() => updateBookQuantity(item.book.id, item.quantity - 1)}
                      style={styles.quantityButton}
                    >
                      <Ionicons name="remove" size={16} color={Colors.text} />
                    </TouchableOpacity>

                    <Text style={styles.quantityText}>{item.quantity}</Text>

                    <TouchableOpacity
                      onPress={() => updateBookQuantity(item.book.id, item.quantity + 1)}
                      style={styles.quantityButton}
                    >
                      <Ionicons name="add" size={16} color={Colors.text} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <View style={styles.totalSection}>
                <Text style={styles.totalText}>
                  Total: ৳{calculateTotal().toFixed(2)}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    fontSize: 16,
    color: Colors.text,
  },
  addButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 8,
  },
  statsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.surface,
  },
  resultCount: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
  },
  orderCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  customerName: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  customerPhone: {
    fontSize: 12,
    color: Colors.textLight,
  },
  orderMeta: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.surface,
  },
  orderDate: {
    fontSize: 12,
    color: Colors.textLight,
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemCount: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  orderActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.surface,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.surface,
  },
  disabledButton: {
    opacity: 0.6,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.surface,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  bookItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bookInfo: {
    flex: 1,
  },
  bookName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  bookPrice: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  selectedBookItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedBookInfo: {
    flex: 1,
  },
  selectedBookName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  selectedBookPrice: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    backgroundColor: Colors.surface,
    borderRadius: 6,
    padding: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    minWidth: 24,
    textAlign: 'center',
  },
  totalSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  totalText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
    textAlign: 'right',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIconContainer: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
});
