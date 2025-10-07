import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/hooks/useTheme';
import { useBookStore } from '@/hooks/useBookStore';
import { RefreshControl } from 'react-native';
import { SearchBar } from '@/components';
import { Book } from '@/types';

interface OrderItem {
  id: string;
  book: Book;
  quantity: number;
  discount: number;
  total: number;
}

export default function BuildOrderScreen() {
  const { colors } = useTheme();
  const { books, addOrder, refreshData } = useBookStore();
  const params = useLocalSearchParams();

  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [showBookSearch, setShowBookSearch] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [discountInput, setDiscountInput] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Customer details from previous screen
  const customerName = params.customerName as string;
  const customerPhone = params.customerPhone as string;
  const customerAddress = params.customerAddress as string;

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = books.filter(book =>
        book.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredBooks(filtered);
    } else {
      setFilteredBooks(books);
    }
  }, [searchQuery, books]);

  const calculateItemTotal = (price: number, quantity: number, discount: number) => {
    const subtotal = price * quantity;
    const discountAmount = (subtotal * discount) / 100;
    return subtotal - discountAmount;
  };

  const addBookToOrder = (book: Book) => {
    const existingIndex = orderItems.findIndex(item => item.book.id === book.id);

    if (existingIndex !== -1) {
      // Increase quantity of existing item
      const updatedItems = [...orderItems];
      updatedItems[existingIndex].quantity += 1;
      updatedItems[existingIndex].total = calculateItemTotal(
        book.price,
        updatedItems[existingIndex].quantity,
        updatedItems[existingIndex].discount
      );
      setOrderItems(updatedItems);
    } else {
      // Add new item
      const newItem: OrderItem = {
        id: `${book.id}_${Date.now()}`,
        book,
        quantity: 1,
        discount: 0,
        total: book.price
      };
      setOrderItems([...orderItems, newItem]);
    }
    setShowBookSearch(false);
    setSearchQuery('');
  };

  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(index);
      return;
    }

    const updatedItems = [...orderItems];
    updatedItems[index].quantity = newQuantity;
    updatedItems[index].total = calculateItemTotal(
      updatedItems[index].book.price,
      newQuantity,
      updatedItems[index].discount
    );
    setOrderItems(updatedItems);
  };

  const updateDiscount = (index: number, discount: number) => {
    const updatedItems = [...orderItems];
    updatedItems[index].discount = discount;
    updatedItems[index].total = calculateItemTotal(
      updatedItems[index].book.price,
      updatedItems[index].quantity,
      discount
    );
    setOrderItems(updatedItems);
  };

  const removeItem = (index: number) => {
    const updatedItems = orderItems.filter((_, i) => i !== index);
    setOrderItems(updatedItems);
  };

  const handleDiscountUpdate = () => {
    if (selectedItemIndex !== null) {
      const discount = parseFloat(discountInput) || 0;
      if (discount >= 0 && discount <= 100) {
        updateDiscount(selectedItemIndex, discount);
        setShowDiscountModal(false);
        setDiscountInput('');
        setSelectedItemIndex(null);
      } else {
        Alert.alert('Invalid Discount', 'Discount must be between 0 and 100%');
      }
    }
  };

  const getTotalAmount = () => {
    return orderItems.reduce((sum, item) => sum + item.total, 0);
  };

  const saveOrder = async () => {
    if (orderItems.length === 0) {
      Alert.alert('Empty Order', 'Please add at least one book to the order.');
      return;
    }

    try {
      const order = {
        customerId: `customer_${Date.now()}`, // Generate a customer ID
        customerName,
        customerPhone: customerPhone || undefined,
        customerAddress: customerAddress || undefined,
        items: orderItems.map(item => ({
          id: `item_${Date.now()}_${Math.random()}`,
          orderId: '', // Will be set by the database
          bookId: item.book.id,
          bookName: item.book.name,
          quantity: item.quantity,
          unitPrice: item.book.price,
          discount: item.discount
        })),
        totalAmount: getTotalAmount(),
        discountAmount: 0, // Calculate total discount if needed
        finalAmount: getTotalAmount(),
        status: 'pending' as const
      };

      const created = await addOrder(order);
      // Navigate directly to the created order's details page
      router.replace(`/order/${created.id}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to create order. Please try again.');
    }
  };

  const renderOrderItem = ({ item, index }: { item: OrderItem; index: number }) => (
    <View style={[styles.orderItemCard, { backgroundColor: colors.surface }]}>
      <View style={styles.itemHeader}>
        <Text style={[styles.serialNumber, { color: colors.textSecondary }]}>
          {String(index + 1).padStart(2, '0')}
        </Text>
        <TouchableOpacity onPress={() => removeItem(index)}>
          <Feather name="x" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.bookName, { color: colors.text }]} numberOfLines={2}>
        {item.book.name}
      </Text>

      <View style={styles.itemControls}>
        <View style={styles.quantityControl}>
          <TouchableOpacity
            style={[styles.quantityButton, { backgroundColor: colors.border }]}
            onPress={() => updateQuantity(index, item.quantity - 1)}
          >
            <Feather name="minus" size={16} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.quantityText, { color: colors.text }]}>{item.quantity}</Text>
          <TouchableOpacity
            style={[styles.quantityButton, { backgroundColor: colors.primary }]}
            onPress={() => updateQuantity(index, item.quantity + 1)}
          >
            <Feather name="plus" size={16} color={Colors.surface} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.discountButton, { backgroundColor: colors.accent + '15' }]}
          onPress={() => {
            setSelectedItemIndex(index);
            setDiscountInput(item.discount.toString());
            setShowDiscountModal(true);
          }}
        >
          <Text style={[styles.discountText, { color: colors.accent }]}>
            {item.discount}% OFF
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.priceBreakdown}>
        <Text style={[styles.unitPrice, { color: colors.textSecondary }]}>
          ৳{item.book.price} × {item.quantity}
        </Text>
        <Text style={[styles.totalPrice, { color: colors.primary }]}>
          ৳{item.total.toLocaleString()}
        </Text>
      </View>
    </View>
  );

  const renderBookItem = ({ item }: { item: Book }) => (
    <TouchableOpacity
      style={[styles.bookCard, { backgroundColor: colors.surface }]}
      onPress={() => addBookToOrder(item)}
    >
      <View style={styles.bookInfo}>
        <Text style={[styles.bookTitle, { color: colors.text }]} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={[styles.bookAuthor, { color: colors.textSecondary }]}>
          {item.author}
        </Text>
        <Text style={[styles.bookPrice, { color: colors.primary }]}>
          ৳{item.price}
        </Text>
      </View>
      <Feather name="plus-circle" size={24} color={colors.primary} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Build Order</Text>
          <Text style={[styles.customerName, { color: colors.textSecondary }]}>
            for {customerName}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setShowBookSearch(true)}>
          <Feather name="plus" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Order Items */}
      <FlatList
        data={orderItems}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.orderList}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="shopping-cart" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No items added</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Tap the + button to add books to this order
            </Text>
          </View>
        }
        refreshing={isRefreshing}
        onRefresh={async () => {
          try {
            setIsRefreshing(true);
            await refreshData();
          } finally {
            setIsRefreshing(false);
          }
        }}
      />

      {/* Order Summary */}
      {orderItems.length > 0 && (
        <View style={[styles.orderSummary, { backgroundColor: colors.surface }]}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.text }]}>
              Total ({orderItems.length} items)
            </Text>
            <Text style={[styles.summaryAmount, { color: colors.primary }]}>
              ৳{getTotalAmount().toLocaleString()}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={saveOrder}
          >
            <Text style={styles.saveButtonText}>Save Order</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Book Search Modal */}
      <Modal visible={showBookSearch} animationType="slide">
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Books</Text>
            <TouchableOpacity onPress={() => setShowBookSearch(false)}>
              <Feather name="x" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search books to add..."
          />

          <FlatList
            data={filteredBooks}
            renderItem={renderBookItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.bookList}
            refreshing={isRefreshing}
            onRefresh={async () => {
              try {
                setIsRefreshing(true);
                await refreshData();
              } finally {
                setIsRefreshing(false);
              }
            }}
          />
        </View>
      </Modal>

      {/* Discount Modal */}
      <Modal visible={showDiscountModal} transparent animationType="fade">
        <View style={styles.discountModalOverlay}>
          <View style={[styles.discountModalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.discountModalTitle, { color: colors.text }]}>
              Set Discount
            </Text>
            <TextInput
              style={[styles.discountInput, {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.text
              }]}
              value={discountInput}
              onChangeText={setDiscountInput}
              placeholder="Enter discount percentage"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              selectTextOnFocus
            />
            <View style={styles.discountModalButtons}>
              <TouchableOpacity
                style={[styles.discountModalButton, { backgroundColor: colors.border }]}
                onPress={() => {
                  setShowDiscountModal(false);
                  setDiscountInput('');
                  setSelectedItemIndex(null);
                }}
              >
                <Text style={[styles.discountModalButtonText, { color: colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.discountModalButton, { backgroundColor: colors.primary }]}
                onPress={handleDiscountUpdate}
              >
                <Text style={[styles.discountModalButtonText, { color: Colors.surface }]}>
                  Apply
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 48,
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  customerName: {
    fontSize: 14,
    marginTop: 2,
  },
  orderList: {
    padding: 16,
    paddingBottom: 100,
  },
  orderItemCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  serialNumber: {
    fontSize: 12,
    fontWeight: '600',
  },
  bookName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  itemControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 12,
    minWidth: 24,
    textAlign: 'center',
  },
  discountButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  discountText: {
    fontSize: 12,
    fontWeight: '600',
  },
  priceBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unitPrice: {
    fontSize: 14,
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  orderSummary: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    paddingTop: 60,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  bookList: {
    padding: 16,
  },
  bookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 14,
    marginBottom: 4,
  },
  bookPrice: {
    fontSize: 16,
    fontWeight: '600',
  },
  discountModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountModalContent: {
    width: '80%',
    padding: 24,
    borderRadius: 16,
  },
  discountModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  discountInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  discountModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  discountModalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  discountModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
